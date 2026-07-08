import { NextResponse } from 'next/server'
import { guard } from '@/lib/guard'
import { instantPageAudit } from '@/lib/dataforseo'
import { getCachedMeta, setCached, cacheKey } from '@/lib/cache'

export const runtime = 'nodejs'

// A page's on-page state changes when the site changes -> cache 7 days.
const TTL_DAYS = 7

/** Ensure a full URL: "monsite.ma/x" -> "https://monsite.ma/x". */
function normalizeUrl(raw: string): string {
  const s = raw.toString().trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const body = await req.json().catch(() => ({}))
  const url = normalizeUrl(body.url || '')

  if (!url || !url.includes('.')) {
    return NextResponse.json(
      { error: 'URL requise (ex : https://monsite.ma/produit)' },
      { status: 400 }
    )
  }

  const key = cacheKey('audit', url)

  const hit = await getCachedMeta(key, TTL_DAYS)
  if (hit) {
    return NextResponse.json({ cached: true, fetchedAt: hit.fetchedAt, url, result: hit.payload })
  }

  try {
    const result = await instantPageAudit(url)
    await setCached(key, result)
    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), url, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur DataForSEO' }, { status: 500 })
  }
}
