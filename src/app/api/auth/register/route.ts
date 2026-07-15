import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Registration is disabled. Ask a Beforest administrator to create your account.' },
    { status: 403 }
  )
}
