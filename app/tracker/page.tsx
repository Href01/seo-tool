'use client'

import { useEffect, useState } from 'react'

interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

function PositionBadge({ position }: { position: number | null }) {
  if (position == null) {
    return (
      <span className="rounded-md bg-neutral-100 px-2 py-1 text-sm font-semibold text-neutral-500 dark:bg-neutral-800">
        &gt; 100
      </span>
    )
  }
  const cls =
    position <= 3
      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
      : position <= 10
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
  return <span className={`rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${cls}`}>#{position}</span>
}

/** Tiny position history: taller bar = better rank (position 1 is best). */
function History({ points }: { points: { position: number | null; checkedAt: string }[] }) {
  if (points.length === 0) return <span className="text-xs text-neutral-400">—</span>
  return (
    <div className="flex h-8 items-end gap-0.5">
      {points.slice(-16).map((p, i) => {
        const height = p.position == null ? 4 : Math.max(6, ((101 - Math.min(p.position, 100)) / 101) * 100)
        return (
          <div
            key={i}
            title={`${new Date(p.checkedAt).toLocaleDateString('fr')} : ${p.position ?? '> 100'}`}
            className="w-1.5 rounded-t bg-neutral-300 dark:bg-neutral-700"
            style={{ height: `${height}%` }}
          />
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Suivi de positions</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Suis la position de ton domaine sur google.co.ma pour un mot-clé, dans le temps. Maroc · français.
      </p>

      <form onSubmit={add} className="mt-8 flex flex-col gap-2 sm:flex-row">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="mot-clé (ex : coloration cheveux)"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="ton domaine (ex : monsite.ma)"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? '…' : 'Suivre'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 && !error ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Aucun mot-clé suivi. Ajoute-en un ci-dessus — la première position est vérifiée aussitôt.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.keyword}</div>
                <div className="truncate text-xs text-neutral-500">{it.domain}</div>
              </div>
              <PositionBadge position={it.position} />
              <History points={it.history} />
              <div className="flex gap-1">
                <button
                  onClick={() => check(it.id)}
                  disabled={busyId === it.id}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {busyId === it.id ? '…' : 'Vérifier'}
                </button>
                <button
                  onClick={() => remove(it.id)}
                  disabled={busyId === it.id}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-red-950/30"
                >
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
