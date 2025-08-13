import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { NextRequest } from 'next/server'
import { supabase } from './supabase'
import { User } from '@/types/database'

// JWT token verification
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; email: string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Extract user from request token
export async function getUserFromToken(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded) {
      return null
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Get user from token failed:', error)
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password against existing hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate JWT token
export async function generateToken(user: { id: string; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY!)
  
  return await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

// Middleware helper for protected routes
export async function requireAuth(request: NextRequest) {
  const user = await getUserFromToken(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}