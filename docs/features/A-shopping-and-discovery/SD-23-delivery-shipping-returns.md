# SD-23 — Delivery & Shipping / Returns Info

| | |
|---|---|
| **Feature ID** | SD-23 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductExpectedDeleiveryWrapper.tsx`, `components/products/ExpectedDeleiveryModal.tsx`, `components/products/FreeShippingOption.tsx`, `components/products/FreeReturnBadge.tsx` |

---

## What it is

The delivery-and-returns reassurance block on a product: an **estimated delivery date**, a
**free-shipping** badge, and a **free-return** badge — plus a detail sheet with a historical
delivery-time breakdown and the platform's delivery promises.

## Where it appears

On the product page (SD-19), in a light card below the colour options.

## Who uses it

Every shopper checking when an item will arrive and whether shipping/returns are free.

## How it works (verified behaviour)

- **Estimated delivery date** is calculated as *today + (platform shipping days + this product's
  shipping days)*. It shows the weekday and date, plus a total "work days" count.
- **Delivery detail sheet.** Tapping the banner opens a bottom sheet that recomputes the same
  estimate and, on open, lazily loads a **historical delivery distribution** for that product
  (how many past orders arrived in 1…10 days, as percentages). It also lists platform promises:
  a 25%/$25-to-wallet compensation if shipping is delayed, and free shipping.
- **Free-shipping badge** shows only when the product's shipping cost is exactly 0.
- **Free-return badge** shows only when the product allows returns (`allow_return_in_days > 0`),
  and displays the return window in days. A value of 0 means "no returns" and hides the badge and
  the return sections in the detail sheet.

## Data source

| Item | Value |
|------|-------|
| Delivery estimate | client-side date math: `today + (shipping_duration_days + product.shipping_days)` days |
| Platform shipping days | `GetStarttingSetting` → Go backend `/web/home/startingSettings` (`shipping_duration_days`) |
| Product shipping days / cost / return window | `GetProductPriceQtyDetails` (`shipping_days`, `shipping_cost`, `allow_return_in_days`) |
| Historical delivery times | `GetProductDeliveryTimes({ productId })` → market backend `/web/product/delivery_times/<id>` (sheet only) |

## Technical reference

| Item | Value |
|------|-------|
| Delivery banner | `components/Server/product/ProductExpectedDeleiveryWrapper.tsx` → `ExpectedDeleiveryBanner.tsx` |
| Delivery sheet | `components/products/ExpectedDeleiveryModal.tsx` (`BottomSheet`, opened via store `is_for_deleviery`) |
| Free shipping | `components/products/FreeShippingOption.tsx` (shown when `shipping_cost === 0`) |
| Free return | `components/products/FreeReturnBadge.tsx` (shown when `allow_return_in_days > 0`) |
| Analytics | PostHog `DELIVERY_STATS_VIEWED` on opening the sheet |

## Current status & maturity

**Live and stable.** The historical delivery-time breakdown is a nice trust-building touch.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · CO-08 (Region affects delivery) · CO-26…CO-28 (Returns flow the badge
promises).
