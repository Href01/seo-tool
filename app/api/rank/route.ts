import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { addTracking, listTracking, deleteTracking } from '@/lib/tracking'
import { cleanDomain, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { jsonError, positiveIntParam, readJson, stringParam } from '@/lib/api'
import { authJsonError, requireUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const items = await listTracking(user.id)
    return NextResponse.json({ items })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const keyword = stringParam(body, 'keyword').toLowerCase()
    const domain = cleanDomain(stringParam(body, 'domain'))

    if (!keyword || !domain || !domain.includes('.')) {
      return NextResponse.json(
        { error: 'mot-cle et domaine requis (ex : monsite.ma)' },
        { status: 400 }
      )
    }

    const id = await addTracking(user.id, keyword, domain, LOCATION_MOROCCO, 'fr')
    return NextResponse.json({ id, position: null, checked: false })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}

export async function DELETE(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const id = positiveIntParam(body, 'id')
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }
    await deleteTracking(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
