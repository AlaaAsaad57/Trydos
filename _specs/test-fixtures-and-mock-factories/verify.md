---
ticket: test-fixtures-and-mock-factories
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Verify — test-fixtures-and-mock-factories

> Final validation and impact review before the ticket is closed.

Checked on branch `ticket/test-fixtures-and-mock-factories`, at depth `all-ac`:
every one of the fifteen acceptance criteria has a result. Nothing was changed —
this gate only reads and runs checks, and it made no commit (VF-7 / VF-10).

## Checks performed

- Validation profile: `tests-and-types`

The profile requires three checks. Each command below was read from
`project-config.yaml > validation_checks` — none was written here (VP-4) — and
run locally, with no pipeline and no outside runner.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | A builder exists for each of the eight object groups. Read the exports of `tests/fixtures/`: product, user, cart, order, address, story, chat message, search-engine response — fifteen builder functions across eight files. | read-only inspection | — | All eight groups present. | pass |
| AC-2 | Every builder called with no arguments returns a complete object. `fixtures.test.ts` runs this over all fourteen builders in one table. | `pnpm test:run` | 0 | 48 tests passed. | pass |
| AC-3 | Overrides change only the fields named. Covered by the override tests, including `""`, `0`, `null` and `[]`, plus a check that a nested override stays whole. | `pnpm test:run` | 0 | 48 tests passed. | pass |
| AC-4 | Two product builders, each matching its own real shape. `buildListingProduct` follows `types/listing.ts` and the object `normalizeListingProduct.ts` really builds (brand is `{id, icon, is_verified}`, with no `name` — matching production). `buildSearchEngineProduct` follows `CustomProduct` in `services/elastic/helpers.ts`. | read-only inspection | — | Both present, both traced to their source. | pass |
| AC-5 | A reusable stand-in for all seven named modules: server-request reader, cookie manager, client fetch helper, shared store, language and country helper, product-analytics client, error-reporting client. | read-only inspection | — | Seven stand-in files, plus the fake network helper. | pass |
| AC-6 | Each stand-in provides everything the real module makes available. Judged against the reading approved at `/review` — see the note below. Checked module by module against the real runtime exports. | read-only inspection | — | Our own five: complete. The two third-party ones: complete for what this repository imports. | pass |
| AC-7 | The cookie stand-in reports the real cookie names. The drift test loads the **real** module and compares every name and value, in both directions, plus the HttpOnly set. | `pnpm test:run` | 0 | Comparison test passed. | pass |
| AC-8 | The store stand-in works for a module that loads the store late. Proved through the real `utils/fetchData.ts`, not assumed. | `pnpm test:run` | 0 | Passed, and shown to have teeth (see below). | pass |
| AC-9 | The store stand-in holds no state the real store does not have. All twelve default keys were traced to a real slice; the notifications slice is absent because it is not combined into `store/index.ts`, and a test asserts that. | `pnpm test:run` + read-only inspection | 0 | No invented state. | pass |
| AC-10 | The fake network queues replies, returns them in order, and can return a failure. | `pnpm test:run` | 0 | Passed. | pass |
| AC-11 | The fake network records the call count and each call's address, method and body. | `pnpm test:run` | 0 | Passed. | pass |
| AC-12 | The existing test file uses the shared stand-ins and still passes, with every assertion unchanged. Four of its ten replacements were swapped; six stay. | `pnpm test:run` | 0 | Its 3 tests still pass; only the mock block changed. | pass |
| AC-13 | The whole suite passes with no network access and the command finishes on its own. | `pnpm test:run` | 0 | 3 files, 48 tests, 3.6s, exited by itself. | pass |
| AC-14 | The type check and the lint check pass, and the coverage list is unchanged. | `pnpm exec tsc --noEmit` · `pnpm lint` | 0 · 0 | No type errors. 0 lint errors. `vitest.config.mts` untouched. | pass |
| AC-15 | No production file changed and no `protected_paths` file changed. | `git status --porcelain` | 0 | Only `tests/`, `utils/functions.test.ts` and this ticket's `_specs/` folder. | pass |

**Result: 15 of 15 acceptance criteria pass.**

### A note on how AC-6 was judged (review follow-up 6)

`spec.md` AC-6 says a stand-in provides "everything the real module makes
available". `/review` approved a narrowed reading for the two third-party
modules, because they export hundreds of symbols and copying them all would be
code no test ever calls. AC-6 is recorded against that approved reading:

- **Our own five modules — the whole runtime surface.** Checked against the real
  exports:
  - cookie manager — all eight runtime exports covered (`COOKIE_NAMES`,
    `HTTPONLY_COOKIE_NAMES`, `getCookieServer`, `getCookie`, `setCookie`,
    `deleteCookie`, `clearHashedUserId`, `setLocaizationCookies`), the server-only
    half included.
  - shared store — `useAppStore`, its only runtime export.
  - client fetch helper — `fetchData` and `abortInFlightForLogout`, both of them.
  - language and country helper — its `default` export.
  - server-request reader — `cookies`, `headers`, `draftMode`.
  Types (`CookieOptions`, `UserData`, `ServerType`, `DashboardShopInfo`) are
  erased when the code compiles, so no stand-in can provide them. That is not a
  gap.
- **The two third-party ones — what this repository imports.** The
  product-analytics client: the seven methods `utils/posthog.ts` calls. The
  error-reporting client: the seven symbols imported across `utils/errorReported.tsx`,
  `app/global-error.tsx`, `instrumentation.ts`, `instrumentation-client.ts` and
  the three `sentry.*.config.ts` files. The plan quoted three for the second one;
  `/implement` followed the rule rather than the number, as `/review` required.

### A note on the AC-8 proof

The proof runs the real `utils/fetchData.ts`, which reads the store with
`await import("../store")` inside the call. The stand-in is registered as
`"store"` — a different text from the one the module writes — and both resolve to
`store/index.ts`. `implement.md` records that the proof was falsified on purpose:
flipping the stand-in's state made that one test fail (`1 failed | 47 passed`),
which shows it is not passing for free. It was then put back, and the suite is
green. One registration does cover both ways of loading, so the kit needed no
second mechanism and no production module was changed.

## Commands run

- `pnpm test:run` (check `unit-tests`, `pass_when: exit-zero`)
  ```
  RUN  v4.1.10 C:/Users/DELL/Desktop/workspace/TrydosApp/trydos

   Test Files  3 passed (3)
        Tests  48 passed (48)
     Duration  3.64s
  exit code 0
  ```

- `pnpm exec tsc --noEmit` (check `typecheck`, `pass_when: exit-zero`)
  ```
  (no output)
  exit code 0
  ```

- `pnpm lint` (check `lint`, `pass_when: exit-zero`)
  ```
  ✖ 39 problems (0 errors, 39 warnings)
  exit code 0
  ```
  All 39 warnings pre-date this ticket. None comes from `tests/` or from
  `utils/functions.test.ts` — checked by filtering the output, which returned
  nothing.

- `git status --porcelain`, run before and after the three checks
  ```
   M utils/functions.test.ts
  ?? _specs/test-fixtures-and-mock-factories/
  ?? tests/
  ```
  Identical both times, and `git diff --stat` was identical too, so the checks
  changed no file (VP-2).

The unused-file check (`pnpm knip`) is deliberately outside this profile and was
not run. It will name every new file until the next phase imports them (OQ-6).
That is expected and was agreed at `/spec`; it is not a fault.

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **No.**
- The changed paths are `tests/**` (all new) and `utils/functions.test.ts` (a
  test file). None of them matches an entry in
  `project-config.yaml > protected_paths`.
- The kit **describes** several protected modules from the outside — the cookie
  manager (`utils/cookies/**`), the shared store (`store/index.ts`) and the auth
  service (`services/auth.ts`) — but only reads from or imitates them. The only
  place that loads a real protected module is the cookie drift test, and it reads
  it; it writes nothing.
- Runtime impact: **none.** No file that ships to users changed, so there is
  nothing to watch after release. Everything added runs only under the test
  command.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: the ticket owner (single self sign-off; ADR-011, RA-1), after passing
  the comprehension check 4/4 (CG-4), with one integration question (CG-5).
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: the work sits uncommitted on `ticket/test-fixtures-and-mock-factories`.
  Two small things are worth carrying forward, neither of them a fault in this
  ticket:
  1. Moving `utils/functions.test.ts` onto the shared cookie stand-in corrected a
     wrong cookie name in its old hand-written mock (`"USER_DATA"` where the real
     name is `"User-Data"`). No assertion depended on it. This is exactly the
     drift the kit exists to stop, and the drift test now guards it.
  2. `spec.md` FR-5 / AC-6 still carry the wider wording. The reading actually
     used is written down above and in `review.md`, so a later phase reading only
     the spec should read this file too.
