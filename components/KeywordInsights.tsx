'use client'

import { StatCard } from './ui'

export interface KeywordRow {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
}

function InsightBlock({
  icon,
  title,
  hint,
  rows,
  metric,
  accentClass,
  action,
}: {
  icon: string
  title: string
  hint: string
  rows: KeywordRow[]
  metric: (k: KeywordRow) => string
  accentClass: string
  action: string
}) {
  if (rows.length === 0) return null
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
          <div className="text-xs text-[var(--text-3)]">{hint}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.map((k, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--subtle)] px-3 py-2">
            <span className="flex-1 truncate text-sm text-[var(--text)]">{k.keyword}</span>
            <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${accentClass}`}>
              {metric(k)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-[var(--text-2)]">
        <span className="font-semibold text-[var(--text)]">Action ·</span> {action}
      </div>
    </div>
  )
}

export function KeywordInsights({ keywords }: { keywords: KeywordRow[] }) {
  const quickWins = keywords
    .filter((k) => k.difficulty && k.difficulty < 30 && k.volume && k.volume > 100)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 5)
  const highValue = keywords
    .filter((k) => k.difficulty && k.difficulty < 50 && k.volume && k.volume > 500)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 5)
  const avoid = keywords
    .filter((k) => k.difficulty && k.difficulty >= 70)
    .sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))
    .slice(0, 5)
  const highCPC = keywords
    .filter((k) => k.cpc && k.cpc > 0.5 && k.difficulty && k.difficulty < 60)
    .sort((a, b) => (b.cpc || 0) - (a.cpc || 0))
    .slice(0, 5)

  const totalVolume = keywords.reduce((s, k) => s + (k.volume || 0), 0)
  const withDiff = keywords.filter((k) => k.difficulty)
  const avgDifficulty = withDiff.length ? withDiff.reduce((s, k) => s + (k.difficulty || 0), 0) / withDiff.length : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Volume total" value={totalVolume.toLocaleString('fr')} sub="Recherches / mois" />
        <StatCard label="Quick Wins" value={quickWins.length} sub="Opportunités faciles" accent />
        <StatCard label="Difficulté moy." value={avgDifficulty.toFixed(0)} sub="Sur 100" />
        <StatCard label="À éviter" value={avoid.length} sub="Trop difficiles" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InsightBlock
          icon="✅"
          title="Quick Wins"
          hint="Facile à ranker, volume décent"
          rows={quickWins}
          metric={(k) => `KD ${k.difficulty}`}
          accentClass="bg-[var(--up-bg)] text-[var(--up)]"
          action="Priorise ces mots-clés — ROI rapide."
        />
        <InsightBlock
          icon="🎯"
          title="High Value"
          hint="Fort volume, difficulté raisonnable"
          rows={highValue}
          metric={(k) => `${(k.volume || 0).toLocaleString('fr')}`}
          accentClass="bg-[var(--crimson)]/10 text-[var(--crimson)]"
          action="Investis du temps — le volume compense l'effort."
        />
        <InsightBlock
          icon="💰"
          title="High CPC"
          hint="Valeur commerciale élevée"
          rows={highCPC}
          metric={(k) => `${(k.cpc || 0).toFixed(2)} $`}
          accentClass="bg-amber-100 text-amber-700"
          action="Forte intention d'achat — parfait pour la conversion."
        />
        <InsightBlock
          icon="🚫"
          title="À éviter"
          hint="Difficulté trop élevée"
          rows={avoid}
          metric={(k) => `KD ${k.difficulty}`}
          accentClass="bg-[var(--down-bg)] text-[var(--down)]"
          action="Dominés par des autorités — évite sauf stratégie long terme."
        />
      </div>
    </div>
  )
}
