'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMode } from '@/lib/useMode'

const userLinks = [
  { href: '/app', label: 'Mes Projets' },
  { href: '/', label: 'Recherche' },
  { href: '/overview', label: 'Aperçu' },
  { href: '/serp', label: 'SERP' },
  { href: '/domain', label: 'Concurrents' },
  { href: '/tracker', label: 'Suivi' },
]

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/database', label: 'Base' },
  { href: '/', label: 'Recherche' },
  { href: '/serp', label: 'SERP' },
  { href: '/domain', label: 'Domaine' },
  { href: '/backlinks', label: 'Backlinks' },
  { href: '/audit', label: 'Audit' },
  { href: '/tracker', label: 'Suivi' },
]

export default function Nav() {
  const pathname = usePathname()
  const [mode, setMode] = useMode()
  const links = mode === 'admin' ? adminLinks : userLinks

  return (
    <header className="relative border-b border-[#C9A961]/20 bg-[#0F172A]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A961] to-[#D4AF37] shadow-lg shadow-[#C9A961]/20">
            <span className="text-xl font-bold text-[#0F172A]">س</span>
          </div>
          <div>
            <div className="bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-xl font-bold text-transparent">
              SEO·MENA
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#C9A961]/60">
              Premium Analytics
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-[#1E293B]/50 p-1">
            <button
              onClick={() => setMode('user')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                mode === 'user'
                  ? 'bg-gradient-to-r from-[#C9A961] to-[#D4AF37] text-[#0F172A] shadow-lg shadow-[#C9A961]/20'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              User
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-[#C9A961] to-[#D4AF37] text-[#0F172A] shadow-lg shadow-[#C9A961]/20'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#C9A961]/10 text-[#C9A961] shadow-inner'
                      : 'text-neutral-300 hover:bg-[#1E293B]/50 hover:text-[#C9A961]'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </header>
  )
}
