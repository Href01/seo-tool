'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Page, PageHeader, Card, StatCard, SectionTitle } from '@/components/ui'

interface Stats {
  bankCount: number
  usersCount: number
  projectsCount: number
}

const links = [
  { href: '/database', icon: '🗃️', title: 'Base de mots-clés', desc: 'Tous les mots-clés MENA · recherche · export' },
  { href: '/tracker', icon: '📈', title: 'Suivi de positions', desc: 'Tracking global · historique · vérifications' },
  { href: '/', icon: '🔍', title: 'Recherche & analyse', desc: 'Mots-clés · SERP · difficulté maison · volume' },
  { href: '/domain', icon: '🌐', title: 'Analyse concurrence', desc: 'Domaines · backlinks · audit on-page' },
]

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
  }, [])

  return (
    <Page>
      <PageHeader title="Dashboard Admin" subtitle="Vue omnisciente · tous les projets, stats et données" />

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Base de mots-clés" value={stats.bankCount.toLocaleString('fr')} sub="Mots-clés MENA accumulés" accent />
          <StatCard label="Utilisateurs" value={stats.usersCount.toLocaleString('fr')} sub="Comptes actifs" />
          <StatCard label="Projets" value={stats.projectsCount.toLocaleString('fr')} sub="Sites suivis" />
        </div>
      )}

      <SectionTitle>Accès rapides</SectionTitle>
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
