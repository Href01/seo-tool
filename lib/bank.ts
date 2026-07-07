// Proprietary keyword bank — a Morocco keyword asset that accumulates over time.
// Every keyword the tool looks up is recorded here with its best-known metrics, so
// the database grows into something no API can hand a competitor: a real map of what
// this market searches. Never blocks the user path (best-effort, errors swallowed).

import { getPool, ready } from './db'
import { LOCATION_MOROCCO } from './dataforseo'

export interface BankEntry {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  source: string | null
  timesSearched: number
  lastSeen: string
}

export interface RecordInput {
  keyword: string
  location?: number
  language?: string
  volume?: number | null
  cpc?: number | null
  difficulty?: number | null
  source?: string | null
}

const COLS = 7

/** Upsert many keywords in one query. New metrics overwrite nulls; count increments. */
export async function recordKeywords(entries: RecordInput[]): Promise<void> {
  const p = getPool()
  if (!p || entries.length === 0) return

  // De-duplicate by (keyword, location, language) — a multi-row upsert can't touch
  // the same conflict target twice.
  const byKey = new Map<string, RecordInput>()
  for (const e of entries) {
    const kw = e.keyword.trim().toLowerCase()
    if (!kw) continue
    const loc = e.location ?? LOCATION_MOROCCO
    const lang = e.language ?? 'fr'
    byKey.set(`${kw}|${loc}|${lang}`, { ...e, keyword: kw, location: loc, language: lang })
  }
  const unique = [...byKey.values()]
  if (unique.length === 0) return

  const values: unknown[] = []
  const rows = unique
    .map((e, i) => {
      const b = i * COLS
      values.push(
        e.keyword,
        e.location,
        e.language,
        e.volume ?? null,
        e.cpc ?? null,
        e.difficulty ?? null,
        e.source ?? null
      )
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`
    })
    .join(',')

  try {
    await ready()
    await p.query(
      `INSERT INTO keyword_bank (keyword, location, language, volume, cpc, difficulty, source)
       VALUES ${rows}
       ON CONFLICT (keyword, location, language) DO UPDATE SET
         volume         = COALESCE(EXCLUDED.volume, keyword_bank.volume),
         cpc            = COALESCE(EXCLUDED.cpc, keyword_bank.cpc),
         difficulty     = COALESCE(EXCLUDED.difficulty, keyword_bank.difficulty),
         source         = COALESCE(EXCLUDED.source, keyword_bank.source),
         times_searched = keyword_bank.times_searched + 1,
         last_seen      = now()`,
      values
    )
  } catch (e) {
    console.error('[bank] record failed:', e)
  }
}

export async function recordKeyword(entry: RecordInput): Promise<void> {
  return recordKeywords([entry])
}

/** Browse the bank, optionally filtered, biggest volume first. */
export async function listBank(opts: { search?: string; limit?: number } = {}): Promise<BankEntry[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const search = (opts.search ?? '').trim().toLowerCase()
  const limit = Math.min(opts.limit ?? 100, 500)
  const r = await p.query(
    `SELECT keyword, volume, cpc, difficulty, source, times_searched, last_seen
     FROM keyword_bank
     WHERE ($1 = '' OR keyword ILIKE '%' || $1 || '%')
     ORDER BY volume DESC NULLS LAST, times_searched DESC
     LIMIT $2`,
    [search, limit]
  )
  return r.rows.map((row) => ({
    keyword: row.keyword,
    volume: row.volume,
    cpc: row.cpc != null ? Number(row.cpc) : null,
    difficulty: row.difficulty,
    source: row.source,
    timesSearched: row.times_searched,
    lastSeen: row.last_seen,
  }))
}

export async function bankCount(): Promise<number> {
  const p = getPool()
  if (!p) return 0
  await ready()
  const r = await p.query(`SELECT count(*)::int AS n FROM keyword_bank`)
  return r.rows[0]?.n ?? 0
}
