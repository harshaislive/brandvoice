import { NextRequest, NextResponse } from 'next/server'
import { getDb, isUniqueViolation } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { RegisterRequest, AuthResponse } from '@/types/database'

type CreatedUser = {
  id: string
  email: string
  username: string
  display_name: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, displayName }: RegisterRequest = await request.json()
    
    if (!email || !password || !username || !displayName) {
      return NextResponse.json(
        { error: 'All fields are required' }, 
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    const sql = getDb()
    let newUser: CreatedUser

    try {
      const [createdUser] = await sql<CreatedUser[]>`
        INSERT INTO public.users (
          email, username, display_name, password_hash, last_login
        ) VALUES (
          ${email.toLowerCase()},
          ${username.toLowerCase()},
          ${displayName},
          ${passwordHash},
          now()
        )
        RETURNING id, email, username, display_name
      `
      newUser = createdUser
    } catch (error) {
      if (isUniqueViolation(error)) {
        const message = error.constraint_name === 'users_username_key'
          ? 'Username already taken'
          : 'User already exists'
        return NextResponse.json({ error: message }, { status: 409 })
      }
      throw error
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
