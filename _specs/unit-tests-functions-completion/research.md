---
ticket: unit-tests-functions-completion
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-10
links:
  clickup:
  github:
---

# Research — unit-tests-functions-completion

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Extend `utils/functions.test.ts` so every export of `utils/functions.tsx` is
covered by unit tests, without changing `utils/functions.tsx` itself.

## What the file holds today

`utils/functions.tsx` is 486 lines and has **18 exports** — 17 functions and one
constant:

| Line | Export | Covered today? |
|---|---|---|
| 21 | `SSRDetect` | yes |
| 50 | `translateFunction` | only the English path |
| 70 | `getUserChat` | yes |
| 75 | `getUserStories` | no |
| 85 | `_isStoreLastJson` | no |
| 89 | `getConfiguredImage` | no |
| 145 | `RoundPrice` | no |
| 196 | `onClickSearchHistory` | no |
| 214 | `getOldCart` | no |
| 258 | `getCart` | no |
| 297 | `GetCartOreview` | no |
| 318 | `LogError` | no |
| 381 | `storeError` | no |
| 401 | `WaitForCondition` | no |
| 420 | `COMPARE_CHANGED_EVENT` (a constant) | no |
| 427 | `addToCompare` | no |
| 447 | `removeFromCompare` | no |
| 476 | `areProductsEqual` | no |

There are also four functions the file keeps to itself, reachable only through
the exports above: `loadTranslations` (28), `preciseMultiply` (108),
`toFixedUp` (127) and `notifyCompareChanged` (421).

**Why this file matters:** 260 files import `utils/functions` by name, and 267
counting relative imports. `RoundPrice` alone is used 139 times across 46 files.
A change here reaches most of the storefront.

**The measured starting point** (from the coverage report, not an estimate):
13.42% of statements, 5.14% of branches, 3 of 28 functions, 13.36% of lines.

## Relevant directories

- `utils/` — holds the file under test. Its neighbours matter because
  `utils/functions.tsx` imports from six of them: `./fetchData`,
  `./cookies/cookie-manager`, `./Requests`, `./history`, `./errorReported`,
  `./posthog`, `./errorSerialization` and `./types/cart`.
- `tests/mocks/` — the shared stand-ins from Phase 2. Four are already used by
  the current test file (`store`, `localization`, `fetchData`, `cookieManager`);
  two more are relevant here and are not used yet: `mockFetch.ts` (a fake
  network that records calls) and `sentry.ts`.
- `tests/fixtures/` — builders for product, cart, user, order and more. Useful
  for `areProductsEqual` and the cart functions.
- `store/` — read only to understand what state the functions read
  (`userProfile`, `user`, `userChat`, `userStories`, `LoggingOut`, `currency`,
  `language`, `isRegisteringReady`). Nothing here is changed.
- `public/translations/` — the three files `translations.ar.js`,
  `translations.tr.js` and `translations.ku.js` that `translateFunction` loads on
  demand. They are large (around 416KB together).
- `docs/testing/` — the conventions (`UNIT_TESTING.md`) and the phase list
  (`UNIT_TEST_ROADMAP.md`, Phase 12).
- `components/Cart/`, `components/Home/Search/`, `services/home.ts` — read only
  to see how the untested functions are called in real code.

## Relevant config files

- `vitest.config.mts` — the test runner setup: jsdom, `globals: true`, the React
  plugin and path resolution. Its `coverage.include` list **already contains
  `utils/functions.tsx`**, so this ticket needs no change there.
- `package.json` — the three commands: `test` (watch), `test:run` (run once),
  `test:coverage` (run once with coverage).
- `tsconfig.json` — the path aliases (`store`, `utils/...`, `tests/...` resolve
  from the repo root) and `vitest/globals` in `types`.
- `eslint.config.mjs` — line 86 turns the two i18n rules off for any file named
  `*.test.*` or `*.spec.*`, and only those two rules. Everything else still
  applies to a test file.
- `.claude/project-config.yaml` — read to understand two things and changed in
  neither: `protected_paths` (see below) and the validation profiles. The
  `tests-and-types` profile exists and runs `unit-tests` + `typecheck` + `lint`.
- **`protected_paths`:** `utils/functions.tsx` is **not** protected, and neither
  is `utils/functions.test.ts`. The list does contain `utils/cookies/**`, but
  this ticket only replaces the cookie manager with the shared stand-in and never
  opens the real file. So the test stays next to the code it tests, and no
  protected-path full stop applies.

## Possibly affected services

Nothing in the running product changes — this ticket adds a test file and edits
another. The services below are named because the tests must replace them, and a
replacement that is wrong would make a test pass for the wrong reason:

- `utils/fetchData` — `getOldCart`, `getCart` and `GetCartOreview` all call it.
  Replaced by `tests/mocks/fetchData.ts`.
- `utils/cookies/cookie-manager` — `getUserStories`, `LogError`, `addToCompare`
  and `removeFromCompare` read or write cookies. Replaced by
  `tests/mocks/cookieManager.ts`, which keeps its cookies in a plain object and
  exposes it as `__jar`.
- `store` (`store/index.ts`) — nearly every function reads it through
  `useAppStore.getState()`. Replaced by `tests/mocks/store.ts`.
- `services/localization` — `translateFunction` reads the app language from it on
  the server side. Replaced by `tests/mocks/localization.ts`.
- `utils/errorReported`, `utils/posthog`, `utils/errorSerialization`,
  `utils/history`, `utils/Requests` — all called by `LogError`. These are our own
  wrappers, not third-party clients, so the current test file replaces them
  locally rather than from the shared kit.
- The browser's own `fetch` — `storeError` posts to
  `/api/internal/mobile-error-log`. `tests/mocks/mockFetch.ts` stands in for it
  and records the call.

## Test / validation commands available

Listed, not run (this stage runs nothing):

- `pnpm test:run` — runs the whole suite once and exits. This is the `unit-tests`
  check in `.claude/project-config.yaml`.
- `pnpm test:coverage` — runs once with coverage; prints a summary and writes
  `coverage/index.html`.
- `pnpm test` — watch mode. Useful while writing, never in a gate: it does not
  exit.
- `pnpm exec tsc --noEmit` — the `typecheck` check.
- `pnpm lint` — the `lint` check.
- `pnpm knip` — unused files, exports and dependencies. Note the
  `tests-and-types` profile leaves it out on purpose, because adding files is
  normal work for a test ticket.
- Profiles available: `standard-frontend`, `tests-and-types`, `full-build`.

## Risks and unknowns

- **A test can hang the suite for five minutes.** `getOldCart` (214) and
  `getCart` (258) both sit in `while (!userId && waited < 300000)` with a
  one-second sleep. Called with no user id in the store, they wait 300 real
  seconds. High likelihood — the default store stand-in has `user: null` and no
  `userProfile` at all, so this is what a first, naive test hits.
- **A test can hang forever.** `WaitForCondition` (401) reads
  `isRegisteringReady` **once, before** its promise, then its repeating check
  re-reads that frozen copy, never the store. If the flag is false at call time,
  the promise never settles and the repeat never stops. There is no timeout — the
  comment at line 412 mentions one but no code does it.
- **`getOldCart` cannot see the user arrive.** Its `userId` is a `const`
  computed outside the loop, so the loop only sleeps. `getCart` does the same job
  with `let` and re-reads the store inside the loop. The two look identical and
  behave differently.
- **The current browser stand-in is too thin.** The existing test file replaces
  the whole `window` with `{ location: { pathname: "/sy-en" } }`. That object has
  no `dispatchEvent`, no `navigator` and no `addEventListener`, so
  `addToCompare`, `removeFromCompare` and `LogError` would fail against it for a
  reason that has nothing to do with the code being wrong.
- **The file does work when it is imported.** Lines 45–48 read
  `window.location.pathname` at import time. Every test that reloads the module
  must set a believable path first. Line 54 does
  `pathname.split("/")[1].split("-")[1]` with no guard, so an empty path throws.
- **The translation cache is module-level.** `vi.resetModules()` empties it, so a
  test about the "already loaded" fast path has to warm it inside the same load.
- **Loading the real translation files is expensive.** Around 416KB across three
  files, pulled into every test that touches the non-English path.
- **A 100% coverage target may be unreachable.** Some branches look like they can
  never run — `RoundPrice` (176) falls back to the store language behind
  `language ?? …`, but the parameter has a default of `"en"`, so the fallback is
  dead. 22 of the 46 files that call `RoundPrice` pass a language; the rest get
  `"en"` whatever the store says. An acceptance criterion written as a percentage
  could therefore be impossible to meet.
- **Noise in the output.** `getUserStories` (77) prints the user's story state
  and the whole `User-Data` cookie to the console on every call.
- **`removeFromCompare` announces a change that did not happen.** When the slug
  matches neither cookie it returns `null` but still fires
  `COMPARE_CHANGED_EVENT` (468).
- **`onClickSearchHistory` returns something it did not store.** On a repeat
  search it stores nothing but still returns the value in front of a list that
  already contains it, so the caller
  (`components/Home/Search/SearchIcon.tsx:532`) shows a duplicate. The same
  function parses `localStorage` with no guard, so a corrupt value throws.
- **The rule against fixing.** `docs/testing/UNIT_TESTING.md` says a test ticket
  records a finding and never changes the file under test. Everything above is
  therefore something to pin and write down, not to repair here. The risk is that
  the ticket quietly drifts into fixing.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `protected_paths` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | What does "full coverage" have to mean here — a coverage percentage, or every export having at least one test that proves something? | The repository has no pass mark for coverage on purpose, and some branches look unreachable. A criterion written as a number could be impossible to meet, and `/verify` has to be able to give each criterion a result. |
| OQ-2 | The reading turned up several places where the code does not do what it looks like it should. Do the tests pin what the code does today, and is changing any of it out of scope for this ticket? | This decides whether the ticket stays a test ticket. The conventions already say a test ticket does not change the file it tests, but that has to be written into the spec, not assumed. |
| OQ-3 | Where do those findings get written down so they are not lost when this ticket closes? | If they only live in a test comment, nobody acts on them. The spec has to name the place (for example `implement.md`, or new tickets) so `/verify` can check it happened. |
| OQ-4 | Is the non-English side of `translateFunction` in scope, and if so may the three translation files be replaced by stand-ins? | Loading them for real costs around 416KB per test file. Leaving the path untested leaves the app's whole translation entry point unproven. |
| OQ-5 | How should the three slow or never-ending functions (`getOldCart`, `getCart`, `WaitForCondition`) be covered without a suite that takes minutes or hangs? | This is the difference between a suite that runs in seconds and one nobody runs. The answer may need the approach first — if so, push it to `/plan` with this id. |
| OQ-6 | May the shared setup inside `utils/functions.test.ts` be reworked, given the three tests already passing depend on it? | The current `window` stand-in blocks most of the remaining functions. Reworking it touches tests that already pass, so it needs saying out loud rather than discovering at `/implement`. |
| OQ-7 | Which validation profile does this ticket run at `/verify`? | `/plan` must name one and `/verify` resolves it (VP-1). `tests-and-types` exists for exactly this kind of ticket, but the choice has to be recorded. |

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
