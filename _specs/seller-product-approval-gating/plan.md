---
ticket: seller-product-approval-gating
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Plan — seller-product-approval-gating

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 2** — rewritten to address all eight Required Follow-up Actions from
`review.md` (CHANGES_REQUESTED, 2026-07-25). The approach is unchanged; the
failure path, the retry path and the payload half are corrected. See
"Review follow-ups addressed" at the end for the point-by-point mapping.

## Approach

Unchanged and confirmed at review: the seller's approval standing arrives on
`GET /shop/info`, which `ShopInfoLoader` already fetches once per shop and parks
in the `dashboardShopInfo` slice that `ProductEditor` already reads behind a
`sellerId` guard — so carrying it costs a type widening and no extra round-trip.
The price lock rides a new, narrower `pricesLocked` prop rather than overloading
`SectionProps.disabled` (which already means "view mode"). The two banners reuse
`InlineAlert` with a new `warning` tone.

What this revision changes is how the shop-info result is **resolved**, because
the previous revision got three things wrong about it:

1. **Failure is detected in the resolved value, not in a `catch`.** `fetchData`
   does not throw on a failed request — it resolves `{ ...responseData, success:
   false }` (`utils/fetchData.ts:645`). A `.catch`-only failure path would never
   fire, leaving the create page loading forever.
2. **"Request failed" and "field absent" are different states.** A failed request
   means the standing is *unknown* → the create page errors (REQ-9 / AC-13). A
   *successful* response that simply does not carry the field means the backend
   does not gate this seller → the page behaves exactly as it did before this
   ticket, unrestricted. Conflating them would strip every price input from every
   seller on any environment where the field is not yet live.
3. **The loader never auto-retries.** Its early-return guard stays keyed on
   `sellerId` alone, so a recorded failure stops the effect re-firing. Retry is an
   explicit user action that *clears* the record, which lets the effect run once
   more. Making the guard skip failure records instead would re-fetch on every
   render, because writing the record re-triggers the effect that wrote it.

### Resolution model

The slice records a settled outcome for exactly one `sellerId`:

| Situation | `available` | `newProductsApproval` | Create-path behaviour |
|---|---|---|---|
| No record yet for this `sellerId` | — | — | existing loading state |
| Request did not succeed (`success: false`, or threw) | `false` | `true` | existing load-error state, retry clears the record |
| Succeeded, field absent or truthy | `true` | `true` | unrestricted — as before this ticket |
| Succeeded, field explicitly falsy (`false` / `0`, incl. string forms) | `true` | `false` | **restricted** — Purchase Price only |

`currency` stays a **required** field of the slice and is always written, using
`{ code: "", name: "" }` when unavailable. That preserves today's silent
degradation for the other consumer of this slice
(`sellerDashboard/[sellerId]/page.tsx:214-217`), which reads `currency.code`
non-optionally — so that file needs no change and stays out of scope.

The edit path ignores `available` entirely: a shop-info failure must not affect
editing an existing product in any way (AC-12 / AC-15).

## Steps

1. **Store slice** — widen the `dashboardShopInfo` type to
   `{ sellerId, currency: { code, name }, newProductsApproval: boolean,
   available: boolean } | null`, keeping `currency` required. **Type the setter to
   that same shape** rather than leaving it `(value: any)`, so the `full-build`
   typecheck can actually enforce a loader/consumer mismatch.
2. **Loader — always record a settled outcome.** In the `.then` branch, write a
   record whichever way the request went: on `!res?.success` write
   `available: false`; otherwise `available: true`. The write is **not** gated on
   `currency?.code` any more — currency falls back to `{ code: "", name: "" }` so a
   shop without a currency code still resolves instead of hanging. Keep the
   `cancelled` guard on every write, and keep the existing `LogError` call.
3. **Loader — failure from a thrown error.** Keep the `.catch` for genuine
   network/parse throws and write the same `available: false` record there, so both
   failure routes converge on one state.
4. **Loader — approval standing derivation.** Set `newProductsApproval` to `false`
   **only** when the response carries the field and it is explicitly falsy
   (`false` or `0`, including their string forms). Absent, null, or truthy all
   yield `true`. Absence is never a restriction.
5. **Loader — guard unchanged.** The effect keeps returning early whenever a
   record exists for the current `sellerId`, failure records included. This is
   what prevents a write→re-render→re-fetch loop; do not relax it.
6. **Shared UI** — add a `warning` tone to `InlineAlert` alongside `error` and
   `success`, with its own colours and icon, so a warning reads as neither a
   success nor a hard error (NFR).
7. **Translations** — add every new English string as a key to all three
   translation files (`ar`, `tr`, `ku`) **before** any of it is used in code, per
   the repo i18n rule and the lint gate.
8. **Editor — approval state** — read `is_product_updated_and_need_approval` off
   the edit response into the existing `productMeta`, alongside `request_status`.
9. **Editor — banners** — render a persistent warning when the pending flag is
   true (AC-1, AC-2), and a persistent warning when `request_status` is denied
   **and** the pending flag is false (AC-6). Suppress the existing first-approval
   pill while the pending flag is true (AC-4), leaving it untouched otherwise
   (AC-5). Neither banner is dismissible.
10. **Editor — create-path resolution gating.** On the create path only: no record
    for this `sellerId` → the existing loading state; a record with
    `available: false` → the existing load-error state (AC-13). The unrestricted
    form is never shown before the standing resolves, so price inputs are never
    withdrawn after being offered.
11. **Editor — working retry.** The create-path error retry clears the
    `dashboardShopInfo` record before re-running the existing load, so the loader's
    guard no longer matches and `GET /shop/info` is re-issued exactly once
    (AC-13). Without the clear, the retry cannot recover.
12. **Editor — price lock derivation** — `pricesLocked` is true only when creating
    **and** the record for this `sellerId` is `available` **and**
    `newProductsApproval` is `false`. Never true on the edit path (AC-12).
13. **Editor — prop wiring** — add `pricesLocked` to the section props contract as
    an **optional** prop defaulting to false, so no existing consumer changes
    behaviour, and pass it from the editor.
14. **Sections — product-level prices** — lock unit price, discount price, luck
    price and shipping cost when `pricesLocked`, leaving Purchase Price and every
    non-price field (stock, weight, max qty, pieces, shipping days) editable
    (AC-7).
15. **Sections — variant prices** — lock each variant's price, discount and luck
    when `pricesLocked`, reusing the existing money-field predicate in the shared
    variant cell helper so the three money columns stay identified in one place
    (AC-8).
16. **Sections — per-country prices** — lock the extra-price input and the country
    selector, and hide the add-row and remove-row controls entirely when
    `pricesLocked`, so no row can be created that cannot be completed (AC-9).
17. **Validation** — extend the form validator to accept the locked state and skip
    the unit-price, discount-price and luck-price rules when set, so a restricted
    seller can submit having entered only Purchase Price (AC-10). Purchase-price
    validation is unchanged.
18. **Payload** — extend the payload builder to accept the locked state and emit
    `"0"` for product-level `unit_price` when locked; today that key alone is
    appended raw (`helpers.ts:935`), unlike discount/purchase/luck which already
    coalesce `"" → "0"`. The variant money keys (`helpers.ts:1013-1014`) and the
    per-country JSON (`helpers.ts:1001`) **already** coalesce to `0` and need no
    change. Keys are never stripped, per the standing payload rule.
19. **Manual verification pass** — walk every acceptance criterion across the four
    seller states (approved/unapproved × create/edit) plus the three resolution
    outcomes (unresolved / unavailable / resolved), including the AC-15 no-change
    baseline, and run the validation profile.

## Files to change

- `store/index.ts` — **PROTECTED PATH.** Widen the `dashboardShopInfo` slice type
  and **its setter signature** to carry `newProductsApproval` and `available`,
  keeping `currency` required. Type-level change plus the existing `null` initial
  value; no behavioural change to any other slice.
- `components/SellerDashboard/ShopInfoLoader.tsx` — always record a settled
  outcome for the requested `sellerId` from the `.then` branch (success or
  `success: false`) and from `.catch`; derive `newProductsApproval` treating
  absence as unrestricted; drop the `currency?.code` gate on the write; leave the
  early-return guard unchanged.
- `components/SellerDashboard/ui/index.tsx` — add the `warning` tone to
  `InlineAlert`.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — capture the pending
  flag into `productMeta`; render the two banners; suppress the first-approval
  pill while pending; gate the create path on shop-info resolution; clear the
  record on retry; derive `pricesLocked`; pass it into the section props and into
  the validator and payload builder calls.
- `components/SellerDashboard/productEdit/sections.tsx` — add the optional
  `pricesLocked` to `SectionProps`; apply it to the product-level price inputs,
  the variant money cells, and the per-country block (inputs disabled, add/remove
  hidden).
- `components/SellerDashboard/productEdit/helpers.ts` — accept the locked state in
  the validator (skip restricted price rules) and in the payload builder (emit
  `"0"` for `unit_price` when locked).
- `public/translations/translations.ar.js` — add the new keys.
- `public/translations/translations.tr.js` — add the same keys.
- `public/translations/translations.ku.js` — add the same keys.

**Explicitly NOT changed:**
`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` reads
`dashboardShopInfo.currency.code` non-optionally. Because `currency` stays
required and is always written, that consumer keeps compiling and behaving
exactly as today. Touching it would be scope creep (IM-4); if implementation
finds it unavoidable, that is a deviation to record in `implement.md`, not a
silent edit.

**Protected-path declaration:** `store/index.ts` is listed in
`project-config.yaml > protected_paths`. It is changed deliberately and only as
described above; this listing is what authorises the edit at `/implement`
(GU-2 / IM-5), and `/verify` must carry the protected-path impact statement
(VF-9 / TR-3). No other protected path is touched — auth, cookies, cart, order,
proxy, server requests and build config are all untouched.

## Validation strategy

- Validation profile: `full-build`
- Rationale for the profile: the change touches a `protected_paths` file
  (`store/index.ts`), which is exactly the high-blast-radius case that profile
  exists for. With the setter now typed (Step 1), the profile's typecheck can
  genuinely catch a loader/consumer mismatch on the new fields — previously it
  could not, because the setter accepted `any`.
- Beyond the profile, `/verify` maps each `AC-n` to a manual result. There is no
  test suite in this repo by policy, so evidence is the recorded outcome of
  exercising each criterion across the four seller states and the three
  resolution outcomes.
- Translation parity is additionally asserted by the repo's i18n parity script;
  the profile's lint check already fails on a translate key missing from any of
  the three files.
- **AC-11 / AC-15 residual trade-off to record at `/verify`:** an approved seller
  whose shop-info request *fails* now sees a create-path error where previously
  the page loaded with no currency overlay. This is the intended consequence of
  REQ-9 and is deliberately narrowed to a failed request — a successful response
  without the field leaves behaviour unchanged.

## Rollback

- Nothing is committed before `/publish-pr`, so during implementation the whole
  change reverts by discarding the working-tree edits on the ticket branch.
- After publishing, reverting the single commit restores prior behaviour
  completely: the flags are read-only inputs, so no data is written, no migration
  occurs, and no API contract changes. A revert simply stops reading the two
  booleans — banners disappear, every price input returns to enabled, and the
  loader returns to storing currency alone.
- The store widening, the typed setter and the `InlineAlert` tone are additive;
  reverting them removes capability without stranding any consumer, because the
  only consumers are introduced by this same change.
- Partial rollback is available: the three behaviours are independent, so the
  price restriction can be reverted while keeping the banners, or vice versa. The
  create-path resolution gating (Steps 10–11) can also be reverted on its own,
  which returns create to its pre-ticket unrestricted behaviour without touching
  the banners.

## Review follow-ups addressed

Point-by-point against `review.md > Required Follow-up Actions` (PL-10):

| # | Follow-up | Addressed by |
|---|---|---|
| 1 | Record failure where it actually happens (`.then` on `!res?.success`, not `.catch`) | Steps 2–3; Approach ¶1 |
| 2 | Make the retry work | Step 11 (retry clears the record) + Step 5 (guard deliberately unchanged, so no re-fetch loop) |
| 3 | Lock only on an explicit `false` | Step 4; resolution table row 3 |
| 4 | Second consumer: add the file or keep its contract intact | Kept intact — `currency` stays required and is always written; "Explicitly NOT changed" states this and the deviation rule |
| 5 | Cover AC-10's payload half | Step 18 (`unit_price` → `"0"`; variant and per-country paths verified as already coalescing) |
| 6 | Always record resolution; don't gate on `currency?.code` | Step 2 |
| 7 | Type the setter | Step 1; Validation strategy rationale |
| 8 | Narrow the fail-closed condition and note the trade-off | Approach ¶2 + resolution table; trade-off recorded under Validation strategy for `/verify` |

## Out of scope

- Editing the code-verified API contract artifacts. They document the opposite
  create/update split and must be re-verified against backend source separately;
  prose does not outrank them.
- Confirming whether the update-path change closes the existing
  "seller edits a price, sees *saved*, nothing changed" defect.
- Surfacing approval state anywhere outside the product editor.
- Reconciling the pending-versus-live name divergence; the backend response is
  rendered exactly as received, deliberately.
- Any change to price handling on the update path, for any seller.
- Any per-variant purchase price.
- Any change to the shop-info or product endpoints themselves.
- Any change to `sellerDashboard/[sellerId]/page.tsx` — see "Explicitly NOT
  changed".
- Auto-retrying a failed shop-info request; recovery is an explicit user action
  by design, to avoid a re-fetch loop.
