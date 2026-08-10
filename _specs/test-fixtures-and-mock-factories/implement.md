---
ticket: test-fixtures-and-mock-factories
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Implement — test-fixtures-and-mock-factories

> Record of what was actually built, following `plan.md`.

First run, from `state: approved`. Branch `ticket/test-fixtures-and-mock-factories`
was created here from a clean `develop` (IM-3). All ten steps of the plan are
done. No file outside `plan.md > Files to change` was touched, and no
`protected_paths` file was changed.

## Changes made

**New — sample-data builders (`tests/fixtures/`).** Each builder is a plain
function that merges the caller's overrides over a default. No data-generating
library. Every field is copied from a shape written down in this repository, and
each file names its source in a comment at the top (C-5). Every token, id, email
and phone is an obviously fake constant — `"test-market-token"`, `+10000000000`,
an address on `example.com` — invented from the type shapes, never copied from a
real session or response.

- `tests/fixtures/product.ts` — `buildListingProduct()` (from `types/listing.ts`
  and the object `utils/listing/normalizeListingProduct.ts` really builds) and
  `buildSearchEngineProduct()` (from `CustomProduct` in
  `services/elastic/helpers.ts`).
- `tests/fixtures/elastic.ts` — `buildSearchEngineHit()` and
  `buildSearchEngineResponse()` (from `ElasticsearchHit` in
  `services/elastic/elasticSearch.ts` and the `response.hits.hits` reads there).
- `tests/fixtures/user.ts` — `buildUser()` (from `UserData` in
  `utils/cookies/cookie-manager.ts`).
- `tests/fixtures/cart.ts` — `buildCartItem()` and `buildCart()` (from
  `CartItemInterface` / `CartApiInterface` in `utils/types/cart.tsx`).
- `tests/fixtures/order.ts` — `buildOrder()` and `buildOrderLine()` (from
  `OrderInterface` in `utils/types/OrderInterface.ts`).
- `tests/fixtures/address.ts` — `buildAddress()` (from
  `OrderInterface["shipping_address_data"]`, taken straight off the order type so
  the two cannot drift apart).
- `tests/fixtures/story.ts` — `buildStory()` and `buildStoryItem()` (from the
  `Story` interface in `store/homepage/reducer.ts`).
- `tests/fixtures/chat.ts` — `buildChatMessage()`, `buildChatUser()` and
  `buildMessageStatus()` (from `utils/types/chat/index.ts`).
- `tests/fixtures/fixtures.test.ts` — checks all fourteen builders: each returns
  a complete object with no arguments, overrides take effect and leave the rest
  alone, two calls return independent objects, and an override that is `""`, `0`,
  `null` or `[]` is still applied (AC-2, AC-3).

**New — module stand-ins (`tests/mocks/`).** Each file exports a factory a test
calls inside its own `vi.mock(...)`, so every test gets a fresh copy and nothing
leaks between tests. **Every stand-in is hand-written and imports no production
module at run time** — the only imports are `import type`, which the compiler
removes (review follow-up 1).

- `tests/mocks/cookieManager.ts` — the cookie manager. Holds its **own copy** of
  `COOKIE_NAMES` and `HTTPONLY_COOKIE_NAMES`, and covers the whole module:
  `getCookie`, `getCookieServer`, `setCookie`, `deleteCookie`,
  `clearHashedUserId`, `setLocaizationCookies`. Reads and writes go to a plain
  jar it holds itself, so no real cookie store is touched. The comment records
  that the drift test is the one place that needs the browser-like (jsdom)
  environment.
- `tests/mocks/nextHeaders.ts` — the framework's server-request reader:
  `cookies`, `headers`, `draftMode`, all async, backed by plain objects.
- `tests/mocks/fetchData.ts` — the client fetch helper: `fetchData` and
  `abortInFlightForLogout`.
- `tests/mocks/store.ts` — the shared state store. **The factory takes a starting
  state** (review follow-up 3), merged over a default whose every key was read off
  a real slice; the comment lists which slice each key came from. The
  notifications slice is deliberately absent, because it is not combined into
  `store/index.ts` (AC-9). Provides `useAppStore` with `getState`, `setState`,
  `subscribe`, `getInitialState` and `destroy`, and works as a selector hook.
- `tests/mocks/localization.ts` — the language and country helper. The fake sits
  on a **`default` key**, because the real module exports a class instance there
  (review follow-up 5).
- `tests/mocks/posthog.ts` — the third-party product-analytics client, on a
  **`default` key** because the wrapper unwraps `.default`. Covers the seven
  methods `utils/posthog.ts` calls: `init`, `identify`, `capture`,
  `captureException`, `reset`, `isFeatureEnabled`, `getFeatureFlag`.
- `tests/mocks/sentry.ts` — the third-party error-reporting client. Covers the
  **seven** symbols this repository imports (review follow-up 2):
  `captureException`, `setUser`, `withScope`, `lastEventId`,
  `captureRequestError`, `captureRouterTransitionStart`, `init`. The comment
  lists the file each one is needed by, so the list stays true.
- `tests/mocks/mockFetch.ts` — the fake network. Takes a list of replies and
  hands them back in order, can hand back a failure, and records the count plus
  the address, method, body and headers of every call. **When the list runs out
  it raises a clear error naming the address and method that were asked for** —
  never an empty result, never a hang.
- `tests/mocks/mocks.test.ts` — checks the helper, the store stand-in and the
  copied cookie names (AC-7, AC-8, AC-10, AC-11).

**Changed — one existing test file.**

- `utils/functions.test.ts` — four of its **ten** replacements now come from the
  kit: the shared store, the language and country helper, the client fetch
  helper, and the cookie manager. The other **six** are untouched (`./Requests`,
  `./history`, `./errorReported`, `./posthog`, `./errorSerialization`,
  `./types/cart`), and a comment records why two of them stay: `./errorReported`
  and `./posthog` are our own wrappers, not the third-party clients the kit
  stands in for. Every existing assertion is unchanged (AC-12).

## How AC-8 was proved (review follow-up 4)

The plan required proof, not assumption, that one registration reaches a module
which loads the store at the moment it is used. The proof goes through the real
consumer:

- The module used is **`utils/fetchData.ts`**, which reads the store with
  `await import("../store")` inside the call, at line 417.
- The stand-in is registered as `vi.mock("store", ...)` — a **different**
  specifier text from the `"../store"` fetchData writes. Both resolve to
  `store/index.ts`, which is the property being proved: the test runner keys a
  replacement by the file it resolves to, not by the text of the import.
- The extra stand-ins that import needed, all local to `tests/mocks/mocks.test.ts`
  (the kit does not stand in for our own wrappers):
  `components/global/AddToCartMessage`, `utils/functions`,
  `store/notifications/reducer`, `services/auth`, `utils/serviceTokens` — plus
  the kit's own cookie stand-in.
- What it observes: `fetchData` returns `{}` the moment it reads
  `LoggingOut: true` from the store, before any network call. A fake network with
  an empty queue is installed as a trap — if the stand-in had not reached
  fetchData, the real store would load, `LoggingOut` would be false, and the run
  would hit that trap and fail loudly.
- **The proof was checked for teeth.** Flipping the stand-in to
  `LoggingOut: false` makes that one test fail (`1 failed | 47 passed`), which
  shows the assertion is not passing vacuously. The file was then put back.

One registration does cover both ways of loading, so no second way was needed in
the kit and no production module was changed.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

New:
- `tests/fixtures/product.ts`
- `tests/fixtures/elastic.ts`
- `tests/fixtures/user.ts`
- `tests/fixtures/cart.ts`
- `tests/fixtures/order.ts`
- `tests/fixtures/address.ts`
- `tests/fixtures/story.ts`
- `tests/fixtures/chat.ts`
- `tests/fixtures/fixtures.test.ts`
- `tests/mocks/cookieManager.ts`
- `tests/mocks/nextHeaders.ts`
- `tests/mocks/fetchData.ts`
- `tests/mocks/store.ts`
- `tests/mocks/localization.ts`
- `tests/mocks/posthog.ts`
- `tests/mocks/sentry.ts`
- `tests/mocks/mockFetch.ts`
- `tests/mocks/mocks.test.ts`

Changed:
- `utils/functions.test.ts`

`git status` shows exactly these paths plus the ticket's own `_specs/` workspace.
No `protected_paths` file changed (IM-5 / AC-15): the cookie manager, the store
and the auth service are read from or imitated, never edited.

## Deviations from plan

- **None in scope, file list, or approach.** All ten steps were followed.
- Four points from `review.md > Required Follow-up Actions` were carried out
  here, as the review directed. Each sits inside a file the plan already listed,
  so none of them widened the change: hand-written stand-ins (1), the seven
  error-reporting symbols instead of the plan's mis-counted three (2), a store
  stand-in factory that takes a starting state (3), and the AC-8 proof through a
  different specifier (4). Follow-up 5 (the localization stand-in's `default`
  key) is done too. Follow-up 6 belongs to `/verify`.
- **One small thing worth recording.** The old hand-written cookie mock in
  `utils/functions.test.ts` used `COOKIE_NAMES: { USER_DATA: "USER_DATA" }`. The
  real name is `"User-Data"`. Moving that file onto the shared stand-in silently
  corrects it. No assertion depended on the wrong value, so nothing had to
  change, but it is exactly the kind of drift this ticket exists to stop.

## Validation run during implementation

Profile `tests-and-types` (`project-config.yaml > validation_profiles`), run
locally:

- `pnpm test:run` — **pass.** 3 test files, 48 tests, all passing, in 3.8s. The
  run finishes on its own, with no watcher and no timer left behind.
- `pnpm exec tsc --noEmit` — **pass.** No output, exit zero.
- `pnpm lint` — **pass.** 0 errors, 39 warnings, and **none of the warnings comes
  from `tests/` or from `utils/functions.test.ts`** (checked by filtering the
  output). All 39 pre-date this ticket.

Also checked by hand:

- The falsification run described above (`1 failed | 47 passed`), to show the
  AC-8 proof is real.
- `vitest.config.mts` is untouched, so the coverage list is unchanged (AC-14,
  C-4).
- The unused-file check (`pnpm knip`) was **not** run. It is deliberately outside
  this profile, and it will name every new file until the next phase imports them
  (OQ-6). That is expected, not a fault.
