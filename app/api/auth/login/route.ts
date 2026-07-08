import { NextResponse } from 'next/server'
import { authJsonError, createSession, loginUser, sessionCookie } from '@/lib/auth'
import { readJson, stringParam } from '@/lib/api'
import { guard } from '@/lib/guard'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  try {
    const user = await loginUser(stringParam(body, 'email'), stringParam(body, 'password'))
    const session = await createSession(user.id)
    return NextResponse.json(
      { user },
      { headers: { 'Set-Cookie': sessionCookie(session.token, session.expires) } }
    )
  } catch (e: unknown) {
    return authJsonError(e)
  }
}
