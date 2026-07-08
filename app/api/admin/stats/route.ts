import { NextResponse } from 'next/server'
import { bankCount } from '@/lib/bank'
import { getPool, ready } from '@/lib/db'
import { guard } from '@/lib/guard'
import { jsonError } from '@/lib/api'
import { authJsonError, requireAdmin } from '@/lib/auth'
import { usageDashboard } from '@/lib/usage'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    await requireAdmin(req)
    const p = getPool()
    if (!p) {
      return NextResponse.json({
        bankCount: 0,
        usersCount: 0,
        projectsCount: 0,
        usage: await usageDashboard(),
      })
    }
    await ready()
    const [bank, users, projects, usage] = await Promise.all([
      bankCount(),
      p.query<{ n: number }>('SELECT count(*)::int AS n FROM users').then((r) => r.rows[0]?.n ?? 0),
      p.query<{ n: number }>('SELECT count(*)::int AS n FROM projects').then((r) => r.rows[0]?.n ?? 0),
      usageDashboard(),
    ])
    return NextResponse.json({
      bankCount: bank,
      usersCount: users,
      projectsCount: projects,
      usage,
    })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
