'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { KeywordTable } from '@/components/KeywordTable'
import { KeywordInsights } from '@/components/KeywordInsights'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, SectionTitle } from '@/components/ui'

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
    const rows = results.map((r) => [r.keyword, r.volume ?? '', r.cpc ?? '', r.difficulty ?? ''])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keywords-${keyword}-${Date.now()}.csv`
    a.click()
  }

  return (
    <Page>
      <PageHeader
        title="Recherche de mots-clés"
        subtitle="Suggestions MENA/Gulf avec volume, CPC et difficulté propriétaire"
      />

      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">Mot-clé principal</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex : coloration cheveux, téléphone samsung, robe marocaine…"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <LocationSelector value={location} onChange={setLocation} />
            <DeviceSelector value={device} onChange={setDevice} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (
              <>
                <Spinner /> Analyse en cours…
              </>
            ) : (
              'Analyser les mots-clés'
            )}
          </Button>
        </form>
        {cached !== null && !error && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} extra={`${results.length} résultats`} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {results.length > 0 && (
        <div className="space-y-8">
          <div>
            <SectionTitle>Insights stratégiques</SectionTitle>
            <KeywordInsights keywords={results} />
          </div>
          <div>
            <SectionTitle>Tous les mots-clés</SectionTitle>
            <KeywordTable keywords={results} onExport={exportCSV} />
          </div>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <EmptyState
          icon="🔍"
          title="Prêt à découvrir des opportunités SEO ?"
          hint="Entre un mot-clé ci-dessus pour lancer l'analyse MENA/Gulf."
        />
      )}
    </Page>
  )
}
