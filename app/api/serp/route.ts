import { NextResponse } from 'next/server'
import { serpOrganic, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// SERP shifts within days -> cache 14 days. A hit is free and shared across users.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('serp', keyword, location, language)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, keyword, results: cached })
  }

  try {
    const results = await serpOrganic(keyword, { location, language })
    await setCached(key, results)
    return NextResponse.json({ cached: false, keyword, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
