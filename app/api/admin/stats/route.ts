import { NextResponse } from 'next/server'
import { bankCount } from '@/lib/bank'
import { getPool, ready } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const p = getPool()
    if (!p) {
      return NextResponse.json({ bankCount: 0, usersCount: 0, projectsCount: 0 })
    }
    await ready()
    const [bank, users, projects] = await Promise.all([
      bankCount(),
      p.query('SELECT count(*)::int AS n FROM users').then((r) => r.rows[0]?.n ?? 0),
      p.query('SELECT count(*)::int AS n FROM projects').then((r) => r.rows[0]?.n ?? 0),
    ])
    return NextResponse.json({
      bankCount: bank,
      usersCount: users,
      projectsCount: projects,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
