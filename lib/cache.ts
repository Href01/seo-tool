// Shared Postgres cache — THE lever that makes reselling DataForSEO profitable.
// The same (keyword, location, language) returns the same data for everyone, so
// one paid lookup serves all users until the TTL expires. A cache hit costs $0.
//
// Degrades gracefully: with no DATABASE_URL the app still runs (every call hits
// DataForSEO, no caching) so you can test before wiring up Neon/Postgres.

import { Pool } from 'pg'

let pool: Pool | null = null
let ready: Promise<void> | null = null

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    ready = pool
      .query(
        `CREATE TABLE IF NOT EXISTS seo_cache (
           cache_key  text PRIMARY KEY,
           payload    jsonb NOT NULL,
           fetched_at timestamptz NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined)
  }
  return pool
}

/** Return cached payload if it exists and is younger than ttlDays, else null. */
export async function getCached<T = unknown>(key: string, ttlDays: number): Promise<T | null> {
  const p = getPool()
  if (!p) return null
  try {
    await ready
    const r = await p.query(
      `SELECT payload FROM seo_cache
       WHERE cache_key = $1 AND fetched_at > now() - ($2 || ' days')::interval`,
      [key, String(ttlDays)]
    )
    return (r.rows[0]?.payload as T) ?? null
  } catch (e) {
    console.error('[cache] read failed:', e)
    return null
  }
}

/** Store (or refresh) a payload under a key. */
export async function setCached(key: string, payload: unknown): Promise<void> {
  const p = getPool()
  if (!p) return
  try {
    await ready
    await p.query(
      `INSERT INTO seo_cache (cache_key, payload, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = now()`,
      [key, JSON.stringify(payload)]
    )
  } catch (e) {
    console.error('[cache] write failed:', e)
  }
}
