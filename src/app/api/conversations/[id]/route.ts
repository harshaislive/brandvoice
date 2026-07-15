import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
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

    const sql = getDb()
    const deleted = await sql`
      DELETE FROM public.conversations
      WHERE id = ${conversationId} AND user_id = ${user.id}
      RETURNING id
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
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

    const sql = getDb()
    const [updatedConversation] = await sql`
      UPDATE public.conversations
      SET title = ${title.trim()}
      WHERE id = ${conversationId} AND user_id = ${user.id}
      RETURNING *
    `

    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
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
