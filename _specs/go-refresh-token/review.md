---
ticket: go-refresh-token
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: reviewer
updated: 2026-07-23
links:
  clickup:
  github:
---

# Review — go-refresh-token

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.
>
> **Round 3 — final.** Round 1 (CHANGES_REQUESTED, follow-ups 1–7) → plan
> revision 1. Round 2 (CHANGES_REQUESTED, follow-ups 1–3 + carried ops check)
> → plan revision 2. This round: panel confirms all follow-ups resolved, no
> majors remain → **APPROVED**.

## Review Scope

`plan.md` revision 2 against `spec.md` (AC-1..17); round-1/round-2 follow-up
resolution verified against the current code (`services/auth.ts`,
`utils/fetchData.ts`, `utils/server/tokenManager.ts`). Advisory panel round 3:
senior / security / performance (ADR-012).

## Plan Summary

Revert `c4796b9b`; one shared backend-aware refresh helper (Go-only adapter
registry) behind `/api/auth/refresh` (client + proactive recovery, helper-based
Go-eligibility) and `HandleAuthedFetch` (server recovery, cookie-writability
probe). Races resolve toward the browser jar: server refresh-401 → plain 401;
client jar-retry; expire route last-chance refresh with a `{renewed: true}`
client branch. Auth-attempt counter (cap 2) bounds recovery.
`isVerifiedMarketUser()` gates every exchange path. All fallbacks
contract-conformant (bodyless register-guest, POST OTP verify, refresh_token
persisted everywhere a pair is issued).

## Risks

- Recovery-chain correctness now rests on three implement-time precision
  points (renewed-branch signal scoping, single re-sync mechanism, counter
  mechanics) — all recorded as accepted dispositions below and validated at
  `/verify` via the walkthrough cases.
- Staging readiness of the Go endpoints is an implement-time precondition
  (`/implement` blocks if absent).

## Assumptions

- `GO_BACKEND_URL` env value carries the `/api/v1` prefix (verified at
  implement); 24h access TTL; Go endpoints live on staging.

## Open Questions

- Backend confirmation that dropping `name` on OTP verify is intended
  (carried; not blocking).

## Panel Findings (advisory)

> Round-3 findings on plan revision 2. **Advisory only** (RP-2). All round-1
> and round-2 follow-ups verified **resolved** by the panel.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | Renewed-branch RSC re-sync trigger unwired: `_doExpire` (plain service) can't call `router.refresh()`; `Init.tsx`'s call is mount-time only. | step 7 vs step 10; AC-10/AC-12 | **Accept — implement guidance:** scope the renewed branch to store re-sync + attempt-2 retries (waiting callers re-fetch); no `router.refresh()` from that branch. |
| performance | minor | Renewed branch stacks redundant work (retries + `CheckLogin()` incl. a no-op `RefreshSession()` POST + RSC refetch). | steps 7/10 | **Accept — implement guidance:** single re-sync mechanism (the retries); skip the proactive call from the renewed branch. |
| security | info | `reAuthResult: "success"` is shared with the phone re-verify wait channel — a background renewal could release an OTP wait (client-state collision only; server checks hold). | step 7; `waitForReAuthSuccess` | **Accept — implement guidance:** set the renewed "success" signal only when `shouldAuthinticated` isn't armed (scope to expire-waiters). |
| performance | info | Worst-case failing chain ~5 sequential calls during a Go auth outage — bounded, failure-path only; watch expire/register-guest rates in the firewall ops check. | Approach rule 3 | Noted — folded into the ops check. |
| security | info | Round-2 eligibility finding resolved: both exempt paths now gated on `isVerifiedMarketUser()`; `{renewed: true}` carries no token material; counter strictly tightens the prior guard. | steps 5/7; AC-2 | Noted. |
| senior | info | Round-2 follow-ups 1–3 verified resolved against current code with implementable mechanics. | Approach rules 3–4, steps 5/7/9 | Noted. |

## Decision

`APPROVED`

- Rationale: Three review rounds converged: the race/RSC-recovery design is
  now fully specified (jar-oriented race resolution, last-chance expire
  renewal with client branch, bounded attempt counter, eligibility on every
  exchange path), every AC maps to a concrete step, protected paths are
  enumerated, and the panel's round-3 findings are minor implement-time
  precision points recorded as dispositions above — no majors remain.
  Comprehension check passed 3/3 (CG-4).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approval, 2026-07-23 (comprehension 3/3).

## ADR reference

- ADR: none

## Required Follow-up Actions

- none blocking. Carried into `/implement` as accepted dispositions (renewed-
  branch signal scoping + single re-sync mechanism; never log/proxy the raw
  client `{url}`; note the Laravel `{eligible: false}` round trip in
  implement.md) and into ops: confirm Vercel Firewall coverage of
  `/api/auth/refresh` (and expire/register-guest rates) before rollout.
