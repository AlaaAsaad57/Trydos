# Photo search by vector: what we built, what we tested, what is left

Built on branch `ticket/image-vector-search`, from `frontend-image-search-guide.md`.
Every claim of the guide was tested against **staging** on **2026-11-15** before
we used it. Staging: Elasticsearch **8.19.19**, index `products_catalog_develop`
(284 products, 155 with vectors, all 134 active products covered).

---

## 1. How it works in the app

```
Shopper picks / takes a photo  ->  crop  ->  browser makes a 1024 px JPEG (q 0.85)
        |
        v
POST /api/image-search/similar   (file, language, country, filters; session cookie)
        |  guard: session, 4 MB cap, 10 calls / minute / address
        v
Redis: vector of this photo (sha256 of the bytes), kept 10 minutes
        |  not stored yet?
        v
Gemini embedContent (gemini-embedding-2, 768)   <- server only
        |
        v
Elasticsearch kNN on color_image_vectors.vector
  filter = shopper rules + shopper filters (buildBaseConditions), rescore_vector, similarity floor
        |
        v
Result cards: matched photo as thumbnail, link opens the product on the matched color
```

**Filters.** The route reads `filters` (JSON): `categories`, `brands`,
`boutiques`, `colors`, `sizes`, `priceRange` (same meaning as text search).
Anything else is dropped (`readPhotoSearchFilters`). The search box sends its
own three filters (category, brand, boutique). When the shopper taps a chip
while photo results show, the box sends the same photo again with the new
filters. Redis still has its vector, so this costs a search, not a Gemini call.
An empty result shows "No products found" and stays in photo mode. The
"Search" button is hidden in photo mode, because it opens the text listing,
which knows nothing about the photo.

If the first vector search fails (5xx, network) or finds nothing, the browser falls
back to the older search: photo -> a few words -> text search
(`/api/image-search`). A `400 / 401 / 413 / 429` answer shows its message and
stops.

| File | Role |
|---|---|
| `app/api/image-search/similar/route.ts` | The new route. |
| `utils/server/imageEmbedding.ts` | The Gemini call. Model and size are constants, because they must match the backend job. |
| `services/elastic/similarProducts.ts` | The kNN query and the result cards. |
| `utils/imageToSearchJpeg.ts` | Resize in the browser before upload. |
| `components/Home/Search/requestSimilarProducts.ts` | One call to the route; used for the first search and for each filter change. |
| `components/Home/Search/SearchImage.tsx` | Vector search first (with the box filters), words search as fallback. |
| `components/Home/Search/SearchIcon.tsx` | "Similar to your photo" block; runs the photo search again when a filter changes. |
| `components/Home/Search/Results/ProductItem.tsx` | `openOnColor`: link with `?color=<color name>`. |

### Settings

| Env | Default | Meaning |
|---|---|---|
| `GEMINI_EMBEDDING_API_KEY` | falls back to `GEMINI_API_KEY` | Own key, so photo search has its own quota. **Must be set on Vercel.** |
| `IMAGE_SEARCH_MIN_SIMILARITY` | `0.65` | Lowest cosine a match may have (-1..1). |
| `IMAGE_SEARCH_TIMEOUT_MS` | `15000` | Time limit for one Gemini call. |

---

## 2. Test results

### Gemini

| Test | Result |
|---|---|
| Call from Syria (direct) | **`400 User location is not supported for the API use.`** |
| Same call from India (proxy) | `200` |
| `output_dimensionality: 768` | 768 numbers, about 1.1-3.8 s per photo |
| No `output_dimensionality` | **3072** numbers. The field is required. |
| Is the 768 output unit length? | Yes: length 0.99999993. We still normalize. |
| `task_type` sent | **Accepted** (`200`), same vector as without it. |
| GIF | **Accepted.** |
| Bytes that are not an image | `400 Provided image is not valid.` |

### Elasticsearch

| Test | Result |
|---|---|
| Field type | `nested`; `vector` is `dense_vector`, 768, `cosine`, **`int8_hnsw`** |
| A product's own stored vector as query, kNN only | **Another product ranked first** (0.99903 vs 0.99873). The 8-bit index changes the order of near-equal scores. |
| Same with `rescore_vector: { oversample: 2 }` | Correct order; same as an exact brute-force `script_score` search. |
| Nested filters inside `knn.filter` (boutique, brand, country) | **Work.** A nested filter that matches nothing returned no hits. |
| Each shopper rule alone in `knn.filter`, with a product the rule really removes (search with that product's own photo) | **All pass.** The product is rank 1-3 with no filter, and gone with the rule. Checked: `status`, `boutique.status` (nested), QA shop (nested), product country `SY` and `IQ` (nested), `brand.countries_iso` `IQ` (nested in nested), `boutique.countries_iso` `IQ` (nested in nested), `categories.status: 0` (nested). |
| Rules that remove no product with photos on staging today | `brand.status`, seller approval, `deleted_at`, `categories.countries_iso`. Not testable with real data now. `categories.countries_iso` is broken data, see section 5 item 12. |
| Full shopper filter, `SY` (125 visible, 30 hidden) | Photos of 2 visible and 2 hidden products: 20 results each, **no hidden product**, same order as an exact search. |
| `knn` inside a `nested` query instead of top-level `knn` | Not used. Top-level `knn` is what the guide and the route use. |
| Speed | The search server answers in **50-150 ms** (`took`). From our office the round trip was 0.2-60 s for the same request, so the office network is slow and unstable, not the query. Test speed from Vercel before launch. |
| `similarity` | Raw cosine: `0.96` removed a hit at cosine 0.955. |
| `_score` | `(1 + cosine) / 2`, as the guide says. |
| `inner_hits` with `size: 1` | Gives the matched photo, as the guide says. |

### Match quality (cosine against the stored vector)

| Picture | Cosine |
|---|---|
| The exact file the media server sends (webp 1024 px) | 1.0000 |
| Same photo, JPEG q85, 1024 px | 0.98 |
| Same photo, JPEG, 256 px | 0.93 |
| Same photo, 60 % centre crop | 0.92 |
| Same photo, turned 10 degrees | 0.89 |
| A garment the visible catalogue does not have (best match) | 0.72-0.75 |
| A picture with no product (map, icon) (best match) | 0.61-0.73 |
| **Text** "paisley jacket" vs a paisley jacket photo | 0.33 |
| **Text** "laptop computer" vs the same photo | 0.29 |

### The app, end to end (dev server against staging)

| Test | Result |
|---|---|
| Product 18's photo | Product 18 first, cosine 0.98, link `?color=Black` |
| Same in Arabic | Arabic names; link `/sy-ar/products/...?color=Black` |
| A map photo | 0 results -> falls back to the words search |
| No session cookie | `401` |
| Bytes that are not an image | `400` with the translated message |
| PDF | `400 Invalid file type` |
| Desktop browser: pick, crop, results, click | Opens `/sy-en/products/Vintage-Paisley-Sweater-61?color=Black` |
| 48 MB PNG | Resized in the browser, results shown (before: refused, over 4 MB) |
| Phone width, Arabic | Right to left, no sideways scroll |
| Time per search | 4-6 s warm (Gemini is most of it) |
| Product page with `?color=` | Shows that color's photos first, for every color in `sync_color_images` |

---

### Shopper filters inside the photo search (2026-11-16)

**Query level**, countries SY, TR, IQ and LB, 14 cases each: 1 and 2 brands,
boutique, category, color as the app sends it (`000000`) and with `#`, 2
colors, 1 and 2 sizes, a price range, a price only the country price can
explain (product 18: 8 in general, 28 in SY), a price with no product, brand +
price, category + color + size. For each case:

| Check | Result |
|---|---|
| Each result really matches the filter, read from the product's own fields (not from our filter code) | **Pass, all 56 cases** |
| The text search listing with the same filters finds the same products | **Pass, all 56 cases** |
| Top 20 equal an exact ranking of all visible products that match, for a photo inside and a photo outside the filter | **Pass, all 56 cases** |

**Route level** (dev server, staging): 10 calls (filters, countries, Arabic,
broken filters). Each answer was compared, product by product and in order,
with an exact list made from the vector the route stored in Redis, an exact
cosine ranking, the 0.65 floor, the shopper rules and the independent judge.
**All 10 equal.** A new photo made exactly 1 Gemini call. Each filter change
on the same photo made **0** (counted from the proxy log, not from timing).

**Browser** (phone size, dev server): photo, then brand chip (only that brand
shown, checked in the search backend, 0 Gemini calls), chip off (first
products back), category chip (2 products, both in the category), Clear. The
page sent the right filters each time and showed the route's products in
order. No sideways scroll.

## 3. Where the guide was wrong or incomplete

1. **"The browser can call Gemini directly."** It cannot for us: Gemini refuses
   Syria. The call must go through our server. (We did that.)
2. **"`task_type`: this model doesn't accept it."** It is accepted and ignored.
   Not sending it is still right.
3. **"GIF is not accepted."** It is accepted.
4. **"Only top-level fields work in `knn.filter`; use `post_filter` for nested
   ones."** Nested filters work in `knn.filter` on 8.19. We use the full shopper
   rules there, so no results are lost after the top `k`.
5. **"`similarity: 0.5` is a starting point."** It removes nothing: unrelated
   pictures score 0.61-0.73. We use 0.65.
6. **"Sanity test: that product should come back first."** Not without
   `rescore_vector`, because of `int8_hnsw`. The guide does not mention the
   quantization.
7. **Text search by vector** ("red summer dress" lands near red summer dresses):
   the scores are too close to rank well (0.33 right vs 0.29 wrong). We did not
   build it. Text search stays as it is.
8. **`color_id`** cannot open the product on a color: the storefront's color
   data (`sync_color_images`) has names, not ids. We use the matched photo name
   to find the color name.

---

## 4. Fixed in the app while doing this

| Problem | Fix | Test (seen red, then green) |
|---|---|---|
| A phone photo over 4 MB was refused (`413`) by the photo route. | Browser resize to 1024 px JPEG for both routes. | `tests/utils/imageToSearchJpeg.test.ts` (new code; 48 MB PNG checked in the browser) |
| `getRelatedProducts` read the full product, now with all photo vectors: 85-166 KB instead of 20-35 KB per call. | `_source: ["categories.gender", "categories.group_age"]`. | `tests/services/elastic/elasticSearch.test.ts` "reads only the category pair ..." |
| The crop editor rendered `<img src="">` before the file was read (React warning; the browser may fetch the page again). | `src={imageUrl \|\| undefined}`. | `tests/components/global/ImageCropWidget.test.tsx` "never renders an empty src ..." |
| `Invalid file type`, `No product detected`, `Missing required fields` had no `ar` / `tr` / `ku` translation. | Added to all three files. | `pnpm lint:i18n-parity` |

All other catalogue queries were checked: they list their `_source` fields or
use `size: 0`.

---

### Seen while testing, not caused by this work

- Tapping a brand chip in the search box (no photo involved) logs two React
  warnings: an `<img>` with `src=""`, and a `next/image` with no `src`. One of
  the chip lists renders an item with no picture.
- `stroke-width` instead of `strokeWidth` in `WebViewVideoCall.tsx`,
  `WebViewVoiceCall.tsx` and `BuyersCommentMenu.tsx`.
- In photo results and text results, the product name text is light grey
  (the existing `ProductItem` style).

## 5. For the backend and Elasticsearch team

1. **Set a Vercel env var.** `GEMINI_EMBEDDING_API_KEY` (a key in a Google
   project that is not the backend job's project). Without it, the route uses
   `GEMINI_API_KEY`, and the vector search may fail and fall back to words.
2. **Vercel function region must be a Gemini-supported country.** The default
   (`iad1`, USA) is fine. Never move these routes to a region Google blocks.
3. **Customer photos and the free tier.** Google's free tier may use content to
   improve its products, and asks not to send personal data. Customer photos
   can show faces or homes. The EEA, Switzerland and the UK may only use the
   paid tier. **Decide before launch:** paid tier for this key, or a privacy
   notice.
4. **Tune the threshold with real photos.** Collect 20-50 real shopper photos
   (with and without a matching product) and set `IMAGE_SEARCH_MIN_SIMILARITY`
   from their scores. The current 0.65 is based on a small test set.
5. **Index: think about `index_options`.** `int8_hnsw` needs
   `rescore_vector` to rank near-equal photos right. With only ~900 vectors,
   `hnsw` (float) or `bbq_hnsw` + rescore is a cheap option. If the index stays
   `int8_hnsw`, every client must send `rescore_vector`.
6. **The `colors` field is incomplete.** Product 6 has 3 colors in
   `sync_color_images` but 1 in `colors`; product 18 has 2 and 0. The storefront
   drops colors that are not in `colors` from search cards, and the color
   filter misses them. Please fill `colors` from the same source as
   `sync_color_images`.
7. **Add the color name to each vector entry** (`color_image_vectors[].color_name`
   or `color_option`), or add `color_id` to `sync_color_images`. Today the only
   link from a matched photo to its color is the photo file name.
8. **Hidden products have vectors too** (status 0 / deleted). Not a bug (the
   filter hides them), but the job could skip them to save quota.
9. **Staging data reuses the same photo for many products** (products 18, 38
   and 310 have byte-identical photos). Photo search then shows them as equal
   matches. Real data will not, but tests on staging should expect it.
10. **Read-only search key.** The storefront reads Elasticsearch with a full
    user. A read-only API key limited to the catalogue indices would be safer.
12. **Category restricted countries never work (data bug, all queries).**
    `countries_iso` is the list of countries where an item is restricted.
    `categories.countries_iso.iso` should hold a plain code like `TR`. On
    staging it holds a JSON string, wrapped one or more times:
    - `[{"ISO":"[{\"ISO\":\"[]\"}]"}]` on 139 products: an empty list wrapped
      twice. These categories restrict nothing, so shoppers see the right
      result, but the format is wrong.
    - `[{"ISO":"TR"}]` on 1 product, and an `LB` value wrapped four times on
      1 product: **real restrictions that are lost.** The shopper rule
      `categories.countries_iso.iso = TR` matches **0** products, in normal
      listings too, not only in photo search. So these products still show
      in Turkey and Lebanon.

    The value seems to be wrapped again on each sync. Please fix the indexing
    job so the field gets one plain code per entry (`[{"iso":"TR"}]`, or `[]`
    for none), then re-index. Product, brand and boutique `countries_iso` are
    correct (plain codes) and work.
13. **Guide text.** Please update `frontend-image-search-guide.md` with
    section 3 above.

---

## 6. How to run it locally from Syria

Gemini refuses Syria, so a local dev server needs a proxy for Node's `fetch`
(Node ignores `HTTPS_PROXY`). Use a preload file that sets undici's
`EnvHttpProxyAgent`, and start with
`NODE_OPTIONS="--require=<file>" pnpm dev` (`-r` does not work: Next rewrites
it to `--r=`, which Node refuses). Keep the Elasticsearch host in `NO_PROXY`.
