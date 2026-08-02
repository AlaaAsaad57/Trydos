---
ticket: user-based-go-laravel-routing
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: reviewer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Review — user-based-go-laravel-routing

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-7, NFR-1..NFR-4, AC-1..AC-11) and `plan.md` (approach,
9 base-URL swaps across 7 files, validation profile `full-build`), with the
advisory panel reading `tokenManager.ts`, `app/api/proxy/route.ts`,
`serverRequests/*`, and `app/api/auth/expire/route.ts` as context. During the
gate (before any decision was recorded) the owner corrected AC-6/FR-4/one edge
case in `spec.md`: token expiry keeps the phone in `User-Data`, so routing
stays Laravel after expiry — Go-first applies only while the profile lacks a
valid phone.

## Plan Summary

Centralize the verified check in `tokenManager.ts` (`hasValidPhone` +
fail-open async `isVerifiedMarketUser`); make `getServerBaseUrl` async with a
verified-first `market` branch (`market-dashboard` untouched); swap the nine
hardcoded `GO_BACKEND_URL` server fetches to `getMarketFetchBase()` (verified →
`BACKEND_URL`, else `GO_BACKEND_URL`, deliberately allow-list-free to preserve
guest behavior for the non-listed `likesDetails`). Seven files total, five of
them protected (`serverRequests/**`).

## Risks

- Verified traffic shifts Go → Laravel on high-volume endpoints (cart, product
  details, currency, startingSettings) — watch Laravel latency/errors at rollout.
- Shared Redis cache keys have no backend dimension — verified users may get
  Go-origin cached payloads; accepted because response shapes are identical (NFR-1).
- `cookies()` entering server fetch paths could affect static/ISR render mode —
  fail-open must be verified via build output.
- Laravel parity for `likesDetails` (not allow-listed) rests on pre-migration
  history — exercised explicitly at `/verify`.

## Assumptions

- Go and Laravel response shapes are identical for all rerouted endpoints
  (owner-confirmed at intake).
- Guest re-register for an expired verified user returns the SAME user with
  the phone preserved (owner-confirmed at this gate) — expiry does not flip
  routing.
- Routing is load-steering only; authorization remains the backends' JWT
  checks (never routing).

## Open Questions

- none

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | major | Phone-only predicate routes an expired session with a surviving phone to Laravel — flagged as violating AC-6's expiry branch | AC-5/AC-6, expire route | **Dismissed as defect — it is the intended behavior.** Owner confirmed expiry keeps the phone (user does not become a guest); spec AC-6/FR-4 corrected at the gate to match. |
| senior | major | `likesDetails` is not allow-listed; Laravel parity not formally asserted for it | plan Step 3, NFR-1, products.ts | **Accepted — reroute as planned.** Laravel served it pre-migration (commented Laravel URL still in file); `/verify` exercises it explicitly. |
| perf | major | Verified load shifts Go→Laravel on hot endpoints with no capacity note | plan Approach/Steps, FR-1/AC-1 | Accepted risk — recorded above; rollout watch item, no plan change (owner: don't over-engineer). |
| perf | major | Shared Redis cache keys lack a backend dimension — verified users may receive Go-origin cached payloads | plan Step 3, FR-1/NFR-1 | Accepted — shapes are identical (NFR-1); shared-cache reuse across backends is explicitly acceptable. No key split. |
| perf | minor | `isVerifiedMarketUser` re-parses the User-Data cookie 4–6× per product render | plan Approach/Step 3 | Dismissed — negligible local work; per-request memo may be added only if trivial during implement (no requirement). |
| perf | minor | `cookies()` may opt static/ISR pages into dynamic rendering | FR-7/AC-8 | Mitigate — verify build-output route summary unchanged at `/verify`. |
| security | minor | Routing signal is client-influencable profile data, not a token claim | AC-5 | Accepted — routing is load-steering, never authz; Laravel JWT authz is the control (recorded as assumption). |
| security | minor | Missed `await` on now-async `getServerBaseUrl` type-checks but yields `[object Promise]` URL | plan Steps 1–2 | Mitigate — implement runs a repo-wide grep confirming `/api/proxy` remains the sole caller. |
| security | minor | Unhandled throw in the resolver would 503 all market traffic through the proxy chokepoint | AC-8 | Mitigate — try/catch wraps the ENTIRE resolver including `cookies()`; base resolved once per request. |
| security | minor | Rerouted server fetch paths must stay `revalidate: 0` while user-dependent | plan Step 3, FR-7 | Accepted — record the constraint in `implement.md`. |
| senior | minor | Plan says "eight" swaps; enumeration is nine | plan Step 3 | Accepted as typo — the Files-to-change enumeration (9 swaps / 7 files) is authoritative for IM-4. |
| senior | minor | `[Proxy]` log does not record the resolved base; NFR-4 overstated | plan Validation, NFR-4 | Accepted — AC evidence restated as code inspection + fetch URL fields; no logging change (don't over-engineer). |
| senior | info | Single-call-site claim verified; dashboard split sound | plan Steps 1–2 | Noted. |
| senior | info | Rerouted server fetchers send no Authorization header (host change only) | plan Step 3 | Noted — record one sentence in `implement.md`. |
| security | info | Protected-path listing compliant (5 files); tokenManager/proxy correctly unprotected | plan Files to change | Noted. |
| security | info | Fail-open-to-guest means a malformed cookie can send a verified token to Go — deliberate policy exception | NFR-3/AC-8 | Accepted — document as intended in `verify.md`. |
| security | info | Possible malformed leftover line near `products.ts:169` (likesDetails block) | plan Step 3 | Check at implement: confirm it is the inert commented-out Laravel URL; fix only if actually malformed, listing it as a deviation. |
| perf | info | Async conversion adds negligible await to proxy path | plan Step 2 | Noted. |

## Decision

`APPROVED`

- Rationale: Owner-approved with the directive "don't over-engineer" — the plan
  is the smallest change that meets the spec: one predicate, one resolver, two
  base helpers, nine mechanical base-URL swaps; no new abstractions, no cache
  key splits, no logging additions. Panel majors were resolved by owner
  disposition (expiry behavior confirmed as intended + spec corrected;
  likesDetails reroute accepted with verify coverage). Comprehension check
  passed 3/3 (CG-4 = 1.0).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (self-review, 2026-07-22)

## ADR reference

- ADR: none

## Required Follow-up Actions

- At `/implement`: grep-confirm `/api/proxy` is still the only
  `getServerBaseUrl` caller; wrap the whole resolver (incl. `cookies()`) in
  try/catch; note in `implement.md` that rerouted server fetches stay
  `revalidate: 0` and carry no Authorization header; check the
  `products.ts:169` commented line is inert.
- At `/verify`: exercise `likesDetails` against Laravel; confirm build-output
  render modes unchanged; document the fail-open policy exception.
