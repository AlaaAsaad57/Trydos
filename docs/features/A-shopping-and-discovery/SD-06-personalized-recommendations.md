# SD-06 — Personalized Recommendations

| | |
|---|---|
| **Feature ID** | SD-06 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `services/elastic/elasticSearch.ts` (`GetRecomendationsForUser`), `components/Server/RecomendedProducts.tsx`, `app/api/products/recomended/route.tsx` |

---

## What it is

Product suggestions **tailored to the individual shopper** — a per-user "recommended for you"
list, computed from a precomputed recommendation model.

## Where it appears

On the **homepage**, as a "recommended products" strip rendered within the boutiques feed. It is
a homepage widget — not a product-page section. (The product page's similar-items strip is the
separate, non-personalised SD-29.)

## Who uses it

Signed-in shoppers (guests fall back to a cold-start list).

## How it works (verified behaviour)

- **Per-user, precomputed.** For a given user id, the app reads a stored list of recommended
  products (with scores) from a dedicated recommendation index and shows them highest-score first.
- **Cold start.** If there's no user id or no record for the user, it falls back to a cold-start
  recommendation list.
- **Validated against the live catalogue.** The recommended ids are re-checked against the live
  catalogue so out-of-stock/inactive items are dropped, keeping the recommendation order.
- **The scoring is done upstream/offline** — this app only reads the results; it does not compute
  recommendations or collect the signals in the browser.

## Data source

| Item | Value |
|------|-------|
| Recommendations | Elasticsearch `recommendation_index` by `user_id` → `recommended_products[{product_id, score}]` |
| Cold start | `recommendation_cold_index` |
| Hydration | re-validated against the live `catalog_index` (drops inactive/out-of-stock) |
| API | `app/api/products/recomended/route.tsx` (`GET`, `user_id`) |

## Technical reference

| Item | Value |
|------|-------|
| Server action | `GetRecomendationsForUser` / `GetNextRecommendations` (`services/elastic/elasticSearch.ts`, `serverRequests/home.tsx`) |
| Surface | `components/Server/RecomendedProducts.tsx`, mounted in `components/ServerWrapper/BoutiquesListWrapper.tsx` |
| User id | `auth.UserID()` (falls back to the guest/user id) |

## Current status & maturity

**Live** on the home feed for signed-in shoppers, with a cold-start fallback for everyone else.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-01 (Homepage feed) · SD-05 (Boutiques list where it renders) · SD-29 (Related products — the
non-personalised product-page equivalent).
