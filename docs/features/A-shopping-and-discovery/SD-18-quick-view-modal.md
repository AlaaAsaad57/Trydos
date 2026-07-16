# SD-18 — Quick-View Modal

| | |
|---|---|
| **Feature ID** | SD-18 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/@modal/(.)products/[productId]/page.tsx`, `components/Product/ProductPageContent.tsx`, `components/ModalRoute/*` |

---

## What it is

The ability to open a product **on top of the current listing**, as an overlay, instead of
navigating away — so the shopper can view a product and then return to exactly where they were
in the grid.

## Where it appears

When a shopper taps a product card in any listing (SD-14). The product opens as an overlay; the
listing stays underneath. Loading or refreshing a product link directly still shows the full
product page normally.

## Who uses it

Every shopper browsing a listing — it's the default way a product opens from a grid.

## How it works (verified behaviour)

- **It's the full product page, shown as an overlay.** Trydos does **not** use a lighter
  "quick-view" — the overlay renders the *complete* product detail page (SD-19): photo/video
  gallery, name & brand, description and specs, colour and size selection, delivery/shipping/
  return badges, stories, comments, FAQ, related products, and the add-to-cart price footer.
- **Built on Next.js "intercepting routes".** Tapping a product navigates to its normal URL
  (`/{lang}/products/<slug>`), but that navigation is *intercepted* and rendered into an overlay
  slot instead of replacing the page — so the listing behind it stays mounted.
- **No pop-up chrome.** The overlay is a full-width panel that covers the viewport; the page
  behind it is hidden (via React state, not by unmounting). There is deliberately **no dimmed
  backdrop and no floating modal box**.
- **Dismiss with Back.** The product's back button (and the browser Back gesture) closes the
  overlay and restores the listing at the same scroll position.
- **Direct loads are safe.** If someone opens or refreshes a product URL directly, the app
  detects it isn't an in-app overlay navigation and shows the real full page (with SEO metadata),
  avoiding a blank screen.

## Data source

| Item | Value |
|------|-------|
| Product data | identical to the full page — `GetGlobalProduct`, `GetProductPriceQtyDetails`, `GetStarttingSetting` (`serverRequests/product`, `serverRequests`), streamed via Suspense |
| Rendered by | `components/Product/ProductPageContent.tsx` (shared by both the modal and the full page) |

## Technical reference

| Item | Value |
|------|-------|
| Intercepted route | `app/(client)/[lang]/@modal/(.)products/[productId]/page.tsx` (the `(.)` = same-level interception) |
| Full route | `app/(client)/[lang]/products/[productId]/page.tsx` (adds `generateMetadata` + not-found redirect) |
| Slot mount | `app/(client)/[lang]/layout.tsx` — `@modal` parallel-route slot + `OverlayVisibilityProvider` |
| Overlay logic | `components/ModalRoute/ModalSlot.tsx`, `ModalOverlay.tsx`, `OverlayVisibility.tsx`, `ModalRouteContext.tsx` |
| Dismiss | `components/products/ProductBackButton.tsx` → `router.back()` when in modal |
| Card link | `getUrlofProduct()` (`utils/server/index.tsx`) → `/{country}-{language}/products/<slug>` |

## Current status & maturity

**Live and stable.** The overlay-visibility approach was deliberately rebuilt around React
state (from an earlier imperative version that could leave the page stuck hidden), so this is
mature, hardened code.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-14 (Listing it overlays) · SD-19 (Product detail page — the same content) ·
SD-17 (Boutique storefront, also an intercepted overlay).
