import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { serpOrganic, LOCATION_MOROCCO } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// SERP shifts within days -> cache 14 days. A hit is free and shared across users.
const TTL_DAYS = 14

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await req.json().catch(() => ({}))
  const keyword: string = (body.keyword || '').toString().trim().toLowerCase()
  const location: number = Number(body.location) || LOCATION_MOROCCO
  const language: string = (body.language || 'fr').toString()
  const device: string = (body.device || 'desktop').toString()
  // Google SERP only differs desktop vs mobile; tablet shares the mobile SERP.
  const serpDevice = device === 'mobile' || device === 'tablet' ? 'mobile' : 'desktop'

  if (!keyword) {
    return NextResponse.json({ error: 'keyword requis' }, { status: 400 })
  }

  // gcom: SERP now pinned to se_domain=google.com (was google.co.ma).
  const key = cacheKey('serp', 'gcom', keyword, location, language, serpDevice)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, keyword, results: hit.payload })
  }

  try {
    const results = await serpOrganic(keyword, { location, language, device: serpDevice })
    await setCached(key, results)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), keyword, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
