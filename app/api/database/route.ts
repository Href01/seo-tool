import { NextResponse } from 'next/server'
import { listBank, bankCount } from '@/lib/bank'
import { guard } from '@/lib/guard'
import { jsonError } from '@/lib/api'
import { authJsonError, requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const search = new URL(req.url).searchParams.get('search') ?? ''
  try {
    await requireAdmin(req)
    const [items, count] = await Promise.all([listBank({ search }), bankCount()])
    return NextResponse.json({ count, items })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
