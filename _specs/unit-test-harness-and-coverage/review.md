---
ticket: unit-test-harness-and-coverage
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Review — unit-test-harness-and-coverage

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (11 acceptance criteria, `AC-1`..`AC-11`) and `plan.md` (approach,
steps, files to change, integration surface, validation, rollback).
`research.md` was read for context. The advisory panel also read the repository
files the plan names, to check the plan's claims against the code.

## Plan Summary

Add a coverage section to the test runner settings, add two run-once scripts,
register a test check and a `tests-and-types` check group in the workflow
settings, delete the scratch learning test and its toy helper, switch the
translation lint rules off for test files, and write the conventions into a new
document. Eight files change. Nothing the storefront uses at runtime is touched,
and no protected file is touched.

The plan answers the two questions the spec pushed forward: the conventions go in
a new document (`OQ-4`), and a test file sits next to the code it tests unless
that place is protected, in which case it goes in a `tests/` mirror (`OQ-7`).

## Risks

- The lint exemption is the sharpest risk. If its pattern catches files that are
  not tests, untranslated user-visible text stops being reported and the lint
  check still passes — it fails silently. The plan says so itself, and the panel
  raised it twice.
- The workflow settings file is shared by every ticket. A mistake there breaks
  `/verify` for all of them, not just this one. That file also holds the
  `protected_paths` list, so an accidental edit there would weaken a guardrail.
- The coverage list is the one place all 119 later phases meet, so phases worked
  on at the same time will collide there.

## Assumptions

- The test runner and its coverage provider are already installed at matching
  versions, so no dependency work is needed.
- Deleting both the scratch test and its helper together removes the orphan the
  unused-file check would otherwise report.
- There is no CI, so a report a person reads locally is the whole requirement.

## Open Questions

None. Every `OQ-n` from `research.md` is closed — `OQ-1`, `OQ-2`, `OQ-3`, `OQ-5`,
`OQ-6` and `OQ-8` in `spec.md`; `OQ-4` and `OQ-7` in `plan.md` (PL-12 satisfied).

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

No `major` findings, so CG-6 added no extra comprehension questions.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | The `eslint.config.mjs` change is not required by any AC — lint passes today because of one disable comment. If the pattern were `tests/**` it would not cover `utils/functions.test.ts`, whose disable comment step 5 removes, so lint would then fail. | `plan.md > Steps` 5, Files to change (`eslint.config.mjs`), AC-9 | **Accept.** Keep the step. `/implement` must use a pattern that matches test files **by name** (`**/*.{test,spec}.{ts,tsx}`) so it covers `utils/functions.test.ts`, and must switch off only the two named i18n rules. |
| senior | minor | The reason for a new conventions document is weak: the roadmap already states both rules the new document would restate, so a convention change still means editing the roadmap. The roadmap is also missing from the Integration surface, and step 3 deletes a file the roadmap describes as existing. | `plan.md > Approach` (OQ-4), Integration surface, `docs/testing/UNIT_TEST_ROADMAP.md` | **Accept in part.** `OQ-4` stands — the new document is still the right home. `/implement` keeps it to what the roadmap does not already say and points at the roadmap for placement. Updating the roadmap itself is **not** in this ticket's Files to change, so the drift is accepted as a known, recorded cost. |
| senior | info | The source file is `utils/functions.tsx`, not `.ts` — only the test is `.ts`. An include entry written `utils/functions.ts` matches nothing and the report comes out empty, which would look like a config bug. | `plan.md > Steps` 1, AC-1, AC-2 | **Accept.** `/implement` names `utils/functions.tsx` exactly in the coverage include list. |
| security | minor | The plan never pins the exact lint pattern, and AC-9 cannot catch the failure — an over-broad pattern makes lint pass while untranslated text stops being reported. | `plan.md > Steps` 5, Integration surface | **Accept.** Covered by the pinned pattern above. `/verify` also adds a positive check: a deliberately bad translate key in a normal source file must still fail the lint check. |
| security | minor | `.claude/project-config.yaml` also holds the `protected_paths` list, and nothing in the validation list confirms the rest of that file was left alone. | Files to change (`.claude/project-config.yaml`), AC-3 | **Accept.** `/verify` reads the diff of that file and confirms only the new check and the new group were added, with `protected_paths` untouched. |
| security | info | The "no protected path is touched" claim checks out. None of the eight listed paths matches a protected glob; `utils/functions.test.ts` sits under `utils/`, but only `utils/cookies/**` is protected. | AC-11, `.claude/project-config.yaml` | **Noted.** Confirms the plan. No action. |
| security | info | No known vulnerability applies to the packages this ticket touches. `vitest` 4.1.10 is past GHSA-5xrq-8626-4rwp / CVE-2026-47429 (affects `<4.1.0`); the other vitest advisories need `@vitest/browser`, which is not installed; `vite` 8.2.0 is past CVE-2026-39363 and CVE-2026-39364. | `package.json`, `pnpm-lock.yaml` | **Noted.** No action. |
| performance | minor | The plan does not say which of the two scripts the `unit-tests` check calls. If it calls the coverage one, all 119 later tickets pay instrumentation cost (roughly 1.5× run time) and write an HTML report nobody opens at a gate. | `plan.md > Steps` 2 and 4, AC-3, AC-4 | **Accept.** The `unit-tests` check calls the **plain run-once script**. Coverage stays a separate command a developer runs by hand. |
| performance | info | Console plus HTML coverage is proportionate while it stays a hand-run command, because the include list names only tested files and the output folder is ignored by git and overwritten each run. | AC-1, AC-2, AC-10 | **Noted.** No action. |
| performance | info | `full-build` runs a production build for a change with no runtime code, but it is a one-off on this ticket and AC-9 requires the build to pass. Do not copy `full-build` into the reusable group. | `plan.md > Validation strategy`, AC-9 | **Noted.** The `tests-and-types` group deliberately excludes the build, matching `OQ-6`. No action. |

## Decision

`APPROVED`

- Rationale: Small, reversible, no runtime code. The plan meets all 11 acceptance
  criteria, touches no runtime or protected file, and reverts with a single
  commit. The panel findings are refinements within the files already listed, not
  gaps in the plan, so they are recorded as accepted dispositions rather than
  sent back for a rewrite.

Comprehension check: **passed, 4/4** (CG-4 requires 100%). Four questions were
asked against a floor of three, two of them on the integration axis (CG-5). The
panel returned no `major` finding, so CG-6 added none. Recorded in
`comprehension.md`.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-08-09

## ADR reference

> Optional — record an ADR only if the decision is notable; otherwise "none".

- ADR: none

## Required Follow-up Actions

None are needed **before** implementation may begin. Four accepted findings must
be honoured **during** `/implement`, and two at `/verify`:

At `/implement`:
1. The lint exemption pattern matches test files by name
   (`**/*.{test,spec}.{ts,tsx}`), not by folder, and switches off only the two
   named i18n rules.
2. The coverage include list names `utils/functions.tsx` exactly — the source is
   `.tsx`, not `.ts`.
3. The `unit-tests` check calls the plain run-once script, never the coverage one.
4. The new conventions document stays to what the roadmap does not already say,
   and points at the roadmap for placement.

At `/verify`:
5. Confirm a deliberately bad translate key in a normal source file still fails
   the lint check.
6. Read the diff of `.claude/project-config.yaml` and confirm only the new check
   and the new group were added, with `protected_paths` untouched.
