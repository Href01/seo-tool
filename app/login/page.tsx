'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Page, WorkspaceHeader, Card, Button, Spinner, ErrorBox } from '@/components/ui'
import { errorMessage } from '@/lib/errors'

type AuthMode = 'login' | 'signup'

interface AuthResponse {
  user?: { role?: string }
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = (await res.json()) as AuthResponse
      if (!res.ok) throw new Error(data.error || 'Erreur')
      router.push(data.user?.role === 'admin' ? '/admin' : '/app')
      router.refresh()
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <WorkspaceHeader
        icon="S"
        title={mode === 'login' ? 'Connexion' : 'Creation de compte'}
        subtitle="Compte requis pour les projets, le tracking et le dashboard admin."
      />

      <Card className="mx-auto max-w-md">
        <div className="mb-4 inline-flex rounded-xl bg-[var(--subtle)] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'login' ? 'bg-[var(--ink)] text-white' : 'text-[var(--text-2)]'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'signup' ? 'bg-[var(--ink)] text-white' : 'text-[var(--text-2)]'}`}
          >
            Signup
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="email@site.com"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--crimson)]"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Spinner /> Patiente</> : mode === 'login' ? 'Se connecter' : 'Creer le compte'}
          </Button>
        </form>

        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
      </Card>
    </Page>
  )
}
