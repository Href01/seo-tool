'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { usePT } from '@/lib/i18n'
import { Page, PageHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle } from '@/components/ui'

interface BacklinksSummary {
  domain: string
  backlinks: number | null
  referringDomains: number | null
  referringMainDomains: number | null
  rank: number | null
  spamScore: number | null
  dofollow: number | null
  nofollow: number | null
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

export default function BacklinksPage() {
  const p = usePT()
  const [domain, setDomain] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<BacklinksSummary>('/api/backlinks')

  function spamLevel(score: number) {
    if (score < 15) return { l: p.spamHealthy, c: 'text-[var(--up)]', bar: 'bg-[var(--up)]', hint: p.spamHealthyHint }
    if (score < 40) return { l: p.spamModerate, c: 'text-amber-700', bar: 'bg-amber-500', hint: p.spamModHint }
    return { l: p.spamRisky, c: 'text-[var(--down)]', bar: 'bg-[var(--down)]', hint: p.spamRiskyHint }
  }

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    run({ domain })
  }

  const dofollowPct =
    data && data.dofollow != null && data.nofollow != null && data.dofollow + data.nofollow > 0
      ? (data.dofollow / (data.dofollow + data.nofollow)) * 100
      : null

  return (
    <Page>
      <PageHeader title={p.blTitle} subtitle={p.blSub} />
      <Card className="mb-6">
        <form onSubmit={search} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{p.domainLabel}</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={p.domPh} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10" />
          </div>
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (<><Spinner /> {p.analyzing}</>) : p.analyze}
          </Button>
        </form>
        {cached !== null && !error && data && (
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <CacheMeta cached={cached} fetchedAt={fetchedAt} timeAgo={timeAgo} extra={data.domain} />
          </div>
        )}
      </Card>

      {error && <div className="mb-6"><ErrorBox message={error} /></div>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={p.backlinks} value={fmt(data.backlinks)} />
            <StatCard label={p.refDomains} value={fmt(data.referringDomains)} accent />
            <StatCard label={p.mainDomains} value={fmt(data.referringMainDomains)} />
            <StatCard label={p.authRank} value={fmt(data.rank)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.spamScore != null && (
              <Card>
                <SectionTitle>{p.spamScore}</SectionTitle>
                <div className="flex items-center gap-5">
                  <div className={`text-4xl font-bold tnum ${spamLevel(data.spamScore).c}`}>{data.spamScore}%</div>
                  <div>
                    <div className={`text-lg font-bold ${spamLevel(data.spamScore).c}`}>{spamLevel(data.spamScore).l}</div>
                    <div className="text-sm text-[var(--text-2)]">{spamLevel(data.spamScore).hint}</div>
                  </div>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--subtle)]">
                  <div className={`h-full rounded-full ${spamLevel(data.spamScore).bar}`} style={{ width: `${Math.min(100, data.spamScore)}%` }} />
                </div>
              </Card>
            )}

            {dofollowPct != null && (
              <Card>
                <SectionTitle>{p.dofollowRatio}</SectionTitle>
                <div className="flex items-center gap-5">
                  <div className="text-4xl font-bold text-[var(--up)] tnum">{dofollowPct.toFixed(0)}%</div>
                  <div className="text-sm text-[var(--text-2)]">
                    <div><span className="text-[var(--up)]">●</span> {fmt(data.dofollow)} {p.dofollow}</div>
                    <div><span className="text-[var(--text-3)]">●</span> {fmt(data.nofollow)} {p.nofollow}</div>
                  </div>
                </div>
                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[var(--subtle)]">
                  <div className="h-full bg-[var(--up)]" style={{ width: `${dofollowPct}%` }} />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {!data && !loading && !error && <EmptyState icon="🔗" title={p.emptyBlT} hint={p.emptyBlH} />}
    </Page>
  )
}
