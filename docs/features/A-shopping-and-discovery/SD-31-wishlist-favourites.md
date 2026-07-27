# SD-31 — Wishlist / Favourites

| | |
|---|---|
| **Feature ID** | SD-31 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `services/wishlist.ts`, `app/(client)/[lang]/settings/checklist/page.tsx`, `components/setting/checklist/{ChecklistView,ChecklistItem}.tsx`, `components/products/MoreOptionsSection.tsx`, `app/(client)/[lang]/settings/page.tsx` |

---

## What it is

A personal **saved-items list** — called the **"CheckList"** in the app — that lets a shopper keep
products aside to find again later. Items are saved from a product page and reviewed on their own
**"My Checklist"** screen inside Settings.

## Where it appears

- **Saving** happens on the product page (SD-19): the "Add To My Checklist" action inside the
  **More-options menu** (SD-30).
- **Viewing** happens at `/{lang}/settings/checklist`, reached from **Settings → My Checklist**.
  *(This replaced the old slide-in panel that opened from the home menu; the panel and its menu entry
  were removed.)*

## Who uses it

Any shopper, including guests (see below) — no separate account step is required to save an item.

## How it works (verified behaviour)

- **Save / remove is a toggle.** The "Add To My Checklist" button re-checks the server for
  current membership, then adds or removes the product accordingly. When the product is saved the
  button turns green ("Added").
- **The screen is a normal settings page** with a back bar titled "My Checklist". It loads the
  shopper's saved items **10 per page** with a **"Load more"** button that pulls the next page, and
  shows skeleton rows while the first page loads.
- **Removing from the list** is per row: each row shows its own spinner while the request is in
  flight, and a failed removal leaves the row in place and surfaces the error.
- **Empty state:** "Your CheckList is empty".
- **Toasts:** adding shows "Added to checklist", removing shows "Removed from checklist", and a
  failure shows "Failed to update checklist".
- **Guest-friendly.** Requests carry the shopper's market token, which falls back to the guest
  device token, so a browsing guest can save and view items; there is no hard login wall in the
  client. (If the token is missing/expired, the app's standard 401 re-auth flow runs.)
- **Analytics:** a Google Analytics `add_product_to_favorites` event fires on the toggle (with
  product, brand, category and price context).

## Data source

| Item | Value |
|------|-------|
| Add | `POST /checklist` (`{ product_id }`) — `wishlistService.addToWishlist` |
| Remove | `DELETE /checklist/{productId}` — `wishlistService.removeFromWishlist` |
| List (paginated) | `GET /checklist?page={n}&page_size=10` — `wishlistService.getWishlist` |
| Membership check | `GET /checklist/product/{productId}/exist` → `is_exist` — `wishlistService.isInWishlist` |
| Backend | `server: "market"` — routed by the app's market-API routing (guests go gateway-first, verified shoppers go to the core backend), auth token injected server-side |

## Technical reference

| Item | Value |
|------|-------|
| Service | `services/wishlist.ts` (singleton `wishlistService`) |
| Screen | `app/(client)/[lang]/settings/checklist/page.tsx` → `components/setting/checklist/ChecklistView.tsx` (+ `ChecklistItem.tsx`) |
| Save button | `components/products/MoreOptionsSection.tsx` (`toggleWishlist`, `data-cy="add-checkList"`) |
| Entry point | `app/(client)/[lang]/settings/page.tsx` → "My Checklist" |
| Request codes | `utils/Requests.ts` — `GET_CHECKLIST` (161), `DEL_CHECKLIST` (162), `ADD_CHECKLIST` (163) |
| Analytics | GA `ADD_TO_FAV = "add_product_to_favorites"` (`utils/GAEvents.ts`) |
| Page size | Hardcoded `page_size=10` (`services/wishlist.ts`) |

## Current status & maturity

**Live and stable.** 

## Known gaps / notes

No dedicated gaps remain.



## Related features

SD-30 (More-options menu — where saving lives) · SD-19 (Product page) · SD-32 (Product
comparison — sibling cross-cutting action) · AC-17 (Account / settings home — the entry point) ·
AC-11 (Automatic guest registration — supplies the token guests save with).
