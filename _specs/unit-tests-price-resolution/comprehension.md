---
ticket: unit-tests-price-resolution
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-08-26
result: passed
score: 2/2
threshold: 1.0
decision: PASSED
missed:
degraded: "2 questions asked against a floor of 3. Both regeneration rounds were spent: the CG-8 falsifier answered every round-1 question and two of the four round-2 questions correctly, blind. The two below are the ones it got wrong. Administered short rather than skipped (ADR-028)."
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-price-resolution

> Verify gate. Questions come from `implement.md` and `spec.md`. No advisory
> panel runs at this stage (ADR-010), so CG-6 does not apply.

## Verify gate

**Result: passed — 2/2.**

| # | Question | Source | Axis | Hops | Options (correct marked) | Falsified (CG-8) | Owner's answer | Correct? |
|---|----------|--------|------|------|--------------------------|------------------|----------------|----------|
| 1 | The Tests table has ten rows. Which acceptance criterion declares no test, and which two are marked as already covered by an existing file? | `plan.md > Tests` joined with `implement.md > Tests written` | test declaration | 2 | AC-10 none / AC-1, AC-2 existing; **AC-10 none / AC-7, AC-8 existing** (correct); AC-3 none / AC-1, AC-2 existing; AC-3 none / AC-7, AC-8 existing | yes — round 2, picked wrongly, `answerable: no` | AC-10 none; AC-7, AC-8 existing | Yes |
| 2 | The moved rule returns two values. Which consumer forces the second value's shape, and what happens to the deal-border decision at line 162 of the card? | `implement.md > Changes made` joined with `plan.md > Integration surface` and the FA-1 row | **integration (CG-5)** | 2 | Banner seeds state / border stays in the card; **Banner seeds state / border leaves as a prop to `ProductColorsCards`** (correct); `RenderPrice` re-applies / border stays; `RenderPrice` re-applies / border leaves as a prop | yes — round 2, picked wrongly, `answerable: no` | Banner seeds state; border leaves as prop | Yes |

The correct option is marked above for the record. Both questions were
**presented** alphabetically, so position carried no signal, and the correct
option sat second in both (CG-2).

### CG-8 falsification record

The questions and their options were sent alone — no `spec.md`, no `plan.md`, no
ticket, no repository — to the `gate-falsifier` subagent. Two rounds, which is
all that is allowed.

- **Round 1 — all five questions rejected.** The falsifier picked correctly on
  four of five and reported `answerable: yes` on all five. Bases: two
  `domain-knowledge` (the jsdom `rgb()` normalisation and where a timezone is
  conventionally pinned are both general engineering knowledge), three
  `construction-tell` (the stem or the option pairing leaked the answer).
- **Round 2 — two survived.** Questions 1 and 2 above were each answered
  **wrongly** and reported `answerable: no`: "pure artifact bookkeeping … all four
  combinations are equally plausible with no document", and "two independent
  binary axes with no external signal … effectively random". The other two were
  answered correctly and dropped: the renderer-source question because a real file
  name reads more plausible than a roadmap row, and the build-profile question
  because a heavyweight check pairs with a profile literally named `full`.

### Why the gate is short, and what that costs

`gate.min_questions` is 3 and two were asked. Both regeneration rounds were spent,
so the remaining choice was to ask the two the falsifier could not answer, or to
ask nothing. ADR-028 says short, never nothing, and says to record it — that is
the `degraded:` line above.

What is lost is breadth, not rigour: the two questions that survived cover the
test-declaration axis and the mandatory integration axis, and both were answered
correctly. What is **not** covered by question at this gate: the three deviations
in `implement.md`, and `BUG-1`. Both are recorded in `verify.md` where the owner
read them before the decision.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
