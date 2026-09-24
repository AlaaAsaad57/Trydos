---
ticket: checkout-address-totals-and-cart-lines
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-09-05
result: passed
score: 4/4
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

# Comprehension — checkout-address-totals-and-cart-lines

> **This front matter is the gate record.** A gated stage may not be left unless
> `result: passed`, `score` meets `threshold`, and `stage` names the stage being
> left.

## Result

Four questions asked, four answered correctly. `CG-4` requires 100%, so the gate
passes and the owner's decision is recorded.

**Not degraded.** The gate's floor is 3 and its ceiling is 5; four questions were
asked, so `degraded:` is empty.

## Questions asked

Every question was sent to `gate-falsifier` **alone** — no plan, no spec, no
ticket, no repository — and survived: the falsifier's blind pick was wrong and it
reported `answerable: no`.

| # | Axis | Question | Answer given | Falsified |
|---|------|----------|--------------|-----------|
| 1 | integration surface (`CG-5`) | How many spec files import each of the three shared test modules | `actions/cart.ts` 3, `liveSession.ts` 6, `selectors.ts` 10 | yes |
| 2 | files to change, two-hop | Which file round 3 removed from Files to change | `tests/e2e/fixtures.ts` | yes |
| 3 | numbers | New one-time codes and new staging writes per run | 0 codes, 10 writes | yes |
| 4 | `AC-n` to scenario, two-hop | Which criteria share `BUY-03` with `AC-8`–`AC-10` | `AC-1` to `AC-4` | yes |

Two of the four are two-hop, which meets `CG-2d` (at least half, rounded up).
One is the mandatory integration question (`CG-5`).

## What the falsification cost, recorded honestly

The set took **three falsification passes and one regeneration round**. Eleven
question versions were built and seven were thrown away:

- **Pass 1** — five questions. Four were answered correctly by the falsifier, all
  on `construction-tell`: in each, one option was the only one that explained
  itself, which is pickable with the artifact closed.
- **Pass 2** — options rewritten (free under `CG-8`, two rewrites per question).
  All four failed again; the falsifier eliminated distractors by logic, not by
  knowing the facts.
- **Pass 3** — second and final option rewrite. One survived. Q4 failed on
  **`domain-knowledge`** — "cleanup should use an API helper rather than the UI"
  is general convention, so the fact itself was generic. That spent one of the
  two regeneration rounds.
- **Regeneration round 1** — three new questions on arbitrary project counts. One
  survived.
- **Regeneration round 2** — two new two-hop questions. One survived.

## `CG-6` could not be satisfied, and that is recorded

`CG-6` asks for one extra question per `major` panel finding, within the ceiling.
`review.md` records **12 distinct majors**, and **no major-seeded question
survived falsification** — every version was answerable from the shape of the
options or from engineering convention. The ceiling caps questions, not
accountability: all 12 majors are dispositioned in
`review.md > Panel Findings` and carried into the follow-up actions.

## Practice before the gate (`LP-5`)

Five practice questions were asked and not scored: two before the walkthrough
command and three inside it. Four were answered correctly. One was not — the
owner picked "`SetDefault` is the only writer of the account's default address"
where the answer is "`PlaceOrder` posts the order to whichever address is
`is_default === 1`". The distinction is write-side versus read-side, and it is
why a failed cleanup is dangerous rather than untidy. None of the practice
questions was reused in the gate.
