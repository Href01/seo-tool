'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePT, useT } from '@/lib/i18n'
import { Page, Card, Button, Spinner, EmptyState, StatCard, SectionTitle, DistributionBar, visibilityScore } from '@/components/ui'

interface Project { id: string; name: string; domain: string; createdAt?: string }
interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

const CLAMP = 30
function posBadge(position: number | null) {
  if (position == null) return { label: '>100', c: 'text-[var(--text-2)]', b: 'bg-[var(--subtle)]' }
  if (position <= 3) return { label: `#${position}`, c: 'text-[var(--up)]', b: 'bg-[var(--up-bg)]' }
  if (position <= 10) return { label: `#${position}`, c: 'text-amber-700', b: 'bg-amber-100' }
  if (position <= 20) return { label: `#${position}`, c: 'text-[var(--crimson)]', b: 'bg-[var(--crimson)]/10' }
  return { label: `#${position}`, c: 'text-[var(--text-2)]', b: 'bg-[var(--subtle)]' }
}
const norm = (d: string) => d.toLowerCase().replace(/^www\./, '')
const clamp = (p: number | null) => (p == null ? CLAMP : Math.min(p, CLAMP))

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const p = usePT()
  const { t } = useT()

  const [project, setProject] = useState<Project | null>(null)
  const [tracked, setTracked] = useState<TrackedKeyword[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      const data = await res.json()
      setProject(data.project)
    } catch (e) { console.error(e) }
  }
  async function loadTracking() {
    try { const res = await fetch('/api/rank'); const data = await res.json(); setTracked(data.items || []) } catch (e) { console.error(e) }
  }
  useEffect(() => { loadProject(); loadTracking() }, [id])

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
      const res = await fetch('/api/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, domain: project.domain }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setKeyword('')
      await loadTracking()
    } catch (e: any) { setError(e.message || 'Erreur') } finally { setLoading(false) }
  }
  async function check(kid: number) {
    setBusyId(kid)
    try { await fetch('/api/rank/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: kid }) }); await loadTracking() } finally { setBusyId(null) }
  }
  async function remove(kid: number) {
    setBusyId(kid)
    try { await fetch('/api/rank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: kid }) }); await loadTracking() } finally { setBusyId(null) }
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
          <div className="text-end">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)]">{p.visibility}</div>
            <div className="mt-0.5 flex items-baseline justify-end gap-1 text-4xl font-bold text-[var(--crimson)] tnum">{stats.vis}<span className="text-sm font-medium text-[var(--text-3)]">/100</span></div>
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
        <StatCard label={p.trackedKw} value={kws.length} accent />
        <StatCard label={t.top3} value={stats.top3} />
        <StatCard label={t.top10} value={stats.top10} />
        <StatCard label={t.avgPos} value={kws.length ? stats.avg : '—'} />
      </div>

      {/* QUICK ACTIONS */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">🔍</div><div className="font-semibold text-[var(--text)]">{p.actSearch}</div><div className="text-sm text-[var(--text-2)]">{p.actSearchSub}</div></Card></Link>
        <Link href="/serp"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">📊</div><div className="font-semibold text-[var(--text)]">{p.actSerp}</div><div className="text-sm text-[var(--text-2)]">{p.actSerpSub}</div></Card></Link>
        <Link href="/tracker"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">📈</div><div className="font-semibold text-[var(--text)]">{p.fullTracking}</div><div className="text-sm text-[var(--text-2)]">{t.positionOverTime}</div></Card></Link>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">{p.trackForSite}</h2>
        <form onSubmit={addKeyword} className="flex flex-col gap-2 sm:flex-row">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.kwPlaceholder} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
          <Button type="submit" disabled={loading || !project}>{loading ? <><Spinner /> …</> : t.add}</Button>
        </form>
        {error && <div className="mt-3 text-sm text-[var(--down)]">{error}</div>}
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
                      {it.checkedAt && <div className="text-xs text-[var(--text-3)]">{new Date(it.checkedAt).toLocaleDateString('fr')}</div>}
                    </div>
                    <svg width="56" height="22" viewBox="0 0 56 22" fill="none" className="shrink-0"><polyline points={spark || '0,11 56,11'} stroke={dcol} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="w-8 text-end text-[11px] font-bold tnum" style={{ color: dcol }}>{delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : '–'}</span>
                    <div className={`flex items-center rounded-lg px-3 py-1.5 ${badge.b}`}><span className={`text-base font-bold tnum ${badge.c}`}>{badge.label}</span></div>
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
