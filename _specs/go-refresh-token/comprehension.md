---
ticket: go-refresh-token
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-24
links:
  clickup:
  github:
---

# Comprehension — go-refresh-token

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision. Run 2026-07-23 (decision: CHANGES_REQUESTED).

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | When does `HandleAuthedFetch` (server-side) skip the refresh exchange entirely on a 401? | **Cookie-write probe fails (pure RSC render — can't persist the rotated pair)** · user is a guest · refresh token older than 30 days · request method is POST | Cookie-write probe fails | yes |
| 2 | Which 401s trigger the refresh exchange (FR-3/FR-8)? | **Go-served 401s only (server: base = GO_BACKEND_URL; client: `x-backend-source: go`)** · all market 401s · verified users' 401s only · all services incl. chat/stories/comments/wallet | Go-served 401s only | yes |
| 3 | What request body does the `register-guest` fallback send under the new Go contract? | **No body at all** · `{old_guest_user_id}` · `{refresh_token}` · `{verificationId, otp}` | No body at all | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a (3/3 correct)

### Re-run 2026-07-23 — revised plan (decision: CHANGES_REQUESTED)

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | What does `/api/auth/expire` do first before clearing the session? | **Last-chance refresh attempt (nuke only on failure/absence)** · delete the refresh cookie up front · compare cookie generations · ask the client to confirm | Last-chance refresh attempt | yes |
| 2 | Who decides whether a client-triggered refresh is Go-eligible, and with what? | **The `/api/auth/refresh` route, via `isVerifiedMarketUser` + `isFromGoApi` on the supplied `{url, server}`** · fetchData via `x-backend-source` header · client store phone check · `HandleAuthedFetch` tagging | Refresh route, shared helpers | yes |
| 3 | After a proactive `{refreshed: true}`, what refetches server-rendered content? | **`router.refresh()` in `components/Home/Init.tsx`** · `window.location.reload()` · automatic RSC re-render on Set-Cookie · `/api/auth/expire` | router.refresh() in Init.tsx | yes |

- Score: n/a (3/3 correct)

### Re-run 2026-07-23 — plan revision 2 (decision: APPROVED)

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | When is the refresh exchange attempted, and what bounds the recovery chain (Approach rule 3)? | **First 401 only; attempt counter cap 2 (attempt 1 = post-refresh/jar retry, attempt 2 = post-expire retry; then surface error)** · every 401 with cap 3 · first 401 then unlimited retries · every 401 incl. a 5xx retry of the exchange | First 401 only; cap 2 | yes |
| 2 | What two conditions gate the expire route's last-chance refresh? | **Refresh cookie exists AND `isVerifiedMarketUser()` is false** · cookie exists AND logout guard armed · Go allow-list URL AND cookie · verified AND valid access token | Cookie exists + not verified | yes |
| 3 | What does the rollback section flag as surviving a post-publish revert? | **The live ~30-day `MARKET-REFRESH-TOKEN` cookie (keep its purge-list entry in any revert patch)** · the routing revert itself · orphan guest accounts needing DB cleanup · a cached backend-tag header | Live 30-day refresh cookie | yes |

- Score: n/a (3/3 correct)

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

> Run 2026-07-24 (decision: PASSED).

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Per implement.md, what NFR-3 (token confidentiality) fix was applied inside the OTP login route beyond the contract change? | **Removed a token-logging `console.log(otp_response)` (logged the full token pair)** · dropped Bearer auth entirely · moved `refresh_token` to localStorage · added an X-Refresh header to the browser response | Removed a token-logging console.log | yes |
| 2 | In `HandleAuthedFetch`, when does the bodyless register-guest fallback actually run (vs. returning the 401 unchanged)? | **Go-base request, cookie writable, and no refresh cookie exists (rollout window)** · on every market 401 · when the refresh exchange returns 401 · during a pure RSC render | Go-base request, cookie writable, no refresh cookie | yes |
| 3 | How does the implementation bound the recovery chain and protect against refresh-token storms (AC-12 / NFR-1)? | **`authAttempt` counter capped at 2 + module-scope single-flight, no 5xx/network retry** · unlimited retries until success · a 30-second timeout on the whole chain · cap of 5 attempts with a 5xx retry of the exchange | authAttempt counter cap 2 + single-flight, no 5xx retry | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a (3/3 correct)
