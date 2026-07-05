# CO-17 — Cancel Whole Order

| | |
|---|---|
| **Feature ID** | CO-17 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟡 Partial -- the cancel reason now not sent to the backend (UI only) |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderOptionsMenu.tsx`, `components/setting/orders/CancelOrderWrapper.tsx`, `components/setting/orders/confirmations/OrderCancelConfirmationWindow.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **cancel an entire order pack** before it ships — they pick a reason, tick an
agreement, and confirm.

## Where it appears

On the order detail page (CO-16), from the **order options menu** (opened via the top-bar options
button) — the **"Cancel This Pack"** row.

## Who uses it

Any shopper with an order the backend still marks as cancellable.

## How it works (verified behaviour)

- **Eligibility is backend-driven.** The "Cancel This Pack" row only appears when the order's
  `can_cancele_order` flag is true — there is no client-side "before shipping" check; the flag is the
  gate.
- **A reason is required to proceed.** Reasons are a **hardcoded list** (translated client-side);
  until one is selected the confirm button is disabled and shows an error.
- **Confirm step.** A confirmation window requires ticking an **agreement checkbox** before the
  cancel is sent.
- **On confirm** the order is cancelled and the screen refreshes; an `ORDER_CANCELLED` analytics
  event fires (carrying the reason).

## Data source

| Item | Value |
|------|-------|
| Cancel order | `POST /customer/order/cancel` — body `{ order_id }` (`Order.CancelOrder`) |
| Eligibility flag | `order.can_cancele_order` (from the order payload) |
| Backend | **Legacy backend** (not on the Go allow-list) |

## Technical reference

| Item | Value |
|------|-------|
| Menu row | `components/setting/orders/OrderOptionsMenu.tsx` (gated on `can_cancele_order`) |
| Reason picker | `components/setting/orders/CancelOrderWrapper.tsx` (hardcoded options) |
| Confirmation | `components/setting/orders/confirmations/OrderCancelConfirmationWindow.tsx` (agree checkbox) |
| Service | `services/order.ts` — `CancelOrder` (`CANCEL_ORDER`, code 62) |
| Store | None — local state; refreshes via `getOrderDetails()` |
| Analytics | `ORDER_CANCELLED` (with `cancel_reason`) |

## Current status & maturity

**Live.** Cancelling a whole, still-cancellable order works end to end against the backend.

## Known gaps / notes

- ⚠️ **The selected reason is never sent to the backend.** `CancelOrder` posts only `{ order_id }`;
  the chosen reason flows **only into analytics**. So the "why" the shopper picks is not persisted to
  the order.
- **Dead link.** The "Cancellation Terms" link is a placeholder `href="#"`.
- Reason options are **hardcoded English strings**, translated client-side.

## Related features

CO-18 (Cancel a single item — the item-level counterpart) · CO-16 (Order details — hosts the menu) ·
CO-22 (Hide order — a different "remove from view" action) · CO-19 / CO-20 (other pre-shipping order
changes) · CO-26 (Returns — the post-delivery counterpart).
