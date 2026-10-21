# CO-26 — Create a Return Request

| | |
|---|---|
| **Feature ID** | CO-26 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-10-21 (against `development`) |
| **Source of truth** | `components/setting/orders/ReturnOrderItemWrapper.tsx`, `components/setting/orders/OrderItemOptions.tsx`, `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx`, `services/order.ts` |

---

## What it is

The flow that lets a shopper **start a return on a delivered item** — pick a reason, choose how many
units to send back, attach photos, and see a **live refund preview** before submitting. It is a
distinct flow from cancelling an item (CO-18): returns only apply **after** delivery.

## Where it appears

On an order's detail screen (`/{lang}/settings/orders/[id]`), from the **per-item options
bottom-sheet** — the **"Return This Product"** row. Selecting it opens the return form in place.

## Who uses it

Any shopper who has received an order and wants to send an item back.

## How it works (verified behaviour)

- **Only on delivered items.** The "Return This Product" option only shows when the item's
  `order_status.value === "delivered"` and the remaining quantity is above zero. One return
  request is assumed **per order**.
- **The backend decides per line.** For a product that is not yet in the return request, the
  option shows only when the line's **`can_return_product`** is `true`. Each line has its own
  return days, so one product of an order can still be returnable while another is not. A line
  without the field gets no option — the app does **not** fall back to the order's
  `can_return_order` (that flag only says that at least one line can still be returned). Contract:
  [`docs/api-requirements/customer-orders-can-return-per-line.md`](../../api-requirements/customer-orders-can-return-per-line.md).
- **Products already in the request** show *"Update Return Request For This Product"* while
  `edit_return_request` is `true`. The backend sends `can_return_product: false` for them on
  purpose, so that flag does not decide them. When the request exists and is locked
  (`order_has_return_request` with `edit_return_request: false`), no other product can be added.
- **Return window is backend-driven.** The row's *"Return This Product In …"* line reads the line's
  **`return_days_limit`** (`OrderInterface["details"][n]`): `1` renders **"24 Hours"**, anything
  greater renders **"`<n>` Days"**. It shows the full window, not the days left. When the value is
  not a whole number above 0, the line is hidden (the option still shows). It is **display only**.
  The old field `allow_return_in_days` (which is `0` for a product with no category) is no longer
  read here.
- **The backend must also check on create.** Hiding the option is for the shopper's view only. The
  core backend applies the same per-line rule when the return request is created.
- **Reasons come from the backend** (not hardcoded) — the form fetches the return-reason list and
  renders each. Some reasons carry a **deduction cost** (when `is_cost_by_system === 0`): that cost
  is shown next to the reason and **subtracted from the refund preview**; reasons whose cost would
  exceed the item price are shown **disabled**.
- **Quantity picker.** A +/− stepper chooses how many units to return, clamped between **1 and the
  ordered quantity**.
- **Live refund preview.** The screen computes `(unit price × quantity returned) − reason cost` and
  shows it in the shopper's currency.
- **Photos required.** The **Submit** button stays disabled until a reason is selected **and at least
  one image** is attached (photo upload is CO-27).
- **Submit → confirmation.** Submitting opens a confirmation window ("I Agree & Return"); on confirm
  the item is added to (or updated in) the return request. A **`order_return_requested`** analytics
  event fires on submit.
- **Draft-first model.** Opening the flow silently creates a **draft** return request, then the item
  is attached to it; a separate "Confirm Return Request" step (CO-28) finalises it.

## Data source

| Item | Value |
|------|-------|
| Return reasons | `GET /customer/order/return_requests/reasons` (`order.getReturnReasons`) |
| Create draft request | `GET /customer/order/return_requests/store?order_id=…&is_for_exchange=0&is_draft=1` |
| Add product to request | `POST /customer/order/return_request_products/store` — `{ product_id, order_detail_id, quantity, return_request_id, images, return_request_reason_id, is_for_exchange:0, details:"" }` |
| Update product on request | `POST /customer/order/return_request_products/update` — `{ id, quantity, images, return_request_reason_id }` |
| Request detail check | `GET /customer/order/return_requests/order_details?return_request_id=…` |
| Backend | **Core backend** — none of the `return_requests/*` paths are on the gateway allow-list |

## Technical reference

| Item | Value |
|------|-------|
| Menu row + gate | `components/setting/orders/OrderItemOptions.tsx` (`shouldShowRetutn`, `initializeReturn`) |
| Return form | `components/setting/orders/ReturnOrderItemWrapper.tsx` (reasons, qty stepper, refund preview) |
| Confirmation window | `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx` |
| Services | `services/order.ts` — `getReturnReasons`, `CreateReturnRequest`, `AddReturnRequestProduct`, `UpdateReturnRequestProduct`, `getReturnRequestDetails` |
| Request codes | `utils/Requests.ts` — `CREAT_RETURN_REQ` (131), `RETURN_PRODUCT` (128), `RETURN_REASONS` (127), `DETAILS_RETURN_PRODUCT` (134) |
| State | Local React state (no dedicated store slice) |
| Analytics | `order_return_requested` (`utils/orderFunnel.ts`) |

## Current status & maturity

**Live.** The core promise — choose a reason and quantity, preview the refund, and submit a return
on a delivered item — is fully backend-driven and functional. Reasons, costs and the refund figure
all come from the server.

## Known gaps / notes

- **Window copy is backend-driven (resolved).** The *"Return This Product In …"* line reads the
  line's **`return_days_limit`** — `1` → "24 Hours", `>1` → "`<n>` Days", hidden otherwise (never
  "0 Days" or "NaN Days"). It is presentation only and is **not** a client-side time check;
  eligibility is the line's `can_return_product`.
- **"Learn More Tips." link is inert** — no click handler. *(tracked in the README known-issues
  list.)*


## Related features

CO-27 (Upload return photos — the required image step) · CO-28 (Manage a return — confirm / track /
cancel the request) · CO-18 (Cancel a single item — the pre-delivery counterpart) · CO-16 (Order
details & tracking — hosts the return entry point) · CO-21 (Report an order item — a separate
problem-flagging flow).
