'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePT } from '@/lib/i18n'

/* WorkspaceHeader — page identity: crimson icon tile + title + subtitle + actions */
export function WorkspaceHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--crimson)]/15 to-[var(--crimson)]/[0.04] text-[19px] text-[var(--crimson)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--crimson)]/10">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-[var(--text)]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--text-2)]">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

/* InfoTip — a small "?" that reveals a plain-language explanation on hover/focus.
   CSS-only (no JS lib), keyboard-accessible, works in LTR and RTL. Use it to
   demystify jargon metrics (volume, difficulté, CPC…) for non-experts. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <span
        tabIndex={0}
        role="note"
        aria-label={text}
        className="ms-1 inline-flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-[var(--text-3)] text-[9px] font-bold leading-none text-[var(--text-3)] transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crimson)]/30"
      >
        ?
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-[var(--ink)] px-3 py-2 text-start text-[11.5px] font-medium leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  )
}

/* Callout — a soft guidance banner for the top of a page: one clear sentence on
   what the page does and how to use it. Keeps the tool understandable for
   non-experts without cluttering the workspace. */
export function Callout({
  children,
  icon = '💡',
  tone = 'info',
}: {
  children: ReactNode
  icon?: string
  tone?: 'info' | 'tip'
}) {
  const tones: Record<string, string> = {
    info: 'border-[var(--line)] bg-[var(--subtle)]',
    tip: 'border-[var(--crimson)]/25 bg-[var(--crimson)]/5',
  }
  return (
    <div className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <span className="shrink-0 text-base leading-none">{icon}</span>
      <div className="text-[13px] leading-relaxed text-[var(--text-2)]">{children}</div>
    </div>
  )
}

/* Onboarding — a dismissible "how to start" card with numbered steps, shown to
   first-time users. Remembers dismissal in localStorage under storageKey. */
export function Onboarding({
  storageKey,
  title,
  steps,
  dismissLabel,
}: {
  storageKey: string
  title: string
  steps: string[]
  dismissLabel: string
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(storageKey))
    } catch {
      setShow(true)
    }
  }, [storageKey])
  if (!show) return null
  function close() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {}
    setShow(false)
  }
  return (
    <div className="mb-6 rounded-2xl border border-[var(--crimson)]/25 bg-[var(--crimson)]/5 p-5 text-start">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-[var(--text)]">{title}</div>
        <button
          onClick={close}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-3)] transition-colors hover:bg-[var(--card)] hover:text-[var(--text)]"
        >
          ✕ {dismissLabel}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl bg-[var(--card)] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--crimson)] text-xs font-bold text-white">
              {i + 1}
            </span>
            <div className="text-[12.5px] leading-snug text-[var(--text-2)]">{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* DistributionBar — a stacked ratio bar with legend (position spread, etc.) */
export function DistributionBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--subtle)]">
        {segments.map((s, i) =>
          s.value > 0 ? <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} /> : null
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-2)]">
        {segments.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label} <b className="text-[var(--text)] tnum">{s.value}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

/** 0–100 presence score: rank 1 ≈ 100, rank ≥21 or unranked ≈ 0. */
export function visibilityScore(positions: (number | null)[]): number {
  if (!positions.length) return 0
  const s = positions.reduce<number>((acc, p) => acc + (p == null ? 0 : Math.max(0, (21 - Math.min(p, 21)) / 20)), 0)
  return Math.round((s / positions.length) * 100)
}

/* Card — the base white rounded surface used everywhere */
export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)] ${
        padded ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* Sparkline — a tiny inline trend line with a soft gradient area fill. */
export function Sparkline({
  data,
  color = 'var(--crimson)',
  width = 72,
  height = 24,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const stepX = width / (data.length - 1)
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const pts = data.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`)
  const gid = `sl${Math.round(data[0])}_${data.length}_${Math.round(max)}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={`url(#${gid})`} />
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* TrendPill — the small green ↑ / red ↓ percentage badge */
export function TrendPill({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? 'bg-[var(--up-bg)] text-[var(--up)]' : 'bg-[var(--down-bg)] text-[var(--down)]'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  )
}

/* Pill — a neutral rounded badge (counts, tags) */
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'crimson' | 'ink' | 'green' | 'amber' | 'red'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--subtle)] text-[var(--text-2)]',
    crimson: 'bg-[var(--crimson)] text-white',
    ink: 'bg-[var(--ink)] text-white',
    green: 'bg-[var(--up-bg)] text-[var(--up)]',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-[var(--down-bg)] text-[var(--down)]',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

/* StatCard — label, big number, optional trend pill + subtitle */
export function StatCard({
  label,
  value,
  trend,
  sub,
  info,
  spark,
  accent = false,
  dark = false,
}: {
  label: string
  value: ReactNode
  trend?: number
  sub?: string
  info?: string
  spark?: number[]
  accent?: boolean
  dark?: boolean
}) {
  const base = dark
    ? 'bg-gradient-to-br from-[#26262b] to-[var(--ink)] text-white border-transparent'
    : accent
    ? 'bg-gradient-to-br from-[var(--crimson)]/[0.06] to-[var(--card)] border-[var(--crimson)]/40'
    : 'bg-gradient-to-br from-white to-[#fafafb] border-[var(--line)]'
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${base}`}
    >
      <div className={`flex items-center text-xs font-medium ${dark ? 'text-white/60' : 'text-[var(--text-2)]'}`}>
        <span className="truncate">{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className={`text-2xl font-bold tracking-tight tnum ${dark ? 'text-white' : 'text-[var(--text)]'}`}>
          {value}
        </div>
        {trend !== undefined && <TrendPill value={trend} />}
      </div>
      {sub && <div className={`mt-1 text-xs ${dark ? 'text-white/50' : 'text-[var(--text-3)]'}`}>{sub}</div>}
      {spark && spark.length > 1 && (
        <div className="mt-2 -mb-1">
          <Sparkline data={spark} color={accent ? 'var(--crimson)' : dark ? '#ffffff' : 'var(--text-3)'} width={120} height={26} />
        </div>
      )}
    </div>
  )
}

/* SectionTitle — consistent heading above a block */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-[var(--text)]">{children}</h2>
      {action}
    </div>
  )
}

/* Primary button — crimson */
export function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'primary' | 'ink' | 'ghost'
  className?: string
}) {
  const variants: Record<string, string> = {
    primary: 'bg-[var(--crimson)] text-white hover:bg-[var(--crimson-dark)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
    ink: 'bg-[var(--ink)] text-white hover:bg-black shadow-[var(--shadow-sm)]',
    ghost: 'bg-[var(--subtle)] text-[var(--text)] hover:bg-[var(--line)]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

/* Input — clean rounded field */
export function Input({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-3)] outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10 ${className}`}
    />
  )
}

/* Loading spinner (crimson) */
export function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  )
}

/* Empty state (optionally with clickable example chips) */
export function EmptyState({
  icon,
  title,
  hint,
  chipsLabel,
  chips,
}: {
  icon: string
  title: string
  hint: string
  chipsLabel?: string
  chips?: { label: string; onClick: () => void }[]
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-10 py-14 text-center shadow-[var(--shadow-sm)]">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--crimson)]/12 to-[var(--crimson)]/[0.03] text-3xl ring-1 ring-[var(--crimson)]/10">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="text-sm text-[var(--text-2)]">{hint}</p>
      {chips && chips.length > 0 && (
        <div className="mt-6">
          {chipsLabel && <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-3)]">{chipsLabel}</div>}
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((c, i) => (
              <button key={i} onClick={c.onClick} className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:border-[var(--crimson)] hover:text-[var(--crimson)]">
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* PageHeader — main content top bar: title, subtitle, right-side actions */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-2)]">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

/* Page — consistent outer padding wrapper (with a subtle content reveal) */
export function Page({ children }: { children: ReactNode }) {
  return <main className="animate-in mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</main>
}

/* CacheMeta — the "⚡ cache / 💳 API · maj X" line */
export function CacheMeta({
  cached,
  fetchedAt,
  timeAgo,
  extra,
}: {
  cached: boolean
  fetchedAt: string | null
  timeAgo: (s: string) => string
  extra?: string
}) {
  const p = usePT()
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-2)]">
      {cached ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--up-bg)] px-2 py-0.5 font-medium text-[var(--up)]">
          {p.cacheFree}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--subtle)] px-2 py-0.5 font-medium text-[var(--text-2)]">
          {p.apiCall}
        </span>
      )}
      {cached && fetchedAt && <span className="text-[var(--text-3)]">{p.maj} {timeAgo(fetchedAt)}</span>}
      {extra && <span className="text-[var(--text-3)]">· {extra}</span>}
    </div>
  )
}

/* ErrorBox — shows the error and, when it looks like an auth error, a login CTA
   so the user knows what to do next instead of just seeing a dead end. */
export function ErrorBox({ message }: { message: string }) {
  const p = usePT()
  const isAuth = /connexion|connecter|admin requis|non autoris|الدخول|تسجيل|صلاحي/i.test(message)
  return (
    <div className="rounded-2xl border border-[var(--down-bg)] bg-[var(--down-bg)]/40 px-5 py-4 text-sm text-[var(--down)]">
      <span className="font-semibold">{p.errorLabel} ·</span> {message}
      {isAuth && (
        <Link href="/login" className="ms-2 font-semibold underline underline-offset-2">
          {p.signIn}
        </Link>
      )}
    </div>
  )
}

/* Segmented control — like the Revenue/Leads/W-L toggle in the reference */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl bg-[var(--subtle)] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === o.id ? 'bg-[var(--ink)] text-white' : 'text-[var(--text-2)] hover:text-[var(--text)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
