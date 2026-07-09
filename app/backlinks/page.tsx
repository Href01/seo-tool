'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'
import { usePT } from '@/lib/i18n'
import { Page, WorkspaceHeader, Card, Button, Spinner, CacheMeta, ErrorBox, EmptyState, StatCard, SectionTitle, Callout, DistributionBar } from '@/components/ui'
import { DOMAIN_EXAMPLES } from '@/lib/examples'

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
      <WorkspaceHeader icon="🔗" title={p.blTitle} subtitle={p.blSub} />
      <Callout>{p.helpBacklinks}</Callout>
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
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--up)] tnum">{dofollowPct.toFixed(0)}%</span>
                  <span className="text-sm text-[var(--text-3)]">{p.dofollow}</span>
                </div>
                <DistributionBar segments={[
                  { label: p.dofollow, value: data.dofollow ?? 0, color: '#16a34a' },
                  { label: p.nofollow, value: data.nofollow ?? 0, color: '#d4d4d8' },
                ]} />
              </Card>
            )}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState
          icon="🔗"
          title={p.emptyBlT}
          hint={p.emptyBlH}
          chipsLabel={p.examples}
          chips={DOMAIN_EXAMPLES.map((ex) => ({ label: ex, onClick: () => { setDomain(ex); run({ domain: ex }) } }))}
        />
      )}
    </Page>
  )
}
