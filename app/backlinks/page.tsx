'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'

interface BacklinksSummary {
  domain: string
  backlinks: number | null
  referringDomains: number | null
  referringMainDomains: number | null
  rank: number | null
  spamScore: number | null
  dofollow: number | null
  nofollow: number | null
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

function Metric({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className={`rounded-xl border ${color} bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-neutral-400">{label}</div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-neutral-100">{value}</div>
    </div>
  )
}

function spamLevel(score: number) {
  if (score < 15) return { label: 'Sain', color: 'text-[#10B981]', bg: 'from-[#10B981] to-[#059669]' }
  if (score < 40) return { label: 'Modéré', color: 'text-[#D4AF37]', bg: 'from-[#D4AF37] to-[#C9A961]' }
  return { label: 'Risqué', color: 'text-red-400', bg: 'from-red-400 to-red-500' }
}

export default function BacklinksPage() {
  const [domain, setDomain] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<BacklinksSummary>('/api/backlinks')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    run({ domain })
  }

  const dofollowPct =
    data && data.dofollow != null && data.nofollow != null && data.dofollow + data.nofollow > 0
      ? (data.dofollow / (data.dofollow + data.nofollow)) * 100
      : null

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Profil de Backlinks
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Autorité du domaine · Domaines référents · Score de spam · Ratio dofollow
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              Domaine
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ex : jumia.ma"
              className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-lg text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-4 text-lg font-bold text-[#0F172A] shadow-xl shadow-[#C9A961]/30 transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F172A]/20 border-t-[#0F172A]"></span>
                Analyse des backlinks...
              </span>
            ) : (
              '🔗 Analyser les backlinks'
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Backlinks" value={fmt(data.backlinks)} icon="🔗" color="border-[#C9A961]/20" />
            <Metric
              label="Domaines Référents"
              value={fmt(data.referringDomains)}
              icon="🌐"
              color="border-[#10B981]/20"
            />
            <Metric
              label="Domaines Principaux"
              value={fmt(data.referringMainDomains)}
              icon="🏛️"
              color="border-[#D4AF37]/20"
            />
            <Metric label="Rank Autorité" value={fmt(data.rank)} icon="⭐" color="border-purple-400/20" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Spam Score gauge */}
            {data.spamScore != null && (
              <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
                <h2 className="mb-4 text-xl font-bold text-[#C9A961]">🛡️ Score de Spam</h2>
                <div className="flex items-center gap-6">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className={`text-4xl font-bold ${spamLevel(data.spamScore).color}`}>
                      {data.spamScore}%
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${spamLevel(data.spamScore).color}`}>
                      {spamLevel(data.spamScore).label}
                    </div>
                    <div className="mt-1 text-sm text-neutral-400">
                      {data.spamScore < 15
                        ? 'Profil de liens sain et naturel.'
                        : data.spamScore < 40
                        ? 'Quelques liens douteux à surveiller.'
                        : 'Beaucoup de liens toxiques — risque de pénalité.'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0F172A]/50">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${spamLevel(data.spamScore).bg}`}
                    style={{ width: `${Math.min(100, data.spamScore)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Dofollow ratio */}
            {dofollowPct != null && (
              <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
                <h2 className="mb-4 text-xl font-bold text-[#C9A961]">🔀 Ratio Dofollow</h2>
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-bold text-[#10B981]">{dofollowPct.toFixed(0)}%</div>
                  <div className="text-sm text-neutral-400">
                    <div>
                      <span className="text-[#10B981]">●</span> {fmt(data.dofollow)} dofollow
                    </div>
                    <div>
                      <span className="text-neutral-500">●</span> {fmt(data.nofollow)} nofollow
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#0F172A]/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#059669]"
                    style={{ width: `${dofollowPct}%` }}
                  />
                  <div className="h-full flex-1 bg-neutral-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🔗</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">Mesure l'autorité d'un domaine</h3>
          <p className="text-neutral-400">Backlinks, domaines référents, score de spam et plus.</p>
        </div>
      )}
    </main>
  )
}
