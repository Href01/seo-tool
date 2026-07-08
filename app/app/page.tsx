'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePT } from '@/lib/i18n'
import { Page, WorkspaceHeader, Card, Button, Spinner, EmptyState, ErrorBox } from '@/components/ui'
import { errorMessage } from '@/lib/errors'

interface Project { id: string; name: string; domain: string; createdAt?: string }

export default function AppPage() {
  const p = usePT()
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setProjects(data.projects || [])
    } catch (e: unknown) { setError(errorMessage(e)) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
    } catch (e: unknown) { alert(errorMessage(e)) } finally { setLoading(false) }
  }
  async function remove(id: string) {
    await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
  }

  return (
    <Page>
      <WorkspaceHeader icon="📁" title={p.appTitle} subtitle={p.appSub} />
      {error && (
        <div className="mb-6">
          <ErrorBox message={error} />
          <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-[var(--crimson)]">
            Se connecter
          </Link>
        </div>
      )}
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
