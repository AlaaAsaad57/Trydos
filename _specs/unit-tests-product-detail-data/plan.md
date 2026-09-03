---
ticket: unit-tests-product-detail-data
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-03
links:
  clickup:
  github:
---

# Plan — unit-tests-product-detail-data

> Decide the approach before changing code. Plan only — no implementation here.

> **Revised three times before the gate, on the owner's instruction.** The three
> advisory reviewers were run early and repeatedly, to catch majors before
> `/review` rather than after. Ten majors in total, every one verified against
> the repository before being accepted.
>
> - **Round 1 — five majors.** Two forced a `spec.md` revision: `FR-4` pinned a
>   failure the fetch layer cannot produce, and `it.fails()` was proven not to be
>   a strict marker.
> - **Round 2 — two majors, both defects in round 1's fixes**, found
>   independently by all three reviewers: the cookie stand-in was never reset
>   (sibling of the cache leak round 1 closed), and the `NEXT_PUBLIC_SITE_URL`
>   stub was dead under the new top-level import.
> - **Round 3 — three majors.** The top-level import itself was wrong (it cannot
>   coexist with the cookie stand-in), the cache reset rule did not close the
>   leak it named, and `AC-28` could pass for the wrong reason — a sibling of
>   `AC-3`, which round 2 had fixed in one place only.
>
> No gate decision was recorded and no lifecycle field was touched in any round.

## Approach

One new test file, `tests/serverRequests/product.test.ts`, covering all nine
exports of `serverRequests/product.tsx`; two builders added to the existing
`tests/fixtures/product.ts`; and two rows added to the shared builder guard.
**No application file is edited.**

Three boundaries are stood in at the module edge — the search client, the error
reporter and the server fetch. **The backend chooser is deliberately not stood
in**: standing it in would reduce AC-8 to "the reader joins two strings", with
no guest and no verified shopper in the case at all. The shopper's saved profile
is seeded through the cookie stand-in the file needs anyway, and the chooser
makes its real decision from it. That costs nothing in module graph —
`product.tsx:19` imports the chooser already.

**The file follows `tests/utils/server/tokenManager.test.ts`, which already does
all of this correctly**: profile seeding, env stubbing, lazy loading of the
module under test, `__reset()` between cases and `unstubAllEnvs()` after. Three
rounds of review went into rediscovering that file's shape from first
principles. Copy it; say where you deviate and why.

The cache needs no stand-in of its own — the research probe proved the
suite-wide one reaches this module.

One visible side effect of leaving the chooser real: `getMarketFetchBase` prints
a `[MarketRouting]` line on every call when `NODE_ENV` is not `production`
(`tokenManager.ts:160-165`), so roughly sixteen of the 33 cases print one. It is
noise, not a leak — the line names backends by role — and it costs under a
millisecond each. Say so in the file header so nobody reads it as a fault.

## Steps

1. Add `buildGlobalProduct` and `buildQtyPriceProduct` to
   `tests/fixtures/product.ts`. The `ProdutGlobalData` and `QtyProductData`
   interfaces they copy are declared **unexported** in
   `serverRequests/product.tsx` (lines 25–118), so the builders **declare the
   shape locally and name that source in a comment** — the precedent is
   `tests/fixtures/elastic.ts:5-23`. **No import of any kind from
   `serverRequests/product`**: a value import would drag a `"use server"`
   module, `next/headers` and the search client into four unrelated test files
   that use this fixture today (C-6). Every value is an obviously fake literal;
   the existing builders use `"Test Product"` and `example.com`.
   `QtyProductData` declares `seller.email` and `seller.birthdate` (lines
   97–106) — invented values only, never copied from a real response (C-5,
   NFR-4).
2. In `tests/fixtures/fixtures.test.ts`, add the two new names to the existing
   `./product` import (line 20) **and** two rows to the `BUILDERS` list (lines
   25–48), so they get the same three checks every other builder has —
   including "two calls return independent objects" (C-7).
3. Create `tests/serverRequests/product.test.ts` opening with
   `// @vitest-environment node` and `vi.setConfig({ testTimeout: 5000,
   hookTimeout: 5000 })`, matching `tests/serverRequests/HandleAuthedFetch.test.ts:18`.
   The project default is 15000, which turns one hung case into a 15-second wait.
4. Build the stand-ins — the search client, the error reporter, the server fetch
   — and the cookie stand-in from `tests/mocks/nextHeaders.ts`. **Not** the
   backend chooser.

   **The search stand-in dispatches on `index`, never on call order**, and the
   dispatch table is **the argument to `vi.fn(...)`**, not a `.mockImplementation()`
   applied afterwards. `mockReset()` restores only the implementation a spy was
   built with (`@vitest/spy` — `resetToMockImplementation`), so a dispatcher
   installed later is wiped to `undefined` on the first `beforeEach` and the
   file silently loses index dispatch.

   Dispatch is needed because one spy serves several queries inside a single
   call: `client.get` answers `product_interactions_index` (line 379) and
   `views_index` (line 409) within one `GetProductGeneralData`; `client.search`
   answers `share_index` (line 604) and `user_interactions_index` (line 638)
   within one `GetSocialInfoForProduct`. With call-order stubbing, a rejection
   meant for the views query also fails the ratings query — which makes AC-22's
   "is not reported" half impossible and breaks AC-23, which needs the ratings
   query to fail **while** views and recommendations succeed.

   **Index names are asserted through the constants imported from
   `services/elastic/INDEXES.ts`, never retyped as string literals.** They are
   real names, they reach a published diff, and a retyped copy can drift from
   the tracked source (NFR-4).

   **Cookie seeding, with the literals pinned:**
   - verified shopper — `User-Data` set to
     `encodeURIComponent(JSON.stringify({ phone: "verified-shopper" }))`.
     `hasValidPhone` (`tokenManager.ts:131-136`) accepts any non-empty value
     that is not `"0"`, so **no phone number is needed and none may be used**.
   - guest — no `User-Data` at all.
   - stories credential — an obviously fake, non-token literal, never copied
     from a browser session.
5. **Load the module under test with `await import()`**, through a small helper,
   the way `tests/serverRequests/HandleAuthedFetch.test.ts:95` and
   `tests/utils/server/tokenManager.test.ts` do. **Do not import it statically
   at the top of the file**, and **do not call `vi.resetModules()`**.

   A static import is not merely slower — it does not work. `vi.mock` factories
   are hoisted above the file body, so a static import of `serverRequests/product`
   (which imports `next/headers` at line 13) runs the
   `vi.mock("next/headers", () => headers)` factory before
   `const headers = makeNextHeadersMock()` has initialised:
   `ReferenceError: Cannot access 'headers' before initialization`.
   `tests/setup.ts:30-32` documents this exact hazard, and every file in the
   repo that uses this stand-in dodges it by importing lazily.

   Without `vi.resetModules()` the dynamic import is **cached**, so the module
   and the `utils/server` barrel behind it load exactly once — the same one-time
   cost a static import would have paid, with no hoisting hazard. An earlier
   draft claimed the lazy import re-executes that barrel on every case; that is
   true only under `resetModules`, which this plan does not use.

   **Set `NEXT_PUBLIC_SITE_URL` in a `vi.hoisted()` block**, using `vi.stubEnv`
   inside it rather than assigning `process.env` directly, so
   `vi.unstubAllEnvs()` can undo it. `General_Site_Data.url`
   (`serverRequests/meta/StructuredData/Constants.ts:4`) freezes
   `process.env.NEXT_PUBLIC_SITE_URL ?? "https://trydos.ramaaz.dev"` **at module
   load**, so a `beforeEach` stub is dead code. The blast radius is not only
   AC-18: `buildAlternates` writes `alternates.canonical` and five hreflang
   values, and `openGraph.url` and `twitter.images` carry the same origin — so
   AC-15 through AC-19 would publish that real staging host too. The hoisted
   block also owns the constant those criteria assert against, so the stub and
   the expected value cannot drift apart.

   Vitest 4.1.10 hoists `vi.hoisted` and `vi.mock` above the converted imports
   and inserts dynamic imports last, so this ordering is guaranteed by the
   transform, not by luck.
6. In `beforeEach`: reset the three own stand-ins with `mockReset()`, call
   `headers.__reset()` for the cookie stand-in, and sweep the cache with
   **`Object.values(cacheSpies).forEach((spy) => spy.mockReset())`**. In
   `afterEach`: `vi.unstubAllEnvs()`.

   Each of those exists for a reason found in review:
   - **The cookie jar** is load-bearing now that AC-8 routes through the real
     chooser. `vi.mock` runs its factory once per file, so a `User-Data` seeded
     for AC-8 would survive into AC-9 through AC-19 — all three readers call
     `getMarketFetchBase` — and a stories credential seeded for AC-29 would
     survive into AC-30 and AC-31's guest half. The stand-in says so in its own
     docstring (`tests/mocks/nextHeaders.ts:130-135`).
   - **The cache sweep must be `mockReset()`, not a re-applied default.** The
     shared `resetCacheSpies()` calls only `mockClear()`
     (`tests/mocks/serverRequests.ts:57`), which does not drain a queued
     `mockResolvedValueOnce`; neither does setting `mockResolvedValue` again.
     Only `mockReset()` drains it. Every spy in that file is built as
     `vi.fn(async () => null)` or similar, so one `mockReset()` sweep restores
     every default **and** empties every queue in a line — and cannot restore
     one spy fewer than were changed.
   - Answers are still set with `mockResolvedValueOnce`, so a leftover cannot
     silently serve a later case.
7. Stub **three** environment values in `beforeEach` and assert against the same
   constants. The fourth in the table is set in `vi.hoisted()` at step 5:

   | Variable | Value | Why this value |
   |---|---|---|
   | `BACKEND_URL` | `https://core.invalid` | names the role, not the stack |
   | `GO_BACKEND_URL` | `https://gateway.invalid` | **never** a value carrying the technology name — the variable name is unavoidable in source, the value is not, and the value is what reaches published output (NFR-2, NFR-4) |
   | `STORIES_BACKEND_URL` | `https://stories.invalid` | as above |
   | `NEXT_PUBLIC_SITE_URL` | `https://site.invalid` | **in `vi.hoisted()`, not here** — see step 5 |

   `.invalid` rather than `.test` or `.example`, copying
   `tests/utils/server/tokenManager.test.ts:22-24` and its stated reason:
   reserved names that cannot resolve anywhere, so a request that escapes a
   stand-in dies on this machine instead of leaving it. A safety property, not a
   style choice.

   The test environment sets none of the four (`vitest.config.mts > isolatedEnv`
   is `NEXT_PUBLIC_*` only) and `process.env` inherits the shell, so an
   unstubbed one could carry a real host into a published diff.
   `NEXT_PUBLIC_BASE_MEDIA_URL` needs no stub — `isolatedEnv` already sets it to
   `https://example.com`, and `buildOgImageUrl`'s real-host rewrite
   (`utils/server/helpers.ts:71`) cannot trigger from that base, so neither host
   is ever compared or published.
8. Write the cases in nine `describe` blocks, one per export, in AC order.
9. Write AC-23 (BUG-1), AC-37 and AC-38 (BUG-2) as **ordinary strict cases**,
   each asserting the value that arrives today, with a message stating what
   should arrive, naming the bug id, and saying that a change here means the bug
   is fixed and the case must be updated. **Not `it.fails()`** — see below.
10. Run the `logic-change` profile; record the exit code per `AC-n` and the
    file's own timings.

## Why not `it.fails()`

A throwaway probe was written, run, and deleted:

```
Tests  3 expected fail (3)
```

Three cases — the intended assertion, a `TypeError` from a missing stand-in, and
a plain raised error — **all** reported as "expected fail". So `it.fails()`
cannot distinguish "the defect is still here" from "my stand-in is broken", and
"remove the marker and see it turn red" cannot either, because a broken test
satisfies that too. That is the silent pass CLAUDE.md's testing rules exist to
stop. A strict assertion on the actual value keeps every property the marker was
chosen for.

## Files to change

- `tests/serverRequests/product.test.ts` — **new.** 33 cases across nine
  `describe` blocks.
- `tests/fixtures/product.ts` — **extend.** Two builders added; the two existing
  builders untouched.
- `tests/fixtures/fixtures.test.ts` — **extend.** Two names on the existing
  `./product` import line, and two rows in the `BUILDERS` list.

No other file is created, edited or deleted. `serverRequests/product.tsx` is
**read only**, so `C-1` holds by construction.

**Protected runtime paths: none touched.** `CLAUDE.md > Project profile` is the
governing list (`IM-5` says "the *project's* protected runtime paths"):
`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
`.github/workflows/**`. None appears above. The stricter list in
`UNIT_TEST_ROADMAP.md` is a convention about **where test files go**, and this
plan follows it too — the file sits in the `tests/` mirror.

## Integration surface

- **Components / shared config touched:** `tests/fixtures/product.ts` and its
  guard `tests/fixtures/fixtures.test.ts`. The fixture file carries a standing
  promise in its header (lines 16–19) that using a builder loads no production
  module; step 1 keeps it. Everything else is the shared harness, read and not
  changed: `tests/setup.ts`, `tests/mocks/serverRequests.ts`,
  `tests/mocks/nextHeaders.ts`, `tests/msw/server.ts`.
- **Who else depends on them:** `tests/fixtures/elastic.ts` calls
  `buildSearchEngineProduct()` for every search hit, and through it
  `tests/services/elastic/helpers.test.ts`,
  `tests/services/elasticHelpers.test.ts` and
  `tests/utils/normalizeListingProduct.test.ts`. Breaking C-6 would pull a
  server-only module into all four.
- **Overlapping flows:** `tests/components/products/ProductStories.test.tsx`
  replaces `serverRequests/product` with a stand-in; that file and this one
  never meet. `tests/utils/server/tokenManager.test.ts` proves the backend
  chooser in isolation; this file proves the same decision **through the
  reader**. That duplication is deliberate — the two answer different questions
  — but if the chooser's rule changes, both files change together.
- **Ordering / lockstep dependencies:** the two `BUILDERS` rows must land in the
  same commit as the two builders, or the guard fails. The BUG-1 and BUG-2 fix
  tickets must each update their confirming case in the same change as the fix,
  or the suite goes red on a passing test.
- **What breaks if this is wrong:** a **false green** — a stand-in answering a
  shape the real service never sends. C-5 is the guard. The second mode is
  **leaked state between cases**, which step 6 exists to stop; it shows as a
  case that passes without setting anything up, and is invisible in a green run.
  Three separate instances of that mode were found in review, which is why step
  6 enumerates every stateful stand-in rather than "the stand-ins".

## Tests

**Search A** — `grep -rn "serverRequests/product" tests/` returns three hits and
**none executes the module**: two are strings in
`tests/cache/noRuntimeReadsInCachedTree.test.ts:227-228` naming the different
file `serverRequests/products.ts` (plural), and one is a stand-in at
`tests/components/products/ProductStories.test.tsx:23`. No
`tests/serverRequests/product.test.ts` exists, so every functional row is `new`,
in one file, with no risk of a second parallel file.

**Search B** — `grep -rn "getMarketFetchBase" tests/` returns
`tests/utils/server/tokenManager.test.ts`, whose `describe("backend routing")`
block proves the chooser in isolation at lines 231 and 238.

**The fourth column is the one that matters.** Three ACs were caught in review
passing for the wrong reason — a case that would stay green with the module
deleted. Each row below states what stops that.

| AC | Existing coverage | Disp. | Test case, and what stops it passing for the wrong reason |
|------|------|------|------|
| AC-1 | none — A | new | `GetCountries` › serves a cached list without asking a backend — assert the fetch stand-in was **not** called |
| AC-2 | none — A | new | `GetCountries` › asks the backend on a miss and keeps the answer — assert the `RedisSet` key |
| AC-3 | none — A | new | `GetCountries` › a reply with no list gives an empty list, **and the backend was asked**. `product.tsx:140` reads `response?.data?.data?.countries` with full optional chaining, so an unconfigured stand-in also yields `[]` |
| AC-4 | none — A | new | `GetGlobalProduct` › serves a cached record, flagged as cached — assert the fetch stand-in was not called |
| AC-5 | none — A | new | `GetGlobalProduct` › reads fresh when nothing is cached, flagged as fresh |
| AC-6 | none — A | new | `GetGlobalProduct` › a fresh read writes both the slug key and the record key |
| AC-7 | none — A | new | `GetGlobalProduct` › skipping the cache skips the read but still writes back |
| AC-8 | chooser proven in isolation (search B); the reader's use of it is uncovered | new | `GetGlobalProduct` › a guest reaches the gateway and a verified shopper the core backend, decided from the seeded profile — two cases, asserting the host the fetch stand-in received |
| AC-9 | none — A | new | `GetGlobalProduct` › a raising cache is reported and re-raised. Leave `noCache` at its default, or the read is skipped and nothing is proved |
| AC-10 | none — A | new | `GetProductPriceQtyDetails` › serves a cached payload, flagged as cached |
| AC-11 | none — A | new | `GetProductPriceQtyDetails` › a fresh read keeps price, offer price, variants and available quantity |
| AC-12 | none — A | new | `GetProductPriceQtyDetails` › a raising cache is reported and nothing is returned. Same `noCache` note as AC-9 |
| AC-13 | none — A | new | `GetProductMeta` › a product the backend does not have is reported as not found |
| AC-14 | none — A | new | `GetProductMeta` › a refused request is reported as a fault, not as not found |
| AC-15 | none — A | new | `GetProductMeta` › a chosen colour and size appear in the title |
| AC-16 | none — A | new | `GetProductMeta` › brand and category are appended when present |
| AC-17 | none — A | new | `GetProductMeta` › a too-short description is replaced, a real one kept — both halves, so the rule is proved and not just one side |
| AC-18 | none — A | new | `GetProductMeta` › a product with no picture falls back to the site image |
| AC-19 | none — A | new | `GetProductMeta` › a cached copy is served without asking the backend |
| AC-20 | none — A | new | `GetProductGeneralData` › no product id returns the empty shape — assert the search stand-in was not called |
| AC-21 | none — A | new | `GetProductGeneralData` › the star spread becomes rating groups with counts |
| AC-22 | none — A | new | `GetProductGeneralData` › a product with no view record counts zero views and is **not** reported. The rejection must carry `statusCode: 404` (or `meta.statusCode`); `product.tsx:417-423` suppresses the report only for 404, so a plain `Error` would still call the reporter and the case would fail for the wrong reason |
| AC-23 | none — A | new | **BUG-1** `GetProductGeneralData` › a failed ratings query leaves the fallback figures unreachable. Needs index dispatch: ratings fails while views and recommendations succeed |
| AC-24 | none — A | new | `GetRecommendationCountForProduct` › percentages come from the two totals |
| AC-25 | none — A | new | `GetRecommendationCountForProduct` › nobody rated gives zero, not a division by zero |
| AC-26 | none — A | new | `GetSocialInfoForProduct` › likes, comments and shares arrive as one answer, each from its own index |
| AC-27 | none — A | new | `GetSocialInfoForProduct` › the like is read from the **most recent** interaction. `product.tsx:669-671` reads `hits[0]`, so a single-hit fixture proves only "reads a hit" — supply two hits in newest-first order, or assert the `interaction_date: desc` sort reached the search client |
| AC-28 | none — A | new | `GetProductCommentsCount` › deleted comments and order ratings are left out, **shown by the query sent**. The count comes from the stand-in, so asserting the number proves nothing: assert `must_not` carries `status: "deleted"` and `exists: order_details_id` |
| AC-29 | none — A | new | `GetProductStoriesData` › a shopper with a stories credential sends it, a guest sends none — both halves |
| AC-30 | none — A | new | `GetProductStoriesData` › a refused request gives empty lists |
| AC-31 | none — A | new | `GetProductStoriesData` › a group counts as new when any story in it is unseen |
| AC-32 | `tests/setup.test.tsx::never loads the real cache layer` (cache path); `onUnhandledRequest: "error"` at `tests/setup.ts:93` (search-client path) | existing | Write nothing. Two guards on two paths. msw does not fire on the fetch path — every backend call goes through the stood-in fetch helper — but it is the **only** guard if the search-client stand-in is ever mis-scoped, because `services/elastic/elasticsearch.config.ts:7-14` would then build a real client from `ELASTICSEARCH_NODE` inherited from the shell. **If that msw error ever fires, treat it as a leak, not just a failed test**: its message carries the real node address into the published run report |
| AC-33 | none — searched `tests/`; no message-content check exists | none — enforced by rule, checked by reading. The rule now covers builder fields (step 1), seeded cookies (step 4), index names via constants (step 4), the site origin (step 5) and the backend addresses (step 7). No phone number is used at all | — |
| AC-34 | none — searched `tests/`; no assertion-message linter exists | none — a judgement about English, made at `/review` and `/verify` | — |
| AC-35 | none — searched `tests/` | none — by construction. No case reads the clock or a duration; four environment values are pinned, three stubbed in `beforeEach` and one hoisted above the imports | — |
| AC-36 | n/a — this is the gate | none — the validation profile plus the timing budget below | — |
| AC-37 | none — A | new | **BUG-2** `GetGlobalProduct` › a refused request returns a record with no product id and no signal the caller can read |
| AC-38 | none — A | new | **BUG-2** `GetProductPriceQtyDetails` › the same, on the payload carrying the price |

The two builders and the two `BUILDERS` rows supply material these rows use —
a builder is named in the traceability table for FR-5 — but none is a test case,
so none holds a row. They appear under **Files to change**, which is what puts
them in scope for `/implement`.

Response envelopes — the metadata payload, the stories payload and the search
replies — stay as inline literals. They are not product shapes and are used once
each.

## Validation strategy

- **Validation profile:** `logic-change` — `pnpm lint`,
  `node_modules/.bin/tsc --noEmit --pretty false`, `pnpm test:run`. All three are
  defined in `.claude/project-config.yaml > validation_checks` and none is
  restated here (VP-4). All read-only and deterministic; `pnpm test:run` is
  `vitest run --project unit`, the non-writing mode.
- `pnpm test:run` executes every row above, as `VF-11` requires.
- The typecheck needs `pnpm exec next typegen` first on a fresh checkout.
- **AC-36 claims only what the profile proves.** CI runs *more*:
  `.github/workflows/tests.yml` also runs `pnpm lint:i18n-parity` and uses
  `pnpm test:ci` rather than `pnpm test:run`. Neither can fail here — the parity
  script reads three translation files this ticket does not touch, and coverage
  carries no threshold — but the profile does not prove that, so the criterion
  does not claim it.
- **Budget the two figures this ticket controls, not the wall clock.** A
  single-file run of this graph already measured **2.76s Duration with a 31ms
  import** (the research probe), and a comparable file —
  `tests/utils/server/tokenManager.test.ts`, 76 tests, 55 lazy imports —
  measures **4.65s Duration: transform 1.13s, setup 2.59s, import 621ms, tests
  369ms**. Roughly 90% of any single-file number is vitest boot, transform,
  collect and setup, which this ticket does not own. So:
  - **`tests` ≤ ~400ms** and **`collect` ≤ ~1.5s**;
  - record the full `Duration` footer as context, not as the pass mark.

  A flat multiple of the wall clock would only ever catch a hang, which is what
  `testTimeout` is for.
- **The BUG-1 and BUG-2 cases must be shown to be strict**, not merely green:
  `/verify` records that each fails with the *expected* assertion text when the
  asserted value is changed, and that a broken stand-in produces a *different*
  failure. Run that on the single file
  (`pnpm exec vitest run --project unit tests/serverRequests/product.test.ts`).
- **The intake baseline is stale and must be re-recorded before implement.** It
  was **140 files, 2245 passed, 7 skipped** on `develop` at `f300600e`, but a
  second session has since been writing cart and order tests — and application
  code — in the same working tree. Re-run the suite on whatever `develop` looks
  like when the branch is cut, write that into `intake.md`, and let `/verify`
  compare against it. Comparing against `f300600e` would credit this ticket with
  someone else's tests.

## Rollback

Delete `tests/serverRequests/product.test.ts`, and revert the two builders in
`tests/fixtures/product.ts` and the import line and two rows in
`tests/fixtures/fixtures.test.ts`. Nothing else was touched, so that restores
today's state exactly (C-8).

In practice the ticket is one commit on
`ticket/unit-tests-product-detail-data`, so `git revert` of that commit is the
whole rollback. No application code, no migration, no configuration and no
released behaviour is involved. The suite returns to whatever baseline was
recorded when the branch was cut.

## Out of scope

- **Fixing BUG-1 and BUG-2.** Both confirmed here by strict cases; both fixed in
  their own tickets, each of which must update its confirming case.
- **FIND-2** — a failing recommendation query taking the whole ratings call down.
- **FIND-3** — comments naming the backend technology, in files this ticket does
  not open.
- **FIND-4** — the roadmap describing a `live` vitest project that does not exist.
- **FIND-5** — the stories reader raising on a reply with an unexpected body.
- **`utils/pagesDataRequests/ProductPageData.ts`** — the follow-up ticket
  `unit-tests-product-comments-data`. It holds a drifted near-copy of the
  interactions reader, which rethrows where this one swallows, so AC-26 and
  AC-27 do not carry over to it.
- **Any change to `serverRequests/product.tsx`**, including a refactor.
- **A coverage threshold**, and any change to the pull-request gate.

## Plan ↔ REQ / AC traceability

| Requirement | AC covered | Where the plan carries it |
|---|---|---|
| FR-1 country list | AC-1 – AC-3 | `GetCountries` block |
| FR-2 record read and cache | AC-4 – AC-7, AC-10 | `GetGlobalProduct`, `GetProductPriceQtyDetails` blocks |
| FR-3 which backend | AC-8 | chooser left real, profile seeded (step 4) |
| FR-4 what a failed read does | AC-9, AC-12, AC-14, AC-37, AC-38 | five cases across three blocks — the raise path, the two silent ones, and the one reader that gets it right |
| FR-5 price and stock intact | AC-11 | `buildQtyPriceProduct` + `GetProductPriceQtyDetails` block |
| FR-6 gone vs unwell | AC-13, AC-14 | `GetProductMeta` block |
| FR-7 metadata | AC-15 – AC-19 | `GetProductMeta` block; site origin pinned in step 5 |
| FR-8 ratings and recommendation | AC-20, AC-21, AC-24, AC-25 | `GetProductGeneralData`, `GetRecommendationCountForProduct` blocks |
| FR-9 zero views quietly | AC-22 | `GetProductGeneralData` block, 404-shaped rejection |
| FR-10 social counts | AC-26, AC-27 | `GetSocialInfoForProduct` block, index dispatch |
| FR-11 comment count | AC-28 | `GetProductCommentsCount` block, asserted on the query |
| FR-12 stories | AC-29 – AC-31 | `GetProductStoriesData` block |
| FR-13 confirm BUG-1 | AC-23 | strict case, plus the strictness experiment |
| NFR-1, NFR-2 messages | AC-34 | read at `/review` and `/verify` |
| NFR-3 no real I/O | AC-32 | two existing guards, one per path |
| NFR-4 nothing secret or real out | AC-33 | the literal rule across steps 1, 4, 5 and 7 |
| NFR-5 nothing ambient | AC-35 | construction, plus four pinned environment values |
| NFR-6 gate green and cheap | AC-36 | the profile, plus the `tests` and `collect` budgets |
| C-6 fixture stays clean | — | step 1: local interfaces, no import from the reader |
| C-7 every builder guarded | — | step 2: import line plus two `BUILDERS` rows |

Every `OQ-n` was answered in `spec.md`; none was deferred, so `PL-12` leaves
nothing open here.
