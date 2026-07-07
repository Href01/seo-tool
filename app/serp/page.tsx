'use client'

import { useState, useMemo } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { DEFAULT_LOCATION, DEFAULT_DEVICE, DEFAULT_LANGUAGE } from '@/lib/locations'
import { LocationSelector, DeviceSelector, LanguageSelector } from '@/components/LocationSelector'

interface SerpResult {
  position: number | null
  title: string
  url: string
  domain: string
  description: string
}

const MEGA_PLATFORMS = new Set([
  'instagram.com', 'facebook.com', 'youtube.com', 'pinterest.com',
  'tiktok.com', 'twitter.com', 'x.com', 'linkedin.com', 'wikipedia.org', 'reddit.com',
])

export default function SerpPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<SerpResult[]>('/api/serp')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    run({ keyword, location, language, device })
  }

  const insights = useMemo(() => {
    if (!data) return null
    const domains = new Set(data.map((r) => r.domain.toLowerCase().replace(/^www\./, '')))
    const platforms = data.filter((r) =>
      MEGA_PLATFORMS.has(r.domain.toLowerCase().replace(/^www\./, ''))
    ).length
    const realCompetitors = data.length - platforms
    return { uniqueDomains: domains.size, platforms, realCompetitors }
  }, [data])

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Analyse SERP
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Qui domine le top des résultats · Intelligence concurrentielle · Détection des plateformes
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              Mot-clé
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex : coloration cheveux"
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
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-4 text-lg font-bold text-[#0F172A] shadow-xl shadow-[#C9A961]/30 transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F172A]/20 border-t-[#0F172A]"></span>
                Analyse SERP...
              </span>
            ) : (
              '🔍 Analyser le SERP'
            )}
          </button>
        </form>

        {cached !== null && !error && data && (
          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
            <span>
              {data.length} résultats ·{' '}
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

      {data && insights && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Domaines Uniques</div>
            <div className="mt-2 text-3xl font-bold text-[#C9A961]">{insights.uniqueDomains}</div>
            <div className="mt-1 text-xs text-neutral-500">Sur {data.length} résultats</div>
          </div>
          <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Vrais Concurrents</div>
            <div className="mt-2 text-3xl font-bold text-[#10B981]">{insights.realCompetitors}</div>
            <div className="mt-1 text-xs text-neutral-500">Sites e-commerce/business</div>
          </div>
          <div className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-purple-400/80">Plateformes</div>
            <div className="mt-2 text-3xl font-bold text-purple-400">{insights.platforms}</div>
            <div className="mt-1 text-xs text-neutral-500">Insta, FB, YT... (opportunité)</div>
          </div>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((r, i) => {
            const isPlatform = MEGA_PLATFORMS.has(r.domain.toLowerCase().replace(/^www\./, ''))
            return (
              <div
                key={i}
                className={`rounded-xl border bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${
                  isPlatform ? 'border-purple-400/20 opacity-70' : 'border-[#C9A961]/20 hover:border-[#C9A961]/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      (r.position ?? 99) <= 3
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : (r.position ?? 99) <= 10
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-neutral-500/20 text-neutral-400'
                    }`}
                  >
                    {r.position ?? '—'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-[#C9A961] transition-colors hover:text-[#D4AF37]"
                    >
                      {r.title || r.url}
                    </a>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-[#059669]">{r.domain}</span>
                      {isPlatform && (
                        <span className="rounded-full bg-purple-400/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                          PLATEFORME
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{r.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">Espionne le SERP</h3>
          <p className="text-neutral-400">Découvre qui ranke et repère les opportunités face aux plateformes.</p>
        </div>
      )}
    </main>
  )
}
