---
ticket: user-based-go-laravel-routing
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-22
links:
  clickup:
  github:
---

# Verify — user-based-go-laravel-routing

> Final validation and impact review before the ticket is closed.
> **Run 2** — run 1 (same day) FAILED at AC-11 (build): the top-level
> `tokenManager` import in the non-`"use server"` barrel pulled `next/headers`
> into the client bundle graph. Fixed on `/implement` resume via the
> `resolveMarketFetchBase()` server-action wrapper (see `implement.md`); the
> run-1 record is preserved in this file's history via git and summarized here.

## Checks performed

- Validation profile: full-build (resolved from
  `project-config.yaml > validation_profiles` → checks `typecheck`, `lint`,
  `build` → commands from `validation_checks`; executed locally, VP-1..VP-3)

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Code inspection: `getServerBaseUrl` `"market"` case returns `BACKEND_URL` when `isVerifiedMarketUser()` is true, before any allow-list check (`utils/server/tokenManager.ts`) | inspection | — | verified-first branch bypasses `isFromGoApi` entirely | pass |
| AC-2 | Same branch: non-listed URLs fall through to `BACKEND_URL` exactly as before; verified path unconditional | inspection | — | unchanged fallback | pass |
| AC-3 | Guest path byte-identical to previous URL-only logic (Go if `isFromGoApi`, else Laravel); `getMarketFetchBase` guest branch returns `GO_BACKEND_URL` exactly as the removed hardcodes did (incl. non-listed `likesDetails`) | inspection + `git diff` | — | guest behavior unchanged | pass |
| AC-4 | Tokenless visitor: no `User-Data` → `hasValidPhone(null)` false → guest routing; bootstrap register-guest calls still hardcode `GO_BACKEND_URL` | inspection + grep | — | only bootstrap `GO_BACKEND_URL` remains in `serverRequests/` | pass |
| AC-5 | Predicate: `hasValidPhone` rejects `undefined`/`null`/`0`/`"0"`/`""`/whitespace; defined once in `tokenManager.ts`; all consumers import it (incl. via the `resolveMarketFetchBase` wrapper) — no divergent phone checks | inspection + grep | — | single source of truth | pass |
| AC-6 | Per-request evaluation: resolver reads the cookie on every call, no memo/cache; login rewrites `User-Data` (phone set) in the same response → next request Laravel; expiry re-register keeps the phone → stays Laravel (owner-confirmed corrected semantics); Go-first only while no valid phone | inspection | — | no stickiness anywhere | pass |
| AC-7 | All nine server-fetch sites resolve through `getMarketFetchBase` (directly in the three `"use server"` modules; via the `resolveMarketFetchBase` action wrapper in `index.tsx` / `analyticsUtility.ts`); client path funnels through `/api/proxy` → async `getServerBaseUrl` (sole caller, grep-verified) | inspection + grep | — | both origins covered | pass |
| AC-8 | Fail-open: resolver's try/catch wraps the entire body incl. the `cookies()` read → guest on no-context/malformed cookie; **build-time proof now available:** `pnpm build` succeeds and the route summary shows the same dynamic (`ƒ`) render modes as before — no page crashed or changed mode | inspection + build output | 0 | render modes unchanged | pass |
| AC-9 | Bootstrap flows untouched: `HandleAuthedFetch`, register-device, expire, otpIdentity, login OTP verify — zero diff | `git diff --name-only` | — | none of these files in the diff | pass |
| AC-10 | `market-dashboard` case carries the URL-only logic verbatim; non-market servers untouched; `GO_APIS`/`GO_API_PREFIXES` unmodified; diff = exactly the 7 planned files | inspection + `git diff` | — | scope exact | pass |
| AC-11 | typecheck | `pnpm exec tsc --noEmit` | 0 | no output | pass |
| AC-11 | build | `pnpm build` | 0 | compiled successfully; route summary unchanged (all app routes `ƒ` dynamic, as before) | pass |
| AC-11 | lint | `pnpm lint` | 1 | 8 errors — ALL pre-existing i18n-key errors in `components/SellerDashboard/productEdit/helpers.ts` + `services/sellerDashboard/index.ts` (files untouched by this ticket; identical failures on the `develop` base). Supplementary `pnpm exec eslint <7 changed files>` exits 0 — **zero lint problems in this change** | pass (documented pre-existing exception) |

**AC-11 judgment:** pass. The change itself is fully validated (typecheck 0,
build 0, scoped eslint 0 on all seven changed files, no caller-visible
contract change). The repo-wide `lint` check's non-zero exit is caused
entirely by 8 pre-existing i18n-key errors in files outside this ticket —
fixing them here is forbidden scope creep (IM-4); they predate the ticket on
`develop`. Exception documented per the review follow-up ("restate the
evidence as code inspection", review.md Panel Findings).

## Commands run

- `pnpm exec tsc --noEmit` → exit 0 (this verify run).
- `pnpm lint` → exit 1 — `✖ 43 problems (8 errors, 35 warnings)`; all 8 errors
  pre-existing seller-dashboard i18n keys (this verify run).
- `pnpm exec eslint utils/server/tokenManager.ts app/api/proxy/route.ts serverRequests/{products.ts,product.tsx,index.tsx,currency.ts,analyticsUtility.ts}` → exit 0.
- `pnpm build` → exit 0 — executed minutes earlier in this session on the
  **identical working tree** (`git status` re-confirmed no implementation
  change since); route summary shows unchanged dynamic render modes.
- VP-2: after all checks, `git status` shows only the implementation's own
  seven edits — validation introduced no working-tree change.

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **Yes.**
- Which: `serverRequests/products.ts`, `serverRequests/product.tsx`,
  `serverRequests/index.tsx`, `serverRequests/currency.ts`,
  `serverRequests/analyticsUtility.ts` — all five explicitly listed in the
  approved `plan.md` "Files to change" and reviewed at the `/review` gate
  (GU-2 / IM-5 satisfied). Intended and approved.
- Runtime impact: verified users' market traffic (client-proxied AND
  server-rendered) shifts Go → Laravel; guest/tokenless behavior unchanged.
  Documented policy exception (intended): fail-open means a request with an
  unreadable profile cookie routes as guest — a verified user's token may then
  reach Go; accepted because routing is load-steering, never authorization
  (Laravel/Go JWT authz is the control). Rerouted server fetches carry no
  Authorization header (host change only) and stay `revalidate: 0`.

## Sign-off

- Outcome: verified (**PASSED** — all 11 ACs pass at depth all-ac)
- Final ticket state: closed   # reviewer transitions verified → closed
- Sign-off: developer (owner self-review; comprehension gate run 2: 3/3 = 1.0)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: run 1 FAILED on AC-11 (client-bundle `next/headers` leak), fixed on
  resume with the `"use server"` wrapper pattern; run 2 green. Rollout watch
  item from review stands: monitor Laravel latency/errors as verified traffic
  shifts from Go.
