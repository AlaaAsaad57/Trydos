---
ticket: seller-product-approval-gating
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Intake — seller-product-approval-gating

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- id / slug: `seller-product-approval-gating`
- Source: `handoff-pending-update.md` (repo root) — the backend handoff describing
  both incoming API changes, with all nine of its open questions resolved by the
  owner on 2026-07-25.
- ClickUp: —
- GitHub: —

## Ticket Summary

Make the seller product editor reflect the backend's approval state. Three
behaviours:

1. **Pending-update banner.** The product edit response gains an always-present
   boolean `is_product_updated_and_need_approval`; when it is `true` the form is
   showing the seller's *pending* (submitted-but-unapproved) values and must
   display a persistent warning, taking precedence over the existing
   `request_status` pill.
2. **Denied banner.** When `request_status = 2` (denied) — a state currently
   surfaced nowhere — show a banner telling the seller their last edits were
   denied. Added by the owner at intake; not part of the source handoff.
3. **Create-path price restriction.** The shop-info response carries
   `is_new_products_approval` reflecting the seller's approval standing; when it
   is falsy **on the create path only**, the seller may enter Purchase Price and
   nothing else — every other price input is disabled. The update path is
   unrestricted for all sellers regardless of the flag.

## Ticket Metadata

- id / slug: seller-product-approval-gating
- title: Seller product approval gating — approval banners + create-path price restriction
- owner: developer
- created: 2026-07-25
- links: —

## User Story

> As a **seller whose product edits require admin approval**, I want the product
> form to tell me that my submitted changes are still awaiting review, so that I
> understand why the values I see are not yet live and do not resubmit them
> thinking the save failed.

> As a **seller whose edits were rejected**, I want the product form to tell me
> they were denied, so that I know the live product still holds the old values and
> I can decide what to change rather than assuming my edit went through.

> As a **seller who is not yet approved to set retail prices**, I want the
> create-product form to accept only the price I am allowed to set, so that I can
> add products without submitting prices that would be rejected or ignored.

## Acceptance Criteria Presence Check

- Present? **no** (derivable — not a blocker)
- Notes: the source handoff specifies both behaviours completely — the flags and
  their types, when each is `true`, exactly which price fields are restricted and
  which stay editable, and the precedence of the pending-update flag over
  `request_status` — but it states them as prose and tables with no stable `AC-n`
  identifiers. `/spec` authors the acceptance criteria; nothing has to be asked of
  the owner or the backend first.

## Test Cases Presence Check

- Present? **no** (expected)
- Notes: this repo deliberately has no test suite — verification is manual and
  recorded per acceptance criterion at `/verify`, backed by the configured
  validation profile. Test cases are authored at `/spec`, not supplied by intake.

## Missing Information

None blocking — every item below was resolved by the owner on 2026-07-25.

- **Backend readiness — both flags confirmed available.**
  - `is_product_updated_and_need_approval` is described by the handoff as already
    delivered — *"`GET /shop/product/{id}/edit` **now has** one new boolean
    field"* — backed by backend PR #385.
  - `is_new_products_approval` **is returned by `GET /shop/info`** — the owner
    confirmed on 2026-07-25 that the field is genuinely present in the live
    response, the one already consumed by `SellerDashboardService.getShopInfo`
    (`services/sellerDashboard/index.ts:602`). This supersedes the handoff's own
    caveat that the field was relayed rather than shipped and *"needs its own
    backend confirmation before implementation"*: the confirmation is given and
    the create-path price restriction has no outstanding prerequisite.
  - The **product-edit** flag is still only the handoff's claim (PR #385) — no
    captured payload for that endpoint exists in this repo and the backend
    repository is not reachable from this workspace. `/research` should eyeball
    one real edit response. A sanity check, not a gate.
- **`unit_price` validation on the restricted create path — resolved.** On create
  with `is_new_products_approval` falsy, the backend **ignores unit-price
  validation entirely**. The client therefore skips its own unit-price rules in
  that case, and still **sends the key with `0`** per the decision recorded in the
  handoff — valid either way, keeps one body builder for both seller types, and
  respects the standing "never strip keys" rule. Absent-vs-`0` is moot.
- **Pending vs live content divergence — resolved: no work for us.** When the
  pending-update flag is `true` the product's top-level name reflects the seller's
  submitted value while the per-language translations still reflect the live one,
  so the same form can show two different names. The decision is to **render
  exactly what the backend returns** and take no reconciling action. `/spec`
  states this as deliberate so it is not later mistaken for a defect.
- **Denied products — resolved: NOW IN SCOPE.** `request_status = 2` (denied) is
  currently surfaced nowhere; a denied product renders identically to an approved
  one. The owner has added it to this ticket: **show a banner when
  `request_status = 2`** telling the seller their last edits were denied. This
  requirement originates here, **not** in `handoff-pending-update.md` — for the
  denied banner this intake is the authoritative source.

## Readiness Status

`READY`

- Justification: the request is fully qualified. Both API changes are described
  with their field names, types, trigger conditions, and precedence rules; the
  owner resolved all nine open questions in the source handoff on 2026-07-25,
  including the two decisions that override the previously code-verified contract
  (restrict prices on **create** rather than update, and leave the update path
  unrestricted for every seller). Both backend flags are confirmed available, and
  the four previously-open items are all resolved above. Scope boundaries are
  explicit — the consequence that an unapproved seller's edits route through admin
  approval is backend behaviour and out of our work. Nothing outstanding blocks
  `/research`.

  **Note for `/spec`:** the ticket now covers **three** behaviours, not the two in
  the source handoff — the pending-update banner, the denied banner
  (`request_status = 2`, added by the owner at intake), and the create-path price
  restriction. All three touch the same product-editor surface, which is why they
  stay in one ticket.
