# SEO·MENA — Documentation projet

Outil SEO pour les marchés **MENA / Golfe** (Maroc, Algérie, Tunisie, Égypte,
Arabie Saoudite, EAU, Qatar…). Positionnement : ne pas concurrencer Ahrefs/Semrush
sur la donnée brute, mais offrir une **couche MENA** — difficulté propriétaire,
base de mots-clés locale, interface **bilingue FR/العربية (RTL)**, économie de
coût via cache partagé.

> Doc vivante. À mettre à jour à chaque évolution structurante. Voir aussi
> `AGENTS.md` (⚠️ Next.js 16, lire les docs bundlées avant de coder).

---

## 1. Stack & déploiement

| | |
|---|---|
| Framework | **Next.js 16** + React 19 (App Router, Turbopack) |
| Langage | TypeScript |
| Style | Tailwind v4 (`@import "tailwindcss"`) + tokens CSS dans `app/globals.css` |
| Données SEO | **DataForSEO** (HTTP Basic, `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`) |
| DB | **Neon Postgres** (connexion *poolée* `-pooler`, `DATABASE_URL`) |
| Hébergement | **Vercel** (Hobby) — `seo-tool-ten-sooty.vercel.app` — repo `Href01/seo-tool` |
| Auth | **Aucune** (mode User/Admin via `localStorage`, pas de comptes) |

**Variables d'env** : `DATABASE_URL`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`.
Sans DB → l'app tourne en mode dégradé (pas de cache, pas de suivi, pas de bank).

---

## 2. Architecture & flux de données

```
UI (client) ──POST──> app/api/<feature>/route.ts (runtime nodejs)
                          │
                          ├─ cacheKey(prefix, …parts)   → lib/cache.ts
                          ├─ getCachedMeta(key, TTL)     → HIT = 0 $, renvoie {payload, fetchedAt}
                          │                                   MISS ↓
                          ├─ lib/dataforseo.ts  ──HTTP──> DataForSEO  (PAYANT)
                          ├─ setCached(key, payload)     → réutilisable par TOUS les users
                          └─ recordKeywords(…)           → lib/bank.ts (asset propriétaire)
```

**Le cache partagé est le cœur du modèle économique** : la même
`(mot-clé, pays, langue)` renvoie la même donnée pour tout le monde → **un seul
appel payant sert tous les users** jusqu'à expiration du TTL. Un hit coûte 0 $.

### Pattern de chaque feature
`dfs()` (client HTTP) → normaliseur → route cachée (`getCachedMeta`/`setCached`,
TTL selon le type de donnée) → page qui consomme via `useSeoQuery` (ou fetch direct).

---

## 3. Carte du code

```
app/
  layout.tsx            Shell + <html dir> (RTL)
  shell.tsx             Sidebar + contenu, applique dir=rtl selon la langue UI
  nav.tsx               Sidebar : icônes SVG, sections, toggles User/Admin + FR/ع
  page.tsx              EXPLORER (master-detail 3 panneaux) — écran principal
  tracker/page.tsx      TRACKER de positions (master-detail)
  overview/page.tsx     Redirige vers / (fusionné dans l'Explorer)
  serp|domain|backlinks|audit/page.tsx   Pages d'analyse (mono-colonne)
  database/page.tsx     Base de mots-clés (admin)
  admin/page.tsx        Dashboard admin
  app/page.tsx          Liste des projets (user)
  app/project/[id]/page.tsx   Détail projet (dashboard riche)
  api/
    keywords            suggestions Labs
    keyword-overview    volume/CPC/difficulté/intention/tendance (Labs → Google Ads)
    difficulty          difficulté propriétaire (SERP + autorité)
    serp                SERP organique (desktop/mobile)
    domain              ranked keywords + trafic estimé (v2, limit 200)
    backlinks           profil de liens
    audit               audit on-page instantané
    rank + rank/check   suivi de positions
    projects + [id]     CRUD projets
    database            lecture de la bank
    admin/stats         compteurs
lib/
  dataforseo.ts   Client DataForSEO + tous les normaliseurs + difficulté maison
  cache.ts        Cache Postgres partagé (cacheKey / getCachedMeta / setCached)
  db.ts           Pool Postgres + init schéma (idempotent, globalThis)
  tracking.ts     Suivi de rang (tables rank_tracking / rank_history)
  bank.ts         Base de mots-clés propriétaire (upsert, COALESCE)
  projects.ts     CRUD projets
  i18n.ts         useLang + dictionnaires T (strict) & PT (pages) + intentLabel
  locations.ts    12 pays MENA/Golfe + appareils (noms FR/AR)
  examples.ts     Exemples MENA pour les états vides
  useSeoQuery.ts  Hook client {loading,error,cached,fetchedAt,data,run} + timeAgo
  useMode.ts      Toggle User/Admin (localStorage)
components/
  ui.tsx          Design system : Card, StatCard, Button, WorkspaceHeader,
                  DistributionBar, visibilityScore, EmptyState (chips), CacheMeta…
  LocationSelector.tsx  Sélecteurs pays/appareil/langue (traduits)
  KeywordTable.tsx / KeywordInsights.tsx   Table + insights de l'Explorer
scripts/
  warmup.mjs + warmup-seeds.txt   Pré-remplissage de 500 mots-clés (⚠️ NON exécuté)
```

---

## 4. Modules clés

### `lib/dataforseo.ts`
- `keywordSuggestions` — 50 suggestions (Labs) : volume, CPC, difficulté.
- `keywordOverview` — 1 mot-clé : volume/CPC/concurrence/intention/tendance 12 mois.
  **Labs d'abord**, fallback **Google Ads** pour la longue traîne (sans intention/difficulté).
- `serpOrganic` — top organique. `device` desktop/mobile (tablet→mobile).
- `computeKeywordDifficulty` — **difficulté propriétaire** : SERP top 10 →
  dédup domaines → exclut les méga-plateformes (Instagram, YouTube…) →
  autorité backlinks (0-1000) pondérée par position (#1 le plus lourd) →
  `difficulty = weightedSum / weightTotal` (0-100). ⚠️ voir *Faiblesses*.
- `domainOverview` — ranked keywords (limit 200, triés par trafic `etv` desc) + trafic estimé.
- `backlinksSummary`, `instantPageAudit`, `bulkBacklinkRanks`.

### `lib/cache.ts` — TTL par type
| Donnée | TTL | Raison |
|---|---|---|
| suggestions, overview | 30 j | volumes bougent lentement |
| SERP, difficulté, domaine | 14 j | le SERP bouge en quelques jours |

`cacheKey('domain','v2',…)` → **versionner le préfixe quand la forme du payload change**.

### `lib/tracking.ts`
Par `(keyword, domain, location, language)`. `checkRank` fait un SERP **frais**
(depth 100), écrit un point d'historique. **Manuel uniquement** (`checkAll` existe
mais n'est pas planifié). Actuellement **Maroc/fr en dur** côté route.

### `lib/bank.ts`
Chaque lookup enrichit `keyword_bank` (upsert, `COALESCE` des métriques,
`times_searched++`). Best-effort, n'interrompt jamais l'utilisateur.

### `lib/i18n.ts`
- `T` / `useT` : chaînes strictes (Explorer, Tracker, sidebar).
- `PT` / `usePT` : chaînes des autres pages (typage souple).
- `useLang` : langue UI dans `localStorage`, event `langchange`.
- **Règle d'or** : la langue UI est **cosmétique** (labels + RTL). Elle ne doit
  **jamais** être un paramètre d'API — sinon chaque bascule casse le cache et
  **coûte de l'argent**. La *langue de recherche* est un état séparé (`searchLang`).

---

## 5. Économie de coût (à respecter absolument)

1. **Cache partagé** = 1 appel payant sert tous les users.
2. **Langue UI ≠ langue de recherche.** `searchLang` (défaut `fr`) est indépendant
   du toggle FR/ع et persisté avec la recherche.
3. Appels **payants** : suggestions, overview (miss), SERP, **difficulté (2 appels :
   SERP + autorité bulk)**, domaine, backlinks, audit, `rank/check`.
4. La difficulté est le plus cher — elle s'auto-lance au focus dans l'Explorer.

---

## 6. i18n / RTL
- Bascule FR ⇄ العربية dans la sidebar. `app/shell.tsx` pose `dir=rtl`.
- Tables : propriétés logiques `text-start` / `text-end`.
- Noms de pays/appareils traduits (`locName` / `deviceName`).
- États vides invitants : chips d'exemples MENA (`lib/examples.ts`).

---

## 7. Dev local
```bash
npm install
# .env.local : DATABASE_URL, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
npm run dev          # http://localhost:3000
npx tsc --noEmit     # typecheck
npx next build       # build de prod
```
Déploiement : push sur `main` → Vercel build & deploy auto.

---

## 8. Limites connues & feuille de route
Voir la section « Manques, faiblesses, bugs » du suivi (résumé) :
- ⚠️ **Sécurité/coût** : pas d'auth ni de rate-limit sur les routes payantes.
- **Suivi de positions** : pas de cron → l'historique ne se remplit pas seul.
- **Difficulté = 0** quand le top 10 est 100 % plateformes (à afficher « N/A »).
- **Multi-utilisateur** non isolé (tous partagent `demo-user`).
- **Appareil** cosmétique sur les volumes (seul le SERP l'utilise).
- **Bank** quasi vide tant que le warmup n'est pas lancé.
- **GSC** non intégré (données exactes du propre domaine).

_Dernière mise à jour : 2026-07-08._
