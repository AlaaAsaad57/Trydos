---
ticket: unit-test-harness-and-coverage
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-09
result: passed          # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4              # correct / total
decision: PASSED        # gate decision; `none` when the quiz failed (ADR-013)
missed:                 # empty — every answer was correct
links:
  clickup:
  github:
---

# Comprehension — unit-test-harness-and-coverage

> Single-owner gate control (ADR-011 / ADR-014 / CG-1..CG-6). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4); any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.
>
> **English only.** Questions, options, answers, and every other word in this file
> are written in English — whatever language the conversation used (CLAUDE.md).
>
> **Three rows is the floor, not the form** (CG-1): add rows freely. Every gate
> carries **≥1 integration / cross-flow question** (CG-5), and `/review` adds
> **one row per `major` panel finding** on top of the floor (CG-6).

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.

Four questions were asked — one above the floor of three. The panel returned no
`major` finding, so CG-6 added none.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan lists eight files to change. Which statement about protected paths is correct? | `plan.md > Files to change`; AC-11 | protected paths | a) Config file is protected · b) `functions.test.ts` is protected · **c) No file is protected — `utils/functions.test.ts` sits under `utils/`, but only `utils/cookies/**` is protected** · d) `testUtils.ts` is protected | c) No file is protected | yes |
| 2 | Step 5 switches the translation lint rules off for test files, then removes the disable comment from `utils/functions.test.ts`. If the exemption pattern matched only `tests/**`, what happens? | `plan.md > Steps` 5, `plan.md > Approach` (OQ-7); panel:senior, panel:security | risk / lint scope | a) Build fails instead of lint · **b) Lint fails on `functions.test.ts` — it is not under `tests/`, and its disable comment is now gone** · c) Lint passes, the mirror rule covers it · d) Nothing changes, `.tsx` only | b) Lint fails on `functions.test.ts` | yes |
| 3 | According to the Integration surface, what ordering dependency does this ticket create for other tickets? | `plan.md > Integration surface` (Ordering) | integration (CG-5) | a) Fixtures phase must land first · b) No ordering, phases independent · c) Pipeline file must go first · **d) This ticket must land before any ticket naming `tests-and-types`, or that ticket's `/verify` fails its profile check (VP-1)** | d) This ticket before `tests-and-types` users | yes |
| 4 | The Integration surface calls one failure the most dangerous because it fails silently. Which one? | `plan.md > Integration surface` (What breaks if this is wrong) | integration (CG-5) | a) Coverage list names folders · b) Malformed workflow settings · **c) Over-broad lint exemption — untranslated text stops being reported while the lint check still passes** · d) Watch mode hangs the gate | c) Over-broad lint exemption | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-012) — CG-6 does not apply.

Four questions were asked — one above the floor of three. CG-6 does not apply at
`/verify` (there is no panel here).

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan's Integration surface warned the lint change affects the whole repository and could fail silently. What did the implementation do so the exemption reaches test files and nothing else? | `plan.md > Integration surface`; `implement.md > Changes made` (`eslint.config.mjs`) and Validation run | integration (CG-5) | a) Kept the disable comment · **b) Matched by file NAME (`*.test.*` / `*.spec.*`), proved by printing the resolved config — both i18n rules `0` on the test file, `local/translate-key-exists` still `2` on normal source** · c) Matched the `tests/` folder · d) Turned the rules off globally | b) Matched by file name | yes |
| 2 | What command does the new `unit-tests` gate check run? | `implement.md > Changes made` (`.claude/project-config.yaml`); AC-3, AC-4 | correctness | a) `pnpm test` · b) `pnpm test:coverage` · **c) `pnpm test:run` — runs once and exits; coverage stays a separate hand-run command** · d) `vitest --watch` | c) `pnpm test:run` | yes |
| 3 | `pnpm knip` could not run during verification. What is the correct reading of that? | `implement.md > Deviations from plan`; AC-9 | risk / evidence | a) It broke because of this ticket · b) It is a new failure caused by the coverage package · **c) It never ran here — `knip` is not installed, and `develop` has the same script and the same missing package, so it fails there identically** · d) It passed with warnings | c) It never ran here | yes |
| 4 | The coverage include list names a single file. Which one, and why does the extension matter? | `implement.md > Changes made` (`vitest.config.mts`); AC-1, AC-2 | correctness | a) `utils/functions.ts` · **b) `utils/functions.tsx` — the source is `.tsx` while only the test is `.ts`; a `.ts` entry would match nothing and give an empty report that looks like a broken config** · c) `vitest.config.mts` · d) The whole `utils/` folder | b) `utils/functions.tsx` | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
