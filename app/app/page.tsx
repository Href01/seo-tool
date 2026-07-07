'use client'

import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  domain: string
  createdAt?: string
}

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !domain.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la création')
        return
      }
      setName('')
      setDomain('')
      // Force reload
      setTimeout(() => load(), 100)
    } catch (e: any) {
      alert(e.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <h1 className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-4xl font-bold text-transparent">
          Mes Projets
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Tes sites suivis. Crée un projet par site web pour organiser ton suivi SEO.
        </p>
      </div>

      <form onSubmit={create} className="mb-8 flex flex-col gap-3 rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du projet (ex : Ma Boutique)"
          className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Domaine (ex : monsite.ma)"
          className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-3 text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-[#C9A961] to-[#D4AF37] px-6 py-3 font-semibold text-[#0F172A] shadow-lg shadow-[#C9A961]/20 transition-all hover:shadow-xl hover:shadow-[#C9A961]/30 disabled:opacity-50"
        >
          {loading ? 'Création…' : 'Créer'}
        </button>
      </form>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-[#C9A961]/10 bg-[#1E293B]/20 p-12 text-center backdrop-blur-sm">
          <p className="text-neutral-400">Aucun projet. Crée-en un ci-dessus pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#C9A961]/40 hover:shadow-xl hover:shadow-[#C9A961]/10"
            >
              <div className="mb-4">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A961] to-[#D4AF37]">
                    <span className="text-sm font-bold text-[#0F172A]">🌐</span>
                  </div>
                  <div className="text-lg font-semibold text-[#C9A961]">{p.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-[#059669]">https://{p.domain}</div>
                </div>
                {p.createdAt && (
                  <div className="mt-2 text-xs text-neutral-500">
                    Créé le {new Date(p.createdAt).toLocaleDateString('fr')}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={`/app/project/${p.id}`}
                  className="flex-1 rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2 text-center text-sm font-medium text-[#C9A961] transition-all hover:bg-[#C9A961]/10"
                >
                  📊 Ouvrir
                </a>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-lg border border-red-500/30 bg-[#0F172A]/50 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
