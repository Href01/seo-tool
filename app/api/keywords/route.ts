import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { keywordSuggestions, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { recordKeywords } from '@/lib/bank'
import { jsonError, numberParam, readJson, stringParam } from '@/lib/api'

export const runtime = 'nodejs'

// Keyword volumes change slowly -> cache 30 days. A hit is free.
const TTL_DAYS = 30

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await readJson(req)
  const keyword = stringParam(body, 'keyword').toLowerCase()
  const location = numberParam(body, 'location', LOCATION_MOROCCO)
  const language = stringParam(body, 'language', 'fr') || 'fr'

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('kwsug', keyword, location, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({
      cached: true,
      fetchedAt: hit.fetchedAt,
      keyword,
      location,
      language,
      results: hit.payload,
    })
  }

  try {
    const results = await keywordSuggestions(keyword, { location, language })
    await setCached(key, results)
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
    return NextResponse.json({
      cached: false,
      fetchedAt: new Date().toISOString(),
      keyword,
      location,
      language,
      results,
    })
  } catch (e: unknown) {
    return jsonError(e, 500, 'Erreur DataForSEO')
  }
}
