import { NextResponse } from 'next/server'
import { keywordSuggestions, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'
import { recordKeywords } from '@/lib/bank'

export const runtime = 'nodejs'

// Keyword volumes change slowly -> cache 30 days. A hit is free.
const TTL_DAYS = 30

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('kwsug', keyword, location, language)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, keyword, location, language, results: cached })
  }

  try {
    const results = await keywordSuggestions(keyword, { location, language })
    await setCached(key, results)
    // Every suggestion enriches the proprietary Morocco keyword bank.
    await recordKeywords(
      results.map((r) => ({
        keyword: r.keyword,
        location,
        language,
        volume: r.volume,
        cpc: r.cpc,
        difficulty: r.difficulty,
        source: 'suggestions',
      }))
    )
    return NextResponse.json({ cached: false, keyword, location, language, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
