---
ticket: product-editor-backend-field-errors
stage: review
attempt: 2
status: complete
owner: developer
updated: 2026-08-27
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

# Comprehension — product-editor-backend-field-errors

> Gate record for the `review` stage, **attempt 2**. Attempt 1 is retired at
> `comprehension-review-1.md` and is never edited. Three questions were
> administered — the floor set by `gate.min_questions`, not a degraded gate. All
> three were answered correctly.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | A review panel found that one message can vanish before the seller ever sees it. Through which path does that message travel, and which word makes it disappear? | `review.md > Panel Findings` `SEC-11` / `SEN-11`, read against `plan.md` step 5 and the Integration surface | **integration / cross-flow (CG-5)** | 2 | **b) the global notification store, on a message containing "authorized"** *(correct)*; a) the global notification store, on "approval"; c) the inline alert component, on "approval"; d) the inline alert component, on "authorized" | yes | b | Yes |
| 2 | `SEC-10` is about one branch of the mapper. Which text does that branch write today, and which requirement does the finding name as the one that could be misread? | `review.md > Panel Findings` `SEC-10`, read against `spec.md > FR-2` and `plan.md` step 2 | security / seeded by a `major` (CG-6) | 2 | **c) two constants of ours, and `FR-2`** *(correct)*; a) the backend's own sentence, and `FR-2`; b) the backend's own sentence, and `FR-9`; d) two constants of ours, and `FR-9` | yes | c | Yes |
| 3 | Which edge case did spec revision 2 reverse, and which criterion maps to it? | `spec.md > Edge Cases` `E-4`, joined to `spec.md > Acceptance Criteria Mapping` | spec change / traceability | 2 | **a) `E-4`, and `AC-12`** *(correct)*; b) `E-4`, and `AC-22`; c) `E-12`, and `AC-12`; d) `E-12`, and `AC-22` | yes | a | Yes |

- Score: 3/3
- All three questions are two-hop, above the "at least half" floor.
- Question 1 carries the `CG-5` integration axis: it asks about a shared flow
  outside this change's own files — the one the panel found the Integration
  surface had wrongly described as untouched.
- Questions 1 and 2 are the two seeded by `major` findings (`CG-6`). Three
  `major` rows were recorded, but `SEC-11` and `SEN-11` are the same fault found
  independently by two lenses, so one question covers both, as `CG-6` allows.

## Falsification (CG-8)

Five questions were drafted. Each round went to the `gate-falsifier` with the
questions and their options and **nothing else** — no `plan.md`, no `spec.md`, no
ticket. Three rounds were run. Two questions were dropped for good; the record of
why, because a gate that hides how it was built is not a gate:

**Round 1** — one of five survived.

| Q | Blind pick | Basis reported | Outcome |
|---|---|---|---|
| the vanishing message | **wrong** | `answerable: no` | **survived** |
| `SEC-10`'s branch | wrong | construction-tell | rejected — the stem's "carries no field name" pointed at phrase matching; free option rewrite |
| the accepted overlap | wrong | construction-tell | rejected — "a flow outside this ticket's own defect" halved the grid; free option rewrite |
| what fences `FR-20` | **correct** | construction-tell | rejected — "fences it from turning into a content filter" gave away that the trigger is structural |
| `AC-10`'s split row | **correct** | domain-knowledge | rejected — a manual walk at verify and a unit-testable mapper are ordinary convention; costs a round |

**Round 2** — two of four survived.

| Q | Blind pick | Basis reported | Outcome |
|---|---|---|---|
| `SEC-10`'s branch | wrong | `answerable: no` | **survived** |
| the lockstep pair | **correct** | domain-knowledge | rejected — "add a banner without its clearing points and it never clears" needs no artifact; costs a round |
| spec revision 2's reversal | wrong | `answerable: no` | **survived** |
| `AC-15`'s three proofs | wrong | construction-tell | rejected — one filename read as obviously off-topic, collapsing half the grid |

**Round 3 (final)** — neither replacement survived.

| Q | Blind pick | Outcome |
|---|---|---|
| the two call-site counts | **correct** | rejected — rounds spent, question dropped |
| `AC-15`'s three proofs | **correct** | rejected — rounds spent, question dropped |

Three questions were left, which is exactly `gate.min_questions`. The gate is
therefore **at its floor, not short**: `degraded:` is empty, the `CG-5` integration
question was administered rather than excluded, and `CG-4`'s 100% applied to a full
minimum set.

**What the failures were.** Four of the seven rejections were faults in the
question, not in the artifact: the stem told the reader which half of the grid to
pick. Two were faults in the fact — a manual check at the verify gate, and a banner
needing a reset, are things any engineer would guess. The two that ran out of
rounds both failed the same way in the end: a balanced grid the falsifier called
`answerable: no` and then guessed right anyway, which the rule counts as a fail
because a correct blind pick is a correct blind pick.
