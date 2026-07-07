import { NextResponse } from 'next/server'
import { domainOverview, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// A domain's ranked keywords shift within days -> cache 14 days.
const TTL_DAYS = 14

/** Normalize any pasted URL down to a bare host: "https://x.com/a" -> "x.com". */
function cleanDomain(raw: string): string {
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const domain = cleanDomain(body.domain || '')
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!domain || !domain.includes('.')) {
    return NextResponse.json({ error: 'domaine requis (ex : monsite.ma)' }, { status: 400 })
  }

  const key = cacheKey('domain', domain, location, language)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, domain, result: cached })
  }

  try {
    const result = await domainOverview(domain, { location, language })
    await setCached(key, result)
    return NextResponse.json({ cached: false, domain, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
