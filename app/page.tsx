'use client'

import { useState } from 'react'

interface KeywordResult {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
}

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState<boolean | null>(null)
  const [results, setResults] = useState<KeywordResult[]>([])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setCached(null)
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location: 2504, language: 'fr' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setResults(data.results || [])
      setCached(!!data.cached)
    } catch (err: any) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Recherche de mots-clés</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Maroc · français · via DataForSEO (avec cache partagé). MVP.
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
          {loading ? '…' : 'Chercher'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cached !== null && !error && (
        <p className="mt-6 text-xs text-neutral-500">
          {results.length} résultats · {cached ? '⚡ depuis le cache (0 $)' : '💳 requête DataForSEO'}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mot-clé</th>
                <th className="px-4 py-2.5 text-right font-medium">Volume</th>
                <th className="px-4 py-2.5 text-right font-medium">CPC</th>
                <th className="px-4 py-2.5 text-right font-medium">Difficulté</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-2.5">{r.keyword}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.volume ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {r.cpc != null ? r.cpc.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.difficulty ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
