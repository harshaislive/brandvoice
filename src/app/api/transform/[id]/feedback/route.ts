import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Submit feedback for a transformation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: transformationId } = await params
    const { feedback } = await request.json()
    
    if (!feedback || feedback < 1 || feedback > 5) {
      return NextResponse.json(
        { error: 'Feedback must be a number between 1 and 5' }, 
        { status: 400 }
      )
    }

    const sql = getDb()
    const [transformation] = await sql`
      UPDATE public.beforest_transformations
      SET user_feedback = ${feedback}
      WHERE id = ${transformationId} AND user_id = ${user.id}
      RETURNING id
    `

    if (!transformation) {
      return NextResponse.json(
        { error: 'Transformation not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Feedback updated successfully',
      transformation_id: transformationId,
      feedback
    })
  } catch (error) {
    console.error('Feedback error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to submit feedback' }, 
      { status: 500 }
    )
  }
}
