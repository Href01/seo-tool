'use client'

import { useEffect, useState, useMemo } from 'react'

interface BankEntry {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  source: string | null
  timesSearched: number
  lastSeen: string
}

function getDifficultyBadge(diff: number | null) {
  if (!diff) return <span className="text-neutral-500">—</span>
  if (diff < 30)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#059669]/20 px-2 py-0.5 text-xs font-semibold text-[#10B981]">
        {diff}
      </span>
    )
  if (diff < 60)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
        {diff}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
      {diff}
    </span>
  )
}

export default function DatabasePage() {
  const [items, setItems] = useState<BankEntry[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'cpc' | 'timesSearched'>('volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [minVolume, setMinVolume] = useState<string>('')

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
        if (difficultyFilter === 'hard') return k.difficulty >= 60
        return true
      })
    }

    if (minVolume) {
      const min = Number(minVolume)
      result = result.filter((k) => k.volume && k.volume >= min)
    }

    result.sort((a, b) => {
      const valA = a[sortBy] ?? 0
      const valB = b[sortBy] ?? 0
      return sortDir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
    })

    return result
  }, [items, difficultyFilter, minVolume, sortBy, sortDir])

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  function exportCSV() {
    const headers = ['Mot-clé', 'Volume', 'CPC', 'Difficulté', 'Vu fois', 'Source']
    const rows = filtered.map((r) => [
      r.keyword,
      r.volume ?? '',
      r.cpc ?? '',
      r.difficulty ?? '',
      r.timesSearched,
      r.source ?? '',
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword-bank-${Date.now()}.csv`
    a.click()
  }

  function copyToClipboard() {
    const text = filtered
      .map((k) => `${k.keyword}\t${k.volume ?? ''}\t${k.cpc ?? ''}\t${k.difficulty ?? ''}`)
      .join('\n')
    navigator.clipboard.writeText(text)
  }

  const stats = useMemo(() => {
    const totalVolume = items.reduce((sum, k) => sum + (k.volume || 0), 0)
    const avgDifficulty =
      items.filter((k) => k.difficulty).reduce((sum, k) => sum + (k.difficulty || 0), 0) /
      (items.filter((k) => k.difficulty).length || 1)
    const topKeywords = [...items]
      .filter((k) => k.volume)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 3)
    return { totalVolume, avgDifficulty, topKeywords }
  }, [items])

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Base de Mots-Clés MENA
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Asset propriétaire qui s'enrichit à chaque recherche · Impossible à répliquer
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Total Base</div>
          <div className="mt-2 text-3xl font-bold text-[#C9A961]">
            {count?.toLocaleString('fr') ?? '—'}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Mots-clés uniques</div>
        </div>
        <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Volume Total</div>
          <div className="mt-2 text-3xl font-bold text-[#10B981]">
            {stats.totalVolume.toLocaleString('fr')}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Recherches/mois</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Difficulté Moy.</div>
          <div className="mt-2 text-3xl font-bold text-[#D4AF37]">
            {stats.avgDifficulty.toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Sur 100</div>
        </div>
        <div className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-purple-400/80">Affichés</div>
          <div className="mt-2 text-3xl font-bold text-purple-400">{filtered.length}</div>
          <div className="mt-1 text-xs text-neutral-500">Après filtres</div>
        </div>
      </div>

      {/* Top Keywords */}
      {stats.topKeywords.length > 0 && (
        <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-xl font-bold text-[#C9A961]">🏆 Top 3 Volume</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.topKeywords.map((k, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#C9A961]/10 bg-[#0F172A]/30 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
                  <div className="flex-1 truncate text-sm font-medium text-neutral-200">
                    {k.keyword}
                  </div>
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  {k.volume?.toLocaleString('fr')} vol. · diff. {k.difficulty ?? '?'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-6 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            load(search)
          }}
          className="space-y-4"
        >
          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Rechercher dans la base (ex : cheveux, téléphone...)"
              className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-2.5 font-semibold text-[#0F172A] shadow-lg transition-all hover:shadow-xl"
            >
              Chercher
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
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
            <input
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              placeholder="Volume min."
              className="w-32 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961]"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10"
            >
              📋 Copier
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10"
            >
              📥 Export CSV
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-400">Erreur</div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 && !error ? (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">📚</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">
            Base vide ou aucun résultat
          </h3>
          <p className="text-neutral-400">
            Fais des recherches de mots-clés — chaque lookup enrichit la base automatiquement.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#C9A961]/20 bg-[#1E293B]/40 shadow-2xl backdrop-blur-sm">
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
                    className="cursor-pointer px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                    onClick={() => toggleSort('difficulty')}
                  >
                    Difficulté {sortBy === 'difficulty' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                    onClick={() => toggleSort('cpc')}
                  >
                    CPC {sortBy === 'cpc' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                    onClick={() => toggleSort('timesSearched')}
                  >
                    Vu × {sortBy === 'timesSearched' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9A961]/10">
                {filtered.map((it, i) => (
                  <tr key={i} className="transition-colors hover:bg-[#C9A961]/5">
                    <td className="px-4 py-3 font-medium text-neutral-100">{it.keyword}</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-300">
                      {it.volume?.toLocaleString('fr') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">{getDifficultyBadge(it.difficulty)}</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-300">
                      {it.cpc != null ? `${it.cpc.toFixed(2)} $` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-400">
                      {it.timesSearched}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{it.source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
