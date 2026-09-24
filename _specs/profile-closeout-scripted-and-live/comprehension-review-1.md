---
ticket: profile-closeout-scripted-and-live
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-08-25
result: passed
score: 5/5
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

# Comprehension — profile-closeout-scripted-and-live

> Gate record for the `review` stage. No `comprehension.md` was present on entry
> and no retired `comprehension-review-*.md` exists, so this is `attempt: 1`
> (`rules/lifecycle-protocol.md` §G, E1/E2 and X5).
>
> Five questions: the floor is 3 and the ceiling is 5 (CG-1). One is on the
> mandatory integration axis (CG-5), sourced from `plan.md > Integration
> surface`. The remaining four are seeded by `major` panel findings (CG-6), all
> of which were written into `review.md > Panel Findings` before the first
> question was asked (RP-4). Eleven distinct `major` findings exist and the
> ceiling allows four seeded questions, so question 4 covers two related findings
> (M8 + M9); every `major` is still dispositioned in `review.md`.
>
> Options are listed alphabetically so position carries no signal.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Step 1 lifts the four session helpers out of `profile.live.spec.ts` into the harness. Which cross-flow consequence did the panel confirm the plan missed? | `plan.md > Integration surface`; panel:senior (M6, M7) | **integration (CG-5)** | (a) **A second copy in `auth.live.spec.ts`, and one state path shared by three specs** ✅ · (b) Every one of the 54 existing cases must be re-registered in `E2E_SCENARIOS.md` · (c) Nothing — `harness/session.ts` is imported only by `profile.live.spec.ts`, so the lift is self-contained · (d) The lift forces `actions/mock.ts` to add a fourth route pattern for the media host | (a) | Yes |
| 2 | The plan puts one real sign-in inside `profile.scripted.spec.ts`. What does `playwright.config.ts` do with that today? | panel:security + panel:senior (M1); `playwright.config.ts:22-25,113-121` | security / artifacts | (a) The scripted project already sets `trace: off`, so the real session changes nothing · (b) **The scripted project keeps `trace: retain-on-failure`, justified by "no real session and no real secrets"** ✅ · (c) The scripted project records `video: on`, which `test-e2e.yml` encrypts before upload · (d) The scripted project runs in its own worker, so the session never reaches an artifact | (b) | Yes |
| 3 | `AC-5` requires showing the second write is a retry carrying the new value, not a rollback carrying the old one. What does `tests/e2e/harness/profileWrites.ts` actually do today? | `AC-5`; panel:security (M2); `harness/profileWrites.ts:33-60` | criterion ↔ mechanism | (a) It compares each write's body against the value being saved, so `AC-5` already works · (b) It counts the writes per leg, which tells a retry from a rollback · (c) **It deliberately dropped value comparison and reads no request body — only status codes** ✅ · (d) It reads the `success` flag from the response body, which settles the question | (c) | Yes |
| 4 | The plan states a run cost of two real one-time codes. Which pair of facts makes that a floor rather than the cost? | `plan.md > Run cost`; `AC-14`, NFR-4, C-2, C-4; panel:performance (M8 + M9) | cost / external limit | (a) **Playwright restarts the worker after a failing test so the shared sign-in re-runs; and `sendOtpWithRetry` defaults to 5 re-sends** ✅ · (b) The guard re-runs the target check once per project; and the media upload needs its own code · (c) The live and scripted projects each sign in once; and the nightly schedule doubles the run · (d) Two configured numbers already have accounts; and `AC-4`'s overlay send cannot be intercepted | (a) | Yes |
| 5 | Step 2 adds the media backend to the pre-run staging target check (`AC-12`). What did the panel find about that host? | `AC-12`, `AC-7`; panel:security (M3); `harness/guard.ts:21-42` | blast radius / outward traffic | (a) **Every other `ALLOWED_HOSTS` entry carries a staging name, but the media host has no staging twin — and nothing deletes the uploaded object** ✅ · (b) It is already in `ALLOWED_HOSTS`, so step 2 is a no-op and can be dropped · (c) The guard validates scheme, port and path as well as hostname, so the entry is fully bounded · (d) The media host is only reached by the scripted cases, which fake the upload, so no real file is written | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
