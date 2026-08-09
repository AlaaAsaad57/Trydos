---
ticket: unit-test-harness-and-coverage
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Intake — unit-test-harness-and-coverage

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-test-harness-and-coverage` — Phase 1 of the test roadmap in
`docs/testing/UNIT_TEST_ROADMAP.md`. No ClickUp task and no GitHub issue.

## Ticket Summary

The app has a working test runner but no way to measure what the tests cover, no
written rules for how to write a test, and no way for the workflow to run the
test suite at a gate. This ticket asks for those three gaps to be closed, so the
119 later test phases all start from the same base.

## Ticket Metadata

- id / slug: `unit-test-harness-and-coverage`
- title: Test harness, coverage and conventions
- owner: developer
- created: 2026-08-09
- links: none

## User Story

> As a developer, I want the test suite to report what it covers and to follow
> one written set of rules, so that every later test ticket starts from the same
> base and a gate can check the tests instead of trusting them.

## Acceptance Criteria Presence Check

- Present? yes — in draft form.
- Notes: `docs/testing/UNIT_TEST_ROADMAP.md` lists four draft criteria for this
  phase: the coverage command runs and writes a report; the coverage list names
  only directories that have tests; the workflow can run the test suite at a
  gate; and the conventions are written down, including where a test file goes
  when the code it tests is a protected path. They are a starting point, not
  final. `/spec` still has to turn them into criteria with fixed `AC-n` ids.

## Test Cases Presence Check

- Present? no.
- Notes: none are written yet. This ticket is unusual — it builds the test
  harness, so its own test cases are checks that the harness itself works (the
  coverage report is produced, the new gate check resolves and runs, the suite
  still passes), not tests of product code. Product-code tests start in Phase 2
  and later.

## Missing Information

- Deleting the scratch file `tests/unitTests/init.test.tsx` may leave
  `tests/testUtils.ts` with no user, and `pnpm knip` may then report it as
  unused. It is not yet known whether that happens, or whether removing
  `testUtils.ts` belongs in this ticket.
- It is not yet decided which directories the first coverage list should name.
- It is not yet decided whether coverage thresholds are set in this ticket or
  left until there is enough covered code for a number to mean anything.
- It is not yet known whether the conventions belong in a new document or fit
  into one that already exists.

None of these block the request. They are questions for `/research` and `/spec`
to settle, not gaps in what is being asked for.

## Readiness Status

`READY`

- Justification: the request is clear and small, the goal is stated, and draft
  acceptance criteria exist. The open points above are questions about how to do
  the work, not doubts about what is wanted — so they belong to the later stages,
  and this ticket can move on.
