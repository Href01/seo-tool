// Thin DataForSEO client. All paid SEO calls cross this boundary, so it validates
// DataForSEO task status codes and logs reported API cost for every non-free hit.

import { recordDfsUsage } from './usage'
import { MEGA_PLATFORMS } from './platforms'

const BASE = 'https://api.dataforseo.com/v3'

// Morocco. See DataForSEO docs for other location codes.
export const LOCATION_MOROCCO = 2504

type JsonRecord = Record<string, unknown>

interface DfsTask extends JsonRecord {
  status_code?: number
  status_message?: string
  cost?: number
}

interface DfsEnvelope extends JsonRecord {
  status_code?: number
  status_message?: string
  tasks_error?: number
  cost?: number
  tasks?: DfsTask[]
}

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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function bool(value: unknown): boolean {
  return value === true
}

function child(parent: JsonRecord, key: string): JsonRecord {
  return record(parent[key])
}

function firstTask(data: unknown): JsonRecord {
  return records(record(data).tasks)[0] ?? {}
}

function firstTaskResults(data: unknown): JsonRecord[] {
  return records(firstTask(data).result)
}

function firstTaskResult(data: unknown): JsonRecord {
  return firstTaskResults(data)[0] ?? {}
}

function firstTaskItems(data: unknown): JsonRecord[] {
  return records(firstTaskResult(data).items)
}

function trend12(monthly: unknown): { month: string; volume: number }[] {
  // DataForSEO returns monthly_searches newest-first, so a blind slice(-12)
  // grabbed the OLDEST months (e.g. 2019-2020). Sort chronologically and keep
  // the 12 MOST RECENT, in ascending order for the chart.
  return records(monthly)
    .map((m) => ({
      year: asNumber(m.year) ?? 0,
      month: asNumber(m.month) ?? 0,
      volume: asNumber(m.search_volume) ?? 0,
    }))
    .filter((m) => m.year > 0 && m.month >= 1 && m.month <= 12)
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
    .slice(-12)
    .map((m) => ({ month: `${m.year}-${String(m.month).padStart(2, '0')}`, volume: m.volume }))
}

function authHeader(login: string, password: string): string {
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
}

function envelope(payload: unknown): DfsEnvelope {
  const root = record(payload)
  const tasks = records(root.tasks).map((task) => ({
    ...task,
    status_code: asNumber(task.status_code) ?? undefined,
    status_message: asString(task.status_message) || undefined,
    cost: asNumber(task.cost) ?? undefined,
  }))
  return {
    ...root,
    status_code: asNumber(root.status_code) ?? undefined,
    status_message: asString(root.status_message) || undefined,
    tasks_error: asNumber(root.tasks_error) ?? undefined,
    cost: asNumber(root.cost) ?? undefined,
    tasks,
  }
}

function responseCost(env: DfsEnvelope): number | null {
  if (env.cost != null) return env.cost
  if (!env.tasks?.length) return null
  const total = env.tasks.reduce((sum, task) => sum + (task.cost ?? 0), 0)
  return total > 0 ? total : null
}

function assertDfsOk(path: string, env: DfsEnvelope): void {
  if (env.status_code != null && env.status_code !== 20000) {
    throw new Error(`DataForSEO ${env.status_code}: ${env.status_message || path}`)
  }

  if ((env.tasks_error ?? 0) > 0) {
    const failed = env.tasks?.find((task) => (task.status_code ?? 20000) !== 20000)
    const taskDetail = failed
      ? `task ${failed.status_code}: ${failed.status_message || 'erreur'}`
      : env.status_message || 'erreur task'
    throw new Error(`DataForSEO tasks_error=${env.tasks_error}: ${taskDetail}`)
  }

  const hardFailure = env.tasks?.find((task) => (task.status_code ?? 0) >= 40000)
  if (hardFailure) {
    throw new Error(
      `DataForSEO task ${hardFailure.status_code}: ${hardFailure.status_message || path}`
    )
  }
}

/** POST any DataForSEO endpoint with the standard task envelope. */
export async function dfs<T = unknown>(path: string, body: unknown): Promise<T> {
  const login = process.env.DATAFORSEO_LOGIN || ''
  const password = process.env.DATAFORSEO_PASSWORD || ''
  if (!login || !password) {
    throw new Error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD manquants (voir .env.local)')
  }

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(login, password) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`DataForSEO ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new Error(`DataForSEO ${path}: reponse JSON invalide`)
  }

  const env = envelope(payload)
  assertDfsOk(path, env)

  const cost = responseCost(env)
  if (cost && cost > 0) {
    console.info(`[dfs] ${path} cost=$${cost.toFixed(6)}`)
    void recordDfsUsage({
      endpoint: path,
      cost,
      taskCount: env.tasks?.length ?? 0,
      statusCode: env.status_code ?? null,
    })
  }

  return payload as T
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
  const data = await dfs('/dataforseo_labs/google/keyword_suggestions/live', [
    {
      keyword,
      location_code: opts.location ?? LOCATION_MOROCCO,
      language_code: opts.language ?? 'fr',
      limit: opts.limit ?? 50,
    },
  ])

  return firstTaskItems(data).map((it) => {
    const keywordData = child(it, 'keyword_data')
    const info = child(it, 'keyword_info')
    const nestedInfo = child(keywordData, 'keyword_info')
    const props = child(it, 'keyword_properties')
    const nestedProps = child(keywordData, 'keyword_properties')
    return {
      keyword: asString(it.keyword) || asString(keywordData.keyword),
      volume: asNumber(info.search_volume) ?? asNumber(nestedInfo.search_volume),
      cpc: asNumber(info.cpc) ?? asNumber(nestedInfo.cpc),
      competition: asNumber(info.competition) ?? asNumber(nestedInfo.competition),
      difficulty:
        asNumber(props.keyword_difficulty) ?? asNumber(nestedProps.keyword_difficulty),
    }
  })
}

export interface SerpResult {
  position: number | null
  title: string
  url: string
  domain: string
  description: string
}

interface SerpOpts {
  location?: number
  language?: string
  depth?: number
  device?: string
  stopOnDomain?: string
  // "latitude,longitude" for city-level targeting. When set, it replaces the
  // country location_code (DataForSEO takes exactly one location parameter).
  coordinate?: string
}

/** Build the SERP task and return every raw SERP item (all types). */
async function serpItems(keyword: string, opts: SerpOpts = {}): Promise<JsonRecord[]> {
  // Google SERP supports desktop/mobile; tablet falls back to mobile.
  const device = opts.device === 'mobile' || opts.device === 'tablet' ? 'mobile' : 'desktop'
  const task: JsonRecord = {
    keyword,
    language_code: opts.language ?? 'fr',
    depth: opts.depth ?? 20,
    device,
    // Google deprecated ccTLDs in 2017. Geo-target google.com instead of google.co.ma.
    se_domain: 'google.com',
  }
  if (opts.coordinate) {
    task.location_coordinate = opts.coordinate
  } else {
    task.location_code = opts.location ?? LOCATION_MOROCCO
  }
  const stopOnDomain = opts.stopOnDomain ? cleanDomain(opts.stopOnDomain) : ''
  if (stopOnDomain) {
    task.stop_crawl_on_match = [{ match_value: stopOnDomain, match_type: 'with_subdomains' }]
  }
  const data = await dfs('/serp/google/organic/live/advanced', [task])
  return firstTaskItems(data)
}

function organicFrom(items: JsonRecord[]): SerpResult[] {
  return items
    .filter((it) => it.type === 'organic')
    .map((it) => ({
      // Organic rank (rank_group), NOT rank_absolute — the latter counts ads /
      // featured snippets / PAA and, on an organic-only list, yields gapped,
      // inflated positions (organic #5 shown as #8).
      position: asNumber(it.rank_group) ?? asNumber(it.rank_absolute),
      title: asString(it.title),
      url: asString(it.url),
      domain: asString(it.domain),
      description: asString(it.description),
    }))
}

/** Top organic results (google.com with geo-targeting) for a keyword. */
export async function serpOrganic(keyword: string, opts: SerpOpts = {}): Promise<SerpResult[]> {
  return organicFrom(await serpItems(keyword, opts))
}

export interface SerpPage {
  organic: SerpResult[]
  featuredSnippet: { title: string; description: string; url: string; domain: string } | null
  peopleAlsoAsk: string[]
  localPack: { title: string; rating: number | null; address: string }[]
  relatedSearches: string[]
  ads: { title: string; domain: string; url: string }[]
}

/** People-Also-Ask questions from raw SERP items. */
function paaFrom(items: JsonRecord[]): string[] {
  const set = new Set<string>()
  for (const it of items.filter((x) => x.type === 'people_also_ask')) {
    for (const q of records(it.items)) {
      const question = asString(q.title) || asString(q.seed_question)
      if (question) set.add(question)
    }
  }
  return [...set]
}

/** Related search queries from raw SERP items. */
function relatedFrom(items: JsonRecord[]): string[] {
  const set = new Set<string>()
  for (const it of items.filter((x) => x.type === 'related_searches')) {
    if (Array.isArray(it.items)) {
      for (const s of it.items) {
        if (typeof s === 'string' && s.trim()) set.add(s.trim())
        else if (isRecord(s) && asString(s.title)) set.add(asString(s.title))
      }
    }
  }
  return [...set]
}

/** Full SERP: organic results PLUS the features Google shows around them
 * (featured snippet, People-Also-Ask, local pack, related searches, ads).
 * Same single paid call as serpOrganic — we were discarding the rest. */
export async function serpPage(keyword: string, opts: SerpOpts = {}): Promise<SerpPage> {
  const items = await serpItems(keyword, { ...opts, stopOnDomain: undefined })

  const fs = items.find((it) => it.type === 'featured_snippet')
  const featuredSnippet = fs
    ? { title: asString(fs.title), description: asString(fs.description), url: asString(fs.url), domain: asString(fs.domain) }
    : null

  const localPack = items
    .filter((it) => it.type === 'local_pack')
    .map((it) => ({ title: asString(it.title), rating: asNumber(child(it, 'rating').value), address: asString(it.address) }))
    .filter((l) => l.title)

  const ads = items
    .filter((it) => it.type === 'paid')
    .map((it) => ({ title: asString(it.title), domain: asString(it.domain), url: asString(it.url) }))
    .filter((a) => a.title)

  return {
    organic: organicFrom(items),
    featuredSnippet,
    peopleAlsoAsk: paaFrom(items),
    localPack,
    relatedSearches: relatedFrom(items),
    ads,
  }
}

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

/**
 * Deep dive on one keyword: volume, difficulty, CPC, intent, 12-month trend.
 * Tries Labs first, then falls back to Google Ads when Labs has no niche data.
 */
export async function keywordOverview(
  keyword: string,
  opts: { location?: number; language?: string } = {}
): Promise<KeywordOverview | null> {
  const location = opts.location ?? LOCATION_MOROCCO
  const language = opts.language ?? 'fr'

  const data = await dfs('/dataforseo_labs/google/keyword_overview/live', [
    { keywords: [keyword], location_code: location, language_code: language },
  ])
  const it = firstTaskItems(data)[0]
  if (it) {
    const info = child(it, 'keyword_info')
    const props = child(it, 'keyword_properties')
    const searchIntent = child(it, 'search_intent_info')
    return {
      keyword: asString(it.keyword) || keyword,
      volume: asNumber(info.search_volume),
      cpc: asNumber(info.cpc),
      competition: asNumber(info.competition),
      difficulty: asNumber(props.keyword_difficulty),
      intent: asString(searchIntent.main_intent) || null,
      source: 'labs',
      trend: trend12(info.monthly_searches),
    }
  }

  return googleAdsVolume(keyword, { location, language })
}

/** Google Ads search volume fallback. No SEO difficulty/intent here. */
async function googleAdsVolume(
  keyword: string,
  opts: { location: number; language: string }
): Promise<KeywordOverview | null> {
  const data = await dfs('/keywords_data/google_ads/search_volume/live', [
    { keywords: [keyword], location_code: opts.location, language_code: opts.language },
  ])
  const it = firstTaskResults(data)[0]
  if (!it) return null
  return {
    keyword: asString(it.keyword) || keyword,
    volume: asNumber(it.search_volume),
    cpc: asNumber(it.cpc),
    competition:
      asNumber(it.competition_index) != null ? (asNumber(it.competition_index) ?? 0) / 100 : null,
    difficulty: null,
    intent: null,
    source: 'google_ads',
    trend: trend12(it.monthly_searches),
  }
}

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

/** A domain's organic footprint: estimated traffic, keyword count, and top keywords. */
export async function domainOverview(
  domain: string,
  opts: { location?: number; language?: string; limit?: number } = {}
): Promise<DomainOverview> {
  const location = opts.location ?? LOCATION_MOROCCO
  const language = opts.language ?? 'fr'

  const [overviewData, rankedData] = await Promise.all([
    dfs('/dataforseo_labs/google/domain_rank_overview/live', [
      { target: domain, location_code: location, language_code: language },
    ]),
    dfs('/dataforseo_labs/google/ranked_keywords/live', [
      {
        target: domain,
        location_code: location,
        language_code: language,
        limit: opts.limit ?? 200,
        order_by: ['ranked_serp_element.serp_item.etv,desc'],
      },
    ]),
  ])

  const metrics = child(child(firstTaskItems(overviewData)[0] ?? {}, 'metrics'), 'organic')
  const keywords: DomainKeyword[] = firstTaskItems(rankedData).map((it) => {
    const keywordData = child(it, 'keyword_data')
    const keywordInfo = child(keywordData, 'keyword_info')
    const serp = child(child(it, 'ranked_serp_element'), 'serp_item')
    const traffic = asNumber(serp.etv)
    return {
      keyword: asString(keywordData.keyword),
      // Organic rank (see serpOrganic) rather than absolute SERP position.
      position: asNumber(serp.rank_group) ?? asNumber(serp.rank_absolute),
      volume: asNumber(keywordInfo.search_volume),
      traffic: traffic != null ? Math.round(traffic) : null,
      url: asString(serp.url),
    }
  })

  const estimatedTraffic = asNumber(metrics.etv)
  return {
    domain,
    organicKeywords: asNumber(metrics.count),
    estimatedTraffic: estimatedTraffic != null ? Math.round(estimatedTraffic) : null,
    keywords,
  }
}

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

/** Headline backlink profile for a domain. */
export async function backlinksSummary(domain: string): Promise<BacklinksSummary> {
  const data = await dfs('/backlinks/summary/live', [
    { target: domain, internal_list_limit: 10, backlinks_status_type: 'live' },
  ])
  const result = firstTaskResults(data)[0] ?? {}
  const attrs = child(result, 'referring_links_attributes')
  return {
    domain,
    backlinks: asNumber(result.backlinks),
    referringDomains: asNumber(result.referring_domains),
    referringMainDomains: asNumber(result.referring_main_domains),
    rank: asNumber(result.rank),
    spamScore: asNumber(result.backlinks_spam_score),
    dofollow: asNumber(attrs.dofollow),
    nofollow: asNumber(attrs.nofollow),
  }
}

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

const AUDIT_ISSUE_LABELS: Record<string, string> = {
  no_title: 'Titre manquant',
  no_description: 'Meta description manquante',
  no_h1_tag: 'Balise H1 manquante',
  title_too_long: 'Titre trop long',
  title_too_short: 'Titre trop court',
  no_favicon: 'Favicon manquant',
  no_image_alt: 'Images sans attribut alt',
  duplicate_meta_tags: 'Meta tags dupliques',
  duplicate_title_tag: 'Titre duplique',
  high_loading_time: 'Temps de chargement eleve',
  is_redirect: 'Page en redirection',
  is_4xx_code: 'Erreur 4xx',
  is_5xx_code: 'Erreur 5xx',
  is_broken: 'Page cassee',
  no_content_encoding: 'Pas de compression (gzip)',
  low_content_rate: 'Peu de contenu texte',
  small_page_size: 'Page tres legere',
  no_doctype: 'Doctype manquant',
  no_encoding_meta_tag: 'Meta encodage manquante',
  https_to_http_links: 'Liens HTTPS vers HTTP',
}

/** Instant on-page SEO snapshot for a single URL. */
export async function instantPageAudit(url: string): Promise<PageAudit> {
  const data = await dfs('/on_page/instant_pages', [{ url }])
  const item = firstTaskItems(data)[0] ?? {}
  const meta = child(item, 'meta')
  const checks = child(item, 'checks')
  const htags = child(meta, 'htags')
  const title = asString(meta.title)
  const description = asString(meta.description)
  const h1 = (Array.isArray(htags.h1) ? htags.h1 : [])
    .map((entry) => asString(entry))
    .filter(Boolean)
  const content = child(meta, 'content')
  const issues = Object.entries(AUDIT_ISSUE_LABELS)
    .filter(([key]) => bool(checks[key]))
    .map(([, label]) => label)
  return {
    url,
    onpageScore: asNumber(item.onpage_score),
    title: title || null,
    titleLength: title ? title.length : null,
    description: description || null,
    descriptionLength: description ? description.length : null,
    h1,
    wordCount: asNumber(content.plain_text_word_count),
    internalLinks: asNumber(meta.internal_links_count),
    externalLinks: asNumber(meta.external_links_count),
    issues,
  }
}

export interface DifficultyResult {
  keyword: string
  // 0-100 (our own estimate), or null when the top 10 is 100% mega-platforms
  // (nothing to outrank on authority) -> "terrain libre / opportunite".
  difficulty: number | null
  competitors: { position: number | null; domain: string; rank: number | null; counted: boolean }[]
  // SERP features from the SAME fetch (no extra paid call): questions people ask
  // and related searches — surfaced as content/keyword ideas in the Explorer.
  peopleAlsoAsk: string[]
  relatedSearches: string[]
}


/** Backlink authority rank (0-1000) for many domains in a single call. */
async function bulkBacklinkRanks(domains: string[]): Promise<Record<string, number>> {
  if (domains.length === 0) return {}
  const data = await dfs('/backlinks/bulk_ranks/live', [{ targets: domains }])
  const map: Record<string, number> = {}
  for (const it of firstTaskItems(data)) {
    const target = asString(it.target)
    const rank = asNumber(it.rank)
    if (target) map[target] = rank ?? 0
  }
  return map
}

/**
 * Custom keyword difficulty (0-100), computed from SERP competitors and
 * backlink authority. Domains are de-duplicated and mega-platforms are excluded.
 */
export async function computeKeywordDifficulty(
  keyword: string,
  opts: { location?: number; language?: string; coordinate?: string } = {}
): Promise<DifficultyResult> {
  // One SERP fetch, reused for both the difficulty AND the SERP features.
  const items = await serpItems(keyword, { ...opts, depth: 10 })
  const serp = organicFrom(items)

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
      const weight = Math.max(1, 11 - (u.position ?? 10))
      weightedSum += weight * ((rank ?? 0) / 10)
      weightTotal += weight
    }
    return { position: u.position, domain: u.domain, rank, counted }
  })

  const difficulty = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null
  return {
    keyword,
    difficulty,
    competitors,
    peopleAlsoAsk: paaFrom(items),
    relatedSearches: relatedFrom(items),
  }
}
