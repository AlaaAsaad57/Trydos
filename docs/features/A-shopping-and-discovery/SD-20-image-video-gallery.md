# SD-20 — Image & Video Gallery

| | |
|---|---|
| **Feature ID** | SD-20 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductPhotoSliderWrapper.tsx`, `components/products/ProductDetailsSlider.tsx`, `components/products/ProductVideo.tsx` |

---

## What it is

The product's **photo carousel and video player** at the top of the product page — a swipeable
strip of images, a tap-to-zoom fullscreen viewer, and a picture-in-picture product video.

## Where it appears

At the top of every product page (SD-19), and therefore also in the quick-view overlay (SD-18).

## Who uses it

Every shopper viewing a product.

## How it works (verified behaviour)

- **Swipeable image strip.** A horizontal carousel (Embla) of the product's photos, direction-
  aware for RTL. The first image loads eagerly for speed; the rest lazily.
- **Colour-aware.** The images shown match the selected colour — the gallery picks that colour's
  image set (falling back to the first colour, then the product's own images).
- **Tap to zoom.** Tapping an image opens a fullscreen viewer (a separate carousel) at full
  quality, closable with an X.
- **Overlays on the first image.** The opening image can carry a **flash-deal frame + countdown**,
  a **redeem/luck counter**, and the **virtual try-on** badge (SD-24) when the product's category
  supports it.
- **Product video (picture-in-picture).** If the product has videos, a small muted preview
  (trimmed to the first 10 seconds) floats over the gallery; tapping it expands to a fullscreen
  player with native controls, unmuted, and prev/next arrows for multiple videos.
- **Analytics.** Viewing, zooming and a 20-second "engaged view" all emit Google Analytics events
  (see PF-21).

## Data source

| Item | Value |
|------|-------|
| Images | `product.sync_color_images[<colour>].images` (or fallbacks) from `GetGlobalProduct` |
| Videos | `product.videos` (media transformed via `getVideoUrl`, trimmed for the preview) |
| Image optimisation | `getConfiguredImage` / `GetImageUrl` (see PF-46) |

## Technical reference

| Item | Value |
|------|-------|
| Main slider | `components/Server/product/ProductPhotoSliderWrapper.tsx` → `components/products/ProductImageSlider.tsx` |
| Fullscreen zoom | `components/Server/product/ProductExtendedSliderWrapper.tsx` → `components/products/ProductDetailsSlider.tsx` |
| Video | `components/Server/product/ProductVideosWrapper.tsx` → `components/products/ProductVideo.tsx` |
| Carousel library | `embla-carousel-react` (RTL-aware) |
| First-image overlays | `VirtualTryOn` (SD-24), `FlashDealBanner`, `ProductRedeemCounter` |
| Preview video | muted, first **10 s**; expanded = native controls, unmuted |

## Current status & maturity

**Live and stable.** No thumbnail rail — it's a swipe/scroll filmstrip plus fullscreen zoom.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-21 (Colour selection that changes the images) · SD-24 (Try-on badge
overlay) · SD-04 (Flash-deal frame) · SD-33 (Redeem/luck counter) · PF-46 (Image optimization).
