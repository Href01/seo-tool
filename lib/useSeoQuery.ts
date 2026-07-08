'use client'

import { useState } from 'react'
import { errorMessage } from './errors'

/** Human freshness label for a cache timestamp, e.g. "il y a 3 jours". */
export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const days = Math.floor((Date.now() - t) / 86_400_000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}

/**
 * Shared client-side POST helper for the SEO endpoints. Each route returns
 * `{ cached, ... , results | result }`; this normalizes loading/error/cache state
 * so every feature page stays a thin form + renderer.
 */
export function useSeoQuery<T>(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState<boolean | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  async function run(payload: Record<string, unknown>) {
    setLoading(true)
    setError('')
    setData(null)
    setCached(null)
    setFetchedAt(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setData((json.results ?? json.result) as T)
      setCached(!!json.cached)
      setFetchedAt(json.fetchedAt ?? null)
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLoading(false)
    setError('')
    setData(null)
    setCached(null)
    setFetchedAt(null)
  }

  return { loading, error, cached, fetchedAt, data, run, reset }
}
