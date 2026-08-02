---
ticket: unify-delivery-day-calculation
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Implement — unify-delivery-day-calculation

> Record of what was actually built, following `plan.md`.

Entry path: **initial** (from `state: approved`). Branch `ticket/unify-delivery-day-calculation`
created from `develop` (IM-3). All six planned files changed, no others.

## Changes made

- `utils/startingSettings.ts` — **new.** Pure resolver, no framework or server-only imports.
  `resolveStartingSetting(payload)` returns the **complete** settings object, reading the
  accepted (core) envelope key `"starting-setting"` first and falling back to the gateway's
  `"starting_setting"`, with `shipping_duration_days` coerced to a finite number (`0` when
  absent, non-numeric or `NaN`). `normaliseStartingSettings(payload)` is the
  envelope-preserving variant for client ingest: it keeps the response envelope and replaces
  only the settings entry under `STARTING_SETTING_KEY` (`"starting_setting"`), the spelling
  every in-app reader indexes. Branch constants are named by role (accepted/core, gateway),
  never by stack.
- `serverRequests/index.tsx` — **`protected_paths`.** In `GetStarttingSetting`, the
  hard-coded `response?.data?.data?.["starting_setting"]` lookup is replaced by
  `resolveStartingSetting(response?.data?.data)`, still returning the **inner** settings
  object so `getOrderStatues` keeps reading `order_group_statuses` off the result. One import
  added; signature, routing, arguments, callers and surrounding comments untouched.
- `services/home.ts` — in `getClientData`, the response is passed through
  `normaliseStartingSettings` and the **same normalised object** is given to `setSettings` and
  written to `sessionStorage["starttingSetting"]`, so store and cache agree. The commented-out
  cache-first branch was left commented out.
- `components/settings/PersonalInfoCountries.tsx` — identical envelope-preserving
  normalisation in the country-change handler, the third writer of the store and cache.
- `components/Cart/CartItem.tsx` — the `getShippingDay` accessor (which parsed the session
  cache and returned `undefined` on a cold cache, making the sum `NaN` and hiding the row) is
  replaced by a single `totalShippingDays` derived from the store, with **both** operands
  coerced via `Number(x) || 0`. Used at both former call sites. The now-unused `useCallback`
  import was removed.
- `components/Cart/OldCartContainer.tsx` — the in-render session-cache parse is replaced by a
  store read; `settings` added to the existing `useAppStore()` destructure. The row's render
  condition changed from truthy `product.shipping_days` to the coerced sum being `> 0`, so a
  line with no product shipping time but a non-zero platform duration now renders.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

Modified (5):

- `components/Cart/CartItem.tsx`
- `components/Cart/OldCartContainer.tsx`
- `components/settings/PersonalInfoCountries.tsx`
- `serverRequests/index.tsx` — **protected path**, listed in the approved plan (GU-2 / IM-5)
- `services/home.ts`

Added (1):

- `utils/startingSettings.ts`

`git diff --stat`: 5 files changed, 36 insertions(+), 46 deletions(-) — plus the new module.
No commit created, nothing pushed (IM-9).

## Deviations from plan

- **None to the planned file list or behaviour.** All six entries applied as specified; no
  unlisted file modified.
- Two incidental edits inside already-listed files, both required to keep the planned change
  compiling and lint-clean rather than being independent changes:
  - `components/Cart/CartItem.tsx` — removed the `useCallback` import, unused once the
    accessor it wrapped was deleted.
  - `components/Cart/OldCartContainer.tsx` — added `settings` to the existing `useAppStore()`
    destructure.
- **Precondition note (IM-3 / GU-4):** `develop` carried two untracked paths at branch
  creation — this ticket's own `_specs/unify-delivery-day-calculation/` workspace (which must
  travel with the branch per PB-9) and `starting-settings-contract-diff.md`, a separate
  document produced during the pre-ticket investigation. **No tracked file was modified**, so
  the branch was created rather than blocking. The contract-diff document is unrelated to this
  ticket's file list and must **not** be staged by `/publish-pr` (PB-9 confines staging to the
  implemented source plus `_specs/<slug>/`).

## Validation run during implementation

Profile `full-build` (`typecheck`, `lint`, `build`) — all three pass.

- `pnpm exec tsc --noEmit` — **pass**, exit 0, no type errors.
- `pnpm lint` — **pass**, 0 errors / 35 warnings. All warnings are pre-existing
  (`import/no-anonymous-default-export` in service singletons, unused eslint-disable
  directives in `utils/history.ts` and `utils/usePhoneInput.tsx`); none originate from the six
  changed files, and no new warning was introduced.
- `pnpm build` — **pass**, production build completed and emitted the full route table.

Manual per-AC verification is **not** performed here — it belongs to `/verify`, which is
read-only and owns the AC → result mapping.
