---
ticket: auth-closeout-tests
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-08-23
result: passed
score: 4/4
threshold: 1.0
decision: PASSED
missed:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — auth-closeout-tests

> **This front matter is the gate record**, and `stage: verify` is load-bearing:
> a review record does not clear this gate. `attempt: 1` because this is the
> first round of the **verify** gate — there are no retired
> `comprehension-verify-*.md` files. The three retired records in this workspace
> belong to `review` (`comprehension-review-1.md` … `-3.md`); the last of them
> was retired on entry to this stage, which is what keeps the review's evidence
> readable rather than overwritten.

## Verify gate

Four questions (CG-1 floor 3, ceiling 5), drawn from `implement.md`, `verify.md`
and `spec.md`, with one on the integration axis (CG-5). **No reviewer panel runs
at this stage** (ADR-010), so CG-6 adds none. Options alphabetised so position
carried no signal. New questions on new material — none repeats a review round.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|
| 1 | RECOV-01 ran green against staging in 1.2 minutes. What does that mean for the spec's `test.setTimeout()`? | `verify.md > Outstanding`; `plan.md > Live timing` | resource budget | **Drop from 240s to roughly 150s — measured plus margin — buying back ~90s of the shared run budget** / Stay at 240s for cooldown headroom / Remove it, the default covers it / Raise it, one run is not a basis | Drop from 240s to roughly 150s — measured plus margin — buying back ~90s of the shared run budget | ✅ |
| 2 | Three checks were deliberately broken and seen red. Why, when the plan owed no red-first work? | `implement.md > Three checks were proved able to fail`; `spec.md > Constraints` | correctness / test validity | **Because a criterion met by a check that cannot fail is not met — the spec's binding constraint, separate from the fix-first rule** / Every new test must be seen red / They guard fixes that already shipped / The panel required it | Because a criterion met by a check that cannot fail is not met — the spec's binding constraint, separate from the fix-first rule | ✅ |
| 3 | What was the one deviation from the plan recorded during implement? | `implement.md > Deviations from plan` | scope fidelity | **AC-6's "missing phone" case had to clear the field in the form — an empty phone makes the form treat the visitor as not signed in, so it never reaches the rule** / AC-12 was dropped / The live check signed in twice / An application file was changed | AC-6's "missing phone" case had to clear the field in the form — an empty phone makes the form treat the visitor as not signed in, so it never reaches the rule | ✅ |
| 4 | Which part of the declared Integration surface could **not** be observed on this green run? | `verify.md > Did the plan's Integration surface hold?`; `plan.md > Integration surface` | **integration (CG-5)** | **The search-backend dependency — the home page rendered, so the message naming search was never exercised** / The extra sign-in / The file-ordering constraint / That no protected path was touched | The search-backend dependency — the home page rendered, so the message naming search was never exercised | ✅ |

- Score: 4/4. Threshold 1.0 met.
