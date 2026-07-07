'use client'

import { useEffect, useState } from 'react'

interface BankEntry {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
  source: string | null
  timesSearched: number
  lastSeen: string
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

export default function DatabasePage() {
  const [items, setItems] = useState<BankEntry[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Base de mots-clés</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Ta base Maroc, qui s&apos;enrichit à chaque recherche.
        {count != null && (
          <>
            {' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {count.toLocaleString('fr')} mots-clés
            </span>{' '}
            accumulés.
          </>
        )}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(search)
        }}
        className="mt-8 flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filtrer (ex : cheveux)"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Filtrer
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 && !error ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Base vide pour l&apos;instant. Fais des recherches de mots-clés — chacune l&apos;enrichit.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mot-clé</th>
                <th className="px-4 py-2.5 text-right font-medium">Volume</th>
                <th className="px-4 py-2.5 text-right font-medium">Difficulté</th>
                <th className="px-4 py-2.5 text-right font-medium">CPC</th>
                <th className="px-4 py-2.5 text-right font-medium">Vu ×</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-2.5">{it.keyword}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(it.volume)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{it.difficulty ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {it.cpc != null ? `${it.cpc.toFixed(2)} $` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400">
                    {it.timesSearched}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
