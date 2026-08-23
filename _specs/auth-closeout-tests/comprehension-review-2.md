---
ticket: auth-closeout-tests
stage: review
attempt: 2
status: complete
owner: developer
updated: 2026-08-23
result: passed
score: 4/4
threshold: 1.0
decision: CHANGES_REQUESTED
missed:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — auth-closeout-tests

> **This front matter is the gate record.** `attempt: 2`, strictly greater than
> the retired `comprehension-review-1.md` (attempt 1), which was moved aside on
> entry to this round (§G E1/E2). New questions on the same axes (CG-7) — none
> repeats round 2's.

## Review gate

Four questions (CG-1 floor 3, ceiling 5): one on the integration axis (CG-5),
one per `major` panel finding (CG-6), and one on the highest-value `minor` —
which, like both majors, is a check that could report "pass" for a case it cannot
see. Options alphabetised so position carried no signal. Every question is
sourced from text already written to `review.md > Panel Findings` (RP-4).

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|
| 1 | The plan stubs the avatar editor for AC-12. Why does that turn the refused-upload case into a silent pass? | panel:senior `major` 1; `plan.md > OQ-4` | correctness / silent pass | **The upload code reads `getImage()` and `getImageScaledToCanvas().toDataURL()`; a stub without them makes the file conversion throw, and the component's own catch swallows it** / A stubbed editor renders no file input / The stub returns a fixed image so the refusal branch is never taken / The unit setup turns the refusal into a network error | The upload code reads `getImage()` and `getImageScaledToCanvas().toDataURL()`; a stub without them makes the file conversion throw, and the component's own catch swallows it | ✅ |
| 2 | AC-12 says the file covers "what it says when the upload is refused". What did the panel find? | panel:senior `major` 2; `spec.md` AC-12 | criterion validity | **The screen says nothing — the failure is only logged, so the criterion describes behaviour the app does not have** / The message is hardcoded English / A global toast owns the message / The message appears after the navigation | The screen says nothing — the failure is only logged, so the criterion describes behaviour the app does not have | ✅ |
| 3 | The panel found AC-15's mirror guard could pass while reading the OLD stored copy. Why? | panel:senior `minor`; `plan.md > AC-15` | correctness / silent pass | **The mirror falls back to the previous profile for every field, so with an empty stored copy the assertion is satisfied either way** / It asserts on the request body / Fake timers resolve the update early / The stored copy is a stale cookie read | The mirror falls back to the previous profile for every field, so with an empty stored copy the assertion is satisfied either way | ✅ |
| 4 | The plan says a stall will "name the leg" because each phase is its own `test.step()`. Why is that not enough on CI? | `plan.md > Live timing`, `> Integration surface`; panel:senior `minor` | **integration (CG-5)** | **The live run uses the list and json reporters only, so the job log shows a bare timeout with no step title — the leg and backend must be repeated inside each timeout message** / Step titles are stripped on abort / Steps appear only when a test passes / The steps are nested too deeply | The live run uses the list and json reporters only, so the job log shows a bare timeout with no step title — the leg and backend must be repeated inside each timeout message | ✅ |

- Score: 4/4. Threshold 1.0 met.
