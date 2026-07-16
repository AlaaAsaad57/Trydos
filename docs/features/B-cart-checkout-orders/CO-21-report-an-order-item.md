# CO-21 — Report an Order Item

| | |
|---|---|
| **Feature ID** | CO-21 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/orders/ReportOrderItemWrapper.tsx`, `components/setting/orders/OrderItemOptions.tsx`, `utils/orderReportOptions.ts`, `services/order.ts` |

---

## What it is

Lets a shopper **flag a problem with a delivered item** — the product itself, the delivery time, the
delivery worker, or the delivery vehicle — by picking from grouped reasons and adding an optional note.

## Where it appears

On the order detail page (CO-16), from the **per-item options sheet** — the **"Report This Product"**
row (only on delivered items).

## Who uses it

Any shopper unhappy with a delivered item or its delivery.

## How it works (verified behaviour)

- **Delivered items only.** The row shows when the order's status is `delivered`. If the item is
  already reported (`is_reported`), the row is replaced by a *"We received your report / Thanks for
  your thoughts"* acknowledgement — no re-reporting from the UI.
- **Grouped, multi-select reasons.** Four "points" with several checkboxes each: **product quality**
  (damaged, not as described, poor material, wrong item, expired), **delivery time** (too late, missed
  window, no ETA, faster than expected), **delivery worker** (rude, unprofessional, no-show, asked
  extra fee, polite), **delivery car** (dirty vehicle, no cooling, unsafe handling, no vehicle). More
  than one can be ticked per point.
- **Optional free-text note.**
- **Submit gate:** at least one reason **or** a non-empty note. Empty reason groups are stripped before
  sending. On success, a confirmation toast shows and the order refreshes.

## Data source

| Item | Value |
|------|-------|
| Submit report | `POST /customer/order/report` — body `{ order_id, order_detail_id, product_id, order_group_id, points, note }` (`Order.ReportOrderItem`) |
| Reason contract | `utils/orderReportOptions.ts` (frozen client-side wire contract) |
| Backend | **Legacy backend** |

## Technical reference

| Item | Value |
|------|-------|
| Report UI | `components/setting/orders/ReportOrderItemWrapper.tsx` (grouped chips + note) |
| Menu row / gate | `components/setting/orders/OrderItemOptions.tsx` (`isDelivered`, `is_reported`) |
| Reasons | `utils/orderReportOptions.ts` (4 points, multi-select) |
| Service | `services/order.ts` — `ReportOrderItem` (`REPORT_ORDER_ITEM`, code 186) |
| Store | None — local state; toasts via notifications store |
| Analytics | Report event fired from the menu row |

## Current status & maturity

**Live.** The reason/note reporting path is fully functional against the backend. (Photo evidence on
reports is out of scope for now; photos live on the review flow, CO-23.)
## Known gaps / notes

No dedicated gaps found.

## Related features

CO-16 (Order details — hosts the report entry) · CO-23 (Rate & review — a separate feedback path
that *does* support photos) · CO-26 (Create a return — the remediation path) · CO-24 (Order chat —
another way to raise a delivery issue).
