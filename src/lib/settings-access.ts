import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export function hasValidSettingsPasscode(request: NextRequest): boolean {
  const expected = process.env.SETTINGS_PASSCODE
  const provided = request.headers.get('x-settings-passcode')

  if (!expected || !provided) {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer)
}
