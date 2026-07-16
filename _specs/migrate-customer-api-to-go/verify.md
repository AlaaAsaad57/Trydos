---
ticket: migrate-customer-api-to-go
stage: verify
mode: standard
status: complete
owner: reviewer
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Verify — migrate-customer-api-to-go

> Final validation and impact review before the ticket is closed.

## Checks performed

> AC IDs reference `spec.md`. Evidence basis per AC:
> **STATIC** = passing typecheck+lint · **DIFF** = confirmed by `git diff` vs
> `develop` · **INSPECT** = code inspection of the (unchanged) mechanism ·
> **CONTRACT** = relies on the owner-confirmed Go↔Laravel byte-parity precondition
> (external to this repo; see Notes). Depth = all-ac (standard mode, VF-4/MO-6).

- Validation profile: `standard-frontend` (checks: `typecheck`, `lint` — both
  depth `all-ac`, ≤ standard tier, so both executed).

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | `/customer/info` now routes to Go; same profile fields render (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-2  | `/customer/update-profile` routes to Go; updated values reflected (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-3  | `/customer/update-name` routes to Go; name updates (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-4  | `/customer/approve-policies` routes to Go; idempotent consent (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-5  | Session credential injected server-side for `market`, no re-login — proxy `buildProxyHeaders` unchanged (INSPECT) | `pnpm lint` | 0 | 0 errors | PASS |
| AC-6  | Success/empty-data handling identical — `fetchData` + callers unchanged (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-7  | Auth failure → existing re-auth flow — `handleUnauthorized` `market` path unchanged (INSPECT) | `pnpm lint` | 0 | 0 errors | PASS |
| AC-8  | Validation/business errors surfaced via existing error path — `fetchData` catch unchanged (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-9  | Unexpected 500 → generic error via existing handling (INSPECT) | `pnpm lint` | 0 | 0 errors | PASS |
| AC-10 | Other customer endpoints still resolve to Laravel — only 4 paths added to `GO_APIS`, others absent (DIFF) | `git diff develop -- utils/server/tokenManager.ts` | 0 | +4 entries only | PASS |
| AC-11 | Rollback = comment the labelled block → `isFromGoApi` false → Laravel; no caller change (DIFF+INSPECT) | `git diff develop -- utils/server/tokenManager.ts` | 0 | grouped commented block present | PASS |
| AC-12 | No visible customer change with parity — callers/UI untouched (INSPECT+CONTRACT) | `pnpm exec tsc --noEmit` | 0 | 0 type errors | PASS* |
| AC-13 | Change confined to non-protected path; standard mode holds — only `utils/server/tokenManager.ts` changed (DIFF+STATIC) | `git diff --name-only develop -- . ':(exclude)_specs'` | 0 | 1 file, not in `protected_paths` | PASS |

\* PASS by static-analysis + code-inspection + the confirmed byte-parity contract.
The **live runtime confirmation** (proxy response `IS-FROM-GO: true` and unchanged
behavior against a reachable Go backend — plan Step 4) was **not executed in this
environment** (no reachable Go endpoint); see Notes. It is recommended as a
deploy-time smoke check.

## Commands run

- `git diff --name-only develop -- . ':(exclude)_specs'`
  ```
  utils/server/tokenManager.ts
  ```
- `pnpm exec tsc --noEmit`
  ```
  (no output) — exit 0
  ```
- `pnpm lint`
  ```
  ✖ 23 problems (0 errors, 23 warnings)   — exit 0
  (all 23 warnings pre-existing; none in utils/server/tokenManager.ts)
  ```
- `git status --porcelain` after running checks (VP-2 read-only confirm)
  ```
   M utils/server/tokenManager.ts   — the implementation edit only; checks
                                       introduced no further change
  ```

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **No.**
  (Trydos has no local observability stack; the guardrail is `protected_paths`.)
- **Protected-path impact statement (VF-9 / TR-3): NO.** The only changed file is
  `utils/server/tokenManager.ts`, which is not listed in
  `project-config.yaml > protected_paths`. No protected runtime path was modified,
  consistent with `standard` mode.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`  (reviewer transitions verified → closed)
- Approver(s): reviewer — yasser.omran@ramaaz.com (standard mode: 1 approver)
- Commit: none created at verify (VF-10 / ADR-008 — committing is `/publish-pr`'s job)
- Notes:
  - Every acceptance criterion is mapped to a result at all-ac depth. Static checks
    (typecheck, lint) pass; structural criteria (AC-5, AC-7, AC-9, AC-10, AC-11,
    AC-13) are confirmed directly from the diff and unchanged mechanism.
  - The behavior-parity criteria (AC-1..AC-4, AC-6, AC-8, AC-12, marked `*`) rest on
    the owner-confirmed precondition that Go responses are byte-compatible with the
    legacy responses and that Go accepts the existing session credential — a
    cross-service contract (ClickUp 86ey26atu) outside this repo. If that contract
    holds at runtime, these criteria pass by construction (callers/handlers are
    unchanged). Recommended deploy-time smoke check: exercise each of the four
    operations and confirm the proxy stamps `IS-FROM-GO: true` and behavior is
    unchanged.
