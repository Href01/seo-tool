// Shared Postgres cache — THE lever that makes reselling DataForSEO profitable.
// The same (keyword, location, language) returns the same data for everyone, so
// one paid lookup serves all users until the TTL expires. A cache hit costs $0.
//
// The pool + schema live in ./db; this module is just the cache read/write layer.

import crypto from 'crypto'
import { getPool, ready } from './db'

/** Deterministic cache key: `prefix:sha1(parts)`. Same inputs => same key => shared hit. */
export function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  const hash = crypto.createHash('sha1').update(parts.join('|')).digest('hex')
  return `${prefix}:${hash}`
}

/** Cache hit with its age, or null. `fetchedAt` lets the UI show data freshness. */
export async function getCachedMeta<T = unknown>(
  key: string,
  ttlDays: number
): Promise<{ payload: T; fetchedAt: string } | null> {
  const p = getPool()
  if (!p) return null
  try {
    await ready()
    const r = await p.query(
      `SELECT payload, fetched_at FROM seo_cache
       WHERE cache_key = $1 AND fetched_at > now() - ($2 || ' days')::interval`,
      [key, String(ttlDays)]
    )
    const row = r.rows[0]
    if (!row) return null
    return { payload: row.payload as T, fetchedAt: new Date(row.fetched_at).toISOString() }
  } catch (e) {
    console.error('[cache] read failed:', e)
    return null
  }
}

/** Return cached payload if it exists and is younger than ttlDays, else null. */
export async function getCached<T = unknown>(key: string, ttlDays: number): Promise<T | null> {
  const hit = await getCachedMeta<T>(key, ttlDays)
  return hit ? hit.payload : null
}

/** Store (or refresh) a payload under a key. */
export async function setCached(key: string, payload: unknown): Promise<void> {
  const p = getPool()
  if (!p) return
  try {
    await ready()
    await p.query(
      `INSERT INTO seo_cache (cache_key, payload, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = now()`,
      [key, JSON.stringify(payload)]
    )
  } catch (e) {
    console.error('[cache] write failed:', e)
  }
}
