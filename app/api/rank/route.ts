import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { addTracking, listTracking, deleteTracking, checkRank } from '@/lib/tracking'
import { cleanDomain, LOCATION_MOROCCO } from '@/lib/dataforseo'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const items = await listTracking()
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const domain = cleanDomain(body.domain || '')

  if (!keyword || !domain || !domain.includes('.')) {
    return NextResponse.json(
      { error: 'mot-clé et domaine requis (ex : monsite.ma)' },
      { status: 400 }
    )
  }

  try {
    const id = await addTracking(keyword, domain, LOCATION_MOROCCO, 'fr')
    const position = await checkRank(id) // first check right away
    return NextResponse.json({ id, position })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }
  try {
    await deleteTracking(id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
