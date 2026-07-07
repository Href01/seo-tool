'use client'

import { useEffect, useState, useMemo } from 'react'

interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

function getPositionBadge(position: number | null) {
  if (position == null) {
    return {
      label: '> 100',
      color: 'text-neutral-500',
      bg: 'bg-neutral-500/20',
      icon: '❌',
    }
  }
  if (position <= 3) {
    return { label: `#${position}`, color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', icon: '🏆' }
  }
  if (position <= 10) {
    return { label: `#${position}`, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/20', icon: '⭐' }
  }
  if (position <= 20) {
    return { label: `#${position}`, color: 'text-blue-400', bg: 'bg-blue-400/20', icon: '📍' }
  }
  return { label: `#${position}`, color: 'text-neutral-400', bg: 'bg-neutral-400/20', icon: '📊' }
}

function PositionHistory({ points }: { points: { position: number | null; checkedAt: string }[] }) {
  if (points.length === 0) return <div className="text-xs text-neutral-500">Pas d'historique</div>

  const recent = points.slice(-20)
  const maxPos = Math.max(...recent.map((p) => p.position ?? 100))

  return (
    <div className="flex h-16 items-end gap-0.5">
      {recent.map((p, i) => {
        const height = p.position == null ? 4 : Math.max(8, ((101 - Math.min(p.position, 100)) / 101) * 100)
        const isImproving = i > 0 && p.position && recent[i - 1].position && p.position < (recent[i - 1].position ?? 999)
        const isWorsening = i > 0 && p.position && recent[i - 1].position && p.position > (recent[i - 1].position ?? 0)
        return (
          <div
            key={i}
            title={`${new Date(p.checkedAt).toLocaleDateString('fr')} : ${p.position ?? '> 100'}`}
            className={`group relative w-1.5 rounded-t transition-all hover:scale-150 ${
              isImproving
                ? 'bg-gradient-to-t from-[#10B981] to-[#059669]'
                : isWorsening
                ? 'bg-gradient-to-t from-red-400 to-red-500'
                : 'bg-gradient-to-t from-[#C9A961] to-[#D4AF37]'
            }`}
            style={{ height: `${height}%` }}
          >
            <div className="absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/95 px-2 py-1 text-xs text-neutral-100 shadow-xl backdrop-blur-sm group-hover:block">
              <div className="whitespace-nowrap font-semibold">
                {new Date(p.checkedAt).toLocaleDateString('fr', { month: 'short', day: 'numeric' })}
              </div>
              <div className="mt-0.5 whitespace-nowrap text-[#C9A961]">
                {p.position ? `#${p.position}` : '> 100'}
              </div>
            </div>
          </div>
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
    setError('')
    try {
      const res = await fetch('/api/rank/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: number) {
    setBusyId(id)
    setError('')
    try {
      const res = await fetch('/api/rank', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setBusyId(null)
    }
  }

  const stats = useMemo(() => {
    const topThree = items.filter((it) => it.position && it.position <= 3).length
    const topTen = items.filter((it) => it.position && it.position <= 10).length
    const avgPosition =
      items.filter((it) => it.position).reduce((sum, it) => sum + (it.position || 0), 0) /
      (items.filter((it) => it.position).length || 1)
    const winners = items.filter((it) => {
      if (it.history.length < 2) return false
      const last = it.history[it.history.length - 1].position
      const prev = it.history[it.history.length - 2].position
      return last && prev && last < prev
    })
    const losers = items.filter((it) => {
      if (it.history.length < 2) return false
      const last = it.history[it.history.length - 1].position
      const prev = it.history[it.history.length - 2].position
      return last && prev && last > prev
    })
    return { topThree, topTen, avgPosition, winners, losers }
  }, [items])

  function exportCSV() {
    const headers = ['Mot-clé', 'Domaine', 'Position', 'Dernière vérif']
    const rows = items.map((it) => [
      it.keyword,
      it.domain,
      it.position ?? '> 100',
      it.checkedAt ? new Date(it.checkedAt).toLocaleDateString('fr') : '',
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rank-tracker-${Date.now()}.csv`
    a.click()
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Suivi de Positions
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Track tes rankings dans le temps · Détecte les progressions/chutes · Optimise ta stratégie
        </p>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Total Suivi</div>
            <div className="mt-2 text-3xl font-bold text-[#C9A961]">{items.length}</div>
            <div className="mt-1 text-xs text-neutral-500">Mots-clés</div>
          </div>
          <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Top 3</div>
            <div className="mt-2 text-3xl font-bold text-[#10B981]">{stats.topThree}</div>
            <div className="mt-1 text-xs text-neutral-500">🏆 Podium</div>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Top 10</div>
            <div className="mt-2 text-3xl font-bold text-[#D4AF37]">{stats.topTen}</div>
            <div className="mt-1 text-xs text-neutral-500">⭐ Première page</div>
          </div>
          <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-blue-400/80">Pos. Moy.</div>
            <div className="mt-2 text-3xl font-bold text-blue-400">
              {stats.avgPosition.toFixed(0)}
            </div>
            <div className="mt-1 text-xs text-neutral-500">Position moyenne</div>
          </div>
          <div className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-purple-400/80">Tendance</div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-bold">
              <span className="text-[#10B981]">↑{stats.winners.length}</span>
              <span className="text-neutral-500">/</span>
              <span className="text-red-400">↓{stats.losers.length}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">Gains / Pertes</div>
          </div>
        </div>
      )}

      {/* Add Form */}
      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-bold text-[#C9A961]">➕ Ajouter un Suivi</h2>
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mot-clé (ex : coloration cheveux)"
            className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Ton domaine (ex : monsite.ma)"
            className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-3 font-semibold text-[#0F172A] shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Suivre'}
          </button>
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

      {/* Export */}
      {items.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={exportCSV}
            className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10"
          >
            📥 Export CSV
          </button>
        </div>
      )}

      {/* Tracked Keywords */}
      {items.length === 0 && !error ? (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">📈</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">
            Commence à tracker tes positions
          </h3>
          <p className="text-neutral-400">
            Ajoute un mot-clé ci-dessus — la position est vérifiée immédiatement.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => {
            const badge = getPositionBadge(it.position)
            return (
              <div
                key={it.id}
                className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#C9A961]/40 hover:shadow-xl"
              >
                <div className="flex flex-wrap items-center gap-4">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 truncate text-lg font-semibold text-neutral-100">
                      {it.keyword}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>🌐 {it.domain}</span>
                      {it.checkedAt && (
                        <span>· 🕒 {new Date(it.checkedAt).toLocaleDateString('fr')}</span>
                      )}
                    </div>
                  </div>

                  {/* Position Badge */}
                  <div
                    className={`flex items-center gap-2 rounded-lg ${badge.bg} px-4 py-2`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className={`text-2xl font-bold ${badge.color}`}>{badge.label}</span>
                  </div>

                  {/* History */}
                  <div className="w-48">
                    <PositionHistory points={it.history} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => check(it.id)}
                      disabled={busyId === it.id}
                      className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10 disabled:opacity-50"
                    >
                      {busyId === it.id ? '⏳' : '🔄 Vérifier'}
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      disabled={busyId === it.id}
                      className="rounded-lg border border-red-400/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-400/10 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
