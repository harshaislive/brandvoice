import { NextRequest, NextResponse } from 'next/server'
import { createStreamingChatCompletion } from '@/lib/openai'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { ChatRequest } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request)
    
    const { message, conversationId, context, enableWebSearch, userLocation }: ChatRequest & { 
      enableWebSearch?: boolean
      userLocation?: { country?: string, city?: string, region?: string }
    } = await request.json()
    
    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversation ID are required' }, 
        { status: 400 }
      )
    }

    const sql = getDb()
    const [conversation] = await sql`
      SELECT id
      FROM public.conversations
      WHERE id = ${conversationId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' }, 
        { status: 404 }
      )
    }

    await sql`
      INSERT INTO public.messages (conversation_id, role, content, metadata)
      VALUES (
        ${conversationId},
        'user',
        ${message},
        ${context ? sql.json(JSON.parse(JSON.stringify(context))) : null}
      )
    `

    // Get conversation history (last 20 messages for context)
    const messages = await sql<Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>>`
      SELECT role, content
      FROM (
        SELECT role, content, timestamp
        FROM public.messages
        WHERE conversation_id = ${conversationId}
        ORDER BY timestamp DESC
        LIMIT 20
      ) recent_messages
      ORDER BY timestamp ASC
    `

    // Build chat completion request
    const systemPrompt = `You are an intelligent assistant powered by GPT-5. You are helpful, accurate, and engaging. 

When users ask about brand voice or content transformation, you can help with the Beforest brand voice which is:
- Authentic and genuine
- Warm and approachable  
- Premium but not pretentious
- Expert yet accessible
- Nature-inspired and sustainable

For general questions, answer naturally and helpfully. Always respond directly to what the user is asking.`

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]
    
    // console.log('Chat messages being sent to AI:', JSON.stringify(chatMessages, null, 2))

    // Create a streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate streaming AI response with optional web search
          const streamResponse = await createStreamingChatCompletion({
            messages: chatMessages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
            maxTokens: 1500,
            enableWebSearch: enableWebSearch || false,
            userLocation
          })

          let fullContent = ''
          
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || ''
            const toolCalls = chunk.choices[0]?.delta?.tool_calls
            
            if (content) {
              fullContent += content
              
              // Send content chunk as-is - simple and fast
              const data = JSON.stringify({ 
                type: 'content', 
                content,
                conversationId 
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
            
            // Handle tool calls (web search)
            if (toolCalls) {
              for (const toolCall of toolCalls) {
                if (toolCall.function?.name === 'web_search_preview') {
                  // Send web search status to client
                  const searchData = JSON.stringify({
                    type: 'web_search',
                    status: 'searching',
                    query: toolCall.function?.arguments,
                    conversationId
                  })
                  controller.enqueue(encoder.encode(`data: ${searchData}\n\n`))
                }
              }
            }
            
            // Handle tool call results
            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              const toolResultData = JSON.stringify({
                type: 'web_search',
                status: 'completed',
                conversationId
              })
              controller.enqueue(encoder.encode(`data: ${toolResultData}\n\n`))
            }
          }

          // Save the complete assistant message
          const [assistantMessage] = await sql`
            INSERT INTO public.messages (conversation_id, role, content)
            VALUES (${conversationId}, 'assistant', ${fullContent})
            RETURNING id
          `

          await sql`
            UPDATE public.conversations
            SET last_activity = now()
            WHERE id = ${conversationId} AND user_id = ${user.id}
          `

          // Send completion message
          const completionData = JSON.stringify({ 
            type: 'complete',
            messageId: assistantMessage?.id || '',
            conversationId
          })
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`))
          
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({ 
            type: 'error',
            error: 'Failed to generate response'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Chat failed' }, 
      { status: 500 }
    )
  }
}
