'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMode } from '@/lib/useMode'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const userNav: NavSection[] = [
  {
    title: 'Espace',
    items: [
      { href: '/app', label: 'Mes Projets', icon: '📁' },
      { href: '/', label: 'Explorer mots-clés', icon: '🔍' },
    ],
  },
  {
    title: 'Concurrence',
    items: [
      { href: '/serp', label: 'Analyse SERP', icon: '📊' },
      { href: '/domain', label: 'Concurrents', icon: '🌐' },
    ],
  },
  {
    title: 'Suivi',
    items: [{ href: '/tracker', label: 'Positions', icon: '📈' }],
  },
]

const adminNav: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '🏠' },
      { href: '/database', label: 'Base mots-clés', icon: '🗃️' },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { href: '/', label: 'Explorer mots-clés', icon: '🔍' },
      { href: '/serp', label: 'Analyse SERP', icon: '📊' },
    ],
  },
  {
    title: 'Concurrence',
    items: [
      { href: '/domain', label: 'Domaine', icon: '🌐' },
      { href: '/backlinks', label: 'Backlinks', icon: '🔗' },
      { href: '/audit', label: 'Audit on-page', icon: '🩺' },
    ],
  },
  {
    title: 'Suivi',
    items: [{ href: '/tracker', label: 'Positions', icon: '📈' }],
  },
]

export default function Nav() {
  const pathname = usePathname()
  const [mode, setMode] = useMode()
  const sections = mode === 'admin' ? adminNav : userNav

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--crimson)] text-lg font-bold text-white">
          س
        </div>
        <div>
          <div className="text-sm font-bold leading-tight text-[var(--text)]">SEO·MENA</div>
          <div className="text-[10px] font-medium text-[var(--text-3)]">Analytics</div>
        </div>
      </div>

      {/* Mode switch */}
      <div className="px-4 pb-3">
        <div className="flex rounded-xl bg-[var(--subtle)] p-1">
          <button
            onClick={() => setMode('user')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              mode === 'user' ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-2)]'
            }`}
          >
            Utilisateur
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              mode === 'admin' ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-2)]'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--crimson)]/8 text-[var(--crimson)]'
                        : 'text-[var(--text-2)] hover:bg-[var(--subtle)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--crimson)] to-[#ff5c8a] text-xs font-bold text-white">
            {mode === 'admin' ? 'A' : 'U'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-[var(--text)]">
              {mode === 'admin' ? 'Mode Admin' : 'Mode Utilisateur'}
            </div>
            <div className="truncate text-[10px] text-[var(--text-3)]">MENA · Gulf</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
