import { NextResponse } from 'next/server'
import { authJsonError, createSession, sessionCookie, signupUser } from '@/lib/auth'
import { readJson, stringParam } from '@/lib/api'
import { guard } from '@/lib/guard'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  try {
    const user = await signupUser({
      email: stringParam(body, 'email'),
      password: stringParam(body, 'password'),
      name: stringParam(body, 'name') || undefined,
    })
    const session = await createSession(user.id)
    return NextResponse.json(
      { user },
      { headers: { 'Set-Cookie': sessionCookie(session.token, session.expires) } }
    )
  } catch (e: unknown) {
    return authJsonError(e)
  }
}
