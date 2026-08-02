# SL-08 — Shop Info / Branding

| | |
|---|---|
| **Feature ID** | SL-08 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/ShopInfo.tsx`, `components/SellerDashboard/ShopInfoLoader.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Shop Info** tab — where a seller edits their shop's basic identity and branding: shop name,
contact number, address, logo image and banner image.

## Where it appears

- Inside the seller dashboard → **Shop Info** tab.

## Who uses it

**Sellers / shop staff.** Viewing needs `READ_SHOP_INFO`; **editing** needs `UPDATE_SHOP_INFO`.
Without the update permission the form is shown read-only (all inputs disabled, a "Read only" badge,
no Save button).

## How it works (verified behaviour)

- **Editable fields (verified):** Shop Name (text), Contact (text), Address (textarea), Shop Logo
  (image), Shop Banner (image, suggested 6:1 ratio).
- **Images** are picked, run through a crop widget, previewed locally, then uploaded to the media
  server on save; only changed images are re-uploaded (existing URLs are kept otherwise).
- **Save** sends name, address, contact and the two image references together. Success shows a
  toast; failure logs to Sentry and shows a native browser alert.
- **The same shop record now also feeds the rest of the dashboard.** An invisible loader fetches it
  **once per shop** and keeps it in the store, so the product list, the product form and the boutique
  screens can read the shop's **currency** and its **new-product approval standing** without
  refetching. Because the read is protected by `READ_SHOP_INFO`, the request is **never issued** for a
  user who doesn't hold that permission — those screens say the permission is missing instead of
  spinning or offering a retry that cannot succeed.

## Data source

| Item | Value |
|------|-------|
| Read | `getShopInfo(sellerId)` → **GET `/shop/info`** (`market-dashboard`) — also loaded dashboard-wide by `ShopInfoLoader` into the `dashboardShopInfo` store slice |
| Update | `updateShopInfo(sellerId, {name, address, contact, image, banner})` → **PUT `/shop/info`** |
| Image upload | `uploadShopImage(file, 'seller')` → **POST `{MEDIA_SERVER}/upload`** (`x-api-key`) |

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/ShopInfo.tsx` |
| Service | `services/sellerDashboard/index.ts` (`getShopInfo`, `updateShopInfo`, `uploadShopImage`) |
| Read / update gates | `READ_SHOP_INFO` / `UPDATE_SHOP_INFO` (or `SUPER_ADMIN`) |
| State | Local `useState` (no store slice) |

## Current status & maturity

Live and stable for the fields it exposes. Read/update permission split is enforced in the UI, and
image cropping + media upload work end to end.

## Known gaps / notes

- Contact validation is weak — the field only checks "optional `+` then digits", with no length or
  country-code enforcement despite the "country code must lead" hint.
- No image size/type/dimension checks beyond the browser's `accept="image/*"`; the banner's "6:1"
  ratio is guidance text only, not enforced.
- Error feedback on save uses a native `alert()` (inconsistent with the success toast).

## Related features

SL-01 (My shops) · SL-03 / SL-04 (consume the shop currency & approval standing) · SL-06 (Boutiques) ·
SL-15 (Locations) · SD-17 (the public boutique storefront shoppers see).
