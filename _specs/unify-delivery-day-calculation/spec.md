---
ticket: unify-delivery-day-calculation
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Spec — unify-delivery-day-calculation

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**
>
> **Revision 2** — re-authored after four review rounds. `AC-11` (no delivery figure may be
> painted and later corrected) has been **removed**, along with the clause in `NFR-2` that
> introduced it. Both were added during the original specification rather than requested at
> intake, and every defect found across four rounds arose from the machinery built to satisfy
> them, not from the reported problem. Remaining criteria keep their original IDs; the gap at
> `AC-11` is deliberate, marking the removal rather than hiding it.

## Feature Name

Unified expected-delivery-day calculation

## Business Goal

A shopper decides whether to buy partly on when the item will arrive. Today the delivery
estimate shown is too short on several screens, and differs between screens for the same
product — and, for every signed-in shopper, omits the platform's shipping duration entirely.
That understates delivery time, sets an expectation the fulfilment chain cannot meet, and
produces avoidable "where is my order" contacts and returns. A single, correct, consistent
estimate everywhere protects trust at the moment of purchase.

## User Story

> As a shopper, I want every delivery date and day count in the app to reflect both the
> product's shipping time and the platform's shipping duration, so that the delivery
> estimate I see is the one I actually get — and is the same figure on every screen.

## Functional Requirements

- **FR-1 — Both values always count.** Every delivery day count and expected delivery date
  shown to a shopper equals the product's `shipping_days` plus the platform's
  `shipping_duration_days`. Neither value may be silently omitted.
- **FR-2 — Consistency across surfaces.** For the same product in the same session, the
  product page, the product-page footer, the add-to-cart sheet (including its footer) and
  the cart all show the same day count and the same resulting date.
- **FR-3 — Correct for every shopper.** The estimate is correct regardless of which backend
  served the platform settings for that request — a signed-in shopper and a guest viewing
  the same product see the same figure. No audience may be left with the platform value
  omitted, and no audience that is correct today may regress.
- **FR-4 — Cart-level estimate keeps the multi-seller rule.** Where a single expected
  delivery is shown for a cart holding items from multiple sellers, it uses the longest
  product shipping time across the items and adds the platform shipping duration once — not
  a per-item sum.
- **FR-5 — Per-item cart figures are shown.** A cart line item's delivery figure is
  displayed whenever a delivery time exists for it, and reflects FR-1. It must never render
  as a non-numeric or nonsensical value.
- **FR-6 — Graceful degradation.** When one of the two values is absent or zero, the
  estimate is based on the value that is present. When no delivery time can be determined,
  no misleading date or day count is shown.

## Non-Functional Requirements

- **NFR-1 — Correctness is observable.** A missing platform value must not degrade silently
  into a plausible-looking shorter estimate that goes unnoticed; the signed-in-versus-guest
  comparison is the standing detector for this class of regression.
- **NFR-2 — No user-visible regression in load or interaction behaviour** on the affected
  surfaces.
- **NFR-3 — Localisation completeness.** Any new or reworded user-visible copy exists in all
  supported languages before it is used; no hardcoded user-visible string is introduced.
- **NFR-4 — Type and lint safety.** The change passes the repository's type-check, lint and
  production-build validation without new errors or suppressions.

## Constraints

- The core backend's starting-settings response shape is the accepted contract. The gateway
  aligning to it is a separate backend deliverable, outside this repository, and this ticket
  must not assume it has already shipped.
- The repository has **no automated test suite** by standing policy; no test files are to be
  added. Validation is the configured local validation profile plus manual verification.
- Changes to protected runtime paths are permitted only when explicitly approved at the
  review gate; this work is expected to touch at least one.
- Existing correct behaviour — notably the cart's multi-seller rule — must be preserved
  rather than re-derived.
- The four surfaces named at intake define the scope boundary; other screens showing
  delivery estimates are out of scope.
- **Transient behaviour during application start-up is explicitly not constrained by this
  specification.** What a surface shows in the moments before the platform settings have
  loaded, or if they fail to load, is out of scope — see Out of Scope.

## Edge Cases

- Product shipping time is absent or zero; platform shipping duration is absent or zero;
  both are absent or zero.
- A shopper signed in versus browsing as a guest, for the same product.
- A cart containing items from several sellers with differing shipping times.
- A cart line whose product has no delivery time while other lines do.
- The shopper changes country or language, changing or invalidating the platform value
  mid-session.
- A value arriving as a string rather than a number, or otherwise not directly summable.

## Open Questions

- None. The contract-shape decision, the scope boundary and the treatment of transient
  start-up behaviour are all settled.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.
> `AC-11` was removed in revision 2; the gap is intentional and IDs are not renumbered.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | On the product page, the delivery day count and date equal product shipping days + platform shipping duration. | FR-1 |
| AC-2  | On the product-page footer, the delivery figure equals product shipping days + platform shipping duration. | FR-1 |
| AC-3  | In the add-to-cart sheet, including its footer, the delivery figure equals product shipping days + platform shipping duration. | FR-1 |
| AC-4  | In the cart, each line item's delivery figure equals that product's shipping days + platform shipping duration. | FR-1, FR-5 |
| AC-5  | For one product in one session, the figures shown by AC-1 through AC-4 are identical. | FR-2 |
| AC-6  | A signed-in shopper and a guest viewing the same product see the same delivery figure, and neither has the platform shipping duration omitted. | FR-3, NFR-1 |
| AC-7  | The cart-level expected delivery for a multi-seller cart equals the longest product shipping time among its items plus the platform shipping duration added exactly once. | FR-4 |
| AC-8  | A cart line item's delivery figure is displayed whenever a delivery time exists for it, and never renders as a non-numeric or nonsensical value. | FR-5 |
| AC-9  | When the platform shipping duration is absent or zero, the estimate equals the product shipping days alone; when the product shipping days are absent or zero, it equals the platform shipping duration alone. | FR-6 |
| AC-10 | When no delivery time can be determined, no misleading date or day count is shown. | FR-6 |
| AC-12 | Any new or reworded user-visible copy is present in all supported languages, and no hardcoded user-visible string is introduced. | NFR-3 |
| AC-13 | The repository's configured type-check, lint and production-build validation pass with no new errors or suppressions. | NFR-4 |

All criteria are evaluated **once the platform settings have loaded**, which is the steady
state for every surface in normal use.

## Out of Scope

- **Transient start-up behaviour.** Whether a surface briefly shows an incomplete figure, or
  shows nothing, before the platform settings have loaded — or if they never load — is not
  constrained here. The reported defect is that the platform duration is omitted from the
  settled estimate, not that the estimate is momentarily incomplete while the application
  boots. Handling the transient window is a separate concern and warrants its own ticket if
  it proves to matter in practice.
- Order-history and order-details delivery estimates. They carry the same defect but were not
  named at intake; they warrant a separate ticket. They read the same settings value, so
  their estimates will change as a side effect — they are not edited.
- The checkout decimal-point setting, which is affected by the same backend contract
  divergence but is unrelated to delivery timing.
- The gateway-side backend change to align with the accepted response shape — a separate
  deliverable outside this repository.
- Any change to how `shipping_days` or `shipping_duration_days` are produced, stored or
  administered on the backend.
- Business-day, holiday or cut-off-time handling for delivery dates; the estimate remains a
  simple day offset as today.
- Adding an automated test suite, which repository policy excludes.
