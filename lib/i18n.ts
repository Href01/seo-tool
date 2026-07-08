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
  perMonthShort: string
  outOf100: string
  ideasHint: string
  diffFromPre: string
  diffFromPost: string
  signalPre: string
  signalPost: string
  whoRanksHint: string
  tagCompetitor: string
  tagPlatform: string
  records: string
  places: string
  noHistory: string
  trendUnavailable: string
  detail: string
  kwPlaceholder: string
  domainPlaceholder: string
}

export function intentLabel(v: string | null | undefined, lang: Lang): string {
  if (!v) return '—'
  const map: Record<string, [string, string]> = {
    commercial: ['Commercial', 'تجاري'],
    informational: ['Informationnel', 'معلوماتي'],
    transactional: ['Transactionnel', 'معاملاتي'],
    navigational: ['Navigationnel', 'تصفّحي'],
  }
  const pair = map[v.toLowerCase()]
  return pair ? (lang === 'ar' ? pair[1] : pair[0]) : v
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
    perMonthShort: '/ mois',
    outOf100: 'Sur 100',
    ideasHint: "Clique une idée pour l'analyser",
    diffFromPre: "D'après l'autorité de ",
    diffFromPost: ' domaines du SERP',
    signalPre: 'Top 10 partagé avec ',
    signalPost: ' plateforme(s) sociale(s) — un angle de contenu à prendre.',
    whoRanksHint: 'Autorité /1000 · plateformes grisées',
    tagCompetitor: 'Concurrent',
    tagPlatform: 'Plateforme',
    records: 'relevés',
    places: 'places',
    noHistory: "Pas encore d'historique — clique « Vérifier ».",
    trendUnavailable: 'Tendance indisponible pour ce mot-clé.',
    detail: 'Détail',
    kwPlaceholder: 'mot-clé',
    domainPlaceholder: 'monsite.ma',
  },
  ar: {
    appSub: 'تحليلات السيو',
    secEspace: 'مساحتي',
    secConc: 'المنافسة',
    secSuivi: 'تتبّع المراكز',
    mExplorer: 'مستكشف الكلمات',
    mProjects: 'مشاريعي',
    mSerp: 'تحليل نتائج البحث',
    mCompetitors: 'المنافسون',
    mBacklinks: 'الروابط الخلفية',
    mPositions: 'مراكزي',
    listIdeas: 'أفكار كلمات',
    searchPlaceholder: 'ابحث عن كلمة مفتاحية…',
    volume: 'حجم البحث',
    cpc: 'تكلفة النقرة',
    competition: 'المنافسة',
    intent: 'نية البحث',
    difficulty: 'الصعوبة',
    trend12: 'الاتجاه · آخر 12 شهرًا',
    trendView: 'الاتجاه',
    landscape: 'مشهد النتائج',
    whoRanks: 'من يتصدّر نتائج البحث',
    realCompetitors: 'منافسون فعليون',
    platforms: 'منصّات (فرصة)',
    volTotal: 'إجمالي الحجم',
    quickWins: 'فرص سريعة',
    avgLabel: 'متوسّطة',
    avoid: 'يُفضّل تجنّبها',
    overview: 'نظرة عامة',
    diffMaison: 'الصعوبة المحسوبة',
    recalc: 'إعادة الحساب',
    signals: 'ملاحظات',
    topResult: 'أفضل نتيجة',
    add: 'إضافة',
    total: 'إجمالي المتابَع',
    top3: 'أفضل 3',
    top10: 'أفضل 10',
    avgPos: 'متوسّط المركز',
    gainsLosses: 'تقدّم / تراجع',
    history: 'السجلّ',
    lastCheck: 'آخر فحص',
    verify: 'تحقّق الآن',
    export: 'تصدير',
    aboveYou: 'من يسبقك',
    positionOverTime: 'تطوّر المركز',
    best: 'أفضل مركز',
    worst: 'أسوأ مركز',
    emptyExplorerTitle: 'ابدأ باستكشاف كلمة',
    emptyExplorerHint: 'تحليل كامل مع فرص مجاورة، في شاشة واحدة.',
    emptyTrackerTitle: 'لا توجد كلمات متابَعة',
    emptyTrackerHint: 'أضف كلمة مفتاحية لتتبّع مركزها عبر الزمن.',
    analyzing: 'جارٍ التحليل…',
    computing: 'جارٍ الحساب…',
    easy: 'سهلة',
    medium: 'متوسّطة',
    hard: 'صعبة',
    perMonth: 'بحث / شهر',
    perMonthShort: '/ شهر',
    outOf100: 'من 100',
    ideasHint: 'انقر فكرة لتحليلها',
    diffFromPre: 'استنادًا إلى سلطة ',
    diffFromPost: ' نطاقات في نتائج البحث',
    signalPre: 'أفضل 10 نتائج تضمّ ',
    signalPost: ' منصّة اجتماعية — فرصة محتوى تستحقّ الاستغلال.',
    whoRanksHint: 'السلطة /1000 · المنصّات باهتة',
    tagCompetitor: 'منافس',
    tagPlatform: 'منصّة',
    records: 'قياسات',
    places: 'مراكز',
    noHistory: 'لا يوجد سجلّ بعد — انقر « تحقّق الآن ».',
    trendUnavailable: 'الاتجاه غير متاح لهذه الكلمة.',
    detail: 'التفاصيل',
    kwPlaceholder: 'الكلمة المفتاحية',
    domainPlaceholder: 'مثال: monsite.ma',
  },
}

export function useT(): { lang: Lang; setLang: (l: Lang) => void; t: Dict; dir: 'rtl' | 'ltr' } {
  const [lang, setLang] = useLang()
  return { lang, setLang, t: T[lang], dir: lang === 'ar' ? 'rtl' : 'ltr' }
}
