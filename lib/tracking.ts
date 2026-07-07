// Rank tracking — the sticky feature. Unlike the shared cache, this data is
// per tracked (keyword, domain): we record where a domain ranks on google.co.ma
// over time so the user sees progress. Each check is a fresh SERP lookup (we want
// the current position, not a cached one) and appends a row to the history.

import { getPool, ready } from './db'
import { serpOrganic, cleanDomain, LOCATION_MOROCCO } from './dataforseo'

export interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  location: number
  language: string
  position: number | null // latest known position (null = not in top 100)
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

const NO_DB = 'Base de données requise pour le suivi (configure DATABASE_URL).'

/** Add a keyword+domain to track (idempotent). Returns its tracking id. */
export async function addTracking(
  keyword: string,
  domain: string,
  location: number = LOCATION_MOROCCO,
  language = 'fr'
): Promise<number> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  const r = await p.query(
    `INSERT INTO rank_tracking (keyword, domain, location, language)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (keyword, domain, location, language)
       DO UPDATE SET keyword = EXCLUDED.keyword
     RETURNING id`,
    [keyword, domain, location, language]
  )
  return r.rows[0].id
}

/** All tracked keywords with their latest position and full history (oldest first). */
export async function listTracking(): Promise<TrackedKeyword[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const t = await p.query(
    `SELECT id, keyword, domain, location, language FROM rank_tracking ORDER BY created_at DESC`
  )
  if (t.rows.length === 0) return []

  const ids = t.rows.map((r) => r.id)
  const h = await p.query(
    `SELECT tracking_id, position, checked_at FROM rank_history
     WHERE tracking_id = ANY($1) ORDER BY checked_at ASC`,
    [ids]
  )
  const byId: Record<number, { position: number | null; checkedAt: string }[]> = {}
  for (const row of h.rows) {
    ;(byId[row.tracking_id] ??= []).push({ position: row.position, checkedAt: row.checked_at })
  }

  return t.rows.map((r) => {
    const history = byId[r.id] ?? []
    const last = history[history.length - 1]
    return {
      id: r.id,
      keyword: r.keyword,
      domain: r.domain,
      location: r.location,
      language: r.language,
      position: last?.position ?? null,
      checkedAt: last?.checkedAt ?? null,
      history,
    }
  })
}

export async function deleteTracking(id: number): Promise<void> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  await p.query(`DELETE FROM rank_tracking WHERE id = $1`, [id])
}

/** Where does `domain` rank for `keyword`? Scans the SERP top 100; null if absent. */
async function findPosition(
  keyword: string,
  domain: string,
  location: number,
  language: string
): Promise<number | null> {
  const serp = await serpOrganic(keyword, { location, language, depth: 100 })
  const target = cleanDomain(domain)
  const hit = serp.find((s) => {
    const d = cleanDomain(s.domain)
    return d === target || d.endsWith('.' + target)
  })
  return hit?.position ?? null
}

/** Re-check one tracked keyword, append a history point, return the new position. */
export async function checkRank(id: number): Promise<number | null> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  const r = await p.query(
    `SELECT keyword, domain, location, language FROM rank_tracking WHERE id = $1`,
    [id]
  )
  const row = r.rows[0]
  if (!row) throw new Error('Suivi introuvable')
  const position = await findPosition(row.keyword, row.domain, row.location, row.language)
  await p.query(`INSERT INTO rank_history (tracking_id, position) VALUES ($1, $2)`, [id, position])
  return position
}

/** Re-check every tracked keyword (used by a manual "tout vérifier" or a future cron). */
export async function checkAll(): Promise<void> {
  const items = await listTracking()
  for (const item of items) {
    try {
      await checkRank(item.id)
    } catch (e) {
      console.error('[rank] check failed for', item.id, e)
    }
  }
}
