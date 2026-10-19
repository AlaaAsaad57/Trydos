---
ticket: seller-product-ai-autofill
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-10-19
result: passed
score: 4/4
threshold: 1.0
decision: PASSED
missed:
degraded: "4 of 5 administered, 1 cleared CG-8 outright — 3 admitted on the falsifier's miss (Q1 integration, Q3, Q4: blind pick wrong but reported answerable); 1 excluded after both rounds (live-check timing question: blind pick correct)"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — seller-product-ai-autofill

> Gate record for `/verify`. Questions came from `implement.md`, `spec.md`,
> `plan.md` (Integration surface, amendments A-1/A-2) and `review.md` (panel
> findings that `implement.md` acted on). No panel at verify (CG-6 n/a). The
> review record was retired to `comprehension-review-1.md` on entry (E1).
> Two-hop share: 4 of 4 administered rows — meets CG-2(d) / X7.

## Verify gate

| # | Question (from the artifact) | Sources | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The new AI route has a rate limit. Who shares one limit, and how many calls does it allow? | `plan.md > Integration surface (A-1 / P-2)`; `implement.md > Changes made (route.ts)` | integration (CG-5) | 2 | A) Each staff member has their own limit of 10 calls per 60 s · B) Each staff member has their own limit of 20 calls per 60 s · **C) All staff of one shop share one limit of 10 calls per 60 s** ✔ · D) All staff of one shop share one limit of 20 calls per 60 s | short | C | Yes |
| 2 | Step 0 checked a real category-tree answer (471 items) and found one field wrong for many items. Which field, and for how many? | `implement.md > Evidence — Step 0`; `plan.md > Post-review amendment A-2` | evidence / plan amendment | 2 | A) The display_name field, wrong for 302 of 471 items · B) The display_name field, wrong for 405 of 471 items · **C) The level field, wrong for 302 of 471 items** ✔ · D) The level field, wrong for 405 of 471 items | yes | C | Yes |
| 3 | As implemented, what happens to the AI request when the seller closes the dialog while the analysis is still running? | `spec.md > Edge Cases (closes the dialog)`; `implement.md > Deviations #1` | behaviour / deviation | 2 | A) It is aborted, and an error message is shown · B) It is aborted, and the late answer is ignored · C) It keeps running, and the form opens anyway · **D) It keeps running, and the late answer is ignored** ✔ | short | D | Yes |
| 4 | The route checks the shop id's format before anything else. Which review finding asked for that, and what does the route answer for a bad format? | `review.md > Panel Findings P-6`; `implement.md > Deviations #4` | deviation / panel trace | 2 | A) P-4; the route answers 400 · B) P-4; the route answers 403 · C) P-6; the route answers 400 · **D) P-6; the route answers 403** ✔ | short | D | Yes |

### Falsification log (CG-8)

- Round 1 (5 questions): Q1 (limiter fail-open, domain) and Q5 (ttl sentinel,
  domain) picked or justified from convention; Q4 (token leak) from injected
  `CLAUDE.md`; Q3 picked from a stem tell ("As built"); Q5's stem leaked Q1
  (sibling-leak yes). Q2 survived.
- Round 2: facts changed for Q1, Q4, Q5; Q3 stem rewritten (no round). Q1
  (helper location) and Q4 (log endpoint) picked correctly → facts changed
  again; Q3 and Q5 picked wrong but reported answerable.
- Round 3 (final): Q1 (shared limit) picked wrong; Q2 picked wrong
  (answerable no); Q3, Q5 picked wrong; the live-check timing question picked
  correctly (and leaked by Q2's "471 items") → excluded.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
