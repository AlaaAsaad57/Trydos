---
ticket: seller-product-approval-gating
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-25
links:
  clickup:
  github:
---

# Spec — seller-product-approval-gating

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Seller product approval gating — approval banners and create-path price restriction

## Business Goal

A seller currently cannot tell the difference between an edit that is live, an
edit that is waiting for an admin, and an edit that was rejected — all three
render identically. Sellers therefore resubmit changes they already submitted,
and assume rejected changes took effect. Separately, a seller who is not yet
approved to set retail prices is today invited to fill in prices the backend will
not accept, producing silent failure at the worst possible moment. Making both
states visible removes a class of support requests and stops sellers acting on a
false picture of their own catalogue.

## User Story

> As a **seller whose product edits require admin approval**, I want the product
> form to tell me that my submitted changes are still awaiting review, so that I
> understand why the values I see are not yet live and do not resubmit them
> thinking the save failed.

> As a **seller whose edits were rejected**, I want the product form to tell me
> they were denied, so that I know the live product still holds the old values and
> can decide what to change.

> As a **seller who is not yet approved to set retail prices**, I want the
> create-product form to offer only the price I am allowed to set, so that I can
> add products without submitting prices that will be ignored.

## Functional Requirements

- **REQ-1 — Pending-update banner.** When the product edit data reports that the
  product has a submitted update awaiting admin approval, the edit screen
  displays a persistent warning stating that the form shows the seller's
  submitted changes and that the live product keeps its previous values until
  approval.
- **REQ-2 — Single trigger.** The pending-update warning is shown **if and only
  if** the dedicated `is_product_updated_and_need_approval` boolean is `true`. It
  is never inferred from the approval status, the active/inactive status, or any
  other field.
- **REQ-3 — Precedence over approval status.** While that boolean is `true`, the
  existing first-approval indicator is not shown. While it is `false`, the
  approval status governs the screen exactly as it does today.
- **REQ-4 — Denied banner.** When the product's approval status is *denied*, the
  edit screen displays a banner telling the seller their last edits were denied.
- **REQ-5 — Create-path price restriction.** When the seller is not approved for
  new products (`is_new_products_approval` falsy) **and** the screen is creating a
  product, Purchase Price is the only price the seller may enter. Every other
  price input is present but not editable: product-level unit price, discount
  price and luck price; shipping cost; every variant's price, discount and luck;
  and per-country extra price.
- **REQ-6 — No unfillable rows.** In that same state, the controls that add or
  remove a per-country price row are not offered at all, so the seller cannot
  create a row they are unable to complete.
- **REQ-7 — Matching validation.** In that same state, the restricted price
  fields are not validated. A seller can complete and submit product creation
  having entered only Purchase Price, with no validation error raised against any
  restricted price.
- **REQ-8 — Update path unaffected.** When editing an existing product, every
  price input behaves exactly as it does today, for every seller, regardless of
  approval standing.
- **REQ-9 — Unknown approval standing fails closed.** When creating a product and
  the seller's approval standing cannot be determined, the screen fails in the
  same way it already fails when the product data itself cannot be loaded, rather
  than guessing at an approval state.
- **REQ-10 — Translated copy.** All new user-visible text is available in all four
  supported languages.

## Non-Functional Requirements

- No additional network round-trip is introduced: the seller's approval standing
  arrives on a response the dashboard already requests.
- Both banners are readable and correctly laid out at the project's mobile
  breakpoints, and neither obscures nor displaces the form controls beneath it.
- No regression for an approved seller: create and edit behave exactly as they do
  today when the seller is approved and no update is pending.
- The restriction is a usability affordance, not a security control. The backend
  remains the authority on which prices it accepts; the screen must not be relied
  on to enforce the rule.
- Both banners are distinguishable at a glance from a success message and from a
  hard error.

## Constraints

- The two flags are read-only inputs. This ticket defines how the screen reacts
  to them and does not change, add, or remove any API endpoint.
- New user-visible strings must exist in every translation file before being
  used; the English string is itself the key.
- Nothing user-visible — including copy, identifiers, and error text — may name
  the technology behind either backend.
- The behaviour specified here **supersedes the previously code-verified API
  contract**, which documents the opposite split (restriction on update rather
  than create). Those code-verified artifacts must not be rewritten from this
  ticket; they are re-verified against backend source separately.
- A seller in the restricted state must be able to complete product creation
  successfully — the restriction may not produce a submission the backend rejects.

## Edge Cases

- **Pending and denied at once.** The pending-update flag is documented to require
  an already-approved product, so the two states are treated as mutually
  exclusive. If both are ever reported together, the pending-update banner takes
  precedence and the denied banner is suppressed.
- **Pending values disagree with per-language values.** While an update is
  pending, the product's main name reflects the seller's submitted value while the
  per-language entries still reflect the live one, so the same screen can show two
  different names. This is rendered exactly as the backend reports it; no
  reconciliation is performed. Deliberate, not a defect.
- **Approval standing still being determined on create.** Distinct from REQ-9's
  failure case: the screen must not momentarily present the unrestricted form and
  then withdraw price fields once the standing arrives.
- **Seller switches shop.** An approval standing belonging to a different shop is
  never applied to the current one.
- **Variants exist while product-level prices are restricted.** Restricting
  product-level prices must not corrupt or silently populate variant prices.
- **Per-country rows already present on a restricted create.** Their inputs are
  not editable and the add/remove controls are absent.
- **Approved seller, no pending update, not denied.** Nothing about the screen
  changes in any respect.

## Open Questions

Neither blocks planning; both are UX choices the plan may settle.

- Is the denied banner dismissible, and does it persist after the seller begins a
  fresh edit? The pending-update banner is specified as persistent; the denied
  banner has no equivalent guidance because it did not originate in the backend
  handoff.
- What exactly does the create screen present while the seller's approval standing
  is still being determined?

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | On the edit screen, when `is_product_updated_and_need_approval` is `true`, a persistent warning is displayed. | REQ-1 |
| AC-2  | That warning states both that the form shows the seller's submitted changes and that the live product keeps its previous values until approval. | REQ-1 |
| AC-3  | The warning appears only when that boolean is `true`; when it is `false` no warning appears, whatever the approval or active status. | REQ-2 |
| AC-4  | While that boolean is `true`, the existing first-approval indicator is not displayed. | REQ-3 |
| AC-5  | While that boolean is `false`, the approval-status indicator behaves exactly as before this ticket. | REQ-3 |
| AC-6  | When the product's approval status is *denied*, a banner is displayed telling the seller their last edits were denied. | REQ-4 |
| AC-7  | Creating a product as a seller who is not approved for new products: Purchase Price is editable, while unit price, discount price, luck price and shipping cost are not. | REQ-5 |
| AC-8  | In that same state, every variant's price, discount and luck are not editable. | REQ-5 |
| AC-9  | In that same state, per-country extra price is not editable and no control is offered to add or remove a per-country row. | REQ-5, REQ-6 |
| AC-10 | In that same state, the product can be created having entered only Purchase Price, and no validation error is raised against any restricted price. | REQ-7 |
| AC-11 | Creating a product as an approved seller: every price input is editable, exactly as before this ticket. | REQ-5, REQ-8 |
| AC-12 | Editing an existing product: every price input is editable, for both approved and unapproved sellers. | REQ-8 |
| AC-13 | Creating a product when the seller's approval standing cannot be determined: the screen fails the same way it fails when product data cannot be loaded. | REQ-9 |
| AC-14 | Every string introduced by this ticket renders in the seller's language across all four supported languages. | REQ-10 |
| AC-15 | An approved seller with no pending update and no denial sees no banner and no behavioural change anywhere in the editor. | REQ-3, REQ-8 |

## Out of Scope

- The backend consequence that an unapproved seller's edits route through the
  admin approval queue — backend behaviour, no frontend work.
- Re-verifying and correcting the code-verified API contract artifacts against the
  new backend source; that is a separate follow-up once the backend ships.
- Confirming whether the update-path change closes the existing "seller edits a
  price, sees *saved*, nothing changed" defect.
- Surfacing approval state anywhere outside the product editor, such as the
  product list or dashboard summary.
- Reconciling the pending-versus-live content divergence described in Edge Cases.
- Any change to how prices are handled on the update path.
- Any per-variant purchase price, which the product model does not carry.

---

## Amendment A1 — edit path also blocks on unresolved shop info (2026-07-27)

> **Post-closure amendment.** The ticket is `closed` and terminal; nothing above
> this line is rewritten. This section records a behaviour change made after
> closure, by owner decision on 2026-07-27, and states which criteria above it
> supersedes. It does **not** reopen the ticket or add a state transition.

### What changed and why

As specified and verified, the shop-info gates were create-only: on the edit
path a failed or forbidden shop-info read was silent — the editor rendered in
full, the seller was told nothing, and the only effect was a missing currency
label. The owner judged that dishonest: prices are the substance of the editor
and are meaningless without the shop's currency, so a seller editing against an
unresolved shop is worse off than one who is told why they cannot proceed.

### Amended requirements

- **REQ-11 — Editor blocks on an unresolved shop, on both paths.** When the
  seller's shop details cannot be resolved, the product editor does not render
  its form on **either** path. It states the cause instead. This replaces the
  create-only scope of REQ-9.
- **REQ-12 — The two causes stay distinguishable.** A missing shop-info
  permission reads as a permission problem and offers **no** retry, because the
  request can never succeed. A failed read reads as a load failure and offers a
  retry. Copy names the path the seller is on (adding vs opening a product).
- **REQ-13 — Approval restriction stays create-only.** The new-products approval
  price restriction is unchanged and continues to apply on create only; it has no
  meaning for a product that already exists. REQ-5..REQ-8 stand as written.

### Amended acceptance criteria

| ID    | Acceptance criterion | Maps to | Supersedes |
|-------|----------------------|---------|------------|
| AC-16 | Opening an existing product while the shop-info permission is missing: no shop-info request is made, the form does not render, and the screen states that the permission is needed and to ask a shop admin. No retry is offered. | REQ-11, REQ-12 | — |
| AC-17 | Opening an existing product after a failed shop-info read: the form does not render, the screen states the shop details could not be loaded, and a retry is offered that re-issues the request once. | REQ-11, REQ-12 | — |
| AC-18 | While the shop is still resolving, the edit screen shows its loading state and never renders a form that is subsequently withdrawn. | REQ-11 | — |
| AC-12′ | Editing an existing product: once the editor renders, every price input is editable for every seller, approved or not. | REQ-8, REQ-13 | AC-12 (narrowed: now conditional on the editor rendering at all) |
| AC-13′ | The undeterminable-standing failure applies on **both** paths, not create only. | REQ-11 | AC-13 (widened from create-only) |

### Known consequence, accepted by the owner

A seller holding `UPDATE_PRODUCT` but not `READ_SHOP_INFO` can no longer open the
product editor at all. This is a wider block than the failure strictly requires
and was flagged before the change was made; the owner accepted it in exchange for
never letting a seller edit prices against an unknown shop. Whether those two
permissions are granted together in practice is worth confirming operationally.
