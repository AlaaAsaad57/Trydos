---
ticket: test-fixtures-and-mock-factories
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-09
links:
  clickup:
  github:
---

# Research — test-fixtures-and-mock-factories

> Read-only phase. **No implementation is allowed in this command.**

Two words are used throughout. A **fixture** is a small function that builds a
sample object for a test to use, where the caller can override any field. A
**mock** is a stand-in that replaces a real module during a test, so the test
never reaches the network, the browser cookies, or a real database.

## Goal

Build the shared test kit — sample-data builders, reusable module stand-ins, and
one helper that fakes network calls and records what was asked for — so the other
118 test phases all use the same setup instead of each inventing their own.

## Relevant directories

- `tests/` — **does not exist right now.** Phase 1 deleted the only two files that
  were in it (`tests/testUtils.ts` and `tests/unitTests/init.test.tsx`). This
  ticket creates the folder again. Nothing in `.gitignore` hides it, so what is
  put there will be committed.
- `utils/types/` — holds the only hand-written shapes for orders, cart items and
  chat messages: `OrderInterface.ts`, `cart.tsx`, `chat/index.ts`. These are the
  best source for those fixtures.
- `types/` — holds `listing.ts`, which defines `ListingProduct`. This is the only
  properly typed product shape in the whole app.
- `services/elastic/` — the search code. `elasticSearch.ts` shows the raw shape
  the search engine returns (`response.hits.hits[]._source`, with a `sort` value
  on each hit). This is a **different** product shape from `ListingProduct`.
- `utils/cookies/` — `cookie-manager.ts`, one of the modules that has to be
  replaced in almost every test. It is a `protected_paths` folder, so this ticket
  only reads it.
- `store/` — the shared application state. Nine slices are combined in
  `store/index.ts`: auth, chat, comments, Details, homepage, listing, search,
  Cart, luck.
- `serverRequests/` — server-side data fetching. `stories.ts` carries a fuller
  story shape than the store does. This is a `protected_paths` folder; read only.
- `docs/testing/` — `UNIT_TESTING.md` (the conventions this ticket must follow)
  and `UNIT_TEST_ROADMAP.md` (where this phase is defined).
- `_specs/unit-test-harness-and-coverage/` — the closed Phase 1 ticket. Useful
  for seeing what was already decided and why.

## Relevant config files

- `vitest.config.mts` — the test runner setup. Already has a coverage section
  using `v8`, reporters `text` and `html`, and an `include` list that currently
  names one file: `utils/functions.tsx`. It has **no `setupFiles` entry**; the
  roadmap puts that off until Phase 89.
- `package.json` — holds `test` (keeps running and watches; never use it in a
  gate), `test:run` (runs once and exits), and `test:coverage`. Already installed
  and useful here: `vitest`, `jsdom`, `@vitest/coverage-v8`, `@testing-library/react`,
  `@testing-library/dom`. Not installed: `@testing-library/jest-dom`,
  `@testing-library/user-event`, `msw` — all three belong to Phase 89.
- `tsconfig.json` — maps `"*": ["./*"]`, and `vite-tsconfig-paths` is loaded in
  `vitest.config.mts`. That means `tests/fixtures/...` and `tests/mocks/...` can
  be imported by their plain path from anywhere. **No new path alias is needed.**
- `eslint.config.mjs` — the two i18n rules (`local/translate-key-exists` and
  `i18next/no-literal-string`) only apply to `app/`, `components/`, `services/`,
  `utils/` and `store/`. The `tests/` folder is outside that list, so English text
  inside a fixture is not a lint problem. Phase 1 also switched both rules off for
  any file named `*.test.*` or `*.spec.*`.
- `.claude/project-config.yaml` — defines the `unit-tests` check (`pnpm test:run`)
  and the `tests-and-types` group (unit tests + type check + lint). It also lists
  `protected_paths`. Read only; this ticket must not change it.
- `.gitignore` — ignores `/coverage/*`. It does **not** ignore `tests/`.
- There is **no knip config file** at all; `pnpm knip` runs on its defaults.

## Possibly affected services

Nothing that runs in production is affected. This ticket adds test-only files.
The list below is what the new stand-ins have to imitate, and what would notice
if a stand-in described a module wrongly.

- **The shared state store (`store`)** — reached through `useAppStore.getState()`.
  It is imported by name as `"store"` in 212 places, and loaded at the moment it
  is used as `import("../store")` in exactly one file, `utils/fetchData.ts`.
- **`utils/fetchData`** — the client-side fetch path. Exports `fetchData` and
  `abortInFlightForLogout`, plus a `ServerType` list of nine backend names.
- **`utils/cookies/cookie-manager`** — exports `getCookie`, `setCookie`,
  `deleteCookie`, `getCookieServer` (server-only; needs `next/headers`),
  `clearHashedUserId`, `setLocaizationCookies` (the spelling in the real export),
  `COOKIE_NAMES` (about twenty names, including `MARKET-TOKEN`,
  `MARKET-REFRESH-TOKEN`, `User-Data`, the legacy `DEVICE-TOKEN` and `VISIT-ID`),
  and `HTTPONLY_COOKIE_NAMES` (a `Set`).
- **`next/headers`** — used by 21 files. In practice only two functions are
  called: `cookies()` (26 times) and `headers()` (twice).
- **`services/localization`** — a single exported object with `GetAppLanguage()`
  and `GetAppCountry()`; both read the store.
- **`posthog-js`** — loaded only when it is first needed, and only when the app is
  running in production. During a test run it already does nothing.
- **`@sentry/nextjs`** — imported in exactly one file, `utils/errorReported.tsx`.
- **`fetch`** — called as a plain global, never through a wrapper library: three
  times in `utils/fetchData.ts` and once in `serverRequests/ServerFetch.tsx`.

None of these files are changed by this ticket. Everything listed in
`protected_paths` was read and nothing was touched.

## Test / validation commands available

Listed here only. None of them were run during research.

- `pnpm test:run` — runs the test suite once and exits. This is the `unit-tests`
  check used by the gates.
- `pnpm test` — watches for changes and never exits. Must not be used in a gate.
- `pnpm test:coverage` — runs once and writes a coverage report to `coverage/`.
- `pnpm exec tsc --noEmit` — the `typecheck` check.
- `pnpm lint` — the `lint` check.
- `pnpm knip` — reports unused files, exports and dependencies. It is a defined
  check but is **deliberately left out** of the `tests-and-types` group.
- `pnpm build` — the `build` check. Not relevant here; no runtime code changes.

The group this ticket is expected to name is **`tests-and-types`** (unit tests +
type check + lint). It already exists in `.claude/project-config.yaml`.

## Risks and unknowns

- **The kit gets used 118 more times, so a wrong shape spreads.** If a fixture
  describes an object in a way the real backend never returns, every later phase
  inherits that mistake and the tests still pass. Impact: high. Likelihood:
  medium. What reduces it: build each fixture from a shape that is written down
  in the repository, not from memory.
- **There is no single product shape.** The app has a tidied-up one
  (`ListingProduct` in `types/listing.ts`) and the raw one the search engine
  returns (`hits.hits[]._source`). Everywhere else a product is simply `any`.
  Guessing one shape for both would be wrong for one of them. Impact: high.
  Likelihood: high if not decided. See OQ-1.
- **One module loads the store late.** `utils/fetchData.ts` loads the store at the
  moment it is used rather than at the top of the file. A stand-in registered
  under the name `"store"` is expected to cover this too, because both names point
  at the same file — but this has not been proved, and Tiers 3 to 6 all depend on
  it. Impact: high. Likelihood: low. See OQ-2.
- **The one existing test carries a wrong cookie name.** `utils/functions.test.ts`
  stands in for `COOKIE_NAMES` with `{ USER_DATA: "USER_DATA" }`, while the real
  value is `"User-Data"`. Moving that test onto a shared stand-in that uses the
  real names is the point of the exercise, but it may change how that test
  behaves. Impact: low. Likelihood: medium.
- **`pnpm knip` will report the new files as unused.** Nothing imports a fixture
  until Tier 1 starts. `knip` is not part of the `tests-and-types` group, so it
  will not block the gate, but anyone running it by hand will see the report.
  Impact: low. Likelihood: high. See OQ-6.
- **Building more than is needed.** The roadmap names seven modules to stand in
  for. Two of them are used almost nowhere, and one of those already does nothing
  during a test run. Building all seven anyway would add code no test uses.
  Impact: medium. Likelihood: medium. See OQ-3.
- **A finding that belongs to a later phase.** `store/notifications/reducer.ts`
  exists but is **not** combined into `store/index.ts`, even though `CLAUDE.md`
  lists notifications as a slice. This affects roadmap Phases 38 and 41. It is
  recorded here so it is not lost; fixing it is not this ticket's job. See OQ-7.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `protected_paths` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | The roadmap asks for one "product" fixture, but the app has two real product shapes: the tidied-up `ListingProduct` and the raw shape the search engine returns. Is this one fixture or two? | Tiers 1 and 6 both need a product. One fixture forced to cover both shapes would be wrong for whichever one it bends to fit. |
| OQ-2 | Does a single stand-in registered under the name `"store"` also cover `utils/fetchData.ts`, which loads the store late with `import("../store")`? | If it does not, the fetch phases (Tier 3) and every service phase (Tier 6) need a second way to do it, and that has to be written into the kit now rather than discovered later. |
| OQ-3 | The roadmap names seven modules to stand in for. Two of them — the product-analytics one and the error-reporting one — are used in very few places, and the analytics one already does nothing during a test run. Are all seven built now, or only the ones a test actually needs? | Building a stand-in nothing uses is extra code with no benefit, and it goes against the project's standing rule to make the smallest change that meets the requirement. |
| OQ-4 | Does the cookie stand-in include the server-only half (`getCookieServer`, which needs `next/headers`) now, or only when Tier 2 starts? | Tier 1 does not need it. Including it early means guessing how the server half should behave before any test asks for it. |
| OQ-5 | Does the coverage `include` list in `vitest.config.mts` change in this ticket? | Fixtures and stand-ins are test tooling, not code being tested. If the answer is no, the acceptance criteria must not ask for a coverage increase, or the ticket cannot pass. |
| OQ-6 | `pnpm knip` will report every new fixture and stand-in as unused until Tier 1 imports them. Is that accepted and written down, or does this ticket have to do something about it? | `knip` is a defined check. It is not in the `tests-and-types` group, so it will not block the gate — but the ticket should say plainly that the report is expected, or the next person will treat it as a fault. |
| OQ-7 | `store/notifications/reducer.ts` is not combined into `store/index.ts`. Should the shared store stand-in include notification state anyway? | If the stand-in invents state the real store does not have, tests will pass against something that does not exist. The wider question belongs to Phases 38 and 41, not here. |
| OQ-8 | What exactly must the fake-network helper record — how many times it was called, the address, the method, the body, or all of these? | Tier 3 has to prove that a failed sign-in causes **exactly one** guest registration and **exactly one** retry. If the helper does not record enough, that test cannot be written and the kit has to be changed again. |

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
