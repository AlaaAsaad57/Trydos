---
ticket: seller-product-approval-gating
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Implement — seller-product-approval-gating

> Record of what was actually built, following `plan.md`.

Entry path: **initial** (from `state: approved`). Branch
`ticket/seller-product-approval-gating` created from clean `develop` (IM-3).
All 19 planned steps applied; no step deferred.

## Changes made

**Resolution model (Steps 1–5)**

- `store/index.ts` — **PROTECTED PATH, declared in the approved plan.** Extracted
  the inline slice shape into an exported `DashboardShopInfo` type carrying
  `newProductsApproval` and `available` alongside the existing `sellerId` and
  `currency`, and **typed `setDashboardShopInfo` to it** (it previously accepted
  `any`, which is why the typecheck could not have caught a mismatch before).
  `currency` deliberately stays **required**, so the slice's other consumer needs
  no change.
- `components/SellerDashboard/ShopInfoLoader.tsx` — now records a **settled
  outcome** for the requested `sellerId` on every path. Failure is detected in
  the `.then` branch on `!res?.success`, because `fetchData` resolves rather than
  throws; the `.catch` remains for genuine network/parse throws and writes the
  same record. The write is no longer gated on `currency?.code`, so a shop with
  no currency code still resolves. `newProductsApproval` is `false` **only** when
  the field is present and explicitly falsy — absent or null yields `true`, so an
  environment without the field never restricts anyone. The early-return guard is
  **unchanged** (keyed on `sellerId` alone), which is what prevents a
  write → re-render → re-fetch loop.

**Banners (Steps 6–9)**

- `components/SellerDashboard/ui/index.tsx` — `InlineAlert` gained a `warning`
  tone (amber), refactored to a small tone→class map so the union and the styles
  cannot drift apart. Per the review's binding instruction it **reuses the
  existing `alert` glyph**; `icons.tsx` was not touched.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — captures
  `is_product_updated_and_need_approval` into `productMeta`; renders a persistent
  warning banner when it is true (AC-1, AC-2) and a persistent warning banner
  when `request_status === 2` and no update is pending (AC-6); suppresses the
  existing "Pending Approval" pill while an update is pending (AC-4), leaving it
  untouched otherwise (AC-5). Neither banner is dismissible. Both are gated on
  `!isCreate`.

**Create-path restriction (Steps 10–18)**

- `ProductEditor.tsx` — derives `shopInfoPending` / `shopInfoUnavailable` /
  `pricesLocked` from the shop-info record. Create renders the existing loading
  state until the standing settles, so the unrestricted form is never shown and
  then withdrawn; a settled-but-unusable record renders the existing error state
  whose **retry clears the record** and reloads, so the loader's guard stops
  matching and `GET /shop/info` is re-issued exactly once (AC-13). `pricesLocked`
  requires create **and** a usable record **and** an explicit not-approved value.
  Passed into `sectionProps` and into `validate()`.
- `components/SellerDashboard/productEdit/sections.tsx` — added optional
  `pricesLocked` to `SectionProps` (default false, so no other consumer changes).
  `PricingSection` locks unit price, discount price, luck price and shipping cost
  while leaving Purchase Price and all non-price fields editable, and drops
  `required` from Unit Price when locked (AC-7). `VariantsSection`'s shared
  `cell()` helper locks only the three money columns, reusing the money-field
  predicate that already existed for the currency suffix (AC-8).
  `CountriesSection` disables the country selector and extra-price input and
  **hides** the add-row and remove-row controls (AC-9).
- `components/SellerDashboard/productEdit/helpers.ts` — `validate()` takes a
  third `pricesLocked` parameter and skips the unit-price and discount-price
  rules when set; purchase-price validation is unchanged (AC-10). The payload
  now coalesces `unit_price` **unconditionally** (`"" → "0"`), matching its three
  neighbours — no parameter was added to the builder.

**Translations (Step 7)**

- `public/translations/translations.{ar,tr,ku}.js` — three new keys added to all
  three files before use: the pending-update banner, the denied banner, and the
  create-path shop-info error (AC-14).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

| File | Change |
|---|---|
| `store/index.ts` | **protected path** — `DashboardShopInfo` type + typed setter |
| `components/SellerDashboard/ShopInfoLoader.tsx` | settled-outcome recording, absence never restricts |
| `components/SellerDashboard/ui/index.tsx` | `warning` tone on `InlineAlert` |
| `components/SellerDashboard/productEdit/ProductEditor.tsx` | banners, pill suppression, create gating, retry, `pricesLocked` |
| `components/SellerDashboard/productEdit/sections.tsx` | `pricesLocked` prop + three price surfaces |
| `components/SellerDashboard/productEdit/helpers.ts` | validator parameter + `unit_price` coalesce |
| `public/translations/translations.ar.js` | 3 new keys |
| `public/translations/translations.tr.js` | 3 new keys |
| `public/translations/translations.ku.js` | 3 new keys |

Nine files, all from `plan.md` "Files to change". No unlisted file was modified
(IM-4). `git status` confirms no other tracked file differs.

## Deviations from plan

**None in substance.** Three items were adjusted per the **binding instructions
recorded in `review.md > Required Follow-up Actions`**, which the approved plan's
prose had stated slightly wrong:

1. **`icons.tsx` not modified** (follow-up #2). Plan Step 6 said the `warning`
   tone gets "its own colours and icon", but the icon set has no warning glyph
   and that file was not in "Files to change". The tone reuses the `alert` glyph
   with warning colours, so no unlisted file was touched (IM-4 preserved).
2. **No luck-price rule skipped** (follow-up #3). Plan Step 17 said to skip the
   "unit-price, discount-price and luck-price rules", but `validate()` has no
   product-level luck-price rule. Only the unit-price and discount-price rules
   are skipped; none was invented.
3. **No parameter added to the payload builder** (follow-up #4). Plan Step 18
   proposed threading the locked state through `buildUpdateFormData` to fix one
   key. `unit_price` is now coalesced unconditionally like its three neighbours —
   behaviour-identical, smaller, and no new parameter. The **validator** keeps its
   parameter, which it genuinely needs.

**Behaviour to note for `/verify`** (follow-up #5, not a deviation): the
create-path retry clears `dashboardShopInfo` globally, so the dashboard product
list's currency label blanks for the moment between the clear and the loader
repopulating. This is transient and self-correcting — **not** a regression.

## Validation run during implementation

Profile `full-build` (`project-config.yaml > validation_profiles`), all three
checks executed locally on the ticket branch:

| Check | Result |
|---|---|
| `typecheck` | **pass** — exit 0, no type errors. Meaningful here specifically because the setter is now typed. |
| `lint` | **pass** — exit 0. 35 warnings, all pre-existing in `services/*` and `utils/*`; none in any changed file. No i18n key errors, confirming all three new keys resolve in ar/tr/ku. |
| `build` | **pass** — exit 0, production build completed. |

Additionally, outside the profile:

| Check | Result |
|---|---|
| `lint:i18n-parity` | **pass** — 2045 keys present in all three files. |

No implementation file was modified by running these (VP-2). **No commit was
created and nothing was pushed** (IM-9).

**Not yet exercised — belongs to `/verify`:** every acceptance criterion needs a
manual run across the four seller states (approved/unapproved × create/edit) and
the three resolution outcomes (unresolved / unavailable / resolved). In
particular AC-10 must record what price the created product actually came back
with, per `review.md > Required Follow-up Actions #1`.
