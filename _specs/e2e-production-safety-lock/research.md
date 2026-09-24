---
ticket: e2e-production-safety-lock
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-19
links:
  clickup:
  github:
---

# Research — e2e-production-safety-lock

## In plain words

- **What this ticket touches:** the Elasticsearch catalogue queries that decide
  what a shopper can find, the four `BUY` cases that today buy a stranger's
  product, and a new setup step that creates our own seller, shop and product.
  It also adds a secret header ("QA mode") so the tests can see data that
  customers cannot.
- **The facts that matter most:**
  - The "only active products" rule is copied **six** times, not four
    (`services/elastic/helpers.ts:1332`,
    `services/elastic/elasticsearch-reader.service.ts:55` and `:634`,
    `services/elastic/sitemap.service.ts:712` and `:774`,
    `serverRequests/meta/home.ts:229`). A filter added to five of them does
    nothing for the sixth.
  - The copies have already **drifted**. **Five** of the six also demand an
    approved seller. The one that does not is the sitemap's product query
    (`services/elastic/sitemap.service.ts:708-726`), which has no `added_by`
    clause at all (`helpers.ts:1439-1457`,
    `elasticsearch-reader.service.ts:71-76`, `:683-688`,
    `sitemap.service.ts:780-785`, `meta/home.ts:244-245`).
  - The product page never runs a search. It reads by slug
    (`serverRequests/product.tsx:174`); the Elastic reads beside it are by id
    (`:379`) and by `product_id`
    (`utils/pagesDataRequests/ProductPageData.ts:107`). So hiding a product from
    search does not hide its page.
  - One helper causes the whole problem: `addFirstBuyableProduct()`
    (`tests/e2e/actions/cart.ts:389`), called by all four `BUY` cases
    (`tests/e2e/shopper.live.spec.ts:326`, `:548`, `:932`, `:1308`).
  - A cached function may not read a header or a cookie, and only the values it
    actually reads join its cache key (`serverRequests/cached/home.ts:20-29`).
- **What I could not check:**
  - The admin dashboard's approve screen. It is a separate product and nothing
    in this repository describes it (`OQ-1`).
  - Whether a seller may buy from their own shop (`OQ-2`).
  - What a boutique needs before it can be activated (`OQ-3`).
- **Easy to confuse:**
  - **Discovery vs direct lookup.** A search goes through a base query and is
    filtered; a page read by slug is not.
  - **`helpers.ts buildBaseConditions` vs `elasticsearch-reader buildBaseConditions`.**
    Same name, two different functions, different rules inside.
  - **Shopper A (`…307`) vs Shopper B (`…850`).** A already sells and will buy;
    B does not sell yet and will become the QA seller. `env.ts:151` says the
    opposite today.

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the browser suite create and use its own seller, shop and product, and make
that data invisible to real customers on every client — web and mobile.

## Relevant directories

- `services/elastic/` — every catalogue query lives here
- `serverRequests/` — server-side readers, including the cached home readers and
  a further copy of the base query under `meta/`
- `app/api/` — the route handlers the mobile app calls
- `tests/e2e/` — the browser suite, its actions, harness and specs
- `services/sellerDashboard/` — the seller-side calls the setup needs
- `components/SellerDashboard/productEdit/` — the product form builder and its
  validation

## Relevant config files

- `playwright.config.ts` — browser suite settings; `retries: 0` (`:48`),
  `workers: 1` (`:54`), per-case `timeout: 120_000` (`:60`),
  `globalTimeout: 100 * 60 * 1000` (`:77`)
- `vitest.config.mts` — unit suite; excludes `tests/e2e/**` (`:93`)
- `tests/e2e/harness/guard.ts` — the target allow-list (`:31`)
- `tests/e2e/harness/env.ts` — which settings unlock which cases (`:38`, `:151`)
- `.env.development` — the only env file the harness reads (`env.ts:19`)

## Possibly affected services

- **market** — seller onboarding, boutique, location, product, order. The setup
  writes to all of them.
- **the search index** — the QA shop must be indexed to be found, and filtered
  to be hidden.
- **stories** — the QA story link filter.
- **the admin dashboard** — a separate product the setup must drive to approve
  its own seller request.
- **the media store** — the product needs at least one image.

## Verified facts

| # | Fact (one sentence) | Evidence (`path:line`) | How checked |
|---|---------------------|------------------------|-------------|
| F-1 | The catalogue "only active products" rule exists in **six** separate places. | `services/elastic/helpers.ts:1332`; `services/elastic/elasticsearch-reader.service.ts:55`, `:634`; `services/elastic/sitemap.service.ts:712`, `:774`; `serverRequests/meta/home.ts:229` | ran search `term: { status: 1 }` across `services/elastic/`, `app/api/`, `serverRequests/` |
| F-2 | **Five** of those six also demand an approved seller. The exception is the sitemap's product query, which has no `added_by` clause at all. | present: `helpers.ts:1439-1457`; `elasticsearch-reader.service.ts:71-76`, `:683-688`; `sitemap.service.ts:780-785`; `serverRequests/meta/home.ts:244-245`. Absent: `sitemap.service.ts:708-726` | opened each block; ran search `added_by`. **Corrected in plan check round 1** — the first version had this backwards |
| F-3 | `seller_status` and `added_by` are fields the index returns. | `services/elastic/helpers.ts:32-33` | opened file |
| F-4 | `buildBaseConditions` in `helpers.ts` has **four call-site files**, not three. `services/elastic/elasticSearch.ts` is the listing / featured / flash-deal / related / recommended engine and calls it four times. | `serverRequests/Search.tsx:55`, `:210`, `:214`; `services/elastic/elasticSearch.ts:6`, `:294`, `:298`, `:809`, `:1077`; `services/elastic/helpers.ts:1316`, `:2360`; `services/elastic/elasticsearch-reader.service.ts:196`, `:1026` | ran search `buildBaseConditions` **without a `head` limit**. The first version of this row used a truncated search and missed `elasticSearch.ts` entirely — corrected in plan check round 1 |
| F-5 | The product page reads by id and by slug, never through a base query. | the solid evidence is `serverRequests/product.tsx:174` (market `globalDetails/{slug}`). The Elastic reads beside it are `:379` (`client.get` on `product_interactions_index`, ratings) and `utils/pagesDataRequests/ProductPageData.ts:107` (`term: { product_id }` on `share_index`, share count) — neither is the product read itself | opened all three; line corrected in plan check round 1 |
| F-6 | `boutique_id` is a top-level index field, and `custom_boutiques.slug.keyword` is queryable. | `services/elastic/helpers.ts:437`; queryability proved by an existing query at `services/elastic/helpers.ts:1389` and `services/elastic/elasticsearch-reader.service.ts:1035`. (`helpers.ts:73-76` is only a `_source` list, which proves the field is returned, not queryable) | opened file; evidence strengthened in plan check round 1 |
| F-7 | The mobile app reaches this app through its own route handlers. **At least 15 handlers set open CORS**, including catalogue paths; `app/api/home/boutiques/route.ts` sets none. | open CORS includes `app/api/mobile/product/details/[slug]/route.ts:9-28`; `app/api/products/recomended/route.tsx:6-11`; `app/api/products/searchInCatalog/route.ts:8`; `app/api/products/featured/route.ts:7`; `app/api/related-products/[id]/route.ts:8`; `app/api/seller/comments/_utils.ts:14`. No CORS header: `app/api/home/boutiques/route.ts` | ran search `Access-Control-Allow-Origin`; corrected twice — round 1 fixed the boutiques claim, round 2 found the count was far higher than two |
| F-8 | A cached function may not read a cookie, a header or the clock, and only values it reads join its cache key. | `serverRequests/cached/home.ts:20-29` | opened file |
| F-9 | There are six cached readers under `use cache`. | `serverRequests/cached/home.ts:53`, `:98`, `:125`, `:151`; `serverRequests/cached/currency.ts:33`; `serverRequests/meta/home.ts:147` | ran search `"use cache"` |
| F-10 | All four `BUY` cases buy an arbitrary real product through one helper. | `tests/e2e/actions/cart.ts:389`; called at `tests/e2e/shopper.live.spec.ts:326`, `:548`, `:932`, `:1308` | ran search `addFirstBuyableProduct` |
| F-11 | `BUY-02` runs as a guest, with no sign-in. | `tests/e2e/shopper.live.spec.ts:537-548` | opened file |
| F-12 | All four `BUY` cases run in country `sy`, because cash on delivery exists only there. | `tests/e2e/actions/nav.ts:220`; used at `tests/e2e/shopper.live.spec.ts:212`, `:239`, `:294`, `:651`, `:772` | opened both |
| F-13 | Guest cases only read; none adds to a bag. | ran search for `addOpenProductToBag|placeOrder|changeLineQuantity|removeLineNamed` in `tests/e2e/guest.live.spec.ts` → no hits | ran search |
| F-14 | Addresses created by a case are deleted by the same case. | `tests/e2e/shopper.live.spec.ts:682` (`/customer/address/delete`), created at `:843`, `:870` | ran search `address/delete` |
| F-15 | An order left behind is cancelled by a fixture teardown, not global teardown. | `tests/e2e/harness/orderCleanup.ts` (whole file); per-call ceiling `PROXY_CALL_MS = 15_000` | opened file |
| F-16 | A new product always starts hidden, and turning it on can be refused. | `services/sellerDashboard/index.ts:907`, `:920-923` | opened file |
| F-17 | The product activation checks are documented: approval, an `en` translation, stock, boutique, synced colour images. | `docs/mobile-seller-dashboard-api-guide.md:99-101` | opened file |
| F-18 | A product cannot be saved without a location, and stock must be above zero. | `components/SellerDashboard/productEdit/helpers.ts:898`, `:912-917` | opened file |
| F-19 | The seller-side calls the setup needs all exist. | `services/sellerDashboard/index.ts:908` (`addProduct`), `:924` (`changeProductStatus`), `:980` (`changeBoutiqueStatus`), `:1021` (`addBoutique`), `:1101` (`addShopLocation`) | opened file; two lines corrected in plan check round 1 |
| F-20 | A location cannot be deleted, and its name is unique per shop per country. | `services/sellerDashboard/index.ts:1052`, `:1099-1100` | opened file |
| F-21 | The app can submit and read a seller request, but this repository holds no admin approval call. | `components/settings/BecomeSellerModal.tsx:350`; `docs/market-api-inventory.md:138-139` | opened both; ran search `vendor-request` |
| F-22 | "Is this account a seller" is answered by an empty list or `204`. | `components/settings/GoToSellerDashBoard.tsx:48-75` | opened file |
| F-23 | A story carries a `link`, and a story can be deleted. | `services/story.ts:116-137`, `:157` | opened file |
| F-24 | `hasShopperB()` has **no direct caller**, but it does have an indirect one that reaches a real spec today. | declared `tests/e2e/harness/env.ts:156` (`:157` is its `allSet(...)` body); called by `hasTestAccountPhones()` at `:163`, which `tests/e2e/auth.scripted.spec.ts:25`, `:38` use | ran search `hasShopperB`, then followed `hasTestAccountPhones`. Corrected in round 1 (it does have a caller) and again in round 3 (the declaration line was off by one) |
| F-25 | The harness comment says Shopper A is the seller, which this ticket reverses. | `tests/e2e/harness/env.ts:151` | opened file |
| F-26 | The harness reads only `.env.development`; the other env files are invisible to it. | `tests/e2e/harness/env.ts:19` | opened file |
| F-27 | The target guard checks 12 configured addresses and currently passes. | `tests/e2e/harness/guard.ts:31-55`; `tests/e2e/harness/env.ts:38-67`; `pnpm e2e:preflight` printed "target check passed for 12 staging address(es)" | ran the command |
| F-28 | The browser suite never retries and runs one worker. | `playwright.config.ts:48`, `:54` | opened file |
| F-29 | The unit suite excludes the browser specs and sets its own fake env. | `vitest.config.mts:93`, `:57-74` | opened file; line corrected in plan check round 1 |
| F-30 | **CI runs the suite as two lanes, as two jobs at the same time**, each with its own `globalSetup`. So `workers: 1` (F-28) describes one process, not the run. | `.github/workflows/e2e-lane.yml:22`, `:82`; `.github/workflows/test-e2e.yml:121-129`; `tests/e2e/cli.ts:512` (`LANE_WORKERS = { account: 1, solo: 2 }`) | opened all three, in plan check round 1 |
| F-31 | **A spec file in neither lane list makes the run refuse**, by a guard that names the file. | `tests/e2e/cli.ts:463-469`, lists at `:474` and `:488`, guard in `laneSpecs` `:518-545` | opened file, in plan check round 1 |
| F-32 | **`services/story.ts` is a client module.** Its feed read runs in the browser, through `/api/proxy`. | `services/story.ts:1` (`"use client"`), `getStories` at `:19`, product stories at `:296`, `upload` at `:116` | opened file, in plan check round 1 |
| F-33 | **Corrected.** Sentry is set to send personal data (`sentry.server.config.ts:24`, `sendDefaultPii: true`), and it attaches request headers through `onRequestError` (`instrumentation.ts:13`, `Sentry.captureRequestError`). **But the six handlers that pass `headers: request.headers` to `LogServerError` do NOT reach Sentry with them:** `utils/errorReported.tsx:77-99` copies an allow-list of extras with no `headers` key, and `utils/errorSerialization.ts:82` walks `Object.keys()`, so a `Headers` instance flattens to `{}`. Those six forwards leak nothing today. | `sentry.server.config.ts:24`; `instrumentation.ts:13` (the file is 13 lines — there is no `:24`); `utils/errorReported.tsx:77-99`; `utils/errorSerialization.ts:82`; `app/api/home/boutiques/route.ts:91-97` | opened all five. The first version conflated the two paths; corrected in the review-stage check |
| F-37 | **The stories feed has four LIVE readers plus two dead ones — and only two of the four carry a group filter.** | Live: `services/story.ts:19` (`getStories`, client — **no filter**, `:34` goes straight to `setStoryData` at `:36`/`:38`); `components/Home/Stories/StoriesBarClient.tsx:51` (**filter at `:69-70`**); `components/Home/Stories/StoriesPaginationWrapper.tsx:47` (**no filter**, two sinks at `:58` and `:59`); `serverRequests/stories.ts:51` `fetchStoriesForUser` (**filter at `:73`**). Dead: `serverRequests/stories.ts:90` `fetchStoriesForGuest` and `services/story.ts:296` `getStoriesForProducts` — searched repo-wide, no caller outside docs. Callers of the live server reader: `components/Chat/pages/StoriesList.tsx:31`, `components/Home/Stories/AddStoryWidget.tsx:263`, `:311`, `components/Login/Enhanced/FullEnhancedLoginWidget.tsx:232` | ran search `users_stories`, then opened each reader. **Corrected in plan check round 6:** the first version claimed every reader already ended with the same filter, which is false for two of the four and would have made the shared helper *insert* a new rule where the plan said it *replaced* one |
| F-38 | `services/auth.ts:377` is inside `UpdateName` (declared `:329`), **not** a sign-in path. | `services/auth.ts:329`, `:377`; sign-in reads the feed via `fetchStoriesForUser` at `components/Login/Enhanced/FullEnhancedLoginWidget.tsx:232` | corrected in the review-stage check |
| F-34 | The sitemap's two query builders are **not exported**, so no unit test can import them directly. | `services/elastic/sitemap.service.ts:708` (`function buildProductBaseQuery()`), `:772` (`function buildSitemapBaseConditions()`); the exported wrappers are `getProductsForSitemap` `:212` and `generateProductSitemapUrls` `:266` | opened file, in plan check round 1 |
| F-35 | The products sitemap route is cached for an hour and may serve a stale copy for a day. | `app/sitemap-products.xml/route.ts:39-41` (`s-maxage=3600, stale-while-revalidate=86400`) | opened file, in plan check round 1 |
| F-36 | `tests/services/elastic/helpers.test.ts` already has a `buildBaseConditions` case, and `tests/services/story.test.ts` exists. | `tests/services/elastic/helpers.test.ts:1076-1078`; `tests/services/story.test.ts`; `tests/services/elastic/elasticSearch.test.ts:583`, `:763` cover `GetRecomendationsForUser` | opened file / listed directory, in plan check round 1 |

## Shared things (found by search)

| Search term | Hits (`path:line`) | Who uses it / what it does there |
|-------------|--------------------|----------------------------------|
| `term: { status: 1 }` | `services/elastic/helpers.ts:1332`; `services/elastic/elasticsearch-reader.service.ts:55`, `:634`; `services/elastic/sitemap.service.ts:712`, `:774`; `serverRequests/meta/home.ts:229` | the six copies of the catalogue base query (F-1). **Every one needs the new filter.** |
| `buildBaseConditions` | `services/elastic/helpers.ts:1316`, `:2360`; `serverRequests/Search.tsx:7`, `:55`, `:210`, `:214`; **`services/elastic/elasticSearch.ts:6`, `:294`, `:298`, `:809`, `:1077`**; `services/elastic/elasticsearch-reader.service.ts:196`, `:630`, `:1026` | two different functions with the same name — one in `helpers.ts`, one a method on the reader. **`elasticSearch.ts` was missing from the first version of this row** (truncated search); it is the listing / featured / flash-deal / related / recommended engine, reached from `serverRequests/listing/index.tsx:15`, `:81`, `:143`, `:203`; `serverRequests/home.tsx:143`, `:170`; `app/(client)/[lang]/featured/.../page.tsx:107`; `app/(client)/[lang]/flashDeals/.../page.tsx:113`; `app/api/products/searchInCatalog/route.ts:99`; `app/api/products/featured/route.ts:71`; `app/api/related-products/[id]/route.ts:76` |
| `getRules` | `serverRequests/meta/home.ts:157`, `:227`; `services/elastic/elasticsearch-reader.service.ts:13`, `:53`; `tests/next-config.test.ts:21` (unrelated local helper) | two more private copies of the base query |
| `added_by` | `services/elastic/helpers.ts:33`, **`:1444`, `:1448`**; `services/elastic/elasticsearch-reader.service.ts:71`, `:75`, `:683`, `:687`; `services/elastic/sitemap.service.ts:780`, `:784`; `serverRequests/meta/home.ts:245`; **`serverRequests/Search.tsx:227`** | the seller-approval rule, present in **five** of the six — including `helpers.ts`, which the first version of this row wrongly called absent |
| `seller_status` | `services/elastic/helpers.ts:32`, **`:443`, `:1449`**; `services/elastic/elasticsearch-reader.service.ts:76`, `:688`; `services/elastic/sitemap.service.ts:785`; `services/elastic/elasticSearch.ts:525`, `:1164`; **`serverRequests/Search.tsx:226`** | the QA seller must reach `approved` or its products never appear in five of the six paths |
| `addFirstBuyableProduct` | `tests/e2e/actions/cart.ts:389`; `tests/e2e/shopper.live.spec.ts:117`, `:326`, `:548`, `:932`, `:1231` (comment), `:1308` | the helper this ticket replaces, and its four call sites |
| `hasShopperA` | `tests/e2e/harness/env.ts:152`, `:163`; `tests/e2e/cli.ts:27`, `:116`; `tests/e2e/profile.live.spec.ts:138`, `:229`; `tests/e2e/profile.scripted.spec.ts:84`, `:205`; **`tests/e2e/shopper.live.spec.ts:148`, `:261`; `tests/e2e/wishlist-signed-in.live.spec.ts:50`, `:76`; `tests/e2e/session-recovery.live.spec.ts:75`, `:113`** | 14 hits, not 8. `shopper.live.spec.ts` is a file this ticket changes, so its two hits matter |
| `hasShopperB` | `tests/e2e/harness/env.ts:157`, `:163` → `hasTestAccountPhones()` → `tests/e2e/auth.scripted.spec.ts:25`, `:38` | **it has an indirect caller today.** The first version of this row said "no caller", which is wrong — the no-dead-code rule does not apply |
| `ALLOWED_HOSTS` | `tests/e2e/harness/guard.ts:31`, `:80`, `:131` | the target allow-list; a production list must be separate from it |
| `BACKEND_ADDRESS_KEYS` | `tests/e2e/harness/env.ts:38`; `tests/e2e/harness/guard.ts:20`, `:92` | the 12 addresses the guard checks (lines corrected in round 2) |
| `TEST_ACCOUNT_PHONE` | `tests/e2e/harness/env.ts:153`; `tests/e2e/actions/auth.ts:53`, `:378`, `:404`, `:408`; `tests/e2e/auth.live.spec.ts:114`; `tests/e2e/auth.scripted.spec.ts:27`; `tests/e2e/profile.live.spec.ts:249`, `:1163`; `tests/e2e/profile.scripted.spec.ts:106`; `tests/e2e/session-recovery.live.spec.ts:137`; `tests/e2e/shopper.live.spec.ts:298`, `:776`; `tests/e2e/harness/redact.ts:21` | Shopper A. `env.ts:152`/`:163` are `hasShopperA`, not this key — corrected in round 2 |
| `TEST_ACCOUNT_PHONE_2` | `tests/e2e/harness/env.ts:157`; `tests/e2e/auth.scripted.spec.ts:28`, `:39`; `tests/e2e/profile.scripted.spec.ts:110`, `:157`, `:158`, `:463`, `:464`, `:483`; `tests/e2e/harness/redact.ts:22` | Shopper B. `env.ts:156` declares `hasShopperB`; `:157` is this key — the two were swapped before round 2 |
| `"use cache"` | `serverRequests/cached/home.ts:53`, `:98`, `:125`, `:151`; `serverRequests/cached/currency.ts:33`; `serverRequests/meta/home.ts:147` | the six cached readers. None may read the QA header |
| `vendor-request` | `components/settings/BecomeSellerModal.tsx:77`, `:350`, `:655`; `docs/market-api-inventory.md:138-139` | shopper side only — no admin approval call anywhere |

## Test harness facts

**Runner 1 — Vitest (unit)**

- **Runner and config:** `vitest`, `vitest.config.mts`; project name `unit` (`:82`)
- **Environment:** `jsdom` (`vitest.config.mts:84`)
- **Setup files and global mocks:** `./tests/setup.ts` (`vitest.config.mts:88`). It mocks `next/navigation` (`tests/setup.ts:33`), `serverActions/sendOtp` (`:42`) and `serverRequests/radis` (`:50`), and starts an MSW server (`:23`, `:85`)
- **Env block / base URLs:** a fake block written in the config, not read from `.env` (`vitest.config.mts:57-74`) — media and chat are `https://example.com`, analytics keys are empty on purpose
- **Polyfills present / missing:** `window.matchMedia` is supplied because jsdom lacks it (`tests/setup.ts:70-81`). No `IntersectionObserver` or `ResizeObserver` polyfill was found
- **Timers:** real by default; no global `useFakeTimers` in `tests/setup.ts`
- **Module reset:** no global `vi.resetModules()` in `tests/setup.ts`
- **Default timeouts:** `testTimeout: 15000` (`vitest.config.mts:95`)
- **Strict expected-failure marker: none exists.** Searched `it.fails` /
  `test.fails` / `.fails(` across `tests/` — no hit. The convention for a known
  bug is an ordinary `it(` with a message saying what should happen:
  `tests/components/setting/checklist/ChecklistView.loadMore.test.tsx:149-150`
  ("BUG-1. Red before the fix, green after it.") and
  `tests/serverRequests/product.test.ts:344`, `:360`, `:364` ("BUG-2 appears
  fixed: …"). **The `mw` rules assume a strict marker; this repository has a
  different convention.**

  > **This row changed twice, and not because anyone was careless.** Research
  > found no marker. Plan check round 2 found `it.fails` and I verified it by
  > reading the file. Plan check round 3 found no marker again — and it is
  > right. **The repository moved underneath the work item:** commit
  > `86b60029` ("test(e2e): cover saved products and compare, and fix the dead
  > Load more") landed mid-check and rewrote that file. A fact can be verified
  > correctly in one round and be false in the next. See the round-3 note in
  > `plan.md > Plan check`.
- **Test layout and naming:** `tests/<area>/<name>.test.ts(x)`, mirroring the source tree. `vitest.config.mts:89-92` keeps the default pattern and its comment names a colocated leftover at `utils/functions.test.tsx` — **that file does not exist**; the comment is stale. Searched `**/functions.test.tsx` and the source tree for colocated tests: no hits.
- **Exclusion:** `exclude: [...configDefaults.exclude, 'tests/e2e/**']` (`vitest.config.mts:93`). So no file under `tests/e2e/` can be run by the unit project.

**Runner 2 — Playwright (browser)**

- **Runner and config:** `playwright.config.ts`; `testDir: ./tests/e2e` (`:36`)
- **Environment:** a real `next build` + `next start` on `127.0.0.1:3100`, started by the harness (`tests/e2e/harness/env.ts:26-28`)
- **Setup files:** `globalSetup: ./tests/e2e/globalSetup.ts` (`:41`), `globalTeardown` (`:42`)
- **Env block / base URLs:** `baseURL: LIVE_ORIGIN` (`:92`); the real untracked `.env.development` supplies backends (`tests/e2e/harness/env.ts:19`)
- **Lanes — and `workers: 1` is not the whole story.** CI runs the suite as **two lanes, as two jobs at the same time** (`.github/workflows/e2e-lane.yml:22`), each with its own `globalSetup`. The lane lists live in `tests/e2e/cli.ts` (`ACCOUNT_LANE` `:474`, `SOLO_LANE` `:488`), a lane's worker count is `LANE_WORKERS = { account: 1, solo: 2 }` (`:512`), and **a spec in neither list makes the run refuse** (`:463-469`, `laneSpecs` `:518`). The job cap is per lane (`e2e-lane.yml:82`). Added in plan check round 1
- **Timers:** real. No fake timers are possible against a real browser
- **Default timeouts:** per case `120_000` (`:60`), `expect` `15_000` (`:61`), action `20_000` (`:107`), navigation `45_000` (`:108`), whole run `globalTimeout: 100 * 60 * 1000` = 100 min (`:77`)
- **Retries:** `0` (`:48`), deliberately — a retried write is a duplicated write
- **Workers:** `1`, `fullyParallel: false` (`:54-55`)
- **Locators:** `testIdAttribute: "data-pw"` (`:106`); never match on visible text
- **Projects:** `live` (`:113`, `trace: "off"`) and `scripted` (`:130`, `trace: "retain-on-failure"`)
- **Test layout and naming:** `tests/e2e/<area>.live.spec.ts` and `.scripted.spec.ts`; actions in `tests/e2e/actions/`, locators in `tests/e2e/selectors.ts`, harness in `tests/e2e/harness/`

## Test / validation commands available

- `pnpm test:run` — the unit suite; gates pull requests
- `pnpm test:e2e` — preflight, build, then every browser spec
- `pnpm test:e2e:live` — only the real-staging specs
- `pnpm e2e:preflight` — "is this configured, and is it staging?" — builds nothing
- `pnpm e2e:health` — is staging answering
- `pnpm lint` — ESLint, including the i18n key rule
- `pnpm lint:i18n-parity` — `ar` / `tr` / `ku` keys in step
- `pnpm knip` — unused files, exports and dependencies

## Known traps

| Trap | Source | What the plan must do |
|------|--------|-----------------------|
| The base query is copied six times and has drifted (F-1, F-2) | this research | List **all six** in `Files to change`. A filter in five of them is a silent hole. Say what happens to the seller-approval difference |
| Protected runtime paths | `CLAUDE.md` → Project profile | `proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`, `.github/workflows/**` may only change if `plan.md` names them. The QA header does **not** need `proxy.ts`; its matcher excludes `/api` anyway |
| Every user-visible string is translated | `CLAUDE.md` → Internationalization | The QA shop and product names are **data**, not UI copy, so no keys are needed. If any new UI string appears, add it to all three files first |
| Never name the backing technology | `CLAUDE.md` → Stack-agnostic naming | The new header and env keys must not contain `go`, `next`, `laravel`. `x-qa-view`, `QA_VIEW_SECRET`, `QA_STORY_LINK_HOST` are acceptable |
| A failure must name the step and the backend | `CLAUDE.md` → Testing | Every new assertion carries a message; a missing QA product says which of missing / inactive / out of stock |
| Never test code with no caller | memory rule | **Does not apply to `hasShopperB()`** — F-24 was corrected in plan check round 1: it is reached from `auth.scripted.spec.ts:38` through `hasTestAccountPhones()` (`env.ts:163`). Check any *new* helper this ticket adds instead |
| Case budgets against `globalTimeout` | `_specs/checkout-address-totals-and-cart-lines/review.md:120` (P-1), `:131` (N-6/P-5) | Add up the new cases against `playwright.config.ts:77` (100 min) and write the arithmetic down. A case that hits the cap is silently absent, not red |
| `test.afterEach` is file-scoped, and `shopper.live.spec.ts` mixes top-level cases with describes | `_specs/checkout-address-totals-and-cart-lines/review.md:124` (S-1/N-2a); `tests/e2e/shopper.live.spec.ts:266`, `:537` top-level vs `:594`, `:1235` describes | Any new teardown must be scoped, or it fires after cases it does not own |
| Playwright's own errors print element content into a world-readable log | `_specs/checkout-address-totals-and-cart-lines/review.md:127` (S-4); `tests/e2e/harness/redact.ts` | The QA product name will appear in CI logs. It is not a credential, so this is acceptable — but say so, and do not put anything else in the name |
| A saved session may be superseded when a case fails | `_specs/checkout-address-totals-and-cart-lines/review.md:128` (S-5); `tests/e2e/harness/liveSession.ts` | The setup's session must not be taken from a file another case may have overwritten |
| A probe name collision between specs on the same account | `_specs/checkout-address-totals-and-cart-lines/review.md:126` (S-3/N-3) | The QA shop, location and product names must be unique and must not collide with `Trydos E2E Buy Probe` or `PROF-07`'s address title |
| `custom_data.similar_words` returns 500 on create only | memory; `docs/api-requirements/shop-product-create-backend-followups.md` | The setup's product body must avoid that field on create |
| The create body key differs from update | `services/sellerDashboard/index.ts:1016-1018` | On boutique create the key is `boutique_custom_data`, not `custom_data`; the wrong one drops every translation silently |

## Risks and unknowns

- **The admin dashboard is unknown ground.** The setup must drive a product
  nobody here has read, using a super-admin credential, and any change to that
  UI breaks the setup. Highest risk in the ticket. Likelihood: certain that work
  is needed; impact: could be days.
- **The setup writes a lot on first run.** Seller request, boutique, location,
  product, images, two status changes. A partial first run leaves a half-made
  shop that the next run must recognise and finish, not duplicate.
- **A location can never be deleted** (F-20). Anything the setup creates there is
  permanent.
- **Six filter sites, one missed = a silent leak.** This is why the lock checks
  matter more than the filter itself.
- **Suite duration.** New setup work plus new cases run inside a 100-minute
  budget that a previous ticket already found tight (`review.md:120`).
- **The QA shop is visible on staging until the filter lands.** Between the setup
  landing and the filter landing, a real staging browser could find it. Ordering
  inside the ticket matters.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | What is the admin dashboard's approve screen — its URL, its sign-in flow, and the controls that approve a vendor request? | The setup cannot approve its own seller without it, and no API exists (F-21). Largest unknown in the ticket |
| OQ-2 | May a seller buy from their own shop? | The plan has B sell and A buy either way. If buying from yourself is refused, that split is required, and a `BUY` failure must not be mistaken for it |
| OQ-3 | What does a boutique need before `changeBoutiqueStatus(.., 1)` succeeds? | The owner says an active product is one requirement. The rest are undocumented (`services/sellerDashboard/index.ts:979`) |
| OQ-4 | Does the backend add a uniqueness suffix to a boutique or product slug? | The mark is a slug prefix. A suffix does not break a prefix match, but the search case needs the exact name |
| OQ-5 | Must the QA seller reach `seller_status: approved` for its products to appear at all? | **Five** of the six base queries demand it (F-2, corrected in round 1). The exception is the sitemap's product query. So admin approval is load-bearing for the lock check, and the sitemap needs the filter regardless of approval |
| OQ-6 | Does cancelling an order restore its stock? | Decided already to set stock very high, so this only changes whether that was needed |
| OQ-7 | Where is the QA header read, and does reading it make any page dynamic that is static today? | The cached readers must not read it (F-8). The plan must name the exact read site |
| OQ-8 | Is `hasShopperB()` given a caller by this ticket, or removed? | It has none today (F-24), and the project rule forbids leaving code with no caller |
| OQ-9 | How much of the 100-minute `globalTimeout` do the new cases and the setup consume? | A previous ticket's panel raised exactly this and it was a `major` (`review.md:120`) |
| OQ-10 | What exact names do the QA shop, location and product get? | They must not collide with existing probe names (`review.md:126`) and they appear in public CI logs |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- `pnpm e2e:preflight` was run (read-only; it builds nothing) to confirm F-27.
