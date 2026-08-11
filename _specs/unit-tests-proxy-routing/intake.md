---
ticket: unit-tests-proxy-routing
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Intake — unit-tests-proxy-routing

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-proxy-routing` — Phase 4 of the test roadmap
(`docs/testing/UNIT_TEST_ROADMAP.md`, Journey 1 — Reach the page). No ClickUp
task and no GitHub issue.

## Ticket Summary

`proxy.ts` runs on every request and decides which locale the user lands on. It
has no test file today. This ticket writes the first tests for it: the language
it picks, the country it picks, the redirects it sends, how it treats crawlers,
and the cookies it leaves behind. Nothing in `proxy.ts` itself changes — if a
part of it is hard to test, that is written down as a finding, not fixed here.

## Ticket Metadata

- id / slug: `unit-tests-proxy-routing`
- title: Unit tests for the proxy — locale routing, country detection and bot handling
- owner: developer
- created: 2026-08-10
- links: none

## User Story

> As a developer working on Trydos, I want the locale routing in `proxy.ts`
> covered by tests, so that a change to language or country handling cannot make
> the whole site unreachable for a language before anyone notices.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the roadmap names the areas to cover — locale detection for `en`, `ar`,
  `tr` and `ku` with `en` as the default; country detection with `gb` as the
  default; the redirect and rewrite rules into `app/(client)/[lang]/`; bot
  detection; the locale cookies, which are not HttpOnly on purpose; and the
  `config.matcher`. That is a list of areas, not numbered criteria. It is enough
  for `/spec` to write them, and not enough to skip `/spec`.

## Test Cases Presence Check

- Present? no
- Notes: no test cases came with the request. Their shape is already fixed by
  `docs/testing/UNIT_TESTING.md` — where a test file goes, how to replace a
  module with a stand-in, and no real network. Two rules from the roadmap apply
  to this ticket in particular. First, `proxy.ts` is a `protected_paths` file, so
  the test goes in a `tests/` mirror, never next to it — a new file inside the
  protected glob would trigger the protected-path full stop (GU-2 / IM-5).
  Second, the tests describe `develop`, not `main`: `main` carries a logo page
  and a proxy gate that `develop` does not, and that gate must not be written
  into a test.

## Missing Information

- Nothing blocks the start. Four points are open, and each one belongs to
  `/research` or later, not to intake:
  - **The proxy calls a backend.** `getCountriesForMiddleware` serves a list of
    countries from memory and, when that list is stale, starts a background
    `fetch` to `BACKEND_URL/countries` that nobody waits for. A test must never
    let that reach a real address, and the in-memory cache lives at module level,
    so it survives from one test to the next. `/research` settles how to stand it
    in.
  - **Which runtime the tests run in.** The shared setup runs tests in `jsdom`,
    but `proxy.ts` is server code and uses `NextRequest` / `NextResponse` from
    `next/server` plus `ipAddress` from `@vercel/functions`. Whether it needs a
    different environment for this file is a `/research` question.
  - **How much of the file is one honest ticket.** The decision at intake is one
    ticket for the whole file. The roadmap allows `/research` to split it if 598
    lines of routing plus crawler handling turn out not to fit, and that stays
    the escape hatch.
  - **A wrinkle in the coverage tool.** `pnpm test:coverage` prints a
    `PARSE_ERROR` while it maps a file that has no tests, then finishes and
    reports normally. It does not fail the run. `/research` should confirm it
    does not touch `proxy.ts` before anyone reads a number from the report.

## Readiness Status

`READY`

- Justification: the request names one file, `proxy.ts`, and that file already
  sits in the coverage list in `vitest.config.mts`, so no settings change is
  needed to see the number move. The conventions are written down
  (`docs/testing/UNIT_TESTING.md`), and the shared stand-ins and the render
  helper exist (`tests/mocks/`, `tests/fixtures/`, `tests/render.tsx`). Nothing
  outside this ticket has to land first — Phases 1, 2 and 3 are done, and the
  suite is green today: `pnpm test:run` reports 6 files and 169 tests passing.
  The starting point is measured, not guessed: `proxy.ts` has no test file, so it
  reports 0%. The open points above are for `/research` and `/spec` to answer,
  and none of them stops the work from starting.
