# SL-05 — Activate / Allow Purchase

| | |
|---|---|
| **Feature ID** | SL-05 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/productEdit/ProductEditor.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The control that **turns a product on or off for sale**. From the product editor a seller can make a
product purchasable ("Allow Purchase") or take it off sale ("Disable"). Enabling a product runs the
backend's eligibility checks first, and any blocking reasons are shown back to the seller.

## Where it appears

- In the header of the **product editor** (SL-04), as a button next to the product's status pill
  ("Purchasable" / "Disabled").

## Who uses it

**Sellers / shop staff** with the `CHANGE_PRODUCT_STATUS` permission (or `SUPER_ADMIN`). Without it,
the toggle button is not shown.

## How it works (verified behaviour)

- The button reads **"Allow Purchase"** when the product is off, and **"Disable"** when it's on.
- Clicking opens a confirmation dialog. On confirm it sends the target status (1 = on, 0 = off).
- **Turning off always succeeds.** **Turning on is conditional:** the backend runs activation
  eligibility checks and, if the product isn't ready, returns a list of blocking reasons.
- Those reasons are shown in the dialog as a red **"Cannot enable yet — resolve these first"** list.
  The eligibility logic lives entirely on the **server**; the frontend only relays the blockers.
- On success the local status pill updates from the server's response.

## Data source

| Item | Value |
|------|-------|
| Change status | `changeProductStatus(sellerId, productId, status)` → **POST `/shop/products/{id}/change-status`** (body `{status: 0|1}`, `market-dashboard`). On a rejected enable, the response carries `detailed_error[]` with the blocking messages. |

## Technical reference

| Item | Value |
|------|-------|
| Toggle + dialog | `ProductEditor.tsx` (`startStatus` / `confirmStatus`, `StatusDialog`, `StatusPill`) |
| Service | `services/sellerDashboard/index.ts` → `changeProductStatus` |
| Permission gate | `CHANGE_PRODUCT_STATUS` (or `SUPER_ADMIN`) |
| State | Local `useState` (`status`, `statusTarget`, `statusBlockers`) |

## Current status & maturity

Live and stable. The disable/enable flow works, and enable eligibility is enforced server-side with
clear, actionable blocker messages surfaced in the UI.

## Known gaps / notes

- No dedicated gaps found. Eligibility is fully backend-driven; the client permission-gates the
  button and displays the server's blocker list. The displayed status is refreshed from the
  change-status response rather than a full product re-fetch.

## Related features

SL-03 (Product management) · SL-04 (Product editing — same screen) · SL-14 (Roles & permissions).
