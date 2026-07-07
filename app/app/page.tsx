'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  domain: string
  createdAt: string
}

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function load() {
    try {
      const res = await fetch('/api/projects')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !domain.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setName('')
      setDomain('')
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Erreur')
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mes projets</h1>
        <a
          href="/api/auth/signout"
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          Déconnexion
        </a>
      </div>
      <p className="mt-2 text-sm text-neutral-500">Tes sites suivis. Crée un projet par site web.</p>

      <form onSubmit={create} className="mt-8 flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="nom du projet (ex : Ma Boutique)"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="domaine (ex : monsite.ma)"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? '…' : 'Créer'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          Aucun projet. Crée-en un ci-dessus pour commencer à suivre tes positions.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.domain}</div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/app/project/${p.id}`}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Ouvrir
                </a>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-950/30"
                >
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
