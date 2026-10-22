---
ticket: order-line-can-return
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-10-21
links:
  clickup:
  github:
---

# Research — order-line-can-return

> Read-only phase. **No implementation is allowed in this command.**

## Goal

On the order details page, show "Return This Product" only for a line the core
backend marks `can_return_product: true`. Show that line's window from
`return_days_limit`. Keep today's rules for a line that is already in a return
request.

## Relevant directories

- `components/setting/orders/` — the order details page and the per-line
  options sheet. This is where the return row is decided and drawn.
- `utils/types/` — `OrderInterface.ts`, the order and order-line type.
- `tests/components/setting/orders/` — the unit tests of the sheet and the page.
- `tests/fixtures/` — `order.ts`, the shared order and line builders.
- `docs/features/B-cart-checkout-orders/`, `docs/production-readiness/` —
  documents that describe today's return rule.

## Relevant config files

- None. The change touches no config and no protected runtime path
  (`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
  `.github/workflows/**`).

## Facts found (with evidence)

### F-1 — One function decides the return row

`components/setting/orders/OrderItemOptions.tsx:126-142`, `shouldShowRetutn`:

1. Order status is not `delivered` → no row (line 127).
2. Line `qty === 0` → no row (line 128).
3. Line already in the return request (`isProductAlreadyReturned`, lines
   121-125) → row only while `parentOrder.edit_return_request` (lines 131-133).
   The row then reads "Update Return Request For This Product" (lines 324-328).
4. Order has a return request that is locked
   (`order_has_return_request && !edit_return_request`) → no row (lines
   138-140).
5. Otherwise → `parentOrder.can_return_order` (line 141).

Step 5 is the only place in the app that reads `can_return_order`. A search for
`can_return_order` in `components/`, `services/`, `store/`, `utils/`, `app/`
finds only this line and the type (`utils/types/OrderInterface.ts:71`).

### F-2 — The backend change breaks step 5

The saved contract (`docs/api-requirements/customer-orders-can-return-per-line.md`
§2) changes `can_return_order` to `true` when **at least one** line is still in
its days. With step 5 unchanged, an expired line on such an order shows the row.

### F-3 — A wrong row creates a draft return request before it fails

A tap runs `initializeReturn` (`OrderItemOptions.tsx:143-177`):

1. `Order.CreateReturnRequest` → `GET /customer/order/return_requests/store?...&is_draft=1`
   on the core backend (`services/order.ts:741-756`). This creates a draft.
2. `Order.getReturnRequestDetails` reads the draft's lines.
3. If the tapped line is not in it, the shopper sees "return this product is not
   allowed" (lines 164-168).

So the check in step 3 is a safety net that runs only **after** a write.

### F-4 — Lines in a return request have `can_return_product: false`

Contract §1, rule 5: `can_return_product` is `true` only when "the line is not
already in a return request". So F-1 step 3 cannot switch to the new field. It
must keep `edit_return_request`.

`isProductAlreadyReturned` reads `returnDetails`, which comes from a second call
(`Order.GetReturnDetailsForOrderGroup`, `OrderDetailsWrapper.tsx:143-147`). That
call runs only when some pack has a `return_request_id`.

### F-5 — The window text reads the old field

`OrderItemOptions.tsx:70-76`: `Number(orderItem?.allow_return_in_days)`;
`1` → `24 Hours`, anything else → `<n> Days`. The comment says "Display only —
never gates".

- Contract §1: `allow_return_in_days` is `0` for a product with no category.
  So such a line reads "0 Days" today.
- `docs/production-readiness/08-orders-and-returns.md:58` (L-12): when the field
  is missing, the text reads "NaN Days".
- The translation keys `Hours` and `Days` exist in all three files
  (e.g. `public/translations/translations.ar.js:423`, `:771`). No new copy is
  needed for the owner's choices.

### F-6 — The type has no new fields

`utils/types/OrderInterface.ts:80-134` (`details` array). It has
`allow_return_in_days?: number | string` (line 129) with a comment "Display
only — never gates whether return is allowed" (lines 127-128). It has no
`can_return_product` and no `return_days_limit`.

### F-7 — The line reaches the sheet as the API sent it

- `OrderDetailsWrapper.tsx` loads packs with `Order.getOrderDetails`
  (`services/order.ts:411-431`) →
  `GET /customer/order/getOrdersByOrderGroupID` (`server: "market"`, core
  backend). The service returns `response.data` with no mapping.
- The page passes `selectedOrderItem` (a raw line) and `ActivePack` (a raw
  pack) to `OrderItemOptions` (`OrderDetailsWrapper.tsx:559-570`).
- So the new fields arrive with no extra code. Only the type and the gate change.

### F-8 — No other order-line reader of the return fields

`allow_return_in_days` is also read on the **product** page
(`components/products/FreeReturnBadge.tsx:5`,
`components/products/ExpectedDeleiveryModal.tsx:27`,
`components/Cart/AddToCart/PricesRow.tsx:18`,
`components/Server/product/ProductExpectedDeleiveryWrapper.tsx:37`,
`components/Server/product/ProductPrices/ProductPricesWrapper.tsx:104`,
`app/api/mobile/product/details/[slug]/route.ts:195`). Those read the product
details API, which the contract does not change. The orders list
(`OrdersListWrapper.tsx`, `OrderItem.tsx`) shows no return row.

### F-9 — The web app has no order-level return button

Contract §2 says "show the return button of the order when `can_return_order`
is `true`". No such button exists; returns start per line only (F-1).

### F-10 — Tests that cover the gate today

`tests/components/setting/orders/OrderItemOptions.test.tsx`:

| Line | Case | Uses |
|---|---|---|
| 163 | delivered, returnable line → return row with "24 Hours" | `can_return_order: true`, fixture `allow_return_in_days: 1` |
| 171 | longer window → "7 Days" | `can_return_order: true`, `allow_return_in_days: 7` |
| 181 | `qty 0` → no return | `can_return_order: true` |
| 186 | locked request → no new product | `can_return_order: true` |
| 195 | already-returned line → update row only while editable | `edit_return_request` |
| 259, 282, 295 | starting a return (three cases) | `can_return_order: true` to show the row |

The fixture `tests/fixtures/order.ts` builds a line with
`allow_return_in_days: 1` (line 62) and an order with `can_return_order: false`.
With "no fallback" (intake), every case that shows the row through
`can_return_order` must set `can_return_product` instead. No browser test opens
the return row (`tests/e2e` has no "Return This Product").

### F-11 — Documents that state the old rule

- `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md` —
  "How it works": visibility from `can_return_order`; window from
  `allow_return_in_days`, "display only".
- `docs/production-readiness/08-orders-and-returns.md` — W-22 (line 37, "only
  when `can_return_order`"), L-12 (line 58, the `NaN Days` gap), and the open
  question on line 85.

## Possibly affected services

- **Core backend** (`server: "market"`) — the source of the new fields. No
  request changes; the app only reads more of the same answer.
- **Return-request flow** (CO-26 / CO-28) — fewer wrong taps reach
  `CreateReturnRequest`. Confirm, cancel and update flows read
  `edit_return_request` / `order_has_return_request` and do not change.

## Test / validation commands available

- `pnpm test:run` — the unit suite (Vitest). Not run here.
- `node_modules/.bin/tsc --noEmit --pretty false` — typecheck.
- `pnpm lint` — ESLint, including the i18n rules.
- `pnpm lint:i18n-parity` — translation keys in step.
- Validation profiles in `.claude/project-config.yaml`: `ui-change`,
  `logic-change` (lint + typecheck + unit tests), `full`.

## Test layout and naming convention

- Unit tests live under `tests/`, with the **same path as the source file**:
  `components/setting/orders/OrderItemOptions.tsx` →
  `tests/components/setting/orders/OrderItemOptions.test.tsx`.
- File name: `<SourceName>.test.tsx` (or `.test.ts`).
- Runner: Vitest. Rendering through `tests/render` (`renderWithProviders`).
  Shared builders in `tests/fixtures/` (`buildOrder`, `buildOrderLine`).
- Expected-failure marker: `it.fails("BUG-<id>: …")` (for example
  `tests/components/Orders/ChangeAddressWidget.test.tsx:189`).
- Every assertion carries a message (CLAUDE.md "Testing — MANDATORY").

## Risks and unknowns

- **Release order (high impact).** With "no fallback", a front-end release
  before backend PR #637 reaches staging hides the return row on every line.
  The backend repo is not on this machine and not on the GitHub account, so
  research could not check it. → OQ-1.
- **Return details not loaded (low).** If `returnDetails` is not loaded yet, a
  line that is in a request looks "not in a request" (F-4). Today it then
  shows "Return This Product" through `can_return_order`. After the change it
  reads `can_return_product: false` and shows no row until the details load.
  → OQ-4.
- **Bad `return_days_limit` (low).** The contract says it is an integer, but a
  `0`, `null` or missing value would read "0 Days" / "NaN Days". → OQ-2.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Is backend PR #637 on staging, and how is the release order kept so the front end does not ship first? | With "no fallback", shipping first hides every return row. |
| OQ-2 | What does the row show when `return_days_limit` is `0`, `null` or missing while `can_return_product` is `true`? | Today the same gap reads "NaN Days" (L-12). |
| OQ-3 | Does the locked-request check (`OrderItemOptions.tsx:138-140`) stay next to `can_return_product`? | The contract's six rules do not name a locked request; removing the check could let a line be added to a confirmed request. |
| OQ-4 | Is it acceptable that a line in a request shows no row until `returnDetails` loads? | Behaviour changes for a short moment, or when the second call fails. |
| OQ-5 | Does the after-write safety net ("return this product is not allowed", F-3) stay? | It is the only guard if the backend and the field disagree. |
| OQ-6 | Which documents change with the code: CO-26, production-readiness 08 (W-22, L-12, line 85)? | They state the old rule (F-11). |
| OQ-7 | Does `allow_return_in_days` stay in the order-line type? | The contract keeps the field for old apps; the web app would stop reading it. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
