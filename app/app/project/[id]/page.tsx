'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePT, useT } from '@/lib/i18n'
import { DEFAULT_LANGUAGE, DEFAULT_LOCATION, getLanguageByCode, getLocationByCode, locName } from '@/lib/locations'
import { LocationSelector, LanguageSelector } from '@/components/LocationSelector'
import { Page, Card, Button, Spinner, EmptyState, StatCard, SectionTitle, DistributionBar, visibilityScore, Callout, InfoTip, ErrorBox, RingGauge } from '@/components/ui'
import { errorMessage } from '@/lib/errors'
import { positionTone } from '@/lib/status'

interface Project { id: string; name: string; domain: string; createdAt?: string }
interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  location: number
  language: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

const CLAMP = 30
function posBadge(position: number | null) {
  const t = positionTone(position)
  return { label: position == null ? '>100' : `#${position}`, c: t.c, b: t.bg }
}
const norm = (d: string) => d.toLowerCase().replace(/^www\./, '')
// Score color: high visibility is good (green), low is weak (crimson).
const scoreColor = (v: number) => (v >= 60 ? 'var(--up)' : v >= 30 ? '#d97706' : 'var(--crimson)')
const clamp = (p: number | null) => (p == null ? CLAMP : Math.min(p, CLAMP))
function marketLabel(location: number, language: string, uiLang: string) {
  const loc = getLocationByCode(location) ?? DEFAULT_LOCATION
  const searchLang = getLanguageByCode(language) ?? DEFAULT_LANGUAGE
  return `${loc.flag} ${locName(loc, uiLang)} · ${searchLang.name}`
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const p = usePT()
  const { t, lang } = useT()

  const [project, setProject] = useState<Project | null>(null)
  const [tracked, setTracked] = useState<TrackedKeyword[]>([])
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [searchLang, setSearchLang] = useState(DEFAULT_LANGUAGE.code)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setProject(data.project)
    } catch (e: unknown) { setError(errorMessage(e)) }
  }
  async function loadTracking() {
    try {
      const res = await fetch('/api/rank')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setTracked(data.items || [])
    } catch (e: unknown) { setError(errorMessage(e)) }
  }
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => { queueMicrotask(() => { void loadProject(); void loadTracking() }) }, [id])
  /* eslint-enable react-hooks/exhaustive-deps */

  const kws = useMemo(() => {
    if (!project) return []
    const dom = norm(project.domain)
    return tracked.filter((tk) => norm(tk.domain) === dom)
  }, [tracked, project])

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || !project) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, domain: project.domain, location, language: searchLang }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setKeyword('')
      await loadTracking()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setLoading(false) }
  }
  async function check(kid: number) {
    setBusyId(kid)
    try {
      const res = await fetch('/api/rank/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: kid }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await loadTracking()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setBusyId(null) }
  }
  async function remove(kid: number) {
    setBusyId(kid)
    try {
      const res = await fetch('/api/rank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: kid }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await loadTracking()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setBusyId(null) }
  }

  const stats = useMemo(() => {
    const positions = kws.map((k) => k.position)
    const withPos = positions.filter((x): x is number => x != null)
    return {
      vis: visibilityScore(positions),
      top3: kws.filter((k) => k.position != null && k.position <= 3).length,
      top10: kws.filter((k) => k.position != null && k.position <= 10).length,
      avg: withPos.length ? Math.round(withPos.reduce((s, x) => s + x, 0) / withPos.length) : 0,
      dist: {
        t3: kws.filter((k) => k.position != null && k.position <= 3).length,
        t10: kws.filter((k) => k.position != null && k.position > 3 && k.position <= 10).length,
        t20: kws.filter((k) => k.position != null && k.position > 10 && k.position <= 20).length,
        beyond: kws.filter((k) => k.position == null || k.position > 20).length,
      },
    }
  }, [kws])

  if (notFound) {
    return (
      <Page>
        <EmptyState icon="🔍" title={p.projNotFound} hint={p.projNotFoundH} />
        <div className="mt-4 text-center"><Link href="/app" className="text-sm font-medium text-[var(--crimson)]">← {p.backToProjects}</Link></div>
      </Page>
    )
  }

  const initial = (project?.name || '?').charAt(0).toUpperCase()

  return (
    <Page>
      <Link href="/app" className="mb-4 inline-block text-sm text-[var(--text-2)] transition-colors hover:text-[var(--crimson)]">← {p.backToProjects}</Link>

      <Callout>{p.helpProjectDetail}</Callout>

      {/* HERO */}
      <Card className="mb-6 !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--crimson)] to-[#ff5c8a] text-2xl font-bold text-white">{initial}</div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-[-0.02em]">{project?.name || '…'}</h1>
              {project && (
                <a href={`https://${project.domain}`} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 font-mono text-sm text-[var(--text-2)] hover:text-[var(--crimson)]">
                  {project.domain} <span className="text-xs">↗</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)]">{p.visibility}<InfoTip text={p.gVisibility} /></div>
            <RingGauge value={stats.vis} size={96} stroke={9} color={scoreColor(stats.vis)} sub="/100" />
          </div>
        </div>
        <div className="border-t border-[var(--line)] px-6 py-4">
          <DistributionBar segments={[
            { label: t.top3, value: stats.dist.t3, color: '#16a34a' },
            { label: p.rng4_10, value: stats.dist.t10, color: '#d97706' },
            { label: p.rng11_20, value: stats.dist.t20, color: '#ec0b43' },
            { label: p.rng21p, value: stats.dist.beyond, color: '#d4d4d8' },
          ]} />
        </div>
      </Card>

      <div className="mb-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
        <StatCard label={p.trackedKw} value="—" num={kws.length} tone="blue" />
        <StatCard label={t.top3} value="—" num={stats.top3} tone="teal" />
        <StatCard label={t.top10} value="—" num={stats.top10} tone="violet" />
        <StatCard label={t.avgPos} value={kws.length ? stats.avg : '—'} num={kws.length ? stats.avg : undefined} tone="pink" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">🔍</div><div className="font-semibold text-[var(--text)]">{p.actSearch}</div><div className="text-sm text-[var(--text-2)]">{p.actSearchSub}</div></Card></Link>
        <Link href="/serp"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">📊</div><div className="font-semibold text-[var(--text)]">{p.actSerp}</div><div className="text-sm text-[var(--text-2)]">{p.actSerpSub}</div></Card></Link>
        <Link href="/tracker"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">📈</div><div className="font-semibold text-[var(--text)]">{p.fullTracking}</div><div className="text-sm text-[var(--text-2)]">{t.positionOverTime}</div></Card></Link>
      </div>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">{p.trackForSite}</h2>
        <p className="mb-3 text-xs text-[var(--text-3)]">💸 {p.helpTrackFree}</p>
        <form onSubmit={addKeyword} className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.kwPlaceholder} className="self-end rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
          <LocationSelector value={location} onChange={setLocation} />
          <LanguageSelector value={searchLang} onChange={setSearchLang} />
          <Button type="submit" disabled={loading || !project} className="self-end">{loading ? <><Spinner /> …</> : t.add}</Button>
        </form>
        {error && <div className="mt-3"><ErrorBox message={error} /></div>}
      </Card>

      {kws.length === 0 ? (
        <EmptyState icon="📈" title={p.noKwForSite} hint={p.addKwHint} />
      ) : (
        <>
          <SectionTitle>{p.positionsOfSite}</SectionTitle>
          <div className="space-y-2">
            {kws.map((it) => {
              const badge = posBadge(it.position)
              const h = it.history
              const delta = h.length >= 2 ? (h[h.length - 2].position ?? 999) - (h[h.length - 1].position ?? 999) : 0
              const dcol = delta > 0 ? '#16a34a' : delta < 0 ? '#e11d48' : '#a1a1aa'
              const spark = h.slice(-10).map((pt, i, arr) => {
                const x = arr.length === 1 ? 28 : (i / (arr.length - 1)) * 56
                const y = (clamp(pt.position) / CLAMP) * 20 + 1
                return `${x.toFixed(1)},${y.toFixed(1)}`
              }).join(' ')
              return (
                <Card key={it.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--text)]">{it.keyword}</div>
                      <div className="text-xs text-[var(--text-3)]">{marketLabel(it.location, it.language, lang)}</div>
                      {it.checkedAt && <div className="text-xs text-[var(--text-3)]">{new Date(it.checkedAt).toLocaleDateString('fr')}</div>}
                    </div>
                    <svg width="56" height="22" viewBox="0 0 56 22" fill="none" className="shrink-0"><polyline points={spark || '0,11 56,11'} stroke={dcol} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="w-8 text-end text-[11px] font-bold tnum" style={{ color: dcol }}>{delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : '–'}</span>
                    <div className="flex items-center rounded-lg px-3 py-1.5" style={{ background: badge.b }}><span className="text-base font-bold tnum" style={{ color: badge.c }}>{badge.label}</span></div>
                    <div className="flex gap-2">
                      <button onClick={() => check(it.id)} disabled={busyId === it.id} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text)] disabled:opacity-50">{busyId === it.id ? '…' : t.verify}</button>
                      <button onClick={() => remove(it.id)} disabled={busyId === it.id} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--down)] transition-colors hover:bg-[var(--down-bg)] disabled:opacity-50">{p.del}</button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </Page>
  )
}
