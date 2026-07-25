---
ticket: seller-product-approval-gating
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Review — seller-product-approval-gating

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Round 2.** Round 1 (2026-07-25) recorded `CHANGES_REQUESTED` against plan
revision 1 with eight Required Follow-up Actions, after the advisory panel raised
five verified majors. `plan.md` revision 2 addressed all eight. This review covers
revision 2. The round-1 findings and their resolution are retained below for the
record.

## Review Scope

`spec.md` (10 requirements, 15 acceptance criteria) and `plan.md` **revision 2**
(19 steps, 9 files to change, `full-build` profile, plus an explicit follow-up
mapping table), read against the source files the plan proposes to change. The
advisory panel was re-dispatched at Step 1a over the revised plan, with each lens
additionally asked to judge whether the eight follow-ups were genuinely resolved
rather than only appearing to be. Every concrete panel claim was verified against
source before disposition.

**Comprehension check:** run and passed — 3/3, recorded in `comprehension.md`
(CG-1..CG-4). Questions covered the field-absent resolution rule, the reason the
loader guard is deliberately left unchanged, and which file is deliberately not
changed.

## Plan Summary

Carry the seller's approval standing on the existing `dashboardShopInfo` slice,
already populated by `ShopInfoLoader` from a request the dashboard already makes
and already read by `ProductEditor` behind a `sellerId` guard — so no extra
round-trip. Lock prices via a new optional `pricesLocked` prop rather than
overloading `SectionProps.disabled` (which means "view mode"). Two banners reuse
`InlineAlert` with a new `warning` tone.

Revision 2's substance is the **resolution model**: the slice records a settled
outcome per `sellerId`, distinguishing *no record yet* (loading), *request did not
succeed* (error, retry clears the record), *succeeded without the field*
(unrestricted — as before this ticket), and *succeeded with an explicit falsy
value* (restricted). Failure is detected in the resolved value because `fetchData`
does not throw; the loader guard stays keyed on `sellerId` alone so a recorded
failure cannot trigger a re-fetch loop, and recovery is an explicit user action
that clears the record.

## Risks

- **~~Unverified backend behaviour on a restricted create~~ — RETIRED
  (owner-confirmed, 2026-07-25).** The client submits `unit_price: "0"`, and every
  variant price resolves to `"0"` via the existing coalesce at `helpers.ts:1014`.
  This is safe only if the backend discards client price keys for an unapproved
  seller. That was unverified when this gate was recorded, and was accepted as a
  known risk with a blocking `/verify` requirement.

  **The owner has since confirmed (2026-07-25) that the backend ignores all price
  fields on create for a seller who is not approved.** The submitted `0` is
  therefore never persisted as a live sale price, and the zero-priced-product
  scenario cannot occur. The `/verify` requirement is downgraded from blocking to
  a recorded observation — see Required Follow-up Actions #1.

  Source: product owner, same channel that confirmed `is_new_products_approval` is
  returned by `GET /shop/info`. Not independently verified against backend source
  from this workspace; the code-verified contract artifacts are still to be
  re-checked separately once the backend ships (already Out of Scope here).
- The create path acquires a hard dependency on a request that was previously
  allowed to fail silently. A transient `GET /shop/info` failure now blocks
  creation for every seller, approved included, where the page previously loaded
  with no currency overlay. Narrowed so that a *successful* response without the
  field does not restrict, but not narrowed further.
- `store/index.ts` is a protected path with a second consumer; the plan keeps that
  consumer's contract intact rather than widening blast radius.

## Assumptions

- The backend discards client price keys on a create by an unapproved seller —
  **confirmed by the owner, 2026-07-25.** No longer an open risk; the submitted
  `0` values are ignored server-side rather than persisted.
- `is_new_products_approval` is present in the live `GET /shop/info` response
  (owner-confirmed, 2026-07-25). Presence in production does not guarantee
  presence in every environment, which is why absence must not restrict.
- `is_product_updated_and_need_approval` is present on the product edit response
  per backend PR #385; unverified from this workspace.
- The pending-update flag and `request_status = 2` are mutually exclusive, per the
  handoff's stated precondition that the pending flag requires an approved product.

## Open Questions

- ~~Does a create by a seller with `is_new_products_approval` falsy result in a
  product priced at what the client sent?~~ **Answered 2026-07-25:** the backend
  ignores all price fields on create for an unapproved seller. Closed.
- Should a transient shop-info failure block creation, or should the create path
  tolerate one automatic retry first? Deferred; current behaviour is deliberate
  and consistent with how a failed product load already behaves.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

### Round 2 — against `plan.md` revision 2

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| security | major | Restricted create submits `unit_price: "0"` and, via `price_${key} = r.price \|\| form.unit_price \|\| "0"`, every variant price 0 — if the backend does not override prices for an unapproved seller the product persists at zero and is purchasable for free; the backend-overrides assumption is explicitly unverified | Step 18 / AC-10 / `helpers.ts:935,1014` | **Accepted as a known risk at the gate; subsequently RESOLVED.** The lens correctly identified that no plan revision could settle it — it needed a backend answer. The owner supplied that answer on 2026-07-25: the backend **ignores all price fields on create for an unapproved seller**, so the submitted `0` is never persisted. The blocking `/verify` requirement is downgraded to a recorded observation (Required Follow-up Actions #1). Good catch — this was the right thing to escalate. |
| senior | minor | Step 6 specifies the `warning` tone with "its own colours and icon", but the icon set has no warning glyph and `icons.tsx` is not in "Files to change" — implementation would edit an unlisted file (IM-4) or silently drop half the step | Step 6, Files to change, `ui/icons.tsx` | **Accept — resolved here, no revision needed.** Verified: the set is `alert`, `check`, `trash`… with no `warning`. **Binding instruction to `/implement`: the `warning` tone reuses the existing `alert` glyph with different colours. `icons.tsx` is NOT to be modified.** |
| senior | minor | Step 17 says to skip the "unit-price, discount-price and luck-price rules", but `validate()` has no product-level luck-price rule; variant checks already no-op on empty values | Step 17, AC-10, `helpers.ts:705-715` | **Accept — resolved here, no revision needed.** Verified: `validate()` covers unit, discount and purchase only. **Binding instruction to `/implement`: skip the unit-price and discount-price rules; there is no luck rule to skip and none is to be invented.** |
| senior | minor | Step 18 threads a new locked flag through `buildUpdateFormData` to fix one key, when the smaller change is the unconditional coalesce its three neighbours already use — behaviour-identical and needs no new parameter | Step 18, `helpers.ts:935-943` | **Accept — simplification.** **Binding instruction to `/implement`: coalesce `unit_price` unconditionally (`"" → "0"`) like discount/purchase/luck; do NOT add a parameter to the payload builder. The validator parameter stays — it genuinely needs the state.** |
| security | minor | The failure record is `{ available: false, newProductsApproval: true }`, so a consumer reading `newProductsApproval` without checking `available` silently treats an unknown seller as approved; the plan relies on every future call site remembering the pairing | Resolution model row 2, Step 12 | **Accept as designed, with the permissive default deliberate.** An unknown standing must never restrict (follow-up #3), so defaulting permissive is the intended direction, not an accident. The single consumer added by this ticket checks both. Noted for `/implement` to keep the pairing explicit at the one call site. |
| security | minor | Follow-up 8 only partially resolved: absence no longer restricts, but the create path still hard-fails on *any* shop-info failure, so a transient blip blocks creation for approved sellers where the request previously degraded silently | Approach ¶2, Steps 2–3 & 10 vs follow-up #8 | **Accept, trade-off consciously retained.** REQ-9 asks the create path to fail the way a failed product load fails, which is exactly this. Recorded under the plan's Validation strategy for `/verify` to map against AC-11/AC-15. |
| senior | info | Follow-up 8 was reinterpreted rather than implemented as worded — defensible under REQ-9, but say so explicitly | Approach ¶2 vs follow-up #8 | Noted; the disposition above states it explicitly. |
| senior | info | Step 11 has `ProductEditor` clearing a slice written only by `ShopInfoLoader`; the clear is global so the dashboard list's currency label blanks until the loader repopulates | Step 11 | **Note for `implement.md`** so the transient blank is not mistaken for a regression at `/verify`. No change needed. |
| performance | info | The create form render is now gated on `GET /shop/info` resolving; the fetch already starts at dashboard layout mount and the record is reused per shop, so it costs at most one round-trip per shop per session | Step 10, AC-13 | Accept as-is; no prefetch or caching work warranted. Confirms the NFR holds. |
| security | info | Protected-path handling is correct: `store/index.ts` is the only entry touched, listed with an explicit declaration; no auth/cookie/proxy/serverRequests path involved; no secrets, endpoints, or new untrusted-input parsing introduced | Files to change / Protected-path declaration | Noted — GU-2 / IM-5 satisfied. |

**Round 2 outcome: 1 major, 5 minors, 4 infos** — down from 5 majors in round 1.
The remaining major is a backend question, not a plan defect.

### Round 1 — against `plan.md` revision 1 (retained for the record)

All five majors were verified against source and all eight resulting follow-ups
were addressed by revision 2:

| Severity | Finding | Resolved by |
|---|---|---|
| major | `fetchData` resolves `{ success: false }` rather than throwing, so a `.catch`-only failure path never fires and create hangs in loading forever | rev-2 Steps 2–3 |
| major | AC-13's retry could not recover: the loader guard matched the failure record and `onRetry` only re-ran the product fetch | rev-2 Step 11 (+ Step 5) |
| major | Absent `is_new_products_approval` is falsy, so every seller including approved ones would lose every price input on create | rev-2 Step 4 + resolution model |
| major | Second slice consumer `sellerDashboard/[sellerId]/page.tsx` read `currency.code` non-optionally and was not in "Files to change" | rev-2 keeps `currency` required; file explicitly not changed |
| major | AC-10 half covered — the payload builder was untouched, so a restricted create sent an empty `unit_price` | rev-2 Step 18 |
| minor ×3 | Write gated on `currency?.code`; untyped setter; fail-closed blast radius | rev-2 Steps 1, 2 and the recorded trade-off |

**Panel did not decide.** Every finding above was independently verified against
source before being accepted; the decision below is the owner's own (RP-2), gated
only by the comprehension check.

## Decision

`APPROVED`

- Rationale: revision 2 resolves all eight follow-ups from round 1, and the panel
  re-review confirms it — five majors reduced to one, with the two lenses that
  previously found blocking defects now returning none. The plan's failure path,
  retry path and payload half are corrected, and the resolution model correctly
  separates "request failed" (unknown → error) from "field absent" (backend does
  not gate this seller → unrestricted), which was the most dangerous defect in
  revision 1. The three remaining actionable minors are resolved in this document
  as binding instructions to `/implement` rather than by another revision cycle,
  because each is a one-line correction with no design content. The one remaining
  major — whether the backend discards prices on a restricted create — cannot be
  settled by any plan revision; the owner has accepted it as a known risk and
  required it be proven at `/verify` before the ticket may pass. Comprehension
  check passed 3/3.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (self-review; ADR-011), 2026-07-25 — after the
  comprehension check passed 3/3 (CG-4).

## ADR reference

- ADR: none

## Required Follow-up Actions

These do not block `/implement`. Items 2–4 are **binding on `/implement`**; item 1
is a recorded observation at `/verify`.

1. **~~BLOCKING AT `/verify`~~ → recorded observation (downgraded 2026-07-25).**
   The owner confirmed the backend **ignores all price fields on create for a
   seller who is not approved**, so the submitted `0` cannot persist as a live
   sale price and the zero-priced-product scenario is closed. AC-10 already
   requires creating a product as a restricted seller entering only Purchase
   Price, so while doing that, **note in `verify.md` what the created product's
   price actually came back as** — it costs nothing on top of the AC-10 run and
   documents the confirmed behaviour. It no longer gates PASSED. Should the
   observation contradict the confirmation, that is a genuine verification
   failure and the ticket returns for rework.
2. **`icons.tsx` is not to be modified.** The new `warning` tone reuses the
   existing `alert` glyph with different colours. Editing the icon set would be an
   unlisted-file change (IM-4).
3. **Do not invent a luck-price rule.** `validate()` has no product-level
   luck-price rule; skip only the unit-price and discount-price rules.
4. **Do not add a parameter to the payload builder.** Coalesce `unit_price`
   unconditionally (`"" → "0"`), matching discount/purchase/luck. The validator
   parameter stays.
5. **Record in `implement.md`** that clearing `dashboardShopInfo` on retry
   momentarily blanks the dashboard list's currency label until the loader
   repopulates, so it is not read as a regression at `/verify`.
