'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePT, useT } from '@/lib/i18n'
import { Page, PageHeader, Card, Button, Spinner, EmptyState, StatCard, SectionTitle } from '@/components/ui'

interface Project { id: string; name: string; domain: string; createdAt?: string }
interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

function posBadge(position: number | null) {
  if (position == null) return { label: '> 100', c: 'text-[var(--text-2)]', b: 'bg-[var(--subtle)]' }
  if (position <= 3) return { label: `#${position}`, c: 'text-[var(--up)]', b: 'bg-[var(--up-bg)]' }
  if (position <= 10) return { label: `#${position}`, c: 'text-amber-700', b: 'bg-amber-100' }
  if (position <= 20) return { label: `#${position}`, c: 'text-[var(--crimson)]', b: 'bg-[var(--crimson)]/10' }
  return { label: `#${position}`, c: 'text-[var(--text-2)]', b: 'bg-[var(--subtle)]' }
}
const norm = (d: string) => d.toLowerCase().replace(/^www\./, '')

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

  const projectKeywords = useMemo(() => {
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
    const topThree = projectKeywords.filter((it) => it.position && it.position <= 3).length
    const topTen = projectKeywords.filter((it) => it.position && it.position <= 10).length
    const withPos = projectKeywords.filter((it) => it.position)
    const avgPosition = withPos.length ? withPos.reduce((s, it) => s + (it.position || 0), 0) / withPos.length : 0
    return { topThree, topTen, avgPosition }
  }, [projectKeywords])

  if (notFound) {
    return (
      <Page>
        <EmptyState icon="🔍" title={p.projNotFound} hint={p.projNotFoundH} />
        <div className="mt-4 text-center"><Link href="/app" className="text-sm font-medium text-[var(--crimson)]">← {p.backToProjects}</Link></div>
      </Page>
    )
  }

  return (
    <Page>
      <Link href="/app" className="mb-4 inline-block text-sm text-[var(--text-2)] transition-colors hover:text-[var(--crimson)]">← {p.backToProjects}</Link>
      <PageHeader title={project?.name || '…'} subtitle={project ? project.domain : undefined} />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label={p.trackedKw} value={projectKeywords.length} accent />
        <StatCard label={t.top3} value={stats.topThree} />
        <StatCard label={t.top10} value={stats.topTen} />
        <StatCard label={t.avgPos} value={projectKeywords.length ? stats.avgPosition.toFixed(0) : '—'} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">🔍</div><div className="font-semibold text-[var(--text)]">{p.actSearch}</div><div className="text-sm text-[var(--text-2)]">{p.actSearchSub}</div></Card></Link>
        <Link href="/serp"><Card className="transition-colors hover:border-[var(--crimson)]"><div className="mb-1 text-lg">📊</div><div className="font-semibold text-[var(--text)]">{p.actSerp}</div><div className="text-sm text-[var(--text-2)]">{p.actSerpSub}</div></Card></Link>
        <Card><div className="mb-1 text-lg">🩺</div><div className="font-semibold text-[var(--text-2)]">{p.auditSite}</div><div className="text-sm text-[var(--text-3)]">{p.soon}</div></Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">{p.trackForSite}</h2>
        <form onSubmit={addKeyword} className="flex flex-col gap-2 sm:flex-row">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.kwPlaceholder} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
          <Button type="submit" disabled={loading || !project}>{loading ? <><Spinner /> …</> : t.add}</Button>
        </form>
        {error && <div className="mt-3 text-sm text-[var(--down)]">{error}</div>}
      </Card>

      {projectKeywords.length === 0 ? (
        <EmptyState icon="📈" title={p.noKwForSite} hint={p.addKwHint} />
      ) : (
        <>
          <SectionTitle>{p.positionsOfSite}</SectionTitle>
          <div className="space-y-2.5">
            {projectKeywords.map((it) => {
              const badge = posBadge(it.position)
              return (
                <Card key={it.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--text)]">{it.keyword}</div>
                      {it.checkedAt && <div className="text-xs text-[var(--text-3)]">{new Date(it.checkedAt).toLocaleDateString('fr')}</div>}
                    </div>
                    <div className={`flex items-center rounded-lg px-3 py-1.5 ${badge.b}`}><span className={`text-lg font-bold tnum ${badge.c}`}>{badge.label}</span></div>
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
