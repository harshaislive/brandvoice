import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/openai'
import { getDb } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { TransformRequest, TransformResponse } from '@/types/database'

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

    // Load system prompts from database
    let systemPrompt = ''
    let transformationPrompt = ''
    
    // Default prompts as fallback
    const defaultSystemPrompt = `You are the Beforest Brand Voice Curator, an expert AI assistant specialized in transforming content to match the authentic, warm, and premium brand voice of Beforest.

Your role is to transform content while:
- Maintaining the original meaning and intent
- Applying Beforest's brand voice characteristics
- Optimizing for the target audience
- Ensuring authenticity and warmth

Beforest brand characteristics:
- Authentic and genuine tone
- Warm and approachable language
- Premium quality without pretension
- Expert yet accessible
- Nature-inspired and sustainable focus
- Environmentally conscious messaging`
    
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
        console.warn('Could not load prompts from database, using defaults')
        systemPrompt = defaultSystemPrompt
      } else {
        // Parse prompts from database
        const promptsData: Record<string, string> = typeof settings.setting_value === 'string'
          ? JSON.parse(settings.setting_value)
          : settings.setting_value
        
        systemPrompt = promptsData.main || defaultSystemPrompt
        
        // Also load transformation prompt if available
        if (promptsData.transform) {
          transformationPrompt = promptsData.transform
            .replace('{target_audience}', target_audience)
            .replace('{content_type}', content_type)
        }
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
      systemPrompt = defaultSystemPrompt
    }
    
    // Fallback to default prompts if database prompt not available
    if (!transformationPrompt) {
      switch (content_type) {
        case 'marketing':
          transformationPrompt = `Transform this content into compelling marketing copy for ${target_audience}:`
          break
        case 'email':
          transformationPrompt = `Transform this content into a professional email for ${target_audience}:`
          break
        case 'social':
          transformationPrompt = `Transform this content for social media targeting ${target_audience}:`
          break
        case 'blog':
          transformationPrompt = `Transform this content into engaging blog content for ${target_audience}:`
          break
        case 'website':
          transformationPrompt = `Transform this content for website copy targeting ${target_audience}:`
          break
        case 'product':
          transformationPrompt = `Transform this content into compelling product descriptions for ${target_audience}:`
          break
        default:
          transformationPrompt = `Transform this content to match Beforest's brand voice for ${target_audience}:`
      }
    }

    const fullPrompt = `${transformationPrompt}

Original content: "${original_content}"

${additional_context ? `Additional context: ${additional_context}` : ''}

Please transform this content to perfectly embody Beforest's brand voice while being optimized for the target audience. Maintain the core message but enhance the brand alignment.`

    // Generate transformation
    const transformed_content = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ],
      maxTokens: 2000
    })

    const processingTime = Date.now() - startTime
    const originalLength = original_content.length
    const transformedLength = transformed_content.length
    const lengthChangePercent = ((transformedLength - originalLength) / originalLength) * 100

    // Calculate a simple quality score based on transformation metrics
    const qualityScore = calculateQualityScore(
      originalLength,
      transformedLength,
      lengthChangePercent,
      content_type
    )

    // Generate justification for the transformation
    const justification = {
      content_type,
      target_audience,
      original_length: originalLength,
      transformed_length: transformedLength,
      length_change_percent: Math.round(lengthChangePercent * 100) / 100,
      processing_time_ms: processingTime,
      brand_elements_applied: [
        'authentic_tone',
        'warm_language',
        'premium_positioning',
        'accessibility',
        'sustainability_focus'
      ],
      audience_optimization: `Optimized for ${target_audience}`,
      transformation_type: content_type
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

// Helper function to calculate quality score
function calculateQualityScore(
  originalLength: number,
  transformedLength: number,
  lengthChangePercent: number,
  contentType: string
): number {
  let score = 3.0 // Base score
  
  // Length optimization scoring
  if (Math.abs(lengthChangePercent) < 20) {
    score += 0.5 // Good length preservation
  } else if (Math.abs(lengthChangePercent) > 50) {
    score -= 0.3 // Significant length change
  }
  
  // Content type specific scoring
  switch (contentType) {
    case 'social':
      if (transformedLength <= 280) score += 0.3 // Twitter optimized
      break
    case 'email':
      if (transformedLength > originalLength * 0.8) score += 0.2 // Good detail retention
      break
    case 'marketing':
      if (transformedLength > originalLength) score += 0.2 // Enhanced for marketing
      break
  }
  
  // Ensure score is within bounds
  return Math.max(1.0, Math.min(5.0, Math.round(score * 100) / 100))
}
