'use client'

import { useState } from 'react'
import { useSeoQuery } from '@/lib/useSeoQuery'

interface KeywordOverview {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
  intent: string | null
  source: 'labs' | 'google_ads'
  trend: { month: string; volume: number }[]
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export default function OverviewPage() {
  const [keyword, setKeyword] = useState('')
  const { loading, error, cached, data, run } = useSeoQuery<KeywordOverview>('/api/keyword-overview')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    run({ keyword, location: 2504, language: 'fr' })
  }

  const maxTrend = data ? Math.max(1, ...data.trend.map((t) => t.volume)) : 1

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Aperçu mot-clé</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Volume, difficulté, CPC, intention et tendance sur 12 mois. Maroc · français · cache partagé.
      </p>

      <form onSubmit={search} className="mt-8 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ex : coloration cheveux"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? '…' : 'Analyser'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cached !== null && !error && data && (
        <p className="mt-6 text-xs text-neutral-500">
          « {data.keyword} » · {cached ? '⚡ depuis le cache (0 $)' : '💳 requête DataForSEO'} ·{' '}
          {data.source === 'labs' ? 'source : Labs' : 'source : Google Ads'}
        </p>
      )}

      {data && data.source === 'google_ads' && (
        <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
          Mot-clé de niche absent de la base Labs — volume et CPC via Google Ads. La difficulté et
          l&apos;intention ne sont pas disponibles pour cette source.
        </p>
      )}

      {data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Volume/mois" value={data.volume?.toLocaleString('fr') ?? '—'} />
            <Tile label="Difficulté" value={data.difficulty != null ? String(data.difficulty) : '—'} />
            <Tile label="CPC" value={data.cpc != null ? `${data.cpc.toFixed(2)} $` : '—'} />
            <Tile
              label="Concurrence"
              value={data.competition != null ? data.competition.toFixed(2) : '—'}
            />
            <Tile label="Intention" value={data.intent ?? '—'} />
          </div>

          {data.trend.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs uppercase text-neutral-500">Tendance (12 mois)</div>
              <div className="flex h-24 items-end gap-1">
                {data.trend.map((t) => (
                  <div
                    key={t.month}
                    title={`${t.month} : ${t.volume.toLocaleString('fr')}`}
                    className="flex-1 rounded-t bg-neutral-300 dark:bg-neutral-700"
                    style={{ height: `${Math.max(4, (t.volume / maxTrend) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
