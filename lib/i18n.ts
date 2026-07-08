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

/* Page-level strings (loosely typed to avoid bloating the strict Dict). */
export const PT: Record<Lang, Record<string, string>> = {
  fr: {
    analyze: 'Analyser', analyzing: 'Analyse…', cacheFree: '⚡ Cache · 0 $', apiCall: '💳 API DataForSEO', maj: 'maj',
    // SERP
    serpTitle: 'Analyse SERP', serpSub: 'Qui domine le top des résultats · détection des plateformes',
    kwLabel: 'Mot-clé', kwPh: 'ex : coloration cheveux',
    uniqueDomains: 'Domaines uniques', realComp: 'Concurrents réels', platformsStat: 'Plateformes',
    onN: 'Sur', results: 'résultats', platform: 'Plateforme',
    emptySerpT: 'Espionne le SERP', emptySerpH: 'Découvre qui ranke et repère les opportunités face aux plateformes.',
    // Domain
    domTitle: 'Analyse de domaine', domSub: "Trafic estimé et mots-clés organiques d'un concurrent",
    domLabel: 'Domaine à analyser', domPh: 'ex : jumia.ma',
    orgKeywords: 'Mots-clés organiques', orgKeywordsSub: 'Positions en SERP', estTraffic: 'Trafic estimé', estTrafficSub: 'Visites / mois (estimation)',
    topKeywords: 'Top mots-clés du domaine', keywordCol: 'Mot-clé', positionCol: 'Position', volumeCol: 'Volume',
    emptyDomT: 'Espionne tes concurrents', emptyDomH: 'Découvre leur trafic et leurs meilleurs mots-clés.',
    // Backlinks
    blTitle: 'Profil de backlinks', blSub: 'Autorité du domaine · domaines référents · spam · ratio dofollow',
    domainLabel: 'Domaine', backlinks: 'Backlinks', refDomains: 'Domaines référents', mainDomains: 'Domaines principaux', authRank: 'Rank autorité',
    spamScore: 'Score de spam', spamHealthy: 'Sain', spamModerate: 'Modéré', spamRisky: 'Risqué',
    spamHealthyHint: 'Profil de liens sain et naturel.', spamModHint: 'Quelques liens douteux à surveiller.', spamRiskyHint: 'Beaucoup de liens toxiques — risque de pénalité.',
    dofollowRatio: 'Ratio dofollow', dofollow: 'dofollow', nofollow: 'nofollow',
    emptyBlT: "Mesure l'autorité d'un domaine", emptyBlH: 'Backlinks, domaines référents, score de spam et plus.',
    // Audit
    auditTitle: 'Audit on-page', auditSub: 'Score technique · hygiène des balises meta · problèmes détectés',
    urlLabel: 'URL de la page', urlPh: 'ex : https://monsite.ma/produit',
    scoreExcellent: 'Excellent', scoreOk: 'Correct', scoreImprove: 'À améliorer', onpageScore: 'Score on-page',
    words: 'Mots', internalLinks: 'Liens internes', externalLinks: 'Liens externes',
    metaTags: 'Balises meta', titleLabel: 'Titre', metaDesc: 'Meta description', h1Label: 'H1', chars: 'car.',
    optimal: 'optimal', optimalF: 'optimale', tooShort: 'trop court', tooShortF: 'trop courte', tooLong: 'trop long', tooLongF: 'trop longue',
    missing: 'manquant', missingF: 'manquante', unique: 'unique',
    issuesDetected: 'Problèmes détectés', noIssues: 'Aucun problème majeur détecté !',
    emptyAuditT: 'Diagnostique une page', emptyAuditH: 'Score technique, meta, structure et problèmes détectés.',
    errorLabel: 'Erreur',
    countryLabel: 'Pays / Marché', deviceLabelTitle: 'Appareil', langLabel: 'Langue',
  },
  ar: {
    analyze: 'تحليل', analyzing: 'جارٍ التحليل…', cacheFree: '⚡ من الذاكرة · 0 $', apiCall: '💳 واجهة DataForSEO', maj: 'حُدّث',
    serpTitle: 'تحليل نتائج البحث', serpSub: 'من يتصدّر النتائج · كشف المنصّات',
    kwLabel: 'الكلمة المفتاحية', kwPh: 'مثال: صبغة الشعر',
    uniqueDomains: 'نطاقات فريدة', realComp: 'منافسون فعليون', platformsStat: 'منصّات',
    onN: 'من', results: 'نتيجة', platform: 'منصّة',
    emptySerpT: 'استكشف نتائج البحث', emptySerpH: 'اعرف من يتصدّر والتقط الفرص أمام المنصّات.',
    domTitle: 'تحليل نطاق', domSub: 'الزيارات المقدَّرة والكلمات العضوية لمنافس',
    domLabel: 'النطاق المراد تحليله', domPh: 'مثال: jumia.ma',
    orgKeywords: 'كلمات عضوية', orgKeywordsSub: 'مراكز في نتائج البحث', estTraffic: 'الزيارات المقدَّرة', estTrafficSub: 'زيارة / شهر (تقدير)',
    topKeywords: 'أهمّ كلمات النطاق', keywordCol: 'الكلمة', positionCol: 'المركز', volumeCol: 'الحجم',
    emptyDomT: 'راقب منافسيك', emptyDomH: 'اكتشف زياراتهم وأفضل كلماتهم المفتاحية.',
    blTitle: 'ملف الروابط الخلفية', blSub: 'سلطة النطاق · النطاقات المُحيلة · السبام · نسبة dofollow',
    domainLabel: 'النطاق', backlinks: 'روابط خلفية', refDomains: 'نطاقات مُحيلة', mainDomains: 'نطاقات رئيسية', authRank: 'رتبة السلطة',
    spamScore: 'مؤشّر السبام', spamHealthy: 'سليم', spamModerate: 'متوسّط', spamRisky: 'خطِر',
    spamHealthyHint: 'ملف روابط سليم وطبيعي.', spamModHint: 'بعض الروابط المشبوهة تستدعي المتابعة.', spamRiskyHint: 'روابط سامّة كثيرة — خطر عقوبة.',
    dofollowRatio: 'نسبة dofollow', dofollow: 'dofollow', nofollow: 'nofollow',
    emptyBlT: 'قِس سلطة نطاق', emptyBlH: 'روابط خلفية، نطاقات مُحيلة، مؤشّر سبام وأكثر.',
    auditTitle: 'تدقيق الصفحة', auditSub: 'تقييم تقني · سلامة وسوم meta · مشاكل مكتشَفة',
    urlLabel: 'رابط الصفحة', urlPh: 'مثال: https://monsite.ma/produit',
    scoreExcellent: 'ممتاز', scoreOk: 'مقبول', scoreImprove: 'يحتاج تحسينًا', onpageScore: 'تقييم الصفحة',
    words: 'كلمات', internalLinks: 'روابط داخلية', externalLinks: 'روابط خارجية',
    metaTags: 'وسوم Meta', titleLabel: 'العنوان', metaDesc: 'وصف Meta', h1Label: 'H1', chars: 'حرف',
    optimal: 'مثالي', optimalF: 'مثالي', tooShort: 'قصير جدًا', tooShortF: 'قصير جدًا', tooLong: 'طويل جدًا', tooLongF: 'طويل جدًا',
    missing: 'غير موجود', missingF: 'غير موجود', unique: 'فريد',
    issuesDetected: 'مشاكل مكتشَفة', noIssues: 'لا مشاكل كبيرة مكتشَفة!',
    emptyAuditT: 'شخّص صفحة', emptyAuditH: 'تقييم تقني، وسوم meta، البنية والمشاكل.',
    errorLabel: 'خطأ',
    countryLabel: 'الدولة / السوق', deviceLabelTitle: 'الجهاز', langLabel: 'اللغة',
  },
}

export function usePT(): Record<string, string> {
  const [lang] = useLang()
  return PT[lang]
}
