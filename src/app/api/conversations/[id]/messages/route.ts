import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: conversationId } = await params
    
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

    const messages = await sql`
      SELECT *
      FROM public.messages
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp ASC
    `

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch messages' }, 
      { status: 500 }
    )
  }
}
