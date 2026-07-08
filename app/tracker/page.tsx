'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSeoQuery } from '@/lib/useSeoQuery'
import { useT, usePT } from '@/lib/i18n'
import {
  DEFAULT_DEVICE,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCATION,
  getLanguageByCode,
  getLocationByCode,
  locName,
  deviceName,
} from '@/lib/locations'
import { LocationSelector, LanguageSelector } from '@/components/LocationSelector'
import { DistributionBar, visibilityScore, InfoTip, ErrorBox } from '@/components/ui'
import { errorMessage } from '@/lib/errors'

interface HistPoint { position: number | null; checkedAt: string }
interface Tracked {
  id: number
  keyword: string
  domain: string
  location: number
  language: string
  position: number | null
  checkedAt: string | null
  history: HistPoint[]
}
interface Competitor { position: number | null; domain: string; rank: number | null; counted: boolean }
interface DifficultyResult { keyword: string; difficulty: number; competitors: Competitor[] }

const CLAMP = 30
function posCfg(p: number | null) {
  if (p == null) return { c: '#71717a', bg: '#f4f4f5' }
  if (p <= 3) return { c: '#16a34a', bg: '#dcfce7' }
  if (p <= 10) return { c: '#b45309', bg: '#fef3c7' }
  if (p <= 20) return { c: '#ec0b43', bg: 'rgba(236,11,67,0.1)' }
  return { c: '#71717a', bg: '#f4f4f5' }
}
const clamp = (p: number | null) => (p == null ? CLAMP : Math.min(p, CLAMP))
const dfmt = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—')
function marketLabel(location: number, language: string, uiLang: string) {
  const loc = getLocationByCode(location) ?? DEFAULT_LOCATION
  const searchLang = getLanguageByCode(language) ?? DEFAULT_LANGUAGE
  return `${loc.flag} ${locName(loc, uiLang)} · ${searchLang.name}`
}

export default function Tracker() {
  const { t, lang } = useT()
  const p = usePT()
  const [items, setItems] = useState<Tracked[]>([])
  const [focusId, setFocusId] = useState<number | null>(null)
  const [keyword, setKeyword] = useState('')
  const [domain, setDomain] = useState('')
  const [location, setLocation] = useState(DEFAULT_LOCATION.code)
  const [searchLang, setSearchLang] = useState(DEFAULT_LANGUAGE.code)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(true)
  const kd = useSeoQuery<DifficultyResult>('/api/difficulty')

  async function load() {
    try {
      const res = await fetch('/api/rank')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      const list: Tracked[] = data.items || []
      setItems(list)
      setFocusId((cur) => (cur != null && list.some((i) => i.id === cur) ? cur : list[0]?.id ?? null))
    } catch (e: unknown) {
      setError(errorMessage(e))
    }
  }
  useEffect(() => { queueMicrotask(() => { void load() }) }, [])

  const focus = items.find((i) => i.id === focusId) || null

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (focus) kd.run({ keyword: focus.keyword, location: focus.location, language: focus.language })
  }, [focusId])
  /* eslint-enable react-hooks/exhaustive-deps */

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || !domain.trim()) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, domain, location, language: searchLang }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setKeyword(''); setDomain('')
      await load()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  async function verify(id: number) {
    setBusy(true)
    try {
      const res = await fetch('/api/rank/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await load()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  async function remove(id: number) {
    setBusy(true)
    try {
      const res = await fetch('/api/rank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await load()
    } catch (e: unknown) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  function exportCSV() {
    const rows = items.map((it) => [it.keyword, it.domain, marketLabel(it.location, it.language, lang), it.position ?? '> 100', dfmt(it.checkedAt)])
    const csv = [['Mot-clé', 'Domaine', 'Marche', 'Position', 'Vérif'], ...rows].map((r) => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `tracker-${Date.now()}.csv`; a.click()
  }

  const stats = useMemo(() => {
    const cur = items.map((i) => i.position).filter((p): p is number => p != null)
    const gl = items.reduce((acc, it) => {
      const h = it.history
      if (h.length >= 2) {
        const d = (h[h.length - 2].position ?? 999) - (h[h.length - 1].position ?? 999)
        if (d > 0) acc.g++; else if (d < 0) acc.l++
      }
      return acc
    }, { g: 0, l: 0 })
    const positions = items.map((i) => i.position)
    const t3 = items.filter((i) => i.position != null && i.position <= 3).length
    const t10 = items.filter((i) => i.position != null && i.position > 3 && i.position <= 10).length
    const t20 = items.filter((i) => i.position != null && i.position > 10 && i.position <= 20).length
    const beyond = items.filter((i) => i.position == null || i.position > 20).length
    return {
      total: items.length,
      top3: items.filter((i) => i.position != null && i.position <= 3).length,
      top10: items.filter((i) => i.position != null && i.position <= 10).length,
      avg: cur.length ? Math.round(cur.reduce((s, p) => s + p, 0) / cur.length) : 0,
      gains: gl.g, losses: gl.l,
      vis: visibilityScore(positions),
      dist: { t3, t10, t20, beyond },
    }
  }, [items])

  // focus chart geometry
  const chart = useMemo(() => {
    if (!focus || focus.history.length === 0) return null
    const h = focus.history
    const W = 660, H = 180, X0 = 20, Y0 = 16
    const pts = h.map((p, i) => ({
      x: +(X0 + (h.length === 1 ? W / 2 : (i / (h.length - 1)) * W)).toFixed(1),
      y: +(Y0 + ((clamp(p.position) - 1) / (CLAMP - 1)) * H).toFixed(1),
      pos: p.position, date: dfmt(p.checkedAt), i,
    }))
    const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y).join(' ')
    const area = `${line} L${pts[pts.length - 1].x} ${Y0 + H} L${pts[0].x} ${Y0 + H} Z`
    const positions = h.map((p) => p.position).filter((p): p is number => p != null)
    const totalDelta = (h[0].position ?? 999) - (h[h.length - 1].position ?? 999)
    return { pts, line, area, best: positions.length ? Math.min(...positions) : null, worst: positions.length ? Math.max(...positions) : null, totalDelta, Y0, H }
  }, [focus])

  const above = useMemo(() => {
    if (!focus || focus.position == null || kd.data?.keyword !== focus.keyword) return []
    return (kd.data.competitors || []).filter((c) => c.counted && c.position != null && c.position < focus.position!).slice(0, 3)
      .map((c, i) => ({ pos: i + 1, domain: c.domain, dr: Math.round((c.rank ?? 0) / 10) }))
  }, [kd.data, focus])

  const fcfg = focus ? posCfg(focus.position) : null
  const td = chart?.totalDelta ?? 0
  const tdCol = td > 0 ? '#16a34a' : td < 0 ? '#e11d48' : '#a1a1aa'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page)]">
      {/* ── LEFT ── */}
      <section className="flex w-[280px] shrink-0 flex-col border-e border-[var(--line)] bg-[var(--card)] lg:w-[320px]">
        <div className="border-b border-[var(--line)] px-[18px] pb-3 pt-4">
          <div className="mb-2.5 text-[14.5px] font-bold tracking-[-0.01em]">{t.mPositions} <span className="font-medium text-[var(--text-3)]">→</span></div>
          <form onSubmit={add} className="flex flex-col gap-1.5">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.kwPlaceholder} className="rounded-[10px] border border-[var(--line)] bg-[var(--subtle)] px-3 py-2 text-[12.5px] outline-none focus:border-[var(--crimson)]" />
            <div className="grid grid-cols-2 gap-1.5">
              <LocationSelector value={location} onChange={setLocation} />
              <LanguageSelector value={searchLang} onChange={setSearchLang} />
            </div>
            <div className="flex gap-1.5">
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={t.domainPlaceholder} className="min-w-0 flex-1 rounded-[10px] border border-[var(--line)] bg-[var(--subtle)] px-3 py-2 text-[12.5px] outline-none focus:border-[var(--crimson)]" />
              <button disabled={busy} className="shrink-0 rounded-[10px] bg-[var(--crimson)] px-3 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50">{t.add}</button>
            </div>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-[var(--text-3)]">{t.emptyTrackerHint}</div>
          ) : items.map((it) => {
            const active = it.id === focusId
            const pc = posCfg(it.position)
            const h = it.history
            const delta = h.length >= 2 ? (h[h.length - 2].position ?? 999) - (h[h.length - 1].position ?? 999) : 0
            const dcol = delta > 0 ? '#16a34a' : delta < 0 ? '#e11d48' : '#a1a1aa'
            const spark = h.slice(-10).map((p, i, arr) => {
              const x = arr.length === 1 ? 28 : (i / (arr.length - 1)) * 56
              const y = (clamp(p.position) / CLAMP) * 20 + 1
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
            return (
              <div key={it.id} onClick={() => setFocusId(it.id)} className="cursor-pointer border-b border-[var(--subtle)] px-4 py-[13px]" style={{ borderInlineStart: `2.5px solid ${active ? 'var(--crimson)' : 'transparent'}`, background: active ? 'rgba(236,11,67,0.04)' : 'transparent' }}>
                <div className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">{it.keyword}</div>
                    <div className="mt-0.5 truncate font-mono text-[10.5px] text-[var(--text-3)]">{it.domain} · {marketLabel(it.location, it.language, lang)}</div>
                  </div>
                  <svg width="56" height="22" viewBox="0 0 56 22" fill="none" className="shrink-0"><polyline points={spark || '0,11 56,11'} stroke={dcol} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="flex shrink-0 items-center justify-center rounded-lg px-2 py-[3px] text-[12.5px] font-bold tnum" style={{ color: pc.c, background: pc.bg }}>{it.position != null ? `#${it.position}` : '>100'}</span>
                  <span className="w-7 text-end text-[11px] font-bold tnum" style={{ color: dcol }}>{delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : '–'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CENTER ── */}
      <main className="flex min-w-0 flex-1 flex-col bg-[var(--page)]">
        {focus ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="m-0 min-w-0 truncate text-[17px] font-bold tracking-[-0.02em]">{focus.keyword}</h1>
                  {fcfg && <span className="inline-flex shrink-0 items-center rounded-lg px-2.5 py-[3px] text-[13px] font-bold tnum" style={{ color: fcfg.c, background: fcfg.bg }}>{focus.position != null ? `#${focus.position}` : '> 100'}</span>}
                  {chart && <span className="shrink-0 text-xs font-bold" style={{ color: tdCol }}>{td > 0 ? '↑' : td < 0 ? '↓' : '–'} {Math.abs(td)} {t.records}</span>}
                </div>
                <div className="mt-1 truncate font-mono text-xs text-[var(--text-3)]">{focus.domain} · {marketLabel(focus.location, focus.language, lang)} · {deviceName(DEFAULT_DEVICE, lang)}</div>
              </div>
              <button
                onClick={() => setDetailOpen((v) => !v)}
                title={t.detail}
                className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors lg:flex ${detailOpen ? 'border-[var(--crimson)] bg-[var(--crimson)]/8 text-[var(--crimson)]' : 'border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)]'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><line x1="10" y1="2.5" x2="10" y2="13.5" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-7 pt-5">
              <div className="mb-4 grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(112px,1fr))]">
                <div className="rounded-[14px] border border-[var(--crimson)] bg-[var(--card)] px-3.5 py-3">
                  <div className="flex items-center text-[11px] font-medium text-[var(--text-2)]"><span className="truncate">{p.visibility}</span><InfoTip text={p.gVisibility} /></div>
                  <div className="mt-1 flex items-baseline gap-1 text-xl font-bold text-[var(--crimson)] tnum">{stats.vis}<span className="text-[11px] font-medium text-[var(--text-3)]">/100</span></div>
                </div>
                <Mini label={t.total} value={stats.total} />
                <Mini label={t.top3} value={stats.top3} color="#16a34a" border />
                <Mini label={t.top10} value={stats.top10} />
                <Mini label={t.avgPos} value={stats.avg} />
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-3.5 py-3">
                  <div className="truncate text-[11px] font-medium text-[var(--text-2)]">{t.gainsLosses}</div>
                  <div className="mt-1 text-xl font-bold tnum"><span className="text-[#16a34a]">↑{stats.gains}</span> <span className="text-[#e11d48]">↓{stats.losses}</span></div>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-[22px] py-5">
                <div className="mb-3.5 text-sm font-bold">{p.distribution}</div>
                <DistributionBar segments={[
                  { label: t.top3, value: stats.dist.t3, color: '#16a34a' },
                  { label: p.rng4_10, value: stats.dist.t10, color: '#d97706' },
                  { label: p.rng11_20, value: stats.dist.t20, color: '#ec0b43' },
                  { label: p.rng21p, value: stats.dist.beyond, color: '#d4d4d8' },
                ]} />
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-[22px] py-5">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="text-sm font-bold">{t.positionOverTime}</div>
                  <div className="flex gap-3.5 text-[10.5px] text-[var(--text-2)]">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(22,163,74,.14)' }} />{t.top3}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(217,119,6,.12)' }} />{t.top10}</span>
                  </div>
                </div>
                {chart ? (
                  <>
                    <svg viewBox="0 0 700 212" width="100%" className="block overflow-visible">
                      <rect x="20" y="16" width="660" height={(9 / 29) * 180} fill="rgba(217,119,6,0.09)" />
                      <rect x="20" y="16" width="660" height={(2 / 29) * 180} fill="rgba(22,163,74,0.13)" />
                      <line x1="20" y1="16" x2="680" y2="16" stroke="#ececee" />
                      <line x1="20" y1={16 + (9 / 29) * 180} x2="680" y2={16 + (9 / 29) * 180} stroke="#ececee" />
                      <line x1="20" y1="196" x2="680" y2="196" stroke="#ececee" />
                      <text x="8" y="20" fontSize="9" fill="#a1a1aa" fontFamily="Geist Mono">1</text>
                      <text x="4" y={20 + (9 / 29) * 180} fontSize="9" fill="#a1a1aa" fontFamily="Geist Mono">10</text>
                      <text x="4" y="200" fontSize="9" fill="#a1a1aa" fontFamily="Geist Mono">30</text>
                      <path d={chart.area} fill="rgba(236,11,67,0.08)" />
                      <path d={chart.line} fill="none" stroke="#ec0b43" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      {chart.pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={i === chart.pts.length - 1 ? 4.5 : 3} fill="#fff" stroke="#ec0b43" strokeWidth={i === chart.pts.length - 1 ? 2.8 : 2} />
                      ))}
                    </svg>
                    <div className="flex justify-between px-5 pt-2">
                      {chart.pts.map((p, i) => (<span key={i} className="font-mono text-[9.5px] text-[var(--text-3)]">{p.date}</span>))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-sm text-[var(--text-3)]">{t.noHistory}</div>
                )}
              </div>
              {error && <div className="mt-3"><ErrorBox message={error} /></div>}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-4xl">📈</div>
              <div className="text-base font-semibold">{t.emptyTrackerTitle}</div>
              <div className="mt-1 text-sm text-[var(--text-2)]">{t.emptyTrackerHint}</div>
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT (collapsible) ── */}
      <aside className={`hidden w-[340px] shrink-0 flex-col border-s border-[var(--line)] bg-[var(--card)] ${detailOpen ? 'lg:flex' : ''}`}>
        {focus && fcfg ? (
          <>
            <div className="flex items-center gap-[22px] border-b border-[var(--line)] px-[22px] pt-4">
              <span className="border-b-2 border-[var(--crimson)] pb-[13px] text-[13px] font-semibold">{t.overview}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-[22px] pb-6 pt-[18px]">
              <div className="flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px]" style={{ color: fcfg.c, background: fcfg.bg }}>
                  <div className="text-[28px] font-bold leading-none tnum">{focus.position != null ? focus.position : '>100'}</div>
                </div>
                <div>
                  <div className="text-[15px] font-bold">{focus.keyword}</div>
                  <div className="mt-0.5 font-mono text-xs text-[var(--text-3)]">{focus.domain}</div>
                  {chart && <div className="mt-1.5 text-xs font-bold" style={{ color: tdCol }}>{td > 0 ? '↑' : td < 0 ? '↓' : '–'} {Math.abs(td)} {t.places}</div>}
                </div>
              </div>

              <div className="mt-[18px] flex flex-col">
                <Row label={t.best} value={chart?.best != null ? `#${chart.best}` : '—'} />
                <Row label={t.worst} value={chart?.worst != null ? `#${chart.worst}` : '—'} />
                <Row label={t.lastCheck} value={dfmt(focus.checkedAt)} last />
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => verify(focus.id)} disabled={busy} className="flex-1 rounded-[11px] bg-[var(--crimson)] py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--crimson-dark)] disabled:opacity-50">↻ {t.verify}</button>
                <button onClick={exportCSV} className="rounded-[11px] border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#3f3f46] hover:bg-[var(--subtle)]">{t.export}</button>
                <button onClick={() => remove(focus.id)} disabled={busy} className="rounded-[11px] border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#e11d48] hover:bg-[var(--down-bg)] disabled:opacity-50">🗑</button>
              </div>

              {above.length > 0 && (
                <div className="mt-5 border-t border-[var(--line)] pt-4">
                  <div className="mb-2.5 text-[13.5px] font-bold">{t.aboveYou}</div>
                  <div className="flex flex-col gap-2">
                    {above.map((a, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-[11px] border border-[var(--line)] bg-[#fafafa] px-3 py-2.5">
                        <span className="w-[22px] text-xs font-bold text-[var(--text-2)] tnum">#{a.pos}</span>
                        <span className="flex-1 truncate font-mono text-[12.5px] font-semibold">{a.domain}</span>
                        <span className="text-[11px] text-[var(--text-3)] tnum">DR {a.dr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <div className="mb-2.5 text-[13.5px] font-bold">{t.history}</div>
                <div className="flex flex-col">
                  {[...focus.history].reverse().map((h, i, arr) => {
                    const prev = arr[i + 1]
                    const ch = prev ? (prev.position ?? 999) - (h.position ?? 999) : null
                    const col = ch == null ? '#a1a1aa' : ch > 0 ? '#16a34a' : ch < 0 ? '#e11d48' : '#a1a1aa'
                    return (
                      <div key={i} className="flex items-center justify-between border-b border-[var(--subtle)] py-2">
                        <span className="font-mono text-[11.5px] text-[var(--text-2)]">{dfmt(h.checkedAt)}</span>
                        <span className="text-[12.5px] font-semibold tnum">{h.position != null ? `#${h.position}` : '>100'}</span>
                        <span className="w-11 text-end text-[11px] font-bold tnum" style={{ color: col }}>{ch == null ? '–' : ch > 0 ? `↑${ch}` : ch < 0 ? `↓${Math.abs(ch)}` : '–'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--text-3)]">{t.emptyTrackerHint}</div>
        )}
      </aside>
    </div>
  )
}

function Mini({ label, value, color, border }: { label: string; value: React.ReactNode; color?: string; border?: boolean }) {
  return (
    <div className="rounded-[14px] border bg-[var(--card)] px-3.5 py-3" style={{ borderColor: border ? '#16a34a' : 'var(--line)' }}>
      <div className="truncate text-[11px] font-medium text-[var(--text-2)]">{label}</div>
      <div className="mt-1 text-xl font-bold tnum" style={{ color }}>{value}</div>
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
