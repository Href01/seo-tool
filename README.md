# SEO Tool (MVP)

Outil SEO niche (Maroc / e-commerce), bâti par-dessus **DataForSEO** avec **cache partagé**.
Le plan complet : `c:\tmp\seo-tool-plan.md` · Modèle financier : `c:\tmp\seo-tool-model.xlsx`.

## Principe
On n'achète que la data (DataForSEO). La valeur = la couche par-dessus (IA, workflow, local).
Le **cache** (mêmes mots-clés servis à tous depuis Postgres) est ce qui rend le modèle rentable.

## Démarrer

1. **Config**
   ```bash
   cp .env.example .env.local
   ```
   - `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` → crée un compte + dépose ~50$ sur https://dataforseo.com
   - `DATABASE_URL` (optionnel au début) → une base Neon gratuite (https://neon.tech). Sans elle, l'app tourne mais chaque requête paie DataForSEO (pas de cache).

2. **Lancer**
   ```bash
   npm run dev
   ```
   Ouvre http://localhost:3000 → tape un mot-clé (ex : *coloration cheveux*).
   La 1ʳᵉ recherche appelle DataForSEO (💳) ; les suivantes sortent du cache (⚡ 0 $).

## Structure
- `lib/dataforseo.ts` — client DataForSEO (Basic auth) + `keywordSuggestions()` (Maroc/fr).
- `lib/cache.ts` — cache Postgres partagé (TTL), dégradation gracieuse sans DB.
- `app/api/keywords/route.ts` — endpoint mots-clés (cache 30 j, hash de la requête).
- `app/page.tsx` — UI de test (input → tableau volume/CPC/difficulté).

## Prochaines étapes (voir le plan)
- Aperçu SERP + aperçu domaine (autres endpoints DataForSEO, même pattern de cache).
- Auth + quotas + crédits de refresh + Stripe (palier 12,5$).
- La feature qui différencie : **produit/mot-clé → fiche + article SEO générés en fr/ar** (couche IA via Claude).

## Notes
- ⚠️ Le mapping des champs dans `keywordSuggestions()` suit la réponse DataForSEO `keyword_suggestions/live`.
  Vérifie/ajuste au 1ᵉʳ vrai appel (les champs exacts peuvent varier selon l'endpoint choisi).
- Clés API **côté serveur uniquement** (jamais dans un composant client).
