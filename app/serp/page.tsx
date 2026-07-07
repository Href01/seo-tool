'use client'

import { useState } from 'react'
import { useSeoQuery } from '@/lib/useSeoQuery'

interface SerpResult {
  position: number | null
  title: string
  url: string
  domain: string
  description: string
}

export default function SerpPage() {
  const [keyword, setKeyword] = useState('')
  const { loading, error, cached, data, run } = useSeoQuery<SerpResult[]>('/api/serp')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    run({ keyword, location: 2504, language: 'fr' })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Analyse SERP</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Qui ranke dans le top de google.co.ma pour un mot-clé. Maroc · français · cache partagé.
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
          {data.length} résultats · {cached ? '⚡ depuis le cache (0 $)' : '💳 requête DataForSEO'}
        </p>
      )}

      {data && data.length > 0 && (
        <ol className="mt-3 space-y-3">
          {data.map((r, i) => (
            <li
              key={i}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold tabular-nums text-neutral-400">
                  #{r.position ?? '—'}
                </span>
                <div className="min-w-0">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {r.title || r.url}
                  </a>
                  <span className="text-xs text-neutral-500">{r.domain}</span>
                  {r.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
