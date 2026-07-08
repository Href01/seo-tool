'use client'

import { useState, useMemo } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { useT, usePT } from '@/lib/i18n'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, Pill } from '@/components/ui'

interface SerpResult { position: number | null; title: string; url: string; domain: string; description: string }

const MEGA_PLATFORMS = new Set(['instagram.com', 'facebook.com', 'youtube.com', 'pinterest.com', 'tiktok.com', 'twitter.com', 'x.com', 'linkedin.com', 'wikipedia.org', 'reddit.com'])
const norm = (d: string) => d.toLowerCase().replace(/^www\./, '')

export default function SerpPage() {
  const { lang } = useT()
  const p = usePT()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<SerpResult[]>('/api/serp')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    run({ keyword, location, language, device })
  }

  const insights = useMemo(() => {
    if (!data) return null
    const domains = new Set(data.map((r) => norm(r.domain)))
    const platforms = data.filter((r) => MEGA_PLATFORMS.has(norm(r.domain))).length
    return { uniqueDomains: domains.size, platforms, realCompetitors: data.length - platforms }
  }, [data])

  function posClass(pos: number | null) {
    if ((pos ?? 99) <= 3) return 'bg-[var(--up-bg)] text-[var(--up)]'
    if ((pos ?? 99) <= 10) return 'bg-amber-100 text-amber-700'
    return 'bg-[var(--subtle)] text-[var(--text-2)]'
  }

  return (
    <Page>
      <PageHeader title={p.serpTitle} subtitle={p.serpSub} />
      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{p.kwLabel}</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={p.kwPh} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <LocationSelector value={location} onChange={setLocation} />
            <DeviceSelector value={device} onChange={setDevice} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (<><Spinner /> {p.analyzing}</>) : p.analyze}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} extra={`${data.length} ${p.results}`} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && insights && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label={p.uniqueDomains} value={insights.uniqueDomains} sub={`${p.onN} ${data.length} ${p.results}`} />
          <StatCard label={p.realComp} value={insights.realCompetitors} accent />
          <StatCard label={p.platformsStat} value={insights.platforms} />
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2.5">
          {data.map((r, i) => {
            const isPlatform = MEGA_PLATFORMS.has(norm(r.domain))
            return (
              <div key={i} className={`rounded-2xl border bg-[var(--card)] p-4 transition-colors ${isPlatform ? 'border-[var(--line)] opacity-70' : 'border-[var(--line)] hover:border-[var(--text-3)]'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tnum ${posClass(r.position)}`}>{r.position ?? '—'}</div>
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

      {!data && !loading && !error && <EmptyState icon="📊" title={p.emptySerpT} hint={p.emptySerpH} />}
    </Page>
  )
}
