'use client'

import { useEffect, useState, useMemo } from 'react'
import { Page, PageHeader, Card, Button, ErrorBox, EmptyState, StatCard, SectionTitle } from '@/components/ui'

interface BankEntry {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  source: string | null
  timesSearched: number
  lastSeen: string
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (!diff) return <span className="text-[var(--text-3)]">—</span>
  const cfg =
    diff < 30
      ? 'bg-[var(--up-bg)] text-[var(--up)]'
      : diff < 60
      ? 'bg-amber-100 text-amber-700'
      : 'bg-[var(--down-bg)] text-[var(--down)]'
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tnum ${cfg}`}>{diff}</span>
}

export default function DatabasePage() {
  const [items, setItems] = useState<BankEntry[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'cpc' | 'timesSearched'>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [minVolume, setMinVolume] = useState('')

  async function load(q = '') {
    setError('')
    try {
      const res = await fetch(`/api/database?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setItems(data.items || [])
      setCount(data.count ?? 0)
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = items
    if (difficultyFilter !== 'all') {
      result = result.filter((k) => {
        if (!k.difficulty) return false
        if (difficultyFilter === 'easy') return k.difficulty < 30
        if (difficultyFilter === 'medium') return k.difficulty >= 30 && k.difficulty < 60
        return k.difficulty >= 60
      })
    }
    if (minVolume) result = result.filter((k) => k.volume && k.volume >= Number(minVolume))
    result = [...result].sort((a, b) => {
      const valA = Number(a[sortBy] ?? 0)
      const valB = Number(b[sortBy] ?? 0)
      return sortDir === 'asc' ? valA - valB : valB - valA
    })
    return result
  }, [items, difficultyFilter, minVolume, sortBy, sortDir])

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  function exportCSV() {
    const headers = ['Mot-clé', 'Volume', 'CPC', 'Difficulté', 'Vu fois', 'Source']
    const rows = filtered.map((r) => [r.keyword, r.volume ?? '', r.cpc ?? '', r.difficulty ?? '', r.timesSearched, r.source ?? ''])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword-bank-${Date.now()}.csv`
    a.click()
  }

  const stats = useMemo(() => {
    const totalVolume = items.reduce((s, k) => s + (k.volume || 0), 0)
    const withDiff = items.filter((k) => k.difficulty)
    const avgDifficulty = withDiff.length ? withDiff.reduce((s, k) => s + (k.difficulty || 0), 0) / withDiff.length : 0
    const topKeywords = [...items].filter((k) => k.volume).sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 3)
    return { totalVolume, avgDifficulty, topKeywords }
  }, [items])

  const th = 'cursor-pointer select-none px-4 py-3 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]'

  return (
    <Page>
      <PageHeader
        title="Base de mots-clés MENA"
        subtitle="Asset propriétaire qui s'enrichit à chaque recherche — impossible à répliquer"
        right={<Button variant="ghost" onClick={exportCSV}>Export CSV</Button>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label="Total base" value={count?.toLocaleString('fr') ?? '—'} sub="Mots-clés uniques" accent />
        <StatCard label="Volume total" value={stats.totalVolume.toLocaleString('fr')} sub="Recherches / mois" />
        <StatCard label="Difficulté moy." value={stats.avgDifficulty.toFixed(0)} sub="Sur 100" />
        <StatCard label="Affichés" value={filtered.length} sub="Après filtres" />
      </div>

      {stats.topKeywords.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Top 3 volume</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.topKeywords.map((k, i) => (
              <div key={i} className="rounded-xl bg-[var(--subtle)] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                  <div className="flex-1 truncate text-sm font-medium text-[var(--text)]">{k.keyword}</div>
                </div>
                <div className="mt-2 text-xs text-[var(--text-2)] tnum">
                  {k.volume?.toLocaleString('fr')} vol. · diff. {k.difficulty ?? '?'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            load(search)
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans la base (ex : cheveux)…"
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
            />
            <Button type="submit">Chercher</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--crimson)]"
            >
              <option value="all">Toutes difficultés</option>
              <option value="easy">Facile (&lt;30)</option>
              <option value="medium">Moyen (30-60)</option>
              <option value="hard">Difficile (60+)</option>
            </select>
            <input
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              placeholder="Volume min."
              className="w-32 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--crimson)]"
            />
          </div>
        </form>
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {filtered.length === 0 && !error ? (
        <EmptyState icon="🗃️" title="Base vide ou aucun résultat" hint="Fais des recherches de mots-clés — chaque lookup enrichit la base." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--line)] bg-[var(--subtle)]">
                <tr>
                  <th className={`${th} text-left`}>Mot-clé</th>
                  <th className={`${th} text-right`} onClick={() => toggleSort('volume')}>Volume {sortBy === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className={`${th} text-center`} onClick={() => toggleSort('difficulty')}>Difficulté {sortBy === 'difficulty' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className={`${th} text-right`} onClick={() => toggleSort('cpc')}>CPC {sortBy === 'cpc' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className={`${th} text-right`} onClick={() => toggleSort('timesSearched')}>Vu × {sortBy === 'timesSearched' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className={`${th} text-left`}>Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map((it, i) => (
                  <tr key={i} className="transition-colors hover:bg-[var(--subtle)]">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{it.keyword}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-2)] tnum">{it.volume?.toLocaleString('fr') ?? '—'}</td>
                    <td className="px-4 py-3 text-center"><DiffBadge diff={it.difficulty} /></td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-2)] tnum">{it.cpc != null ? `${it.cpc.toFixed(2)} $` : '—'}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-3)] tnum">{it.timesSearched}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-3)]">{it.source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Page>
  )
}
