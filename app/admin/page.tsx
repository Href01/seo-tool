'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  bankCount: number
  usersCount: number
  projectsCount: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function load() {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStats(data)
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin · SEO·MA</h1>
        <a
          href="/api/auth/signout"
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          Déconnexion
        </a>
      </div>
      <p className="mt-2 text-sm text-neutral-500">Vue omnisciente. Tous les projets, users, stats.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="text-xs uppercase text-neutral-500">Base de mots-clés</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.bankCount.toLocaleString('fr')}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="text-xs uppercase text-neutral-500">Utilisateurs</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.usersCount.toLocaleString('fr')}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="text-xs uppercase text-neutral-500">Projets</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.projectsCount.toLocaleString('fr')}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <a
          href="/database"
          className="block rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <div className="font-medium">Base de mots-clés</div>
          <div className="text-xs text-neutral-500">Voir tous les mots-clés accumulés</div>
        </a>
        <a
          href="/admin/projects"
          className="block rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <div className="font-medium">Tous les projets</div>
          <div className="text-xs text-neutral-500">Liste de tous les projets users</div>
        </a>
        <a
          href="/"
          className="block rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <div className="font-medium">Outils SEO</div>
          <div className="text-xs text-neutral-500">
            Recherche de mots-clés, SERP, difficulté, etc.
          </div>
        </a>
      </div>
    </main>
  )
}
