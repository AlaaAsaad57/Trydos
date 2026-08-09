---
ticket: unit-test-harness-and-coverage
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Spec — unit-test-harness-and-coverage

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Test harness, coverage and conventions.

## Business Goal

The app has a working test runner, but nobody can see what the tests cover, there
are no written rules for writing a test, and the workflow cannot check the tests
at a gate — it can only trust them. This ticket closes those three gaps once, so
the 119 later test phases all start from the same base instead of each inventing
its own. Without it, every later ticket re-argues the same questions and the
gates keep passing work that was never checked.

## User Story

> As a developer, I want the test suite to report what it covers and to follow
> one written set of rules, so that every later test ticket starts from the same
> base and a gate can check the tests instead of trusting them.

## Functional Requirements

- **FR-1** — A developer can run the test suite once and get a coverage report
  they can read on their own machine.
- **FR-2** — The coverage report describes only the areas of the app that have
  tests. It does not report on areas nobody has tested yet.
- **FR-3** — The workflow has a check that runs the test suite, and a named group
  of checks that a later ticket can ask for at its gate.
- **FR-4** — That check finishes on its own, asks no questions, and reports
  clearly whether it passed or failed.
- **FR-5** — There is one written set of rules that says how to write a test for
  this app and where a test file belongs.
- **FR-6** — Those rules say what to do when the code being tested sits in a
  protected area, so that no later ticket has to change a protected file just to
  add a test.
- **FR-7** — The scratch learning test and the toy helper it uses are removed.
- **FR-8** — The one real test that exists today still passes after the change.

## Non-Functional Requirements

- **NFR-1** — No behaviour of the storefront changes. This ticket touches test
  tooling and workflow settings only.
- **NFR-2** — Coverage output is never committed to the repository.
- **NFR-3** — The checks that already exist (type checking, linting, the build,
  and the unused-file report) still pass after the change.
- **NFR-4** — The new check gives the same result every time it runs on the same
  code, and needs no human input.

## Constraints

- Everything runs on a developer's machine. There is no CI, and this ticket does
  not add one.
- No protected file is changed.
- The settings that describe the workflow's checks are shared by every ticket, so
  a mistake there would affect all of them, not just this one. The change must
  leave those settings valid.
- The test runner and the coverage tool are already installed and their versions
  already match. This ticket does not add or upgrade either.

## Edge Cases

- A check that never finishes. The way the suite is started today keeps running
  and waits for file changes. If a gate called it that way, the gate would hang
  forever instead of failing.
- A helper left with no user. Removing the scratch test may leave its toy helper
  unused, which the existing unused-file check could then report — failing a gate
  for a reason that has nothing to do with the work.
- Where a test file sits decides which lint rules apply to it. Tests placed
  beside the app's own source are checked by the translation rules and need
  exceptions written into them; tests kept apart are not.
- The coverage folder does not exist before the first run, so the first run has
  to create it rather than assume it.
- A coverage number measured against the whole app would be near zero today and
  would say nothing useful.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Yes. Both go. The scratch learning test is removed, and the toy helper it uses goes with it, because nothing else uses that helper. Leaving the helper behind would risk failing the unused-file check. | FR-7, AC-7, AC-9 |
| OQ-2 | The report covers only areas that already have tests. Each later phase adds its own areas as it covers them. It does not start by naming the whole app. | FR-2, AC-2 |
| OQ-3 | No. No pass mark for coverage is set in this ticket. With so little covered, any honest number would be near zero, and a number that low either blocks the gate or tells nobody anything. It can be introduced later once enough is covered to make it mean something. | Out of Scope |
| OQ-4 | Deferred. Whether the rules go in a new document or into one that already exists is a choice about how to organise the work, so `/plan` decides it. This spec only requires that the rules exist and are written down in one place. | Open Questions (see OQ-4), FR-5 |
| OQ-5 | The check must run the suite once, finish on its own, ask nothing, and report pass or fail. That rules out the way the suite is started today, which keeps running and waits. The exact wording of the command belongs to `/plan`. | FR-3, FR-4, NFR-4, AC-3, AC-4 |
| OQ-6 | No. The named group of checks covers the tests, the types and the lint rules. It does not include the unused-file report. Every later phase asks for this group, and adding files is normal work for them — a report about unused files would block those tickets for reasons unrelated to their work. The unused-file check still exists on its own and still has to pass here. | FR-3, NFR-3, AC-3, AC-9 |
| OQ-7 | Deferred. Research showed that where a test file sits decides which lint rules apply to it, which the roadmap had not accounted for. Choosing the rule is a design decision, so `/plan` makes it. This spec only requires that there is one rule, that it is written down, and that following it never forces a change to a protected file. | Open Questions (see OQ-7), FR-5, FR-6 |
| OQ-8 | A report a person can read on their own machine is enough. Nothing consumes a machine-readable report, because there is no CI, so producing one would be unused work. | FR-1, AC-1, Out of Scope |

## Open Questions

- **OQ-4** — Do the written rules go into a new document, or into a document that
  already exists? `/plan` decides and must say which (PL-12).
- **OQ-7** — What is the one rule for where a test file goes? It must never force
  a change to a protected file, and it has to account for the fact that tests
  placed beside the app's own source are checked by the translation lint rules
  while tests kept apart are not. `/plan` decides and must say which (PL-12).

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | Running the suite once produces a coverage report a developer can read on their own machine, and the run then exits. | FR-1, OQ-8 |
| AC-2 | The coverage report covers only areas that have tests; untested areas of the app are not reported on. | FR-2, OQ-2 |
| AC-3 | The workflow has a check that runs the test suite, and a named group of checks that a later ticket can ask for at its gate. That group covers the tests, the types and the lint rules, and does not include the unused-file report. | FR-3, OQ-5, OQ-6 |
| AC-4 | The new check finishes on its own without waiting for input, and reports whether it passed or failed. | FR-4, NFR-4, OQ-5 |
| AC-5 | A written set of rules for writing tests in this app exists and is stored with the project's documentation. | FR-5 |
| AC-6 | Those rules say where a test goes when the code it tests sits in a protected area, so following them never requires changing a protected file. | FR-6 |
| AC-7 | The scratch learning test and the toy helper it used are no longer in the repository. | FR-7, OQ-1 |
| AC-8 | The real test that existed before this ticket still passes. | FR-8 |
| AC-9 | Type checking, linting, the build, and the unused-file report all still pass. | NFR-3, OQ-1, OQ-6 |
| AC-10 | Coverage output is not added to version control. | NFR-2 |
| AC-11 | No file that the storefront uses at runtime is changed, and no protected file is changed. | NFR-1, Constraints |

## Out of Scope

- Any CI pipeline, and any upload or publishing of coverage results. Everything
  stays on the developer's machine.
- A pass mark for coverage (see OQ-3). It can be added later.
- A machine-readable coverage report (see OQ-8).
- Shared test fixtures and reusable mocks. Those are the next phase.
- Any test of the app's own product code. Later phases do that.
- Removing the dead pipeline file that the repository still carries.
- Removing the test-runner plugin that now reports itself as no longer needed.
- Adding any tool for component testing or browser testing.
