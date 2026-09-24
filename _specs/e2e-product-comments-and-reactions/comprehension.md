---
ticket: e2e-product-comments-and-reactions
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-09-21
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

# Comprehension — e2e-product-comments-and-reactions

> Gate record for the `verify` stage. The review stage's record is retired
> alongside this file as `comprehension-review-1.md`, so this stage earned its
> own (§G, E1/E2). No `comprehension-verify-*.md` existed, so this is
> `attempt: 1` (X5).
>
> `degraded:` is **empty on purpose**: three questions were administered, which
> meets the floor, and all three cleared CG-8 **outright** — the falsifier
> picked wrongly on each and could justify none of them. Neither a count
> shortfall nor a clearance shortfall applies.

## Verify gate

Questions generated from `implement.md`, `verify.md` and `spec.md`. No reviewer
panel runs at this stage (ADR-010), so CG-6 does not apply.

| # | Question (from the artifact) | Sources (implement.md/AC-n/plan § — **two** when Hops is 2) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The mark that proves a dashboard card belongs to this run is a token. Which file does that token helper come from? | `plan.md > Integration surface` (the reused helper) + `implement.md > Rework` (the ownership bind that uses it) | integration (CG-5) | 2 | actions/compare.ts / actions/orders.ts / **actions/story.ts** / actions/wishlist.ts | yes | actions/story.ts | Yes |
| 2 | How many cases does the page-walk unit test file carry? | `implement.md > Tests written`, the `AC-11 (the walk itself)` row | test coverage | 1 | Five / Four / Nine / **Seven** | yes | Seven | Yes |
| 3 | Which case proves that a question the shop has answered no longer offers the shopper an Edit control? | `spec.md > AC-16` + `implement.md > Tests written` (the case map) | acceptance mapping | 2 | CMT-04 / **CMT-05** / CMT-06 / CMT-07 | yes | CMT-05 | Yes |

- Score: 3/3

### Falsification, in short

Two rounds of fact changes — the maximum — plus one free option rewrite.

- **Round 1** rejected all five. Four were picked **correctly** blind and one
  carried a construction tell: "about 2.9 minutes" was the only precise-looking
  number among round ones, which is the usual shape of a real figure. The
  falsifier's reasoning was the lesson: it answered from *what a sensible
  engineer would do*, so the facts were derivable rather than specific.
- **Round 2** replaced them with facts that cannot be reasoned out — which file
  a helper happens to live in, how many cases a file happens to carry, which
  case id happens to cover a criterion. Two cleared outright. Two were still
  answered correctly and, with the rounds spent, were dropped.
- **One free option rewrite** saved question 1. Its first option set listed
  three files that were implausible homes for a token helper, which the
  falsifier said was exactly how it narrowed the choice. Re-drawn as four
  sibling action files, it picked wrongly and could justify nothing.

The bar this enforces: these three questions, with no artifact attached, score
at chance. On the final pass the falsifier answered **none** of them correctly.
