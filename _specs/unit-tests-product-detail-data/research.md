---
ticket: unit-tests-product-detail-data
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-03
links:
  clickup:
  github:
---

# Research — unit-tests-product-detail-data

> Read-only phase. **No implementation is allowed in this command.**
> Nothing outside `_specs/unit-tests-product-detail-data/` was written.

## Goal

Cover the product page's data path with unit tests, so a break names the
function and the backend that failed instead of showing a blank product page.

## The headline finding: this phase is two tickets, and it is re-cut here

The roadmap allows a re-cut at research when a phase does not fit one honest
ticket (it says so for Phase 4 and again for Phase 21). Phase 13 does not fit.

The two named files are **not one seam**. They cross four different boundaries
between them:

| File | Talks to | Exports | Internal helpers |
|---|---|---|---|
| `serverRequests/product.tsx` | the core/gateway backend, Redis, Elasticsearch, the stories backend | 9 | 3 |
| `utils/pagesDataRequests/ProductPageData.ts` | Elasticsearch only | 4 | 4 |

Walking every branch honestly comes to roughly **35 cases** for `product.tsx`
and **25** for `ProductPageData.ts`. Sixty test cases in one plan is more than a
comprehension gate can hold, and the two halves share no stand-in setup:
`product.tsx` needs the backend fetch, Redis and cookie boundaries stood in,
`ProductPageData.ts` needs only the search client.

**Decision, taken here as the roadmap allows:**

- **This ticket covers `serverRequests/product.tsx` only.**
- `utils/pagesDataRequests/ProductPageData.ts` moves to a follow-up ticket,
  `unit-tests-product-comments-data`, opened after this one closes (one active
  work item at a time).

`serverRequests/product.tsx` goes first because it carries the price and
quantity data (`qtyPriceDetails` — `price`, `offer_price`, `luck_price`,
`variations`, `available_quantity`), it decides **which backend** the product
request goes to, and it is on the critical path of the product page, the
intercepted product modal and both mobile routes. `ProductPageData.ts` serves
comments and reaction counts — visible, but nobody buys the wrong thing because
a like count is wrong.

One consequence for the follow-up: `ProductPageData.ts` imports
`GetRecommendationCountForProduct` **from** `serverRequests/product.tsx`
(line 1), so the follow-up ticket inherits whatever this one pins about that
function. That is the right order, not a problem.

## Relevant directories

- `serverRequests/` — the module under test. Server-side data readers. Also
  holds `./radis` (the Redis wrapper), `./ServerFetch.tsx` (the fetch the module
  calls) and `./meta/` (`buildAlternates`, `StructuredData/Constants`), all of
  which `product.tsx` imports.
- `tests/serverRequests/` — where the new test file goes, per the `tests/`
  mirror rule. Already holds `HandleAuthedFetch.test.ts`, `ServerFetch.test.ts`,
  `requestDedup.test.ts`, `radis/index.test.ts`, `meta/home.test.ts`,
  `cached/{home,currency}.test.ts`, `buildAlternates.test.ts`.
- `tests/mocks/` — 18 stand-in factories. The ones this ticket needs are
  `nextHeaders.ts`, `serverRequests.ts` (the Redis cut) and `sentry.ts`.
- `tests/fixtures/` — 8 builders. `product.ts` and `elastic.ts` exist but build
  **listing** shapes, not the product-detail shapes this module returns — see
  OQ-3.
- `tests/msw/` — the fake network. `onUnhandledRequest: "error"`, so any request
  nobody answered fails the test instead of leaving the process.
- `services/elastic/` — `elasticsearch.config.ts` (the client) and `INDEXES.ts`
  (the index names `product_interactions_index`, `views_index`,
  `comments_index`, `share_index`, `user_interactions_index`).
- `utils/server/` — `index.tsx` (`getThumb`, `stripHtml`, `buildOgImageUrl`,
  `GetImageUrl`) and `tokenManager.ts` (`getMarketFetchBase`).

## Relevant config files

- `vitest.config.mts` — one project, `unit`. `environment: 'jsdom'`,
  `setupFiles: ['./tests/setup.ts']`, `testTimeout: 15000`, `server-only`
  aliased to `tests/mocks/serverOnly.ts`. `test.env` (`isolatedEnv`) supplies
  only `NEXT_PUBLIC_*` values — **it sets neither `BACKEND_URL` nor
  `GO_BACKEND_URL` nor `STORIES_BACKEND_URL`**, which matters (see Risks).
- `tests/setup.ts` — runs before every test file. Registers the App Router
  hooks, starts msw, supplies `window.matchMedia`, and cuts two chains:
  `serverActions/sendOtp` and **`serverRequests/radis`**, because ioredis opens
  a real socket the moment it loads.
- `.claude/project-config.yaml` — the validation profile for this ticket is
  `logic-change`: `lint`, `typecheck`, `unit-tests`.
- `.github/workflows/tests.yml` — runs `pnpm test:run` on every PR into
  `develop`. A new test file is picked up with no edit to CI.
- `docs/testing/UNIT_TESTING.md` — the conventions. See the layout section
  below.

## Test layout and naming convention (RS, recorded for `/plan` `PL-14`)

| | |
|---|---|
| Runner | Vitest 4.1.10, project `unit`, `pnpm test:run` |
| Where | the `tests/` mirror of the **full** source path — `serverRequests/product.tsx` → **`tests/serverRequests/product.test.ts`** |
| Naming | `<sourceBasename>.test.ts` (`.test.tsx` only when JSX is rendered) |
| Server modules | need `// @vitest-environment node` on line 1, because `server-only` throws in a browser-like test |
| Mocking | `vi.mock` at top level; re-import through a loader that calls `vi.resetModules()` first |
| Expected-failure marker | Vitest's `it.fails()`. **Never used in this repo yet** — `grep -rn "\.fails(\|BUG-" tests/` returns nothing. If this ticket needs one for a `BUG-n`, it is the first, so the plan must say what it looks like |
| Colocated leftover | `utils/functions.test.ts` only. Do not copy it |

**Existing coverage search for `PL-14`:** no test file executes
`serverRequests/product.tsx`. The three `grep` hits inside `tests/` are not
coverage — two are strings inside `tests/cache/noRuntimeReadsInCachedTree.test.ts`
naming the **different** file `serverRequests/products.ts` (plural), and the
third is `vi.mock("serverRequests/product", …)` in
`tests/components/products/ProductStories.test.tsx`, which replaces the module
instead of running it. So every row of `plan.md > Tests` for this ticket is
disposition **`new`**, in one new file.

**The model to copy is `tests/serverRequests/HandleAuthedFetch.test.ts`** — the
same folder, the same `// @vitest-environment node` opening, msw for the
network, `makeNextHeadersMock()` for the cookies, and per-`AC-n` comments.

## Possibly affected services

Nothing in the running app is affected — this ticket adds test files only. What
the **tests** must stand in for, because `product.tsx` reaches all of it:

- **The core and gateway backends.** `getMarketFetchBase()`
  (`utils/server/tokenManager.ts:158`) returns `BACKEND_URL` for a verified user
  and `GO_BACKEND_URL` for a guest. `GetGlobalProduct`,
  `GetProductPriceQtyDetails` and `GetProductMeta` all build their URL from it,
  so **which backend was asked** is an assertable fact and the CLAUDE.md testing
  rule says the failure must name it.
- **Redis** — `GetFromRedis`, `RedisGet`, `RedisSet` from `./radis`. Already cut
  globally in `tests/setup.ts`, but by a different specifier — see OQ-1.
- **Elasticsearch** — `elasticSearchClient.get`, `.search`, `.count`. The
  module captures the client at load time (`let client = elasticSearchClient;`,
  line 24), so the stand-in must be registered before the module is imported.
- **The stories backend** — `process.env.STORIES_BACKEND_URL`, read directly in
  `GetProductStoriesData`, with a `Bearer` header from the `STORIES_TOKEN`
  cookie.
- **Sentry** — `LogServerError` sits in seven catch blocks and must be stood in,
  or the reporter fires its own outbound request that msw then fails the test
  on. `tests/serverRequests/HandleAuthedFetch.test.ts:34` does exactly this.

## Test / validation commands available

Listed, not run — research is read-only.

- `pnpm test:run` — the unit suite once, then exits. The `unit-tests` check.
- `pnpm test` — watch mode. Never in a gate; it does not exit.
- `pnpm test:coverage` — adds `coverage/index.html` and `coverage-summary.json`.
- `pnpm lint` — ESLint, including the i18n rules. The i18n rules are **off** for
  `*.test.*`, so no `eslint-disable` is needed in the new file.
- `node_modules/.bin/tsc --noEmit --pretty false` — the typecheck. Needs
  `pnpm exec next typegen` first on a fresh checkout, because `next-env.d.ts` is
  gitignored.
- `pnpm lint:i18n-parity` — not in the `logic-change` profile; no user-visible
  string is added by this ticket.

Baseline recorded at intake: 140 files, 2245 passed, 7 skipped, 203.07s.

## Behaviour worth pinning — read from the source

Line numbers are `serverRequests/product.tsx` on `develop` at `f300600e`.

1. **`GetCountries` (122).** Redis hit returns early. On a miss it asks
   `BACKEND_URL + "/countries"` — the **only** function in the file that names
   `BACKEND_URL` directly rather than going through `getMarketFetchBase`, so a
   guest and a verified user hit the same backend here. Writes back to Redis,
   and returns `[]` when the payload has no `countries`.
2. **`GetGlobalProduct` (143).** Two-step cache: a slug→id key, then an
   `…-global` key. `noCache: true` skips **only the read**, and still writes
   back. Returns `globalFromRedis` true or false, plus a timing number. On
   error it logs and **throws**.
3. **`GetProductPriceQtyDetails` (210).** The same cache shape with a
   `…-qtyPrices` key — but its catch logs and **returns `undefined`**, where
   `GetGlobalProduct` throws. Two neighbouring functions, two different answers
   to the same failure. This is the price and stock payload.
4. **`GetProductMeta` (270).** A 404 returns `{ productNotFound: true }` and is
   deliberately separated from the catch-all, so a caller can redirect on "gone"
   while a timeout still renders the page. Title appends `searchParams.color`
   and `searchParams.size`, then a brand/category context. The description falls
   back to a built sentence when `stripHtml(details)` is **shorter than 60
   characters**. `RedisSet(cacheKey, data, 3600)`.
5. **`GetProductGeneralData` (376).** Returns a fixed empty shape when `id` is
   missing. Otherwise runs three queries in parallel and maps
   `star_distribution` into `ratingDetails` by splitting each key on `_`.
6. **`GetRecommendationCountForProduct` (470).** Percentage maths over two
   aggregation buckets, `"0"` when the total is zero, and `.toFixed(0)` — so the
   result is a **string**, not a number. It has **no try/catch**.
7. **`GetProductStoriesData` (547).** Reads `COOKIE_NAMES.STORIES_TOKEN` and
   sends `Authorization: Bearer …` only when it is there. Returns
   `{ data: [], stories: [] }` when the response has no `data`. `has_new` is
   true when any story has `is_seen === false`.
8. **`GetSocialInfoForProduct` (585)** and **`GetProductCommentsCount` (692)** —
   a three-way fan-out and a `client.count` respectively.

## Findings — recorded, not fixed

Roadmap rule 4: a test never changes the code under test. None of these is
inside a file this ticket edits (this ticket edits no source file at all), so
under IM-12 each is a finding and, where it is a defect, its own ticket.

- **`FIND-1` — `GetProductGeneralData`'s Elasticsearch fallback is shaped
  wrong, so it never applies.** `getProductGeneralQuery` returns `res._source`
  on success (unwrapped) but `{ _source: { final_rating: 0, … } }` on failure
  (wrapped). The caller then reads `source?.final_rating`,
  `source?.star_distribution`, `source.size_analysis` and
  `source.good_quality_product` — all `undefined` against the wrapped shape.
  So when the ratings query fails, the page gets `undefined` everywhere instead
  of the zeros the fallback was written to supply. `serverRequests/product.tsx`
  lines 377–405 vs 441–456. **Strong `BUG-n` candidate** — the spec should
  decide whether this ticket pins today's behaviour and records it, or writes
  the confirming test under an expected-failure marker.
- **`FIND-2` — a failure in `GetRecommendationCountForProduct` takes
  `GetProductGeneralData` down with it.** It has no try/catch (470), and it sits
  inside the `Promise.all` at 439. Its two neighbours in that `Promise.all` both
  swallow their own errors, so the ratings block survives an Elasticsearch
  outage and the recommendation block does not — the whole call returns
  `undefined`.
- **`FIND-3` — three comments name the backend technology**, which CLAUDE.md's
  stack-agnostic naming rule forbids in comments as well as in code:
  `serverRequests/product.tsx:155` ("the Go backend") and `:173` ("Verified
  users → Laravel, guests → Go"). The same file's mobile caller repeats it at
  `app/api/mobile/product/details/[slug]/route.ts:36`, `:110` and `:265`. A
  comment-only fix, and out of scope here because this ticket edits no source.
- **`FIND-4` — the roadmap describes a `live` vitest project that does not
  exist.** `UNIT_TEST_ROADMAP.md` refers to "the `live` vitest project
  (`tests/live/`, `pnpm test:live`)". There is no `tests/live/` directory, no
  `live` project in `vitest.config.mts` (whose comment says "The isolated suite,
  and only the isolated suite") and no `test:live` script in `package.json`.
  Doc drift; harmless to this ticket.

## Questions intake left open — settled here

- **`GetGlobalProduct` has callers.** Two, both real:
  `app/api/mobile/product/details/[slug]/route.ts:236` and
  `components/Product/ProductPageContent.tsx:44`. It is not dead code, so it
  gets tests. (The intake grep missed it because that import wraps two names
  across lines.)
- **Which protected-path list governs.** `CLAUDE.md > Project profile` does, and
  it is the one the plugin means: `workflows/development/prompts/implement.md`
  (`IM-5`) says "the **project's** protected runtime paths". That list is
  `proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
  `.github/workflows/**` — `serverRequests/**` is **not** on it. The stricter
  list in `UNIT_TEST_ROADMAP.md` and `UNIT_TESTING.md` is a repo convention for
  where test files go, not the plugin's stop condition. Either way this ticket
  edits no protected path and writes one new file under `tests/`, so the
  🔒 marker changes nothing about what gets done — `plan.md` states it followed
  the CLAUDE.md list.
- **Scope.** Re-cut to `serverRequests/product.tsx` only — see the headline
  finding above.

## Risks and unknowns

- ~~**The Redis cut may not reach this module**~~ — **settled, no longer a
  risk.** See "OQ-1 settled by running it" below.
- **Three environment values are missing from the test env** — impact: medium.
  `isolatedEnv` sets only `NEXT_PUBLIC_*`, so `BACKEND_URL`, `GO_BACKEND_URL`
  and `STORIES_BACKEND_URL` are all `undefined` in a test run. Every URL this
  module builds would start with `"undefined/…"`. The test must stub them
  (`vi.stubEnv`) — which is also what makes "the request went to the gateway,
  not the core backend" assertable at all.
- **The module is `"use server"`** — impact: low. Vite applies no Server Actions
  transform, so the directive is an inert string in a test. Worth one sentence
  in the test file so the next reader does not wonder.
- **`utils/server/index.tsx` is heavy** — impact: low, cost only. Memory records
  that it pulls in about 416KB of translations. It is imported for four small
  helpers (`getThumb`, `stripHtml`, `buildOgImageUrl`, `GetImageUrl`), so the
  file may load slowly the first time. `testTimeout` is 15s, well clear.
- **Timing values in the return payload** — impact: low.
  `Number(end - start) / 1_000_000` from `process.hrtime.bigint()` is in every
  `GetGlobalProduct` and `GetProductPriceQtyDetails` return. Never assert its
  value; assert only that the flag beside it (`globalFromRedis`) is right.
- **Secret leakage into output** — impact: high if missed. The stories token
  and `MARKET-TOKEN` pass through this module. No assertion message and no
  printed fixture may carry one, per the intake output-safety line.

## OQ-1 settled by running it — and it de-risked the module load too

Written after the table below, so the table keeps the question and this section
carries the evidence.

A throwaway probe was written at
`_specs/unit-tests-product-detail-data/probe-oq1.test.ts`, run, and **deleted**.
It imported `serverRequests/product` and called `GetCountries`, with four
stand-ins registered (`services/elastic/elasticsearch.config`,
`utils/serverErrorReporter`, `utils/server/tokenManager`,
`serverRequests/ServerFetch`).

Result: **1 passed, 2.76s, import 31ms.** `cacheSpies.RedisGet` recorded a call
with `countries-sy-en`.

Two things that proves:

1. **The global `vi.mock("serverRequests/radis")` in `tests/setup.ts` does reach
   `product.tsx:9`'s relative `"./radis"` import.** Vitest keys the mock by
   resolved module id, and both specifiers resolve to the same file. The new
   test file needs no stand-in of its own for the cache. Had the real module
   loaded, the spy would have recorded nothing and the probe would have failed.
2. **The module loads under the harness at all** — in the node environment, with
   those four stand-ins, in 31ms. No socket, no timeout. This was untried before
   today, because no test had ever imported this file, and it was the largest
   unknown in the ticket.

The probe was throwaway on purpose. Under CLAUDE.md it proves nothing that
lasts: the real test file written at `/implement` is what keeps the answer.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does the global `vi.mock("serverRequests/radis")` in `tests/setup.ts` also cover `product.tsx`'s relative `import … from "./radis"`, or must the new test file register its own stand-in? | If it does not, importing the module under test opens a real Redis socket — breaking roadmap rule 5 (no real I/O) silently, because ioredis connects on load and nothing fails loudly. Settle it before any test is written. |
| OQ-2 | For `FIND-1` (the fallback that never applies), does this ticket **pin today's behaviour** and record the defect, or write the confirming test under `it.fails()` with a `BUG-n` id? | The two produce different files. `it.fails()` has never been used in this repo, so choosing it means this ticket also sets that pattern. CLAUDE.md wants a bug confirmed by a red test before any fix — but the fix itself is another ticket, since this plan changes no source. |
| OQ-3 | Do the product-detail shapes need new fixtures in `tests/fixtures/product.ts`, or are inline literals right? | The existing builders make **listing** shapes; this module returns `ProdutGlobalData` and `QtyProductData`, which are different. Roadmap rule 5 says use the Phase 2 factories and do not invent new ones — that rule is about I/O stand-ins, so the spec must say plainly which way it reads for fixtures. |
| OQ-4 | Which of the 9 exports are in this ticket's acceptance criteria, and is any deferred? | Even after the re-cut, `product.tsx` is ~35 honest cases across four boundaries. If the spec cannot carry all nine, it must say which are deferred and why — rather than a plan that quietly covers five. |
| OQ-5 | Should the assertion messages name the backend as "the core backend" / "the gateway", given `getMarketFetchBase` picks between them by user type? | CLAUDE.md requires a failure to name the backend it crossed, and forbids naming the backing technology. The env var is still called `GO_BACKEND_URL`, so the test reads a forbidden name and must not repeat it in output. |

## Notes

- No code was changed during research. Only files under
  `_specs/unit-tests-product-detail-data/` were written.
- No observability runtime configs were modified. `features.observability` is
  `false` for this project.
- No command was run that writes anything: the investigation was `grep`, `sed`,
  `ls` and `wc` only. The one suite run (`pnpm test:run`) happened at intake, to
  record the baseline.
