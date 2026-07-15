import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const sql = getDb()
    const conversations = await sql`
      SELECT *
      FROM public.conversations
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

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

    if (mode !== 'chat' && mode !== 'transform') {
      return NextResponse.json({ error: 'Invalid conversation mode' }, { status: 400 })
    }

    const sql = getDb()
    const [conversation] = await sql`
      INSERT INTO public.conversations (user_id, title, mode)
      VALUES (${user.id}, ${title}, ${mode})
      RETURNING *
    `

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
