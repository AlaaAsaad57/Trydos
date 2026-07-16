# CO-28 — Manage a Return

| | |
|---|---|
| **Feature ID** | CO-28 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟡 Partial — track / confirm / cancel work, but the tracking UI shows hardcoded fake timers and a fixed "3 USD" refund figure |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Orders/OrderRetailsReturnInfo.tsx`, `components/setting/orders/OrderDetailsWrapper.tsx`, `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx`, `services/order.ts` |

---

## What it is

The **after-submission side of returns** — where a shopper **confirms** a drafted return, **tracks**
its progress through a status timeline, and **cancels** a returned item or the whole request.

## Where it appears

On the order detail screen (`/{lang}/settings/orders/[id]`): a per-product **return status timeline**
appears automatically once an item has a return, and **Confirm / Cancel** controls sit in the
expanded order details.

## Who uses it

Any shopper who has started a return (CO-26) and wants to finalise, follow, or withdraw it.

## How it works (verified behaviour)

- **Confirm a drafted return.** A return is created as a **draft**; a **"Confirm Return Request"**
  button finalises the items that are still pending. Confirmation is also offered at submit time
  ("I Agree & Return").
- **Status timeline.** The return moves through a hardcoded set of states — `pending`, `approved`,
  `out_for_return`, `returned_to_location`, `resolved`, plus terminal `cancelled` / `rejected`. The
  first five render as a **step flow**; `cancelled` / `rejected` / `resolved` short-circuit to a
  single banner. The current step is matched from the item's `return_status.value`.
- **Cancel — two levels.** Cancel a **single returned product**, or **bulk-cancel the whole request**.
  Both are gated on the backend `edit_return_request` flag and refresh the order afterwards.
- **Track with the courier.** When a return is `out_for_return`, a delivery-chat icon opens so the
  shopper can message the return courier (see CO-24).
- **Data loads per order group** when any pack carries a `return_request_id`; there is no return
  store slice — it's held in local component state and re-fetched after each action.

## Data source

| Item | Value |
|------|-------|
| Load return details (group) | `GET /customer/order/return_requests/order_details_by_group?order_group_id=…` |
| Confirm request | `POST /customer/order/return_requests/confirm_return_request` — `{ return_request_ids:[…] }` |
| Bulk-cancel request | `POST /customer/order/return_requests/bulk_cancel` — `{ return_request_ids:[…] }` |
| Cancel single product | `GET /customer/order/return_request_products/cancel?return_request_product_id=…` |
| Backend | **Legacy backend** (none of the `return_requests/*` paths are on the Go allow-list) |

## Technical reference

| Item | Value |
|------|-------|
| Status timeline | `components/Orders/OrderRetailsReturnInfo.tsx` (hardcoded status array; per-product cancel) |
| Confirm / bulk-cancel | `OrderDetailsWrapper.tsx` — `OrderExpandedDetails` (`ConfirmReturnRequest`, `CancelReturnRequest`, gates `shouldShowConfirmReturn` / `shouldShowCancelReturn`) |
| Confirm-on-submit | `confirmations/OrderItemReturnConfirmationWindow.tsx` |
| Services | `services/order.ts` — `GetReturnDetailsForOrderGroup`, `ConfirmReturnRequest`, `bulkCancelReturn`, `CancelReturnProduct` |
| Request codes | `utils/Requests.ts` — `DETAILS_RETURN_PRODUCT` (134), `CONFIRM_RETURN_PRODUCT` (133), `CANCEL_RETURN_REQ` (135), `CANCEL_RETURN_PRODUCT` (129) |
| Analytics | `order_return_requested` (on submit) |

## Current status & maturity

**Partial.** The real management actions — confirm, track through the status steps, cancel a product
or the whole request — are all wired to live backend endpoints and work. But the tracking UI is
padded with **hardcoded placeholder values** that misrepresent the return to the shopper.

## Known gaps / notes

- ⚠️ **Hardcoded placeholders in the tracking timeline.** Every step prints a literal **"3 H"**, the
  active countdown is a fixed `minutes = 60 × 3`, and the cancel screen shows a flat **"3 USD"**
  refund incentive **regardless of the actual refund amount or the shopper's currency**. These are
  static strings, not real data — they should be wired to real values or removed. *(needs decision)* (NTF)



## Related features

CO-26 (Create a return request — produces the draft this manages) · CO-27 (Upload return photos) ·
CO-24 (Order chat — used to track with the return courier) · CO-16 (Order details & tracking — hosts
this) · CO-17 / CO-18 (Cancel order / item — the pre-delivery counterparts).
