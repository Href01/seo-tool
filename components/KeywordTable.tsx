'use client'

import { useState, useMemo } from 'react'

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

export interface KeywordRow {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  trend?: number[]
  competition?: number | null
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (!diff) return <span className="text-[var(--text-3)]">—</span>
  const cfg =
    diff < 30
      ? { c: 'text-[var(--up)]', b: 'bg-[var(--up-bg)]', l: 'Facile' }
      : diff < 60
      ? { c: 'text-amber-700', b: 'bg-amber-100', l: 'Moyen' }
      : { c: 'text-[var(--down)]', b: 'bg-[var(--down-bg)]', l: 'Difficile' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.b} ${cfg.c}`}>
      <span className="tnum">{diff}</span>
      <span className="opacity-70">{cfg.l}</span>
    </span>
  )
}

export function KeywordTable({
  keywords,
  onExport,
  onSelect,
  activeKeyword,
}: {
  keywords: KeywordRow[]
  onExport?: () => void
  onSelect?: (keyword: string) => void
  activeKeyword?: string
}) {
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'cpc'>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  function setDifficulty(value: string) {
    if (value === 'all' || value === 'easy' || value === 'medium' || value === 'hard') {
      setDifficultyFilter(value)
    }
  }

  const filtered = useMemo(() => {
    let result = keywords.filter((k) => k.keyword.toLowerCase().includes(filter.toLowerCase()))
    if (difficultyFilter !== 'all') {
      result = result.filter((k) => {
        if (!k.difficulty) return false
        if (difficultyFilter === 'easy') return k.difficulty < 30
        if (difficultyFilter === 'medium') return k.difficulty >= 30 && k.difficulty < 60
        return k.difficulty >= 60
      })
    }
    result = [...result].sort((a, b) => {
      const valA = a[sortBy] ?? 0
      const valB = b[sortBy] ?? 0
      return sortDir === 'asc' ? valA - valB : valB - valA
    })
    return result
  }, [keywords, filter, difficultyFilter, sortBy, sortDir])

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  function copyToClipboard() {
    const text = filtered.map((k) => `${k.keyword}\t${k.volume ?? ''}\t${k.cpc ?? ''}\t${k.difficulty ?? ''}`).join('\n')
    navigator.clipboard.writeText(text)
  }

  const th =
    'cursor-pointer select-none px-4 py-3 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]'

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filtrer les mots-clés…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-[var(--crimson)]"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--crimson)]"
        >
          <option value="all">Toutes difficultés</option>
          <option value="easy">Facile (&lt;30)</option>
          <option value="medium">Moyen (30-60)</option>
          <option value="hard">Difficile (60+)</option>
        </select>
        <button
          onClick={copyToClipboard}
          className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
        >
          Copier
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="flex gap-4 px-1 text-xs text-[var(--text-2)]">
        <span>
          <span className="font-semibold text-[var(--text)]">{filtered.length}</span> mots-clés
        </span>
        <span>
          Volume total{' '}
          <span className="font-semibold text-[var(--text)] tnum">
            {filtered.reduce((s, k) => s + (k.volume || 0), 0).toLocaleString('fr')}
          </span>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--line)] bg-[var(--subtle)]">
              <tr>
                <th className={`${th} text-left`}>Mot-clé</th>
                <th className={`${th} text-right`} onClick={() => toggleSort('volume')}>
                  Volume {sortBy === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`${th} text-right`} onClick={() => toggleSort('cpc')}>
                  CPC {sortBy === 'cpc' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`${th} text-center`} onClick={() => toggleSort('difficulty')}>
                  Difficulté {sortBy === 'difficulty' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--text-3)]">
                    Aucun mot-clé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const active = onSelect && activeKeyword === row.keyword
                  return (
                    <tr
                      key={i}
                      onClick={onSelect ? () => onSelect(row.keyword) : undefined}
                      className={`transition-colors ${
                        onSelect ? 'cursor-pointer' : ''
                      } ${active ? 'bg-[var(--crimson)]/5' : 'hover:bg-[var(--subtle)]'}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">
                        <span className="flex items-center gap-1.5">
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--crimson)]" />}
                          {row.keyword}
                          {onSelect && (
                            <span className="ml-1 text-[var(--text-3)] opacity-0 transition-opacity group-hover:opacity-100">
                              →
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--text-2)] tnum">
                        {row.volume !== null ? row.volume.toLocaleString('fr') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--text-2)] tnum">
                        {row.cpc !== null ? `${row.cpc.toFixed(2)} $` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DiffBadge diff={row.difficulty} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
