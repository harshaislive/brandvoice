import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch conversations' }, 
      { status: 500 }
    )
  }
}

// Create new conversation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { title, mode = 'chat' } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      )
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        mode,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create conversation' }, 
      { status: 500 }
    )
  }
}