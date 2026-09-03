---
ticket: unit-tests-product-detail-data
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-03
links:
  clickup:
  github:
---

# Review — unit-tests-product-detail-data

> Written in two passes. Panel Findings below are Step 2. **Decision** and
> **Approvals** stay empty until the comprehension gate has been taken.

## Review scope

`spec.md` (38 acceptance criteria, 13 functional and 6 non-functional
requirements) and `plan.md` (three files to change, 33 test cases). No
application code is in scope — this ticket adds test material only.

## Plan summary

Add `tests/serverRequests/product.test.ts` covering all nine exports of
`serverRequests/product.tsx`, which no test executes today. Add two builders to
`tests/fixtures/product.ts` and two rows to its guard
`tests/fixtures/fixtures.test.ts`. Three boundaries are stood in at the module
edge; the backend chooser is deliberately left real so `AC-8` proves the routing
decision end to end. Two defects found while reading — `BUG-1` and `BUG-2` — are
confirmed by strict cases here and fixed in their own tickets.

## Step 1 — Validation (atomic)

| Check | Result |
|---|---|
| `PL-11` Integration surface, explicit | present, all five sub-headings |
| `PL-12` no `OQ-n` left open | 5 of 5 answered in `spec.md`; none deferred |
| `PL-13` one Tests row per `AC-n` | 38 criteria, 38 rows |
| `PL-13` every named test file also under Files to change | all three present |
| `PL-14` existing coverage searched, one disposition per row | Search A and Search B recorded; `new` / `existing` / `none` on every row; no second parallel file |
| plan ↔ REQ/AC traceability | present, 19 rows |
| Validation profile exists | `logic-change`, defined in `.claude/project-config.yaml` |

Validation passes. No prior `comprehension.md` existed, so §G E1/E2 had nothing
to retire.

## Panel Findings

The panel was run **three times** at the owner's instruction — early and
repeatedly, as a dry run, so majors were caught before this gate rather than
after it. Each round reviewed the artifacts as revised by the round before, and
was asked to attack the previous round's fixes rather than repeat its own
findings. Every finding below was verified against the repository before being
accepted; none was taken on the reviewer's word.

**Ten majors, all resolved in the artifacts now under review.** No major is
open.

| # | Lens | Round | Finding | Status |
|---|---|---|---|---|
| M-1 | security | 1 | Assertion text is **published**: `scripts/unit-report.mjs` keeps 4 lines of the failure diff and `.github/workflows/tests.yml` sends it to the team chat as `unit-tests.txt` on every push to `develop`/`main`. Neither artifact named that channel | fixed — `NFR-4` names it; the literal rule spans steps 1, 4, 5, 7 |
| M-2 | security | 1 | `it.fails()` is **not** a strict expected-failure marker. Probed directly: the intended assertion, a `TypeError` from a missing stand-in, and a plain raised error all reported "expected fail" | fixed — strict pinned assertions for `AC-23`, `AC-37`, `AC-38` |
| M-3 | senior | 1 | `FR-4` pinned a failure the code cannot produce: `serverRequests/ServerFetch.tsx` contains **zero** `throw` statements and returns an error envelope | fixed — `FR-4` rewritten; `AC-9`/`AC-12` moved to the cache-raise path; `AC-37`/`AC-38` added for **BUG-2** |
| M-4 | senior | 1 | The `AC-8` split left the reader's half unable to see a guest at all — with the chooser stood in, the case proved only string concatenation | fixed — chooser left real, profile seeded through the cookie stand-in |
| M-5 | senior | 1 | Cache spies leak between cases: `resetCacheSpies()` calls only `mockClear()`, and `vitest.config.mts` sets no `clearMocks`/`mockReset`/`restoreMocks` | fixed — single `mockReset()` sweep in `beforeEach` |
| M-6 | all three | 2 | The **cookie stand-in is never reset** — the sibling of M-5, and load-bearing once `AC-8` routes through the real chooser. A profile seeded for `AC-8` would persist through `AC-9`–`AC-19` | fixed — `headers.__reset()` in `beforeEach` |
| M-7 | all three | 2 | `NEXT_PUBLIC_SITE_URL` stubbed in `beforeEach` is dead code — `Constants.ts:4` freezes it at module load. Blast radius is `AC-15`–`AC-19`, not only `AC-18`: `buildAlternates`, `openGraph.url` and `twitter.images` all carry the origin | fixed — `vi.stubEnv` inside `vi.hoisted()`, above the imports |
| M-8 | senior + performance | 3 | A **static top-level import does not work**: `vi.mock` factories hoist above the file body, so importing `serverRequests/product` runs the `next/headers` factory before `makeNextHeadersMock()` initialises → `ReferenceError` | fixed — lazy `await import()`, the pattern every repo file with this stand-in uses |
| M-9 | senior | 3 | The cache rule did not close the leak it named: neither `mockResolvedValue` nor `mockClear` drains a queued `mockResolvedValueOnce`. Only `mockReset()` does | fixed — the sweep is `mockReset()`, stated as such |
| M-10 | senior | 3 | `AC-28` could pass for the wrong reason — the count comes from the stand-in, so asserting it proves nothing about the excluded comments. Sibling of `AC-3`, fixed in round 2 in one place only | fixed — asserts the query; class swept to `AC-22` and `AC-27` |

**Minors and nits: 31 raised, all folded in or answered.** The ones that changed
the plan materially: `vi.setConfig({ testTimeout: 5000 })` copied from the model
file; `vi.unstubAllEnvs()` in `afterEach`; the index dispatch table must be the
argument to `vi.fn(...)` because `mockReset()` wipes a later
`.mockImplementation()`; `AC-22`'s rejection must carry `statusCode: 404`;
`AC-27` needs more than one interaction; the `NFR-4` phone exception was
**deleted** after security showed its premise was false (`hasValidPhone` accepts
any non-empty value that is not `"0"`); search index names are asserted through
the imported constants; the timing budget became `tests ≤ 400ms` and
`collect ≤ 1.5s` after measurement, replacing an unfalsifiable wall-clock figure.

### What the panel confirmed rather than challenged

- **`BUG-2` is a genuine defect, not intended degradation.** No caller checks for
  the missing id: the mobile product endpoint returns `isSuccessful: true,
  code: 200` with a hollow product, and the product page passes the promises into
  the render tree unchecked.
- **`vi.hoisted()` ordering is guaranteed by the transform**, not by luck —
  read from the installed `@vitest/mocker` 4.1.10 source.
- **`AC-9`/`AC-12` work as planned**: both readers call `GetFromRedis` inside
  their `try`, so a raising cache reaches both catch blocks.
- **No real credential is read** anywhere in the module graph under test.

### Panel limitations, recorded

The performance reviewer had read-only tools in every round and could not run
the suite; its round-3 numbers come from reading the installed transform source
and from measurements the owner ran instead. Tool sets come from the agent
definition and cannot be widened from the calling prompt.

## Risks

- **The harness has never been executed as a whole.** `await import()`,
  `vi.hoisted()`, `headers.__reset()`, the `mockReset()` sweep and index dispatch
  are each individually justified and have never run together in one file. This
  is the largest residual risk and it is cheap to close — see Follow-up actions.
- **A false green**: a stand-in answering a shape the real service never sends.
  `C-5` is the guard.
- **Leaked state between cases** — three separate instances were found in review,
  which is why step 6 enumerates every stateful stand-in by name.

## Assumptions

- `develop` will be clean when the branch is cut. It is not clean today: a second
  session is editing cart and order tests **and application code** in the same
  working tree.
- The intake baseline (140 files, 2245 tests) is stale for the same reason and is
  re-recorded before implement.

## Follow-up actions

1. **Before writing the 33 cases, write one throwaway harness probe** — two or
   three trivial cases exercising the lazy import, `vi.hoisted()`, the cookie
   reset, the cache sweep and index dispatch together. Run it, confirm, delete
   it. Six of the ten majors above were mechanism claims that a probe settles in
   minutes.
2. Re-record the suite baseline in `intake.md` at the moment the branch is cut.
3. Open the queued tickets after this one closes: `BUG-1`, `BUG-2`, `FIND-2`,
   `FIND-3`, `FIND-4`, `FIND-5`, and `unit-tests-product-comments-data`.

## Decision

**APPROVED** — 2026-09-03.

Rationale. The plan names three files, all under `tests/`, and changes no
application code, so the blast radius is a single revert. All 38 acceptance
criteria carry a Tests row with a disposition; the four that carry
`none — <reason>` state a reason the gate weighed rather than an omission. Ten
`major` findings were raised across three advisory rounds, every one verified
against the repository before it was accepted, and none is open. The
comprehension gate passed at 3/3 against a set the falsifier could not answer
blind.

What the decision does **not** claim: the plan is not proven defect-free. Each
review round found defects in the previous round's fixes, and the residual risk
is concentrated in one place — the harness has never been executed as a whole.
That is why follow-up action 1 is a precondition of writing the 33 cases, not a
nice-to-have.

## Major finding dispositions

All ten are **accepted and already fixed** in the artifacts approved here. None
was dismissed or deferred.

| # | Disposition |
|---|---|
| M-1 | accept — `NFR-4` names the publication channel; the literal rule spans steps 1, 4, 5, 7 |
| M-2 | accept — `it.fails()` replaced by strict pinned assertions |
| M-3 | accept — `FR-4` rewritten to the real paths; `BUG-2` recorded as `AC-37`/`AC-38` |
| M-4 | accept — chooser left real, profile seeded, `AC-8` proved end to end |
| M-5 | accept — `mockReset()` sweep replaces the leaking `mockClear()` |
| M-6 | accept — `headers.__reset()` added to `beforeEach` |
| M-7 | accept — `vi.stubEnv` inside `vi.hoisted()`, above the imports |
| M-8 | accept — lazy `await import()`, matching every repo file using this stand-in |
| M-9 | accept — the sweep is `mockReset()`, which is the only call that drains a queue |
| M-10 | accept — `AC-28` asserts the query; class swept to `AC-22` and `AC-27` |

## Approvals

| Role | Who | Decision | Date |
|---|---|---|---|
| Owner (self-review, ADR-009) | developer | APPROVED | 2026-09-03 |
| Advisory panel (senior / security / performance) | ai_agent ×3, three rounds | advisory only — never blocking (RP-2) | 2026-09-03 |

Comprehension gate: `comprehension.md`, attempt 1, `result: passed`, `score: 3/3`,
`evaluator.actor: owner`.

## Conditions carried into implement

Neither is a reason to withhold approval; both are recorded so `/implement`
cannot start blind.

1. **`develop` is not clean.** A second session is editing cart and order tests
   and application code in the same working tree. The branch must not be cut
   until those paths are clear, or that work lands in this ticket's PR.
2. **The intake baseline is stale.** Re-record it at the moment the branch is
   cut, before any case is written.
