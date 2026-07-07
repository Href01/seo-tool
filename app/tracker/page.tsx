'use client'

import { useEffect, useState, useMemo } from 'react'
import { Page, PageHeader, Card, Button, Spinner, ErrorBox, EmptyState, StatCard } from '@/components/ui'

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

function History({ points }: { points: { position: number | null; checkedAt: string }[] }) {
  if (points.length === 0) return <div className="text-xs text-[var(--text-3)]">Pas d'historique</div>
  const recent = points.slice(-20)
  return (
    <div className="flex h-12 items-end gap-0.5">
      {recent.map((p, i) => {
        const height = p.position == null ? 6 : Math.max(8, ((101 - Math.min(p.position, 100)) / 101) * 100)
        const prev = i > 0 ? recent[i - 1].position : null
        const better = p.position && prev && p.position < prev
        const worse = p.position && prev && p.position > prev
        return (
          <div
            key={i}
            title={`${new Date(p.checkedAt).toLocaleDateString('fr')} : ${p.position ?? '> 100'}`}
            className={`w-1.5 rounded-t ${better ? 'bg-[var(--up)]' : worse ? 'bg-[var(--down)]' : 'bg-[var(--crimson)]/40'}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

export default function TrackerPage() {
  const [items, setItems] = useState<TrackedKeyword[]>([])
  const [keyword, setKeyword] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    setError('')
    try {
      const res = await fetch('/api/rank')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setItems(data.items || [])
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || !domain.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setKeyword('')
      setDomain('')
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function check(id: number) {
    setBusyId(id)
    try {
      await fetch('/api/rank/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: number) {
    setBusyId(id)
    try {
      await fetch('/api/rank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const stats = useMemo(() => {
    const topThree = items.filter((it) => it.position && it.position <= 3).length
    const topTen = items.filter((it) => it.position && it.position <= 10).length
    const withPos = items.filter((it) => it.position)
    const avgPosition = withPos.length ? withPos.reduce((s, it) => s + (it.position || 0), 0) / withPos.length : 0
    const winners = items.filter((it) => {
      if (it.history.length < 2) return false
      const last = it.history[it.history.length - 1].position
      const prev = it.history[it.history.length - 2].position
      return last && prev && last < prev
    }).length
    const losers = items.filter((it) => {
      if (it.history.length < 2) return false
      const last = it.history[it.history.length - 1].position
      const prev = it.history[it.history.length - 2].position
      return last && prev && last > prev
    }).length
    return { topThree, topTen, avgPosition, winners, losers }
  }, [items])

  function exportCSV() {
    const headers = ['Mot-clé', 'Domaine', 'Position', 'Dernière vérif']
    const rows = items.map((it) => [it.keyword, it.domain, it.position ?? '> 100', it.checkedAt ? new Date(it.checkedAt).toLocaleDateString('fr') : ''])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rank-tracker-${Date.now()}.csv`
    a.click()
  }

  return (
    <Page>
      <PageHeader
        title="Suivi de positions"
        subtitle="Track tes rankings dans le temps · détecte progressions et chutes"
        right={items.length > 0 ? <Button variant="ghost" onClick={exportCSV}>Export CSV</Button> : undefined}
      />

      {items.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <StatCard label="Total suivi" value={items.length} sub="Mots-clés" />
          <StatCard label="Top 3" value={stats.topThree} sub="🏆 Podium" accent />
          <StatCard label="Top 10" value={stats.topTen} sub="⭐ Première page" />
          <StatCard label="Pos. moyenne" value={items.length ? stats.avgPosition.toFixed(0) : '—'} sub="Position moyenne" />
          <StatCard label="Tendance" value={<span><span className="text-[var(--up)]">↑{stats.winners}</span> <span className="text-[var(--down)]">↓{stats.losers}</span></span>} sub="Gains / pertes" />
        </div>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Ajouter un suivi</h2>
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mot-clé (ex : coloration cheveux)"
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Ton domaine (ex : monsite.ma)"
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <Button type="submit" disabled={loading}>{loading ? <><Spinner /> Ajout…</> : 'Suivre'}</Button>
        </form>
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {items.length === 0 && !error ? (
        <EmptyState icon="📈" title="Commence à tracker tes positions" hint="Ajoute un mot-clé — la position est vérifiée immédiatement." />
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => {
            const badge = posBadge(it.position)
            return (
              <Card key={it.id} padded={false} className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[var(--text)]">{it.keyword}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
                      <span>{it.domain}</span>
                      {it.checkedAt && <span>· {new Date(it.checkedAt).toLocaleDateString('fr')}</span>}
                    </div>
                  </div>
                  <div className={`flex items-center rounded-lg px-3 py-1.5 ${badge.b}`}>
                    <span className={`text-lg font-bold tnum ${badge.c}`}>{badge.label}</span>
                  </div>
                  <div className="w-40">
                    <History points={it.history} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => check(it.id)}
                      disabled={busyId === it.id}
                      className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text)] disabled:opacity-50"
                    >
                      {busyId === it.id ? '…' : 'Vérifier'}
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      disabled={busyId === it.id}
                      className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--down)] transition-colors hover:bg-[var(--down-bg)] disabled:opacity-50"
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Page>
  )
}
