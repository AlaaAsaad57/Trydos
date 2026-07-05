# CO-19 — Change Delivery Address

| | |
|---|---|
| **Feature ID** | CO-19 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderOptionsMenu.tsx`, `components/Orders/ChangeAddressWidget.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **redirect an existing order to a different saved address** while it's still eligible.
The menu also offers a "Delivery Note" field (currently captured for analytics only — not yet
persisted to the order).

## Where it appears

On the order detail page (CO-16), from the **order options menu** — the **"Change Delivery Address &
Note"** row.

## Who uses it

Any shopper who needs an in-flight order delivered somewhere else.

## How it works (verified behaviour)

- **Eligibility is backend-driven.** The row only appears when the order's `can_update_address` flag
  is true.
- **Pick a new address.** The widget loads the shopper's saved address list; they select a different
  address (or add a new one) across a "Delivery Address" tab and a "Delivery Note" tab.
- **Confirm.** The confirm button enables when a **different address** is chosen **or** a note is
  typed; a confirmation modal then **awaits** the change, and only on success closes and refreshes the
  order (on failure the modal stays open so the shopper can retry). An `ORDER_ADDRESS_CHANGED`
  analytics event fires on success.
- **Only the address is persisted to the order** today; the delivery note is captured for analytics
  only (wiring it to the backend is tracked as a known-issue).

## Data source

| Item | Value |
|------|-------|
| Change address | `POST /customer/order/change-address` — body `{ order_group_id, new_shipping_address_id }` (`changeOrderAddress`) |
| Address list | `Order.GetAddressList` → `store.addressLists` |
| Eligibility | `order.can_update_address` |
| Backend | **Legacy backend** |

## Technical reference

| Item | Value |
|------|-------|
| Menu row | `components/setting/orders/OrderOptionsMenu.tsx` (`shouldShowChangeAddress`) |
| Change widget | `components/Orders/ChangeAddressWidget.tsx` (address + note tabs, `ConfirmAddressModal`) |
| Service | `services/order.ts` — `changeOrderAddress` (`CHANGE_ORDER_ADDRESS`, code 64; `order_id` param = order group id) |
| Store | Address list in `store.addressLists`; no order-modify slice |
| Analytics | `ORDER_ADDRESS_CHANGED`, `note_added` |

## Current status & maturity

**Live.** Redirecting an order to a different saved address is fully functional, and the confirm flow
now awaits the request, gates success on the real response, and resets its loading state.

## Known gaps / notes

- **Delivery note not persisted yet** — the note field is captured for analytics only, not saved to
  the order. Tracked in the README known-issues list for backend wiring.

## Related features

CO-07 (Shipping address management — the address book this reuses) · CO-08 (Region / map picker) ·
CO-16 (Order details — hosts the menu) · CO-17 / CO-20 (other pre-shipping order changes).
