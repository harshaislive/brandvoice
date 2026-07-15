import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/openai'
import { getDb } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { TransformRequest, TransformResponse } from '@/types/database'
import { CANONICAL_BRAND_PROMPTS, parseJustification, renderBrandPrompt, type BrandPromptSet } from '@/lib/brand-prompts'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const { 
      original_content, 
      content_type, 
      target_audience, 
      additional_context 
    }: TransformRequest = await request.json()
    
    if (!original_content || !content_type || !target_audience) {
      return NextResponse.json(
        { error: 'Original content, content type, and target audience are required' }, 
        { status: 400 }
      )
    }

    // Get request metadata
    const forwardedFor = request.headers.get('x-forwarded-for')
    const userIP = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null
    const sessionId = request.headers.get('x-session-id') || null

    let prompts: BrandPromptSet = CANONICAL_BRAND_PROMPTS
    
    try {
      const sql = getDb()
      const [settings] = await sql<Array<{
        setting_value: Record<string, string> | string
      }>>`
        SELECT setting_value
        FROM public.beforest_settings
        WHERE setting_key = 'prompts'
        LIMIT 1
      `

      if (!settings) {
        console.warn('Could not load prompts from database, using canonical defaults')
      } else {
        const promptsData: Record<string, string> = typeof settings.setting_value === 'string'
          ? JSON.parse(settings.setting_value)
          : settings.setting_value

        prompts = {
          main: promptsData.main || CANONICAL_BRAND_PROMPTS.main,
          transform: promptsData.transform || CANONICAL_BRAND_PROMPTS.transform,
          justification: promptsData.justification || CANONICAL_BRAND_PROMPTS.justification,
        }
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
    }

    const promptVariables = {
      original_content,
      content_type,
      target_audience,
      additional_context,
    }
    let fullPrompt = renderBrandPrompt(prompts.transform, promptVariables)

    // Keep older custom prompt templates safe even if they omit the content variable.
    if (!fullPrompt.includes(original_content)) {
      fullPrompt += `\n\nOriginal content:\n${original_content}`
    }

    // Generate transformation
    const transformed_content = await createChatCompletion({
      messages: [
        { role: 'system', content: prompts.main },
        { role: 'user', content: fullPrompt }
      ],
      // Kimi-K2.6 counts hidden reasoning and visible text in the same budget.
      maxTokens: 8000
    })

    const processingTime = Date.now() - startTime
    const originalLength = original_content.length
    const transformedLength = transformed_content.length
    const lengthChangePercent = ((transformedLength - originalLength) / originalLength) * 100

    let justificationAnalysis
    try {
      const justificationPrompt = renderBrandPrompt(prompts.justification, {
        ...promptVariables,
        transformed_content,
      })
      const rawJustification = await createChatCompletion({
        messages: [
          { role: 'system', content: 'You are a strict brand editor. Return valid JSON only, with no Markdown or surrounding commentary.' },
          { role: 'user', content: justificationPrompt },
        ],
        maxTokens: 4000,
      })
      justificationAnalysis = parseJustification(rawJustification)
    } catch (error) {
      console.error('Could not generate structured justification:', error)
      justificationAnalysis = {
        brand_elements_applied: [],
        audience_optimization: `Written for ${target_audience}`,
        tone_adjustments: [],
        quality_score: 3,
      }
    }

    const qualityScore = justificationAnalysis.quality_score
    const justification = {
      ...justificationAnalysis,
      content_type,
      target_audience,
      original_length: originalLength,
      transformed_length: transformedLength,
      length_change_percent: Math.round(lengthChangePercent * 100) / 100,
      processing_time_ms: processingTime,
      transformation_type: content_type,
    }

    // Save transformation to database
    const sql = getDb()
    const [transformation] = await sql`
      INSERT INTO public.beforest_transformations (
        original_content,
        content_type,
        target_audience,
        additional_context,
        transformed_content,
        original_length,
        transformed_length,
        length_change_percent,
        justification,
        user_ip,
        user_agent,
        session_id,
        processing_time_ms,
        api_model_used,
        transformation_quality_score,
        user_email,
        user_id
      ) VALUES (
        ${original_content},
        ${content_type},
        ${target_audience},
        ${additional_context || null},
        ${transformed_content},
        ${originalLength},
        ${transformedLength},
        ${Math.round(lengthChangePercent * 100) / 100},
        ${sql.json(justification)},
        ${userIP},
        ${userAgent},
        ${sessionId},
        ${processingTime},
        ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'},
        ${qualityScore},
        ${user.email},
        ${user.id}
      )
      RETURNING id
    `

    const response: TransformResponse = {
      transformed_content,
      transformation_id: transformation?.id || '',
      original_length: originalLength,
      transformed_length: transformedLength,
      length_change_percent: Math.round(lengthChangePercent * 100) / 100,
      processing_time_ms: processingTime,
      quality_score: qualityScore,
      justification
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Transform error:', error)
    
    return NextResponse.json(
      { 
        error: 'Transformation failed',
        processing_time_ms: Date.now() - startTime
      }, 
      { status: 500 }
    )
  }
}
// Get transformation history
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)
    const contentType = searchParams.get('content_type')
    const targetAudience = searchParams.get('target_audience')
    
    console.log('History API - User ID:', user.id)
    console.log('History API - Query params:', { limit, offset, contentType, targetAudience })
    
    const sql = getDb()
    const contentTypeFilter = contentType ? sql`AND content_type = ${contentType}` : sql``
    const audienceFilter = targetAudience ? sql`AND target_audience = ${targetAudience}` : sql``

    const transformations = await sql`
      SELECT *
      FROM public.beforest_transformations
      WHERE user_id = ${user.id}
        ${contentTypeFilter}
        ${audienceFilter}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [countRow] = await sql<{ count: number }[]>`
      SELECT count(*)::integer AS count
      FROM public.beforest_transformations
      WHERE user_id = ${user.id}
        ${contentTypeFilter}
        ${audienceFilter}
    `
    const count = countRow?.count || 0

    console.log('History API - Found transformations:', transformations.length)
    console.log('History API - Total records for user:', count)
    console.log('History API - Sample record dates:', transformations.map(t => t.created_at).slice(0, 3))

    return NextResponse.json({ transformations, total_count: count })
  } catch (error) {
    console.error('Get transformations error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch transformations' }, 
      { status: 500 }
    )
  }
}
