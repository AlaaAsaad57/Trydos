---
ticket: profile-closeout-scripted-and-live
stage: review
attempt: 4
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

> Gate record for the `review` stage, **round 4**. Rounds 1-3 are retired to
> `comprehension-review-1.md` … `-3.md`, so this round earns `attempt: 4` —
> strictly greater than the highest retired attempt, as X5 requires.
>
> Five questions: floor 3, ceiling 5 (CG-1). One on the mandatory integration
> axis (CG-5). Eight `major` findings this round; the ceiling allows four seeded
> questions (CG-6), so the four largest blast radii were chosen. Every `major` is
> dispositioned in `review.md`.
>
> **New questions again (CG-7b).** Rounds 1-3 asked about the session lift, the
> scripted trace, `profileWrites.ts`, the run-cost floor, the media host, the
> `PROF-04` deletion, `AC-10`'s missing mechanism, the cookie mirror, the expire
> route, and wall-clock headroom. This round keeps the same five axes and asks
> about the guard's route precedence, server-side token rotation, analytics
> escape, the pre-run host check, and the project timeout.
>
> All findings were on disk in `review.md > Panel Findings` before the first
> question was asked (RP-4). Options are alphabetical.
>
> The questions are written in plain words at the owner's request. The technical
> content is unchanged.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Where does the block-everything guard fail? | panel: **all three lenses** (T1); plan step 5; C-8; `actions/mock.ts:104-130` | **integration (CG-5)** | (a) **Both fake helpers call `route.continue()` on an unmatched call, which goes straight to the network — only `route.fallback()` passes it down to the guard** ✅ · (b) Playwright matches route handlers in registration order, so the guard registered first always wins and the fakes never run · (c) The guard cannot match the media host, because it is cross-origin · (d) The guard runs in the browser, so it cannot see any request the page makes | (a) | Yes |
| 2 | `SCRIPT-10` makes the app renew its login for real. Why does throwing away the test's own copy not protect the later tests? | panel:security + panel:senior (T4); `utils/server/authRefresh.ts:85,203-226`; C-9, `AC-5` | criterion ↔ mechanism | (a) **Renewal is done on the server and each pair works once, so the saved login file now holds a dead credential** ✅ · (b) The later tests each sign in again, so they spend two extra real codes · (c) The renewal only changes the browser cookie, which the discarded context already removes · (d) The saved login file is deleted at the end of every case, so nothing survives | (a) | Yes |
| 3 | What still sends data out of the browser even with the guard in place? | panel:security (T6); `utils/posthog.ts:58`, `instrumentation-client.ts`; NFR-2 | security / outward effect | (a) **Analytics and error reporting — PostHog to `/ingest`, plus Google Analytics and Sentry to other hosts** ✅ · (b) Nothing — the guard covers every call the page makes · (c) Only the media upload, which is why it needs CORS headers · (d) The three profile save legs, which go through `/api/proxy` | (a) | Yes |
| 4 | Commit A adds the picture-reading server to the checked list. What can go wrong? | panel:security + panel:senior (T11); plan step 1; `harness/guard.ts:80-91`; `AC-12` | blast radius | (a) **If that setting points at a host we did not add to the allowed list, the whole suite stops before it builds — all 64 cases** ✅ · (b) It slows the pre-run check, because one more address is fetched · (c) Nothing — the read host is the same as the write host · (d) The read host needs an API key, which the guard cannot supply | (a) | Yes |
| 5 | Why is a 60-second limit for the whole fake-test project wrong? | panel:performance + panel:senior (T7); plan step 11; `actions/auth.ts:396-421` | cost / budget | (a) **It also re-times the five existing fake tests, and it is too short for the sign-in, whose retry sleeps for the server's cooldown** ✅ · (b) It is longer than the 30-minute total, so it has no effect · (c) Playwright does not allow a per-project limit, only a global one · (d) The fake tests answer instantly, so any limit above zero is arbitrary | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
