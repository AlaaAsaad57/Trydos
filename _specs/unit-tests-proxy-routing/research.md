---
ticket: unit-tests-proxy-routing
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-10
links:
  clickup:
  github:
---

# Research — unit-tests-proxy-routing

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Write the first tests for `proxy.ts` — the file that runs on every request and
decides which locale the user lands on — without changing a line of it.

## Relevant directories

- `proxy.ts` (repo root, 598 lines) — the file under test. It exports two things
  and nothing else: `proxy(request)`, the function Next calls on every request,
  and `config`, which says which paths it runs on. Everything else in the file is
  a small helper that is not exported, so a test can only reach it by calling
  `proxy()`.
- `tests/` — where the test file has to go. `proxy.ts` is a protected path, so the
  test goes in the mirror at the repo root of `tests/`, not beside the file. The
  existing layout (`tests/fixtures/`, `tests/mocks/`, `tests/msw/`) is shared
  ground; this ticket adds one test file and takes nothing away.
- `app/(client)/[lang]/` — where the redirects point. Worth knowing: the folder
  is called `[lang]`, but the value it receives is the **pair**, like `gb-en`.
  The proxy always builds `<country>-<language>`.
- `app/api/` — excluded by the matcher, so the proxy never runs on it. This is
  what keeps the follow-up call to `/api/auth/register-device` alive right after
  a logout.
- `app/(special)/`, `app/sitemap-*.xml`, `app/robots.ts` — the paths the proxy
  steps around. Sitemaps get an early exit, and anything with `robots` in it is
  sent to `/robots.txt`.
- `docs/testing/` — `UNIT_TESTING.md` holds the conventions every test follows;
  `UNIT_TEST_ROADMAP.md` holds the phase list and names this ticket as Phase 4.

## Relevant config files

- `vitest.config.mts` — the test settings. Three parts matter here. It runs every
  test in `jsdom`. It sets its own fake environment values (`test.env`) because
  the runner does not read Next's env files. And its coverage `include` already
  names `proxy.ts` on its own line, as well as covering it through the folder
  globs — so this ticket needs no coverage change to make the number move.
- `tests/setup.ts` — runs before every test file. It starts the fake network with
  `onUnhandledRequest: "error"`, so a request nobody wrote a reply for **fails
  the test** instead of going out to the real network. It also replaces
  `next/navigation`, `serverActions/sendOtp` and `serverRequests/radis` for the
  whole run.
- `.claude/project-config.yaml` — read only to understand it, never changed. Two
  things it decides for this ticket: `proxy.ts` is the first entry in
  `protected_paths`, and the `tests-and-types` validation profile is the one this
  kind of ticket names.
- `package.json` — the versions the tests run against: `next` 16.2.11,
  `@vercel/functions` ^3.1.0, `vitest` ^4.1.10, `msw` ^2.15.0.
- `next.config.ts` — not changed, but it holds the image host allow-list that the
  fake `example.com` media address in `vitest.config.mts` depends on.

## Possibly affected services

Nothing in the running app changes, because this ticket only adds a test file.
These are the parts whose **behaviour the tests describe**, so a wrong assertion
here would give false confidence about them:

- **The locale cookies** — `country`, `lang` and `language`. The proxy writes all
  three, on purpose not HttpOnly, so the browser can read them. Every page that
  picks a language downstream reads them.
- **`userIP`** — written HttpOnly, unlike the locale cookies, because it is
  personal data that page scripts must not read. Server error reporting reads it.
- **`referer`** — written when a visit arrives with a referer or a `utm_source`,
  and skipped when the referer is the site itself.
- **`LOGOUT-GUARD`** — cleared here, and only on a real page render, never on a
  redirect hop. The name is written out as a literal in `proxy.ts` rather than
  imported, because importing the cookie manager would drag `jsonwebtoken` into
  the middleware. A test that asserts the name is what keeps the copy honest.
- **The countries list** — `getCountriesForMiddleware` answers from an in-memory
  cache and, when the cache is stale, starts a `fetch` to
  `${BACKEND_URL}/countries` that nobody waits for. The list decides which
  country prefixes count as valid, so it decides which URLs redirect.
- **Crawlers** — Google, Bing, Facebook and the rest get a different path through
  the file: a 308 to a locale-prefixed URL, and never a country popup.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — runs the suite once and exits. This is the `unit-tests` check
  in the `tests-and-types` profile. Baseline today: 6 files, 169 tests, all
  passing.
- `pnpm test` — watch mode. Useful while writing, never in a gate; it does not
  exit.
- `pnpm test:coverage` — runs once and writes `coverage/index.html`.
- `pnpm exec tsc --noEmit` — the `typecheck` check.
- `pnpm lint` — the `lint` check. The i18n rules are already off for `*.test.*`
  files; every other rule still applies.
- `pnpm knip` — exists as its own check, and the `tests-and-types` profile leaves
  it out on purpose, because adding a file is normal work for a test ticket.

## Risks and unknowns

- **The test runtime may not fit the file.** Every test today runs in `jsdom`,
  and no test file in the repo asks for anything else. `proxy.ts` is server code:
  it uses `NextRequest` and `NextResponse` from `next/server`, plus a deep import
  of `NextURL` from `next/dist/server/web/next-url`. Those need the web `Request`
  and `Response` objects, which a browser-shaped environment does not always
  provide. This is the single most likely thing to cost time. See OQ-1.
- **The file keeps state between tests.** `countriesCache` and `countriesInflight`
  live at module level. A test that fills the cache changes what the next test
  sees, and the order tests run in would start to matter. See OQ-2.
- **A background request could reach the network.** The refresh is started and
  never awaited, so it can land after the test that triggered it has finished.
  `BACKEND_URL` is not in the test settings, so today the address would be
  `undefined/countries`, which fails before it leaves the process — but relying
  on that is luck, not a decision. See OQ-2.
- **The file has no rewrite in it.** The roadmap says "the rewrite and redirect
  rules". Reading the code, there is no `NextResponse.rewrite` call anywhere:
  every path ends in `NextResponse.next()` or `NextResponse.redirect()`. Writing
  a test for a rewrite would mean testing something that does not exist. See
  OQ-4.
- **Some current behaviour looks surprising.** Three examples found while
  reading, none of them fixed here: any path containing the word `robots`
  redirects to `/robots.txt`, so a page called `/gb-en/robots-guide` would go
  there too; a locale with a capital letter gets a 308 to the lower-case form,
  and that redirect response still collects the `Link` preconnect headers; and
  the redirect built for an uppercase locale captures the URL at the moment it is
  made, while the code below keeps editing the same URL object. Under the rules,
  a test ticket pins what the code does today and records the surprise. It never
  fixes it. See OQ-6.
- **The branch matters.** `main` carries a logo page and a proxy gate that
  `develop` does not, and those two are one revertable unit. These tests describe
  `develop`. If anyone writes the staging gate into a test, the test will fail
  the moment the gate is reverted, which is exactly when it should stay green.
- **The two testing documents disagree about coverage.** See OQ-5.
- **Size.** 598 lines in one function with many branches. The decision at intake
  was one ticket, and this research did not find a seam that forces a split — the
  bot path, the cookie writes and the two locale scenarios all run through the
  same call. `/spec` may still find the criteria list too long to be honest, and
  the roadmap allows a re-cut.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `protected_paths` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Which environment do these tests run in — the shared `jsdom` one, or does this file need the Node one? | `proxy.ts` is server code that needs the web `Request` and `Response` objects. If `jsdom` cannot load it, the ticket needs a per-file environment marker, and that is a decision, not an accident. |
| OQ-2 | How does a test stop the background countries request, and how does it clear the in-memory cache between tests? | The cache lives at module level and the request is never awaited. Get this wrong and tests pass or fail depending on the order they run in — the worst kind of flaky. |
| OQ-3 | Does this ticket assert `config.matcher`, and how deeply — that the exact string is unchanged, or that named paths are in or out? | An exact-string check breaks on any harmless edit. A behaviour check needs its own small helper. The spec has to say which, or `/plan` will pick one by default. |
| OQ-4 | The roadmap names "rewrites", but the file has none. Is the scope redirects and pass-through only? | It decides whether a whole class of acceptance criteria exists. Writing one for a rewrite would test something that is not there. |
| OQ-5 | Does this ticket change the coverage `include` list, and which document is right about it? | `docs/testing/UNIT_TESTING.md` says the list names files, not folders. `vitest.config.mts` now names whole folders **and** `proxy.ts`. Both cannot be the rule. Nothing has to change for this ticket to be measured, but the disagreement should be recorded rather than silently followed. |
| OQ-6 | Do the surprising behaviours listed above get pinned by a test, or are they left out of scope with the finding written down? | Pinning them makes an accidental change visible. It also writes today's oddity into the suite as if it were wanted. The spec has to choose on purpose. |

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
