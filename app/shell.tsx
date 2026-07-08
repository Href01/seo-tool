'use client'

import Nav from './nav'
import { useLang } from '@/lib/i18n'

export default function Shell({ children }: { children: React.ReactNode }) {
  const [lang] = useLang()
  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex min-h-screen">
      <Nav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
