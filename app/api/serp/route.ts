import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { serpOrganic, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { jsonError, numberParam, readJson, stringParam } from '@/lib/api'

export const runtime = 'nodejs'

// SERP shifts within days -> cache 14 days. A hit is free and shared.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  const keyword = stringParam(body, 'keyword').toLowerCase()
  const location = numberParam(body, 'location', LOCATION_MOROCCO)
  const language = stringParam(body, 'language', 'fr') || 'fr'
  const device = stringParam(body, 'device', 'desktop')
  const serpDevice = device === 'mobile' || device === 'tablet' ? 'mobile' : 'desktop'

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  // gcom: SERP is pinned to se_domain=google.com.
  const key = cacheKey('serp', 'gcom', keyword, location, language, serpDevice)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, keyword, results: hit.payload })
  }

  try {
    const results = await serpOrganic(keyword, { location, language, device: serpDevice })
    await setCached(key, results)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), keyword, results })
  } catch (e: unknown) {
    return jsonError(e, 500, 'Erreur DataForSEO')
  }
}
