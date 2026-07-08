'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePT, useT } from '@/lib/i18n'
import { Page, WorkspaceHeader, Card, StatCard, SectionTitle } from '@/components/ui'

interface Stats { bankCount: number; usersCount: number; projectsCount: number }

export default function AdminPage() {
  const p = usePT()
  const { t } = useT()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(console.error)
  }, [])

  const links = [
    { href: '/database', icon: '🗃️', title: p.kwBank, desc: p.cardBankSub },
    { href: '/tracker', icon: '📈', title: t.mPositions, desc: p.cardTrackerSub },
    { href: '/', icon: '🔍', title: t.mExplorer, desc: p.cardSearchSub },
    { href: '/domain', icon: '🌐', title: t.mCompetitors, desc: p.cardCompSub },
  ]

  return (
    <Page>
      <WorkspaceHeader icon="🏠" title={p.adminTitle} subtitle={p.adminSub} />
      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label={p.kwBank} value={stats.bankCount.toLocaleString('fr')} sub={p.kwBankSub} accent />
          <StatCard label={p.usersN} value={stats.usersCount.toLocaleString('fr')} sub={p.usersSub} />
          <StatCard label={p.projectsN} value={stats.projectsCount.toLocaleString('fr')} sub={p.projectsSub} />
        </div>
      )}
      <SectionTitle>{p.quickAccess}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="transition-colors hover:border-[var(--crimson)]">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="text-xl">{l.icon}</span>
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
