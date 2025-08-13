import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/openai'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get authenticated user
    await requireAuth(request)
    
    const { 
      original_content, 
      content_type, 
      target_audience,
      additional_context,
      system_prompt,
      transform_prompt
    } = await request.json()
    
    if (!original_content || !content_type || !target_audience) {
      return NextResponse.json(
        { error: 'Original content, content type, and target audience are required' }, 
        { status: 400 }
      )
    }

    if (!system_prompt || !transform_prompt) {
      return NextResponse.json(
        { error: 'System prompt and transform prompt are required for testing' }, 
        { status: 400 }
      )
    }

    // Use the custom prompts provided from settings
    const fullTransformPrompt = transform_prompt
      .replace('{original_content}', original_content)
      .replace('{content_type}', content_type)
      .replace('{target_audience}', target_audience)
      .replace('{additional_context}', additional_context || '')

    // Generate transformation using the custom prompts
    const transformed_content = await createChatCompletion({
      messages: [
        { role: 'system', content: system_prompt },
        { role: 'user', content: fullTransformPrompt }
      ],
      maxTokens: 2000
    })

    const processingTime = Date.now() - startTime
    const originalLength = original_content.length
    const transformedLength = transformed_content.length
    const lengthChangePercent = ((transformedLength - originalLength) / originalLength) * 100

    const response = {
      transformed_content,
      original_length: originalLength,
      transformed_length: transformedLength,
      length_change_percent: Math.round(lengthChangePercent * 100) / 100,
      processing_time_ms: processingTime,
      test_mode: true
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Test prompts error:', error)
    
    return NextResponse.json(
      { 
        error: 'Prompt testing failed',
        processing_time_ms: Date.now() - startTime
      }, 
      { status: 500 }
    )
  }
}