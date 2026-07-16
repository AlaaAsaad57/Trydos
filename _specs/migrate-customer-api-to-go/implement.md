---
ticket: migrate-customer-api-to-go
stage: implement
mode: standard
status: complete
owner: ai_agent
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Implement — migrate-customer-api-to-go

> Record of what was actually built, following `plan.md`.

## Changes made

- `utils/server/tokenManager.ts` — added the four customer operation paths to the
  `GO_APIS` routing allow-list, grouped under a labelled block: `/customer/info`,
  `/customer/update-profile`, `/customer/update-name`, `/customer/approve-policies`.
  This flips `isFromGoApi()` → `true` for those paths, so
  `getServerBaseUrl("market", …)` returns `NEXT_PUBLIC_GO_BACKEND_URL` (Go Store
  Gateway) instead of the Laravel `NEXT_PUBLIC_BACKEND_URL`. The four existing
  callers (`services/home.ts`, `services/auth.ts`,
  `components/Cart/PlaceOrderButtons.tsx`) already issue `server: "market"`
  requests, so no caller code changed.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `utils/server/tokenManager.ts` — `GO_APIS` allow-list: +4 endpoint entries
  (+ a 3-line rollback comment). Left as an uncommitted working-tree edit on
  branch `ticket/migrate-customer-api-to-go`.

(The `_specs/migrate-customer-api-to-go/` workflow artifacts are also present as
untracked files; they are staged/committed together at `/publish-pr`.)

## Deviations from plan

- None. The sole functional change is exactly the `plan.md` "Files to change"
  entry (`utils/server/tokenManager.ts`, `GO_APIS` addition). No file outside the
  plan was modified. The pre-existing debug artifacts (`console.log` at
  `tokenManager.ts:94`, the `IS-FROM-GO`/`fullUrl` proxy headers) were left
  untouched, as declared out of scope.

## Validation run during implementation

- `pnpm exec tsc --noEmit` (profile `standard-frontend` → check `typecheck`) —
  **PASS** (exit 0).
- `pnpm lint` (profile `standard-frontend` → check `lint`) — **PASS** (exit 0;
  23 pre-existing repo warnings, 0 errors, none in `utils/server/tokenManager.ts`).
- Note: the manual runtime `IS-FROM-GO: true` spot-check (plan Step 4) requires a
  running environment with the Go endpoints reachable; it is a `/verify`-time
  activity and is not run here.
