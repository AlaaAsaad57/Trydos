---
ticket: otp-entry-three-attempt-lock
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-08-30
result: passed
score: 2/2
threshold: 1.0
decision: APPROVED
missed:
degraded: "2 of 3 — 3 of 5 questions could not clear CG-8 after two falsifier rounds; integration question retained"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — otp-entry-three-attempt-lock

> Single-owner gate control. The owner answered questions generated from
> `plan.md`, `spec.md` and the panel findings already written into
> `review.md > Panel Findings`.

## Review gate

Two falsifier rounds ran before the owner saw anything. Round 1: the falsifier
answered all five correctly — four by `construction-tell`, one by
`domain-knowledge`. The four construction tells were repaired by rewriting their
options (no round spent, per ADR-028); the general-knowledge question had its
underlying fact replaced, which spent one of its two rounds.

Round 2: the falsifier still answered Q1, Q4 and Q5 correctly, so those three were
dropped. Q2 it could not answer at all. Q3 it reported as `answerable: yes` but
its blind pick was **wrong** — general knowledge pointed at the re-auth widget
rather than the settings phone change — so it is at-chance evidence and was
administered under the degraded rule.

The set was therefore administered short: **two questions instead of three**. The
CG-5 integration question was **not** among the excluded — it is row 2 below.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | AC-4 says the third wrong code replaces the wording with a "tries ran out" line. The panel found AC-4 is unproven on one surface. Which omission causes that? | `review.md > Panel Findings`, panel:senior major 2; `plan.md` step 6; Tests AC-4 row | coverage gap | 2 | **FullEnhancedLoginWidget is never told to write the new messages into its own setError** / EnterPinScreen's message branches are never told to render the lock line separately from the expired line / InlineVerifyPanel is never told to render the hook's error while its own countdown is running / VerifyPhoneFlow is never told to pass the hook's error down to EnterPinScreen | yes | FullEnhancedLoginWidget's own setError | **Yes** |
| 2 | The Integration surface names one host of the shared verify flow as the one to watch. Which host, and what makes it different from the others? | `plan.md > Integration surface` | integration (CG-5) | 1 | **The settings phone change, because it injects a different verify function into the same hook** / The cart order button, because InlineVerifyPanel renders its own pin inputs instead of EnterPinScreen / The expired-session prompt, because SessionExpiredWidget reaches the flow through a store marker / The navbar re-auth widget, because ConfirmMobilePhoneWidget opens the flow with the number already locked | short | The settings phone change | **Yes** |

- Score: 2/2 (1.0), meets the `gate.threshold` of 1.0 for what was asked (CG-4).

### Questions dropped at falsification, for the record

| # | Fact it tested | Round 2 outcome | Why dropped |
|---|----------------|-----------------|-------------|
| Q1 | `RdbPinInputs` fires `onComplete` on every keystroke once the value already holds six digits (panel:senior major 1) | pick correct, `answerable: no` | The falsifier's blind pick was right, so it does not test the artifact |
| Q4 | AC-3's digits-cleared half is declared `existing`, proved by the case that clears the wrong code | pick correct, `answerable: no` | Same |
| Q5 | `spec.md > EC-4` records the quiet screen left by cutting the re-shown lock message | pick correct, `construction-tell` | Same; the stem's word "instead" leaked the shape |

## Verify gate

> Not yet run. Filled in at `/verify`.
