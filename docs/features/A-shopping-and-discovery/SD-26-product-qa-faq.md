# SD-26 — Product Q&A / FAQ

| | |
|---|---|
| **Feature ID** | SD-26 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductFAQSection/*`, `utils/pagesDataRequests/ProductPageData.ts` |

---

## What it is

A **pre-purchase questions section** on a product: shoppers ask a question, and the **seller
answers**. It is interactive, not a static FAQ.

## Where it appears

On the product page (SD-19), as a horizontal strip of question cards with an "ask a question"
input, plus a "see all" bottom sheet.

## Who uses it

Shoppers with a question before buying; the seller who replies (seller replies are written
elsewhere — the product page only displays them).

## How it works (verified behaviour)

- **Ask a question.** A logged-in, phone-verified shopper types a question (up to 200 characters)
  and submits; it appears immediately at the top of the list.
- **Seller answers.** Each card shows the question ("Q") and, once answered, the seller's reply
  ("A", addressed to the customer). Unanswered questions show "Waiting Seller Reply…".
- **A shopper can also:** like the question and the seller's reply, translate either, and edit or
  delete their **own** question (edit hidden once it's been answered).
- **"See all"** opens a bottom sheet with aspect-filter chips and load-more.
- **What counts as a question:** a comment document **without** an `order_details_id` — the exact
  inverse of a buyer review (SD-25). Both live in the same store.

## Data source

| Item | Value |
|------|-------|
| Questions | Elasticsearch `comments_index` — docs **without** `order_details_id`, not `deleted` |
| Loader | `GetFQACommentsForProduct` (`utils/pagesDataRequests/ProductPageData.ts`) |
| Ask / edit / delete | comments microservice — `/public_comment/comments/create` (no rating, no order id), `/{id}/update`, `/{id}/delete` |
| Reply fields | `has_reply`, `seller_reply`, `seller_name`, `reply_created_at` |

## Technical reference

| Item | Value |
|------|-------|
| List | `ProductFaqSectionWrapper.tsx` → `FaqQuestionsList.tsx` → `FaqItemComponent.tsx` |
| Ask input | `FaqAskInput.tsx` (max 200 chars, login + verified phone required) |
| "See all" sheet | `FaqSectionModal.tsx` (`BottomSheet` height 90) |
| Pagination | Elasticsearch `search_after` — initial **5**, load-more via `/api/products/comments/fqa_comments` |
| Layout | fixed two-part cards (question + answer), **not** an accordion |

## Current status & maturity

**Live and stable** — a genuine buyer↔seller Q&A channel.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-25 (Reviews — same backend, opposite filter) · SD-19 (Product page) · SL-11 (Seller comments &
reviews management, where replies are written).
