import { NextResponse } from 'next/server'
import { domainOverview, cleanDomain, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// A domain's ranked keywords shift within days -> cache 14 days.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const domain = cleanDomain(body.domain || '')
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!domain || !domain.includes('.')) {
    return NextResponse.json({ error: 'domaine requis (ex : monsite.ma)' }, { status: 400 })
  }

  const key = cacheKey('domain', domain, location, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, domain, result: hit.payload })
  }

  try {
    const result = await domainOverview(domain, { location, language })
    await setCached(key, result)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), domain, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
