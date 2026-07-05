# SD-24 — Virtual Try-On

| | |
|---|---|
| **Feature ID** | SD-24 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟡 Partial — UI only, core not built |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/products/VirtualTryOn.tsx`, `components/products/TryOnModal.tsx`, `store/Details/reducer.ts` |

---

## What it is

A feature that lets a shopper take or upload a photo and (in the intended design) see a product
virtually placed on them. **Today only the photo-capture front-end exists** — the actual try-on
transformation is a placeholder.

## Where it appears

On the product page (SD-19), as a small purple badge overlaid on the first product image — shown
only for products whose category is flagged for try-on.

## Who uses it

Shoppers who tap the badge — currently they get the capture flow but not a real result.

## How it works (verified behaviour)

- **Entry:** tapping the badge opens a full-screen try-on modal.
- **Real, working parts:**
  - Take a photo with the device camera (rear camera), or capture a frame,
  - Upload a photo from the gallery,
  - Browse the product's own images in a strip.
- **The "try-on" itself does nothing.** Pressing try-on shows a 3-second spinner and then
  displays **the shopper's own uploaded photo unchanged** — the product is never composited onto
  it. There is no AI, no backend call, no image processing.

## Data source

| Item | Value |
|------|-------|
| Product payload | `store/Details` `isModalOpen` = `{ id, slug, images }` |
| Try-on processing | **none** — hard-coded 3-second timeout, then echoes the input photo |
| Backend / AI | **none** — no `app/api/tryon` route, no external service, no feature flag |

## Technical reference

| Item | Value |
|------|-------|
| Badge | `components/products/VirtualTryOn.tsx` (overlaid in `ProductPhotoSliderWrapper.tsx`) |
| Modal host | `components/products/VirtualTryOnWrapper.tsx` → `TryOnWidget.tsx` → `TryOnModal.tsx` |
| Capture | `getUserMedia({ facingMode: "environment" })`, canvas capture, `FileReader` upload |
| Stub | `handleTryOn()` = `setTimeout(… , 3000)` then re-renders the input image |
| Design docs | `docs/superpowers/specs/2026-07-01-virtual-tryon-design.md` (spec only, not built) |

## Current status & maturity

**Partial / placeholder.** The capture and upload UI is genuine and functional; the core
try-on capability is absent. A locked design exists (live-camera 3D AR, on-device, no AI image
generation) but has not been implemented — this ships on the live product page as a stub.

## Known gaps / notes

- **The core feature is not built.** The result just shows the shopper's own photo. Consider
  reclassifying to ⚪ Placeholder, or hiding the badge until the real try-on lands, so shoppers
  aren't shown a non-functional result.

## Related features

SD-19 (Product page) · SD-20 (Gallery it overlays) · SD-21 (Variant it would try on).
