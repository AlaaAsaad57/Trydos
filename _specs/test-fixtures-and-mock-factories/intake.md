---
ticket: test-fixtures-and-mock-factories
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Intake — test-fixtures-and-mock-factories

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- id / slug: `test-fixtures-and-mock-factories`
- Source: `docs/testing/UNIT_TEST_ROADMAP.md` — Tier 0, Phase 2.
- Comes after: `unit-test-harness-and-coverage` (Phase 1), which is closed and
  merged. It set up the test runner, the coverage report, the two run-once
  commands, the `tests-and-types` gate group, and the written conventions.
- No ClickUp task and no GitHub issue.

## Ticket Summary

Build the shared test kit that the other 118 test phases will import: sample data
builders for the app's main objects, reusable stand-ins for the modules almost
every test has to replace, and one helper that fakes network calls and records
what was asked for.

Without it, each later phase invents its own sample data and its own stand-ins.
They would drift apart, and the same object would be described a different way in
every file. This is the roadmap's stated reason for doing Phase 2 before Tier 1.

## Ticket Metadata

- id / slug: test-fixtures-and-mock-factories
- title: Shared test fixtures and mock factories for the unit test suite
- owner: developer
- created: 2026-08-09
- links: none

## User Story

> As a developer writing tests for Trydos, I want one shared set of sample data
> builders and module stand-ins, so that every test describes the same object the
> same way and I do not have to rebuild the same setup in each new test file.

## Acceptance Criteria Presence Check

- Present? yes — in draft form.
- Notes: the roadmap gives three draft criteria for this phase:
  1. each sample-data builder returns a valid object, and any field can be
     overridden by the caller;
  2. the one test file that already exists is moved onto the shared stand-ins and
     still passes;
  3. no builder or stand-in reaches the network.
  These are a starting point, not the final list. `/spec` turns them into
  numbered criteria (`AC-n`) that can be traced.

## Test Cases Presence Check

- Present? no.
- Notes: none are written yet, and that is expected at this stage. This ticket
  builds test tooling, so its own test cases are mostly "the existing test still
  passes once it uses the shared kit" plus a small check per builder. `/spec`
  writes them.

## Missing Information

- Nothing is missing that stops this ticket. The goal is clear, the earlier phase
  it depends on is closed and merged, and the gate group it will use
  (`tests-and-types`) already exists.
- Four points are still open. None of them block intake — they are questions
  about the code, so `/research` is the right place to settle them, and they are
  listed here only so they are not lost:
  1. The app has no single "product" shape. There is a tidied-up shape used by
     product lists, and the raw shape that comes back from the search engine.
     Decide whether that is one builder or two.
  2. Some code loads the shared state store at the moment it is used, not at the
     top of the file. Confirm that a single stand-in still covers both ways of
     loading it, because every later phase depends on that.
  3. Two of the outside services named in the roadmap (the product-analytics one
     and the error-reporting one) are each used in very few places, and one of
     them already does nothing while tests run. Decide whether a stand-in for
     them is worth building now or later.
  4. Part of the cookie helper only runs on the server. Decide whether its
     stand-in needs that half now, or only when Tier 2 starts.

## Readiness Status

`READY`

- Justification: the request is clear and small enough to work on. It has a
  stated goal, a named source (`docs/testing/UNIT_TEST_ROADMAP.md`, Tier 0,
  Phase 2), a user story, and draft acceptance criteria. The phase it depends on
  is closed. Nothing outside this repository is needed, no access is missing, and
  no decision is waiting on another person. The four open points above are
  questions about our own code, which is exactly what `/research` answers.
