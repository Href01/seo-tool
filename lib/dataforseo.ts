// Thin DataForSEO client. All SEO data (keywords, SERP, backlinks…) is bought
// here at the API boundary — the product value is the layer we build on top.
// Auth is HTTP Basic (login:password). Keys live in env, server-side only.

const BASE = 'https://api.dataforseo.com/v3'

// Morocco. See https://docs.dataforseo.com for other location codes.
export const LOCATION_MOROCCO = 2504

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN || ''
  const password = process.env.DATAFORSEO_PASSWORD || ''
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
}

/** POST any DataForSEO endpoint with the standard task envelope. */
export async function dfs<T = unknown>(path: string, body: unknown): Promise<T> {
  if (!process.env.DATAFORSEO_LOGIN) {
    throw new Error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD manquants (voir .env.local)')
  }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`DataForSEO ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export interface KeywordResult {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
}

/**
 * Keyword suggestions for a seed keyword (volume / CPC / competition / difficulty).
 * Defaults to Morocco + French. Returns a normalized, UI-ready list.
 */
export async function keywordSuggestions(
  keyword: string,
  opts: { location?: number; language?: string; limit?: number } = {}
): Promise<KeywordResult[]> {
  const data = await dfs<any>('/dataforseo_labs/google/keyword_suggestions/live', [
    {
      keyword,
      location_code: opts.location ?? LOCATION_MOROCCO,
      language_code: opts.language ?? 'fr',
      limit: opts.limit ?? 50,
    },
  ])

  const items: any[] = data?.tasks?.[0]?.result?.[0]?.items ?? []
  return items.map((it) => {
    const info = it.keyword_info ?? it.keyword_data?.keyword_info ?? {}
    const props = it.keyword_properties ?? it.keyword_data?.keyword_properties ?? {}
    return {
      keyword: it.keyword ?? it.keyword_data?.keyword ?? '',
      volume: info.search_volume ?? null,
      cpc: info.cpc ?? null,
      competition: info.competition ?? null,
      difficulty: props.keyword_difficulty ?? null,
    }
  })
}
