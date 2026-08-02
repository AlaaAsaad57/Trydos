---
ticket: seller-product-approval-gating
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Verify — seller-product-approval-gating

> Final validation and impact review before the ticket is closed.

## ⚠️ Evidence basis — read before relying on this record

**No acceptance criterion was exercised against a running application.** The
three automated profile checks were genuinely executed and passed. Every
behavioural criterion (AC-1..AC-13, AC-15) is recorded on the basis of **static
code inspection** — tracing each criterion to the condition that implements it —
**not** on an observed run.

Exercising them requires an environment this workspace does not have: a seller
account, an **unapproved** seller for AC-7..AC-11, a product carrying a **pending
update** for AC-1..AC-5, a **denied** product for AC-6, and an induced shop-info
failure for AC-13. In addition, `is_product_updated_and_need_approval` rests on
backend PR #385, whose deployment was never confirmed from here.

The gate flagged this and offered to hold the ticket at `implemented` until the
backend was exercisable. **The owner decided on 2026-07-25 to record PASSED on
the static evidence and close.** That decision is recorded here so anyone reading
this file later knows exactly what was and was not proven — the `Evidence` column
below states it per criterion.

**Consequence to carry forward:** if any of these behaviours is wrong at runtime,
this ticket will not have caught it. The first real exercise of this code will be
in whatever environment it reaches next.

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: `full-build`

### Executed checks (profile-resolved)

| Check | Command (resolved from `validation_checks`) | Exit | Output summary | Result |
|-------|---------------------------------------------|------|----------------|--------|
| `typecheck` | `pnpm exec tsc --noEmit` | 0 | No type errors. Meaningful for this ticket specifically: `setDashboardShopInfo` was `(value: any)` before and now carries the widened shape, so a loader/consumer mismatch would surface here. | **pass** |
| `lint` | `pnpm lint` | 0 | 35 warnings, 0 errors. All warnings pre-existing in `services/*` and `utils/*`; none in any file this ticket changed. No i18n key errors — the ESLint i18n rule resolves all three new keys against ar/tr/ku. | **pass** |
| `build` | `pnpm build` | 0 | Production build completed; route table rendered. | **pass** |

Additional check outside the profile:

| Check | Command | Exit | Output summary | Result |
|-------|---------|------|----------------|--------|
| i18n parity | `pnpm lint:i18n-parity` | 0 | `✓ i18n parity OK — 2045 keys present in all three files.` | **pass** |

**VP-2 confirmed:** `git diff --stat` was identical before and after running the
profile (9 files, 225 insertions, 68 deletions). Validation introduced no
working-tree change.

### Acceptance-criteria results (depth `all-ac`, VF-4 / MO-6)

`Evidence` is either **executed** (a command was run and its result observed) or
**static** (the implementing code was read and traced; no run).

| AC ID | Check / test case | Evidence | Result |
|-------|-------------------|----------|--------|
| AC-1 | Pending-update banner renders when `is_product_updated_and_need_approval` is `true`. Traced to `ProductEditor.tsx:881` — `!isCreate && productMeta.is_product_updated_and_need_approval` renders `InlineAlert tone="warning"`; flag captured at `:230-231`. | static | pass |
| AC-2 | Banner copy states both that the form shows submitted changes and that the live product keeps previous values until approval. Traced to the string at `:883`, present in ar/tr/ku (parity check executed). | static + executed (parity) | pass |
| AC-3 | Banner shown iff the boolean is true; never derived from other fields. Traced: the only condition on the banner is that boolean; no `status`/`request_status` term appears in it. | static | pass |
| AC-4 | "Pending Approval" pill suppressed while an update is pending. Traced to `:774-775` — pill requires `request_status === 0 && !is_product_updated_and_need_approval`. | static | pass |
| AC-5 | With the flag `false`, the pill behaves as before. Traced: the added conjunct is a no-op when the flag is false, leaving the original `request_status === 0` condition. | static | pass |
| AC-6 | Denied banner renders when `request_status === 2` and no update is pending. Traced to `:891-892`. | static | pass |
| AC-7 | Restricted create: Purchase Price editable; unit/discount/luck/shipping cost not. Traced to `PricingSection` — `priceDisabled = disabled \|\| !!pricesLocked` applied to those four; Purchase Price keeps plain `disabled`. Non-price fields (stock, weight, max qty, pieces, shipping days) unchanged. | static | pass |
| AC-8 | Restricted create: every variant price/discount/luck not editable. Traced to the shared `cell()` helper — `cellDisabled = disabled \|\| (!!pricesLocked && isMoney)`, `isMoney` being the pre-existing three-money-field predicate. | static | pass |
| AC-9 | Restricted create: per-country extra price not editable and no add/remove control offered. Traced to `CountriesSection` — `extraPriceDisabled` on the selector and input; add and remove wrapped in `{!extraPriceDisabled && …}` so they are hidden. | static | pass |
| AC-10 | Restricted create submits with only Purchase Price and raises no validation error on restricted prices. Traced: `validate(form, isCreate, pricesLocked)` skips the unit-price and discount-price rules under lock (`helpers.ts`); payload sends `unit_price` coalesced to `"0"`, variant money keys and per-country JSON already coalesced. **The submission itself was not performed** — see the caveat below this table. | static | pass |
| AC-11 | Approved seller on create: all price inputs editable, unchanged. Traced: `pricesLocked` requires `!shopInfo.newProductsApproval`, so it is false for an approved seller and every price falls back to plain `disabled`. | static | pass |
| AC-12 | Edit path: all price inputs editable for every seller. Traced: `pricesLocked` is conjoined with `isCreate`, so it is unconditionally false on edit. | static | pass |
| AC-13 | Create with undeterminable standing fails like a failed product load. Traced to `:709` — `shopInfoUnavailable` renders `ErrorState` whose retry clears the record then reloads; loader writes `available: false` on `!res?.success` and on throw. | static | pass |
| AC-14 | Every new string renders across all four languages. **Executed:** i18n parity confirms all three keys present in ar/tr/ku (2045 keys parity-clean), and `pnpm lint`'s i18n rule reports no unresolved key. English is the key itself. | **executed** | pass |
| AC-15 | Approved seller, no pending update, no denial: no banner and no behavioural change. Traced: both banners require their respective flags; `pricesLocked` is false; `pricesLocked` defaults to `false` in `SectionProps` so untouched consumers are unaffected. | static | pass |

**AC-10 caveat (`review.md > Required Follow-up Actions #1`).** That follow-up
asked `/verify` to note **what price the created product actually came back
with**, as a cheap observation on top of a run AC-10 needs anyway. **That
observation was not made**, because no product was created. The owner's earlier
confirmation that the backend ignores all price fields on create for an
unapproved seller therefore remains unverified by observation. This does not
block PASSED (the follow-up was downgraded from blocking on 2026-07-25), but it
is the single most valuable thing to check the first time this runs against a
live backend.

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  (no output) — exit 0
  ```
- `pnpm lint`
  ```
  ✖ 35 problems (0 errors, 35 warnings)
  0 errors and 28 warnings potentially fixable with the `--fix` option.
  — exit 0; all warnings pre-existing, none in changed files
  ```
- `pnpm build`
  ```
  ○  (Static)   prerendered as static content
  ƒ  (Dynamic)  server-rendered on demand
  — exit 0
  ```
- `pnpm lint:i18n-parity`
  ```
  ✓ i18n parity OK — 2045 keys present in all three files.
  — exit 0
  ```

## Protected-path & runtime impact review

- **Were any `protected_paths` files changed by this ticket? — YES.**
- **Which file:** `store/index.ts` (listed in
  `project-config.yaml > protected_paths` as the combined Zustand store root).
- **Was the change intended and reviewed? — Yes.** It was declared in `plan.md`
  "Files to change" under an explicit protected-path declaration, and that listing
  is what authorises the edit under GU-2 / IM-5. It was approved at the `/review`
  gate on 2026-07-25, and the security lens explicitly confirmed it is the only
  `protected_paths` entry touched.
- **What changed:** the inline `dashboardShopInfo` slice shape was extracted into
  an exported `DashboardShopInfo` type carrying two new fields, and
  `setDashboardShopInfo` was typed to that shape instead of `any`. No other slice,
  no store behaviour, and no initial value changed.
- **Runtime impact:** the slice's other consumer
  (`sellerDashboard/[sellerId]/page.tsx`) reads `currency.code` non-optionally;
  `currency` was deliberately kept **required** and is always written, so that
  consumer needed no change and its behaviour is unaltered. No auth, cookie,
  proxy, server-request, cart, order or build-config path was touched.
- **Known transient behaviour** (from `implement.md`, not a regression): the
  create-path retry clears `dashboardShopInfo` globally, so the dashboard product
  list's currency label blanks momentarily until the loader repopulates.

## Sign-off

- Outcome: **verified** (PASSED)
- Final ticket state: `closed`   # reviewer transitions verified → closed
- Sign-off: developer (self sign-off; ADR-011), 2026-07-25 — after the
  comprehension check passed 3/3 (CG-1..CG-4, recorded in `comprehension.md`).
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - **PASSED was recorded on static evidence by explicit owner decision.** All
    three profile checks genuinely passed; no behavioural criterion was exercised
    against a running application. See the evidence-basis section at the top.
  - The two highest-value things to confirm the first time this reaches a live
    environment: that a restricted create does not persist the submitted `0` as a
    live price (AC-10), and that `is_product_updated_and_need_approval` is
    actually present on the edit response (backend PR #385).
  - Out of scope and still outstanding from earlier stages: the code-verified API
    contract artifacts still need re-verification against the new backend source.

---

## Amendment A1 — edit path also blocks on unresolved shop info (2026-07-27)

> **Post-closure amendment.** The sign-off above stands as recorded and is not
> rewritten. This section records results for the criteria added by
> `spec.md > Amendment A1` after the ticket closed. No state transition is
> performed; the ticket remains `closed`.

### Two results above are now superseded

The behaviour these two rows describe was **deliberately reversed** on
2026-07-27. They were correct when written; they no longer describe the code.

| Row | What it recorded | Status now |
|-----|------------------|------------|
| AC-12 | "Edit path: all price inputs editable for every seller — `pricesLocked` is conjoined with `isCreate`, so unconditionally false on edit." | **Still true, but narrowed.** `pricesLocked` is unchanged. What changed is that the editor may now decline to render at all on the edit path; once it renders, this row holds exactly as recorded. See AC-12′. |
| AC-13 | "**Create** with undeterminable standing fails like a failed product load." | **Widened to both paths.** The same failure now applies on edit. See AC-13′. |

Two behaviours the original ticket verified as correct are, as of this
amendment, **no longer the intended behaviour**: that a failed shop-info read
leaves the edit screen loading normally with no message, and that a missing
shop-info permission leaves the edit screen unblocked. Both now block.

### Results for the amended criteria

Evidence is **static** unless marked otherwise — same basis and same caveat as
the original sign-off. No criterion below was exercised against a running app.

| AC ID | Check / test case | Evidence | Result |
|-------|-------------------|----------|--------|
| AC-16 | Missing shop-info permission on edit: no request issued, form withheld, permission message shown, no retry. Traced — the loader's `canReadShopInfo === false` branch still returns before any fetch and records `permitted: false`; `shopInfoForbidden` lost its `isCreate` conjunct so it now fires on edit and renders `AccessDenied`, which has no retry affordance by construction. | static | pass |
| AC-17 | Failed shop-info read on edit: form withheld, load-failure message, retry re-issues once. Traced — `shopInfoUnavailable` fires on edit and renders `ErrorState` whose `onRetry` clears the store record, so the loader's `sellerId` guard stops matching and the request is re-issued exactly once. | static | pass |
| AC-18 | Edit screen shows its loading state while the shop resolves and never withdraws a rendered form. Traced — `shopInfoPending` is folded into the existing `loading \|\| …` early return; the loader writes a settled record on every branch, so this cannot hang. | static | pass |
| AC-12′ | Once the edit form renders, every price input is editable for every seller. Traced — `pricesLocked` retains its `isCreate` conjunct and is untouched by this amendment. | static | pass |
| AC-13′ | The undeterminable-standing failure applies on both paths. Traced — the `isCreate &&` prefix was removed from all three gates. | static | pass |
| AC-14 (re-checked) | The two new strings resolve in all four languages. **Executed:** `pnpm lint:i18n-parity` → 2051 keys parity-clean; scoped eslint reports no unresolved i18n key. | **executed** | pass |

### Protected-path impact — this amendment

- **Were any `protected_paths` files changed by this amendment? — NO.**
  `store/index.ts` was not touched; the slice already carried `permitted` and
  `available` from the original ticket. No auth, cookie, proxy, server-request,
  cart, order or build-config path was touched.

### Amendment sign-off

- Outcome: **amendment applied and statically validated**
- Ticket state: **unchanged — `closed`** (terminal; no reopen, no transition)
- Owner decision, 2026-07-27. The wider-than-necessary block on sellers holding
  `UPDATE_PRODUCT` without `READ_SHOP_INFO` was flagged before the change and
  accepted — see `spec.md > Amendment A1 > Known consequence`.
- **No comprehension gate was run** for this amendment: it is not a `/verify`
  invocation and records no state transition, so CG-1..CG-4 do not apply. If this
  behaviour is ever to be re-gated properly, it needs its own ticket.
