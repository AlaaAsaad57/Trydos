# Photo & Text Search with Vectors: Frontend Guide

This guide is for the frontend developer building **search by photo** (and optionally **search by text meaning**) on top of the product catalog.

The backend side is done: every product color image now has a vector, stored inside each product in `products_catalog_develop`. Your job is to turn the customer's photo (or text) into a vector **the same way**, then ask Elasticsearch for the nearest products.

---

## 1. How it works (30 seconds)

```
Customer photo / text
        │
        ▼
Gemini embedContent  ──►  768 numbers (a "vector")
        │
        ▼
normalize to length 1
        │
        ▼
Elasticsearch kNN on products_catalog_develop  ──►  products whose images look most similar
```

- A **vector** is a list of 768 numbers that describes what's in an image. Similar images give vectors that are close together.
- Text and images live in **the same space**: the text "red summer dress" lands near photos of red summer dresses. So the same query works for both.

---

## 2. What the backend gives you

Each product document in `products_catalog_develop` has a new **nested** field:

```json
"color_image_vectors": [
  {
    "image": "product-3-color-3-1.jpg",
    "color_id": 3,
    "uuid": "9b2f…",
    "vector": [0.0123, -0.0456, "… 768 numbers …"]
  },
  {
    "image": "product-3-color-4-1.jpg",
    "color_id": 4,
    "uuid": "71ac…",
    "vector": ["…"]
  }
]
```

| Field | Meaning |
|---|---|
| `image` | Image filename, in the same `product` folder as other product images. Build its URL the same way you already build product image URLs. |
| `color_id` | The product color this image belongs to. Use it to preselect the matching color on the product page. |
| `uuid` | Id of the product color images record (rarely needed). |
| `vector` | 768 numbers, unit length, `dense_vector` indexed with `cosine` similarity. |

One entry per image. A product with 3 colors × 2 images has 6 entries.

---

## 3. The contract: settings that MUST match

If any of these differ from the backend, your vectors can't be compared with ours and results will be random.

| Setting | Value |
|---|---|
| API | Gemini API, `embedContent` |
| Model | **`gemini-embedding-2`** |
| `output_dimensionality` | **`768`** |
| `task_type` | **Do not send it** (this model doesn't accept it) |
| Normalization | **Normalize the result to unit length** (divide every number by the vector's length) |
| One input per call | One photo **or** one text per request. Several parts in one request produce **one combined** vector. |

---

## 4. Step 1: Get a vector from Gemini

### Request

```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent
x-goog-api-key: <GEMINI_API_KEY>
Content-Type: application/json
```

**Photo:**

```json
{
  "content": {
    "parts": [
      { "inline_data": { "mime_type": "image/jpeg", "data": "<BASE64 OF THE IMAGE>" } }
    ]
  },
  "output_dimensionality": 768
}
```

**Text:**

```json
{
  "content": { "parts": [ { "text": "red summer dress" } ] },
  "output_dimensionality": 768
}
```

### Response

```json
{ "embedding": { "values": [0.0123, -0.0456, "… 768 numbers …"] } }
```

### Image rules

- Accepted types: `image/png`, `image/jpeg`, `image/webp`, `image/bmp`, `image/heic`, `image/heif`, `image/avif`.
- **GIF is not accepted**: convert to JPEG first.
- The image must be sent **inline as base64**. Gemini doesn't fetch URLs.
- Recommended: resize on the client before sending (for example longest side ≈ 1024 px, JPEG quality ≈ 85). Smaller upload, same search quality.

### Example (JavaScript)

```js
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent';

async function embed(part) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({ content: { parts: [part] }, output_dimensionality: 768 }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`); // 429 = rate limit / quota, see section 8
  const values = (await res.json())?.embedding?.values;
  if (!Array.isArray(values) || values.length !== 768) throw new Error('Bad vector from Gemini');
  return normalize(values);
}

// Step 2: unit length
function normalize(v) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map(x => x / norm);
}

// photo: base64 string without the "data:image/jpeg;base64," prefix
const photoVector = await embed({ inline_data: { mime_type: 'image/jpeg', data: base64 } });
const textVector  = await embed({ text: 'red summer dress' });
```

---

## 5. Step 2: Normalize

Always normalize (code above). The backend stores normalized vectors, and Google's docs aren't consistent about whether 768-size output is already normalized. Normalizing an already-normalized vector changes nothing, so it's always safe.

---

## 6. Step 3: Search Elasticsearch (nested kNN)

```json
POST products_catalog_develop/_search
{
  "knn": {
    "field": "color_image_vectors.vector",
    "query_vector": [0.0123, -0.0456, "… 768 numbers …"],
    "k": 20,
    "num_candidates": 200,
    "filter": {
      "bool": {
        "filter":   [ { "term": { "status": 1 } } ],
        "must_not": [ { "exists": { "field": "deleted_at" } } ]
      }
    },
    "inner_hits": {
      "size": 1,
      "_source": ["color_image_vectors.image", "color_image_vectors.color_id"]
    }
  },
  "_source": {
    "excludes": ["color_image_vectors"]
  }
}
```

| Part | Why |
|---|---|
| `field` | The nested vector field. |
| `query_vector` | Your normalized 768 numbers. |
| `k` | How many products to return (page size). |
| `num_candidates` | How many candidates Elasticsearch looks at before picking the best `k`. Higher = more accurate, slower. Start with `10 × k`. |
| `filter` | Applied **during** the search, so you still get `k` results. Only **top-level** product fields work here (`status`, `deleted_at`, `boutique_id`, `brand_id`, …). |
| `inner_hits` | Tells you **which image** (and color) of the product matched best. |
| `_source.excludes` | **Important**, see below. |

### ⚠️ Always exclude the vectors from `_source`

Every catalog document now carries up to dozens of 768-number vectors. **Any** query you run against `products_catalog_develop` (search, listing, product page) that returns full `_source` will now download all of them. Either:

- list the fields you need: `"_source": ["id", "name", "thumbnail", "offered_price"]`, or
- exclude the field: `"_source": { "excludes": ["color_image_vectors"] }`.

This applies to your **existing** queries too, not only photo search.

### Filters on nested fields

Fields that are themselves nested (`countries_iso`, `category_ids`, `boutique`, …) can't go in `knn.filter`. If you need them (for example hiding products blocked in the customer's country), use `post_filter`, and raise `k` a bit because `post_filter` removes results **after** the top `k` are picked:

```json
"post_filter": {
  "bool": {
    "must_not": [
      { "nested": { "path": "countries_iso", "query": { "term": { "countries_iso.iso": "SY" } } } }
    ]
  }
}
```

### Optional: minimum similarity

To drop weak matches, add `"similarity": 0.5` inside `knn`. For cosine this is the raw cosine similarity (−1…1). **0.5 is only a starting point**: tune it by testing real photos.

---

## 7. Step 4: Read the result

This is the real shape Elasticsearch returns for the query above (one product shown, values shortened):

```json
{
  "took": 13,
  "timed_out": false,
  "hits": {
    "total": { "value": 1, "relation": "eq" },
    "max_score": 0.97,
    "hits": [
      {
        "_index": "products_catalog_develop",
        "_id": "3",
        "_score": 0.97,
        "_source": { "id": 3, "name": "…", "thumbnail": { "file_path": "/product/…" }, "offered_price": 120 },
        "inner_hits": {
          "color_image_vectors": {
            "hits": {
              "total": { "value": 6, "relation": "eq" },
              "max_score": 0.97,
              "hits": [
                {
                  "_index": "products_catalog_develop",
                  "_id": "3",
                  "_nested": { "field": "color_image_vectors", "offset": 1 },
                  "_score": 0.97,
                  "_source": { "image": "product-3-color-4-1.jpg", "color_id": 4 }
                }
              ]
            }
          }
        }
      }
    ]
  }
}
```

### What each key means

**Top level**

| Key | Meaning |
|---|---|
| `took` | Time Elasticsearch spent on the search, in milliseconds. |
| `timed_out` | `true` if the search stopped early. Normally `false`. |
| `hits.total.value` | How many products matched. With kNN this is at most `k`. |
| `hits.max_score` | Score of the best product in this response. |
| `hits.hits` | **The result list: one item per product**, best match first. |

**Each product in `hits.hits[]`**

| Key | Meaning |
|---|---|
| `_index` | Always `products_catalog_develop`. |
| `_id` | **The product id**, as a string (`"3"`). The catalog uses the product id as its document id, so this is always there, whatever you put in `_source`. Use `Number(hit._id)` if you need a number. |
| `_score` | How similar this product is to the customer's photo/text: the score of its **best-matching image**. Between 0 and 1, higher is more similar (for cosine, `_score = (1 + cosine) / 2`). |
| `_source` | The product fields you listed in the query's `_source` (`id`, `name`, `thumbnail`, `offered_price`, …). `_source.id` is the product id as a number, but only if you asked for `id`. |
| `inner_hits.color_image_vectors` | **Which image of this product matched.** The name is the nested field name. |

**Inside `inner_hits.color_image_vectors.hits`**

| Key | Meaning |
|---|---|
| `total.value` | How many images of this product were compared (usually all of its images). |
| `max_score` | Score of this product's best image (same as the product's `_score`). |
| `hits[]` | The best matching images of this product, best first. With `"size": 1` in the query you get only the best one, at `hits[0]`. |
| `hits[0]._id` | The product id again (the image belongs to this product). |
| `hits[0]._nested.field` | Always `color_image_vectors`. |
| `hits[0]._nested.offset` | Position of the matched image in the product's `color_image_vectors` list (0 = first). Rarely needed. |
| `hits[0]._score` | Similarity score of this image. |
| `hits[0]._source.image` | **Filename of the matched image.** Build its URL like other product images. |
| `hits[0]._source.color_id` | **The color of the matched image.** Use it to open the product page on that color. |

### Reading it in code

```js
const results = response.hits.hits.map(hit => {
  const match = hit.inner_hits?.color_image_vectors?.hits?.hits?.[0]?._source ?? {};
  return {
    productId: Number(hit._id),   // the product
    score: hit._score,            // 0..1, higher = more similar
    product: hit._source,         // fields you asked for
    matchedImage: match.image,    // which photo of the product matched
    matchedColorId: match.color_id, // which color that photo belongs to
  };
});
```

- Results are **products**, sorted by their **best-matching image**. A product appears once even if several of its images match.
- Good UX: show `matchedImage` as the result thumbnail and open the product page on `matchedColorId`.
- This shape was checked against a real Elasticsearch response.

---

## 8. Things to know

| Topic | Detail |
|---|---|
| **Coverage** | Vectors are added gradually (free-tier quota, active products first). Until that finishes, some products have no `color_image_vectors` and simply won't appear in photo results. They still appear in normal search. |
| **Freshness** | New or changed product images get vectors within ~5 minutes (when quota allows). |
| **Gemini errors** | `429` = rate limit or daily quota reached. Show a friendly message and offer normal text search. Don't retry in a tight loop. |
| **Shared quota** | If the frontend uses the **same** Gemini API key/project as the backend job, you share the same per-minute and per-day limits, and the backend job can use up the quota. Ask for a **separate key/project** for the frontend. |
| **No results** | Possible if the catalog has nothing similar or coverage is still low. Fall back to normal search. |
| **Elasticsearch version** | Nested kNN with `inner_hits` needs ≥ 8.11. Our server is confirmed. |

---

## 9. ⚠️ Raise with the team before launch

1. **Keys in the browser.** If the browser calls Gemini and Elasticsearch directly, the Gemini API key and the Elasticsearch credentials are visible to every visitor. Anyone could use up the Gemini quota or read and change indices. Suggested: put Gemini behind a small proxy endpoint, and use a **read-only** Elasticsearch key limited to `products_catalog_develop`.
2. **Customer photos on Gemini's free tier.** Google's terms for unpaid services say content may be used to improve their products and reviewed by humans, and ask not to send personal information. Customer photos can contain faces or homes. Also, apps serving users in the EEA, Switzerland or the UK may only use the paid tier. This needs a decision before photo search goes live.

---

## 10. Checklist

- [ ] Gemini call uses `gemini-embedding-2`, `output_dimensionality: 768`, no `task_type`.
- [ ] One photo or one text per request.
- [ ] GIF converted to JPEG; images resized before upload.
- [ ] Vector length checked (768) and normalized.
- [ ] kNN query on `color_image_vectors.vector` with `inner_hits`.
- [ ] `filter` uses only top-level fields; nested filters go in `post_filter`.
- [ ] `color_image_vectors` excluded from `_source` in **every** catalog query.
- [ ] Matched image / color from `inner_hits` shown in the UI.
- [ ] `429` and empty results handled with a fallback to normal search.
- [ ] Sanity test: embed one of a product's own images; that product should come back first with a score close to 1.
- [ ] Security and free-tier questions (section 9) raised with the team.

---

*Backend design reference: `docs/color-image-vectors-cron.md` (section 9 is the frontend contract).*
