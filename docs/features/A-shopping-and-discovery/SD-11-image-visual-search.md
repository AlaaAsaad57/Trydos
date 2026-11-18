# SD-11 — Image / Visual Search

| | |
|---|---|
| **Feature ID** | SD-11 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-11-17 (against `development`) |
| **Source of truth** | `components/Home/Search/SearchImage.tsx`, `components/Home/Search/SearchIcon.tsx`, `app/api/image-search/similar/route.ts`, `services/elastic/similarProducts.ts` |

---

## What it is

Search by picture: the shopper uploads or snaps a photo of a product, and the app shows the
products whose photos look most like it (search by vector). There is no text step.

## Where it appears

- Inside the search box (SD-07), shown when the field is empty/unfocused, next to voice search.

## Who uses it

Shoppers who have a photo of something they want but don't know how to name it.

## How it works (verified behaviour)

- **Getting the image:**
  - **Desktop:** a small menu offers "From Camera" or "From Files".
  - **Mobile/tablet:** tapping opens the device file/camera picker directly.
- **Cropping:** the chosen image goes through an in-app crop widget before it is searched.
- **Search:** the browser makes a 1024 px JPEG and sends it to `POST /api/image-search/similar`
  with the language, the country and the search box filters. The route turns the photo into a
  vector (Gemini `gemini-embedding-2`, 768 numbers) and asks Elasticsearch for the nearest
  products (kNN), inside the shopper rules and the filters.
- **Result:** a "Similar to your photo" block with the products, best match first. Each card
  shows the matched photo and opens the product on the matched color.
- **Chips:** the brand, category and boutique chips are the chips of the photo results, as text
  search chips are the chips of the text results. Tapping a chip searches the same photo again
  with the new filter (the vector is kept 10 minutes, so no new Gemini call). No "Load More".
- **No products:** shows "No products found". There is no fallback to a words search.
- **Supported formats:** JPEG, PNG, JPG, WEBP, SVG, AVIF (GIF also accepted server-side).
- **Error handling:** messages for unsupported format, unreadable image, too many calls, and a
  failed search.

## Data source

| Item | Value |
|------|-------|
| Client | `components/Home/Search/SearchImage.tsx`, `SearchIcon.tsx`, `requestSimilarProducts.ts` (+ `ImageCropWidget`, `CameraWidget`) |
| API | `app/api/image-search/similar/route.ts` |
| Provider | **Google Gemini** embedding `gemini-embedding-2` (768) + Elasticsearch kNN |
| Output | Up to 20 products and their chip lists |
| Details | `docs/image-search-by-vector.md` |

## Current status & maturity

**Live and functional.**

## Known gaps / notes

No dedicated gaps found.


## Related features

SD-07 (Search overlay — hosts this) · SD-10 (Voice search — the other alternative input) ·
SD-24 (Virtual try-on — the other camera/photo feature).
