'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, LanguageSelector } from '@/components/LocationSelector'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle } from '@/components/ui'

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

function posClass(p: number | null) {
  if (p == null) return 'bg-[var(--subtle)] text-[var(--text-2)]'
  if (p <= 3) return 'bg-[var(--up-bg)] text-[var(--up)]'
  if (p <= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-[var(--subtle)] text-[var(--text-2)]'
}

export default function DomainPage() {
  const [domain, setDomain] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<DomainOverview>('/api/domain')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    run({ domain, location, language })
  }

  return (
    <Page>
      <PageHeader title="Analyse de domaine" subtitle="Trafic estimé et mots-clés organiques d'un concurrent" />

      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">Domaine à analyser</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ex : jumia.ma"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <LocationSelector value={location} onChange={setLocation} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (
              <>
                <Spinner /> Analyse du domaine…
              </>
            ) : (
              'Analyser le domaine'
            )}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} extra={data.domain} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Mots-clés organiques" value={data.organicKeywords?.toLocaleString('fr') ?? '—'} sub="Positions en SERP" />
            <StatCard label="Trafic estimé" value={data.estimatedTraffic?.toLocaleString('fr') ?? '—'} sub="Visites / mois (estimation)" accent />
          </div>

          {data.keywords.length > 0 && (
            <div>
              <SectionTitle>Top mots-clés du domaine</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[var(--line)] bg-[var(--subtle)] text-left text-xs text-[var(--text-2)]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Mot-clé</th>
                        <th className="px-4 py-3 text-center font-semibold">Position</th>
                        <th className="px-4 py-3 text-right font-semibold">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {data.keywords.map((k, i) => (
                        <tr key={i} className="transition-colors hover:bg-[var(--subtle)]">
                          <td className="px-4 py-3">
                            {k.url ? (
                              <a href={k.url} target="_blank" rel="noreferrer" className="font-medium text-[var(--text)] hover:text-[var(--crimson)]">
                                {k.keyword}
                              </a>
                            ) : (
                              <span className="font-medium text-[var(--text)]">{k.keyword}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tnum ${posClass(k.position)}`}>
                              {k.position != null ? `#${k.position}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-[var(--text-2)] tnum">{k.volume?.toLocaleString('fr') ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState icon="🌐" title="Espionne tes concurrents" hint="Découvre leur trafic et leurs meilleurs mots-clés." />
      )}
    </Page>
  )
}
