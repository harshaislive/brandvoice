import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Submit feedback for a transformation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transformationId } = await params
    const { feedback } = await request.json()
    
    if (!feedback || feedback < 1 || feedback > 5) {
      return NextResponse.json(
        { error: 'Feedback must be a number between 1 and 5' }, 
        { status: 400 }
      )
    }

    // Update the transformation with user feedback
    const { data: transformation, error } = await supabase
      .from('beforest_transformations')
      .update({ 
        user_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', transformationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating feedback:', error)
      return NextResponse.json(
        { error: 'Failed to update feedback' }, 
        { status: 500 }
      )
    }

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
    
    return NextResponse.json(
      { error: 'Failed to submit feedback' }, 
      { status: 500 }
    )
  }
}