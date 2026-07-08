// Rank tracking: per user and per tracked (keyword, domain), with explicit
// checks only. Manual checks are throttled to avoid burning DataForSEO credits.

import { getPool, ready } from './db'
import { serpOrganic, cleanDomain, LOCATION_MOROCCO } from './dataforseo'

export interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  location: number
  language: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

export interface RankCheckResult {
  position: number | null
  checked: boolean
  checkedAt: string | null
}

const NO_DB = 'Base de donnees requise pour le suivi (configure DATABASE_URL).'
const DEFAULT_MIN_AGE_HOURS = 6

function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Add a keyword+domain to track for one user (idempotent). */
export async function addTracking(
  userId: string,
  keyword: string,
  domain: string,
  location: number = LOCATION_MOROCCO,
  language = 'fr'
): Promise<number> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  const r = await p.query<{ id: number }>(
    `INSERT INTO rank_tracking (user_id, keyword, domain, location, language)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, keyword, domain, location, language)
       DO UPDATE SET keyword = EXCLUDED.keyword
     RETURNING id`,
    [userId, keyword, domain, location, language]
  )
  return r.rows[0].id
}

async function rowsToTracked(
  rows: {
    id: number
    keyword: string
    domain: string
    location: number
    language: string
  }[]
): Promise<TrackedKeyword[]> {
  const p = getPool()
  if (!p || rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const h = await p.query<{
    tracking_id: number
    position: number | null
    checked_at: Date | string
  }>(
    `SELECT tracking_id, position, checked_at FROM rank_history
     WHERE tracking_id = ANY($1) ORDER BY checked_at ASC`,
    [ids]
  )
  const byId: Record<number, { position: number | null; checkedAt: string }[]> = {}
  for (const row of h.rows) {
    const checkedAt = toIso(row.checked_at)
    if (!checkedAt) continue
    ;(byId[row.tracking_id] ??= []).push({ position: row.position, checkedAt })
  }

  return rows.map((r) => {
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

/** All tracked keywords for one user with latest position and full history. */
export async function listTracking(userId: string): Promise<TrackedKeyword[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const t = await p.query<{
    id: number
    keyword: string
    domain: string
    location: number
    language: string
  }>(
    `SELECT id, keyword, domain, location, language
     FROM rank_tracking
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  )
  return rowsToTracked(t.rows)
}

async function listAllTracking(): Promise<TrackedKeyword[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const t = await p.query<{
    id: number
    keyword: string
    domain: string
    location: number
    language: string
  }>(`SELECT id, keyword, domain, location, language FROM rank_tracking ORDER BY created_at DESC`)
  return rowsToTracked(t.rows)
}

export async function deleteTracking(id: number, userId: string): Promise<void> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  await p.query(`DELETE FROM rank_tracking WHERE id = $1 AND user_id = $2`, [id, userId])
}

/** Where does `domain` rank for `keyword`? Scans top 100; null if absent. */
async function findPosition(
  keyword: string,
  domain: string,
  location: number,
  language: string
): Promise<number | null> {
  const serp = await serpOrganic(keyword, {
    location,
    language,
    depth: 100,
    stopOnDomain: domain,
  })
  const target = cleanDomain(domain)
  const hit = serp.find((s) => {
    const d = cleanDomain(s.domain)
    return d === target || d.endsWith('.' + target)
  })
  return hit?.position ?? null
}

/** Re-check one tracked keyword, append history if a fresh check is needed. */
export async function checkRank(
  id: number,
  opts: { userId?: string; force?: boolean; minAgeHours?: number } = {}
): Promise<RankCheckResult> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  const r = await p.query<{
    keyword: string
    domain: string
    location: number
    language: string
  }>(
    `SELECT keyword, domain, location, language
     FROM rank_tracking
     WHERE id = $1 AND ($2::text IS NULL OR user_id = $2)`,
    [id, opts.userId ?? null]
  )
  const row = r.rows[0]
  if (!row) throw new Error('Suivi introuvable')

  const latest = await p.query<{ position: number | null; checked_at: Date | string }>(
    `SELECT position, checked_at FROM rank_history
     WHERE tracking_id = $1 ORDER BY checked_at DESC LIMIT 1`,
    [id]
  )
  const last = latest.rows[0]
  const checkedAt = last ? toIso(last.checked_at) : null
  const minAgeMs = (opts.minAgeHours ?? DEFAULT_MIN_AGE_HOURS) * 60 * 60 * 1000
  if (!opts.force && checkedAt && Date.now() - new Date(checkedAt).getTime() < minAgeMs) {
    return { position: last.position, checked: false, checkedAt }
  }

  const position = await findPosition(row.keyword, row.domain, row.location, row.language)
  const inserted = await p.query<{ checked_at: Date | string }>(
    `INSERT INTO rank_history (tracking_id, position) VALUES ($1, $2)
     RETURNING checked_at`,
    [id, position]
  )
  return {
    position,
    checked: true,
    checkedAt: toIso(inserted.rows[0]?.checked_at),
  }
}

/**
 * Re-check every tracked keyword (daily Vercel Cron). Sequential + best-effort:
 * one bad keyword never aborts the batch. Cron forces fresh checks.
 */
export async function checkAll(): Promise<{ total: number; checked: number; failed: number }> {
  const items = await listAllTracking()
  let checked = 0
  let failed = 0
  for (const item of items) {
    try {
      await checkRank(item.id, { force: true })
      checked++
    } catch (e) {
      failed++
      console.error('[rank] check failed for', item.id, e)
    }
  }
  return { total: items.length, checked, failed }
}
