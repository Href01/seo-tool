'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Mots-clés' },
  { href: '/serp', label: 'SERP' },
  { href: '/overview', label: 'Aperçu mot-clé' },
  { href: '/domain', label: 'Domaine' },
  { href: '/backlinks', label: 'Backlinks' },
  { href: '/audit', label: 'Audit' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-3xl flex-wrap gap-1 px-6 py-3 text-sm">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 font-medium ${
                active
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
