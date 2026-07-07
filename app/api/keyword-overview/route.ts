import { NextResponse } from 'next/server'
import { keywordOverview, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// Volumes/difficulty change slowly -> cache 30 days.
const TTL_DAYS = 30

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  const key = cacheKey('kwov', keyword, location, language)

  const cached = await getCached(key, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, keyword, result: cached })
  }

  try {
    const result = await keywordOverview(keyword, { location, language })
    if (!result) {
      return NextResponse.json({ error: 'Aucune donnée pour ce mot-clé' }, { status: 404 })
    }
    await setCached(key, result)
    return NextResponse.json({ cached: false, keyword, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
