import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Delete conversation
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const params = await context.params
    const conversationId = params.id

    // First check if the conversation belongs to the user
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' }, 
        { status: 404 }
      )
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Delete the conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversation' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete conversation' }, 
      { status: 500 }
    )
  }
}

// Update conversation
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const params = await context.params
    const conversationId = params.id
    const { title } = await request.json()

    console.log('PUT /api/conversations/[id] - User:', user.email, 'ConversationId:', conversationId, 'Title:', title)

    if (!title || typeof title !== 'string' || !title.trim()) {
      console.log('PUT /api/conversations/[id] - Invalid title:', title)
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' }, 
        { status: 400 }
      )
    }

    // First check if the conversation belongs to the user
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' }, 
        { status: 404 }
      )
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Update the conversation - let the database trigger handle timestamp
    const { data: updatedConversation, error } = await supabase
      .from('conversations')
      .update({
        title: title.trim()
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to update conversation', details: error.message }, 
        { status: 500 }
      )
    }

    console.log('PUT /api/conversations/[id] - Success:', updatedConversation)
    return NextResponse.json(updatedConversation)
  } catch (error) {
    console.error('Update conversation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update conversation' }, 
      { status: 500 }
    )
  }
}