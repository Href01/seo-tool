'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useMode } from '@/lib/useMode'
import { useT, usePT } from '@/lib/i18n'

interface SessionUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
}

function Icon({ name }: { name: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const icons: Record<string, ReactNode> = {
    search: (<><circle cx="7" cy="7" r="5" {...p} /><line x1="10.8" y1="10.8" x2="15" y2="15" {...p} /></>),
    folder: (<path d="M2 5.5C2 4.7 2.7 4 3.5 4H7l1.5 1.7h5c.8 0 1.5.7 1.5 1.5v5.3c0 .8-.7 1.5-1.5 1.5h-10C2.7 15 2 14.3 2 13.5z" {...p} />),
    bars: (<><rect x="2" y="9" width="3" height="6" rx="1" {...p} /><rect x="7" y="5" width="3" height="10" rx="1" {...p} /><rect x="12" y="2" width="3" height="13" rx="1" {...p} /></>),
    globe: (<><circle cx="8.5" cy="8.5" r="6.5" {...p} /><ellipse cx="8.5" cy="8.5" rx="2.7" ry="6.5" {...p} /><line x1="2" y1="8.5" x2="15" y2="8.5" {...p} /></>),
    chain: (<><path d="M7 10a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-1 1" {...p} /><path d="M10 7a3 3 0 0 0-4.2 0L3.5 9.3a3 3 0 0 0 4.2 4.2l1-1" {...p} /></>),
    trend: (<><polyline points="2,12 6,8 9.5,10.5 15,3.5" {...p} /><polyline points="11,3.5 15,3.5 15,7.5" {...p} /></>),
    home: (<><path d="M2.5 7.5 8.5 2.5l6 5" {...p} /><path d="M4 7v7h9V7" {...p} /></>),
    db: (<><ellipse cx="8.5" cy="4" rx="5.5" ry="2.2" {...p} /><path d="M3 4v9c0 1.2 2.5 2.2 5.5 2.2S14 14.2 14 13V4" {...p} /></>),
    audit: (<><path d="M8.5 2.5A6 6 0 1 0 14.5 8.5" {...p} /><path d="M6 8.5l2 2 4-4.5" {...p} /></>),
  }
  return <svg width="17" height="17" viewBox="0 0 17 17">{icons[name] ?? icons.search}</svg>
}

interface NavItem {
  href: string
  key: keyof ReturnType<typeof useT>['t']
  icon: string
}
interface Section {
  titleKey: keyof ReturnType<typeof useT>['t']
  items: NavItem[]
}

const userNav: Section[] = [
  { titleKey: 'secEspace', items: [
    { href: '/', key: 'mExplorer', icon: 'search' },
    { href: '/app', key: 'mProjects', icon: 'folder' },
  ] },
  { titleKey: 'secConc', items: [
    { href: '/serp', key: 'mSerp', icon: 'bars' },
    { href: '/domain', key: 'mCompetitors', icon: 'globe' },
    { href: '/backlinks', key: 'mBacklinks', icon: 'chain' },
  ] },
  { titleKey: 'secSuivi', items: [
    { href: '/tracker', key: 'mPositions', icon: 'trend' },
  ] },
]

const adminNav: Section[] = [
  { titleKey: 'secEspace', items: [
    { href: '/admin', key: 'mAdminHome', icon: 'home' },
    { href: '/database', key: 'mDatabase', icon: 'db' },
  ] },
  { titleKey: 'secConc', items: [
    { href: '/', key: 'mExplorer', icon: 'search' },
    { href: '/serp', key: 'mSerp', icon: 'bars' },
    { href: '/domain', key: 'mCompetitors', icon: 'globe' },
    { href: '/backlinks', key: 'mBacklinks', icon: 'chain' },
    { href: '/audit', key: 'mAudit', icon: 'audit' },
  ] },
  { titleKey: 'secSuivi', items: [
    { href: '/tracker', key: 'mPositions', icon: 'trend' },
  ] },
]

// Plain-language tooltip per destination (reuses the page-guidance strings).
const HELP_KEY: Record<string, string> = {
  '/': 'helpExplorer',
  '/app': 'helpProjects',
  '/serp': 'helpSerp',
  '/domain': 'helpDomain',
  '/backlinks': 'helpBacklinks',
  '/tracker': 'helpTracker',
  '/audit': 'helpAudit',
  '/admin': 'helpAdmin',
  '/database': 'helpDatabase',
}

export default function Nav() {
  const pathname = usePathname()
  const [mode, setMode] = useMode()
  const { t, lang, setLang } = useT()
  const p = usePT()
  const [user, setUser] = useState<SessionUser | null>(null)
  const isAdmin = user?.role === 'admin'
  const effectiveMode = isAdmin ? mode : 'user'
  const sections = effectiveMode === 'admin' ? adminNav : userNav

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data: { user?: SessionUser | null }) => {
        setUser(data.user ?? null)
        if (data.user?.role !== 'admin' && mode === 'admin') setMode('user')
      })
      .catch(() => setUser(null))
  }, [mode, setMode])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMode('user')
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[246px] shrink-0 flex-col border-e border-[var(--line)] bg-[var(--card)]">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-[18px]">
        <div className="brand-grad brand-anim flex h-[34px] w-[34px] items-center justify-center rounded-[11px] text-[17px] font-bold text-white shadow-[var(--shadow-md)]">
          S
        </div>
        <div>
          <div className="text-sm font-bold leading-[1.1] tracking-[-0.01em]">SEO MENA</div>
          <div className="text-[10.5px] font-medium text-[var(--text-3)]">{t.appSub}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
        {sections.map((section, si) => (
          <div key={si}>
            <div className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">
              {t[section.titleKey]}
            </div>
            {section.items.map((item, ii) => {
              const active = pathname === item.href
              return (
                <Link
                  key={ii}
                  href={item.href}
                  title={p[HELP_KEY[item.href]] ?? undefined}
                  className={`flex items-center gap-[11px] rounded-[11px] px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? 'bg-[var(--crimson)]/8 font-semibold text-[var(--crimson)]'
                      : 'font-medium text-[#52525b] hover:bg-[var(--subtle)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon name={item.icon} />
                  {t[item.key]}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--line)] p-3">
        <div className="mb-2.5 flex gap-1.5 px-0.5">
          {isAdmin ? (
            <button
              onClick={() => setMode(effectiveMode === 'admin' ? 'user' : 'admin')}
              className="flex-1 rounded-[9px] border border-[var(--line)] bg-[var(--card)] py-1.5 text-[11px] font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
            >
              {effectiveMode === 'admin' ? 'Admin' : 'User'}
            </button>
          ) : (
            <Link
              href="/login"
              className="flex-1 rounded-[9px] border border-[var(--line)] bg-[var(--card)] py-1.5 text-center text-[11px] font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
            >
              {user ? 'Compte' : 'Login'}
            </Link>
          )}
          <button
            onClick={() => setLang('fr')}
            className={`w-9 rounded-[9px] py-1.5 text-[11px] font-semibold transition-colors ${
              lang === 'fr' ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] text-[var(--text-2)]'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`w-9 rounded-[9px] py-1.5 text-[13px] font-semibold transition-colors ${
              lang === 'ar' ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] text-[var(--text-2)]'
            }`}
          >
            AR
          </button>
        </div>
        <div className="flex items-center gap-2.5 px-1 py-0.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--crimson)] to-[#ff5c8a] text-xs font-bold text-white">
            {isAdmin ? 'A' : user ? 'U' : '?'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold leading-tight">
              {user ? user.name || user.email : 'Invite'}
            </div>
            <div className="truncate font-mono text-[10.5px] text-[var(--text-3)]">
              {user ? user.email : 'Connexion requise'}
            </div>
          </div>
          {user && (
            <button
              onClick={logout}
              title="Logout"
              className="ms-auto rounded-md px-1.5 py-1 text-[10px] font-semibold text-[var(--text-3)] hover:bg-[var(--subtle)] hover:text-[var(--text)]"
            >
              out
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
