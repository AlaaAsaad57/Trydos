# CO-23 — Rate & Review a Purchase

| | |
|---|---|
| **Feature ID** | CO-23 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Orders/RatingOrderItem.tsx`, `components/settings/cards/OrderItemsList.tsx`, `components/settings/cards/RatingStars.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **rate and review a delivered item** — a 1–5 star rating, a written review, and
optional photos — written from the Orders area. This is the **write** side of the buyer reviews shown
on the product page (SD-25).

## Where it appears

On the order detail page (CO-16): a **star row under each delivered item** opens the rating modal, and
a promotional **"Rate & Get Money"** card highlights it above the item list.

## Who uses it

Any shopper who has received an item and wants to review it.

## How it works (verified behaviour)

- **Delivered items only.** The stars appear when the item is delivered and not returned.
- **1–5 stars, integer.** The star widget renders five stars; half-star logic exists in the code but
  is **intentionally disabled** — clicks snap to whole stars.
- **Written review required.** Submit stays disabled until there's both a non-empty comment and a
  rating above zero.
- **Optional photos.** Images upload through the shared uploader (to the media server's `rating_orders`
  folder), now capped at **up to 5 photos, ≤ 5 MB each**.
- **Edit your own.** If a prior review exists, its stars/text/images preload and the action switches
  to **"Update Rating"**; a no-op resubmit is blocked.
- **Analytics:** `ORDER_ITEM_RATED` (with `is_edit`, `image_count`).

## Data source

| Item | Value |
|------|-------|
| Create review | `POST /public_comment/comments/create` (`server: "comments"`) — text, rating, images, product/order refs |
| Edit review | `PUT /public_comment/comments/{id}/update` (`server: "comments"`) |
| Read existing ratings | `POST /api/products/comments/order_rating` (`server: "local"` → Elasticsearch) |
| Upload photos | Media server `rating_orders` folder (see CO-27's uploader) |
| Backend | Writes → **comments microservice** (`NEXT_PUBLIC_COMMENT_BACKEND_URL`); reads → Elasticsearch |

## Technical reference

| Item | Value |
|------|-------|
| Rating modal | `components/Orders/RatingOrderItem.tsx` (stars + comment + images) |
| Star widget | `components/settings/cards/RatingStars.tsx` (1–5; half-star disabled) |
| Mount / edit preload | `components/settings/cards/OrderItemsList.tsx` |
| Services | `services/order.ts` — `AddCommentForProduct` (code 114), `UpdateComment` (code 139), `GetOrderRating` (code 138), `UploadImageForRating` |
| Store | None dedicated — local state |
| Analytics | `ORDER_ITEM_RATED` |

## Current status & maturity

**Live.** Rating, written review, image attachment and editing an existing review all work.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-25 (Buyer comments & reviews — the read side on the product page) · CO-16 (Order details — hosts
the rating entry) · CO-27 (Upload return photos — shares the same image uploader) · CO-21 (Report an
order item — a separate, non-public feedback path).
