---
ticket: go-refresh-token
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-23
links:
  clickup:
  github:
---

# Intake — go-refresh-token

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

go-refresh-token (no ClickUp task / GitHub issue linked). Behavioral contract
document: `Guest-Authentication-&-Token-Renewal.md` (repo root, currently
untracked).

## Ticket Summary

Integrate the frontend with the Go backend's new guest-authentication and
token-renewal flow: store the `refresh_token` returned by `register-guest` /
`verify_otp_from_guest`, exchange it via `POST /api/v1/auth/refresh-token` on
401 (single-use rotation — replace **both** stored tokens), fall back to
`register-guest` when the refresh itself is rejected, and stop sending the
removed `old_guest_user_id` field. The first step is reverting commit
`c4796b9b`, which temporarily redirected backend traffic to Laravel (Go routing
was disabled to keep the live site working while Go lacked this flow).

## Ticket Metadata

- id / slug: go-refresh-token
- title: Integrate Go refresh-token auth flow (guest authentication & token renewal)
- owner: developer
- created: 2026-07-23
- links: none

## User Story

> As a shopper (guest or verified), I want my session to renew seamlessly via
> refresh tokens when my access token expires, so that I keep the same account
> and cart without being silently downgraded to a new guest account.

## Constraints & context (from request)

- **Go first, Laravel later:** the Go backend implements
  `register-guest` / `refresh-token` / `verify_otp_from_guest`; the Laravel
  refresh-token endpoint is **not ready yet** and stays exactly as it is
  today. When Laravel later gains a refresh flow it may expose a **different
  endpoint and/or payload shape** — the design must anticipate per-backend
  differences (and all services adopting refresh later) so the eventual
  rollout integrates correctly.
- **API contract pending:** the user will provide a dedicated API-contract
  file for the new endpoints later; it supersedes assumptions made from
  `Guest-Authentication-&-Token-Renewal.md` where they differ.
- **Shared DB:** market (Go and Laravel) share the same database; the refresh
  token is Passport-compatible, so both backends understand the same tokens.
- **Other services unchanged for now:** chat, stories, comments, wallet stay
  as they are today — any 401 continues to mean "phone verification needed".
- **Precondition revert:** commit `c4796b9b` ("chore(api): temporarily redirect
  backend traffic to Laravel for testing") must be reverted first so traffic
  routes back to Go.
- **No rollback plan required:** current environment is staging.

## Acceptance Criteria Presence Check

- Present? (no — behavior described in `Guest-Authentication-&-Token-Renewal.md`
  scenarios 1–9 and the "What the mobile app team must change" list, but not yet
  expressed as formal AC-n criteria)
- Notes: `/spec` will derive stable AC-n IDs from the scenario document.

## Test Cases Presence Check

- Present? (no)
- Notes: project has no automated test suite by policy; validation commands to
  be identified in `/research`.

## Missing Information

- Which frontend code paths currently read/route auth (e.g. the
  `MARKET-TOKEN` cookie flow, guest auto-registration on 401) and where the
  refresh-token exchange should live — to be established by `/research`.
- Whether the Go `/api/v1/auth/*` endpoints are live on staging and reachable
  through the current backend URL config.

## Readiness Status

`READY`

- Justification: request has a clear title, goal, behavioral contract
  (`Guest-Authentication-&-Token-Renewal.md`), explicit constraints (Go-only
  now, Laravel later, other services untouched), and a defined first step
  (revert `c4796b9b`). Remaining unknowns are exactly what `/research`
  investigates.
