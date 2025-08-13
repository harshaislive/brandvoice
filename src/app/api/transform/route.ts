import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
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
    const userIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null
    const sessionId = request.headers.get('x-session-id') || null

    // Build transformation prompt based on content type and audience
    const systemPrompt = `You are the Beforest Brand Voice Curator, an expert AI assistant specialized in transforming content to match the authentic, warm, and premium brand voice of Beforest.

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

    let transformationPrompt = ''
    
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
    const { data: transformation, error: saveError } = await supabase
      .from('beforest_transformations')
      .insert({
        original_content,
        content_type,
        target_audience,
        additional_context,
        transformed_content,
        original_length: originalLength,
        transformed_length: transformedLength,
        length_change_percent: Math.round(lengthChangePercent * 100) / 100,
        justification,
        user_ip: userIP,
        user_agent: userAgent,
        session_id: sessionId,
        processing_time_ms: processingTime,
        api_model_used: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        transformation_quality_score: qualityScore,
        user_email: user.email,
        user_id: user.id
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving transformation:', saveError)
      // Continue even if save fails
    }

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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const contentType = searchParams.get('content_type')
    const targetAudience = searchParams.get('target_audience')
    
    console.log('History API - User ID:', user.id)
    console.log('History API - Query params:', { limit, offset, contentType, targetAudience })
    
    let query = supabase
      .from('beforest_transformations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contentType) {
      query = query.eq('content_type', contentType)
    }
    
    if (targetAudience) {
      query = query.eq('target_audience', targetAudience)
    }

    console.log('History API - Executing query...')
    const { data: transformations, error } = await query

    if (error) {
      console.error('History API - Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transformations' }, 
        { status: 500 }
      )
    }

    // Get total count for this user (for debugging)
    const { count } = await supabase
      .from('beforest_transformations')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    console.log('History API - Found transformations:', transformations?.length || 0)
    console.log('History API - Total records for user:', count)
    console.log('History API - Sample record dates:', transformations?.map(t => t.created_at).slice(0, 3))

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