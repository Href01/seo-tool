# SEO MENA - Documentation projet

Outil SEO pour les marches MENA / Golfe (Maroc, Algerie, Tunisie, Egypte,
Arabie Saoudite, EAU, Qatar...). Positionnement : ne pas concurrencer Ahrefs ou
Semrush sur la donnee brute, mais offrir une couche MENA : difficulte
proprietaire, base de mots-cles locale, interface bilingue FR/AR avec RTL, et
economie de cout via cache partage.

Doc vivante. A mettre a jour a chaque evolution structurante. Voir aussi
`AGENTS.md` : Next.js 16, lire les docs bundlees avant de coder.

---

## 1. Stack & deploiement

| | |
|---|---|
| Framework | Next.js 16 + React 19 (App Router, Turbopack) |
| Langage | TypeScript |
| Style | Tailwind v4 (`@import "tailwindcss"`) + tokens CSS dans `app/globals.css` |
| Donnees SEO | DataForSEO (HTTP Basic, `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`) |
| DB | Neon Postgres (connexion poolee `-pooler`, `DATABASE_URL`) |
| Hebergement | Vercel Hobby - `seo-tool-ten-sooty.vercel.app` - repo `Href01/seo-tool` |
| Auth | Sessions email/password maison (cookie httpOnly, `scrypt`, roles user/admin) |

Variables d'env : `DATABASE_URL`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`,
`CRON_SECRET`, `ADMIN_EMAIL` optionnel. Sans DB, l'app tourne en mode degrade :
pas de cache, pas de comptes, pas de suivi, pas de bank.

---

## 2. Architecture & flux de donnees

```text
UI (client) --POST--> app/api/<feature>/route.ts (runtime nodejs)
                         |
                         +-- cacheKey(prefix, ...parts) -> lib/cache.ts
                         +-- getCachedMeta(key, TTL)    -> HIT = 0 $
                         |                                  MISS
                         +-- lib/dataforseo.ts ---------> DataForSEO (PAYANT)
                         +-- recordDfsUsage(...)         -> couts admin
                         +-- recordCacheEvent(...)       -> hit/miss admin
                         +-- setCached(key, payload)     -> cache partage
                         +-- recordKeywords(...)         -> lib/bank.ts
```

Le cache partage est le coeur du modele economique : la meme requete
`(mot-cle, pays, langue)` sert tous les users jusqu'a expiration du TTL. Un hit
de cache coute 0 $.

Pattern feature : `dfs()` -> normaliseur -> route cachee
(`getCachedMeta`/`setCached`) -> page via `useSeoQuery` ou fetch direct.

---

## 3. Carte du code

```text
app/
  layout.tsx                  Shell + <html dir>
  shell.tsx                   Sidebar + contenu, applique dir=rtl selon la langue UI
  nav.tsx                     Sidebar, toggles User/Admin + FR/AR
  page.tsx                    Explorer principal (master-detail 3 panneaux)
  tracker/page.tsx            Tracker de positions
  serp|domain|backlinks|audit Pages d'analyse
  database/page.tsx           Base de mots-cles (admin)
  admin/page.tsx              Dashboard admin + cost cockpit
  login/page.tsx              Login/signup email+password
  app/page.tsx                Liste des projets
  app/project/[id]/page.tsx   Detail projet
  api/
    keywords                  suggestions Labs
    keyword-overview          volume/CPC/difficulte/intention/tendance
    difficulty                difficulte proprietaire (SERP + autorite)
    serp                      SERP organique
    domain                    ranked keywords + trafic estime
    backlinks                 profil de liens
    audit                     audit on-page instantane
    auth/login|signup|logout|session
    rank + rank/check         suivi de positions (ajout non payant, check par id)
    cron/check-ranks          refresh quotidien protege par CRON_SECRET
    projects + [id]           CRUD projets
    database                  lecture de la bank
    admin/stats               compteurs

lib/
  api.ts / errors.ts          parsing JSON, params, erreurs typees
  auth.ts                     sessions, hash password, roles, requireUser/Admin
  usage.ts                    cout DataForSEO + events cache + dashboard
  dataforseo.ts               client DataForSEO + normaliseurs + difficulte maison
  cache.ts                    cache Postgres partage
  db.ts                       pool Postgres + init schema idempotent
  tracking.ts                 rank_tracking / rank_history
  bank.ts                     base de mots-cles proprietaire
  projects.ts                 CRUD projets
  i18n.ts                     useLang + dictionnaires T/PT + intentLabel
  locations.ts                pays MENA/Golfe + appareils
  examples.ts                 exemples MENA
  useSeoQuery.ts              hook client SEO POST/cache state
  useMode.ts                  toggle User/Admin

components/
  ui.tsx                      design system (voir section 10)
  LocationSelector.tsx        selecteurs pays/ville/appareil/langue
  KeywordTable.tsx            table mots-cles

scripts/
  warmup.mjs + warmup-seeds.txt  50 seeds Maroc (execute une fois, throttle 3s)
```

---

## 4. Modules cles

### `lib/dataforseo.ts`
- `dfs()` valide les `status_code` DataForSEO (enveloppe + tasks), remonte
  `tasks_error`, detecte les hard failures task-level, et logge le `cost` annonce
  par l'API pour chaque miss payant. Les couts non nuls sont aussi ecrits dans
  `dataforseo_usage`.
- `keywordSuggestions` : 50 suggestions Labs, volume, CPC, difficulte.
- `keywordOverview` : 1 mot-cle, Labs d'abord, fallback Google Ads pour la longue
  traine (sans intention/difficulte).
- `serpOrganic` : top organique google.com geo-cible, desktop/mobile. Optionnel
  `coordinate` ("lat,long") -> `location_coordinate` pour un ciblage ville (sinon
  `location_code` pays). Pour le tracking, `stop_crawl_on_match` arrete le crawl
  quand le domaine cible est trouve.
- `computeKeywordDifficulty` : SERP top 10 -> dedup domaines -> exclusion des
  mega-plateformes -> autorite backlinks (0-1000) ponderee par position -> score
  0-100, ou `null` si le top 10 est 100 % plateformes (terrain libre). Remonte
  aussi les questions (PAA) et recherches associees de la MEME SERP (0 appel en
  plus) -> affichees comme idees dans l'Explorer.
- `domainOverview` : ranked keywords limit 200, tries par trafic `etv` desc.
- `backlinksSummary`, `instantPageAudit`, `bulkBacklinkRanks`.

### `lib/cache.ts`
| Donnee | TTL | Raison |
|---|---:|---|
| suggestions, overview | 30 j | volumes bougent lentement |
| SERP, difficulte, domaine | 14 j | SERP bouge en quelques jours |
| audit | 7 j | page peut changer plus vite |

Versionner les prefixes de cache quand la forme du payload change, ex.
`cacheKey('domain', 'v2', ...)`.
Chaque lookup cache ecrit un event hit/miss dans `cache_events` pour le cockpit admin.

### `lib/tracking.ts`
Par `(user_id, keyword, domain, location, language)`. Ajouter un mot-cle ne declenche plus
de SERP payant : l'historique commence quand l'utilisateur clique **Verifier**.
`checkRank` throttle les checks manuels (6 h par defaut) et renvoie le dernier
point si la donnee est encore fraiche. `checkAll` est reserve au Vercel Cron
quotidien et force un SERP frais. `/api/rank` accepte maintenant le pays et la
langue de recherche exposes dans le tracker global et les pages projet ; les
checks et le bloc "above you" utilisent le marche stocke pour le mot-cle suivi.

### `lib/auth.ts`
- Signup/login email+password, hash `scrypt`, cookie `seo_session` httpOnly.
- Le premier compte devient admin. Si `ADMIN_EMAIL` est defini, cet email devient
  admin a la creation du compte.
- `requireUser(req)` protege projets/tracking ; `requireAdmin(req)` protege
  `/admin`, `/database` et les stats.

### `lib/usage.ts`
Agrege le cockpit admin : cout aujourd'hui/7j/30j, cout par endpoint DataForSEO,
hits/misses cache par prefixe.

### `lib/bank.ts`
Chaque lookup enrichit `keyword_bank` (upsert, `COALESCE`, `times_searched++`).
Best-effort : la bank ne doit jamais interrompre l'utilisateur.

### `lib/i18n.ts`
- `T` / `useT` : chaines strictes (Explorer, Tracker, sidebar).
- `PT` / `usePT` : chaines des autres pages.
- `useLang` : langue UI dans `localStorage`, event `langchange`.
- Regle d'or : langue UI != langue de recherche. Le toggle FR/AR ne doit jamais
  changer les params d'API, sinon il casse le cache et coute de l'argent.

---

## 5. Economie de cout

1. Cache partage = 1 appel payant sert tous les users.
2. Langue UI != langue de recherche. `searchLang` est separe du toggle FR/AR.
3. Appels payants : suggestions, overview miss, SERP, difficulte maison
   (SERP + backlinks bulk), domaine, backlinks, audit, `rank/check`.
4. La difficulte maison est explicite : elle se lance via **Paysage SERP** ou
   **Recalculer**, plus au focus/reload de l'Explorer.
5. Ajouter un tracking ne consomme rien ; seul **Verifier** ou le cron consomme.
6. Checks manuels de tracking throttles 6 h ; cron force un check frais.
7. Le cockpit admin suit `dataforseo_usage` et `cache_events`.

---

## 6. Securite actuelle

- `lib/auth.ts` : sessions DB + cookie httpOnly ; hash password `scrypt`.
- `lib/guard.ts` : controle d'origine + rate-limit IP 25/min et 300/jour, adosse
  a Postgres quand disponible.
- Guard applique aux routes payantes, auth, projet/tracking/admin.
- Routes projet/tracking isolees par `user_id`. Routes admin reservees au role admin.
- Cron : `GET /api/cron/check-ranks` refuse de tourner sans `CRON_SECRET`, puis
  exige `Authorization: Bearer <CRON_SECRET>`.
- Reste a faire : OAuth Google/Auth.js, reset password, verification email.

---

## 7. Dev local

```bash
npm install
# .env.local : DATABASE_URL, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, CRON_SECRET, ADMIN_EMAIL
npm run dev          # http://localhost:3000
npx tsc --noEmit     # typecheck
npm run lint         # lint
npm run build        # build de prod
```

Deploy : push sur `main` -> Vercel build & deploy auto.

---

## 8. Cron de suivi (Vercel)

- `vercel.json` planifie `GET /api/cron/check-ranks` tous les jours a 06:00 UTC.
- La route relance `checkAll()` -> un SERP frais payant par mot-cle suivi.
- Protection obligatoire : definir `CRON_SECRET` dans les env Vercel.
- Limite Hobby : fonction environ 60 s -> ~20-25 mots-cles par run sequentiel.
  Au-dela, passer en batch ou Pro.

---

## 9. Limites connues

- OAuth Google/Auth.js et verification email non integres.
- Difficulte maison : `null` (terrain libre) quand le top 10 est 100 % plateformes.
- Volumes DataForSEO au niveau pays uniquement : la ville n'affine que SERP,
  difficulte et suivi (les volumes restent pays).
- GSC non integre (donnees exactes du propre domaine).
- Bank encore modeste (50 seeds Maroc warmes).

---

## 10. Design system (`components/ui.tsx`)

Identite : **clair + vibrant multicolore**. Tokens dans `app/globals.css`.

- Marque : `--crimson #ec0b43`, degrade signature `--brand-grad`
  (crimson -> magenta -> corail), classes `.brand-grad` / `.brand-anim` (sheen).
- Accents decoratifs (tuiles, non-data) : `--violet --teal --blue --pink --indigo`.
  **Distincts** des couleurs de statut reservees aux donnees : `--up` (vert),
  amber, `--down` (rouge). Ne jamais utiliser un accent decoratif pour un statut.
- Profondeur : `--shadow-sm/md/lg`, fond page legerement teinte.
- Mouvement : `.animate-in` (reveal), `.grow-bar`, count-up `AnimatedNumber`,
  hover-lift. Tout respecte `prefers-reduced-motion`.

Primitives : `Card`, `StatCard` (props `tone` + `num`/`format` count-up +
`spark`), `RingGauge` (score 0-max), `Sparkline`, `DistributionBar` (separateur
2px), `TrendPill`, `Pill`, `Button` (degrade), `WorkspaceHeader`, `EmptyState`,
`Callout` (guidage), `InfoTip` (glossaire "?"), `Onboarding` (3 etapes), `Page`,
`CacheMeta`, `ErrorBox` (CTA login auto sur erreur d'auth), `SectionTitle`,
`Segmented`. Toutes bilingues + RTL.

Regles data-viz (voir skill dataviz) : couleurs de statut reservees + label,
1 seul axe, categorielles en ordre fixe jamais cyclees, texte en encre jamais
en couleur de serie.

---

## 11. Audit & plan de travail (2026-07-09)

Etat apres passage architecte / engineer / UX.

**Corrige (P0) :**
- Tendance = 12 mois les plus recents (etait les plus vieux, `slice(-12)` sans tri).
- Position = rang organique `rank_group` (etait `rank_absolute`, gonfle).
- SERP : features exposees (snippet, PAA, pack local, related, ads) — deja payees.
- Lint : `set-state-in-effect` (AnimatedNumber, Onboarding), dep `useMemo` (SERP).
- Login : bilingue FR/AR + identite (etait FR/EN code en dur).
- Projets : erreurs inline (etait `alert()`).

**Fait — P1 (visuel / coherence) :**
- Tuiles `tone` uniformisees (y compris les minis du Tracker).
- Couleurs de statut standardisees via `lib/status.ts` (plus de `amber-100/700`
  epars dans les helpers).
- **Bug corrige** : `StatCard` avait `overflow-hidden` -> les tooltips `InfoTip`
  etaient coupes sur la plupart des pages. `overflow-hidden` retire, barre
  d'accent arrondie a la place.
- RTL : separateur de `DistributionBar` passe en `border-inline-end` (logique,
  flip correct en arabe). Ordre des barres de tendance laisse au flip RTL naturel
  (axe temps de droite a gauche en arabe = lecture attendue).

**Fait — P2 (architecture / dette) :**
- `PT` est desormais **type strictement** (`PtKey` = cles de `PT_FR` ; `PT_AR`
  typé `Record<keyof PT_FR, string>`). Une cle AR manquante/mal ecrite = erreur
  de compilation. Le typecheck a confirme 0 cle manquante dans toute l'app.
- `MEGA_PLATFORMS` centralise dans `lib/platforms.ts` (client-safe), importe par
  la difficulte (serveur) et la page SERP (client).
- Couleurs de statut centralisees dans `lib/status.ts` (`positionTone`,
  `difficultyTone`, `spamTone`) — utilisees par Explorer, SERP, Domaine,
  Tracker, Projet, Base, Backlinks. Les badges de position ont maintenant les
  memes 4 paliers partout (etaient 3 sur SERP/Domaine).

**Fait — feature :**
- Ciblage ville etendu au **suivi de positions** : colonne `city` sur
  `rank_tracking` (`''` = pays), incluse dans l'index unique ; selecteur ville
  sur le tracker global + le detail projet ; `findPosition` utilise la
  coordonnee de la ville. Le libelle de marche affiche la ville.

**Fait — P2 :**
- `lib/format.ts` locale-aware (`formatNumber`/`formatDate`/`formatRelative`) :
  FR = `fr-FR`, AR = `ar-MA` (chiffres latins au Maghreb). Cable dans
  `AnimatedNumber` (tous les chiffres animes) et `CacheMeta` (le "maj il y a N
  jours" etait toujours en francais -> maintenant bilingue). Reste : quelques
  `toLocaleString('fr')` dans les cellules de tableaux (chiffres latins, faible
  impact).

**Fait — feature :**
- Apercu SERP-features dans l'Explorer : questions (PAA) + recherches associees
  dans le panneau d'idees, tirees de la SERP de la difficulte (0 appel en plus,
  visibles apres Paysage SERP). Recherches associees = chips cliquables.

**A faire (features) :**
- GSC (donnees exactes du domaine), OAuth, reset password.

Derniere mise a jour : 2026-07-09.
