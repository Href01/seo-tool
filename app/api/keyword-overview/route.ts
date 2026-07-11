import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { keywordOverview, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { recordKeyword } from '@/lib/bank'
import { jsonError, numberParam, readJson, stringParam } from '@/lib/api'

export const runtime = 'nodejs'

// Volumes/difficulty change slowly -> cache 30 days.
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

  // v3: Labs language_name param (DataForSEO breaking change from language_code).
  const key = cacheKey('kwov', 'v3', keyword, location, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, keyword, result: hit.payload })
  }

  try {
    const result = await keywordOverview(keyword, { location, language })
    if (!result) {
      return NextResponse.json({ error: 'Aucune donnee pour ce mot-cle' }, { status: 404 })
    }
    await setCached(key, result)
    await recordKeyword({
      keyword: result.keyword,
      location,
      language,
      volume: result.volume,
      cpc: result.cpc,
      difficulty: result.difficulty,
      source: result.source,
    })
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), keyword, result })
  } catch (e: unknown) {
    return jsonError(e, 500, 'Erreur DataForSEO')
  }
}
