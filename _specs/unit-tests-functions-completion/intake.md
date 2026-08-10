---
ticket: unit-tests-functions-completion
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Intake — unit-tests-functions-completion

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-functions-completion` — Phase 12 of the test roadmap
(`docs/testing/UNIT_TEST_ROADMAP.md`, Tier 1 — Pure helpers). No ClickUp task and
no GitHub issue.

## Ticket Summary

`utils/functions.tsx` has a test file already, but it covers only 3 of its 17
exports. This ticket extends `utils/functions.test.ts` so the whole file is
tested. Nothing in `utils/functions.tsx` itself changes — if a function is hard
to test, that is written down as a finding, not fixed here.

## Ticket Metadata

- id / slug: `unit-tests-functions-completion`
- title: Complete the unit tests for `utils/functions.tsx`
- owner: developer
- created: 2026-08-10
- links: none

## User Story

> As a developer working on Trydos, I want every exported function in
> `utils/functions.tsx` covered by unit tests, so that a change to price
> rounding, cart loading, product compare or error logging is caught before it
> reaches a user.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the roadmap gives the goal ("extend the existing test file to full
  coverage") but no numbered criteria. The Tier 1 rule in
  `docs/testing/UNIT_TEST_ROADMAP.md` says what "covered" means here: test every
  exported function against its happy path plus the edges that really happen —
  empty input, a missing field, `null` / `undefined`, a number out of range, the
  wrong type. That is enough for `/spec` to write the criteria. It is not enough
  to skip `/spec`.

## Test Cases Presence Check

- Present? no
- Notes: no test cases came with the request. The shape they must take is
  already fixed by `docs/testing/UNIT_TESTING.md` — where the file goes, how to
  replace a module with a stand-in, no real network or cookie writes, and pin
  anything ambient such as the time zone. `/spec` writes the cases; `/plan`
  decides how they are grouped.

## Missing Information

- Nothing blocks the start. Three points are open, and each one belongs to a
  later stage, not to intake:
  - What "full coverage" has to mean as a number, if anything. There is no pass
    mark for coverage in this repo on purpose, so `/spec` has to say what the
    criteria measure instead.
  - Whether the behaviour this ticket pins is the behaviour the product wants.
    Reading the file turned up several places where the code does not do what it
    reads like it should. The repository rule is clear — a test ticket records a
    finding and never changes the file it tests — so this ticket pins what the
    code does today and writes the findings down. Changing any of it is a
    separate ticket.
  - Whether the current test file's browser stand-in is good enough for the rest
    of the functions. `/research` settles that.

## Readiness Status

`READY`

- Justification: the request names one file, `utils/functions.tsx`, and that file
  already has a test file to extend. The conventions are written down
  (`docs/testing/UNIT_TESTING.md`), the shared stand-ins exist (`tests/mocks/`,
  `tests/fixtures/`), and the file is already in the coverage list in
  `vitest.config.mts`, so no config change is needed. The starting point is
  measured, not guessed: `pnpm test:coverage` reports 13.42% of statements and 3
  of 28 functions covered. Nothing outside this ticket has to land first — Tier 0
  (Phases 1 and 2) is closed. The open points above are for `/research` and
  `/spec` to answer and none of them stops the work from starting.
