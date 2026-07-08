'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePT, useT } from '@/lib/i18n'
import { Page, WorkspaceHeader, Card, Button, ErrorBox, EmptyState, StatCard, SectionTitle, Callout, InfoTip } from '@/components/ui'
import { errorMessage } from '@/lib/errors'

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

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
  const cfg = diff < 30 ? 'bg-[var(--up-bg)] text-[var(--up)]' : diff < 60 ? 'bg-amber-100 text-amber-700' : 'bg-[var(--down-bg)] text-[var(--down)]'
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tnum ${cfg}`}>{diff}</span>
}

export default function DatabasePage() {
  const p = usePT()
  const { t } = useT()
  const [items, setItems] = useState<BankEntry[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'cpc' | 'timesSearched'>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [minVolume, setMinVolume] = useState('')

  async function load(q = '') {
    setError('')
    try {
      const res = await fetch(`/api/database?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setItems(data.items || [])
      setCount(data.count ?? 0)
    } catch (e: unknown) { setError(errorMessage(e)) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])

  function setDifficulty(value: string) {
    if (value === 'all' || value === 'easy' || value === 'medium' || value === 'hard') {
      setDifficultyFilter(value)
    }
  }

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
      const valA = Number(a[sortBy] ?? 0), valB = Number(b[sortBy] ?? 0)
      return sortDir === 'asc' ? valA - valB : valB - valA
    })
    return result
  }, [items, difficultyFilter, minVolume, sortBy, sortDir])

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(field); setSortDir('desc') }
  }
  function exportCSV() {
    const rows = filtered.map((r) => [r.keyword, r.volume ?? '', r.cpc ?? '', r.difficulty ?? '', r.timesSearched, r.source ?? ''])
    const csv = [[p.kwCol, p.volCol, p.cpcCol, p.diffCol, p.seenCol, p.sourceCol], ...rows].map((r) => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `keyword-bank-${Date.now()}.csv`; a.click()
  }
  function copyClip() {
    navigator.clipboard.writeText(filtered.map((k) => `${k.keyword}\t${k.volume ?? ''}\t${k.cpc ?? ''}\t${k.difficulty ?? ''}`).join('\n'))
  }

  const stats = useMemo(() => {
    const totalVolume = items.reduce((s, k) => s + (k.volume || 0), 0)
    const withDiff = items.filter((k) => k.difficulty)
    const avgDifficulty = withDiff.length ? withDiff.reduce((s, k) => s + (k.difficulty || 0), 0) / withDiff.length : 0
    const topKeywords = [...items].filter((k) => k.volume).sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 3)
    return { totalVolume, avgDifficulty, topKeywords }
  }, [items])

  const th = 'cursor-pointer select-none px-4 py-3 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]'
  const arrow = (f: typeof sortBy) => (sortBy === f ? (sortDir === 'asc' ? '↑' : '↓') : '')

  return (
    <Page>
      <WorkspaceHeader icon="🗃️" title={p.dbTitle} subtitle={p.dbSub} right={<Button variant="ghost" onClick={exportCSV}>{p.exportCsv}</Button>} />
      <Callout>{p.helpDatabase}</Callout>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label={p.totalBase} value={count?.toLocaleString('fr') ?? '—'} sub={p.uniqueKw} accent />
        <StatCard label={p.volTotalLabel} value={stats.totalVolume.toLocaleString('fr')} sub={t.perMonth} info={p.gVolume} />
        <StatCard label={p.avgDiffLabel} value={stats.avgDifficulty.toFixed(0)} sub={t.outOf100} info={p.gDifficulty} />
        <StatCard label={p.shown} value={filtered.length} sub={p.afterFilters} />
      </div>

      {stats.topKeywords.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>{p.top3Vol}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.topKeywords.map((k, i) => (
              <div key={i} className="rounded-xl bg-[var(--subtle)] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                  <div className="flex-1 truncate text-sm font-medium text-[var(--text)]">{k.keyword}</div>
                </div>
                <div className="mt-2 text-xs text-[var(--text-2)] tnum">{k.volume?.toLocaleString('fr')} · KD {k.difficulty ?? '?'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); load(search) }} className="space-y-3">
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={p.searchDbPh} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
            <Button type="submit">{p.searchBtn}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={difficultyFilter} onChange={(e) => setDifficulty(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--crimson)]">
              <option value="all">{p.allDiff}</option>
              <option value="easy">{t.easy} (&lt;30)</option>
              <option value="medium">{t.medium} (30-60)</option>
              <option value="hard">{t.hard} (60+)</option>
            </select>
            <input type="number" value={minVolume} onChange={(e) => setMinVolume(e.target.value)} placeholder={p.minVol} className="w-32 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--crimson)]" />
            <Button type="button" variant="ghost" onClick={copyClip}>{p.copy}</Button>
          </div>
        </form>
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {filtered.length === 0 && !error ? (
        <EmptyState icon="🗃️" title={p.emptyDbT} hint={p.emptyDbH} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--line)] bg-[var(--subtle)]">
                <tr>
                  <th className={`${th} text-start`}>{p.kwCol}</th>
                  <th className={`${th} text-end`} onClick={() => toggleSort('volume')}>{p.volCol}<InfoTip text={p.gVolume} /> {arrow('volume')}</th>
                  <th className={`${th} text-center`} onClick={() => toggleSort('difficulty')}>{p.diffCol}<InfoTip text={p.gDifficulty} /> {arrow('difficulty')}</th>
                  <th className={`${th} text-end`} onClick={() => toggleSort('cpc')}>{p.cpcCol}<InfoTip text={p.gCpc} /> {arrow('cpc')}</th>
                  <th className={`${th} text-end`} onClick={() => toggleSort('timesSearched')}>{p.seenCol}<InfoTip text={p.gSeen} /> {arrow('timesSearched')}</th>
                  <th className={`${th} text-start`}>{p.sourceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map((it, i) => (
                  <tr key={i} className="transition-colors hover:bg-[var(--subtle)]">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{it.keyword}</td>
                    <td className="px-4 py-3 text-end text-sm text-[var(--text-2)] tnum">{it.volume?.toLocaleString('fr') ?? '—'}</td>
                    <td className="px-4 py-3 text-center"><DiffBadge diff={it.difficulty} /></td>
                    <td className="px-4 py-3 text-end text-sm text-[var(--text-2)] tnum">{it.cpc != null ? `${it.cpc.toFixed(2)} $` : '—'}</td>
                    <td className="px-4 py-3 text-end text-sm text-[var(--text-3)] tnum">{it.timesSearched}</td>
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
