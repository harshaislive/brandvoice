import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasValidSettingsPasscode } from '@/lib/settings-access'

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    if (!hasValidSettingsPasscode(request)) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Access verification failed' }, { status: 500 })
  }
}
