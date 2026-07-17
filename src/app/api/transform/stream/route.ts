import { after, NextRequest, NextResponse } from 'next/server'
import { createChatCompletion, createStreamingChatCompletion } from '@/lib/openai'
import { getDb } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { CANONICAL_BRAND_PROMPTS, parseJustification, renderBrandPrompt, type BrandPromptSet } from '@/lib/brand-prompts'
import type { TransformRequest, TransformResponse } from '@/types/database'

type PostTransformJob = {
  transformationId: string
  prompts: BrandPromptSet
  promptVariables: {
    original_content: string
    transformed_content: string
    content_type: string
    target_audience: string
    additional_context?: string
  }
}

function getPublicTransformError(error: unknown) {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number(error.status)
    : 0
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (status === 429) return 'The AI service is busy right now. Please retry in a moment.'
  if (status === 401 || status === 403) return 'The AI service needs its access settings refreshed. Please contact an administrator.'
  if (status >= 500 || message.includes('timeout') || message.includes('network')) {
    return 'The AI service is temporarily unavailable. Your draft is safe—please try again.'
  }
  if (message.includes('empty transformation')) {
    return 'The AI returned no text. Your draft is safe—please try again.'
  }
  return 'The transformation could not be completed. Your draft is safe—please try again.'
}

let promptCache: { value: BrandPromptSet; expiresAt: number } | null = null

async function loadPrompts(sql: ReturnType<typeof getDb>) {
  if (promptCache && promptCache.expiresAt > Date.now()) return promptCache.value

  try {
    const [settings] = await sql<Array<{ setting_value: Record<string, string> | string }>>`
      SELECT setting_value
      FROM public.beforest_settings
      WHERE setting_key = 'prompts'
      LIMIT 1
    `

    if (!settings) return CANONICAL_BRAND_PROMPTS
    const promptData = typeof settings.setting_value === 'string'
      ? JSON.parse(settings.setting_value) as Record<string, string>
      : settings.setting_value
    const value = {
      main: promptData.main || CANONICAL_BRAND_PROMPTS.main,
      transform: promptData.transform || CANONICAL_BRAND_PROMPTS.transform,
      justification: promptData.justification || CANONICAL_BRAND_PROMPTS.justification,
    }
    promptCache = { value, expiresAt: Date.now() + 5 * 60_000 }
    return value
  } catch (error) {
    console.error('Could not load cached prompts:', error)
    return CANONICAL_BRAND_PROMPTS
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const user = await getUserFromToken(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const {
    original_content,
    content_type,
    target_audience,
    additional_context,
  }: TransformRequest = await request.json()

  if (!original_content || !content_type || !target_audience) {
    return NextResponse.json(
      { error: 'Original content, content type, and target audience are required' },
      { status: 400 },
    )
  }

  const sql = getDb()
  const prompts = await loadPrompts(sql)
  const promptVariables = { original_content, content_type, target_audience, additional_context }
  let transformPrompt = renderBrandPrompt(prompts.transform, promptVariables)
  if (!transformPrompt.includes(original_content)) transformPrompt += `\n\nOriginal content:\n${original_content}`

  let resolvePostJob: (job: PostTransformJob | null) => void = () => undefined
  const postJob = new Promise<PostTransformJob | null>((resolve) => {
    resolvePostJob = resolve
  })

  after(async () => {
    const job = await postJob
    if (!job?.transformationId) return

    try {
      const rawJustification = await createChatCompletion({
        messages: [
          { role: 'system', content: 'You are a strict brand editor. Return valid JSON only, with no Markdown or surrounding commentary.' },
          { role: 'user', content: renderBrandPrompt(job.prompts.justification, job.promptVariables) },
        ],
        maxTokens: 1200,
      })
      const analysis = parseJustification(rawJustification)
      await sql`
        UPDATE public.beforest_transformations
        SET justification = ${sql.json({
          ...analysis,
          content_type,
          target_audience,
          original_length: original_content.length,
          transformed_length: job.promptVariables.transformed_content.length,
          transformation_type: content_type,
        })},
        transformation_quality_score = ${analysis.quality_score}
        WHERE id = ${job.transformationId} AND user_id = ${user.id}
      `
    } catch (error) {
      console.error('Background transformation analysis failed:', error)
    }
  })

  const encoder = new TextEncoder()
  const send = (controller: ReadableStreamDefaultController<Uint8Array>, data: Record<string, unknown>) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        send(controller, { type: 'status', phase: 'reading' })
        const maxTokens = Math.min(3500, Math.max(1000, Math.ceil(original_content.length / 2)))
        const aiStream = await createStreamingChatCompletion({
          messages: [
            { role: 'system', content: prompts.main },
            { role: 'user', content: transformPrompt },
          ],
          maxTokens,
        })

        let transformedContent = ''
        let sentFirstChunk = false

        for await (const chunk of aiStream) {
          if (request.signal.aborted) throw new DOMException('Client disconnected', 'AbortError')
          const content = chunk.choices[0]?.delta?.content || ''
          if (!content) continue
          if (!sentFirstChunk) {
            sentFirstChunk = true
            send(controller, { type: 'status', phase: 'shaping' })
          }
          transformedContent += content
          send(controller, { type: 'content', content })
        }

        if (!transformedContent.trim()) {
          const fallbackContent = await createChatCompletion({
            messages: [
              { role: 'system', content: prompts.main },
              { role: 'user', content: transformPrompt },
            ],
            maxTokens,
          })
          if (!fallbackContent.trim()) throw new Error('The model returned an empty transformation')
          transformedContent = fallbackContent
          send(controller, { type: 'status', phase: 'shaping' })
          send(controller, { type: 'content', content: fallbackContent })
        }
        send(controller, { type: 'status', phase: 'finalizing' })

        const originalLength = original_content.length
        const transformedLength = transformedContent.length
        const lengthChangePercent = originalLength
          ? Math.round((((transformedLength - originalLength) / originalLength) * 100) * 100) / 100
          : 0
        const processingTime = Date.now() - startedAt
        const placeholderJustification = {
          brand_elements_applied: [],
          audience_optimization: `Written for ${target_audience}`,
          tone_adjustments: [],
          quality_score: 3,
          analysis_status: 'processing',
        }

        let transformationId = ''
        try {
          const forwardedFor = request.headers.get('x-forwarded-for')
          const userIP = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
          const [transformation] = await sql`
            INSERT INTO public.beforest_transformations (
              original_content, content_type, target_audience, additional_context,
              transformed_content, original_length, transformed_length, length_change_percent,
              justification, user_ip, user_agent, session_id, processing_time_ms,
              api_model_used, transformation_quality_score, user_email, user_id
            ) VALUES (
              ${original_content}, ${content_type}, ${target_audience}, ${additional_context || null},
              ${transformedContent}, ${originalLength}, ${transformedLength}, ${lengthChangePercent},
              ${sql.json(placeholderJustification)}, ${userIP}, ${request.headers.get('user-agent') || null},
              ${request.headers.get('x-session-id') || null}, ${processingTime},
              ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'}, 3, ${user.email}, ${user.id}
            )
            RETURNING id
          `
          transformationId = transformation?.id || ''
        } catch (error) {
          console.error('Transformation completed but could not be saved:', error)
        }

        const result: TransformResponse = {
          transformed_content: transformedContent,
          transformation_id: transformationId,
          original_length: originalLength,
          transformed_length: transformedLength,
          length_change_percent: lengthChangePercent,
          processing_time_ms: processingTime,
          quality_score: 3,
          justification: placeholderJustification,
        }
        send(controller, { type: 'complete', result, saved: Boolean(transformationId) })
        resolvePostJob(transformationId ? {
          transformationId,
          prompts,
          promptVariables: { ...promptVariables, transformed_content: transformedContent },
        } : null)
      } catch (error) {
        resolvePostJob(null)
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Streaming transformation failed:', error)
          send(controller, { type: 'error', error: getPublicTransformError(error) })
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
