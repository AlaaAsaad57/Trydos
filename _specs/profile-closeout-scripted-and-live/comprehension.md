---
ticket: profile-closeout-scripted-and-live
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-08-25
result: passed
score: 4/4
threshold: 1.0
decision: PASSED
missed:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — profile-closeout-scripted-and-live

> Gate record for the **verify** stage. No `comprehension-verify-*.md` exists, so
> this is `attempt: 1`. The five review-stage records are retired at
> `comprehension-review-1.md` … `-5.md` and belong to that stage, not this one.
>
> Four questions: floor 3, ceiling 5 (CG-1). One on the mandatory integration
> axis (CG-5). **No panel at verify** (ADR-010), so CG-6 does not apply and no
> question is seeded by a finding.
>
> Questions are drawn from `implement.md` + `verify.md` + `spec.md`, and the
> integration question asks whether the plan's declared surface actually held.
> Options are alphabetical.

## Verify gate

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The session lift moved helpers out of two existing specs. What proves it changed nothing for them? | `implement.md` "Measured, not assumed"; plan Integration surface | **integration (CG-5)** | (a) **A full live run after the lift: `PROF-01..04` and `RECOV-01` all passed, with only `AUTH-01` red for the wallet as before** ✅ · (b) Nothing proves it — the lift was taken on trust · (c) The typecheck passed, which is enough for a change that only moves code · (d) The unit suite covers the harness, so its 1512 tests cover this | (a) | Yes |
| 2 | `AC-6` is recorded as only partly met. What exactly is not proved? | `verify.md` AC table; `AC-6` (FR-6) | criterion ↔ evidence | (a) Nothing — `AC-6` is fully met and the note is precautionary · (b) That the app asks the shopper to sign in again after a failed renewal · (c) **That the number the shopper was working with is kept — the prompt carries no marker for it** ✅ · (d) That the renewal actually fails, because the fake may not match | (c) | Yes |
| 3 | `AUTH-03` failed in the final live run. What is its status? | `verify.md` "Browser evidence"; `auth.live.spec.ts` | regression vs pre-existing | (a) Caused by the session lift, which changed how `auth.live.spec.ts` saves its session · (b) **Pre-existing and intermittent — `auth.live.spec.ts` never hands its session on, before or after this change** ✅ · (c) The same wallet backend fault as `AUTH-01` · (d) Unknown, and it blocks the ticket until diagnosed | (b) | Yes |
| 4 | One part of the spec is knowingly not met. Which, and why is it accepted? | `verify.md` "Non-functional"; NFR-2; plan "Analytics" | accepted risk | (a) `C-7` — a protected runtime path had to be changed after all · (b) **`NFR-2` — the deliberate failures send the shopper's phone and e-mail to Sentry; turning that off needs a protected runtime path** ✅ · (c) `NFR-3` — an unconfigured environment fails instead of skipping · (d) `NFR-4` — the real code count per run is not recorded anywhere | (b) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
