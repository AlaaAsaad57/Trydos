---
ticket: profile-closeout-scripted-and-live
stage: review
attempt: 2
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

> Gate record for the `review` stage, **round 2**. The round-1 record was retired
> to `comprehension-review-1.md` on entry (`rules/lifecycle-protocol.md` §G, E1),
> so this round earns its own at `attempt: 2` — strictly greater than the highest
> retired attempt, as X5 requires.
>
> Five questions again: the floor is 3 and the ceiling is 5 (CG-1). One is on the
> mandatory integration axis (CG-5). Nine distinct `major` findings exist this
> round and the ceiling allows four seeded questions (CG-6), so the four largest
> blast radii were chosen; every `major` is still dispositioned in `review.md`.
>
> **The questions are new (CG-7b).** Round 1 asked about the session lift, the
> scripted project's trace, `profileWrites.ts`'s value comparison, the run-cost
> floor and the media host's staging status. This round keeps the same five axes
> and asks different questions on each — replaying round 1's would test memory,
> not comprehension.
>
> All findings were written into `review.md > Panel Findings` before the first
> question was asked (RP-4), including the owner's correction to `N1`, which was
> recorded there before `N1` was put to them.
>
> Options are listed alphabetically so position carries no signal.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan appends `PROF-05`, `PROF-06` and `PROF-07` to `profile.live.spec.ts` after the existing four cases. What did the panel find about that placement? | panel:performance (N2); plan step 7; `profile.live.spec.ts:611-628` | **integration (CG-5)** | (a) `PROF-04` leaves a probe size on the account, so the new cases inherit dirty data · (b) **`PROF-04`'s `finally` calls `forgetSavedSession()`, so all three new cases open with no session and blame `PROF-01`** ✅ · (c) The new cases run in a different worker, so they need their own sign-in anyway · (d) They must run before `PROF-01` because the picture screen loads before the profile card | (b) | Yes |
| 2 | `AC-10` requires every scripted case to fail if its own fake was never used. What does the faking layer offer for that today? | `AC-10` (FR-10); panel:senior (N4); `actions/mock.ts:61-130` | criterion ↔ mechanism | (a) `mockBackend` returns the list of keys it matched, so the assertion is a one-liner · (b) `mockBackendSequence` throws when its list of responses is not exhausted · (c) **Nothing — both helpers return `void` and record no matched keys, and the plan adds only route patterns** ✅ · (d) Playwright fails a test automatically when a registered route never matches | (c) | Yes |
| 3 | With the owner's correction recorded — the backend will not move a number between two existing accounts — what remains the live problem with `AC-4`, and what resolves it? | `AC-4`, C-2; panel:security + panel:senior (N1) as corrected; `services/auth.ts:278-324`, `app/api/proxy/route.ts:170-172` | security / outward effect | (a) **A refused verify returns no `id_token`, so the save never fires; faking the verify and the save legs through `/api/proxy` makes the UI coverage deterministic** ✅ · (b) Nothing remains — `AC-4` can be asserted against the real backends exactly as the plan describes · (c) The overlay cannot be reached without a second sign-in, so `AC-4` needs its own session · (d) The save must be allowed to reach the backend so the refusal itself can be asserted | (a) | Yes |
| 4 | The owner confirmed `media_server.ramaaz.dev` is staging-only. What did the panel find in the repository that bears on that? | `AC-12`, `AC-7`; panel:security + panel:senior (N3); `next.config.ts:180`, `utils/server/helpers.ts:71` | blast radius / outward traffic | (a) It already appears in `guard.ts` `ALLOWED_HOSTS` under a different spelling · (b) It is only ever reached server-side, so the browser never touches it · (c) **It is the only media host in the tree — in `next.config.ts` `images.domains`, the service worker, and a production OG-image rewrite to `media.ramaaz.dev` — with no staging twin** ✅ · (d) Its staging twin `media_develop.ramaaz.dev` is what `.env.development` actually points at | (c) | Yes |
| 5 | The revision states a run-wide worst case of 12 real one-time codes. Why is that still wrong? | `AC-14`, NFR-4; panel:performance (N7); `actions/auth.ts:396-421`, `playwright.config.ts:56` | cost / external limit | (a) **All eight existing sends use the same retry helper, and each send is bounded by the case timeout rather than `maxAttempts` — so the run-wide worst is nearer 16-20** ✅ · (b) Playwright's `retries: 2` on CI multiplies every send by three · (c) The nightly schedule runs the suite twice, doubling every number · (d) Two of the existing sends were double-counted, so the true worst case is lower | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
