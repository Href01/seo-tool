'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Page, PageHeader, Card, Button, Spinner, EmptyState } from '@/components/ui'

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
      setTimeout(() => load(), 100)
    } catch (e: any) {
      alert(e.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
  }

  return (
    <Page>
      <PageHeader title="Mes projets" subtitle="Un projet par site web pour organiser ton suivi SEO" />

      <Card className="mb-6">
        <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du projet (ex : Ma Boutique)"
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domaine (ex : monsite.ma)"
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <Button type="submit" disabled={loading}>{loading ? <><Spinner /> Création…</> : 'Créer'}</Button>
        </form>
      </Card>

      {projects.length === 0 ? (
        <EmptyState icon="📁" title="Aucun projet" hint="Crée-en un ci-dessus pour commencer ton suivi SEO." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--crimson)]/10 text-base">🌐</div>
                  <div>
                    <div className="font-semibold text-[var(--text)]">{p.name}</div>
                    <div className="text-xs text-[var(--text-2)]">{p.domain}</div>
                  </div>
                </div>
                {p.createdAt && (
                  <div className="text-xs text-[var(--text-3)]">{new Date(p.createdAt).toLocaleDateString('fr')}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/project/${p.id}`}
                  className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2 text-center text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)]"
                >
                  Ouvrir
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--down)] transition-colors hover:bg-[var(--down-bg)]"
                >
                  Suppr.
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}
