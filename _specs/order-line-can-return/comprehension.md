---
ticket: order-line-can-return
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-10-21
result: passed
score: 3/3
threshold: 1.0
decision: PASSED
missed:
degraded:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — order-line-can-return

> Gate record for `/verify`, attempt 1. On entry the review record was retired to
> `comprehension-review-1.md` (E1). No earlier `verify` attempt exists.

## How the set was built (CG-8)

- **Round 0** (4 questions): Q2 cleared. Q1 was answered from general knowledge;
  Q3 and Q4 were answered from host-injected context (the git status: changed
  file names and the last commit) → three facts changed (round 1).
- **Round 1:** Q2, Q3 and Q4 cleared outright (blind pick wrong, `answerable:
  no`). Q1 leaked through its stem (`construction-tell`) and was dropped instead
  of rewritten, since three cleared questions meet `gate.min_questions`.
  `sibling-leak: no`.

## Verify gate

**`result: passed`** — full record (CG-2). Options are listed alphabetically.

| # | Question (from the artifact) | Sources | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | Per implement.md, how many cases were red before the sheet change, and which criteria stayed green as the plan expected? | `implement.md > Tests written > Red before, green after`; `plan.md > Steps` (step 3) | tests / red-first proof | 2 | (a) 11 cases red; AC-2, AC-3 and AC-8 stayed green · **(b) 11 cases red; AC-6, AC-7 and AC-8 stayed green** ✓ · (c) 13 cases red; AC-2, AC-3 and AC-8 stayed green · (d) 13 cases red; AC-6, AC-7 and AC-8 stayed green | yes | (b) | Yes |
| 2 | The plan's Integration surface says one test file mocks the options sheet. Which file and line does it name? | `plan.md > Integration surface` (Who else depends on them) | integration (CG-5) | 1 | (a) OrderDetailsWrapper.test.tsx, line 59 · **(b) OrderDetailsWrapper.test.tsx, line 70** ✓ · (c) OrderItemBanner.test.tsx, line 59 · (d) OrderItemBanner.test.tsx, line 70 | yes | (b) | Yes |
| 3 | What did the owner answer for review finding SR-1, and which case does implement.md list as still not covered? | `implement.md > Entry` (SR-1 answer); `implement.md > Not covered (from review)` | scope / coverage gap | 2 | (a) SR-1: every draft line counts; the editable-request case is not covered · (b) SR-1: every draft line counts; the locked-request case is not covered · **(c) SR-1: only added lines count; the editable-request case is not covered** ✓ · (d) SR-1: only added lines count; the locked-request case is not covered | yes | (c) | Yes |

- Two-hop share (X7): 2 of 3 questions are `Hops: 2` (≥ 2 needed).
- Score (optional): n/a
