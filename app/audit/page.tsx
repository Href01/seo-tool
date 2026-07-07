'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'

interface PageAudit {
  url: string
  onpageScore: number | null
  title: string | null
  titleLength: number | null
  description: string | null
  descriptionLength: number | null
  h1: string[]
  wordCount: number | null
  internalLinks: number | null
  externalLinks: number | null
  issues: string[]
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

function scoreLevel(score: number) {
  if (score >= 80) return { label: 'Excellent', color: 'text-[#10B981]', ring: '#10B981' }
  if (score >= 60) return { label: 'Correct', color: 'text-[#D4AF37]', ring: '#D4AF37' }
  return { label: 'À améliorer', color: 'text-red-400', ring: '#F87171' }
}

// Length check helpers for meta hygiene
function titleStatus(len: number | null) {
  if (len == null) return { color: 'text-red-400', hint: 'manquant' }
  if (len < 30) return { color: 'text-[#D4AF37]', hint: 'trop court' }
  if (len > 60) return { color: 'text-[#D4AF37]', hint: 'trop long' }
  return { color: 'text-[#10B981]', hint: 'optimal' }
}

function descStatus(len: number | null) {
  if (len == null) return { color: 'text-red-400', hint: 'manquante' }
  if (len < 120) return { color: 'text-[#D4AF37]', hint: 'trop courte' }
  if (len > 160) return { color: 'text-[#D4AF37]', hint: 'trop longue' }
  return { color: 'text-[#10B981]', hint: 'optimale' }
}

export default function AuditPage() {
  const [url, setUrl] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<PageAudit>('/api/audit')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    run({ url })
  }

  const score = data?.onpageScore != null ? Math.round(data.onpageScore) : null

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-5xl font-bold text-transparent">
          Audit On-Page
        </h1>
        <p className="mt-3 text-lg text-neutral-400">
          Diagnostic instantané · Score technique · Meta hygiene · Problèmes détectés
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={search} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
              URL de la Page
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ex : https://monsite.ma/produit"
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
                Audit en cours...
              </span>
            ) : (
              '🩺 Auditer la page'
            )}
          </button>
        </form>

        {cached !== null && !error && data && (
          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
            <span className="truncate">
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
          {/* Score + Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Score gauge */}
            {score != null && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={scoreLevel(score).ring}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 264} 264`}
                    />
                  </svg>
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${scoreLevel(score).color}`}>{score}</div>
                    <div className="text-xs text-neutral-500">/ 100</div>
                  </div>
                </div>
                <div className={`mt-4 text-xl font-bold ${scoreLevel(score).color}`}>
                  {scoreLevel(score).label}
                </div>
                <div className="text-xs text-neutral-500">Score on-page</div>
              </div>
            )}

            {/* Content stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
              <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Mots</div>
                  <span className="text-2xl">📝</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-[#C9A961]">{fmt(data.wordCount)}</div>
              </div>
              <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Liens Internes</div>
                  <span className="text-2xl">🔗</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-[#10B981]">{fmt(data.internalLinks)}</div>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Liens Externes</div>
                  <span className="text-2xl">🌐</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-[#D4AF37]">{fmt(data.externalLinks)}</div>
              </div>
            </div>
          </div>

          {/* Meta hygiene */}
          <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#C9A961]">🏷️ Balises Meta</h2>
            <div className="space-y-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Titre</span>
                  {data.titleLength != null && (
                    <span className="text-xs text-neutral-500">({data.titleLength} car.)</span>
                  )}
                  <span className={`text-xs font-semibold ${titleStatus(data.titleLength).color}`}>
                    · {titleStatus(data.titleLength).hint}
                  </span>
                </div>
                <p className="text-neutral-200">{data.title || '— manquant —'}</p>
              </div>
              <div className="border-t border-[#C9A961]/10 pt-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Meta description
                  </span>
                  {data.descriptionLength != null && (
                    <span className="text-xs text-neutral-500">({data.descriptionLength} car.)</span>
                  )}
                  <span className={`text-xs font-semibold ${descStatus(data.descriptionLength).color}`}>
                    · {descStatus(data.descriptionLength).hint}
                  </span>
                </div>
                <p className="text-neutral-200">{data.description || '— manquante —'}</p>
              </div>
              <div className="border-t border-[#C9A961]/10 pt-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">H1</span>
                  <span className={`text-xs font-semibold ${data.h1.length === 1 ? 'text-[#10B981]' : 'text-[#D4AF37]'}`}>
                    · {data.h1.length === 0 ? 'manquant' : data.h1.length === 1 ? 'unique' : `${data.h1.length} H1`}
                  </span>
                </div>
                <p className="text-neutral-200">{data.h1.length > 0 ? data.h1.join(' · ') : '— manquant —'}</p>
              </div>
            </div>
          </div>

          {/* Issues */}
          <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 backdrop-blur-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#C9A961]">
              🔍 Problèmes Détectés ({data.issues.length})
            </h2>
            {data.issues.length === 0 ? (
              <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="font-semibold text-[#10B981]">Aucun problème majeur détecté !</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {data.issues.map((issue) => (
                  <div
                    key={issue}
                    className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-3"
                  >
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm text-neutral-200">{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🩺</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">Diagnostique une page</h3>
          <p className="text-neutral-400">Score technique, meta, structure et problèmes détectés.</p>
        </div>
      )}
    </main>
  )
}
