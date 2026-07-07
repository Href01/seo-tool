import { NextResponse } from 'next/server'
import { computeKeywordDifficulty, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// Derived from the SERP (shifts within days) -> cache 14 days.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('kd', keyword, location, language)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, keyword, result: cached })
  }

  try {
    const result = await computeKeywordDifficulty(keyword, { location, language })
    await setCached(key, result)
    return NextResponse.json({ cached: false, keyword, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
