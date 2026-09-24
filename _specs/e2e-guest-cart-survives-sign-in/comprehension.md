---
ticket: e2e-guest-cart-survives-sign-in
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-09-23
result: passed
score: 4/4
threshold: 1.0
decision: PASSED
missed:
degraded: "4 of 4 administered, 2 cleared CG-8 outright — 2 admitted on the falsifier's miss (Q2 construction-tell, Q4 injected-context); integration question included"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — e2e-guest-cart-survives-sign-in

> Gate record for `/verify`, attempt 1. The review record was retired to
> `comprehension-review-1.md` at the start of verify round 1; no verify record
> existed before this one. Questions derived from `implement.md` (including its
> round-2 rework), `verify.md` and `spec.md`. No panel at `/verify` (ADR-010),
> so CG-6 does not apply.

## Verify gate

| # | Question (from the artifact) | Sources (implement.md/AC-n/plan § — **two** when Hops is 2) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The verify record cites one line of utils/fetchData.ts as evidence for why the first verify run failed. Which line? | `verify.md` round 1 > "Why AC-5 failed" | integration (CG-5) — the app's `fetchData` layer against the backends' response envelope | 1 | utils/fetchData.ts:562 · utils/fetchData.ts:730 · **utils/fetchData.ts:784** · utils/fetchData.ts:835 | yes | utils/fetchData.ts:784 | Yes |
| 2 | Which verify run spent exactly one real one-time code on Shopper A? | `verify.md` > run table (four runs); `plan.md` > "How AC-9 is proven" (probe 1 thrown in the guest step, before the second sign-in) | AC-9 / code budget | 2 | The BUY-05-only run of round 2 · **The first AC-9 probe run** · The full-file run of round 2 · The second AC-9 probe run | short | The first AC-9 probe run | Yes |
| 3 | How long did BUY-05 take in the full-file verify run? | `verify.md` > full-file run | lane time / runtime impact | 1 | 1.8 minutes · 2.2 minutes · **2.7 minutes** · 3.4 minutes | yes | 2.7 minutes | Yes |
| 4 | The rework after the failed verify renamed one field of CartMoneyAnswer. What was it renamed from, and to? | `verify.md` round 1 > "Why AC-5 failed"; `implement.md` > "Rework after the failed verify (round 2)" | AC-5 fix | 2 | From hasContent to isSuccessful · From hasContent to success · From success to hasContent · **From success to isSuccessful** | short | From success to isSuccessful | Yes |

Correct answers in **bold**. Options listed alphabetically (CG-2). Two-hop
share: 2 of 4 (Q2, Q4) — half, meeting CG-2(d) / X7.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Falsification log (CG-8)

- **Round 1** (5 questions). Cleared: Q1 (body field checked vs sent), Q5
  (code total). Rejected: Q2 (blind-correct, `injected-context`), Q3
  (`answerable: yes`, `injected-context`), Q4 (blind-correct,
  `domain-knowledge`) → facts changed; Q5's stem made precise.
- **Round 2.** Cleared: Q2 (teardown call), Q4 (BUY-05 duration). Rejected: Q1
  (`answerable: yes`, `domain-knowledge`, plus a sibling leak into Q3) → fact
  changed; Q3 (`injected-context`) → fact changed (last round); Q5
  (blind-correct) → fact changed.
- **Round 3.** Cleared: Q1 (fetchData line), Q4. Rejected: Q2 (blind-correct,
  `domain-knowledge`) → fact changed; Q3 (blind-correct) → rounds spent,
  dropped; Q5 (blind-correct, `construction-tell` from "first pass") → fact
  changed.
- **Round 4** (4 questions). Cleared: Q1, Q2 (one-code run), Q3 (duration).
  Q4 (rename) blind-wrong but `answerable: yes` through a sibling leak from
  Q1's stem → Q1's stem reworded.
- **Round 5 (final).** Blind picks wrong on all four; `sibling-leak: no`. Q1
  and Q3 cleared outright. Q2 (`answerable: yes`, `construction-tell`) and Q4
  (`answerable: yes`, `injected-context` — the host again injected
  `CLAUDE.md`) had spent their fact rounds; admitted on the falsifier's miss
  under the degraded rule (ADR-028 / ADR-039), marked `short`.
