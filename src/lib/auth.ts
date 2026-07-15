import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { NextRequest } from 'next/server'
import { getDb } from './db'
import { User } from '@/types/database'

function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET_KEY

  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET_KEY must contain at least 32 characters')
  }

  return new TextEncoder().encode(value)
}

// JWT token verification
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const secret = getJwtSecret()
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
    const sql = getDb()
    const [user] = await sql<User[]>`
      SELECT *
      FROM public.users
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (!user) {
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
  const secret = getJwtSecret()
  
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
