'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePT } from '@/lib/i18n'
import { Page, PageHeader, Card, Button, Spinner, EmptyState } from '@/components/ui'

interface Project { id: string; name: string; domain: string; createdAt?: string }

export default function AppPage() {
  const p = usePT()
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) { console.error(e) }
  }
  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !domain.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, domain }) })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Erreur'); return }
      setName(''); setDomain('')
      setTimeout(() => load(), 100)
    } catch (e: any) { alert(e.message || 'Erreur') } finally { setLoading(false) }
  }
  async function remove(id: string) {
    await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
  }

  return (
    <Page>
      <PageHeader title={p.appTitle} subtitle={p.appSub} />
      <Card className="mb-6">
        <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={p.projNamePh} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={p.domPh} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]" />
          <Button type="submit" disabled={loading}>{loading ? <><Spinner /> {p.creating}</> : p.create}</Button>
        </form>
      </Card>

      {projects.length === 0 ? (
        <EmptyState icon="📁" title={p.emptyProjT} hint={p.emptyProjH} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((proj) => (
            <Card key={proj.id}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--crimson)]/10 text-base">🌐</div>
                  <div>
                    <div className="font-semibold text-[var(--text)]">{proj.name}</div>
                    <div className="font-mono text-xs text-[var(--text-2)]">{proj.domain}</div>
                  </div>
                </div>
                {proj.createdAt && <div className="text-xs text-[var(--text-3)]">{new Date(proj.createdAt).toLocaleDateString('fr')}</div>}
              </div>
              <div className="flex gap-2">
                <Link href={`/app/project/${proj.id}`} className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2 text-center text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)]">{p.open}</Link>
                <button onClick={() => remove(proj.id)} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--down)] transition-colors hover:bg-[var(--down-bg)]">{p.del}</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}
