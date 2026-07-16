# SD-30 — More-Options Menu

| | |
|---|---|
| **Feature ID** | SD-30 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/products/MoreOptionsSection.tsx`, `components/products/ExtendedAreaInfo.tsx`, `components/Server/product/ProductFooter.tsx/ProductMoreButton.tsx` |

---

## What it is

The **overflow ("⋯") menu** in the product page footer, gathering extra actions that don't have
their own footer button.

## Where it appears

On the product page (SD-19), opened by the three-dots button in the sticky footer; it expands a
panel above the footer.

## Who uses it

Shoppers who want to be notified about a product, save it, or compare it.

## How it works (verified behaviour)

The More menu exposes three actions:

- **Notify me** — subscribe/unsubscribe to notification topics for this product (e.g. back-in-
  stock/price alerts). Toggling a topic subscribes or unsubscribes via Inventory Backend(firebase under the hood) (asking for
  notification permission first). Enabled topics show green with a check.
- **Add to my checklist (wishlist)** — add/remove the product from the wishlist (SD-31), with a
  success/removed toast.
- **Add to compare** — add/remove the product from the compare list (SD-32); shows an "Added to
  Compare! Click to go to the Compare page" prompt. Compare membership is tracked in cookies.

The footer's Like, Comment and Share are **separate** buttons (not inside the More menu), though
they share the same expanding panel.

## Data source

| Item | Value |
|------|-------|
| Notify topics | `getNotificationsTypes()`, `home.subscribeToTopicInventory` / `UnsubscribeToTopicInventory`, `home.AllowNotifications()` |
| Wishlist | `wishlistService.isInWishlist` / `addToWishlist` / `removeFromWishlist` |
| Compare | `addToCompare` / `removeFromCompare` (cookie-based: `f_p` / `s_p`) |

## Technical reference

| Item | Value |
|------|-------|
| Trigger | `ProductMoreButton.tsx` (sets `activeTab = "More"`) |
| Panel host | `components/products/ExtendedAreaInfo.tsx` (also hosts Comment & Share panels) |
| Menu body | `components/products/MoreOptionsSection.tsx` |
| Analytics | GA `ENABLE_PRODUCT_NOTIFICATION`, `ADD_TO_FAV` (the More button's own GA event is commented out) |

## Current status & maturity

**Live and stable.** Three working actions: notify-me, wishlist, compare.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-31 (Wishlist) · SD-32 (Compare) · NT-06/NT-07 (Notification
preferences / topic subscribe) · SD-28 (Share, sibling footer action).
