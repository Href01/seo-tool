// Abuse guard for the PAID DataForSEO routes. The app has no auth and a public
// URL, so anyone could hammer /api/difficulty etc. and burn credits. This adds
// two cheap, infra-free defenses (backed by the Postgres we already run):
//   1. Origin check — blocks other sites / casual non-browser callers.
//   2. Fixed-window rate limit per IP (per-minute + per-day).
// Cache HITS are free, but we limit all requests to cap a single abuser.

import { getPool, ready } from './db'

const LIMIT_MIN = 25       // requests / minute / IP
const LIMIT_DAY = 300      // requests / day / IP

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

/** Fixed-window counter in Postgres (shared across serverless instances). */
async function hit(id: string, limit: number, windowSec: number): Promise<boolean> {
  const p = getPool()
  if (!p) return true // no DB (local/dev) → don't block
  await ready()
  const slot = Math.floor(Date.now() / 1000 / windowSec)
  const bucket = `${id}:${windowSec}:${slot}`
  const expires = new Date((slot + 1) * windowSec * 1000)
  const r = await p.query(
    `INSERT INTO rate_limit (bucket, count, expires_at) VALUES ($1, 1, $2)
     ON CONFLICT (bucket) DO UPDATE SET count = rate_limit.count + 1
     RETURNING count`,
    [bucket, expires]
  )
  // Opportunistic cleanup of expired buckets (~1% of calls).
  if (Math.random() < 0.01) {
    p.query(`DELETE FROM rate_limit WHERE expires_at < now()`).catch(() => {})
  }
  return (r.rows[0]?.count ?? 1) <= limit
}

/**
 * Call at the top of a paid route: `const b = await guard(req); if (b) return b`.
 * Returns a Response to short-circuit when blocked, else null.
 */
export async function guard(req: Request): Promise<Response | null> {
  // 1. Origin check — only enforce when an Origin header is present and mismatches.
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (origin && host) {
    try {
      const oh = new URL(origin).host
      if (oh !== host) {
        return Response.json({ error: 'origine non autorisée' }, { status: 403 })
      }
    } catch {
      /* malformed Origin → ignore */
    }
  }

  // 2. Rate limit per IP (best-effort: DB errors never block a legit user).
  const ip = clientIp(req)
  const [okMin, okDay] = await Promise.all([
    hit(`min:${ip}`, LIMIT_MIN, 60).catch(() => true),
    hit(`day:${ip}`, LIMIT_DAY, 86400).catch(() => true),
  ])
  if (!okMin || !okDay) {
    return Response.json(
      { error: 'Trop de requêtes — réessaie dans un instant.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
  return null
}
