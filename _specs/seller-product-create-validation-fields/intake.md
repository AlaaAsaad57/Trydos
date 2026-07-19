---
ticket: seller-product-create-validation-fields
stage: intake
mode: standard
status: in_progress
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Intake — seller-product-create-validation-fields

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

seller-product-create-validation-fields — no ClickUp task / GitHub issue yet.

## Ticket Summary

Submitting a fully filled seller product-create form is rejected by the backend
with three validation errors: `default_language_code` is required, `brand_id` is
required, and `multiplyQTY` must be true or false. A seller therefore cannot
create a product at all. The captured request payload is in
`components/SellerDashboard/productEdit/add-product-payload.txt`.

## Ticket Metadata

- id / slug: seller-product-create-validation-fields
- title: Fix seller product create validation fields
- owner: developer
- created: 2026-07-18
- links: none

## User Story

> As a seller, I want to submit the product-create form and have it accepted, so
> that I can list a product instead of being blocked by backend validation errors.

## Acceptance Criteria Presence Check

- Present? no
- Notes: The three failing fields and the two directional decisions below are
  known, but they are not yet written as testable acceptance criteria. `/spec`
  will define them with stable `AC-n` ids.

## Test Cases Presence Check

- Present? no
- Notes: The repo has no test suite by policy (CLAUDE.md). Verification will be
  a manual submit of the create form plus inspection of the outgoing payload,
  defined at `/spec` and executed at `/verify`.

## Decisions Already Taken

Recorded here because they were made by the owner before intake, and they bound
the request:

1. `default_language_code` is **derived as `en`** — it is not a user-facing
   selector, so no new UI and no new translated strings.
2. `brand_id` is **validated client-side like the other required fields**, so an
   unselected brand is caught before submit rather than by the backend.

## Missing Information

All items raised at intake have been resolved by the owner (2026-07-18):

1. `multiplyQTY` accepts `true` / `false` values — resolved. The
   conditional-omit behaviour (send `"on"` when enabled, drop the key when
   disabled) is therefore no longer correct for either path.
2. `packed_after_ordering` accepts `true` / `false` the same way — resolved. It
   is in scope alongside `multiplyQTY`, not a follow-up.
3. Scope covers **both create and update**, since both share the one payload
   builder — resolved.

No open questions remain.

The separately requested debug helper (fill the product form from a saved JSON
payload, to avoid re-filling the form by hand) is **not** part of this ticket and
should be tracked on its own.

## Readiness Status

`READY`

- Justification: the request is qualified, the two directional decisions
  (`default_language_code` derived as `en`; `brand_id` validated client-side) are
  settled, and all three open items are now resolved by the owner. The failing
  behaviour is reproducible and the captured payload is available as evidence.
  Nothing blocks read-only investigation at `/research`.
