---
ticket: unify-delivery-day-calculation
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Verify — unify-delivery-day-calculation

> Final validation and impact review before the ticket is closed.

## Evidence basis (read this before the table)

Two kinds of evidence appear below, and they are **not** equivalent. They are labelled per
row so the record cannot be mistaken for more than it is:

- **executed** — a command was run at this gate and its exit code observed.
- **static** — verified by code trace on the ticket branch, plus the live
  `/web/home/startingSettings` payloads captured from **both** backends during the pre-ticket
  investigation (recorded in `starting-settings-contract-diff.md`, both HTTP 200,
  `shipping_duration_days: 2` under `starting-setting` on core and `starting_setting` on the
  gateway).

**No acceptance criterion below was observed rendering in a running browser.** The plan's
manual per-surface checks — each surface signed in and as a guest — were **not executed at
this gate**. The ticket owner elected to accept static verification for the behavioural
criteria; that decision is recorded here rather than obscured. The residual risk is that a
rendering-layer fault invisible to a code trace would not have been caught, which is
addressed by the manual pass in "Recommended before release" below.

## Checks performed

- Validation profile: `full-build` (resolved from `project-config.yaml > validation_profiles`
  → checks `typecheck`, `lint`, `build`; commands taken only from `validation_checks`, VP-4)

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Product page delivery figure = product days + platform duration. Server path: `GetStarttingSetting` → `resolveStartingSetting` returns the inner object from either envelope key → `ProductExpectedDeleiveryWrapper` sums it with `Number(productData?.shipping_days) \|\| 0`. Previously `undefined` for verified shoppers. | — (static) | — | Resolver reads `starting-setting` then `starting_setting`; server contract unchanged. | pass (static) |
| AC-2 | Product footer figure = sum. `ProductFooter.tsx:64` reads `settingResponse?.shipping_duration_days` off the same repaired server fetcher and passes it down. | — (static) | — | No edit needed; repaired upstream. | pass (static) |
| AC-3 | Add-to-cart sheet figure = sum. `AddToCart/Card.tsx` and `PropertiesMarquee.tsx` read `settings["starting_setting"]` from the store, now populated envelope-preserving by `normaliseStartingSettings`. | — (static) | — | Store keeps the envelope; reader key unchanged. | pass (static) |
| AC-4 | Cart line figure = sum. `CartItem.tsx` now derives `totalShippingDays` from the store with both operands coerced. | — (static) | — | Session-cache parse removed; sum cannot be `NaN`. | pass (static) |
| AC-5 | Figures identical across the four surfaces. All read one normalised value — server surfaces via the fetcher, client surfaces via the store — written from the same resolver. | — (static) | — | Single source; no per-surface arithmetic changed. | pass (static) |
| AC-6 | Signed-in and guest see the same figure, neither missing the platform duration. Live payloads confirm both backends return `shipping_duration_days: 2` under different envelope keys; the resolver accepts both. | — (static, live API evidence) | — | core → `starting-setting`; gateway → `starting_setting`; both resolved. | pass (static) |
| AC-7 | Cart-level multi-seller figure = longest product time + platform duration once. `ShippingAddressContainer.tsx:587-601` logic **unmodified**; it reads the same store envelope, now populated. | — (static) | — | Not edited by this ticket; repaired upstream. | pass (static) |
| AC-8 | Cart row displayed whenever a delivery time exists, never non-numeric. Root cause removed: the old accessor returned `undefined` on a cold cache → `NaN` → row hidden. Both operands now coerced; resolver guarantees a finite platform value. | — (static) | — | `NaN` path eliminated at source. | pass (static) |
| AC-9 | Absent platform duration → product days alone; absent product days → platform duration alone. Resolver yields `0` for an absent/non-numeric duration; `Number(product.shipping_days) \|\| 0` covers the other operand. | — (static) | — | Both directions covered by coercion. | pass (static) |
| AC-10 | Nothing misleading when no delivery time can be determined. Existing guards retained — the marquee renders a "soon" label at zero total, and both cart rows render only when the sum is `> 0`. | — (static) | — | No guard removed; `OldCartContainer` condition tightened, not loosened. | pass (static) |
| AC-12 | No new/reworded user-visible copy; no hardcoded user-visible string introduced. Diff adds only comments and identifiers; the repo's i18n lint rule reports no new finding. | `pnpm lint` | 0 | 0 errors, 35 warnings — all pre-existing, none in the six changed files. | pass (executed) |
| AC-13 | Type-check, lint and production build pass with no new errors or suppressions. | `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` | 0; 0; 0 | No type errors; 0 lint errors; "✓ Compiled successfully in 103s". | pass (executed) |

`AC-11` was removed in `spec.md` revision 2 and is intentionally absent (transient start-up
behaviour is out of scope). Twelve criteria, all mapped — depth `all-ac` (VF-4 / MO-6).

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  exit=0    (no output — no type errors)
  ```
- `pnpm lint`
  ```
  exit=0
  ✖ 35 problems (0 errors, 35 warnings)
  All warnings pre-existing: import/no-anonymous-default-export in service
  singletons; unused eslint-disable directives in utils/history.ts and
  utils/usePhoneInput.tsx. None in the six changed files.
  ```
- `pnpm build`
  ```
  exit=0
  ✓ Compiled successfully in 103s
  Full route table emitted; no build error.
  ```
- **VP-2 confirmed:** `git status --porcelain` after running all three checks is byte-identical
  to before — validation introduced no working-tree change. No commit created (VF-10).

## Protected-path & runtime impact review

- **Were any `protected_paths` files changed by this ticket?** **Yes — one.**
- `serverRequests/index.tsx` (matches `serverRequests/**`). It was listed explicitly in the
  approved `plan.md` "Files to change" and approved at the `/review` gate (GU-2 / IM-5).
- **Scope of that change:** one import added, and the single return expression of
  `GetStarttingSetting` swapped from a hard-coded envelope-key lookup to `resolveStartingSetting(...)`.
  The function's signature, its `resolveMarketFetchBase` routing, its headers, its arguments
  and all callers are unchanged, and no surrounding comment was edited. It returns the inner
  settings object exactly as before, so `getOrderStatues` continues to read
  `order_group_statuses` off the result.
- **Runtime impact:** the auth-token, guest-registration and 401-retry paths in that module
  were not touched. The new `utils/startingSettings.ts` is framework-free with no server-only
  imports, so importing it from the client-reachable barrel introduces no `next/headers` into
  the client graph — confirmed by the passing production build.
- **Intended and reviewed:** yes, on both counts.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: `developer` (single self sign-off; comprehension check passed 3/3 — see
  `comprehension.md`, verify section, CG-4)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - **Recommended before release** — the manual pass the plan specified but this gate did not
    execute: each of the four surfaces, once signed in and once as a guest, plus a
    multi-seller cart, a zero-platform-duration country, and the product marquee on both its
    mounts. This is the check that would catch a rendering-layer fault a code trace cannot.
  - **Observation, not a criterion:** order-history status tabs, previously empty for
    signed-in shoppers because the server fetcher resolved to `undefined`, will now render.
    Some labels lack `ar`/`tr`/`ku` keys (at minimum `"Canceled & Archived"` and `"Pending"`),
    and the core backend emits the raw key `order_status.out_for_return`. Deliberately out of
    scope — a follow-up ticket is recommended.
  - **Observation, not a criterion:** order-history and order-details delivery estimates read
    the same store key and will change by gaining the platform duration. Not edited; worth a
    glance for double-counting.
  - **Known gap:** `NFR-2` has no acceptance criterion mapped to it since `AC-11` was removed,
    so nothing above records against it. Knowingly accepted at `/review` — the change improves
    the behaviour it describes.
  - **Known risk:** the resolver's `0` default makes a dropped or renamed duration field
    indistinguishable from a genuine zero (NFR-1). The signed-in-versus-guest comparison is
    the standing detector; it should be part of the manual pass above.
