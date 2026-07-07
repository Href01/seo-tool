import { NextResponse } from 'next/server'
import { checkRank, checkAll } from '@/lib/tracking'

export const runtime = 'nodejs'

// Re-check a single tracked keyword ({ id }) or all of them (no body).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  try {
    if (body.id) {
      const position = await checkRank(Number(body.id))
      return NextResponse.json({ position })
    }
    await checkAll()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
