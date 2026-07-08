import { NextResponse } from 'next/server'
import { clearSessionCookie, destroySession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  await destroySession(req)
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookie() } }
  )
}
