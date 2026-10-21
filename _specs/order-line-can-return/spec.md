---
ticket: order-line-can-return
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Spec — order-line-can-return

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Per-line return decision on the order details page.

## Business Goal

The core backend now decides, for each product of an order, whether the
shopper can still return it, and for how many days (contract:
"Customer API — Can Return per Order Line", backend PR #637). The order details
page must follow that per-line decision. Otherwise:

- a product whose return days have ended still offers "Return This Product";
- the tap creates a draft return request on the backend before the app says
  "return this product is not allowed";
- a product with no category reads "Return This Product In 0 Days".

## User Story

> As a shopper with a delivered order, I want the "Return This Product" option to
> show only on the products I can still return, with the right number of days,
> so that I do not start a return that the store then refuses.

## Functional Requirements

- **FR-1 — Per-line decision.** For a product that is **not** in a return
  request, the return option shows only when the backend marks that product as
  returnable now (`can_return_product: true`). The order-level flag
  `can_return_order` no longer decides it.
- **FR-2 — No fallback.** When the backend sends no `can_return_product` for a
  product, that product gets no return option. The app does not fall back to
  `can_return_order` (owner decision, 2026-10-21).
- **FR-3 — Hide, do not explain.** A product that cannot be returned shows no
  return option. The app adds no "cannot be returned" text (owner decision,
  2026-10-21).
- **FR-4 — Window from the new field.** The sentence "Return This Product In …
  And Back Your Money" reads the product's `return_days_limit` (the full window,
  not the days left). `1` reads "24 Hours"; a larger whole number `n` reads
  "`n` Days". The old field `allow_return_in_days` no longer feeds this sentence.
- **FR-5 — No broken window text.** When `return_days_limit` is not a whole
  number above 0 (`0`, `null`, missing, not a number), the option still shows
  (FR-1 decides that), but without the window sentence. The option never reads
  "0 Days" or "NaN Days".
- **FR-6 — Products already in a return request keep today's rule.** Such a
  product shows "Update Return Request For This Product" while the request can
  still be edited (`edit_return_request: true`), and nothing when it cannot. The
  backend marks these products `can_return_product: false` on purpose (contract
  §1 rule 5), so that flag does not decide them.
- **FR-7 — A locked request still blocks new products.** When the order already
  has a return request that can no longer be edited, a product that is not in it
  shows no return option, even with `can_return_product: true`.
- **FR-8 — Today's basic checks stay.** No return option on an order that is
  not delivered, or on a product whose quantity is 0, whatever
  `can_return_product` says.
- **FR-9 — Starting a return is unchanged.** Tapping the option still creates
  the draft request, checks that the product is in it, opens the return screen,
  and still shows "return this product is not allowed" when the product is
  missing from the request.
- **FR-10 — Documents follow the code.** The return-request feature document and
  the orders-and-returns readiness page describe the new rule and the new field,
  and no longer say the window is read from `allow_return_in_days`.

## Non-Functional Requirements

- **NFR-1** — No new network request. The new fields come in the order answer
  the page already loads.
- **NFR-2** — No new user-visible text. The owner's choices use only the keys
  that exist today ("Return This Product", "Update Return Request For This
  Product", "Return This Product In", "24", "Hours", "Days", "And Back Your
  Money").
- **NFR-3** — Every new or changed test names the case it checks in its failure
  message (CLAUDE.md "Testing — MANDATORY").

## Constraints

- **C-1 — Release order (from OQ-1).** The core backend must serve
  `can_return_product` and `return_days_limit` on staging **before** this change
  reaches staging (`main`) or shoppers. Because of FR-2, the change shipped
  first would remove the return option from every product. The owner confirms
  that backend PR #637 is on staging before the front-end PR is merged; until
  then the PR may wait on `development`.
- **C-2** — Only the order details page changes. The product page keeps reading
  its own return days from the product details API, which this contract does
  not change.
- **C-3** — No protected runtime path changes.

## Edge Cases

- An order delivered 4 days ago with a 3-day product and a 30-day product
  (contract §2 example): `can_return_order` is `true`; only the 30-day product
  shows the option, and it reads "30 Days".
- `can_return_order: false` with `can_return_product: true` on a product (the
  backend disagreeing with itself): FR-1 follows the per-line flag, and FR-9's
  after-tap check stays as the guard.
- `return_days_limit: 1` → "24 Hours".
- `allow_return_in_days: 0` with `return_days_limit: 14` (product with no
  category) → "14 Days".
- `return_days_limit` missing or `0` with `can_return_product: true` → option
  without the window sentence (FR-5).
- A product in a return request while the return details are still loading:
  the page cannot tell yet that the product is in the request, so it reads
  `can_return_product: false` and shows no option. The update option appears
  once the return details arrive (from OQ-4).

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Research could not see the backend repo. The release order is kept by a rule: the owner confirms PR #637 is on staging before the front-end PR is merged. | C-1 |
| OQ-2 | The option still shows, without the window sentence. It never reads "0 Days" or "NaN Days". | FR-5, AC-5 |
| OQ-3 | Yes, the locked-request check stays. The contract does not name a locked request, and dropping the check could add a product to a confirmed request. | FR-7, AC-7 |
| OQ-4 | Yes. Showing no option for a moment is safer than today, where the same moment shows "Return This Product" with the wrong label. | Edge Cases, FR-6 |
| OQ-5 | Yes, the after-tap check stays unchanged. | FR-9, AC-9 |
| OQ-6 | Both the return-request feature document and the orders-and-returns readiness page change (rule text, window source, the L-12 gap, the open question about `allow_return_in_days`). | FR-10, AC-10 |
| OQ-7 | **Deferred to `/plan`.** Whether the field stays in the order-line type is a code-structure choice. The behaviour is fixed by FR-4: the sentence no longer reads it. | Open Questions |

## Open Questions

- **OQ-7** (deferred to `/plan`) — does `allow_return_in_days` stay in the
  order-line type, and how is its comment changed?

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | On a delivered order, a product with quantity above 0, not in a return request, with no locked request and `can_return_product: true`, shows "Return This Product". | FR-1 |
| AC-2  | The same product with `can_return_product: false` shows no return option, even when the order has `can_return_order: true`. | FR-1, FR-3 |
| AC-3  | The same product with no `can_return_product` field shows no return option, even when the order has `can_return_order: true`. | FR-2 |
| AC-4  | The window sentence reads `return_days_limit`: `1` → "24 Hours", `30` → "30 Days"; with `allow_return_in_days: 0` and `return_days_limit: 14` it reads "14 Days". | FR-4 |
| AC-5  | With `can_return_product: true` and `return_days_limit` of `0`, `null` or missing, "Return This Product" shows, no window sentence shows, and no text reads "0 Days" or "NaN Days". | FR-5 |
| AC-6  | A product already in the return request shows "Update Return Request For This Product" when `edit_return_request` is `true` and no return option when it is `false`, while its `can_return_product` is `false`. | FR-6 |
| AC-7  | When the order has a return request with `edit_return_request: false`, a product not in it shows no return option, even with `can_return_product: true`. | FR-7 |
| AC-8  | With `can_return_product: true`, no return option shows on an order that is not delivered, or on a product with quantity 0. | FR-8 |
| AC-9  | Tapping "Return This Product" (shown through `can_return_product: true`) creates the request, opens the return screen when the product is in it, and shows "return this product is not allowed" when it is not. | FR-9 |
| AC-10 | The return-request feature document and the orders-and-returns readiness page state that the option follows `can_return_product` and the window reads `return_days_limit`. | FR-10 |

## Out of Scope

- A "cannot be returned" label or a disabled row (owner chose to hide).
- Counting the days left from the delivery date (owner chose the full window).
- A fallback to `can_return_order` for a missing per-line field (owner chose none).
- An order-level return button — the web app has none, and this ticket adds none.
- The product page's return days (`allow_return_in_days` from the product
  details API).
- The hidden-orders view (`getHiddenOrders` does not carry the new fields, and
  it offers no return option).
- The create-return-request error text — the backend sends it and the app shows
  it as it does today.
- The mobile app.
