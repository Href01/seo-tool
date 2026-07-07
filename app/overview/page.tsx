'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle, Pill } from '@/components/ui'

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

export default function OverviewPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<KeywordOverview>('/api/keyword-overview')
  const kd = useSeoQuery<DifficultyResult>('/api/difficulty')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    kd.reset()
    run({ keyword, location, language, device })
  }

  const maxTrend = data ? Math.max(1, ...data.trend.map((t) => t.volume)) : 1
  const minTrend = data ? Math.min(...data.trend.map((t) => t.volume)) : 0
  const avgTrend = data ? data.trend.reduce((s, t) => s + t.volume, 0) / (data.trend.length || 1) : 0

  return (
    <Page>
      <PageHeader title="Aperçu mot-clé" subtitle="Volume, difficulté, tendance 12 mois, intention et concurrence SERP" />

      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">Mot-clé à analyser</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex : coloration cheveux"
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
              'Analyser en profondeur'
            )}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta
              cached={cached}
              fetchedAt={fetchedAt}
              timeAgo={timeAgo}
              extra={data.source === 'labs' ? 'source Labs' : 'source Google Ads'}
            />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && (
        <div className="space-y-6">
          {data.source === 'google_ads' && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--subtle)] px-5 py-4 text-sm text-[var(--text-2)]">
              <span className="font-semibold text-[var(--text)]">Mot-clé de niche (Google Ads) ·</span> Absent de Labs —
              volume et CPC via Google Ads. Difficulté et intention non disponibles pour cette source.
            </div>
          )}

          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Volume / mois" value={data.volume?.toLocaleString('fr') ?? '—'} />
            <StatCard label="CPC" value={data.cpc != null ? `${data.cpc.toFixed(2)} $` : '—'} />
            <StatCard label="Concurrence" value={data.competition != null ? data.competition.toFixed(2) : '—'} sub="Sur 1.00" />
            <StatCard label="Intention" value={data.intent || 'N/A'} />
            <StatCard
              label="Difficulté"
              value={data.difficulty ?? '—'}
              sub={data.difficulty != null ? diffCfg(data.difficulty).l : 'Non calculée'}
              accent={data.difficulty != null && data.difficulty < 30}
            />
          </div>

          {/* Trend */}
          {data.trend.length > 0 && (
            <Card>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <SectionTitle>Tendance · 12 mois</SectionTitle>
                <div className="flex gap-5 text-xs">
                  <div>
                    <div className="text-[var(--text-3)]">Max</div>
                    <div className="font-bold text-[var(--up)] tnum">{maxTrend.toLocaleString('fr')}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-3)]">Moy.</div>
                    <div className="font-bold text-[var(--text)] tnum">{Math.round(avgTrend).toLocaleString('fr')}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-3)]">Min</div>
                    <div className="font-bold text-[var(--down)] tnum">{minTrend.toLocaleString('fr')}</div>
                  </div>
                </div>
              </div>
              <div className="flex h-44 items-end gap-1.5">
                {data.trend.map((t, i) => {
                  const pct = (t.volume / maxTrend) * 100
                  const isMax = t.volume === maxTrend
                  return (
                    <div key={i} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${
                          isMax ? 'bg-[var(--crimson)]' : 'bg-[var(--crimson)]/25'
                        }`}
                        style={{ height: `${Math.max(6, pct)}%` }}
                      />
                      <div className="mt-1.5 text-[10px] text-[var(--text-3)]">{t.month.slice(5)}</div>
                      <div className="pointer-events-none absolute -top-10 z-10 hidden rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                        <div className="whitespace-nowrap font-semibold">{t.month}</div>
                        <div className="whitespace-nowrap tnum">{t.volume.toLocaleString('fr')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Difficulty on demand */}
          {data.difficulty == null && (
            <Card>
              <SectionTitle>Difficulté propriétaire</SectionTitle>
              <p className="mb-4 text-sm text-[var(--text-2)]">
                Calcul basé sur l'autorité des domaines en SERP · plateformes exclues automatiquement.
              </p>
              {!kd.data || kd.data.keyword !== data.keyword ? (
                <>
                  <Button onClick={() => kd.run({ keyword: data.keyword, location, language, device })} disabled={kd.loading}>
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

          {/* Recommendations */}
          {data.difficulty != null && (
            <Card>
              <SectionTitle>Recommandations</SectionTitle>
              <div className="space-y-2">
                {data.difficulty < 30 && data.volume && data.volume > 100 && (
                  <div className="flex items-start gap-2 rounded-xl bg-[var(--up-bg)] px-4 py-3 text-sm text-[var(--up)]">
                    <span>✅</span>
                    <span>
                      <b>Opportunité rapide</b> — difficulté faible + volume décent = ROI rapide. Priorise ce mot-clé.
                    </span>
                  </div>
                )}
                {data.cpc && data.cpc > 1 && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <span>💰</span>
                    <span>
                      <b>Forte valeur commerciale</b> — CPC {data.cpc.toFixed(2)} $ = forte intention d'achat.
                    </span>
                  </div>
                )}
                {data.difficulty >= 70 && (
                  <div className="flex items-start gap-2 rounded-xl bg-[var(--down-bg)] px-4 py-3 text-sm text-[var(--down)]">
                    <span>⚠️</span>
                    <span>
                      <b>Très difficile</b> — dominé par des autorités. Évite sauf stratégie long terme.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState icon="🎯" title="Analyse approfondie en un clic" hint="Volume, difficulté, tendances, intention — tout pour décider." />
      )}
    </Page>
  )
}
