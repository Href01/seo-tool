'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'

interface DomainKeyword {
  keyword: string
  position: number | null
  volume: number | null
  url: string
}

interface DomainOverview {
  domain: string
  organicKeywords: number | null
  estimatedTraffic: number | null
  keywords: DomainKeyword[]
}

export default function DomainPage() {
  const [domain, setDomain] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<DomainOverview>('/api/domain')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    run({ domain, location: 2504, language: 'fr' })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Analyse de domaine</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Trafic estimé et mots-clés d&apos;un concurrent sur google.co.ma. Maroc · français · cache partagé.
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
          {cached && fetchedAt ? ` · maj ${timeAgo(fetchedAt)}` : ''}
        </p>
      )}

      {data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Mots-clés organiques</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {data.organicKeywords?.toLocaleString('fr') ?? '—'}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Trafic estimé/mois</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {data.estimatedTraffic?.toLocaleString('fr') ?? '—'}
              </div>
            </div>
          </div>

          {data.keywords.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Mot-clé</th>
                    <th className="px-4 py-2.5 text-right font-medium">Position</th>
                    <th className="px-4 py-2.5 text-right font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.map((k, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-2.5">
                        {k.url ? (
                          <a
                            href={k.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {k.keyword}
                          </a>
                        ) : (
                          k.keyword
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{k.position ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {k.volume?.toLocaleString('fr') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  )
}
