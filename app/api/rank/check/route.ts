import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { checkRank } from '@/lib/tracking'
import { jsonError, positiveIntParam, readJson } from '@/lib/api'
import { authJsonError, requireUser } from '@/lib/auth'

export const runtime = 'nodejs'

// Re-check one tracked keyword. Bulk checks are cron-only.
export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const id = positiveIntParam(body, 'id')
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }
    const result = await checkRank(id, { userId: user.id })
    return NextResponse.json(result)
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
