'use client'

import { useEffect, useState } from 'react'

interface Stats {
  bankCount: number
  usersCount: number
  projectsCount: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-4xl font-bold text-transparent">
          Dashboard Admin
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Vue omnisciente · Tous les projets, stats, et données.
        </p>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 shadow-xl backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Base de mots-clés</div>
            <div className="mt-2 text-3xl font-bold text-[#C9A961]">
              {stats.bankCount.toLocaleString('fr')}
            </div>
          </div>
          <div className="rounded-xl border border-[#059669]/20 bg-[#1E293B]/40 p-6 shadow-xl backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#059669]/80">Utilisateurs</div>
            <div className="mt-2 text-3xl font-bold text-[#059669]">
              {stats.usersCount.toLocaleString('fr')}
            </div>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#1E293B]/40 p-6 shadow-xl backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Projets</div>
            <div className="mt-2 text-3xl font-bold text-[#D4AF37]">
              {stats.projectsCount.toLocaleString('fr')}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href="/database"
          className="group rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#C9A961]/40 hover:shadow-xl hover:shadow-[#C9A961]/10"
        >
          <div className="text-lg font-semibold text-[#C9A961] group-hover:text-[#D4AF37]">
            Base de mots-clés
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Tous les mots-clés accumulés dans la base propriétaire
          </div>
        </a>
        <a
          href="/"
          className="group rounded-xl border border-[#059669]/20 bg-[#1E293B]/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#059669]/40 hover:shadow-xl hover:shadow-[#059669]/10"
        >
          <div className="text-lg font-semibold text-[#059669] group-hover:text-[#10B981]">
            Outils SEO
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Recherche, SERP, difficulté, domaine, backlinks, audit
          </div>
        </a>
      </div>
    </main>
  )
}
