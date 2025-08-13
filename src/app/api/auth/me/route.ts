import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' }, 
      { status: 500 }
    )
  }
}