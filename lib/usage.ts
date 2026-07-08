import { getPool, ready } from './db'

export interface UsageWindow {
  cost: number
  calls: number
}

export interface EndpointUsage {
  endpoint: string
  cost: number
  calls: number
}

export interface CacheUsage {
  prefix: string
  hits: number
  misses: number
  hitRate: number
}

export interface UsageDashboard {
  today: UsageWindow
  last7d: UsageWindow
  last30d: UsageWindow
  endpoints: EndpointUsage[]
  cache: CacheUsage[]
}

const emptyWindow: UsageWindow = { cost: 0, calls: 0 }

function prefixFromKey(key: string): string {
  return key.split(':')[0] || 'unknown'
}

export async function recordDfsUsage(input: {
  endpoint: string
  cost: number
  taskCount: number
  statusCode: number | null
}): Promise<void> {
  const p = getPool()
  if (!p || input.cost <= 0) return
  try {
    await ready()
    await p.query(
      `INSERT INTO dataforseo_usage (endpoint, cost, task_count, status_code)
       VALUES ($1, $2, $3, $4)`,
      [input.endpoint, input.cost, input.taskCount, input.statusCode]
    )
  } catch (e) {
    console.error('[usage] dfs record failed:', e)
  }
}

export async function recordCacheEvent(key: string, hit: boolean): Promise<void> {
  const p = getPool()
  if (!p) return
  try {
    await ready()
    await p.query(
      `INSERT INTO cache_events (prefix, cache_key, hit) VALUES ($1, $2, $3)`,
      [prefixFromKey(key), key, hit]
    )
  } catch (e) {
    console.error('[usage] cache record failed:', e)
  }
}

async function costWindow(days: number): Promise<UsageWindow> {
  const p = getPool()
  if (!p) return emptyWindow
  await ready()
  const r = await p.query<{ cost: number | string | null; calls: number }>(
    `SELECT COALESCE(sum(cost), 0) AS cost, count(*)::int AS calls
     FROM dataforseo_usage
     WHERE created_at >= now() - ($1 || ' days')::interval`,
    [String(days)]
  )
  return { cost: Number(r.rows[0]?.cost ?? 0), calls: r.rows[0]?.calls ?? 0 }
}

async function todayWindow(): Promise<UsageWindow> {
  const p = getPool()
  if (!p) return emptyWindow
  await ready()
  const r = await p.query<{ cost: number | string | null; calls: number }>(
    `SELECT COALESCE(sum(cost), 0) AS cost, count(*)::int AS calls
     FROM dataforseo_usage
     WHERE created_at >= date_trunc('day', now())`
  )
  return { cost: Number(r.rows[0]?.cost ?? 0), calls: r.rows[0]?.calls ?? 0 }
}

export async function usageDashboard(): Promise<UsageDashboard> {
  const p = getPool()
  if (!p) {
    return { today: emptyWindow, last7d: emptyWindow, last30d: emptyWindow, endpoints: [], cache: [] }
  }
  await ready()
  const [today, last7d, last30d, endpoints, cache] = await Promise.all([
    todayWindow(),
    costWindow(7),
    costWindow(30),
    p.query<{ endpoint: string; cost: number | string | null; calls: number }>(
      `SELECT endpoint, COALESCE(sum(cost), 0) AS cost, count(*)::int AS calls
       FROM dataforseo_usage
       WHERE created_at >= now() - interval '30 days'
       GROUP BY endpoint
       ORDER BY COALESCE(sum(cost), 0) DESC
       LIMIT 12`
    ),
    p.query<{ prefix: string; hits: number; misses: number }>(
      `SELECT prefix,
              count(*) FILTER (WHERE hit)::int AS hits,
              count(*) FILTER (WHERE NOT hit)::int AS misses
       FROM cache_events
       WHERE created_at >= now() - interval '30 days'
       GROUP BY prefix
       ORDER BY (count(*) FILTER (WHERE NOT hit)) DESC, prefix ASC
       LIMIT 12`
    ),
  ])

  return {
    today,
    last7d,
    last30d,
    endpoints: endpoints.rows.map((row) => ({
      endpoint: row.endpoint,
      cost: Number(row.cost ?? 0),
      calls: row.calls,
    })),
    cache: cache.rows.map((row) => {
      const total = row.hits + row.misses
      return {
        prefix: row.prefix,
        hits: row.hits,
        misses: row.misses,
        hitRate: total ? Math.round((row.hits / total) * 100) : 0,
      }
    }),
  }
}
