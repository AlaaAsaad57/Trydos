---
ticket: user-based-go-laravel-routing
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Intake — user-based-go-laravel-routing

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`user-based-go-laravel-routing` — no ClickUp task / GitHub issue linked.

## Ticket Summary

Make backend selection for the "market" server depend on the caller's
verification state, not only the URL. A verified user (User-Data profile has a
valid phone) must be served entirely by Laravel (`BACKEND_URL`) — never by the
Go backend, even for endpoints listed in the Go allow-list. Guest sessions and
tokenless visitors stay Go-first: Go (`GO_BACKEND_URL`) when the endpoint is in
`GO_APIS`/`GO_API_PREFIXES`, Laravel otherwise (existing fallback).

### Context (from intake discussion)

- The Go/Laravel switch lives in `utils/server/tokenManager.ts` —
  `isFromGoApi()` + `getServerBaseUrl()` — and is currently URL-only.
- Go serves ONLY the endpoints explicitly listed in `GO_APIS`/`GO_API_PREFIXES`;
  it is not a full mirror of Laravel. The allow-list stays the single source of
  truth for what Go can serve.
- `MARKET-TOKEN` is the SINGLE auth cookie for guest AND logged-in sessions
  (`DEVICE-TOKEN` removed in commit 8b8c23ab; never read or set). Token presence
  CANNOT distinguish guest from verified — the `User-Data` profile cookie is the
  only signal.
- Go and Laravel return IDENTICAL response shapes for the allow-listed endpoints
  (confirmed at intake) — no response adaptation layer is needed; only the base
  URL changes.

### Requirements

- **R1:** Verified user → every market request goes to Laravel; the Go
  allow-list is bypassed entirely for them.
- **R2:** Guest sessions (`MARKET-TOKEN` present, no valid phone in `User-Data`)
  and tokenless visitors → Go for allow-listed endpoints, Laravel for everything
  else (behavior unchanged from today).
- **R3:** "Verified" = `User-Data.phone` is a VALID phone. Explicitly NOT
  verified: phone missing, `null`, `undefined`, `""`, `0`, or `"0"`. A logged-in
  user without a valid phone follows the guest (Go-first) routing. Implement as
  one shared predicate (e.g. `hasValidPhone(userData)`) — a single source of
  truth, no ad-hoc phone checks at call sites.
- **R4:** Routing is evaluated PER-REQUEST from the current `User-Data` cookie —
  no caching or session stickiness. The very next request after login writes
  `User-Data` (phone set) routes to Laravel; the very next request after a guest
  re-register / expiry (no valid phone) routes Go-first again.
- **R5:** The rule applies at EVERY place the Go/Laravel decision is made:
  `getServerBaseUrl` / `isFromGoApi` consumers (the `/api/proxy` route) AND the
  server files that hardcode `GO_BACKEND_URL` for allow-listed endpoints —
  `serverRequests/products.ts` (globalDetails / qtyPriceDetails / likesDetails)
  must also switch to Laravel for verified users. Client and server-component
  requests behave identically.
- **R6:** Scope is the "market" server only — `market-dashboard` keeps today's
  URL-only routing; chat/stories/elastic/comments/wallet are untouched.
- **R7:** Auth bootstrap endpoints for guest/tokenless flows keep working
  against Go (`/auth/register-guest` in HandleAuthedFetch, register-device,
  expire, otpIdentity — all call `GO_BACKEND_URL` directly). These are
  guest-only by nature and are NOT rerouted.

### Out of Scope

Adding/removing endpoints from `GO_APIS`; any backend (Go or Laravel) change;
routing changes for non-market servers; re-introducing `DEVICE-TOKEN` in any
form; response-shape adapters (shapes are identical).

## Ticket Metadata

- id / slug: user-based-go-laravel-routing
- title: Route market API calls by user verification state (verified → Laravel only; guests → Go-first)
- owner: developer
- created: 2026-07-22
- links: none

## User Story

> As a verified Trydos user (my profile has a valid phone), I want all my
> market API requests served by the Laravel backend, so that my account always
> hits the fully-featured backend — while guests and first-time visitors keep
> using the Go gateway for the endpoints it supports.

## Acceptance Criteria Presence Check

- Present? yes (as verification hints — formal AC-n IDs to be authored at /spec)
- Notes:
  - Verified user hitting an allow-listed endpoint (e.g. `/cart/add`,
    `/customer/info`) → request goes to `BACKEND_URL`.
  - Guest hitting the same endpoint → `GO_BACKEND_URL`; guest hitting a
    non-listed endpoint → `BACKEND_URL`.
  - Tokenless first visit → Go for allow-listed bootstrap traffic.
  - Transition: complete OTP login, then next allow-listed call → Laravel;
    expire the session (guest re-register), next call → Go.
  - `User-Data` with phone = `"0"` / `0` / `""` / missing → treated as guest.

## Test Cases Presence Check

- Present? no (project policy: no automated test suite; /spec must map each AC
  to a manual/inspection validation, per the verification hints above)
- Notes: validation will be manual + code inspection (routing decision points,
  predicate behavior for each phone value class).

## Missing Information

- None blocking. Open points intentionally deferred to later stages:
  - /research must enumerate ALL call sites that choose Go vs Laravel
    (beyond the known `tokenManager.ts` + `serverRequests/products.ts`).
  - /research should confirm `User-Data.phone` freshness at every decision
    point (login, expire, guest re-register rewrite paths).

## Readiness Status

`READY`

- Justification: goal, routing matrix, verified-user predicate (exact invalid
  values), per-request evaluation rule, scope boundaries, and out-of-scope list
  were all confirmed by the ticket owner during intake discussion on
  2026-07-22. No blocking unknowns remain; remaining questions are research
  tasks, not intake gaps.
