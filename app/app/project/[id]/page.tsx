'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  domain: string
  createdAt?: string
}

interface TrackedKeyword {
  id: number
  keyword: string
  domain: string
  position: number | null
  checkedAt: string | null
  history: { position: number | null; checkedAt: string }[]
}

function getPositionBadge(position: number | null) {
  if (position == null) return { label: '> 100', color: 'text-neutral-500', bg: 'bg-neutral-500/20', icon: '❌' }
  if (position <= 3) return { label: `#${position}`, color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', icon: '🏆' }
  if (position <= 10) return { label: `#${position}`, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/20', icon: '⭐' }
  if (position <= 20) return { label: `#${position}`, color: 'text-blue-400', bg: 'bg-blue-400/20', icon: '📍' }
  return { label: `#${position}`, color: 'text-neutral-400', bg: 'bg-neutral-400/20', icon: '📊' }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tracked, setTracked] = useState<TrackedKeyword[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadTracking() {
    try {
      const res = await fetch('/api/rank')
      const data = await res.json()
      setTracked(data.items || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadProject()
    loadTracking()
  }, [id])

  // Only keywords tracked for this project's domain
  const projectKeywords = useMemo(() => {
    if (!project) return []
    const dom = project.domain.toLowerCase().replace(/^www\./, '')
    return tracked.filter((t) => t.domain.toLowerCase().replace(/^www\./, '') === dom)
  }, [tracked, project])

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || !project) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, domain: project.domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setKeyword('')
      await loadTracking()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function check(kid: number) {
    setBusyId(kid)
    try {
      await fetch('/api/rank/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kid }),
      })
      await loadTracking()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(kid: number) {
    setBusyId(kid)
    try {
      await fetch('/api/rank', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kid }),
      })
      await loadTracking()
    } finally {
      setBusyId(null)
    }
  }

  const stats = useMemo(() => {
    const topThree = projectKeywords.filter((it) => it.position && it.position <= 3).length
    const topTen = projectKeywords.filter((it) => it.position && it.position <= 10).length
    const avgPosition =
      projectKeywords.filter((it) => it.position).reduce((sum, it) => sum + (it.position || 0), 0) /
      (projectKeywords.filter((it) => it.position).length || 1)
    return { topThree, topTen, avgPosition }
  }, [projectKeywords])

  if (notFound) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl border border-red-400/20 bg-[#1E293B]/40 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-red-400">Projet introuvable</h3>
          <p className="mb-6 text-neutral-400">Ce projet n'existe pas ou a été supprimé.</p>
          <Link
            href="/app"
            className="inline-block rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-3 font-semibold text-[#0F172A]"
          >
            ← Retour aux projets
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Breadcrumb */}
      <Link href="/app" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-[#C9A961]">
        ← Mes Projets
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A961] to-[#D4AF37] shadow-lg shadow-[#C9A961]/20">
          <span className="text-2xl">🌐</span>
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-4xl font-bold text-transparent">
            {project?.name || 'Chargement...'}
          </h1>
          {project && (
            <a
              href={`https://${project.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#059669] transition-colors hover:text-[#10B981]"
            >
              https://{project.domain} ↗
            </a>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Mots-clés Suivis</div>
          <div className="mt-2 text-3xl font-bold text-[#C9A961]">{projectKeywords.length}</div>
        </div>
        <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Top 3</div>
          <div className="mt-2 text-3xl font-bold text-[#10B981]">{stats.topThree}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Top 10</div>
          <div className="mt-2 text-3xl font-bold text-[#D4AF37]">{stats.topTen}</div>
        </div>
        <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-blue-400/80">Pos. Moyenne</div>
          <div className="mt-2 text-3xl font-bold text-blue-400">
            {projectKeywords.length > 0 ? stats.avgPosition.toFixed(0) : '—'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/"
          className="group rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm transition-all hover:border-[#C9A961]/40 hover:shadow-xl hover:shadow-[#C9A961]/10"
        >
          <div className="mb-2 text-2xl">🔍</div>
          <div className="font-semibold text-[#C9A961] group-hover:text-[#D4AF37]">Rechercher des mots-clés</div>
          <div className="mt-1 text-sm text-neutral-400">Trouve de nouvelles opportunités</div>
        </Link>
        <Link
          href="/overview"
          className="group rounded-xl border border-[#059669]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm transition-all hover:border-[#059669]/40 hover:shadow-xl hover:shadow-[#059669]/10"
        >
          <div className="mb-2 text-2xl">🎯</div>
          <div className="font-semibold text-[#059669] group-hover:text-[#10B981]">Analyser un mot-clé</div>
          <div className="mt-1 text-sm text-neutral-400">Volume, difficulté, tendances</div>
        </Link>
        <a
          href={project ? `/api/audit?domain=${project.domain}` : '#'}
          onClick={(e) => e.preventDefault()}
          className="group rounded-xl border border-[#D4AF37]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm"
        >
          <div className="mb-2 text-2xl">🩺</div>
          <div className="font-semibold text-[#D4AF37]">Audit du site</div>
          <div className="mt-1 text-sm text-neutral-400">Bientôt disponible</div>
        </a>
      </div>

      {/* Add Keyword to Track */}
      <div className="mb-8 rounded-2xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-8 shadow-2xl backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-bold text-[#C9A961]">➕ Suivre un mot-clé pour ce site</h2>
        <form onSubmit={addKeyword} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mot-clé (ex : coloration cheveux)"
            className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
          />
          <button
            type="submit"
            disabled={loading || !project}
            className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-3 font-semibold text-[#0F172A] shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Suivre'}
          </button>
        </form>
        {error && <div className="mt-3 text-sm text-red-400">⚠️ {error}</div>}
      </div>

      {/* Tracked Keywords */}
      {projectKeywords.length === 0 ? (
        <div className="rounded-2xl border border-[#C9A961]/10 bg-[#1E293B]/20 px-12 py-16 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">📈</div>
          <h3 className="mb-2 text-xl font-semibold text-[#C9A961]">Aucun mot-clé suivi pour ce site</h3>
          <p className="text-neutral-400">Ajoute un mot-clé ci-dessus pour commencer à tracker.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#C9A961]">📊 Positions du site</h2>
          {projectKeywords.map((it) => {
            const badge = getPositionBadge(it.position)
            return (
              <div
                key={it.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#C9A961]/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold text-neutral-100">{it.keyword}</div>
                  {it.checkedAt && (
                    <div className="text-xs text-neutral-500">
                      🕒 {new Date(it.checkedAt).toLocaleDateString('fr')}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 rounded-lg ${badge.bg} px-4 py-2`}>
                  <span className="text-xl">{badge.icon}</span>
                  <span className={`text-2xl font-bold ${badge.color}`}>{badge.label}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => check(it.id)}
                    disabled={busyId === it.id}
                    className="rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10 disabled:opacity-50"
                  >
                    {busyId === it.id ? '⏳' : '🔄 Vérifier'}
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    disabled={busyId === it.id}
                    className="rounded-lg border border-red-400/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-400/10 disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
