'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'

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

function getDifficultyLevel(score: number) {
  if (score < 30) return { label: 'Facile', color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', icon: '✅' }
  if (score < 60) return { label: 'Moyen', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/20', icon: '⚠️' }
  return { label: 'Difficile', color: 'text-red-400', bg: 'bg-red-400/20', icon: '🔥' }
}

function getIntentIcon(intent: string | null) {
  if (!intent) return '❓'
  const i = intent.toLowerCase()
  if (i.includes('transact') || i.includes('commercial')) return '💰'
  if (i.includes('info')) return '📚'
  if (i.includes('navig')) return '🧭'
  return '🔍'
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
  const avgTrend = data ? data.trend.reduce((sum, t) => sum + t.volume, 0) / data.trend.length : 0

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Aperçu Mot-Clé Complet
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Volume · Difficulté · Tendances · Intention · Concurrence SERP · Insights actionnables
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              Mot-clé à Analyser
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex : coloration cheveux, téléphone samsung..."
              className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-lg text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <LocationSelector value={location} onChange={setLocation} />
            <DeviceSelector value={device} onChange={setDevice} />
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-4 text-lg font-bold text-[#0F172A] shadow-xl shadow-[#C9A961]/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#C9A961]/40 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F172A]/20 border-t-[#0F172A]"></span>
                Analyse complète en cours...
              </span>
            ) : (
              '🎯 Analyser en profondeur'
            )}
          </button>
        </form>

        {cached !== null && !error && data && (
          <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <span>
                {cached ? (
                  <span className="text-[#10B981]">⚡ Cache (0 $)</span>
                ) : (
                  <span className="text-[#D4AF37]">💳 API DataForSEO</span>
                )}
              </span>
              {cached && fetchedAt && (
                <span className="text-neutral-500">· Maj {timeAgo(fetchedAt)}</span>
              )}
              <span className="text-neutral-500">
                · Source: {data.source === 'labs' ? 'Labs (complet)' : 'Google Ads (fallback)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
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

      {/* Results */}
      {data && (
        <div className="space-y-8">
          {/* Fallback Notice */}
          {data.source === 'google_ads' && (
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <div className="font-semibold text-blue-400">Mot-clé de niche (Google Ads)</div>
                  <div className="mt-1 text-sm text-blue-300">
                    Absent de Labs — données volume/CPC via Google Ads. Difficulté et intention non disponibles.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Volume</div>
                <span className="text-2xl">📊</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-[#C9A961]">
                {data.volume?.toLocaleString('fr') ?? '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Recherches/mois</div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">CPC</div>
                <span className="text-2xl">💰</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-[#D4AF37]">
                {data.cpc != null ? `${data.cpc.toFixed(2)} $` : '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Coût par clic</div>
            </div>

            <div className="rounded-xl border border-[#059669]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-[#059669]/80">Concurrence</div>
                <span className="text-2xl">⚔️</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-[#059669]">
                {data.competition != null ? data.competition.toFixed(2) : '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Sur 1.00</div>
            </div>

            <div className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-purple-400/80">Intention</div>
                <span className="text-2xl">{getIntentIcon(data.intent)}</span>
              </div>
              <div className="mt-2 text-xl font-bold text-purple-400">
                {data.intent || 'N/A'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Type de recherche</div>
            </div>

            <div
              className={`rounded-xl border ${
                data.difficulty != null
                  ? `border-${getDifficultyLevel(data.difficulty).color.replace('text-', '')}/20`
                  : 'border-neutral-500/20'
              } bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-neutral-400">Difficulté</div>
                <span className="text-2xl">
                  {data.difficulty != null ? getDifficultyLevel(data.difficulty).icon : '❓'}
                </span>
              </div>
              <div
                className={`mt-2 text-3xl font-bold ${
                  data.difficulty != null ? getDifficultyLevel(data.difficulty).color : 'text-neutral-500'
                }`}
              >
                {data.difficulty ?? '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {data.difficulty != null ? getDifficultyLevel(data.difficulty).label : 'Non calculée'}
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          {data.trend.length > 0 && (
            <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#C9A961]">📈 Tendance (12 mois)</h2>
                  <p className="mt-1 text-sm text-neutral-400">Évolution du volume de recherche mensuel</p>
                </div>
                <div className="flex gap-6 text-xs">
                  <div>
                    <div className="text-neutral-500">Max</div>
                    <div className="font-bold text-[#10B981]">{maxTrend.toLocaleString('fr')}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Moy.</div>
                    <div className="font-bold text-[#D4AF37]">{Math.round(avgTrend).toLocaleString('fr')}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Min</div>
                    <div className="font-bold text-red-400">{minTrend.toLocaleString('fr')}</div>
                  </div>
                </div>
              </div>
              <div className="flex h-48 items-end gap-2">
                {data.trend.map((t, i) => {
                  const pct = (t.volume / maxTrend) * 100
                  const isMax = t.volume === maxTrend
                  const isMin = t.volume === minTrend
                  return (
                    <div key={i} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className={`w-full rounded-t-lg transition-all group-hover:scale-110 ${
                          isMax
                            ? 'bg-gradient-to-t from-[#10B981] to-[#059669]'
                            : isMin
                            ? 'bg-gradient-to-t from-red-400 to-red-500'
                            : 'bg-gradient-to-t from-[#C9A961] to-[#D4AF37]'
                        }`}
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                      <div className="mt-2 text-[10px] text-neutral-500">{t.month.slice(5)}</div>
                      <div className="absolute -top-12 z-10 hidden rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/95 px-3 py-2 text-xs text-neutral-100 shadow-xl backdrop-blur-sm group-hover:block">
                        <div className="font-semibold">{t.month}</div>
                        <div className="mt-1 text-[#C9A961]">{t.volume.toLocaleString('fr')} recherches</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Difficulty Breakdown */}
          {data.difficulty == null && (
            <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-[#C9A961]">🔥 Difficulté Propriétaire</h2>
              <p className="mb-6 text-sm text-neutral-400">
                Calcul basé sur l'autorité des domaines en SERP · Exclusion automatique des plateformes
              </p>
              {!kd.data || kd.data.keyword !== data.keyword ? (
                <>
                  <button
                    onClick={() => kd.run({ keyword: data.keyword, location, language, device })}
                    disabled={kd.loading}
                    className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-3 font-semibold text-[#0F172A] shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {kd.loading ? 'Calcul en cours...' : '🧮 Calculer la difficulté maison'}
                  </button>
                  {kd.error && (
                    <div className="mt-4 text-sm text-red-400">⚠️ {kd.error}</div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-2xl ${
                        getDifficultyLevel(kd.data.difficulty).bg
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getDifficultyLevel(kd.data.difficulty).color}`}>
                          {kd.data.difficulty}
                        </div>
                        <div className="text-xs text-neutral-500">/100</div>
                      </div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${getDifficultyLevel(kd.data.difficulty).color}`}>
                        {getDifficultyLevel(kd.data.difficulty).icon} {getDifficultyLevel(kd.data.difficulty).label}
                      </div>
                      <div className="mt-1 text-sm text-neutral-400">
                        Calculé depuis l'autorité des {kd.data.competitors.filter((c) => c.counted).length} domaines SERP
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#C9A961]/20">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[#C9A961]/20 bg-[#0F172A]/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                            Position
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                            Domaine
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                            Autorité /1000
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#C9A961]">
                            Compté
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C9A961]/10">
                        {kd.data.competitors.map((c, i) => (
                          <tr
                            key={i}
                            className={`transition-colors hover:bg-[#C9A961]/5 ${
                              !c.counted && 'opacity-50'
                            }`}
                          >
                            <td className="px-4 py-3 text-neutral-400">{c.position ?? '—'}</td>
                            <td className="px-4 py-3 font-medium text-neutral-200">
                              {c.domain || '—'}
                              {!c.counted && (
                                <span className="ml-2 text-xs italic text-neutral-500">
                                  (plateforme · ignoré)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#D4AF37]">
                              {c.rank ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {c.counted ? (
                                <span className="text-[#10B981]">✓</span>
                              ) : (
                                <span className="text-red-400">✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actionable Insights */}
          {data.difficulty != null && (
            <div className="rounded-2xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-[#10B981]">💡 Recommandations</h2>
              <div className="space-y-3">
                {data.difficulty < 30 && data.volume && data.volume > 100 && (
                  <div className="rounded-lg border border-[#10B981]/20 bg-[#10B981]/10 p-4">
                    <div className="font-semibold text-[#10B981]">✅ Opportunité rapide</div>
                    <div className="mt-1 text-sm text-neutral-300">
                      Difficulté faible + volume décent = ROI rapide. Priorise ce mot-clé.
                    </div>
                  </div>
                )}
                {data.cpc && data.cpc > 1 && (
                  <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
                    <div className="font-semibold text-[#D4AF37]">💰 Forte valeur commerciale</div>
                    <div className="mt-1 text-sm text-neutral-300">
                      CPC élevé ({data.cpc.toFixed(2)} $) = forte intention d'achat. Parfait pour conversion.
                    </div>
                  </div>
                )}
                {data.difficulty >= 70 && (
                  <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4">
                    <div className="font-semibold text-red-400">⚠️ Très difficile</div>
                    <div className="mt-1 text-sm text-neutral-300">
                      Dominé par autorités. Évite sauf stratégie long-terme ou backlinks solides.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && !error && (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🎯</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">
            Analyse approfondie en un clic
          </h3>
          <p className="text-neutral-400">
            Volume, difficulté, tendances, intention — tout ce qu'il faut pour décider.
          </p>
        </div>
      )}
    </main>
  )
}
