'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Page, WorkspaceHeader, Card, Button, Spinner, ErrorBox } from '@/components/ui'
import { usePT } from '@/lib/i18n'
import { errorMessage } from '@/lib/errors'

type AuthMode = 'login' | 'signup'

interface AuthResponse {
  user?: { role?: string }
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const p = usePT()
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
        title={mode === 'login' ? p.authLoginTitle : p.authSignupTitle}
        subtitle={p.authSub}
      />

      <Card className="mx-auto max-w-md">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--subtle)] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${mode === 'login' ? 'brand-grad text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'}`}
          >
            {p.authTabLogin}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${mode === 'signup' ? 'brand-grad text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'}`}
          >
            {p.authTabSignup}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={p.authName}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder={p.authEmail}
            dir="ltr"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10"
          />
          <div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              placeholder={p.authPassword}
              dir="ltr"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10"
            />
            {mode === 'signup' && <p className="mt-1.5 text-xs text-[var(--text-3)]">{p.authPwHint}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Spinner /> {p.authWait}</> : mode === 'login' ? p.signIn : p.authSignupBtn}
          </Button>
        </form>

        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
      </Card>
    </Page>
  )
}
