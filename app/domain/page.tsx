'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, LanguageSelector } from '@/components/LocationSelector'

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

function posBadge(position: number | null) {
  if (position == null) return 'bg-neutral-500/20 text-neutral-400'
  if (position <= 3) return 'bg-[#10B981]/20 text-[#10B981]'
  if (position <= 10) return 'bg-[#D4AF37]/20 text-[#D4AF37]'
  return 'bg-neutral-500/20 text-neutral-400'
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
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Analyse de Domaine
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Trafic estimé · Mots-clés organiques · Espionnage concurrentiel MENA/Gulf
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              Domaine à Analyser
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ex : jumia.ma"
              className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-lg text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <LocationSelector value={location} onChange={setLocation} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-4 text-lg font-bold text-[#0F172A] shadow-xl shadow-[#C9A961]/30 transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F172A]/20 border-t-[#0F172A]"></span>
                Analyse du domaine...
              </span>
            ) : (
              '🌐 Analyser le domaine'
            )}
          </button>
        </form>

        {cached !== null && !error && data && (
          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
            <span>
              {data.domain} ·{' '}
              {cached ? (
                <span className="text-[#10B981]">⚡ Cache (0 $)</span>
              ) : (
                <span className="text-[#D4AF37]">💳 API DataForSEO</span>
              )}
            </span>
            {cached && fetchedAt && <span className="text-neutral-500">· Maj {timeAgo(fetchedAt)}</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-400">Erreur</div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Mots-clés Organiques</div>
                <span className="text-2xl">🔑</span>
              </div>
              <div className="mt-2 text-4xl font-bold text-[#C9A961]">
                {data.organicKeywords?.toLocaleString('fr') ?? '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Positions en SERP</div>
            </div>
            <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Trafic Estimé</div>
                <span className="text-2xl">📈</span>
              </div>
              <div className="mt-2 text-4xl font-bold text-[#10B981]">
                {data.estimatedTraffic?.toLocaleString('fr') ?? '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Visites/mois estimées</div>
            </div>
          </div>

          {data.keywords.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-[#C9A961]">🎯 Top Mots-Clés du Domaine</h2>
              <div className="overflow-hidden rounded-2xl border border-[#C9A961]/20 bg-[#1E293B]/40 shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#C9A961]/20 bg-[#0F172A]/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                          Mot-clé
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                          Position
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9A961]/10">
                      {data.keywords.map((k, i) => (
                        <tr key={i} className="transition-colors hover:bg-[#C9A961]/5">
                          <td className="px-4 py-3">
                            {k.url ? (
                              <a
                                href={k.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                              >
                                {k.keyword}
                              </a>
                            ) : (
                              <span className="font-medium text-neutral-200">{k.keyword}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${posBadge(k.position)}`}>
                              {k.position != null ? `#${k.position}` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-neutral-300">
                            {k.volume?.toLocaleString('fr') ?? '—'}
                          </td>
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
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🌐</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">Espionne tes concurrents</h3>
          <p className="text-neutral-400">Découvre leur trafic et leurs meilleurs mots-clés.</p>
        </div>
      )}
    </main>
  )
}
