// Single source of truth for status colors, so position badges, difficulty and
// spam read identically on every page. Client-safe and hex-based (usable in
// inline styles). These status hues are RESERVED — never reuse them as the
// decorative accent palette (see components/ui.tsx).

const GREEN = { c: '#16a34a', bg: '#dcfce7' }
const AMBER = { c: '#b45309', bg: '#fef3c7' }
const CRIMSON = { c: '#ec0b43', bg: 'rgba(236,11,67,0.10)' }
const RED = { c: '#e11d48', bg: '#ffe4e6' }
const GREY = { c: '#71717a', bg: '#f4f4f5' }

/** Google position -> badge colors. <=3 strong, <=10 good, <=20 mid, else weak. */
export function positionTone(pos: number | null): { c: string; bg: string } {
  if (pos == null) return GREY
  if (pos <= 3) return GREEN
  if (pos <= 10) return AMBER
  if (pos <= 20) return CRIMSON
  return GREY
}

export type DiffTier = 'easy' | 'medium' | 'hard'
/** Proprietary difficulty 0-100 -> colors + tier (label resolved via i18n). */
export function difficultyTone(score: number): { c: string; bg: string; tier: DiffTier } {
  if (score < 30) return { ...GREEN, tier: 'easy' }
  if (score < 60) return { ...AMBER, tier: 'medium' }
  return { ...RED, tier: 'hard' }
}

export type SpamTier = 'healthy' | 'moderate' | 'risky'
/** Backlink spam score 0-100 -> colors + tier. */
export function spamTone(score: number): { c: string; bg: string; tier: SpamTier } {
  if (score < 15) return { ...GREEN, tier: 'healthy' }
  if (score < 40) return { ...AMBER, tier: 'moderate' }
  return { ...RED, tier: 'risky' }
}
