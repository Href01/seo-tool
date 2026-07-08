'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { usePT } from '@/lib/i18n'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle } from '@/components/ui'

interface PageAudit {
  url: string
  onpageScore: number | null
  title: string | null
  titleLength: number | null
  description: string | null
  descriptionLength: number | null
  h1: string[]
  wordCount: number | null
  internalLinks: number | null
  externalLinks: number | null
  issues: string[]
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

export default function AuditPage() {
  const p = usePT()
  const [url, setUrl] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<PageAudit>('/api/audit')

  function scoreLevel(score: number) {
    if (score >= 80) return { l: p.scoreExcellent, c: 'text-[var(--up)]', ring: '#16a34a' }
    if (score >= 60) return { l: p.scoreOk, c: 'text-amber-700', ring: '#d97706' }
    return { l: p.scoreImprove, c: 'text-[var(--down)]', ring: '#e11d48' }
  }
  function titleStatus(len: number | null) {
    if (len == null) return { c: 'text-[var(--down)]', h: p.missing }
    if (len < 30) return { c: 'text-amber-700', h: p.tooShort }
    if (len > 60) return { c: 'text-amber-700', h: p.tooLong }
    return { c: 'text-[var(--up)]', h: p.optimal }
  }
  function descStatus(len: number | null) {
    if (len == null) return { c: 'text-[var(--down)]', h: p.missingF }
    if (len < 120) return { c: 'text-amber-700', h: p.tooShortF }
    if (len > 160) return { c: 'text-amber-700', h: p.tooLongF }
    return { c: 'text-[var(--up)]', h: p.optimalF }
  }

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    run({ url })
  }

  const score = data?.onpageScore != null ? Math.round(data.onpageScore) : null

  return (
    <Page>
      <PageHeader title={p.auditTitle} subtitle={p.auditSub} />
      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{p.urlLabel}</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={p.urlPh} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10" />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (<><Spinner /> {p.analyzing}</>) : p.analyze}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {score != null && (
              <Card className="flex flex-col items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ececee" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={scoreLevel(score).ring} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`} />
                  </svg>
                  <div className="text-center">
                    <div className={`text-4xl font-bold tnum ${scoreLevel(score).c}`}>{score}</div>
                    <div className="text-xs text-[var(--text-3)]">/ 100</div>
                  </div>
                </div>
                <div className={`mt-3 text-base font-bold ${scoreLevel(score).c}`}>{scoreLevel(score).l}</div>
                <div className="text-xs text-[var(--text-3)]">{p.onpageScore}</div>
              </Card>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
              <StatCard label={p.words} value={fmt(data.wordCount)} />
              <StatCard label={p.internalLinks} value={fmt(data.internalLinks)} />
              <StatCard label={p.externalLinks} value={fmt(data.externalLinks)} />
            </div>
          </div>

          <Card>
            <SectionTitle>{p.metaTags}</SectionTitle>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-2)]">{p.titleLabel}</span>
                  {data.titleLength != null && <span className="text-[var(--text-3)]">({data.titleLength} {p.chars})</span>}
                  <span className={`font-semibold ${titleStatus(data.titleLength).c}`}>· {titleStatus(data.titleLength).h}</span>
                </div>
                <p className="text-sm text-[var(--text)]">{data.title || '—'}</p>
              </div>
              <div className="border-t border-[var(--line)] pt-4">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-2)]">{p.metaDesc}</span>
                  {data.descriptionLength != null && <span className="text-[var(--text-3)]">({data.descriptionLength} {p.chars})</span>}
                  <span className={`font-semibold ${descStatus(data.descriptionLength).c}`}>· {descStatus(data.descriptionLength).h}</span>
                </div>
                <p className="text-sm text-[var(--text)]">{data.description || '—'}</p>
              </div>
              <div className="border-t border-[var(--line)] pt-4">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-2)]">{p.h1Label}</span>
                  <span className={`font-semibold ${data.h1.length === 1 ? 'text-[var(--up)]' : 'text-amber-700'}`}>· {data.h1.length === 0 ? p.missing : data.h1.length === 1 ? p.unique : `${data.h1.length} H1`}</span>
                </div>
                <p className="text-sm text-[var(--text)]">{data.h1.length > 0 ? data.h1.join(' · ') : '—'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>{p.issuesDetected} ({data.issues.length})</SectionTitle>
            {data.issues.length === 0 ? (
              <div className="rounded-xl bg-[var(--up-bg)] px-4 py-3 text-sm font-medium text-[var(--up)]">✅ {p.noIssues}</div>
            ) : (
              <div className="space-y-2">
                {data.issues.map((issue) => (
                  <div key={issue} className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800"><span>⚠️</span><span>{issue}</span></div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {!data && !loading && !error && <EmptyState icon="🩺" title={p.emptyAuditT} hint={p.emptyAuditH} />}
    </Page>
  )
}
