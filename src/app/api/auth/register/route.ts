import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, generateToken } from '@/lib/auth'
import { RegisterRequest, AuthResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName }: RegisterRequest = await request.json()
    
    if (!email || !password || !username || !displayName) {
      return NextResponse.json(
        { error: 'All fields are required' }, 
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' }, 
        { status: 409 }
      )
    }

    // Check if username is taken
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()
    
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' }, 
        { status: 409 }
      )
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        display_name: displayName,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true
      })
      .select('id, email, username, display_name')
      .single()
    
    if (error || !newUser) {
      console.error('User creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create user' }, 
        { status: 500 }
      )
    }
    
    // Generate JWT token
    const token = await generateToken({ id: newUser.id, email: newUser.email })
    
    const response: AuthResponse = {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.display_name
      },
      token
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' }, 
      { status: 500 }
    )
  }
}