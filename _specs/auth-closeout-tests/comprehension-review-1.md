---
ticket: auth-closeout-tests
stage: review
attempt: 1
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

> **This front matter is the gate record.** `attempt: 1` because no
> `comprehension.md` existed in this workspace and none was retired — round 1 of
> `/review` ended `CHANGES_REQUESTED` without a quiz, which is recorded in that
> round's `review.md` as a deliberate reading of the protocol.

## Review gate

Four questions (CG-1 floor 3, ceiling 5), one on the integration axis (CG-5),
the rest seeded from `major` panel findings already written to
`review.md > Panel Findings` (CG-6, RP-4). Options were listed alphabetically so
position carried no signal.

**Seven `major`s, four questions.** The ceiling caps questions, not
accountability (CG-6): related findings were grouped — `major` 1 and 2 share one
question, as do 6 and 7 — and `major` 3 is the integration question. `major` 5
(the state-file path) has no question because it exists only if step 1 survives
`major` 1; it is dispositioned in `review.md` regardless.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|---|---|---|---|---|---|
| 1 | The plan edits `tests/e2e/actions/auth.ts`, the shared sign-in action. Which spec files depend on it? | `plan.md > Integration surface`; panel:senior `major` 3 | **integration (CG-5)** | **auth.live, profile.live and auth.scripted — including one that runs without staging** / auth.live and profile.live only / Every live spec, since they all sign in / guest.live and session.live | auth.live, profile.live and auth.scripted — including one that runs without staging | ✅ |
| 2 | Two lenses independently concluded steps 1 and 2 should not exist. On what grounds? | `plan.md > Steps`; panel:senior `major` 1 + 2 | scope / smallest-change | **No AC needs either — the new spec can take the ordinary page fixture, and `test.setTimeout()` already aborts during the OTP sleep** / Both edit files owned by other tickets / The helpers have drifted too far apart / Together they would push the run past its budget | No AC needs either — the new spec can take the ordinary page fixture, and `test.setTimeout()` already aborts during the OTP sleep | ✅ |
| 3 | `docs/testing/E2E_SCENARIOS.md` is a tracked register of browser cases. What does this ticket owe it? | `plan.md > Files to change`; panel:senior `major` 4 | traceability / artifacts | **Rows for the new cases, a case-id prefix, and refreshed line citations for the cases the lift moves** / Nothing — it is generated / Nothing — unit suite only / Only a note that the suite gained a file | Rows for the new cases, a case-id prefix, and refreshed line citations for the cases the lift moves | ✅ |
| 4 | Why is sizing the new spec's `test.setTimeout()` from the sum of timeout caps the wrong number? | `plan.md > Live timing`; panel:performance `major` 6 + 7 | correctness / resource budget | **Caps are what the app is allowed to take, not what it takes — the same real sign-in fits inside the 120s default today** / Playwright ignores it on the live project / The sum omits the cart and rotation polls / The sum should be doubled | Caps are what the app is allowed to take, not what it takes — the same real sign-in fits inside the 120s default today | ✅ |

- Score: 4/4. Threshold 1.0 met.
