import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { LoginRequest, AuthResponse } from '@/types/database'
import type { User } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      )
    }

    const sql = getDb()
    const [user] = await sql<User[]>`
      SELECT *
      FROM public.users
      WHERE email = ${email.toLowerCase()} AND is_active = true
      LIMIT 1
    `
    
    if (!user) {
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
    await sql`
      UPDATE public.users
      SET last_login = now()
      WHERE id = ${user.id}
    `
    
    // Generate JWT token
    const token = await generateToken({ id: user.id, email: user.email })
    
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        role: user.role
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
