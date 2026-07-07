'use client'

import { useState } from 'react'
import { useSeoQuery } from '@/lib/useSeoQuery'

interface BacklinksSummary {
  domain: string
  backlinks: number | null
  referringDomains: number | null
  referringMainDomains: number | null
  rank: number | null
  spamScore: number | null
  dofollow: number | null
  nofollow: number | null
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

export default function BacklinksPage() {
  const [domain, setDomain] = useState('')
  const { loading, error, cached, data, run } = useSeoQuery<BacklinksSummary>('/api/backlinks')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    run({ domain })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Backlinks</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Profil de liens d&apos;un domaine : total, domaines référents, score de spam. Cache partagé.
      </p>

      <form onSubmit={search} className="mt-8 flex gap-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="ex : jumia.ma"
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
          {data.domain} · {cached ? '⚡ depuis le cache (0 $)' : '💳 requête DataForSEO'}
        </p>
      )}

      {data && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile label="Backlinks" value={fmt(data.backlinks)} />
          <Tile label="Domaines référents" value={fmt(data.referringDomains)} />
          <Tile label="Domaines principaux" value={fmt(data.referringMainDomains)} />
          <Tile label="Rank" value={fmt(data.rank)} />
          <Tile label="Score de spam" value={data.spamScore != null ? `${data.spamScore}%` : '—'} />
          <Tile label="Dofollow / Nofollow" value={`${fmt(data.dofollow)} / ${fmt(data.nofollow)}`} />
        </div>
      )}
    </main>
  )
}
