'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Grouped so the growing feature set stays legible: keyword research, competitive
// analysis, and ongoing tracking are distinct jobs.
const groups: { label: string; href: string }[][] = [
  [
    { href: '/', label: 'Mots-clés' },
    { href: '/overview', label: 'Aperçu' },
    { href: '/serp', label: 'SERP' },
  ],
  [
    { href: '/domain', label: 'Domaine' },
    { href: '/backlinks', label: 'Backlinks' },
    { href: '/audit', label: 'Audit' },
  ],
  [
    { href: '/tracker', label: 'Suivi' },
    { href: '/database', label: 'Base' },
  ],
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-1 gap-y-1 px-6 py-3 text-sm">
        <span className="mr-2 font-semibold tracking-tight">
          SEO<span className="text-neutral-400">·</span>MA
        </span>
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-wrap items-center gap-1">
            {gi > 0 && (
              <span className="mx-1 hidden h-4 w-px bg-neutral-200 dark:bg-neutral-800 sm:block" />
            )}
            {group.map((l) => {
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
          </div>
        ))}
      </nav>
    </header>
  )
}
