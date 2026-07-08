import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { addTracking, listTracking, deleteTracking } from '@/lib/tracking'
import { cleanDomain } from '@/lib/dataforseo'
import { DEFAULT_LANGUAGE, DEFAULT_LOCATION, getLanguageByCode, getLocationByCode } from '@/lib/locations'
import { jsonError, numberParam, positiveIntParam, readJson, stringParam } from '@/lib/api'
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
    const requestedLocation = numberParam(body, 'location', DEFAULT_LOCATION.code)
    const requestedLanguage = stringParam(body, 'language', DEFAULT_LANGUAGE.code).toLowerCase()
    const location = getLocationByCode(requestedLocation)?.code
    const language = getLanguageByCode(requestedLanguage)?.code

    if (!keyword || !domain || !domain.includes('.')) {
      return NextResponse.json(
        { error: 'mot-cle et domaine requis (ex : monsite.ma)' },
        { status: 400 }
      )
    }
    if (!location || !language) {
      return NextResponse.json(
        { error: 'pays ou langue de recherche invalide' },
        { status: 400 }
      )
    }

    const id = await addTracking(user.id, keyword, domain, location, language)
    return NextResponse.json({ id, position: null, checked: false, location, language })
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
