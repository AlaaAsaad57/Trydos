---
ticket: homepage-cache-components
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-08-31
links:
  clickup:
  github:
---

# Research — homepage-cache-components

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Turn on Next 16.3 Cache Components, cache the homepage shell and its product
sections for one minute, and move the visitor-specific parts (stories, luck
badges, recommendations) out of the shared cached output.

**Note on question ids.** `intake.md` resolved a first set labelled `OQ-A` …
`OQ-G`. Those stay resolved. This stage opens a new, numbered set, `OQ-1` … `OQ-9`
below. The two sets do not overlap.

## Relevant directories

- `app/(client)/[lang]/` — the homepage (`page.tsx`) and the root layout
  (`layout.tsx`, which renders `<html>`; there is **no** `app/layout.tsx`).
  The new category route `categories/[slug]/` lands here.
- `app/(special)/` — 4 files carry `runtime = "nodejs"` (Agora call screens).
  In scope only because the flag rejects that export.
- `app/api/` — 6 route handlers carry a rejected config; `app/api/proxy/route.ts`
  is the stories path; `app/api/products/recomended/route.tsx` gains the cookie
  fallback (D-10).
- `app/ingest/[...path]/` — the PostHog reverse proxy, the only
  `runtime = "edge"` in the repo.
- `app/sitemap*.xml/` — 6 route handlers using `revalidate`.
- `components/ServerWrapper/` — `FeaturedProduct.tsx`, `FlashDealsProduct.tsx`,
  `BoutiquesListWrapper.tsx`: the three homepage data wrappers, and the three
  places a cookie is read on the product path.
- `components/Server/` — `StoriesBarServer.tsx` (becomes client),
  `MainCategories/index.tsx` (category navbar + slug source).
- `components/products/ProductCard/` — already `"use client"`; consumes
  `is_luck` for CSS classes at lines 135, 250, 289, 334.
- `components/Home/` — `AuthNavContainer.tsx` (streams), `CategoryNavMobile.tsx`
  (the single category link builder), `Search/SearchIcon.tsx`, `Stories/`.
- `serverRequests/` — `home.tsx`, `currency.ts`, `stories.ts`, `meta/`.
- `hooks/`, `store/luck/`, `utils/luck.ts` — the luck timer and its cookie.
- `tests/` — the unit suite; `tests/e2e/` is the browser suite (not used here).

## Relevant config files

- `next.config.ts` — **protected runtime path.** Takes `cacheComponents: true`
  and the named `homepage` cache profile (D-4). Already holds
  `experimental.staleTimes` (left alone, D-16) and the global
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` header, which
  is unrelated to Cache Components and is not what this ticket relies on.
- `proxy.ts` — **protected runtime path.** Read only, for OQ-6. Holds the
  hardcoded locale list this ticket mirrors: `SUPPORTED_LANGUAGES = ["en","ar","tr","ku"]`
  (line 34) and `getCachedCountries() = ["sy","lb","tr","iq"]` (line 90) plus
  `"gb"` (line 94) — the 20 values `generateStaticParams` needs (D-17).
- `vitest.config.mts` — one project, `unit`, jsdom, `tests/setup.ts`, excludes
  `tests/e2e/**`. Coverage `include` already lists `app/**`, `components/**`,
  `serverRequests/**`, `utils/**` and `proxy.ts`.
- `playwright.config.ts` — browser suite. Out of scope (D-12).
- `.github/workflows/tests.yml` — the PR gate.
- `public/translations/translations.{ar,tr,ku}.js` — checked: no new keys needed
  (see R-12 in `intake.md`).

## Possibly affected services

- **Elasticsearch** — the homepage's only data source for products, flash deals,
  boutiques and categories. The build starts depending on it (R-11).
  `services/elastic/elasticSearch.ts:731-741` and
  `services/elastic/elasticsearch-reader.service.ts:48` both rethrow on failure.
- **Gateway backend** (`GO_BACKEND_URL`) — becomes the only currency source
  (D-11). Verified identical to the core backend for sy / tr / iq / lb.
- **Core backend** (`BACKEND_URL`) — loses the verified-user currency call.
- **Stories backend** — same endpoint, called from the browser through
  `/api/proxy` instead of from the server.
- **PostHog** — its ingest proxy must move off the edge runtime (OQ-4).
- **Redis** — `serverRequests/radis` still backs currency and homepage metadata.
- **Sentry** — `LogServerError` is called from the wrappers that will run at
  build time; build-time failures will now report there too.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — unit suite (`vitest run --project unit`).
- `pnpm test:ci` — what CI runs: unit + coverage + JSON report.
- `pnpm test:coverage` — unit + coverage.
- `pnpm lint` — ESLint, including the local `eslint-rules/translate-key-exists.js`.
- `pnpm lint:i18n-parity` — `scripts/i18n-parity.mjs`; exit 1 on key drift.
- `pnpm exec next typegen` — **required before type checking**; it also generates
  the `cacheLife` profile type from `next.config.ts`, so a custom `homepage`
  profile only type-checks after this step. CI already runs it first
  (`tests.yml` lines 102-110).
- `pnpm exec tsc --noEmit` — type check.
- `pnpm build` / `npx next build --debug-build-paths="<path>"` — the second
  compiles only matching routes. **Caution: it does not prerender them** — proven
  during intake, see R-16 / OQ-1.
- `pnpm knip` — unused files/exports.
- Browser suite (`pnpm test:e2e:live`, `pnpm e2e:health`) — out of scope (D-12).

**CI gate order** (`.github/workflows/tests.yml`): i18n parity → lint →
`next typegen` → `tsc --noEmit` → `pnpm test:ci`. The browser suite has its own
workflow and does not gate.

## Test layout and naming convention

- **Location.** `tests/` mirrors the source path. `utils/luck.ts` →
  `tests/utils/luck.test.ts`; `app/api/proxy/route.ts` →
  `tests/app/api/proxy/route.test.ts`. One colocated leftover exists
  (`utils/functions.test.tsx`) and is deliberately still matched by the default
  pattern; new files follow the `tests/` mirror.
- **Naming.** `<sourceFileName>.test.ts` / `.test.tsx`. 111 test files today.
- **Runner.** Vitest, project `unit`, `environment: jsdom`, `globals: true`,
  `setupFiles: ['./tests/setup.ts']`, `testTimeout: 15000`. Env values are fake
  and declared in `vitest.config.mts`, not read from `.env`.
- **Expected-failure marker.** Vitest's is `test.fails()` / `it.fails()`.
  **No file in the repository uses it yet**, so a `BUG-n` guard would be the
  first. `plan.md` must name the marker explicitly if it declares one.
- **Existing coverage for the units this ticket touches** (for `PL-14`):

  | Unit | Existing test | Note |
  |---|---|---|
  | `hooks/useLuckTimer.ts` | `tests/hooks/useLuckTimer.test.ts` | 4 cases; covers the hook, not the cookie gate |
  | `components/products/ProductCard/index.tsx` | `tests/components/products/ProductCard/index.test.tsx` | **mocks** `useLuckTimer` (line 47), so the luck rendering path is uncovered |
  | `app/api/proxy/route.ts` | `tests/app/api/proxy/route.test.ts` | exists |
  | `utils/fetchData.ts` | `tests/utils/fetchData.test.ts` | exists |
  | `utils/luck.ts` | **none** | holds `isRedeemed` / `getRedeemedIds`, the gate the inline script replaces |
  | `utils/cookies/getRedeemedIds.ts` | **none** | |
  | `utils/listing/normalizeListingProduct.ts` | **none** | where the server currently gates `is_luck` |
  | `serverRequests/home.tsx` | **none** | |
  | `serverRequests/currency.ts` | **none** | |
  | `serverRequests/stories.ts` | **none** | |
  | `serverRequests/meta/home.ts`, `meta/buildAlternates.ts` | **none** | |
  | `components/Server/StoriesBarServer.tsx` | **none** | |
  | `components/Home/CategoryNavMobile.tsx` | **none** | the single category link builder |
  | `components/Home/Search/SearchIcon.tsx` | **none** | |
  | `app/api/products/recomended/route.tsx` | **none** | gains the cookie fallback |
  | `utils/serviceTokens.ts` | **none** | |

## Risks and unknowns

`intake.md` carries the full list, `R-1` … `R-16`, with the evidence for each.
This stage adds four findings and does not restate the rest.

- **F-1 — the config rejection is proven and complete.** A local build with the
  flag on failed with `Turbopack build failed with 36 errors`, one per route
  segment config: `runtime` 14, `dynamic` 12, `revalidate` 7, `dynamicParams` 3,
  across 26 files. **`runtime` is not exempt** — all 14 go, including the 13
  `runtime = "nodejs"`. The build stops at compile-time validation, so no
  prerender runs and no other error can surface until every one is deleted. This
  fixes the order of work.
- **F-2 — the cookie restriction follows the call stack, and the build will not
  catch it.** `use-cache.md:196`: a helper a cached function calls that reads
  `cookies()`/`headers()` fails with `next-request-in-use-cache`, and "on a
  dynamically rendered route this surfaces when the route runs, so **it can pass
  `next build` and fail under `next start`**". Two homepage call stacks do
  exactly this today: `getCurrency` → `getMarketFetchBase()` →
  `isVerifiedMarketUser()` → `cookies()` (`utils/server/tokenManager.ts:144`),
  and the product wrappers → `getRedeemedIds()` → `getCookieServer`. D-11 and
  D-8 already remove both, but the plan must treat them as **correctness**
  requirements, not tidy-ups, because a green build does not prove them.
- **F-3 — `use cache` is durable here, so `use cache: remote` is not needed.**
  `08-caching.md:587` splits the stores: prerendered output is written to disk or
  platform storage, while a request-gated `use cache` entry stays in per-instance
  memory and is ephemeral on serverless. Because D-13 and D-17 put the homepage
  and the category route on the **prerendered** path, their cached output is the
  durable kind. Plain `use cache` is correct; adding `remote` would be
  unnecessary cost.
- **F-4 — `React.cache` does not cross a `use cache` boundary.**
  `use-cache.md:244-270`: values stored by `React.cache` outside a cached scope
  are invisible inside it. `utils/cookies/getRedeemedIds.ts` is built on
  `cache()` from React. It leaves the cached path under D-8, but any future
  attempt to share request-scoped state into a cached component will silently
  read `null`.
- **F-5 — three data modules are `"use server"`, and the cacheable readers can be
  separated cleanly.** `serverRequests/home.tsx`, `currency.ts` and `stories.ts`
  all start with `"use server"`, so every export is a Server Action. Whether one
  function may carry both directives is `OQ-2`. It may not need answering,
  because the callers split cleanly:

  | Function | Called from | Can move to a plain cached module? |
  |---|---|---|
  | `GetFeaturedProducts` | `ServerWrapper/FeaturedProduct.tsx` (server) | yes |
  | `GetFlashDealProducts` | `ServerWrapper/FlashDealsProduct.tsx` (server) | yes |
  | `GetHomeBoutiques` | `ServerWrapper/BoutiquesListWrapper.tsx` (server) | yes |
  | `GetMainCategories` | `Server/MainCategories/index.tsx` (server) | yes |
  | `GetRecommedndedProducts` | `BoutiquesListWrapper.tsx` (server) | moot — D-10 moves it to the client |
  | `GetNextRecommendations` | `Server/RecomendedProducts.tsx` (**client**) | no — must stay an action |
  | `GetNextBoutiques` | `global/InfinteScroll.tsx` (**client**) | no — must stay an action |

- **F-6 — `translateFunction` is safe inside `use cache`.**
  `utils/server/index.tsx:17` is a pure synchronous lookup over statically
  bundled tables, with no `cookies()` or `headers()` anywhere in its call stack.
  Every homepage server component calls it, so this removes a blocker that would
  otherwise have stopped the product sections being cached.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does `error.tsx` catch a Server Component throw during a **build** prerender, so the build finishes instead of failing? | D-20 is the whole answer to R-11's page-render half. The intake experiment could not answer it: `--debug-build-paths` compiles a route without prerendering it, proven by a third control that never threw and still produced no HTML. It can only be settled by a full build, which needs F-1's 36 deletions first. If the answer is no, the plan needs a different fallback — most likely catching in the three wrappers so nothing throws at build. |
| OQ-2 | May a function inside a `"use server"` module also carry `"use cache"`, or must the cacheable readers move to a plain module? | Decides whether `serverRequests/home.tsx` and `currency.ts` are edited in place or split. F-5 shows the split is clean either way, so this changes the shape of the diff, not its feasibility. |
| OQ-3 | After the 36 configs are deleted, which synchronous-IO and `generateStaticParams` errors actually appear? | R-2 and R-11 were never reached by the intake build (F-1). The two known sync-IO calls are on the product page (`ProductExpectedDeleiveryWrapper.tsx:29`, `ProductPhotoSliderWrapper.tsx:46`); there may be more that only a prerender finds. This sizes the real work. |
| OQ-4 | Does `app/ingest/[...path]/route.ts` still work once `runtime = "edge"` is removed? | It is the PostHog reverse proxy for analytics and session replay. Cache Components rejects the edge runtime outright (`migrating-to-cache-components.md:881`). The route strips the `Cookie` header and forwards; nothing obviously needs the edge, but it is on a live telemetry path. |
| OQ-5 | Does a middleware `Set-Cookie` stop Next reusing the prerendered payload? | `proxy.ts` writes `country`/`lang`/`language` (lines 202-204), `userIP` (398) and `referer` (430, 439) on every navigation. `intake.md > OQ-C` argues from the docs that it cannot, because Cache Components uses Next's own store rather than the shared `Cache-Control` header. Still unproven against a running build. Carried from `intake.md > C-2`. |
| OQ-6 | Does a bot user agent still render the homepage completely? | `08-caching.md:605` says crawlers skip the static shell and get a full dynamic render, and warns that shell data unreachable at request time makes a page work for a person and fail for a crawler. The homepage's data is all request-time Elasticsearch, so this looks safe — it needs confirming, not assuming. Carried from `intake.md > C-2`. |
| OQ-7 | What replaces `dynamicParams = true` on `featured`, `filters` and `flashDeals`? | Three of the 36 rejected configs. The value was already the default, and Cache Components changes what the default *does* (an unlisted param now gets an App Shell instead of blocking). Deleting the export is probably enough; the plan must say so rather than leave it implied. |
| OQ-8 | How does the `@modal` parallel route slot behave under Cache Components? | Two of the 36 rejected configs are the intercepted modal routes under `app/(client)/[lang]/@modal/`. A parallel slot is a segment of its own, so it may need `instant = false` or a `Suspense` boundary of its own. Nothing in the docs read so far covers slots specifically. |
| OQ-9 | What does `app/page.tsx` become? | The staging logo page uses `dynamic = "force-static"` + `revalidate = 600`, both rejected, and it renders its own `<html>` with no root layout above it. It is also half of the staging gate that `proxy.ts` depends on, so changing it touches a protected path's behaviour. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- The `next.config.ts` change and the probe route used to produce F-1 were made
  during **intake**, with the owner's explicit approval, and both were reverted;
  `git status` showed the working tree clean apart from `_specs/`. Nothing was
  changed during this stage.
