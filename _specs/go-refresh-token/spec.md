---
ticket: go-refresh-token
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-23
links:
  clickup:
  github:
---

# Spec — go-refresh-token

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Go refresh-token integration (guest authentication & token renewal)

## Business Goal

Today a shopper's session **is** preserved across token expiry — but by an
insecure mechanism: on 401 the app re-registers sending `old_guest_user_id`,
and the backend hands out a fresh token for **whatever id the client sends**.
Ids are sequential and guessable, so this same path is an account-takeover
hole. The new Go contract closes it: the re-issue-by-id path no longer
exists, and the rotating **refresh token** (an unguessable, single-use,
encrypted secret) becomes the mechanism that keeps the same account and cart
across expiry. This ticket must therefore deliver **equivalent session
continuity** through the secure path — same-account renewal within 30 days —
while eliminating every use of `old_guest_user_id`. It also restores Go
routing that was temporarily forced to Laravel for testing.

## User Story

> As a shopper (guest or verified), I want my session to renew seamlessly via
> refresh tokens when my access token expires, so that I keep the same account
> and cart without being silently downgraded to a new guest account.

## Functional Requirements

- **FR-1 — Routing restored.** The temporary "all market/dashboard traffic to
  Laravel" test redirect is reverted, restoring the user-based routing that
  preceded it (verified users → Laravel; guests → Go for allow-listed
  endpoints; dashboard allow-list routing).
- **FR-2 — Refresh token stored.** The `refresh_token` returned by
  `register-guest`, `refresh-token`, and `verify_otp_from_guest` (per
  `go-refresh-api-contract.md`) is persisted securely on the device alongside
  the access token; every issuance replaces **both** stored tokens together.
- **FR-3 — Refresh-first on 401 (Go-routed traffic only).** When a
  **Go-routed** market request (traffic served by the Go backend per the
  routing rules/allow-list) fails with 401 and a stored refresh token exists,
  the app first exchanges it via `POST /api/v1/auth/refresh-token`; on
  success both tokens are replaced and the original request is retried with
  the new access token. The shopper keeps the same account, cart, and
  verification status — no guest re-registration, no session downgrade, and
  no chat/stories re-auth flagging occurs on this path. This preserves the
  session continuity that `old_guest_user_id` provided, via the secure
  mechanism.
- **FR-4 — Fallback preserved.** If no refresh token is stored, or the refresh
  exchange returns 401 (uniform per contract), the app falls back to
  `register-guest` and starts a fresh guest session — today's behavior.
- **FR-5 — Contract-conformant register-guest.** `register-guest` is called
  with **no request body**. `old_guest_user_id` is no longer sent anywhere,
  and the "The user does not exist." retry behavior tied to it is removed.
- **FR-6 — Contract-conformant OTP verify.** `verify_otp_from_guest` is called
  as `POST` with JSON body `{verificationId, otp}` and Bearer auth per the
  contract. On the normal success branch the returned **new token pair**
  replaces both stored tokens; promote vs merge outcomes surface to the
  shopper exactly as today.
- **FR-7 — Legacy OTP branch tolerated.** The alternate success response (OTP
  server disabled — a verification record with **no token pair**) is handled
  without error and without discarding the shopper's currently stored tokens.
- **FR-8 — Laravel-routed traffic keeps its current scenario.** The refresh
  exchange applies **only** to Go-routed 401s (FR-3). A 401 on
  Laravel-routed market traffic — verified users, and guest requests outside
  the Go allow-list — follows **today's recovery flow unchanged** (session
  expiry handling ending in the re-register / verify-phone experience),
  except that its `register-guest` fallback conforms to FR-5 (no body). No
  refresh call is ever made to Laravel; Laravel's own refresh scenario will
  be specified when its flow exists (endpoint/shape may differ — NFR-4).
- **FR-9 — Other services untouched.** chat, stories, comments, and wallet
  keep their current 401 behavior (re-auth / verify-phone flow); this ticket
  changes nothing in their request or recovery paths.
- **FR-10 — Logout semantics preserved.** During a logout (guard armed) no
  refresh exchange or guest registration runs and no token is written. Logout
  purges the stored refresh token along with the other credentials.

## Non-Functional Requirements

- **NFR-1 — Rotation safety under concurrency.** Refresh tokens are
  single-use: concurrent 401s (parallel requests, parallel server renders,
  multiple tabs) must not consume the stored refresh token more than once, and
  a lost race must not destroy a session that a concurrent winner just
  renewed.
- **NFR-2 — Persistence guarantee.** A refresh exchange is only performed in
  an execution context that can durably persist the returned pair — the
  single-use token must never be consumed somewhere its replacement would be
  lost.
- **NFR-3 — Token confidentiality.** The refresh token lives only in
  HttpOnly server-managed storage: never readable by client-side script,
  never placed in localStorage, never included in a response body sent to the
  browser, never written to logs.
- **NFR-4 — Extensibility (multi-backend / multi-service).** The refresh
  mechanism is a single shared capability, structured so each backend declares
  its own endpoint and payload shape (Go is the first and only entry). Adding
  Laravel later — possibly with a different endpoint/shape — or adopting
  refresh for chat/stories/comments/wallet must be a configuration/wiring
  step, not a redesign.
- **NFR-5 — Durable storage lifetime.** The stored refresh token remains
  available for its full 30-day validity and its stored lifetime renews on
  every rotation — storage must never expire before the token it holds.
- **NFR-6 — Seamlessness.** On the happy path (valid refresh), session
  renewal is invisible: no user-visible interruption, prompt, or data loss.

## Constraints

- `go-refresh-api-contract.md` (repo root, gitignored) is the authoritative
  API contract; `Guest-Authentication-&-Token-Renewal.md` describes intended
  behavior. Where they differ, the contract file wins.
- Laravel's auth surface stays exactly as-is; its future refresh flow (likely
  a different endpoint/shape) is anticipated in design but not built.
- Staging environment — no rollback plan required (per intake).
- Much of the affected surface is under `protected_paths`; the plan must
  enumerate every such file explicitly before implementation.
- No automated test suite (project policy) — validation is lint/build plus a
  manual walkthrough of the contract scenarios.
- Any new user-visible copy must follow the mandatory i18n workflow (keys in
  all three translation files). None is expected.

## Edge Cases

- **Existing sessions at rollout** hold an access token but **no stored
  refresh token**, and the old `old_guest_user_id` continuity path no longer
  exists → their first post-expiry 401 cleanly falls back to `register-guest`
  (FR-4) and they become a **new guest**. This one-time continuity loss for
  in-flight guest sessions is an accepted migration cost (verified users
  recover their account by re-verifying their phone); it must degrade
  gracefully, never error.
- **Racing refreshes** (two tabs / parallel server fetches): loser receives
  the uniform 401 — it must not immediately wipe the winner's fresh session
  (NFR-1).
- **Refresh succeeds but original request 401s again** (e.g. revoked user):
  must not loop — bounded retry then fallback.
- **Rotation is not instant revocation**: an old access token keeps working
  until TTL — no logic may assume the old token dies at rotation.
- **Legacy OTP branch** returns no tokens (FR-7).
- **Logout racing a 401** (guard armed) — no resurrection of the
  just-cleared session (FR-10).
- **Locale headers on refresh** update the stored locale server-side (per
  contract) — the exchange must send the shopper's current locale so it is
  not silently reset to defaults.

## Open Questions

- Does the deployed Go base URL already include the `/api/v1` prefix the
  contract specifies? (Determines endpoint constants at plan time.)
- Are the three endpoints live on staging?
- The current OTP verify call forwards an optional `name` value; the contract
  body has only `{verificationId, otp}` — is `name` intentionally dropped?
- Race-loss policy (NFR-1): after a lost refresh race, is an immediate
  register-guest fallback acceptable, or should the app re-check stored
  credentials first? (Decide at `/plan`.)

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | With the change deployed, guest market traffic reaches the Go backend (allow-listed endpoints) and verified users' market traffic reaches Laravel; the temporary force-to-Laravel redirect (incl. dashboard) is gone. | FR-1 |
| AC-2  | After a fresh `register-guest`, both the access token and the refresh token are persisted in HttpOnly server-managed storage; the refresh token is not readable by client script, not in localStorage, and not present in any response body delivered to the browser. | FR-2, NFR-3 |
| AC-3  | With an expired/invalid access token and a valid stored refresh token, the next authenticated **Go-routed** market request completes successfully **without** creating a new guest: the shopper's user id, cart, and verification status are unchanged afterward. | FR-3, NFR-6 |
| AC-4  | A successful refresh replaces **both** stored tokens; the previous refresh token is no longer accepted (re-presenting it yields 401 per contract). | FR-2, FR-3 |
| AC-5  | When the refresh exchange returns 401 (or no refresh token is stored), the app falls back to `register-guest` with an empty request body and establishes a working new guest session. | FR-4, FR-5 |
| AC-6  | No request issued by the app contains `old_guest_user_id`, and no "The user does not exist." retry behavior remains. | FR-5 |
| AC-7  | Phone-OTP verification calls `verify_otp_from_guest` as POST with JSON body `{verificationId, otp}` and Bearer auth; on the token-bearing success branch both stored tokens are replaced with the returned pair, and promote/merge outcomes behave as today. | FR-6 |
| AC-8  | The legacy OTP success branch (no token pair in the response) is handled without error and the shopper's existing stored tokens are left intact. | FR-7 |
| AC-9  | No refresh-related request is ever sent to the Laravel backend, and no refresh exchange is triggered by a Laravel-routed 401: Laravel-routed market traffic (verified users, guests off the Go allow-list) follows today's recovery flow unchanged, with its `register-guest` fallback bodyless per FR-5. | FR-8 |
| AC-10 | A successful refresh leaves chat/stories credentials and re-auth flags untouched (no re-auth flagging, no verification-status downgrade); the session-clearing recovery only runs on the register-guest fallback path. | FR-3, FR-9 |
| AC-11 | chat, stories, comments, and wallet 401 handling is byte-for-byte unchanged by this ticket (their flows still lead to the re-auth / verify-phone experience). | FR-9 |
| AC-12 | Under concurrent 401s (e.g. parallel requests on one page load), at most one refresh exchange is performed for a given stored refresh token, and afterward the shopper has exactly one working session — never a destroyed one. | NFR-1 |
| AC-13 | Every executed refresh exchange durably persists the returned pair — after any refresh, the stored refresh token is the newest one issued (no context consumes a token it cannot persist). | NFR-2 |
| AC-14 | The stored refresh token survives at least as long as its 30-day validity and its storage lifetime is renewed on every rotation. | NFR-5 |
| AC-15 | While a logout is in progress, no refresh or guest registration occurs and no credential is written; after logout, the refresh token is purged along with the other credentials. | FR-10 |
| AC-16 | The refresh mechanism supports per-backend endpoint/shape definitions with Go as the sole registered backend; enabling a future backend requires only adding its definition, demonstrated by the design (no Laravel entry exists yet). | NFR-4 |
| AC-17 | The refresh exchange sends the shopper's current locale (Lang/Country) so the stored locale is not reset to contract defaults. | FR-3, Edge case |

## Out of Scope

- Laravel refresh-token integration (endpoint/shape may differ — future
  ticket).
- Adopting refresh tokens for chat, stories, comments, or wallet (future
  rollout; their 401 flows stay as-is).
- Mobile app changes (same contract, separate codebase).
- Backend-side work: token cleanup job, instant revocation, theft detection.
- Any change to OTP sending, login UX, or multi-device UI messaging.
- Rotating the leaked GitLab token noted in CLAUDE.md (pre-existing, separate
  concern).
