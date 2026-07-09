'use client'

import { useState, useMemo } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { useT, usePT } from '@/lib/i18n'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { KW_EXAMPLES } from '@/lib/examples'
import { MEGA_PLATFORMS } from '@/lib/platforms'
import { positionTone } from '@/lib/status'
import { LocationSelector, CitySelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { Page, WorkspaceHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, Pill, Callout, DistributionBar, SectionTitle } from '@/components/ui'

interface SerpResult { position: number | null; title: string; url: string; domain: string; description: string }
interface SerpPage {
  organic: SerpResult[]
  featuredSnippet: { title: string; description: string; url: string; domain: string } | null
  peopleAlsoAsk: string[]
  localPack: { title: string; rating: number | null; address: string }[]
  relatedSearches: string[]
  ads: { title: string; domain: string; url: string }[]
}

const norm = (d: string) => d.toLowerCase().replace(/^www\./, '')

export default function SerpPage() {
  const { lang } = useT()
  const p = usePT()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [city, setCity] = useState('')
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<SerpPage>('/api/serp')
  const organic = data?.organic ?? []

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    run({ keyword, location, language, device, city })
  }
  function searchFor(kw: string) {
    setKeyword(kw)
    run({ keyword: kw, location, language, device, city })
  }

  const insights = useMemo(() => {
    const rows = data?.organic ?? []
    if (!data) return null
    const domains = new Set(rows.map((r) => norm(r.domain)))
    const platforms = rows.filter((r) => MEGA_PLATFORMS.has(norm(r.domain))).length
    return { uniqueDomains: domains.size, platforms, realCompetitors: rows.length - platforms }
  }, [data])


  return (
    <Page>
      <WorkspaceHeader icon="📊" title={p.serpTitle} subtitle={p.serpSub} />
      <Callout>{p.helpSerp}</Callout>
      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{p.kwLabel}</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={p.kwPh} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LocationSelector value={location} onChange={(c) => { setLocation(c); setCity('') }} />
            <CitySelector country={location} value={city} onChange={setCity} />
            <DeviceSelector value={device} onChange={setDevice} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (<><Spinner /> {p.analyzing}</>) : p.analyze}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} extra={`${organic.length} ${p.results}`} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && insights && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatCard label={p.uniqueDomains} value="—" num={insights.uniqueDomains} sub={`${p.onN} ${organic.length} ${p.results}`} tone="blue" />
            <StatCard label={p.realComp} value="—" num={insights.realCompetitors} tone="teal" />
            <StatCard label={p.platformsStat} value="—" num={insights.platforms} tone="violet" />
          </div>
          {insights.realCompetitors + insights.platforms > 0 && (
            <Card className="mb-6">
              <div className="mb-3 text-sm font-semibold text-[var(--text)]">{p.serpMakeup}</div>
              <DistributionBar segments={[
                { label: p.realComp, value: insights.realCompetitors, color: '#16a34a' },
                { label: p.platformsStat, value: insights.platforms, color: '#d4d4d8' },
              ]} />
            </Card>
          )}
        </>
      )}

      {data && (data.featuredSnippet || data.peopleAlsoAsk.length > 0 || data.localPack.length > 0 || data.relatedSearches.length > 0 || data.ads.length > 0) && (
        <div className="mb-6 space-y-3">
          <SectionTitle>{p.serpFeaturesTitle}</SectionTitle>

          {data.featuredSnippet && (
            <Card>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span>📦</span>{p.serpFeaturedSnippet}</div>
              <div className="text-sm text-[var(--text)]">{data.featuredSnippet.description || data.featuredSnippet.title}</div>
              {data.featuredSnippet.domain && <div className="mt-1 font-mono text-xs text-[var(--text-3)]">{data.featuredSnippet.domain}</div>}
              <div className="mt-2 text-xs text-[var(--text-2)]">💡 {p.serpFsHint}</div>
            </Card>
          )}

          {data.localPack.length > 0 && (
            <Card>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span>🗺️</span>{p.serpLocalPack}</div>
              <div className="mb-2.5 text-xs text-[var(--text-2)]">💡 {p.serpLocalHint}</div>
              <div className="space-y-1.5">
                {data.localPack.slice(0, 3).map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-[var(--text)]">{l.title}</span>
                    {l.rating != null && <span className="shrink-0 text-xs font-semibold text-amber-600">★ {l.rating}</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.peopleAlsoAsk.length > 0 && (
            <Card>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span>❓</span>{p.serpPaa}</div>
              <div className="mb-2.5 text-xs text-[var(--text-2)]">💡 {p.serpPaaHint}</div>
              <ul className="space-y-2">
                {data.peopleAlsoAsk.slice(0, 8).map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--text)]"><span className="text-[var(--crimson)]">›</span>{q}</li>
                ))}
              </ul>
            </Card>
          )}

          {data.relatedSearches.length > 0 && (
            <Card>
              <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span>🔎</span>{p.serpRelated}</div>
              <div className="flex flex-wrap gap-2">
                {data.relatedSearches.slice(0, 12).map((s, i) => (
                  <button key={i} onClick={() => searchFor(s)} className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)]">{s}</button>
                ))}
              </div>
            </Card>
          )}

          {data.ads.length > 0 && (
            <Card>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span>🟨</span>{p.serpAds}</div>
              <div className="mb-2.5 text-xs text-[var(--text-2)]">💡 {p.serpAdsHint}</div>
              <div className="flex flex-wrap gap-2">
                {data.ads.slice(0, 8).map((a, i) => (
                  <span key={i} className="rounded-full bg-[var(--subtle)] px-2.5 py-1 font-mono text-xs text-[var(--text-2)]">{a.domain || a.title}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {data && organic.length > 0 && (
        <div className="space-y-2.5">
          <SectionTitle>{p.serpOrganicTitle}</SectionTitle>
          {organic.map((r, i) => {
            const isPlatform = MEGA_PLATFORMS.has(norm(r.domain))
            return (
              <div key={i} className={`rounded-2xl border bg-[var(--card)] p-4 transition-colors ${isPlatform ? 'border-[var(--line)] opacity-70' : 'border-[var(--line)] hover:border-[var(--text-3)]'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tnum" style={{ color: positionTone(r.position).c, background: positionTone(r.position).bg }}>{r.position ?? '—'}</div>
                  <div className="min-w-0 flex-1">
                    <a href={r.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-[var(--text)] hover:text-[var(--crimson)]">{r.title || r.url}</a>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-[var(--text-2)]">{r.domain}</span>
                      {isPlatform && <Pill tone="neutral">{p.platform}</Pill>}
                    </div>
                    {r.description && <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-2)]">{r.description}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState
          icon="📊"
          title={p.emptySerpT}
          hint={p.emptySerpH}
          chipsLabel={p.examples}
          chips={KW_EXAMPLES[lang].map((ex) => ({ label: ex, onClick: () => { setKeyword(ex); run({ keyword: ex, location, language, device, city }) } }))}
        />
      )}
    </Page>
  )
}
