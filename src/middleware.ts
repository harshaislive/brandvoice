import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that require authentication
const protectedRoutes = ['/chat', '/history', '/analytics', '/settings']

// Routes that should redirect to home if user is logged in
const authRoutes = ['/auth/login', '/auth/register']

// Simple JWT verification for middleware (Edge Runtime compatible)
async function verifyJWT(token: string): Promise<boolean> {
  try {
    if (!process.env.JWT_SECRET_KEY) return false
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes - they handle auth themselves
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Check if user is authenticated
  let isAuthenticated = false
  if (token) {
    isAuthenticated = await verifyJWT(token)
  }

  // Handle auth routes - redirect to home if already logged in
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes - redirect to login if not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Disable middleware for now - components handle auth with localStorage
    '/middleware-disabled-for-localstorage-auth',
  ],
}