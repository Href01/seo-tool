'use client'

import { useState } from 'react'

/**
 * Shared client-side POST helper for the SEO endpoints. Each route returns
 * `{ cached, ... , results | result }`; this normalizes loading/error/cache state
 * so every feature page stays a thin form + renderer.
 */
export function useSeoQuery<T>(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState<boolean | null>(null)
  const [data, setData] = useState<T | null>(null)

  async function run(payload: Record<string, unknown>) {
    setLoading(true)
    setError('')
    setData(null)
    setCached(null)
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
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setLoading(false)
    setError('')
    setData(null)
    setCached(null)
  }

  return { loading, error, cached, data, run, reset }
}
