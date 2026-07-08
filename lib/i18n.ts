'use client'

import { useState, useEffect } from 'react'

export type Lang = 'fr' | 'ar'

/** localStorage-backed language, synced across components via a window event. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    const stored = (localStorage.getItem('lang') as Lang) || 'fr'
    setLang(stored)
    const handler = () => setLang((localStorage.getItem('lang') as Lang) || 'fr')
    window.addEventListener('langchange', handler)
    return () => window.removeEventListener('langchange', handler)
  }, [])

  const update = (l: Lang) => {
    localStorage.setItem('lang', l)
    setLang(l)
    window.dispatchEvent(new Event('langchange'))
  }

  return [lang, update]
}

export interface Dict {
  appSub: string
  secEspace: string
  secConc: string
  secSuivi: string
  mExplorer: string
  mProjects: string
  mSerp: string
  mCompetitors: string
  mBacklinks: string
  mPositions: string
  listIdeas: string
  searchPlaceholder: string
  volume: string
  cpc: string
  competition: string
  intent: string
  difficulty: string
  trend12: string
  trendView: string
  landscape: string
  whoRanks: string
  realCompetitors: string
  platforms: string
  volTotal: string
  quickWins: string
  avgLabel: string
  avoid: string
  overview: string
  diffMaison: string
  recalc: string
  signals: string
  topResult: string
  add: string
  total: string
  top3: string
  top10: string
  avgPos: string
  gainsLosses: string
  history: string
  lastCheck: string
  verify: string
  export: string
  aboveYou: string
  positionOverTime: string
  best: string
  worst: string
  emptyExplorerTitle: string
  emptyExplorerHint: string
  emptyTrackerTitle: string
  emptyTrackerHint: string
  analyzing: string
  computing: string
  easy: string
  medium: string
  hard: string
  perMonth: string
  outOf100: string
  ideasHint: string
}

export const T: Record<Lang, Dict> = {
  fr: {
    appSub: 'Analytics',
    secEspace: 'Espace',
    secConc: 'Concurrence',
    secSuivi: 'Suivi',
    mExplorer: 'Explorer mots-clés',
    mProjects: 'Mes projets',
    mSerp: 'Analyse SERP',
    mCompetitors: 'Concurrents',
    mBacklinks: 'Backlinks',
    mPositions: 'Positions',
    listIdeas: 'Idées',
    searchPlaceholder: 'Rechercher un mot-clé…',
    volume: 'Volume',
    cpc: 'CPC',
    competition: 'Concurrence',
    intent: 'Intention',
    difficulty: 'Difficulté',
    trend12: 'Tendance · 12 mois',
    trendView: 'Tendance',
    landscape: 'Paysage SERP',
    whoRanks: 'Qui domine le SERP',
    realCompetitors: 'concurrents réels',
    platforms: 'plateformes (opportunité)',
    volTotal: 'Volume total',
    quickWins: 'Quick Wins',
    avgLabel: 'moyen',
    avoid: 'À éviter',
    overview: "Vue d'ensemble",
    diffMaison: 'Difficulté maison',
    recalc: 'Recalculer',
    signals: 'Signaux',
    topResult: 'Meilleur résultat',
    add: 'Ajouter',
    total: 'Total suivi',
    top3: 'Top 3',
    top10: 'Top 10',
    avgPos: 'Pos. moyenne',
    gainsLosses: 'Gains / pertes',
    history: 'Historique',
    lastCheck: 'Dernière vérif',
    verify: 'Vérifier',
    export: 'Export',
    aboveYou: 'Au-dessus de toi',
    positionOverTime: 'Position dans le temps',
    best: 'Meilleure position',
    worst: 'Pire position',
    emptyExplorerTitle: 'Explore un mot-clé',
    emptyExplorerHint: "Analyse complète + opportunités autour, dans un seul écran.",
    emptyTrackerTitle: 'Aucun mot-clé suivi',
    emptyTrackerHint: 'Ajoute un mot-clé pour suivre sa position dans le temps.',
    analyzing: 'Analyse…',
    computing: 'Calcul…',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    perMonth: 'Recherches / mois',
    outOf100: 'Sur 100',
    ideasHint: "Clique une idée pour l'analyser",
  },
  ar: {
    appSub: 'تحليلات',
    secEspace: 'مساحتي',
    secConc: 'المنافسة',
    secSuivi: 'التتبع',
    mExplorer: 'استكشاف الكلمات',
    mProjects: 'مشاريعي',
    mSerp: 'تحليل SERP',
    mCompetitors: 'المنافسون',
    mBacklinks: 'الروابط الخلفية',
    mPositions: 'المراكز',
    listIdeas: 'أفكار',
    searchPlaceholder: 'ابحث عن كلمة مفتاحية…',
    volume: 'الحجم',
    cpc: 'التكلفة',
    competition: 'المنافسة',
    intent: 'النية',
    difficulty: 'الصعوبة',
    trend12: 'الاتجاه · 12 شهرًا',
    trendView: 'الاتجاه',
    landscape: 'مشهد SERP',
    whoRanks: 'من يتصدر SERP',
    realCompetitors: 'منافسون حقيقيون',
    platforms: 'منصات (فرصة)',
    volTotal: 'إجمالي الحجم',
    quickWins: 'فرص سريعة',
    avgLabel: 'متوسط',
    avoid: 'تجنّب',
    overview: 'نظرة عامة',
    diffMaison: 'الصعوبة الخاصة',
    recalc: 'إعادة الحساب',
    signals: 'إشارات',
    topResult: 'أفضل نتيجة',
    add: 'إضافة',
    total: 'إجمالي المتابعة',
    top3: 'أفضل 3',
    top10: 'أفضل 10',
    avgPos: 'متوسط المركز',
    gainsLosses: 'مكاسب / خسائر',
    history: 'السجل',
    lastCheck: 'آخر فحص',
    verify: 'تحقّق',
    export: 'تصدير',
    aboveYou: 'فوقك',
    positionOverTime: 'المركز عبر الزمن',
    best: 'أفضل مركز',
    worst: 'أسوأ مركز',
    emptyExplorerTitle: 'استكشف كلمة مفتاحية',
    emptyExplorerHint: 'تحليل كامل + فرص حولها، في شاشة واحدة.',
    emptyTrackerTitle: 'لا كلمات متابَعة',
    emptyTrackerHint: 'أضف كلمة لتتبّع مركزها عبر الزمن.',
    analyzing: 'جارٍ التحليل…',
    computing: 'جارٍ الحساب…',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    perMonth: 'بحث / شهر',
    outOf100: 'من 100',
    ideasHint: 'انقر فكرة لتحليلها',
  },
}

export function useT(): { lang: Lang; setLang: (l: Lang) => void; t: Dict; dir: 'rtl' | 'ltr' } {
  const [lang, setLang] = useLang()
  return { lang, setLang, t: T[lang], dir: lang === 'ar' ? 'rtl' : 'ltr' }
}
