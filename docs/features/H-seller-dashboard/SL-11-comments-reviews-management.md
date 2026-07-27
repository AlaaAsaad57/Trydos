# SL-11 — Comments & Reviews Management

| | |
|---|---|
| **Feature ID** | SL-11 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/CommentsTab.tsx`, `services/sellerDashboard/comments.ts`, `services/elastic/sellerComments.ts` |

---

## What it is

The **Customers Comments** tab — where a seller reads customer product questions (FAQ) and reviews,
and replies to the questions. It has two sub-tabs: **FAQ** (buyer→seller questions) and **Reviewing**
(rated reviews).

## Where it appears

- Inside the seller dashboard → **Customers Comments** tab.

## Who uses it

**Sellers / shop staff.** Reading needs `READ_COMMENTS`; replying needs `REPLY_COMMENT`; editing a
reply needs `EDIT_REPLY`; deleting a reply needs `DELETE_REPLY`.

## How it works (verified behaviour)

- **Two sub-tabs:** **FAQ** and **Reviewing**, switched by a segmented control.
- **FAQ items** show the question and either the shop's reply (with **Edit Reply** / **Delete
  Reply**) or a "Waiting Seller Reply…" state with a **Reply** button.
- **Reviews are display-only** — they show the rating stars and text, with **no reply** affordance.
- **Pagination:** "Load More", 10 per page (server clamps 1–50), newest first. Reviews are
  de-duplicated per order-detail so double-writes don't double-count.
- **Security (verified):** the tab's permission flags are **UX-only**. Every read/reply/edit/delete
  runs through a **server action** that re-verifies the seller's identity and membership against the
  dashboard backend (`/shop/auth/permissions`) from the HttpOnly token, injects an owner filter so a forged
  shop ID matches nothing, checks the specific permission, and rate-limits writes. Permissions are
  cached briefly in Redis.

## Data source

| Item | Value |
|------|-------|
| Where data lives | **Elasticsearch directly** — index `comments_develop` (the Python comments backend is no longer used by the dashboard) |
| List FAQ / reviews | `GetFQAComments` / `GetReviewComments` → `getSellerComments` server action (ES `search`, `is_review` false/true) |
| Reply / edit / delete | `ReplyToFQAComment` / `EditReplyForFqaComment` / `DeleteReplyForFqaComment` → server actions using ES `updateByQuery` |
| Reaction counts | enriched from `comments_reactions_develop` via aggregation |

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/CommentsTab.tsx` |
| Client service | `services/sellerDashboard/comments.ts` |
| Server actions + guard | `services/elastic/sellerComments.ts` (`withSellerCommentAccess`, `assertSellerCommentAccess`) |
| Permission gates | `READ_COMMENTS / REPLY_COMMENT / EDIT_REPLY / DELETE_REPLY` (or `SUPER_ADMIN`) — re-checked server-side |
| State | Local `useState` (no store slice) |

## Current status & maturity

Live and stable. Reading FAQ + reviews and replying/editing/deleting replies all work, with genuine
server-side permission enforcement (not just UI gating) and per-shop rate limiting.

## Known gaps / notes

- **Reviews are read-only by design** — a seller cannot reply to a review, only to FAQ questions.
- The Elasticsearch index name is **hardcoded to `comments_develop`** (and `_develop` reaction/
  interaction indices) with no environment switch — flag before production.
- Permission changes on the backend take effect only after the short cache TTL (default ~30s), and
  during a backend outage stale permissions can be honoured up to ~1h.
- The write rate-limiter **fails open** if Redis is down (mutations proceed unthrottled).
- Seller replies always render a fixed fallback avatar rather than the shop logo.

## Related features

SD-25 (Buyer comments & reviews) · SD-26 (Product Q&A / FAQ) · SL-03 (Product management — its card
social counts come from the same data).
