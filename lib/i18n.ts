'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type Lang = 'fr' | 'ar'

function normalizeLang(value: string | null): Lang {
  return value === 'ar' ? 'ar' : 'fr'
}

function getLangSnapshot(): Lang {
  return typeof window === 'undefined' ? 'fr' : normalizeLang(window.localStorage.getItem('lang'))
}

function subscribeLang(callback: () => void): () => void {
  window.addEventListener('langchange', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('langchange', callback)
    window.removeEventListener('storage', callback)
  }
}

function getServerLangSnapshot(): Lang {
  return 'fr'
}

/** localStorage-backed language, synced across components via a window event. */
export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot)

  const update = useCallback((l: Lang) => {
    window.localStorage.setItem('lang', l)
    window.dispatchEvent(new Event('langchange'))
  }, [])

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
  mAdminHome: string
  mDatabase: string
  mAudit: string
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
  uncontested: string
  uncontestedHint: string
  deviceSerpHint: string
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

/** Heuristic intent from the keyword text, used when the API returns none
 * (e.g. Google Ads fallback keywords carry no intent). Multilingual patterns. */
export function guessIntent(keyword: string): string {
  const k = ` ${keyword.toLowerCase()} `
  const has = (arr: string[]) => arr.some((w) => k.includes(w))
  if (has(['comment', 'pourquoi', "c'est quoi", 'c est quoi', 'définition', 'definition', 'kifach', 'كيف', 'ما هو', 'ما هي', 'لماذا', 'معنى', 'how', 'what', 'why', 'guide', 'tuto', 'astuce', 'recette']))
    return 'informational'
  if (has(['prix', 'acheter', 'achat', 'commander', 'commande', 'livraison', 'pas cher', 'promo', 'solde', 'boutique', 'en ligne', 'سعر', 'ثمن', 'شراء', 'اشتري', 'توصيل', 'رخيص', 'تخفيض', 'buy', 'price', 'cheap', 'order', 'shop', 'deal']))
    return 'transactional'
  if (has(['meilleur', 'meilleure', 'avis', 'comparatif', 'comparaison', ' vs ', 'top ', 'test', 'classement', 'أفضل', 'مقارنة', 'رأي', 'تقييم', 'best', 'review', 'compare']))
    return 'commercial'
  return 'commercial'
}

export function intentLabel(v: string | null | undefined, lang: Lang, keyword?: string): string {
  const val = v || (keyword ? guessIntent(keyword) : null)
  if (!val) return '—'
  const map: Record<string, [string, string]> = {
    commercial: ['Commercial', 'تجاري'],
    informational: ['Informationnel', 'معلوماتي'],
    transactional: ['Transactionnel', 'معاملاتي'],
    navigational: ['Navigationnel', 'تصفّحي'],
  }
  const pair = map[val.toLowerCase()]
  return pair ? (lang === 'ar' ? pair[1] : pair[0]) : val
}

/** Plain-language label for the 0–1 Google Ads competition score. */
export function competitionLabel(v: number | null | undefined, lang: Lang): string {
  if (v == null) return '—'
  if (v < 0.34) return lang === 'ar' ? 'منخفضة' : 'Faible'
  if (v < 0.67) return lang === 'ar' ? 'متوسّطة' : 'Moyenne'
  return lang === 'ar' ? 'مرتفعة' : 'Forte'
}

export const T: Record<Lang, Dict> = {
  fr: {
    appSub: 'Outil SEO · MENA',
    secEspace: 'Démarrer',
    secConc: 'Analyser',
    secSuivi: 'Suivre',
    mExplorer: 'Trouver des mots-clés',
    mProjects: 'Mes projets',
    mSerp: 'Résultats Google',
    mCompetitors: 'Analyser un concurrent',
    mBacklinks: 'Liens entrants',
    mPositions: 'Suivi de position',
    mAdminHome: 'Tableau de bord',
    mDatabase: 'Base de mots-clés',
    mAudit: 'Audit de page',
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
    uncontested: 'Terrain libre',
    uncontestedHint: 'Top 10 sans vrai concurrent — opportunité à saisir',
    deviceSerpHint: 'Appareil — agit sur le paysage SERP, pas sur les volumes',
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
    appSub: 'أداة سيو · مينا',
    secEspace: 'ابدأ',
    secConc: 'حلّل',
    secSuivi: 'تابِع',
    mExplorer: 'إيجاد الكلمات المفتاحية',
    mProjects: 'مشاريعي',
    mSerp: 'نتائج Google',
    mCompetitors: 'تحليل منافس',
    mBacklinks: 'الروابط الواردة',
    mPositions: 'تتبّع المركز',
    mAdminHome: 'لوحة التحكّم',
    mDatabase: 'قاعدة الكلمات',
    mAudit: 'تدقيق صفحة',
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
    uncontested: 'مجال مفتوح',
    uncontestedHint: 'أفضل 10 نتائج بلا منافس حقيقي — فرصة يجب اغتنامها',
    deviceSerpHint: 'الجهاز — يؤثّر على نتائج البحث لا على أحجام البحث',
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
    topKeywords: 'Mots-clés classés', keywordCol: 'Mot-clé', positionCol: 'Position', volumeCol: 'Volume', trafficCol: 'Trafic',
    domHint: 'Marche pour ton propre domaine comme pour un concurrent — aucun Search Console requis.', keywordsWord: 'mots-clés',
    emptyDomT: 'Tes mots-clés & ceux des concurrents', emptyDomH: 'Entre un domaine pour voir les mots-clés sur lesquels il est classé.',
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
    errorLabel: 'Erreur', signIn: 'Se connecter',
    countryLabel: 'Pays / Marché', deviceLabelTitle: 'Appareil', langLabel: 'Langue',
    cityLabel: 'Ville', cityAll: 'Tout le pays', citySerpHint: 'Ville — affine la SERP (les volumes restent au niveau pays)',
    // Page guidance (also reused as sidebar tooltips)
    helpExplorer: 'Tape un mot-clé (ex : « coloration cheveux ») pour voir combien de gens le cherchent chaque mois, à quel point c\'est concurrentiel, et des idées de mots proches.',
    helpProjects: 'Crée un projet par site à suivre. Tu y regrouperas les mots-clés dont tu surveilles la position sur Google.',
    helpSerp: 'Vois la vraie page de résultats Google pour un mot-clé, un pays et une ville — qui sort en premier.',
    helpDomain: 'Entre le site d\'un concurrent pour voir sur quels mots-clés il se classe et le trafic estimé qu\'il en tire.',
    helpBacklinks: 'Vois combien d\'autres sites pointent vers un domaine — un signal fort d\'autorité aux yeux de Google.',
    helpAudit: 'Colle l\'adresse d\'une page pour un diagnostic technique instantané : titre, description, structure, problèmes.',
    helpTracker: 'Suis l\'évolution de ta position Google sur tes mots-clés dans le temps. Ajoute un mot, puis lance une vérification.',
    helpDatabase: 'Tous les mots-clés déjà recherchés, accumulés au fil du temps — l\'actif propriétaire de ton outil.',
    helpAdmin: 'Vue d\'ensemble : nombre d\'utilisateurs, usage et coûts DataForSEO, taux de cache.',
    helpProjectDetail: 'Ajoute ici les mots-clés à surveiller pour ce site, puis clique « Vérifier » pour relever leur position sur Google. La visibilité résume l\'ensemble.',
    helpTrackFree: 'Ajouter un mot-clé est gratuit. Seul « Vérifier » interroge Google (et peut consommer un appel).',
    // Metric glossary (plain-language, for InfoTips)
    gVolume: 'Nombre de fois que ce mot est recherché sur Google chaque mois, dans le pays choisi.',
    gCpc: 'Coût par clic : ce qu\'un annonceur paie en moyenne pour un clic sur ce mot. Indice de valeur commerciale.',
    gCompetition: 'Concurrence publicitaire (Google Ads) sur ce mot, de 0 à 1. Plus c\'est haut, plus les annonceurs se battent dessus.',
    gIntent: 'Ce que cherche l\'internaute : s\'informer, acheter, comparer, ou aller sur un site précis.',
    gDifficulty: 'Difficulté maison (0–100) : à quel point il est dur de se classer dans le top Google. Bas = facile, haut = dur.',
    gTraffic: 'Trafic estimé : visites mensuelles que ce mot apporte à ce site, selon sa position.',
    gBacklinks: 'Liens entrants : d\'autres sites qui pointent vers celui-ci. Beaucoup de liens de qualité = plus d\'autorité pour Google.',
    gVisibility: 'Score de visibilité (0–100) résumant tes positions : proche de 100 = tu es souvent en haut de Google.',
    gSeen: 'Nombre de fois que ce mot-clé a été recherché dans l\'outil — plus c\'est élevé, plus il est demandé.',
    // Onboarding (first visit)
    obTitle: 'Bienvenue 👋 Voici comment démarrer',
    obStep1: 'Tape un mot-clé (ex : « coloration cheveux ») et lance la recherche.',
    obStep2: 'Lis le volume (recherches/mois) et la difficulté — vise volume élevé + difficulté basse.',
    obStep3: 'Crée un projet pour ton site et ajoute-y les mots-clés à suivre dans le temps.',
    obDismiss: 'J\'ai compris',
    // Database
    dbTitle: 'Base de mots-clés MENA', dbSub: "Asset propriétaire qui s'enrichit à chaque recherche",
    totalBase: 'Total base', uniqueKw: 'Mots-clés uniques', volTotalLabel: 'Volume total', avgDiffLabel: 'Difficulté moy.', shown: 'Affichés', afterFilters: 'Après filtres',
    top3Vol: 'Top 3 volume', searchDbPh: 'Rechercher (ex : cheveux)…', searchBtn: 'Chercher',
    allDiff: 'Toutes difficultés', minVol: 'Volume min.', copy: 'Copier', exportCsv: 'Export CSV',
    kwCol: 'Mot-clé', volCol: 'Volume', diffCol: 'Difficulté', cpcCol: 'CPC', seenCol: 'Vu ×', sourceCol: 'Source',
    emptyDbT: 'Base vide ou aucun résultat', emptyDbH: 'Fais des recherches — chaque lookup enrichit la base.',
    // Admin
    adminTitle: 'Dashboard Admin', adminSub: 'Vue omnisciente · projets, stats et données',
    kwBank: 'Base de mots-clés', kwBankSub: 'Mots-clés MENA accumulés', usersN: 'Utilisateurs', usersSub: 'Comptes actifs', projectsN: 'Projets', projectsSub: 'Sites suivis',
    quickAccess: 'Accès rapides', cardBankSub: 'Recherche · export', cardTrackerSub: 'Tracking · historique', cardSearchSub: 'Mots-clés · SERP · difficulté', cardCompSub: 'Domaines · backlinks · audit',
    // App / projects
    appTitle: 'Mes projets', appSub: 'Un projet par site pour organiser ton suivi SEO',
    projNamePh: 'Nom du projet (ex : Ma Boutique)', create: 'Créer', creating: 'Création…', open: 'Ouvrir', del: 'Suppr.',
    emptyProjT: 'Aucun projet', emptyProjH: "Crée-en un ci-dessus pour commencer ton suivi SEO.",
    // Project detail
    backToProjects: 'Mes projets', trackedKw: 'Mots-clés suivis',
    actSearch: 'Rechercher des mots-clés', actSearchSub: 'Trouve de nouvelles opportunités', actSerp: 'Analyser le SERP', actSerpSub: 'Qui ranke sur tes mots-clés', auditSite: 'Audit du site', soon: 'Bientôt disponible',
    trackForSite: 'Suivre un mot-clé pour ce site', positionsOfSite: 'Positions du site', noKwForSite: 'Aucun mot-clé suivi pour ce site', addKwHint: 'Ajoute un mot-clé ci-dessus pour commencer.',
    projNotFound: 'Projet introuvable', projNotFoundH: "Ce projet n'existe pas ou a été supprimé.",
    visibility: 'Visibilité', visibilitySub: 'Score de présence /100', distribution: 'Distribution des positions',
    rng1_3: 'Top 3', rng4_10: '4–10', rng11_20: '11–20', rng21p: '21+ / hors', posDistribution: 'Répartition des positions', serpMakeup: 'Composition de la page',
    serpFeaturesTitle: 'Autres blocs sur cette page Google', serpOrganicTitle: 'Résultats organiques',
    serpFeaturedSnippet: 'Réponse encadrée (position 0)', serpFsHint: 'Google met cette réponse tout en haut — la viser peut te placer au-dessus de tout.',
    serpLocalPack: 'Pack local (Google Maps)', serpLocalHint: 'Google affiche une carte : une fiche Google Business bien remplie est un vrai atout ici.',
    serpPaa: 'Questions posées par les internautes', serpPaaHint: 'Autant d\'idées de contenu à traiter dans tes pages pour capter ces recherches.',
    serpRelated: 'Recherches associées', serpAds: 'Annonceurs sur ce mot-clé', serpAdsHint: 'Des marques paient pour ce mot-clé : signe d\'une vraie valeur commerciale.',
    recent: 'Dernières recherches', visitSite: 'Visiter', fullTracking: 'Suivi complet', examples: 'Exemples à essayer',
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
    topKeywords: 'الكلمات المصنَّفة', keywordCol: 'الكلمة', positionCol: 'المركز', volumeCol: 'الحجم', trafficCol: 'الزيارات',
    domHint: 'يعمل لنطاقك كما لمنافس — دون الحاجة إلى Search Console.', keywordsWord: 'كلمة',
    emptyDomT: 'كلماتك وكلمات المنافسين', emptyDomH: 'أدخل نطاقًا لرؤية الكلمات التي يتصدّرها.',
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
    errorLabel: 'خطأ', signIn: 'تسجيل الدخول',
    countryLabel: 'الدولة / السوق', deviceLabelTitle: 'الجهاز', langLabel: 'اللغة',
    cityLabel: 'المدينة', cityAll: 'كل البلد', citySerpHint: 'المدينة — تُدقّق نتائج البحث (تبقى الأحجام على مستوى البلد)',
    // إرشادات الصفحة (تُستخدم أيضًا كتلميحات في الشريط الجانبي)
    helpExplorer: 'اكتب كلمة مفتاحية (مثال: «صباغة الشعر») لمعرفة عدد الباحثين عنها شهريًا، ومدى المنافسة، واقتراحات كلمات قريبة.',
    helpProjects: 'أنشئ مشروعًا لكل موقع تريد متابعته، وتجمع فيه الكلمات التي تراقب مركزها على Google.',
    helpSerp: 'شاهد صفحة نتائج Google الحقيقية لكلمة وبلد ومدينة محدّدة — من يظهر أولًا.',
    helpDomain: 'أدخل موقع منافس لمعرفة الكلمات التي يتصدّر بها والزيارات المقدّرة التي يجنيها.',
    helpBacklinks: 'اعرف كم موقعًا يشير إلى نطاق معيّن — إشارة قوية على السلطة لدى Google.',
    helpAudit: 'الصق رابط صفحة لتشخيص تقني فوري: العنوان، الوصف، البنية، المشاكل.',
    helpTracker: 'تابع تطوّر مركزك في Google على كلماتك عبر الزمن. أضف كلمة ثم شغّل التحقّق.',
    helpDatabase: 'كل الكلمات التي سبق البحث عنها، تتراكم مع الوقت — الأصل الخاصّ بأداتك.',
    helpAdmin: 'نظرة عامة: عدد المستخدمين، الاستخدام وتكاليف DataForSEO، ونسبة التخزين المؤقت.',
    helpProjectDetail: 'أضف هنا الكلمات التي تريد مراقبتها لهذا الموقع، ثم اضغط «تحقّق» لرصد مركزها في Google. مؤشّر الظهور يلخّص الكل.',
    helpTrackFree: 'إضافة كلمة مجانية. «تحقّق» وحده يستعلم من Google (وقد يستهلك طلبًا).',
    // مسرد المقاييس (بلغة مبسّطة للتلميحات)
    gVolume: 'عدد مرات البحث عن هذه الكلمة على Google شهريًا في البلد المختار.',
    gCpc: 'تكلفة النقرة: ما يدفعه المعلن وسطيًا مقابل نقرة على هذه الكلمة. مؤشّر على القيمة التجارية.',
    gCompetition: 'المنافسة الإعلانية (Google Ads) على الكلمة من 0 إلى 1. كلما ارتفعت زاد تنافس المعلنين.',
    gIntent: 'ما يقصده الباحث: معرفة، شراء، مقارنة، أو الذهاب إلى موقع محدّد.',
    gDifficulty: 'الصعوبة المحسوبة (0–100): مدى صعوبة الظهور في صدارة Google. منخفض = سهل، مرتفع = صعب.',
    gTraffic: 'الزيارات الشهرية المقدّرة التي تجلبها هذه الكلمة للموقع حسب مركزه.',
    gBacklinks: 'الروابط الواردة: مواقع أخرى تشير إلى هذا الموقع. كثرة الروابط الجيّدة = سلطة أعلى لدى Google.',
    gVisibility: 'مؤشّر الظهور (0–100) يلخّص مراكزك: قريب من 100 = تظهر غالبًا في صدارة Google.',
    gSeen: 'عدد مرات البحث عن هذه الكلمة داخل الأداة — كلما زاد زاد الطلب عليها.',
    // الإرشاد الأول
    obTitle: 'مرحبًا 👋 إليك كيف تبدأ',
    obStep1: 'اكتب كلمة مفتاحية (مثال: «صباغة الشعر») وابدأ البحث.',
    obStep2: 'اقرأ الحجم (عمليات البحث شهريًا) والصعوبة — استهدف حجمًا مرتفعًا وصعوبة منخفضة.',
    obStep3: 'أنشئ مشروعًا لموقعك وأضف إليه الكلمات لمتابعتها عبر الزمن.',
    obDismiss: 'فهمت',
    dbTitle: 'قاعدة كلمات MENA', dbSub: 'أصل خاصّ يتنامى مع كل عملية بحث',
    totalBase: 'إجمالي القاعدة', uniqueKw: 'كلمات فريدة', volTotalLabel: 'إجمالي الحجم', avgDiffLabel: 'متوسّط الصعوبة', shown: 'المعروضة', afterFilters: 'بعد الفلاتر',
    top3Vol: 'أعلى 3 حجمًا', searchDbPh: 'ابحث (مثال: شعر)…', searchBtn: 'ابحث',
    allDiff: 'كل الصعوبات', minVol: 'أدنى حجم', copy: 'نسخ', exportCsv: 'تصدير CSV',
    kwCol: 'الكلمة', volCol: 'الحجم', diffCol: 'الصعوبة', cpcCol: 'التكلفة', seenCol: 'مرّات', sourceCol: 'المصدر',
    emptyDbT: 'القاعدة فارغة أو لا نتائج', emptyDbH: 'ابحث عن كلمات — كل عملية تُثري القاعدة.',
    adminTitle: 'لوحة المشرف', adminSub: 'رؤية شاملة · المشاريع والإحصاءات والبيانات',
    kwBank: 'قاعدة الكلمات', kwBankSub: 'كلمات MENA المتراكمة', usersN: 'المستخدمون', usersSub: 'حسابات نشطة', projectsN: 'المشاريع', projectsSub: 'مواقع متابَعة',
    quickAccess: 'وصول سريع', cardBankSub: 'بحث · تصدير', cardTrackerSub: 'تتبّع · سجلّ', cardSearchSub: 'كلمات · نتائج · صعوبة', cardCompSub: 'نطاقات · روابط · تدقيق',
    appTitle: 'مشاريعي', appSub: 'مشروع لكل موقع لتنظيم متابعتك للسيو',
    projNamePh: 'اسم المشروع (مثال: متجري)', create: 'إنشاء', creating: 'جارٍ الإنشاء…', open: 'فتح', del: 'حذف',
    emptyProjT: 'لا مشاريع', emptyProjH: 'أنشئ واحدًا أعلاه لبدء متابعة السيو.',
    backToProjects: 'مشاريعي', trackedKw: 'كلمات متابَعة',
    actSearch: 'ابحث عن كلمات', actSearchSub: 'اكتشف فرصًا جديدة', actSerp: 'حلّل نتائج البحث', actSerpSub: 'من يتصدّر كلماتك', auditSite: 'تدقيق الموقع', soon: 'قريبًا',
    trackForSite: 'تابع كلمة لهذا الموقع', positionsOfSite: 'مراكز الموقع', noKwForSite: 'لا كلمات متابَعة لهذا الموقع', addKwHint: 'أضف كلمة أعلاه للبدء.',
    projNotFound: 'المشروع غير موجود', projNotFoundH: 'هذا المشروع غير موجود أو تم حذفه.',
    visibility: 'الظهور', visibilitySub: 'مؤشّر الحضور /100', distribution: 'توزّع المراكز',
    rng1_3: 'أفضل 3', rng4_10: '4–10', rng11_20: '11–20', rng21p: '21+ / خارج', posDistribution: 'توزيع المراكز', serpMakeup: 'تركيبة الصفحة',
    serpFeaturesTitle: 'عناصر أخرى على صفحة Google', serpOrganicTitle: 'النتائج الطبيعية',
    serpFeaturedSnippet: 'مقتطف مميّز (المركز 0)', serpFsHint: 'يبرز Google هذه الإجابة في الأعلى — استهدافها قد يضعك فوق الجميع.',
    serpLocalPack: 'الحزمة المحلية (خرائط Google)', serpLocalHint: 'يعرض Google خريطة: بطاقة Google Business جيّدة تمثّل ميزة حقيقية هنا.',
    serpPaa: 'أسئلة يطرحها الباحثون', serpPaaHint: 'أفكار محتوى جاهزة لمعالجتها في صفحاتك لالتقاط هذه العمليات.',
    serpRelated: 'عمليات بحث ذات صلة', serpAds: 'المعلنون على هذه الكلمة', serpAdsHint: 'علامات تدفع مقابل هذه الكلمة: مؤشّر على قيمة تجارية حقيقية.',
    recent: 'عمليات بحث أخيرة', visitSite: 'زيارة', fullTracking: 'التتبّع الكامل', examples: 'أمثلة للتجربة',
  },
}

export function usePT(): Record<string, string> {
  const [lang] = useLang()
  return PT[lang]
}
