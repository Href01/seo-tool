'use client'

export interface KeywordRow {
  keyword: string
  volume: number | null
  cpc: number | null
  difficulty: number | null
}

interface KeywordInsightsProps {
  keywords: KeywordRow[]
}

export function KeywordInsights({ keywords }: KeywordInsightsProps) {
  // Quick wins: low difficulty + decent volume
  const quickWins = keywords
    .filter((k) => k.difficulty && k.difficulty < 30 && k.volume && k.volume > 100)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 5)

  // High value: high volume + low/medium difficulty
  const highValue = keywords
    .filter((k) => k.difficulty && k.difficulty < 50 && k.volume && k.volume > 500)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 5)

  // Avoid: very high difficulty
  const avoid = keywords
    .filter((k) => k.difficulty && k.difficulty >= 70)
    .sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))
    .slice(0, 5)

  // High CPC opportunities
  const highCPC = keywords
    .filter((k) => k.cpc && k.cpc > 0.5 && k.difficulty && k.difficulty < 60)
    .sort((a, b) => (b.cpc || 0) - (a.cpc || 0))
    .slice(0, 5)

  const totalVolume = keywords.reduce((sum, k) => sum + (k.volume || 0), 0)
  const avgDifficulty =
    keywords.filter((k) => k.difficulty).reduce((sum, k) => sum + (k.difficulty || 0), 0) /
    keywords.filter((k) => k.difficulty).length

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#C9A961]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#C9A961]/80">Total Volume</div>
          <div className="mt-1 text-2xl font-bold text-[#C9A961]">
            {totalVolume.toLocaleString('fr')}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Recherches/mois</div>
        </div>
        <div className="rounded-xl border border-[#10B981]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#10B981]/80">Quick Wins</div>
          <div className="mt-1 text-2xl font-bold text-[#10B981]">{quickWins.length}</div>
          <div className="mt-1 text-xs text-neutral-500">Opportunités faciles</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Difficulté Moy.</div>
          <div className="mt-1 text-2xl font-bold text-[#D4AF37]">
            {avgDifficulty.toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Sur 100</div>
        </div>
        <div className="rounded-xl border border-red-400/20 bg-gradient-to-br from-[#1E293B]/60 to-[#1E293B]/40 p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-red-400/80">À Éviter</div>
          <div className="mt-1 text-2xl font-bold text-red-400">{avoid.length}</div>
          <div className="mt-1 text-xs text-neutral-500">Trop difficiles</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="rounded-xl border border-[#10B981]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <div className="text-lg font-semibold text-[#10B981]">Quick Wins</div>
                <div className="text-xs text-neutral-500">Facile à ranker, volume décent</div>
              </div>
            </div>
            <div className="space-y-2">
              {quickWins.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#10B981]/10 bg-[#0F172A]/30 px-3 py-2"
                >
                  <div className="flex-1 truncate text-sm text-neutral-200">{k.keyword}</div>
                  <div className="ml-2 flex items-center gap-3 text-xs">
                    <span className="text-neutral-400">
                      {k.volume?.toLocaleString('fr')} vol.
                    </span>
                    <span className="rounded-full bg-[#10B981]/20 px-2 py-0.5 font-semibold text-[#10B981]">
                      {k.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-[#10B981]/10 p-3 text-xs text-[#10B981]">
              💡 <strong>Action:</strong> Priorise ces mots-clés — ROI rapide garanti.
            </div>
          </div>
        )}

        {/* High Value */}
        {highValue.length > 0 && (
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-lg font-semibold text-[#D4AF37]">High Value</div>
                <div className="text-xs text-neutral-500">Volume élevé, difficulté raisonnable</div>
              </div>
            </div>
            <div className="space-y-2">
              {highValue.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#D4AF37]/10 bg-[#0F172A]/30 px-3 py-2"
                >
                  <div className="flex-1 truncate text-sm text-neutral-200">{k.keyword}</div>
                  <div className="ml-2 flex items-center gap-3 text-xs">
                    <span className="text-neutral-400">
                      {k.volume?.toLocaleString('fr')} vol.
                    </span>
                    <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 font-semibold text-[#D4AF37]">
                      {k.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-[#D4AF37]/10 p-3 text-xs text-[#D4AF37]">
              💡 <strong>Action:</strong> Investis du temps — le volume compense l'effort.
            </div>
          </div>
        )}

        {/* High CPC */}
        {highCPC.length > 0 && (
          <div className="rounded-xl border border-[#C9A961]/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-lg font-semibold text-[#C9A961]">High CPC</div>
                <div className="text-xs text-neutral-500">Valeur commerciale élevée</div>
              </div>
            </div>
            <div className="space-y-2">
              {highCPC.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#C9A961]/10 bg-[#0F172A]/30 px-3 py-2"
                >
                  <div className="flex-1 truncate text-sm text-neutral-200">{k.keyword}</div>
                  <div className="ml-2 flex items-center gap-3 text-xs">
                    <span className="font-semibold text-[#C9A961]">{k.cpc?.toFixed(2)} $</span>
                    <span className="rounded-full bg-[#C9A961]/20 px-2 py-0.5 text-neutral-300">
                      diff. {k.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-[#C9A961]/10 p-3 text-xs text-[#C9A961]">
              💡 <strong>Action:</strong> Forte valeur commerciale — parfait pour conversion.
            </div>
          </div>
        )}

        {/* Avoid */}
        {avoid.length > 0 && (
          <div className="rounded-xl border border-red-400/20 bg-[#1E293B]/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">🚫</span>
              <div>
                <div className="text-lg font-semibold text-red-400">À Éviter</div>
                <div className="text-xs text-neutral-500">Difficulté trop élevée</div>
              </div>
            </div>
            <div className="space-y-2">
              {avoid.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-red-400/10 bg-[#0F172A]/30 px-3 py-2"
                >
                  <div className="flex-1 truncate text-sm text-neutral-200">{k.keyword}</div>
                  <div className="ml-2 flex items-center gap-3 text-xs">
                    <span className="text-neutral-400">
                      {k.volume?.toLocaleString('fr')} vol.
                    </span>
                    <span className="rounded-full bg-red-400/20 px-2 py-0.5 font-semibold text-red-400">
                      {k.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-red-400/10 p-3 text-xs text-red-400">
              ⚠️ <strong>Attention:</strong> Dominés par autorités — évite sauf stratégie long-terme.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
