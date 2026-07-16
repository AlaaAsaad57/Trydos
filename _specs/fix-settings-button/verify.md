---
ticket: fix-settings-button
stage: verify
mode: standard
status: complete
owner: reviewer
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Verify — fix-settings-button

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: standard-frontend

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Settings item renders as `<NextLink>` and navigates from Orders list page (`/settings/orders`) | `pnpm exec tsc --noEmit` + code inspection | 0 | No type errors. Guard `pathname !== href` evaluates `true` for `/settings/orders` vs `/settings` → link renders | **pass** |
| AC-2 | Settings item navigates from Order Details page (`/settings/orders/[id]`) | code inspection | — | Same guard logic; `/settings/orders/123 !== /settings` → link renders and navigates | **pass** |
| AC-3 | Menu closes after tapping Settings (all pages) | code inspection | — | `onClick` prop (`setMenuOpen(false)`) is called in both the `<NextLink>` branch and the `<div>` fallback | **pass** |
| AC-4 | Settings item still works from non-settings pages (e.g. homepage) | code inspection | — | `/gb-en/ !== /gb-en/settings` → link always rendered on non-settings pages (unchanged behaviour) | **pass** |
| AC-5 | When already on `/settings` exact path, menu closes without error | code inspection | — | `pathname === href` → falls through to `<div onClick={onClick}>` which closes menu; no navigation, no error | **pass** |

## Commands run

- `pnpm exec tsc --noEmit` (typecheck — resolved from `standard-frontend` profile)
  ```
  Exit 0 — no type errors.
  Note: .next/dev/types/validator.ts previously held stale references to
  deleted fcm-dashboard files; those references were cleared by removing
  .next/dev/ before the run (pre-existing cache artifact, unrelated to this ticket).
  ```

- `pnpm lint` / `pnpm exec next lint` (lint — resolved from `standard-frontend` profile)
  ```
  Exit 1 — could-not-run (infrastructure issue, not a code defect).
  Next.js 16 removed the `next lint` CLI subcommand. ESLint is not installed
  as a direct project dependency. This failure predates this ticket and is
  unrelated to the one-expression change. Code inspection confirms the changed
  expression introduces no linting issues: it replaces one boolean method call
  (`String.prototype.includes`) with a strict equality operator — both are valid
  JS/TS and conform to the existing code style.
  ```

## Observability & runtime impact review

> Trydos uses `protected_paths` in lieu of `observability/**` (per project-config.yaml).

- Were any `protected_paths` runtime configs changed by this ticket? **no**
- The only changed file is `components/Home/Menu.tsx`, which is a client-side UI component outside all protected path patterns (`proxy.ts`, `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`, `services/auth.ts`, `services/cart.ts`, `services/order.ts`, `services/orders.ts`, `store/index.ts`, `next.config.ts`).

## Sign-off

- Outcome: **PASSED**
- Rationale: All 5 ACs pass by typecheck and code inspection. The single-expression change (`!pathname.includes(href)` → `pathname !== href`) is mechanically correct and type-safe. The lint check could not run due to a pre-existing broken `pnpm lint` script (Next.js 16 removed `next lint`); this is an infrastructure gap unrelated to the fix. The change scope is confined to the one planned file with no protected-path impact.
- Final ticket state: `closed`
- Approver(s): Alaa Asaad (reviewer)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery boundary's job, owned by `/publish-pr`)
- Notes: The `pnpm lint` broken-toolchain issue should be tracked separately (replace `next lint` with direct `eslint` invocation in `package.json`).
