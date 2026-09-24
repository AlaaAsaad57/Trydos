---
ticket: unit-tests-product-detail-data
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-09-03
result: passed
score: 3/3
threshold: 1.0
decision: PASSED
missed:
degraded: "3 asked, 0 cleared CG-8 after two rounds — the three questions the falsifier answered wrongly were administered under the degraded rule; the CG-5 integration question was among them, NOT excluded"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-product-detail-data

## Verify gate

Questions derived from `implement.md` + `spec.md`, including whether the plan's
declared Integration surface held. No panel at this stage (ADR-010), so CG-6
does not apply.

**This gate was administered short (CG-8, ADR-028).** Two falsification rounds
were run and no question cleared the check. Rather than block the work item or
pad the set, the three questions whose blind pick the falsifier got **wrong**
were administered — a miss is the at-chance evidence this check exists to
obtain. They are marked `short` rather than `yes`: they were administered, not
cleared. The one question the falsifier answered **correctly** was excluded.

| # | Question (from the artifact) | Source | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|---|---|
| 1 | Two things had to land in the same commit or something else breaks. Which pair, and what breaks? | `plan.md > Integration surface` (Ordering / lockstep) + `implement.md > Files changed` | integration (CG-5) | 2 | **Both builders and both `BUILDERS` rows, or the shared guard fails** · Both builders and the new product test file, or the fixture has no caller · The harness probe and the product test file, or the mechanisms stay unproven · The import line and the product test file, or the guard cannot compile | short | Both builders + both `BUILDERS` rows | Yes |
| 2 | The BUG-1 case was shown strict two ways. When a stand-in was broken instead of the assertion being flipped, what happened? | `implement.md > Findings > BUG-1` | test strength | 2 | It failed on the assertion that the ratings fallback reaches the caller · **It failed on the assertion that the views query should be unaffected** · It failed with a TypeError from the search stand-in dispatcher · It failed with an error naming the missing index answer | short | Failed on the views-query assertion | Yes |
| 3 | The suite baseline was re-recorded when the branch was cut. What did it change from, and to? | `implement.md > Baseline` | evidence integrity | 2 | **From 140 files / 2245 tests to 145 files / 2300 tests** · From 140 files / 2245 tests to 146 files / 2341 tests · From 145 files / 2300 tests to 146 files / 2343 tests · From 145 files / 2300 tests to 146 files / 2350 tests | short | 140 / 2245 → 145 / 2300 | Yes |

- Score: 3/3 (100%) — meets the 1.0 threshold for what was asked.

## Falsification record (CG-8)

Two rounds, each sent the questions and options **alone** — no `implement.md`,
no `spec.md`, no ticket.

**Round 1 — four drafted, one survived.**

| Q | Blind pick | Correct? | `answerable` | Basis | Outcome |
|---|---|---|---|---|---|
| fixture guard change | B | **yes** | no | construction-tell | rejected — a correct blind pick, even at random, is a rejection. The question was a coin flip between "one row" and "two rows" |
| silent-pass criterion | B | no | **yes** | construction-tell | rejected — two options differed only by the AC number, marking that pair as the live one |
| BUG-1 strictness | A | no | no | — | survived round 1 |
| where the baseline was written | C | **yes** | **yes** | domain-knowledge | rejected — "a closed stage's record is never rewritten" is standard practice, so the question tested convention, not this ticket |

**Round 2 — three regenerated, none survived.** `construction-tell` rejections
had options rewritten at no round cost; the `domain-knowledge` rejection had its
**fact** replaced, spending its round.

| Q | Blind pick | Correct? | `answerable` | Basis | Outcome |
|---|---|---|---|---|---|
| same-commit pair | B | no | **yes** | domain-knowledge | rejected — **administered short** (blind pick wrong) |
| silent-pass criterion | D | **yes** | **yes** | construction-tell | rejected and **excluded** — the stem restated the fix, so the correct option echoed it |
| BUG-1 strictness | C | no | **yes** | construction-tell | rejected — **administered short** (blind pick wrong). The stem's "instead of the assertion being flipped" ruled out the two assertion-shaped options |
| baseline figures | C | no | **yes** | construction-tell | rejected — **administered short** (blind pick wrong) |

**Why the set could not be cleared.** Across two rounds and eight drafts, the
recurring failure was requirement (e): the stem kept telling the reader what
shape the answer had to be. Twice the fix itself was restated in the question,
and once the phrasing eliminated half the options. The facts were sound and
artifact-only; the wording leaked them.

## Notes

- `comprehension.md` from the review gate was retired to
  `comprehension-review-1.md` before this stage ran (§G E1/E2). No retired
  `comprehension-verify-*.md` exists, so `attempt: 1` satisfies X5.
- `stage: verify` names the stage being left (X2); `result: passed` (X3);
  `3/3` meets `threshold: 1.0` (X4); `evaluator.actor: owner` (X6).
