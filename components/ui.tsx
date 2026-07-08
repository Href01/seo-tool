'use client'

import { ReactNode } from 'react'
import { usePT } from '@/lib/i18n'

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
      className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] ${
        padded ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
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
  accent = false,
  dark = false,
}: {
  label: string
  value: ReactNode
  trend?: number
  sub?: string
  accent?: boolean
  dark?: boolean
}) {
  const base = dark
    ? 'bg-[var(--ink)] text-white border-transparent'
    : accent
    ? 'bg-[var(--card)] border-[var(--crimson)]'
    : 'bg-[var(--card)] border-[var(--line)]'
  return (
    <div className={`rounded-2xl border p-5 ${base}`}>
      <div className={`text-xs font-medium ${dark ? 'text-white/60' : 'text-[var(--text-2)]'}`}>
        {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className={`text-2xl font-bold tracking-tight tnum ${dark ? 'text-white' : 'text-[var(--text)]'}`}>
          {value}
        </div>
        {trend !== undefined && <TrendPill value={trend} />}
      </div>
      {sub && <div className={`mt-1 text-xs ${dark ? 'text-white/50' : 'text-[var(--text-3)]'}`}>{sub}</div>}
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
    primary: 'bg-[var(--crimson)] text-white hover:bg-[var(--crimson-dark)] shadow-sm',
    ink: 'bg-[var(--ink)] text-white hover:bg-black',
    ghost: 'bg-[var(--subtle)] text-[var(--text)] hover:bg-[var(--line)]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
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

/* Empty state */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-10 py-16 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="text-sm text-[var(--text-2)]">{hint}</p>
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

/* Page — consistent outer padding wrapper */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</main>
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

/* ErrorBox */
export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[var(--down-bg)] bg-[var(--down-bg)]/40 px-5 py-4 text-sm text-[var(--down)]">
      <span className="font-semibold">Erreur ·</span> {message}
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
