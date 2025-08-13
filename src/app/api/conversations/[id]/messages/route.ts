import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: conversationId } = await params
    
    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' }, 
        { status: 404 }
      )
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' }, 
        { status: 500 }
      )
    }

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