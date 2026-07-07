'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { KeywordTable } from '@/components/KeywordTable'
import { KeywordInsights } from '@/components/KeywordInsights'

interface KeywordResult {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
}

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState<boolean | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [results, setResults] = useState<KeywordResult[]>([])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setCached(null)
    setFetchedAt(null)
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, language, device }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setResults(data.results || [])
      setCached(!!data.cached)
      setFetchedAt(data.fetchedAt ?? null)
    } catch (err: any) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    const headers = ['Mot-clé', 'Volume', 'CPC', 'Difficulté']
    const rows = results.map((r) => [
      r.keyword,
      r.volume ?? '',
      r.cpc ?? '',
      r.difficulty ?? '',
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keywords-${keyword}-${Date.now()}.csv`
    a.click()
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Recherche de Mots-Clés
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Analyse MENA/Gulf premium · Insights actionnables · Difficulté propriétaire
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          {/* Keyword Input */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              Mot-clé Principal
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex : coloration cheveux, téléphone samsung, robe marocaine..."
              className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-lg text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
            />
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <LocationSelector value={location} onChange={setLocation} />
            <DeviceSelector value={device} onChange={setDevice} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-4 text-lg font-bold text-[#0F172A] shadow-xl shadow-[#C9A961]/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#C9A961]/40 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F172A]/20 border-t-[#0F172A]"></span>
                Analyse en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🔍 Analyser les mots-clés
              </span>
            )}
          </button>
        </form>

        {/* Meta Info */}
        {cached !== null && !error && (
          <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <span>
                {results.length} résultats ·{' '}
                {cached ? (
                  <span className="text-[#10B981]">⚡ Cache (0 $)</span>
                ) : (
                  <span className="text-[#D4AF37]">💳 API DataForSEO</span>
                )}
              </span>
              {cached && fetchedAt && (
                <span className="text-neutral-500">· Maj {timeAgo(fetchedAt)}</span>
              )}
            </div>
          </div>
        )}
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

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-8">
          {/* Insights */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-[#C9A961]">📊 Insights Stratégiques</h2>
            <KeywordInsights keywords={results} />
          </div>

          {/* Table */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-[#C9A961]">📋 Tous les Mots-Clés</h2>
            <KeywordTable keywords={results} onExport={exportCSV} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !loading && !error && (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">
            Prêt à découvrir des opportunités SEO ?
          </h3>
          <p className="text-neutral-400">
            Entre un mot-clé ci-dessus pour lancer l'analyse MENA/Gulf premium.
          </p>
        </div>
      )}
    </main>
  )
}
