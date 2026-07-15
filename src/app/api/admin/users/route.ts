import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getDb, isUniqueViolation } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const sql = getDb()
    const users = await sql`
      SELECT id, email, username, display_name, role, is_active, created_at, last_login
      FROM public.users
      ORDER BY created_at DESC
    `
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Forbidden' ? 'Admin access required' : 'Failed to load users' },
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const { email, password, username, displayName } = await request.json()

    if (!email || !password || !username || !displayName) {
      return NextResponse.json({ error: 'Email, username, display name, and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const sql = getDb()
    const passwordHash = await bcrypt.hash(password, 12)
    const [user] = await sql`
      INSERT INTO public.users (email, username, display_name, password_hash, role)
      VALUES (${email.toLowerCase().trim()}, ${username.toLowerCase().trim()}, ${displayName.trim()}, ${passwordHash}, 'user')
      RETURNING id, email, username, display_name, role, is_active, created_at, last_login
    `
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Forbidden' ? 'Admin access required' : 'Failed to create user' },
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const { id, isActive } = await request.json()

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'User id and isActive are required' }, { status: 400 })
    }
    if (id === admin.id && !isActive) {
      return NextResponse.json({ error: 'You cannot deactivate your own admin account' }, { status: 400 })
    }

    const sql = getDb()
    const [user] = await sql`
      UPDATE public.users
      SET is_active = ${isActive}
      WHERE id = ${id}
      RETURNING id, email, username, display_name, role, is_active, created_at, last_login
    `
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Forbidden' ? 'Admin access required' : 'Failed to update user' },
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}
