---
ticket: unit-tests-price-resolution
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-08-26
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

# Comprehension — unit-tests-price-resolution

> Single-owner gate control (ADR-009 / ADR-012 / ADR-025 / CG-1..CG-8). The owner
> answered multiple-choice questions generated from `plan.md` + `spec.md` and the
> panel findings already written to `review.md`. The gate records its decision
> only at 100% (CG-4).

## Review gate

**Result: passed — 3/3.**

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | `plan.md > Tests` has one row whose "Test file" column and "Test case" column disagree: it names a file and then says `none`. Which `AC-n` is that row, and what proves it instead? | `plan.md > Tests` (the `AC-10` row) joined with `plan.md > Tests > Notes on the table` | test declaration | 2 | **`AC-10`, proven instead by reading the roadmap row at `/verify`** (correct); `AC-3`, proven instead by reading the fixture at `/verify`; `AC-6`, proven instead by reading the roadmap row at `/verify`; `AC-9`, proven instead by reading the fixture at `/verify` | yes | `AC-10`, proven instead by reading the roadmap row at `/verify` | Yes |
| 2 | `plan.md > Files to change` gives the exact line range removed from the card, and `plan.md > Integration surface` gives three line numbers in the same file that must keep working. Which pair is correct? | `plan.md > Files to change` joined with `plan.md > Integration surface` | scope / blast radius | 2 | **Remove 91–121; keep 124, 402 and 428** (correct); Remove 91–121; keep 162, 266 and 345; Remove 93–121; keep 124, 402 and 428; Remove 93–121; keep 162, 266 and 345 | yes | Remove 91–121; keep 124, 402 and 428 | Yes |
| 3 | `plan.md > Integration surface` names `GetProducts`, `GetRelatedProducts` and `ProductListServer` as the card's dependants. The senior lens' `major` finding re-derived that list from the repository. Where did the plan's three names come from, and how many call sites did the finding count? | `plan.md > Integration surface` joined with `review.md > Panel Findings`, panel:senior (`major`) | **integration (CG-5)** | 2 | **A comment in `derivedProps.ts`; 8 call sites** (correct); A comment in `derivedProps.ts`; 6 call sites; The phase 14 row of `UNIT_TEST_ROADMAP.md`; 6 call sites; The phase 14 row of `UNIT_TEST_ROADMAP.md`; 8 call sites | yes | A comment in `derivedProps.ts`; 8 call sites | Yes |

Options are listed above with the correct one marked first for the record; they
were **presented** alphabetically, so position carried no signal (CG-2).

### CG-8 falsification record

Two rounds were run. The questions and their options were sent alone — no
`spec.md`, no `plan.md`, no ticket — to the `gate-falsifier` subagent.

- **Round 1 — all five questions rejected.** The falsifier picked the correct
  option on two of them and reported `answerable: yes` on all five. Bases: two
  `construction-tell` (options leaked the answer by shape), three
  `domain-knowledge` (engineering convention supplied the fact).
- **Round 2 — three questions survived.** Questions 1, 2 and 3 above were each
  answered **wrongly** and reported `answerable: no`. The falsifier's own words
  for them: "a blind guess", "unguessable without the plan", "the 2x2
  construction gives no lever".

### CG-6 note — the panel-seeded questions did not survive

`review.md > Panel Findings` records **four `major`** findings, so CG-6 would seat
up to two extra questions inside the CG-1 ceiling of five. Two were drafted, one
covering the three findings about the `AC-9` characterization test and one
covering the jsdom gap the performance lens raised. The falsifier answered
**both correctly** in round 2, so CG-8 dropped them, and the two regeneration
rounds were spent.

The gate is therefore a **full** gate at the floor — 3 asked, 3 correct,
`gate.min_questions` met — not a degraded one, so `degraded:` is empty. But the
consequence is recorded here plainly: **no `major` finding was examined by
question.** Every one of the four still carries an explicit disposition in
`review.md > Panel Findings`, which is where the accountability sits (RP-1), and
they are carried into `review.md > Required Follow-up Actions` so `/implement`
and `/verify` cannot lose them.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
