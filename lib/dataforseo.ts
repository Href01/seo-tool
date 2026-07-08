// Thin DataForSEO client. All SEO data (keywords, SERP, backlinks…) is bought
// here at the API boundary — the product value is the layer we build on top.
// Auth is HTTP Basic (login:password). Keys live in env, server-side only.

const BASE = 'https://api.dataforseo.com/v3'

// Morocco. See https://docs.dataforseo.com for other location codes.
export const LOCATION_MOROCCO = 2504

/** Normalize any pasted URL down to a bare host: "https://www.x.com/a" -> "x.com". */
export function cleanDomain(raw: string): string {
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

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

// ── SERP analysis ─────────────────────────────────────────────────────────────

export interface SerpResult {
  position: number | null
  title: string
  url: string
  domain: string
  description: string
}

/** Top organic results (google.co.ma by default) for a keyword — who you'd compete with. */
export async function serpOrganic(
  keyword: string,
  opts: { location?: number; language?: string; depth?: number; device?: string } = {}
): Promise<SerpResult[]> {
  // Google SERP supports desktop/mobile; tablet falls back to mobile.
  const device = opts.device === 'mobile' || opts.device === 'tablet' ? 'mobile' : 'desktop'
  const data = await dfs<any>('/serp/google/organic/live/advanced', [
    {
      keyword,
      location_code: opts.location ?? LOCATION_MOROCCO,
      language_code: opts.language ?? 'fr',
      depth: opts.depth ?? 20,
      device,
      // Google deprecated ccTLDs in 2017 — everyone (incl. Morocco/Opera/Chrome)
      // hits google.com with geo-targeting. Forcing this matches what users
      // actually see, instead of the legacy google.co.ma SERP.
      se_domain: 'google.com',
    },
  ])
  const items: any[] = data?.tasks?.[0]?.result?.[0]?.items ?? []
  return items
    .filter((it) => it.type === 'organic')
    .map((it) => ({
      position: it.rank_absolute ?? it.rank_group ?? null,
      title: it.title ?? '',
      url: it.url ?? '',
      domain: it.domain ?? '',
      description: it.description ?? '',
    }))
}

// ── Single-keyword overview ───────────────────────────────────────────────────

export interface KeywordOverview {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
  intent: string | null
  source: 'labs' | 'google_ads'
  trend: { month: string; volume: number }[]
}

const trend12 = (monthly: any[]): { month: string; volume: number }[] =>
  (monthly ?? []).slice(-12).map((m) => ({
    month: `${m.year}-${String(m.month).padStart(2, '0')}`,
    volume: m.search_volume ?? 0,
  }))

/**
 * Deep dive on one keyword: volume, difficulty, CPC, intent, 12-month trend.
 * Tries the Labs database first (richer: difficulty + intent). If Labs has no
 * entry — common for niche/long-tail keywords in Morocco — it falls back to
 * Google Ads, which returns volume/CPC for virtually any keyword.
 */
export async function keywordOverview(
  keyword: string,
  opts: { location?: number; language?: string } = {}
): Promise<KeywordOverview | null> {
  const location = opts.location ?? LOCATION_MOROCCO
  const language = opts.language ?? 'fr'

  const data = await dfs<any>('/dataforseo_labs/google/keyword_overview/live', [
    { keywords: [keyword], location_code: location, language_code: language },
  ])
  const it = data?.tasks?.[0]?.result?.[0]?.items?.[0]
  if (it) {
    const info = it.keyword_info ?? {}
    const props = it.keyword_properties ?? {}
    return {
      keyword: it.keyword ?? keyword,
      volume: info.search_volume ?? null,
      cpc: info.cpc ?? null,
      competition: info.competition ?? null,
      difficulty: props.keyword_difficulty ?? null,
      intent: it.search_intent_info?.main_intent ?? null,
      source: 'labs',
      trend: trend12(info.monthly_searches),
    }
  }

  return googleAdsVolume(keyword, { location, language })
}

/** Google Ads search volume — coverage fallback. No SEO difficulty/intent here. */
async function googleAdsVolume(
  keyword: string,
  opts: { location: number; language: string }
): Promise<KeywordOverview | null> {
  const data = await dfs<any>('/keywords_data/google_ads/search_volume/live', [
    { keywords: [keyword], location_code: opts.location, language_code: opts.language },
  ])
  const it = data?.tasks?.[0]?.result?.[0]
  if (!it) return null
  return {
    keyword: it.keyword ?? keyword,
    volume: it.search_volume ?? null,
    cpc: it.cpc ?? null,
    competition: it.competition_index != null ? it.competition_index / 100 : null,
    difficulty: null,
    intent: null,
    source: 'google_ads',
    trend: trend12(it.monthly_searches),
  }
}

// ── Domain / competitor analysis ──────────────────────────────────────────────

export interface DomainKeyword {
  keyword: string
  position: number | null
  volume: number | null
  traffic: number | null
  url: string
}

export interface DomainOverview {
  domain: string
  organicKeywords: number | null
  estimatedTraffic: number | null
  keywords: DomainKeyword[]
}

/** A domain's organic footprint: estimated traffic, keyword count, and its top keywords. */
export async function domainOverview(
  domain: string,
  opts: { location?: number; language?: string; limit?: number } = {}
): Promise<DomainOverview> {
  const location = opts.location ?? LOCATION_MOROCCO
  const language = opts.language ?? 'fr'

  const [overviewData, rankedData] = await Promise.all([
    dfs<any>('/dataforseo_labs/google/domain_rank_overview/live', [
      { target: domain, location_code: location, language_code: language },
    ]),
    dfs<any>('/dataforseo_labs/google/ranked_keywords/live', [
      {
        target: domain,
        location_code: location,
        language_code: language,
        limit: opts.limit ?? 200,
        order_by: ['ranked_serp_element.serp_item.etv,desc'],
      },
    ]),
  ])

  const metrics = overviewData?.tasks?.[0]?.result?.[0]?.items?.[0]?.metrics?.organic ?? {}
  const items: any[] = rankedData?.tasks?.[0]?.result?.[0]?.items ?? []

  const keywords: DomainKeyword[] = items.map((it) => {
    const kd = it.keyword_data ?? {}
    const serp = it.ranked_serp_element?.serp_item ?? {}
    return {
      keyword: kd.keyword ?? '',
      position: serp.rank_absolute ?? serp.rank_group ?? null,
      volume: kd.keyword_info?.search_volume ?? null,
      traffic: serp.etv != null ? Math.round(serp.etv) : null,
      url: serp.url ?? '',
    }
  })

  return {
    domain,
    organicKeywords: metrics.count ?? null,
    estimatedTraffic: metrics.etv != null ? Math.round(metrics.etv) : null,
    keywords,
  }
}

// ── Backlinks ─────────────────────────────────────────────────────────────────

export interface BacklinksSummary {
  domain: string
  backlinks: number | null
  referringDomains: number | null
  referringMainDomains: number | null
  rank: number | null
  spamScore: number | null
  dofollow: number | null
  nofollow: number | null
}

/** Headline backlink profile for a domain: totals, referring domains, spam score. */
export async function backlinksSummary(domain: string): Promise<BacklinksSummary> {
  const data = await dfs<any>('/backlinks/summary/live', [
    { target: domain, internal_list_limit: 10, backlinks_status_type: 'live' },
  ])
  const r = data?.tasks?.[0]?.result?.[0] ?? {}
  const attrs = r.referring_links_attributes ?? {}
  return {
    domain,
    backlinks: r.backlinks ?? null,
    referringDomains: r.referring_domains ?? null,
    referringMainDomains: r.referring_main_domains ?? null,
    rank: r.rank ?? null,
    spamScore: r.backlinks_spam_score ?? null,
    dofollow: attrs.dofollow ?? null,
    nofollow: attrs.nofollow ?? null,
  }
}

// ── On-page audit (single URL, instant) ───────────────────────────────────────

export interface PageAudit {
  url: string
  onpageScore: number | null
  title: string | null
  titleLength: number | null
  description: string | null
  descriptionLength: number | null
  h1: string[]
  wordCount: number | null
  internalLinks: number | null
  externalLinks: number | null
  issues: string[]
}

// Curated on-page checks that signal a problem when `true`, with fr labels.
// We only surface known problem checks so we never show a "good" check as an issue.
const AUDIT_ISSUE_LABELS: Record<string, string> = {
  no_title: 'Titre manquant',
  no_description: 'Meta description manquante',
  no_h1_tag: 'Balise H1 manquante',
  title_too_long: 'Titre trop long',
  title_too_short: 'Titre trop court',
  no_favicon: 'Favicon manquant',
  no_image_alt: 'Images sans attribut alt',
  duplicate_meta_tags: 'Meta tags dupliqués',
  duplicate_title_tag: 'Titre dupliqué',
  high_loading_time: 'Temps de chargement élevé',
  is_redirect: 'Page en redirection',
  is_4xx_code: 'Erreur 4xx',
  is_5xx_code: 'Erreur 5xx',
  is_broken: 'Page cassée',
  no_content_encoding: 'Pas de compression (gzip)',
  low_content_rate: 'Peu de contenu texte',
  small_page_size: 'Page très légère',
  no_doctype: 'Doctype manquant',
  no_encoding_meta_tag: 'Meta encodage manquante',
  https_to_http_links: 'Liens HTTPS vers HTTP',
}

/** Instant on-page SEO snapshot for a single URL: score, meta, and flagged issues. */
export async function instantPageAudit(url: string): Promise<PageAudit> {
  const data = await dfs<any>('/on_page/instant_pages', [{ url }])
  const item = data?.tasks?.[0]?.result?.[0]?.items?.[0] ?? {}
  const meta = item.meta ?? {}
  const checks = item.checks ?? {}
  const htags = meta.htags ?? {}
  const issues = Object.entries(AUDIT_ISSUE_LABELS)
    .filter(([key]) => checks[key] === true)
    .map(([, label]) => label)
  return {
    url,
    onpageScore: item.onpage_score ?? null,
    title: meta.title ?? null,
    titleLength: typeof meta.title === 'string' ? meta.title.length : null,
    description: meta.description ?? null,
    descriptionLength: typeof meta.description === 'string' ? meta.description.length : null,
    h1: Array.isArray(htags.h1) ? htags.h1 : [],
    wordCount: meta.content?.plain_text_word_count ?? null,
    internalLinks: meta.internal_links_count ?? null,
    externalLinks: meta.external_links_count ?? null,
    issues,
  }
}

// ── Custom keyword difficulty (computed from SERP + domain authority) ──────────

export interface DifficultyResult {
  keyword: string
  difficulty: number // 0-100, our own estimate
  // `counted: false` = excluded from the score (mega-platform or duplicate domain).
  competitors: { position: number | null; domain: string; rank: number | null; counted: boolean }[]
}

// Social / video / encyclopaedia domains: they have max authority but ranking on
// them isn't the SEO competition a merchant faces (a real product page beats them).
// Counting them massively inflates difficulty, so we exclude them from the score.
const MEGA_PLATFORMS = new Set([
  'instagram.com',
  'facebook.com',
  'youtube.com',
  'pinterest.com',
  'pinterest.fr',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'wikipedia.org',
  'reddit.com',
])

/** Backlink authority rank (0-1000) for many domains in a single call. */
async function bulkBacklinkRanks(domains: string[]): Promise<Record<string, number>> {
  if (domains.length === 0) return {}
  const data = await dfs<any>('/backlinks/bulk_ranks/live', [{ targets: domains }])
  const items: any[] = data?.tasks?.[0]?.result?.[0]?.items ?? []
  const map: Record<string, number> = {}
  for (const it of items) {
    if (it.target) map[it.target] = it.rank ?? 0
  }
  return map
}

/**
 * Our own keyword difficulty (0-100), computed the way big SEO tools do it: pull
 * the SERP, measure the backlink authority (rank 0-1000) of the domains that rank,
 * and aggregate — weighted by position. Works for ANY keyword, including niche ones
 * the Labs database has no difficulty for.
 *
 * Accuracy guards: domains are de-duplicated (a domain ranking twice counts once,
 * at its best position) and mega-platforms are excluded from the score, since a
 * merchant's real competition is other sites, not Instagram/YouTube.
 */
export async function computeKeywordDifficulty(
  keyword: string,
  opts: { location?: number; language?: string } = {}
): Promise<DifficultyResult> {
  const serp = await serpOrganic(keyword, { ...opts, depth: 10 })

  // De-duplicate by normalized domain, keeping the best (first-seen) position.
  const seen = new Set<string>()
  const unique: { position: number | null; domain: string; raw: string }[] = []
  for (const r of serp.slice(0, 10)) {
    const domain = cleanDomain(r.domain)
    if (!domain || seen.has(domain)) continue
    seen.add(domain)
    unique.push({ position: r.position, domain, raw: r.domain })
  }

  const ranks = await bulkBacklinkRanks(unique.map((u) => u.raw))

  let weightedSum = 0
  let weightTotal = 0
  const competitors = unique.map((u) => {
    const rank = ranks[u.raw] ?? null
    const counted = !MEGA_PLATFORMS.has(u.domain)
    if (counted) {
      const weight = Math.max(1, 11 - (u.position ?? 10)) // #1 heaviest
      weightedSum += weight * ((rank ?? 0) / 10) // rank 0-1000 -> 0-100 scale
      weightTotal += weight
    }
    return { position: u.position, domain: u.domain, rank, counted }
  })

  const difficulty = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0
  return { keyword, difficulty, competitors }
}
