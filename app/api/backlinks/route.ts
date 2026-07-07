import { NextResponse } from 'next/server'
import { backlinksSummary, cleanDomain } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// Backlink profiles change slowly -> cache 14 days. (Backlinks calls are pricier.)
const TTL_DAYS = 14

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const domain = cleanDomain(body.domain || '')

  if (!domain || !domain.includes('.')) {
    return NextResponse.json({ error: 'domaine requis (ex : monsite.ma)' }, { status: 400 })
  }

  const key = cacheKey('backlinks', domain)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, domain, result: cached })
  }

  try {
    const result = await backlinksSummary(domain)
    await setCached(key, result)
    return NextResponse.json({ cached: false, domain, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
