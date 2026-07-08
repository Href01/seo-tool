'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { KeywordTable } from '@/components/KeywordTable'
import { KeywordInsights } from '@/components/KeywordInsights'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle } from '@/components/ui'

interface KeywordResult {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
}

interface KeywordOverview {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
  intent: string | null
  source: 'labs' | 'google_ads'
  trend: { month: string; volume: number }[]
}

interface DifficultyResult {
  keyword: string
  difficulty: number
  competitors: { position: number | null; domain: string; rank: number | null; counted: boolean }[]
}

function diffCfg(score: number) {
  if (score < 30) return { c: 'text-[var(--up)]', b: 'bg-[var(--up-bg)]', l: 'Facile' }
  if (score < 60) return { c: 'text-amber-700', b: 'bg-amber-100', l: 'Moyen' }
  return { c: 'text-[var(--down)]', b: 'bg-[var(--down-bg)]', l: 'Difficile' }
}

export default function Explorer() {
  const [keyword, setKeyword] = useState('')
  const [focus, setFocus] = useState('') // the keyword currently analyzed in the top panel
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)

  // Suggestions (breadth) + overview (depth) run together; difficulty stays on demand.
  const suggestions = useSeoQuery<KeywordResult[]>('/api/keywords')
  const overview = useSeoQuery<KeywordOverview>('/api/keyword-overview')
  const kd = useSeoQuery<DifficultyResult>('/api/difficulty')

  function runSearch(kw: string) {
    const q = kw.trim()
    if (!q) return
    setKeyword(q)
    setFocus(q)
    kd.reset()
    suggestions.run({ keyword: q, location, language, device })
    overview.run({ keyword: q, location, language, device })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch(keyword)
  }

  function exportCSV() {
    const rows = (suggestions.data || []).map((r) => [r.keyword, r.volume ?? '', r.cpc ?? '', r.difficulty ?? ''])
    const csv = [['Mot-clé', 'Volume', 'CPC', 'Difficulté'], ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keywords-${focus}-${Date.now()}.csv`
    a.click()
  }

  const ov = overview.data
  const loading = suggestions.loading || overview.loading
  const maxTrend = ov ? Math.max(1, ...ov.trend.map((t) => t.volume)) : 1
  const trendHasData = !!ov && ov.trend.some((t) => t.volume > 0)
  const hasResults = (suggestions.data && suggestions.data.length > 0) || ov

  return (
    <Page>
      <PageHeader
        title="Explorer de mots-clés"
        subtitle="Analyse un mot-clé en profondeur et découvre les opportunités autour — en un seul écran"
      />

      {/* Search */}
      <Card className="mb-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">Mot-clé</label>
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
              'Analyser'
            )}
          </Button>
        </form>
      </Card>

      {(suggestions.error || overview.error) && (
        <div className="mb-6">
          <ErrorBox message={suggestions.error || overview.error} />
        </div>
      )}

      {hasResults && (
        <div className="space-y-8">
          {/* ── FOCUS: deep overview of the analyzed keyword ── */}
          {ov && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">« {ov.keyword} »</h2>
                  <p className="text-xs text-[var(--text-2)]">Analyse du mot-clé exact</p>
                </div>
                <CacheMeta
                  cached={!!overview.cached}
                  fetchedAt={overview.fetchedAt}
                  timeAgo={timeAgo}
                  extra={ov.source === 'labs' ? 'source Labs' : 'source Google Ads'}
                />
              </div>

              {ov.source === 'google_ads' && (
                <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--subtle)] px-5 py-3 text-sm text-[var(--text-2)]">
                  <span className="font-semibold text-[var(--text)]">Mot-clé de niche (Google Ads) ·</span> volume et CPC
                  via Google Ads. Intention non disponible — la difficulté reste calculable ci-dessous.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Volume / mois" value={ov.volume?.toLocaleString('fr') ?? '—'} />
                <StatCard label="CPC" value={ov.cpc != null ? `${ov.cpc.toFixed(2)} $` : '—'} />
                <StatCard label="Concurrence" value={ov.competition != null ? ov.competition.toFixed(2) : '—'} sub="Sur 1.00" />
                <StatCard label="Intention" value={ov.intent || 'N/A'} />
                <StatCard
                  label="Difficulté"
                  value={ov.difficulty ?? (kd.data?.keyword === ov.keyword ? kd.data.difficulty : '—')}
                  sub={
                    ov.difficulty != null
                      ? diffCfg(ov.difficulty).l
                      : kd.data?.keyword === ov.keyword
                      ? diffCfg(kd.data.difficulty).l
                      : 'À calculer'
                  }
                  accent={ov.difficulty != null && ov.difficulty < 30}
                />
              </div>

              {/* Trend */}
              {ov.trend.length > 0 && (
                <Card className="mt-3">
                  <SectionTitle>Tendance · 12 mois</SectionTitle>
                  {trendHasData ? (
                    <>
                      {/* Bars row — fixed height so the % heights have a reference */}
                      <div className="flex h-32 items-end gap-1.5">
                        {ov.trend.map((t, i) => {
                          const pct = (t.volume / maxTrend) * 100
                          const isMax = t.volume === maxTrend
                          return (
                            <div
                              key={i}
                              title={`${t.month} : ${t.volume.toLocaleString('fr')}`}
                              className={`flex-1 rounded-t-md transition-opacity hover:opacity-70 ${
                                isMax ? 'bg-[var(--crimson)]' : 'bg-[var(--crimson)]/30'
                              }`}
                              style={{ height: `${Math.max(2, pct)}%` }}
                            />
                          )
                        })}
                      </div>
                      {/* Labels row — aligned to the bars above */}
                      <div className="mt-1.5 flex gap-1.5">
                        {ov.trend.map((t, i) => (
                          <div key={i} className="flex-1 text-center text-[10px] text-[var(--text-3)]">
                            {t.month.slice(5)}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-sm text-[var(--text-3)]">
                      Données de tendance indisponibles pour ce mot-clé.
                    </div>
                  )}
                </Card>
              )}

              {/* Difficulty on demand */}
              {ov.difficulty == null && (
                <Card className="mt-3">
                  <SectionTitle>Difficulté propriétaire</SectionTitle>
                  <p className="mb-4 text-sm text-[var(--text-2)]">
                    Calcul basé sur l'autorité des domaines en SERP · plateformes exclues automatiquement.
                  </p>
                  {!kd.data || kd.data.keyword !== ov.keyword ? (
                    <>
                      <Button
                        onClick={() => kd.run({ keyword: ov.keyword, location, language, device })}
                        disabled={kd.loading}
                      >
                        {kd.loading ? (
                          <>
                            <Spinner /> Calcul…
                          </>
                        ) : (
                          'Calculer la difficulté maison'
                        )}
                      </Button>
                      {kd.error && <div className="mt-3 text-sm text-[var(--down)]">{kd.error}</div>}
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-5">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${diffCfg(kd.data.difficulty).b}`}>
                          <div className="text-center">
                            <div className={`text-3xl font-bold tnum ${diffCfg(kd.data.difficulty).c}`}>{kd.data.difficulty}</div>
                            <div className="text-[10px] text-[var(--text-3)]">/100</div>
                          </div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${diffCfg(kd.data.difficulty).c}`}>{diffCfg(kd.data.difficulty).l}</div>
                          <div className="text-sm text-[var(--text-2)]">
                            Depuis l'autorité de {kd.data.competitors.filter((c) => c.counted).length} domaines SERP
                          </div>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                        <table className="w-full text-sm">
                          <thead className="border-b border-[var(--line)] bg-[var(--subtle)] text-left text-xs text-[var(--text-2)]">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">#</th>
                              <th className="px-4 py-2.5 font-semibold">Domaine</th>
                              <th className="px-4 py-2.5 text-right font-semibold">Autorité /1000</th>
                              <th className="px-4 py-2.5 text-center font-semibold">Compté</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            {kd.data.competitors.map((c, i) => (
                              <tr key={i} className={c.counted ? '' : 'opacity-50'}>
                                <td className="px-4 py-2.5 text-[var(--text-3)] tnum">{c.position ?? '—'}</td>
                                <td className="px-4 py-2.5 font-medium text-[var(--text)]">
                                  {c.domain || '—'}
                                  {!c.counted && <span className="ml-2 text-xs italic text-[var(--text-3)]">plateforme</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold tnum">{c.rank ?? '—'}</td>
                                <td className="px-4 py-2.5 text-center">
                                  {c.counted ? <span className="text-[var(--up)]">✓</span> : <span className="text-[var(--down)]">✗</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ── IDEAS: suggestions around the keyword ── */}
          {suggestions.data && suggestions.data.length > 0 && (
            <>
              <div>
                <SectionTitle>
                  Insights stratégiques
                </SectionTitle>
                <p className="-mt-2 mb-3 text-xs text-[var(--text-2)]">
                  Agrégé sur les {suggestions.data.length} idées ci-dessous (pas seulement le mot exact).
                </p>
                <KeywordInsights keywords={suggestions.data} />
              </div>
              <div>
                <SectionTitle
                  action={
                    <span className="text-xs text-[var(--text-3)]">Clique un mot-clé pour l'analyser ↑</span>
                  }
                >
                  Idées de mots-clés
                </SectionTitle>
                <KeywordTable
                  keywords={suggestions.data}
                  onExport={exportCSV}
                  onSelect={runSearch}
                  activeKeyword={focus}
                />
              </div>
            </>
          )}
        </div>
      )}

      {!hasResults && !loading && !suggestions.error && !overview.error && (
        <EmptyState
          icon="🔍"
          title="Prêt à explorer ?"
          hint="Entre un mot-clé : tu obtiens son analyse complète + les opportunités autour."
        />
      )}
    </Page>
  )
}
