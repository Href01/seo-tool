'use client'

import { useState, useMemo } from 'react'

export interface KeywordRow {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  trend?: number[] // sparkline data
  competition?: number | null
}

interface KeywordTableProps {
  keywords: KeywordRow[]
  onExport?: () => void
  showTrend?: boolean
}

export function KeywordTable({ keywords, onExport, showTrend = false }: KeywordTableProps) {
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'cpc'>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const filtered = useMemo(() => {
    let result = keywords.filter((k) =>
      k.keyword.toLowerCase().includes(filter.toLowerCase())
    )

    if (difficultyFilter !== 'all') {
      result = result.filter((k) => {
        if (!k.difficulty) return false
        if (difficultyFilter === 'easy') return k.difficulty < 30
        if (difficultyFilter === 'medium') return k.difficulty >= 30 && k.difficulty < 60
        if (difficultyFilter === 'hard') return k.difficulty >= 60
        return true
      })
    }

    result.sort((a, b) => {
      const valA = a[sortBy] ?? 0
      const valB = b[sortBy] ?? 0
      return sortDir === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [keywords, filter, difficultyFilter, sortBy, sortDir])

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  function getDifficultyBadge(diff: number | null) {
    if (!diff) return <span className="text-neutral-500">—</span>
    if (diff < 30)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#059669]/20 px-2.5 py-1 text-xs font-semibold text-[#10B981]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
          Facile · {diff}
        </span>
      )
    if (diff < 60)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 px-2.5 py-1 text-xs font-semibold text-[#D4AF37]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]"></span>
          Moyen · {diff}
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
        Difficile · {diff}
      </span>
    )
  }

  function copyToClipboard() {
    const text = filtered.map((k) => `${k.keyword}\t${k.volume ?? ''}\t${k.cpc ?? ''}\t${k.difficulty ?? ''}`).join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="🔍 Filtrer les mots-clés..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as any)}
          className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm text-neutral-100 outline-none transition-all focus:border-[#C9A961]"
        >
          <option value="all">Toutes difficultés</option>
          <option value="easy">✅ Facile (&lt;30)</option>
          <option value="medium">⚠️ Moyen (30-60)</option>
          <option value="hard">🔥 Difficile (60+)</option>
        </select>
        <button
          onClick={copyToClipboard}
          className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10"
        >
          📋 Copier
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-lg transition-all hover:shadow-xl"
          >
            📥 Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-neutral-400">
        <div>
          <span className="font-semibold text-[#C9A961]">{filtered.length}</span> mots-clés
        </div>
        <div>
          Volume total:{' '}
          <span className="font-semibold text-[#C9A961]">
            {filtered.reduce((sum, k) => sum + (k.volume || 0), 0).toLocaleString('fr')}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#C9A961]/20 bg-[#0F172A]/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                  Mot-clé
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                  onClick={() => toggleSort('volume')}
                >
                  Volume {sortBy === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                  onClick={() => toggleSort('cpc')}
                >
                  CPC {sortBy === 'cpc' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                  onClick={() => toggleSort('difficulty')}
                >
                  Difficulté {sortBy === 'difficulty' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A961]/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                    Aucun mot-clé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-[#C9A961]/5"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-100">
                      {row.keyword}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-300">
                      {row.volume !== null ? row.volume.toLocaleString('fr') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-300">
                      {row.cpc !== null ? `${row.cpc.toFixed(2)} $` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">{getDifficultyBadge(row.difficulty)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
