---
ticket: migrate-customer-api-to-go
stage: plan
mode: standard
status: complete
owner: ai_agent
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Plan — migrate-customer-api-to-go

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Reroute the four customer operations from the legacy Laravel "market" backend to
the Go Store Gateway by adding their paths to the request-routing allow-list
(`GO_APIS` in `utils/server/tokenManager.ts`). The existing `/api/proxy` already
injects the session token server-side and calls `getServerBaseUrl`, which switches
the base URL to `NEXT_PUBLIC_GO_BACKEND_URL` whenever `isFromGoApi(url)` is true.
Because all four callers already issue `server: "market"` requests, no caller code
changes — the same requests transparently follow the new route, exactly as the
already-migrated `/cart/*` and `/checklist` operations do.

This is preferred over editing each caller (which would touch the protected
`services/auth.ts` and force `high_risk` mode) because it is a single,
low-blast-radius, config-style change confined to a non-protected path, and it
gives an instant routing-level rollback. Response parity is a confirmed precondition
(spec Constraints), so no response-mapping code is needed.

## Steps

1. In `utils/server/tokenManager.ts`, add the four customer endpoint paths to the
   `GO_APIS` array, grouped together under a clear comment that marks them as the
   customer-API migration entries (so the block is easy to disable for rollback):
   `/customer/info`, `/customer/update-profile`, `/customer/update-name`,
   `/customer/approve-policies`. (`isFromGoApi` matches these by `endsWith`.)
2. No caller changes: confirm (already verified in research) that all four call
   sites use `server: "market"` and the same HTTP methods the contract expects —
   `GET /customer/info`, `POST /customer/update-profile`, `POST /customer/update-name`,
   `GET /customer/approve-policies`. No edit is made to `services/*` or `components/*`.
3. Run the validation profile (type safety + lint) — see Validation strategy.
4. Manual runtime spot-check (non-CI): with the paths allow-listed, exercise each
   operation and confirm the proxy response carries `IS-FROM-GO: true` and the
   behavior is unchanged — profile view (AC-1), profile edit (AC-2), name change
   (AC-3), checkout policy consent (AC-4), auth/validation/error handling
   (AC-6..AC-9), and that other customer operations still resolve to Laravel (AC-10).

## Files to change

- `utils/server/tokenManager.ts` — **the only functional change.** Add the four
  `/customer/*` paths to the `GO_APIS` allow-list (a string-array addition inside a
  labelled block). This flips `isFromGoApi` → `true` for those paths so
  `getServerBaseUrl("market", …)` returns the Go base URL. Not a protected path.

No other files change. Callers (`services/home.ts`, `services/auth.ts`,
`components/Cart/PlaceOrderButtons.tsx`), the proxy route
(`app/api/proxy/route.ts`), and `next.config.ts` (image hosts — unchanged by
parity) are intentionally untouched.

## Validation strategy

- Validation profile: `standard-frontend`
- The profile covers type safety and lint, which is sufficient because the change
  is a routing-list string addition with no new types, control flow, or runtime
  behavior in the app itself.
- Plus a manual runtime spot-check (not part of the profile) mapping to the
  acceptance criteria: each of the four operations returns `IS-FROM-GO: true` and
  behaves identically to before (AC-1..AC-9, AC-12), and non-migrated customer
  operations still resolve to Laravel (AC-10). Rollback rehearsal is not required
  in `standard` mode (AC-11 is proven by re-commenting the block).
- Traceability: Step 1 (allow-list entries) realizes AC-1..AC-5 and AC-12; parity
  precondition covers AC-6..AC-9; the untouched-callers/other-endpoints boundary
  covers AC-10 and AC-13; the rollback design covers AC-11.

## Rollback

- Instant, caller-free revert: comment out (or delete) the four added
  `/customer/*` entries in the `GO_APIS` block. `isFromGoApi` then returns `false`
  for those paths and `getServerBaseUrl("market", …)` falls back to the Laravel
  base URL (`NEXT_PUBLIC_BACKEND_URL`) — restoring prior behavior with no caller
  change. Keeping the four entries grouped under one comment makes this a
  single-block toggle (this is the "commented fallback in the routing layer" from
  the spec).
- No data migration or state change is involved, so rollback has no side effects.

## Out of scope

- Implementing or modifying any Go handler or its business logic (backend team;
  ClickUp 86ey26atu).
- Any change to `services/auth.ts` or other protected runtime paths (would force
  `high_risk`); response-shape adaptation code (not needed — parity confirmed).
- The other customer-area operations, the OTP pipeline, and image upload/storage.
- Cleaning up the pre-existing debug artifacts in the routing/proxy code
  (`console.log` at `tokenManager.ts:94`; the `IS-FROM-GO`/`fullUrl` debug response
  headers) — noted in research, not touched here.
- `next.config.ts` image-host allowlist — unchanged, since the image URL host is
  unchanged by response parity.
