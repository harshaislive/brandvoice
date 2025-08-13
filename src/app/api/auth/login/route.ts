import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, generateToken } from '@/lib/auth'
import { LoginRequest, AuthResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      )
    }

    // Authenticate user against existing Supabase users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      )
    }
    
    // Verify password against existing hash
    const isValid = await verifyPassword(password, user.password_hash)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      )
    }
    
    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
    
    // Generate JWT token
    const token = await generateToken({ id: user.id, email: user.email })
    
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name
      },
      token
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    )
  }
}