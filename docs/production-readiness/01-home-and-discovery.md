# Home and discovery — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** The home and category pages work end to end, but the production index names must be set, and the index TLS check, an open cache-flush route and a recommendations privacy hole must be fixed before launch.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
The shopper lands on `/{country}-{lang}` (for example `/sy-en`). The page shows a category bar, a featured row, a flash-deals row, a list of boutiques and a recommended row.
Tapping a category opens `/{country}-{lang}/categories/{slug}`, the same page filtered to that category.
The stories bar and the search overlay sit on the same page but are covered in their own files (stories, search).

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper opens `/sy-en` → the page shows the category bar, the product rows and the boutique list. | Elasticsearch | `app/(client)/[lang]/page.tsx`, `components/Home/CategoryHomeView.tsx` | `tests/components/Home/CategoryHomeView.test.tsx`; e2e "the home page renders and stays up" (`tests/e2e/guest.live.spec.ts`) |
| W-2 | The category bar lists every category once, in the shopper's language, for the shopper's country. | Elasticsearch | `serverRequests/cached/home.ts` (`getCachedCategories`), `components/Server/MainCategories/index.tsx` | `tests/components/Server/MainCategories/index.test.tsx`, `tests/serverRequests/cached/home.test.ts` |
| W-3 | Shopper taps a category → `/categories/{slug}` opens, the tab is marked open and moves to the front. Tapping it again goes back to the home page. | Elasticsearch | `components/Home/CategoryNavMobile.tsx`, `components/Server/MainCategories/index.tsx` | `tests/components/Home/CategoryNavMobile.test.tsx`; e2e GUEST-47 |
| W-4 | On a category page, the featured row, the flash-deals row and the boutique list show only that category. The recommended row is not shown there. | Elasticsearch | `components/Home/CategoryHomeView.tsx`, `serverRequests/cached/home.ts` (`categoryFilter`) | `tests/components/Home/CategoryHomeView.test.tsx`, `tests/app/categories/page.test.tsx` |
| W-5 | A category address with a bad shape (symbols, more than 64 characters) → 404 page. | none | `app/(client)/[lang]/categories/[slug]/page.tsx`, `serverRequests/meta/home.ts` (`isValidCategorySlug`) | `tests/app/categories/page.test.tsx`, `tests/app/categoryRoute.test.ts` |
| W-6 | The category bar shows left/right scroll arrows only when the bar overflows. Right-to-left languages (`ar`, `ku`) scroll the other way. | none | `components/Server/Navbar.tsx` | `tests/components/Server/Navbar.test.tsx` |
| W-7 | Featured row: up to 10 featured products for the country. The header links to `/featured`. A "Show More" tile appears when there are more than 8 cards. | Elasticsearch | `components/ServerWrapper/FeaturedProduct.tsx`, `components/Server/FeatureProducts.tsx`, `serverRequests/home.tsx` (`GetFeaturedProducts`) | `tests/components/ServerWrapper/FeaturedProduct.test.tsx`, `tests/components/Server/FeatureProducts.test.tsx`; e2e GUEST-48 (the `/featured` page) |
| W-8 | Flash-deals row: up to 10 products with an active deal (`flash_deal_status: 1`, inside the start/end dates). The header links to `/flashDeals`. | Elasticsearch | `components/ServerWrapper/FlashDealsProduct.tsx`, `components/Server/FlashDealsProducts.tsx`, `services/elastic/helpers.ts:1486-1520` | `tests/components/ServerWrapper/FlashDealsProduct.test.tsx`, `tests/components/Server/FlashDealsProducts.test.tsx`, `tests/services/elastic/helpers.test.ts` |
| W-9 | A row with no products is not drawn at all, and its skeleton space is not reserved, so the boutiques do not jump up. | Elasticsearch | `components/Home/CategoryHomeView.tsx` (`rowHasProducts`) | `tests/components/Home/CategoryHomeView.test.tsx` |
| W-10 | Boutique list: 10 boutiques, each with a banner slider and a strip of category / product tiles. Banner → `/filters/boutiques/{slug}`. A tile → a category inside the boutique, or the product page. | Elasticsearch | `components/ServerWrapper/BoutiquesListWrapper.tsx`, `components/ServerWrapper/BoutiqueWrapper.tsx`, `services/elastic/elasticsearch-reader.service.ts` (`getBoutiques`) | `tests/components/ServerWrapper/BoutiquesListWrapper.test.tsx`, `tests/components/ServerWrapper/BoutiqueWrapper.test.tsx`, `tests/components/Home/OfferWidgets/BoutiqueElement.test.tsx` |
| W-11 | Shopper scrolls down → the next 10 boutiques load. Loading stops when a page comes back empty or with no cursor. | Elasticsearch | `components/global/InfinteScroll.tsx`, `serverRequests/home.tsx` (`GetNextBoutiques`) | `tests/components/global/InfinteScroll.test.tsx`, `tests/serverRequests/home.test.ts`, `tests/components/Server/OfferListServer.test.tsx` |
| W-12 | Recommended row (home page only): 7 products from the shopper's own recommendation list. A guest, or a shopper with no list, gets the "cold start" list. "Show More" loads 7 more. | Elasticsearch | `components/ServerWrapper/RecommendedWrapper.tsx`, `components/Server/RecomendedProducts.tsx`, `services/elastic/elasticSearch.ts:744-932` | `tests/components/ServerWrapper/RecommendedWrapper.test.tsx`, `tests/serverRequests/home.test.ts` |
| W-13 | Test (QA) shops — slug starting with `trydos-qa-`, any letter case — never show in the featured row, flash-deals row, boutique list or recommendations. | Elasticsearch | `services/elastic/qaFilter.ts`, `services/elastic/helpers.ts:1352-1357`, `services/elastic/elasticsearch-reader.service.ts:728-730` | `tests/services/elastic/helpers.test.ts`, `tests/services/elastic/elasticsearchReader.test.ts`; e2e QA-09a, QA-09b, QA-02b |
| W-14 | Hidden products stay hidden: inactive or deleted product, inactive boutique or brand, seller not approved, product / brand / boutique / category blocked for the country. | Elasticsearch | `services/elastic/helpers.ts:1326-1560` (`buildBaseConditions`) | `tests/services/elastic/helpers.test.ts` (the country rule has no test) |
| W-15 | Prices on the home page use the country's currency and exchange rate. The rate is kept in Redis and in the page cache. | Gateway (`/mobile/home/currency`), Redis | `serverRequests/cached/currency.ts`, `serverRequests/currency.ts` | `tests/serverRequests/cached/currency.test.ts`, `tests/serverRequests/currency.test.ts` |
| W-16 | Starting settings (platform shipping days, decimal digits) load once in the browser. Both key spellings are accepted: core `starting-setting` and gateway `starting_setting`. | Market (core or gateway) `/web/home/startingSettings` | `services/home.ts:38-82` (`getClientData`), `utils/startingSettings.ts` | `tests/utils/startingSettings.test.ts`, `tests/services/home.test.ts` |
| W-17 | A dead product link sends the shopper to `/{lang}?message=product_not_found` → "Product not found" toast, and the `message` is removed from the address. | none (browser) | `components/Home/index.tsx:38-54` | `tests/components/Home/index.test.tsx` |
| W-18 | A missing or hidden boutique sends the shopper to `/{lang}?message=boutique_not_found` → "Boutique not found" toast. An unknown `message` value is removed with no toast. | none (browser) | `components/Home/index.tsx:38-54`, `components/Listing/FiltersPageContent.tsx:160-164` | `tests/components/Home/index.test.tsx`, `tests/components/Listing/FiltersPageContent.test.tsx` |
| W-19 | Name entry: a signed-in shopper with a chat and a stories account but no name taps chat or "add story" on the home page → the name modal opens. The arrow (shown after 2 characters) saves the name to three services. If one refuses, the old name comes back and an error toast shows. | Market `/customer/update-name`, Chat `PUT /api/v1/users/{id}`, Stories `/api/v1/users/update` | `components/Home/index.tsx:64-68`, `components/global/NameModal.tsx`, `services/auth.ts:382-446` | `tests/components/global/NameModal.test.tsx`, `tests/components/Home/index.test.tsx` |
| W-20 | The home rows come from a shared cache, one entry per country + language + category. No cookie or header is read inside the cache, so one shopper's data cannot reach another. | Elasticsearch | `serverRequests/cached/home.ts`, `next.config.ts:39-62` | `tests/cache/noRuntimeReadsInCachedTree.test.ts`, `tests/cache/homeRowsRenderOnTheServer.test.ts`, `tests/cache/serverCookieScope.test.ts` |
| W-21 | Page title, description and share image for home and category pages, in the shopper's language, with a translated fallback when the build fails. | Redis + Elasticsearch | `serverRequests/meta/home.ts`, `app/(client)/[lang]/page.tsx:18-55` | `tests/serverRequests/meta/home.test.ts` |
| W-22 | A product opened from deep in the home page opens over it. Closing it returns the shopper to the same scroll position. | none (browser) | `components/ModalRoute/ModalSlot.tsx`, `components/ModalRoute/overlayScroll.ts` | e2e GUEST-42 ("the home page comes back where it was…" in `tests/e2e/guest.live.spec.ts`), "a listing leads to a product page" |

Stories bar: see the stories file. Search overlay (`components/Home/Search/`): see the search file.

## ⚠️ Works, with limits
- **L-1 — Home rows can be up to 60 seconds old.** The cache lifetime is `HOMEPAGE_CACHE_SECONDS` (default 60, `next.config.ts:39`). Elasticsearch itself lags the backend by a few seconds more. A new featured product or a new deal can take about a minute to appear.
- **L-2 — The flash-deals row is often empty on staging, and then it is hidden.** The deal window uses whole days in UTC (`now/d`, `services/elastic/helpers.ts:1516-1517`). Elasticsearch rounds `lte now/d` up to the end of the day. So a deal shows from 00:00 UTC on its start day and until 23:59 UTC on its end day, even if its real hours are shorter.
- **L-3 — The recommended row appears only after the second boutique.** `components/Server/OfferListServer.tsx:23` draws it at index 1. A country with 0 or 1 boutiques never shows recommendations.
- **L-4 — The category bar is built from a sample of 4,000 products** (`serverRequests/cached/home.ts:58`). A category whose products are all outside that sample is missing from the bar. The tab order is not controlled: `position` is read but never used for sorting.
- **L-5 — An unknown category slug with a valid shape shows an almost empty page, not a 404.** This is on purpose, so a brand-new category works at once. Old `?mainCategory=` links are not redirected; they show the plain home page.
- **L-6 — One failed Elasticsearch read on any home section replaces the whole page content** with "Something went wrong" and a "Try again" button (`app/(client)/[lang]/error.tsx`). The client times out after 8 seconds (`services/elastic/elasticsearch.config.ts:20`). If Elasticsearch is down, the home page is down.
- **L-7 — Currency depends on Redis.** If the Redis read throws, `currencyFromBase` returns `{}` and does not try the backend (`serverRequests/currency.ts:68-75`). On the home page that empty answer is then cached for up to 60 seconds. In the browser, prices fall back to the currency kept in the store (`utils/functions.ts:147-172`). If `PRODUCT_REDIS_TTL_SECONDS` is not set, the Redis write fails (`EX NaN`) and every uncached read calls the backend.
- **L-8 — The recommendations "Show More" tile restarts from the beginning after an error.** On an error the reader answers `offset: []` (`services/elastic/elasticSearch.ts:925-931`), so the next tap asks for the first page again and the browser adds the same cards twice.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The Elasticsearch index names fall back to the staging names (`_develop`) when the `ELASTIC_*_INDEX` environment values are not set. They are not set anywhere yet. | Production would read the staging indexes until the values are set. | `services/elastic/INDEXES.ts`, `.env.example` (`ELASTIC_CATALOG_INDEX`, `ELASTIC_RECOMMENDATION_INDEX`, `ELASTIC_RECOMMENDATION_COLD_INDEX`, `ELASTIC_VIEWS_INDEX`) | Ops | **Yes** — production must read production data. |
| M-2 | The Elasticsearch client accepts any TLS certificate (`rejectUnauthorized: false`). | Nothing visible. A machine in the middle can read the index user name, password and data. | `services/elastic/elasticsearch.config.ts:15-17` | Frontend + Ops | **Yes** — security. |
| M-3 | `GetNextRecommendations` is a public Server Action. It takes `userId` and `limit` from the browser and trusts both. | Nothing visible. Anybody can read another shopper's recommendation list by sending that shopper's id, and can ask for any number of products in one call. | `serverRequests/home.tsx:14-34`, called from `components/Server/RecomendedProducts.tsx:22-28` | Frontend | **Yes** — privacy. Read the id from the `User-Data` cookie on the server and cap `limit`. |
| M-4 | `/api/revalidate` has no secret, allows any origin (`*`), and clears every cache on a plain GET. The tags it names (`featured-Products-Api`, `flash-deals-Products-Api`, …) are not the tags the home cache uses (`featured-{country}-{lang}-{slug}`, `categories-…`, `currency-…`). | Nothing visible. Anybody can force every cache to refill, again and again, which loads Elasticsearch. | `app/api/revalidate/route.ts:5-33` | Frontend | **Yes** — anybody can empty the cache. Add a secret; align the tags. |
| M-5 | If the starting-settings call fails, `getClientData` throws before it loads the customer info and the cart. | No message. The bag and the profile do not load for that visit. | `services/home.ts:55-66` | Frontend | No |
| M-6 | The name modal is mounted only inside the home view. `setChatOpen` sets `nameModal: true` on any page. | On a listing or product page, tapping chat with no name does nothing. The modal then pops up later, when the shopper next opens the home page. | `components/Home/index.tsx:68`, `store/chat/reducer.ts:385-396` | Frontend | No |
| M-7 | Saving a name calls market, then chat, then stories, one after the other. If chat or stories refuses, the screen goes back to the old name, but the market backend keeps the new one. | The shopper sees the old name and an error, but the market account already has the new name. | `services/auth.ts:399-445` | Frontend + Backend | No |
| M-8 | The category bar query has no QA-shop rule, and its product-level country rule checks the wrong field (`categories.status` inside path `countries_iso`). | A category used only by QA products, or only by products blocked in the country, can show as a tab that opens an empty page. | `services/elastic/elasticsearch-reader.service.ts:54-170` (field at `:123`) | Frontend | No |
| M-9 | The recommendations error toast says "Retrying in 3 seconds", but nothing retries. | A promise that does not happen. | `components/Server/RecomendedProducts.tsx:37-40` | Frontend | No |
| M-10 | The home view writes a readable (not HttpOnly) cookie `token` from the stories user's `access_token`. The server already strips tokens from that object, so today the cookie holds the text `undefined`. The unit test asserts this write. | Nothing visible. Dead code that would put a token in a readable cookie if a token ever reached the store. | `components/Home/index.tsx:57-62` | Frontend | No |
| M-11 | Two `aria-label` texts are not translated. | Screen-reader users hear "Scroll categories left/right" in English. | `components/Server/Navbar.tsx:95`, `:138` | Frontend | No |

## 🔒 Must do before launch
- [ ] Set the `ELASTIC_*_INDEX` values in the production environment and create the production indexes (M-1).
- [ ] Turn TLS certificate checking back on for Elasticsearch (M-2).
- [ ] Take the shopper id for "Show More" recommendations from the server-side cookie, and cap `limit` (M-3).
- [ ] Protect `/api/revalidate` with a secret, and make it clear the tags the home cache really uses (M-4).
- [ ] Set in production: `ELASTICSEARCH_NODE`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` (without the node the client quietly points at `http://localhost:9200`), `REDIS_URL`, `REDIS_USERNAME`, `REDIS_PASS`, `PRODUCT_REDIS_TTL_SECONDS`, and the gateway base URL (`GO_BACKEND_URL`, used for the home currency).
- [ ] Leave `QA_VIEW_SECRET` unset in production, or use a random value of 32+ characters that only QA holds.

## ❓ Needs confirmation from the backend team
- Is `/mobile/home/currency` on the gateway the right source for production prices? The home page always reads the gateway; listing pages read core or gateway by shopper. Is the rate always the same on both?
- Does the gateway still send `starting_setting`, or has it moved to the core spelling `starting-setting`? The app accepts both, so this is only to delete the fallback later.
- Who fills `recommended_system_*` and `cold_start_recommendations_*`, how often, and what are the production index names?
- Are flash-deal `start_date` / `end_date` stored in UTC? The row works in whole UTC days.
- Should the category bar follow the category `position` field?
- Is there one call that updates the name in market, chat and stories together? Today the app calls three services and cannot undo the first one.

## 🧪 Tests that cover this section
**Unit (Vitest):**
- Page and view: `tests/components/Home/CategoryHomeView.test.tsx`, `tests/app/categories/page.test.tsx`, `tests/app/categoryRoute.test.ts`, `tests/components/Home/index.test.tsx`
- Category bar: `tests/components/Server/MainCategories/index.test.tsx`, `tests/components/Server/Navbar.test.tsx`, `tests/components/Home/CategoryNavMobile.test.tsx`
- Rows: `tests/components/ServerWrapper/FeaturedProduct.test.tsx`, `tests/components/Server/FeatureProducts.test.tsx`, `tests/components/ServerWrapper/FlashDealsProduct.test.tsx`, `tests/components/Server/FlashDealsProducts.test.tsx`, `tests/components/ServerWrapper/RecommendedWrapper.test.tsx`
- Boutiques: `tests/components/ServerWrapper/BoutiquesListWrapper.test.tsx`, `tests/components/ServerWrapper/BoutiqueWrapper.test.tsx`, `tests/components/Server/OfferListServer.test.tsx`, `tests/components/global/InfinteScroll.test.tsx`, `tests/components/Home/OfferWidgets/BoutiqueElement.test.tsx`
- Data and cache: `tests/serverRequests/cached/home.test.ts`, `tests/serverRequests/cached/currency.test.ts`, `tests/serverRequests/currency.test.ts`, `tests/serverRequests/home.test.ts`, `tests/serverRequests/meta/home.test.ts`, `tests/cache/noRuntimeReadsInCachedTree.test.ts`, `tests/cache/homeRowsRenderOnTheServer.test.ts`, `tests/cache/serverCookieScope.test.ts`
- Elasticsearch: `tests/services/elastic/helpers.test.ts`, `tests/services/elastic/elasticsearchReader.test.ts`, `tests/services/elastic/elasticSearch.test.ts`
- Settings and name: `tests/utils/startingSettings.test.ts`, `tests/services/home.test.ts`, `tests/components/global/NameModal.test.tsx`

**Browser (Playwright, `tests/e2e/`):** GUEST-47 and GUEST-48 (`listings.live.spec.ts`); GUEST-49 skips when staging has no flash deal; "the home page renders and stays up", "a listing leads to a product page" and GUEST-42 (`guest.live.spec.ts`); QA-09a (home), QA-09b (featured) and QA-02b (`qaLock.live.spec.ts`).

**Expected-failure markers:** none in these files. GUEST-49 uses `test.skip` when the index answers 200 with no flash deal.

**Not covered by any test:**
- The product-level country rule in `buildBaseConditions` (no `countries_iso` case in `helpers.test.ts`).
- The privacy hole in M-3, the open cache route in M-4, and the skipped cart load in M-5.
- The recommended row when a country has fewer than 2 boutiques (L-3).
- The name modal on pages other than home (M-6), and the partial name save across three services (M-7).
- No browser test covers the boutique infinite scroll, the recommendations "Show More", the toasts or the name modal.
