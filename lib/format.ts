// Locale-aware formatting. Numbers/dates follow the UI language. For Arabic we
// use ar-MA (Morocco, the primary market): CLDR defaults it to Western/Latin
// digits with locale-appropriate grouping — Maghreb readers expect 1 000, not
// Arabic-Indic ٠١٢٣.
import type { Lang } from './i18n'

const LOCALE: Record<Lang, string> = { fr: 'fr-FR', ar: 'ar-MA' }

export function formatNumber(
  n: number | null | undefined,
  lang: Lang,
  opts?: Intl.NumberFormatOptions
): string {
  if (n == null) return '—'
  return new Intl.NumberFormat(LOCALE[lang] ?? 'fr-FR', opts).format(n)
}

export function formatDate(
  iso: string | null | undefined,
  lang: Lang,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(LOCALE[lang] ?? 'fr-FR', opts).format(d)
}

/** Human freshness label ("il y a 3 jours" / "منذ 3 أيام"). */
export function formatRelative(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const days = Math.floor((Date.now() - t) / 86_400_000)
  if (lang === 'ar') {
    if (days <= 0) return 'اليوم'
    if (days === 1) return 'منذ يوم'
    if (days === 2) return 'منذ يومين'
    return `منذ ${days} أيام`
  }
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}
