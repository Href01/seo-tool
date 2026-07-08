import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { keywordOverview, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'
import { recordKeyword } from '@/lib/bank'

export const runtime = 'nodejs'

// Volumes/difficulty change slowly -> cache 30 days.
const TTL_DAYS = 30

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('kwov', keyword, location, language)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, keyword, result: hit.payload })
  }

  try {
    const result = await keywordOverview(keyword, { location, language })
    if (!result) {
      return NextResponse.json({ error: 'Aucune donnée pour ce mot-clé' }, { status: 404 })
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
