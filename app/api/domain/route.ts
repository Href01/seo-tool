import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { domainOverview, cleanDomain, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { jsonError, numberParam, readJson, stringParam } from '@/lib/api'

export const runtime = 'nodejs'

// A domain's ranked keywords shift within days -> cache 14 days.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  const domain = cleanDomain(stringParam(body, 'domain'))
  const location = numberParam(body, 'location', LOCATION_MOROCCO)
  const language = stringParam(body, 'language', 'fr') || 'fr'

  if (!domain || !domain.includes('.')) {
    return NextResponse.json({ error: 'domaine requis (ex : monsite.ma)' }, { status: 400 })
  }

  // v3: organic rank (rank_group) for positions (v2: limit 200 + traffic).
  const key = cacheKey('domain', 'v3', domain, location, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, domain, result: hit.payload })
  }

  try {
    const result = await domainOverview(domain, { location, language })
    await setCached(key, result)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), domain, result })
  } catch (e: unknown) {
    return jsonError(e, 500, 'Erreur DataForSEO')
  }
}
