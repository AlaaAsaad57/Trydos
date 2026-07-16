# SD-25 — Buyer Comments & Reviews

| | |
|---|---|
| **Feature ID** | SD-25 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductBuyersComment/*`, `components/Server/product/ProductSizeReviews.tsx`, `utils/pagesDataRequests/ProductPageData.ts` |

---

## What it is

The **buyer reviews** on a product: star ratings, written reviews (optionally with photos),
"aspect" tags (e.g. "Good Quality", "True Size"), a recommend summary, and a size-fit breakdown
(what share of buyers found it true-to-size / small / large).

## Where it appears

On the product page (SD-19), as a horizontal strip of review cards plus a "see all" bottom sheet,
and a separate size-fit bar chart.

## Who uses it

Shoppers reading reviews; buyers who have received the item manage their own review.

## How it works (verified behaviour)

- **Reviews are written from the Orders flow, not here.** A shopper can only post a review after
  delivery, from their order (see CO-23). The product page has **no "write a review" box** — it
  shows reviews and lets the author manage their own.
- **On the product page a shopper can:**
  - read reviews (avatar, name, variant, date, text, stars, aspect badges, "Recommend It"),
  - **like/unlike** a review (requires login),
  - **translate** a review to the current language,
  - **edit or delete their own** review — edit reopens a modal to change stars, text and photos
    (edit is hidden once the seller has replied),
  - open a **"see all"** sheet with aspect-filter chips and load-more.
- **Size-fit review** is a read-only bar chart: True / Small / Large percentages.
- **What counts as a review:** a comment document that has both a star rating and an
  `order_details_id` (i.e. tied to a real purchased order line). One review per order line.

## Data source

| Item | Value |
|------|-------|
| Reviews | Elasticsearch `comments_index` — docs with `rating` **and** `order_details_id`, not `deleted` |
| Loader | `GetRatingCommentsForProduct` (`utils/pagesDataRequests/ProductPageData.ts`) |
| Like state | `comments_interactions_index` (per-comment reactions) |
| Size-fit | `GetProductGeneralData({ id })` → `size_analysis` (true/small/large %) |
| Write / edit / delete | comments microservice (`server: "comments"`) — `/public_comment/comments/create` (from Orders), `/{id}/update`, `/{id}/delete`, `/{id}/translate`; likes `/public_comment/likes/like`|

## Technical reference

| Item | Value |
|------|-------|
| List / cards | `ProductBuyersCommentsWrapper.tsx` → `ProductBuyersCommentList.tsx` → `BuyerCommentItem.tsx` |
| "See all" sheet | `components/products/BuyersCommentModal.tsx` (aspect filters) |
| Size-fit | `components/Server/product/ProductSizeReviews.tsx` (read-only) |
| Pagination | Elasticsearch `search_after` cursor — initial **5**, load-more **10** |
| Load-more route | `app/api/products/comments/buyers_comments/route.ts` |
| Shared with | **CO-23** (order review) — same backend & documents |

## Current status & maturity

**Live and stable.** Reviews, likes, aspect filters, translation and size-fit are all working.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-26 (Q&A — same backend, opposite filter) · SD-27 (Specs modal reuses
the size-fit data) · CO-23 (Rate & review a purchase — where reviews are written).
