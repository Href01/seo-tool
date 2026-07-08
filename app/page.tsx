'use client'

import { useState, useMemo } from 'react'
import { useSeoQuery } from '@/lib/useSeoQuery'
import { useT } from '@/lib/i18n'
import { LOCATIONS, DEVICES, DEFAULT_LOCATION, DEFAULT_DEVICE, getLocationByCode } from '@/lib/locations'

interface KeywordResult {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
}
interface KeywordOverview {
  keyword: string
  volume: number | null
  cpc: number | null
  competition: number | null
  difficulty: number | null
  intent: string | null
  source: 'labs' | 'google_ads'
  trend: { month: string; volume: number }[]
}
interface Competitor { position: number | null; domain: string; rank: number | null; counted: boolean }
interface DifficultyResult { keyword: string; difficulty: number; competitors: Competitor[] }

const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('fr-FR'))

function diffCfg(s: number, t: { easy: string; medium: string; hard: string }) {
  if (s < 30) return { c: '#16a34a', bg: '#dcfce7', l: t.easy }
  if (s < 60) return { c: '#b45309', bg: '#fef3c7', l: t.medium }
  return { c: '#e11d48', bg: '#ffe4e6', l: t.hard }
}

export default function Explorer() {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState('')
  const [variant, setVariant] = useState<'a' | 'b'>('a')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [device, setDevice] = useState(DEFAULT_DEVICE.id)

  const suggestions = useSeoQuery<KeywordResult[]>('/api/keywords')
  const overview = useSeoQuery<KeywordOverview>('/api/keyword-overview')
  const kd = useSeoQuery<DifficultyResult>('/api/difficulty')

  function analyze(kw: string, full: boolean) {
    const q = kw.trim()
    if (!q) return
    setFocus(q)
    const payload = { keyword: q, location, language: lang, device }
    overview.run(payload)
    kd.run(payload)
    if (full) suggestions.run(payload)
  }

  const ov = overview.data
  const loc = getLocationByCode(location) ?? DEFAULT_LOCATION

  // Focus difficulty (from overview or computed)
  const focusKd = ov?.difficulty ?? (kd.data?.keyword === focus ? kd.data.difficulty : null)
  const dcfg = focusKd != null ? diffCfg(focusKd, t) : null

  // Trend
  const maxTrend = ov?.trend.length ? Math.max(...ov.trend.map((x) => x.volume)) : 1

  // SERP landscape
  const comps = kd.data?.keyword === focus ? kd.data.competitors : []
  const maxAuth = comps.length ? Math.max(...comps.map((c) => c.rank ?? 0), 1) : 1
  const counted = comps.filter((c) => c.counted)
  const platformCount = comps.filter((c) => !c.counted).length

  // Insights (from suggestions)
  const insights = useMemo(() => {
    const list = suggestions.data ?? []
    const withKd = list.filter((k) => k.difficulty != null)
    return {
      volTotal: list.reduce((s, k) => s + (k.volume || 0), 0),
      quickWins: list.filter((k) => k.difficulty != null && k.difficulty < 30 && (k.volume || 0) > 500).length,
      avgKd: withKd.length ? Math.round(withKd.reduce((s, k) => s + (k.difficulty || 0), 0) / withKd.length) : 0,
      avoid: list.filter((k) => k.difficulty != null && k.difficulty >= 45).length,
    }
  }, [suggestions.data])

  const topDomain = counted[0]?.domain
  const brand = topDomain ? topDomain.split('.')[0] : ''
  const preview = topDomain
    ? {
        url: `${topDomain} › ${loc.country.toLowerCase()}`,
        title: `${focus.charAt(0).toUpperCase()}${focus.slice(1)} — ${brand.charAt(0).toUpperCase()}${brand.slice(1)}`,
        thumbs: counted.slice(1, 5).map((c) => c.domain),
      }
    : null

  const hasData = (suggestions.data && suggestions.data.length > 0) || !!ov
  const loading = overview.loading

  const selCls =
    'rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-2)] outline-none hover:border-[var(--text-3)] focus:border-[var(--crimson)]'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page)]">
      {/* ── LEFT: ideas ── */}
      <section className="flex w-[336px] shrink-0 flex-col border-e border-[var(--line)] bg-[var(--card)]">
        <div className="border-b border-[var(--line)] px-[18px] pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14.5px] font-bold tracking-[-0.01em]">
              {t.listIdeas} <span className="font-medium text-[var(--text-3)]">→</span>
            </div>
            {suggestions.data && (
              <span className="text-[11px] text-[var(--text-3)]">{suggestions.data.length}</span>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              analyze(query, true)
            }}
            className="flex items-center gap-2 rounded-[11px] border border-[var(--line)] bg-[var(--subtle)] px-3 py-2"
          >
            <svg width="15" height="15" viewBox="0 0 17 17" fill="none" stroke="#a1a1aa" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="7" cy="7" r="5" /><line x1="10.8" y1="10.8" x2="15" y2="15" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-[13px] font-medium text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto">
          {suggestions.loading && !suggestions.data ? (
            <div className="p-4 text-center text-sm text-[var(--text-3)]">{t.analyzing}</div>
          ) : (
            (suggestions.data ?? []).map((k, i) => {
              const active = k.keyword === focus
              const kc = k.difficulty != null ? diffCfg(k.difficulty, t) : null
              return (
                <div
                  key={i}
                  onClick={() => analyze(k.keyword, false)}
                  className="cursor-pointer border-b border-[var(--subtle)] px-4 py-3 transition-colors"
                  style={{
                    borderInlineStart: `2.5px solid ${active ? 'var(--crimson)' : 'transparent'}`,
                    background: active ? 'rgba(236,11,67,0.04)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[-0.01em]">{k.keyword}</span>
                    {kc && (
                      <span className="shrink-0 rounded-full px-[7px] py-0.5 text-[10.5px] font-bold tnum" style={{ color: kc.c, background: kc.bg }}>
                        {k.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-[var(--text-2)] tnum">
                    <span><span className="text-[var(--text-3)]">Vol</span> {fmt(k.volume)}</span>
                    <span><span className="text-[var(--text-3)]">CPC</span> {k.cpc != null ? `${k.cpc.toFixed(2)}$` : '—'}</span>
                  </div>
                </div>
              )
            })
          )}
          {!suggestions.data && !suggestions.loading && (
            <div className="px-6 py-12 text-center text-[13px] text-[var(--text-3)]">{t.ideasHint} ↑</div>
          )}
        </div>
      </section>

      {/* ── CENTER: workspace ── */}
      <main className="flex min-w-0 flex-1 flex-col bg-[var(--page)]">
        {ov ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="m-0 text-[19px] font-bold tracking-[-0.02em]">« {ov.keyword} »</h1>
                  <span className="rounded-full bg-[var(--subtle)] px-2 py-[3px] text-[10px] font-semibold text-[var(--text-2)]">
                    {ov.source === 'labs' ? 'Labs' : 'Google Ads'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <select value={location} onChange={(e) => setLocation(Number(e.target.value))} className={selCls}>
                    {LOCATIONS.map((l) => (<option key={l.code} value={l.code}>{l.flag} {l.name}</option>))}
                  </select>
                  <select value={device} onChange={(e) => setDevice(e.target.value)} className={selCls}>
                    {DEVICES.map((d) => (<option key={d.id} value={d.id}>{d.icon} {d.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex gap-1.5 rounded-xl bg-[#e9e9ec] p-1">
                <button onClick={() => setVariant('a')} className={`rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-colors ${variant === 'a' ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-2)]'}`}>📈 {t.trendView}</button>
                <button onClick={() => setVariant('b')} className={`rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-colors ${variant === 'b' ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-2)]'}`}>🗺️ {t.landscape}</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-7 pt-5">
              {/* stat headline */}
              <div className="mb-[18px] grid grid-cols-5 gap-3">
                <StatCard label={t.volume} value={fmt(ov.volume)} />
                <StatCard label={t.cpc} value={ov.cpc != null ? `${ov.cpc.toFixed(2)} $` : '—'} />
                <StatCard label={t.competition} value={ov.competition != null ? ov.competition.toFixed(2) : '—'} />
                <StatCard label={t.intent} value={ov.intent || '—'} small />
                <div className="rounded-[14px] border bg-[var(--card)] px-4 py-3.5" style={{ borderColor: focusKd != null && focusKd < 30 ? '#16a34a' : 'var(--line)' }}>
                  <div className="text-[11px] font-medium text-[var(--text-2)]">{t.difficulty}</div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[22px] font-bold tracking-[-0.02em] tnum" style={{ color: dcfg?.c }}>{focusKd ?? (kd.loading ? '…' : '—')}</span>
                    {dcfg && <span className="text-xs font-semibold" style={{ color: dcfg.c }}>{dcfg.l}</span>}
                  </div>
                </div>
              </div>

              {variant === 'a' ? (
                <>
                  {/* TREND */}
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-[22px] py-5">
                    <div className="mb-[18px] flex items-center justify-between">
                      <div className="text-sm font-bold">{t.trend12}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{t.perMonth}</div>
                    </div>
                    {ov.trend.length && ov.trend.some((x) => x.volume > 0) ? (
                      <div className="flex h-[200px] items-end gap-2">
                        {ov.trend.map((b, i) => {
                          const isMax = b.volume === maxTrend
                          const h = Math.max(8, Math.round((b.volume / maxTrend) * 150))
                          return (
                            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                              <span className="text-[10px] font-semibold text-[var(--text-3)] tnum">{b.volume >= 1000 ? `${(b.volume / 1000).toFixed(1)}k` : b.volume}</span>
                              <div className="w-full rounded-t-md transition-all" style={{ height: `${h}px`, background: isMax ? 'var(--crimson)' : 'rgba(236,11,67,0.22)' }} />
                              <span className="text-[10px] text-[var(--text-3)]">{b.month.slice(5)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-[var(--text-3)]">Tendance indisponible pour ce mot-clé.</div>
                    )}
                  </div>

                  {/* insights */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <InsightCard label={t.volTotal} value={fmt(insights.volTotal)} hint={t.perMonth} />
                    <InsightCard label={t.quickWins} value={insights.quickWins} hint="KD < 30 · vol > 500" color="#16a34a" border />
                    <InsightCard label={`KD ${t.avgLabel}`} value={insights.avgKd} hint={t.outOf100} />
                    <InsightCard label={t.avoid} value={insights.avoid} hint="KD ≥ 45" color="#e11d48" />
                  </div>
                </>
              ) : (
                /* SERP LANDSCAPE */
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-[22px] py-5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-sm font-bold">{t.whoRanks}</div>
                    <div className="text-[11px] text-[var(--text-3)]">Autorité /1000 · plateformes grisées</div>
                  </div>
                  <div className="mb-4 text-[11.5px] text-[var(--text-2)]">
                    <span className="font-semibold text-[#16a34a]">{counted.length} {t.realCompetitors}</span> · <span className="text-[var(--text-3)]">{platformCount} {t.platforms}</span>
                  </div>
                  {kd.loading && !comps.length ? (
                    <div className="py-10 text-center text-sm text-[var(--text-3)]">{t.computing}</div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {comps.map((c, i) => (
                        <div key={i} className="flex items-center gap-3" style={{ opacity: c.counted ? 1 : 0.55 }}>
                          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-xs font-bold tnum" style={{ color: c.counted ? '#3f3f46' : '#a1a1aa', background: '#f4f4f5' }}>{c.position ?? '—'}</span>
                          <span className="w-[150px] shrink-0 truncate font-mono text-[12.5px] font-semibold">{c.domain || '—'}</span>
                          <div className="h-[22px] flex-1 overflow-hidden rounded-md bg-[#f4f4f5]">
                            <div className="h-full rounded-md" style={{ width: `${Math.round(((c.rank ?? 0) / maxAuth) * 100)}%`, background: c.counted ? 'var(--crimson)' : '#d4d4d8' }} />
                          </div>
                          <span className="w-10 text-end text-xs font-bold tnum">{c.rank ?? '—'}</span>
                          <span className="w-16 text-end text-[10px] font-semibold" style={{ color: c.counted ? '#16a34a' : '#a1a1aa' }}>{c.counted ? 'Concurrent' : 'Plateforme'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-4xl">🔍</div>
              <div className="text-base font-semibold">{loading ? t.analyzing : t.emptyExplorerTitle}</div>
              {!loading && <div className="mt-1 text-sm text-[var(--text-2)]">{t.emptyExplorerHint}</div>}
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT: detail ── */}
      <aside className="flex w-[372px] shrink-0 flex-col border-s border-[var(--line)] bg-[var(--card)]">
        {ov ? (
          <>
            <div className="flex items-center gap-[22px] border-b border-[var(--line)] px-[22px] pt-4">
              <span className="border-b-2 border-[var(--crimson)] pb-[13px] text-[13px] font-semibold">{t.overview}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-[22px] pb-6 pt-[18px]">
              <div className="text-[17px] font-bold tracking-[-0.01em]">{ov.keyword}</div>
              <div className="mt-0.5 text-xs text-[var(--text-3)]">{ov.source === 'labs' ? 'Labs' : 'Google Ads'} · {loc.flag} {loc.name}</div>

              <div className="mt-4 flex flex-col">
                <Row label={t.volume} value={`${fmt(ov.volume)} / mois`} />
                <Row label={t.cpc} value={ov.cpc != null ? `${ov.cpc.toFixed(2)} $` : '—'} />
                <Row label={t.competition} value={ov.competition != null ? `${ov.competition.toFixed(2)} / 1.00` : '—'} />
                <Row label={t.intent} value={ov.intent || '—'} />
                <Row label={t.difficulty} value={focusKd != null ? `${focusKd} · ${dcfg?.l}` : '—'} color={dcfg?.c} last />
              </div>

              {/* difficulté maison */}
              <div className="mt-[18px] border-t border-[var(--line)] pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] font-bold">{t.diffMaison}</div>
                  <button onClick={() => analyze(focus, false)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--crimson)]">↻ {t.recalc}</button>
                </div>
                {kd.data?.keyword === focus && dcfg ? (
                  <div className="mt-3 flex items-center gap-3.5">
                    <div className="flex h-[66px] w-[66px] shrink-0 flex-col items-center justify-center rounded-2xl" style={{ color: diffCfg(kd.data.difficulty, t).c, background: diffCfg(kd.data.difficulty, t).bg }}>
                      <div className="text-2xl font-bold leading-none tnum">{kd.data.difficulty}</div>
                      <div className="text-[9px] opacity-60">/100</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: diffCfg(kd.data.difficulty, t).c }}>{diffCfg(kd.data.difficulty, t).l}</div>
                      <div className="mt-0.5 text-[11.5px] text-[var(--text-2)]">Depuis l'autorité de {counted.length} domaines SERP</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-[12px] text-[var(--text-3)]">{kd.loading ? t.computing : '—'}</div>
                )}
              </div>

              {/* signals */}
              {platformCount > 0 && (
                <div className="mt-4 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#b45309]">⚠ {t.signals}</div>
                  <div className="mt-1.5 text-[12px] leading-relaxed text-[#92400e]">Top 10 partagé avec {platformCount} plateformes — angle de contenu à exploiter.</div>
                </div>
              )}

              {/* top result preview */}
              {preview && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-3)]">{t.topResult}</div>
                  <div className="rounded-xl border border-[var(--line)] bg-[#fafafa] px-[15px] py-[13px]">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 shrink-0 rounded-[5px] bg-[var(--crimson)]" />
                      <span className="font-mono text-[11.5px] text-[#3f3f46]">{preview.url}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-semibold leading-[1.35] text-[#1a0dab]">{preview.title}</div>
                  </div>
                  {preview.thumbs.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {preview.thumbs.map((th, i) => (
                        <div key={i} className="flex h-[34px] flex-1 items-center justify-center overflow-hidden truncate rounded-lg border border-[var(--line)] bg-[#f4f4f5] px-1 font-mono text-[9px] text-[var(--text-3)]">{th}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--text-3)]">{t.emptyExplorerHint}</div>
        )}
      </aside>
    </div>
  )
}

function StatCard({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-4 py-3.5">
      <div className="text-[11px] font-medium text-[var(--text-2)]">{label}</div>
      <div className={`mt-1.5 font-bold tracking-[-0.02em] tnum ${small ? 'text-[15px]' : 'text-[22px]'}`}>{value}</div>
    </div>
  )
}

function InsightCard({ label, value, hint, color, border }: { label: string; value: React.ReactNode; hint: string; color?: string; border?: boolean }) {
  return (
    <div className="rounded-[14px] border bg-[var(--card)] px-4 py-3.5" style={{ borderColor: border ? '#16a34a' : 'var(--line)' }}>
      <div className="text-[11px] font-medium text-[var(--text-2)]">{label}</div>
      <div className="mt-1.5 text-xl font-bold tnum" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-[10.5px] text-[var(--text-3)]">{hint}</div>
    </div>
  )
}

function Row({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-[9px] ${last ? '' : 'border-b border-[var(--subtle)]'}`}>
      <span className="text-[12.5px] text-[var(--text-2)]">{label}</span>
      <span className="text-[12.5px] font-semibold tnum" style={{ color }}>{value}</span>
    </div>
  )
}
