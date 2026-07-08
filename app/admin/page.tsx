'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePT, useT } from '@/lib/i18n'
import { Page, WorkspaceHeader, Card, StatCard, SectionTitle, ErrorBox } from '@/components/ui'

interface UsageWindow {
  cost: number
  calls: number
}

interface EndpointUsage {
  endpoint: string
  cost: number
  calls: number
}

interface CacheUsage {
  prefix: string
  hits: number
  misses: number
  hitRate: number
}

interface Stats {
  bankCount: number
  usersCount: number
  projectsCount: number
  usage: {
    today: UsageWindow
    last7d: UsageWindow
    last30d: UsageWindow
    endpoints: EndpointUsage[]
    cache: CacheUsage[]
  }
}

const money = (n: number) => `$${n.toFixed(n >= 1 ? 2 : 4)}`

export default function AdminPage() {
  const p = usePT()
  const { t } = useT()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setStats(data)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erreur'))
  }, [])

  const links = [
    { href: '/database', icon: 'DB', title: p.kwBank, desc: p.cardBankSub },
    { href: '/tracker', icon: 'RK', title: t.mPositions, desc: p.cardTrackerSub },
    { href: '/', icon: 'KW', title: t.mExplorer, desc: p.cardSearchSub },
    { href: '/domain', icon: 'DM', title: t.mCompetitors, desc: p.cardCompSub },
  ]

  return (
    <Page>
      <WorkspaceHeader icon="A" title={p.adminTitle} subtitle={p.adminSub} />

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {stats && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatCard label={p.kwBank} value={stats.bankCount.toLocaleString('fr')} sub={p.kwBankSub} accent />
            <StatCard label={p.usersN} value={stats.usersCount.toLocaleString('fr')} sub={p.usersSub} />
            <StatCard label={p.projectsN} value={stats.projectsCount.toLocaleString('fr')} sub={p.projectsSub} />
          </div>

          <SectionTitle>Cost cockpit</SectionTitle>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Aujourd'hui" value={money(stats.usage.today.cost)} sub={`${stats.usage.today.calls} appels`} dark />
            <StatCard label="7 jours" value={money(stats.usage.last7d.cost)} sub={`${stats.usage.last7d.calls} appels`} />
            <StatCard label="30 jours" value={money(stats.usage.last30d.cost)} sub={`${stats.usage.last30d.calls} appels`} />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle>Endpoints DataForSEO</SectionTitle>
              {stats.usage.endpoints.length === 0 ? (
                <div className="text-sm text-[var(--text-3)]">Aucun cout enregistre.</div>
              ) : (
                <div className="space-y-2">
                  {stats.usage.endpoints.map((row) => (
                    <div key={row.endpoint} className="flex items-center gap-3 rounded-xl bg-[var(--subtle)] px-3 py-2">
                      <div className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--text-2)]">{row.endpoint}</div>
                      <div className="w-16 text-end text-xs font-semibold tnum">{row.calls}</div>
                      <div className="w-20 text-end text-xs font-bold tnum text-[var(--text)]">{money(row.cost)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Cache hit rate</SectionTitle>
              {stats.usage.cache.length === 0 ? (
                <div className="text-sm text-[var(--text-3)]">Aucun evenement cache enregistre.</div>
              ) : (
                <div className="space-y-2">
                  {stats.usage.cache.map((row) => (
                    <div key={row.prefix} className="rounded-xl bg-[var(--subtle)] px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="font-mono text-xs font-semibold text-[var(--text)]">{row.prefix}</div>
                        <div className="text-xs font-bold tnum text-[var(--crimson)]">{row.hitRate}%</div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full bg-[var(--crimson)]" style={{ width: `${row.hitRate}%` }} />
                      </div>
                      <div className="mt-1 text-[10.5px] text-[var(--text-3)]">
                        {row.hits} hits / {row.misses} misses
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <SectionTitle>{p.quickAccess}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="transition-colors hover:border-[var(--crimson)]">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--subtle)] font-mono text-[10px] font-bold text-[var(--text-2)]">{l.icon}</span>
                <div className="font-semibold text-[var(--text)]">{l.title}</div>
              </div>
              <div className="text-sm text-[var(--text-2)]">{l.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </Page>
  )
}
