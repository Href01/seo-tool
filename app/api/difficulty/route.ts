import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { computeKeywordDifficulty, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCityById } from '@/lib/locations'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { jsonError, numberParam, readJson, stringParam } from '@/lib/api'

export const runtime = 'nodejs'

// Derived from the SERP (shifts within days) -> cache 14 days.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  const keyword = stringParam(body, 'keyword').toLowerCase()
  const location = numberParam(body, 'location', LOCATION_MOROCCO)
  const language = stringParam(body, 'language', 'fr') || 'fr'
  // Optional city (id) for precise geo-targeting; must belong to the country.
  const city = getCityById(stringParam(body, 'city'))
  const coordinate = city && city.countryCode === location ? city.coordinate : undefined

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  // gcom: SERP behind the difficulty is google.com with geo-targeting.
  // v2: uncontested SERPs now return difficulty=null ("terrain libre"), not 0.
  const geo = coordinate ? `c:${city!.id}` : location
  const key = cacheKey('kd', 'gcom', 'v2', keyword, geo, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, keyword, result: hit.payload })
  }

  try {
    const result = await computeKeywordDifficulty(keyword, { location, language, coordinate })
    await setCached(key, result)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), keyword, result })
  } catch (e: unknown) {
    return jsonError(e, 500, 'Erreur DataForSEO')
  }
}
