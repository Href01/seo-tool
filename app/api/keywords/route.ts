import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { keywordSuggestions, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCached, setCached } from '@/lib/cache'

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

  const cacheKey =
    'kwsug:' + crypto.createHash('sha1').update(`${keyword}|${location}|${language}`).digest('hex')

  const cached = await getCached(cacheKey, TTL_DAYS)
  if (cached) {
    return NextResponse.json({ cached: true, keyword, location, language, results: cached })
  }

  try {
    const results = await keywordSuggestions(keyword, { location, language })
    await setCached(cacheKey, results)
    return NextResponse.json({ cached: false, keyword, location, language, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
