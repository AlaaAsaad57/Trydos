---
ticket: unit-tests-product-detail-data
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-09-03
result: passed
score: 3/3
threshold: 1.0
decision: APPROVED
missed:
degraded:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-product-detail-data

## Review gate

Questions derived from `plan.md` + `spec.md`, including
`plan.md > Integration surface` and the panel findings already written to
`review.md > Panel Findings` before any question was asked (RP-4).

| # | Question (from the artifact) | Source | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|---|---|
| 1 | Constraint C-6 keeps the shared fixture free of production imports. If `tests/fixtures/product.ts` imported from `serverRequests/product`, which existing test files would break? | `plan.md > Integration surface` (Who else depends on them) + `spec.md > C-6` | integration (CG-5) | 2 | **`tests/services/elastic/helpers.test.ts` and `tests/utils/normalizeListingProduct.test.ts`** · `tests/cache/noRuntimeReadsInCachedTree.test.ts` and `tests/components/products/ProductStories.test.tsx` · `tests/fixtures/fixtures.test.ts` and `tests/setup.test.tsx` · `tests/serverRequests/HandleAuthedFetch.test.ts` and `tests/utils/server/tokenManager.test.ts` | yes | `tests/services/elastic/helpers.test.ts` and `tests/utils/normalizeListingProduct.test.ts` | Yes |
| 2 | Which pair of acceptance criteria carries BUG-2? | `spec.md > AC-37`, `AC-38` + `plan.md > Tests` + `review.md > M-3` | defect confirmation | 2 | **`AC-37` and `AC-38`, where a refused request returns a record with no product id** · `AC-13` and `AC-14`, where a refused request is reported as a missing product · `AC-22` and `AC-27`, where a single interaction is read as the most recent · `AC-9` and `AC-12`, where a raising cache is swallowed without a report | yes | `AC-37` and `AC-38` | Yes |
| 3 | One criterion was found able to pass even with the module deleted. Which other criteria were corrected in the same sweep? | `plan.md > Tests` (AC-22, AC-27, AC-28 rows) + `review.md > M-10` | test strength | 2 | **`AC-22` and `AC-27`, on the view count and the most recent like** · `AC-3` and `AC-19`, on the empty country list and the cached metadata · `AC-37` and `AC-38`, on the two readers that ignore the envelope · `AC-9` and `AC-12`, on the two readers that meet a raising cache | yes | `AC-22` and `AC-27` | Yes |

- Score: 3/3 (100%) — meets the 1.0 threshold.

## Falsification record (CG-8)

Two rounds were run against the `gate-falsifier`, each sent the questions and
options **alone** — no `plan.md`, no `spec.md`, no ticket.

**Round 1 — five questions drafted, four rejected.**

| Q | Blind pick | Correct? | `answerable` | Basis | Outcome |
|---|---|---|---|---|---|
| fixture dependants | A | no | no | construction-tell | **survives** → row 1 |
| envelope handling | A | **yes** | yes | construction-tell | rejected — the stem asked which reader was correct and only one option described correct handling |
| BUG-2 pair | C | **yes** | yes | construction-tell | rejected — two options read as correct behaviour, so a defect pair had to be one of the other two |
| why `await import()` | C | **yes** | yes | domain-knowledge | rejected — answerable straight from Vitest convention |
| what stops AC-28 | A | **yes** | yes | domain-knowledge | rejected — "assert the query, not the count" is general test design |

**Round 2 — the four regenerated, two survived.** `construction-tell` rejections
had their options rewritten at no round cost; `domain-knowledge` rejections had
the **fact** changed, spending one of two rounds.

| Q | Blind pick | Correct? | `answerable` | Basis | Outcome |
|---|---|---|---|---|---|
| envelope handling | A | no | **yes** | construction-tell | rejected on `answerable: yes` |
| BUG-2 pair | D | no | no | — | **survives** → row 2 |
| timing budget | D | no | **yes** | domain-knowledge | rejected on `answerable: yes` |
| same-class sweep | C | no | no | — | **survives** → row 3 |

**Why the set stopped at three.** Three questions survived, which is exactly
`gate.min_questions`, and the surviving set includes the mandatory CG-5
integration question — so this is a **full gate at the floor, not a degraded
one**, and `degraded:` is correctly empty. CG-6 would have seeded more rows on
the strength of ten `major` findings, but falsification removed the candidates
faster than they could be replaced: of nine questions drafted across two rounds,
six were answerable without the artifact. One further option rewrite remained
available for the envelope-handling question under the two-rewrite allowance and
was not spent.

Every surviving question was answered wrongly by the falsifier and reported
`answerable: no` — the at-chance evidence this check exists to obtain.

## Notes

- No prior `comprehension.md` existed, so §G E1/E2 retired nothing and
  `attempt: 1` is correct under X5.
- `stage: review` names the stage being left (X2); `result: passed` (X3);
  `3/3` meets `threshold: 1.0` (X4); `evaluator.actor: owner` (X6).
- The owner read `review.md > Panel Findings` before the questions were put,
  as RP-4 requires.
