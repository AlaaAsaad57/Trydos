# SD-11 — Image / Visual Search

| | |
|---|---|
| **Feature ID** | SD-11 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/Home/Search/SearchImage.tsx`, `app/api/image-search/route.ts` |

---

## What it is

Search by picture: the shopper uploads or snaps a photo of a product, and the app turns it into
a text search query describing that product.

## Where it appears

- Inside the search box (SD-07), shown when the field is empty/unfocused, next to voice search.

## Who uses it

Shoppers who have a photo of something they want but don't know how to name it.

## How it works (verified behaviour)

- **Getting the image:**
  - **Desktop:** a small menu offers "From Camera" or "From Files".
  - **Mobile/tablet:** tapping opens the device file/camera picker directly.
- **Cropping:** the chosen image goes through an in-app crop widget before it is searched.
- **Recognition:** the image is sent to `POST /api/image-search`, which uses **Google
  Generative AI (`gemini-1.5-flash`)** with the prompt *"Describe the product most clearly
  shown in this picture with no more than 5 words (e.g. T-shirt black xxl)"*, localized to
  Arabic / English / Turkish. If no clear product is found it returns `NO_PRODUCT_FOUND`.
- **Result:** the returned short description (e.g. "black leather handbag") becomes the search
  text and a search runs automatically.
- **Supported formats:** JPEG, PNG, JPG, WEBP, SVG, AVIF (GIF also accepted server-side).
- **Error handling:** messages for unsupported format, no product detected, content-safety
  block, and API errors.

## Data source

| Item | Value |
|------|-------|
| Client | `components/Home/Search/SearchImage.tsx` (+ `ImageCropWidget`, `CameraWidget`) |
| API | `app/api/image-search/route.ts` |
| Provider | **Google Generative AI** — model `gemini-1.5-flash` |
| Output | Up to ~5-word product description, or `NO_PRODUCT_FOUND` |

## Current status & maturity

**Live and functional.**

## Known gaps / notes

No dedicated gaps found.


## Related features

SD-07 (Search overlay — hosts this) · SD-10 (Voice search — the other alternative input) ·
SD-24 (Virtual try-on — the other camera/photo feature).
