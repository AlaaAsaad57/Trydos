---
ticket: user-based-go-laravel-routing
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Spec — user-based-go-laravel-routing

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

User-based Go/Laravel backend routing for market APIs.

## Business Goal

Verified customers must be served exclusively by the Laravel market backend —
the fully-featured system of record for accounts with a real phone — while the
Go store gateway keeps handling the high-volume guest/anonymous traffic for the
endpoints it supports. This lets the platform scale guest browsing on Go
without ever exposing verified accounts to the Go gateway.

## User Story

> As a verified Trydos user (my profile has a valid phone), I want all my
> market API requests served by the Laravel backend, so that my account always
> hits the fully-featured backend — while guests and first-time visitors keep
> using the Go gateway for the endpoints it supports.

## Functional Requirements

- **FR-1 (verified → Laravel only):** Every market API request made on behalf
  of a verified user is served by the Laravel backend — including endpoints on
  the Go allow-list. A verified user's request never reaches the Go gateway.
- **FR-2 (guest → Go-first):** Market API requests made on behalf of a guest
  session or a visitor with no auth token are served by the Go gateway when the
  endpoint is on the Go allow-list, and by Laravel otherwise (today's fallback,
  unchanged).
- **FR-3 (verified predicate):** "Verified" means the stored user profile
  carries a valid phone value. A profile whose phone is missing, null,
  undefined, empty string, `0`, or `"0"` is NOT verified. The predicate is
  defined in exactly one place and reused by every routing decision — no
  divergent per-call-site phone checks.
- **FR-4 (per-request evaluation):** The routing decision is computed fresh on
  every request from the current profile state — no caching or session
  stickiness. The first request after a successful phone-verified login routes
  to Laravel. Token expiry / guest re-register does NOT by itself flip routing:
  the re-registered profile keeps the user's phone (an expired verified user
  does not become a guest), so routing stays Laravel; only a profile that
  actually lacks a valid phone routes Go-first. (Owner-confirmed at review.)
- **FR-5 (uniform coverage):** The rule applies at every point where the
  Go-vs-Laravel choice is made — both the proxied path used by client-side
  calls and the server-rendered fetch paths that currently target the Go
  gateway directly for allow-listed endpoints. A verified user gets Laravel
  regardless of whether the request originates client-side or server-side.
- **FR-6 (guest bootstrap unchanged):** Guest/anonymous bootstrap operations
  (guest registration, OTP verification during login, session-expiry guest
  re-registration) continue to be served by the Go gateway. These flows belong
  to callers who are by definition not verified and are not rerouted.
- **FR-7 (no-context fallback):** When a routing decision must be made in a
  context where no per-request profile state is available (e.g. build-time /
  static regeneration of server-rendered pages), the caller is treated as a
  guest (Go-first). The decision must never crash the render.

## Non-Functional Requirements

- **NFR-1 (no contract change):** Callers observe no request/response contract
  change — the Go and Laravel backends return identical response shapes for
  the allow-listed endpoints (confirmed at intake), so switching the serving
  backend is transparent to all consumers.
- **NFR-2 (no added latency class):** The verification check is a local read
  of state already available to the request (no extra network call introduced
  into the routing decision).
- **NFR-3 (fail-safe):** If the profile state cannot be read or parsed, the
  request is routed as a guest (today's behavior) rather than failing.
- **NFR-4 (auditability):** Existing request logging continues to record which
  backend served a proxied request, so routing behavior is observable in
  non-production environments.

## Constraints

- The Go allow-list remains the single source of truth for what Go can serve;
  this ticket does not add or remove entries.
- Scope is the market server only. Dashboard, chat, stories, elastic,
  comments, and wallet routing are untouched.
- The single-auth-cookie model is a given: token presence cannot distinguish
  guest from verified; only the stored profile (phone) can.
- No Go or Laravel backend change is part of this ticket.
- Protected runtime paths affected by this work must be explicitly declared at
  the plan stage and touched only within the approved implementation.

## Edge Cases

- Logged-in user whose profile has no valid phone (placeholder values such as
  `0` / `"0"` / empty) → routed as guest (Go-first).
- Session transition boundaries: the request immediately after login must
  route to Laravel. After expiry/guest re-register the profile keeps its phone,
  so routing remains Laravel; Go-first applies only while the current profile
  lacks a valid phone (per-request evaluation, FR-4).
- Tokenless first visit (no cookies at all) → guest routing; bootstrap
  traffic reaches Go (FR-2, FR-6).
- Server-rendered fetches running with no request cookie context (static
  generation / revalidation) → guest routing, render must not fail (FR-7).
- Profile cookie present but malformed/unparseable → guest routing (NFR-3).
- Allow-listed endpoints with dynamic URL segments (prefix-matched) follow the
  same user-based rule as suffix-matched entries.

## Open Questions

- None blocking. Decisions folded in from research: internal error-log
  shipping to the Go gateway is infrastructure telemetry, not a market API —
  explicitly out of scope; Laravel parity for a sample of allow-listed
  endpoints is asserted by the owner and exercised at verification.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A verified user's request to an allow-listed market endpoint (e.g. cart add, customer info) is served by the Laravel base URL, not Go. | FR-1 |
| AC-2 | A verified user's request to a non-allow-listed market endpoint is served by Laravel (unchanged). | FR-1 |
| AC-3 | A guest session's request to an allow-listed endpoint is served by the Go base URL; the same guest's request to a non-listed endpoint is served by Laravel. | FR-2 |
| AC-4 | A tokenless visitor's allow-listed traffic (including guest bootstrap) is served by Go. | FR-2, FR-6 |
| AC-5 | A profile with phone missing, null, undefined, `""`, `0`, or `"0"` is treated as NOT verified and routed Go-first; a profile with a real phone value is treated as verified. The predicate exists in exactly one place. | FR-3 |
| AC-6 | Immediately after a phone-verified login completes, the next allow-listed request routes to Laravel. After token expiry / guest re-register the profile keeps its phone, so routing remains Laravel; routing is Go-first only when the current profile lacks a valid phone. | FR-4 |
| AC-7 | Server-rendered fetch paths that target allow-listed endpoints apply the same rule: Laravel for a verified user's request, Go for a guest's. | FR-5 |
| AC-8 | In a context with no per-request profile state (build/static render) or with an unreadable profile, routing falls back to guest (Go-first) without error. | FR-7, NFR-3 |
| AC-9 | Guest bootstrap flows (guest register, OTP verify, expiry re-register) still call the Go gateway and keep working. | FR-6 |
| AC-10 | Dashboard/chat/stories/elastic/comments/wallet routing and the Go allow-list contents are byte-for-byte unchanged in behavior. | Constraints |
| AC-11 | Type/lint/build validation passes with no contract change visible to callers. | NFR-1 |

## Out of Scope

- Adding or removing endpoints from the Go allow-list.
- Any Go or Laravel backend change.
- Routing changes for non-market servers (dashboard, chat, stories, elastic,
  comments, wallet).
- Re-introducing the removed legacy device-token cookie in any form.
- Response-shape adapters between Go and Laravel (shapes are identical).
- Internal error-log telemetry shipping (stays on its current path).
