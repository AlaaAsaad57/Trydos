# Shop API — Product Create/Update: Outstanding Backend Work (FE → BE)

> **From:** Front-end (seller dashboard product editor)
> **To:** Back-end team
> **Re:** follow-ups arising from `shop-seller-product-create-answers.md`
> **Date:** 2026-07-16
>
> Your answers unblocked the create flow — thank you, the code-verified field
> tables were exactly what we needed. We have wired `add` against them and the
> flow is functionally complete client-side.
>
> This document is what remains **on your side**, ordered by what blocks us.
> §1 is a question we cannot ship without. §2 is a correction to one of your
> answers. §3 is your own consolidated list, re-prioritised against what the FE
> now does. §4 records the contract we built to, so you can validate us.

---

## 1. BLOCKER — `tax` / `tax_type` omit-on-**update** semantics

**We need an explicit answer before our change can merge.**

Per Q10 we now **omit `tax` and `tax_type` entirely** from the payload. Your
guidance was:

> *"Until fixed: **omit both fields**; the server defaults to `tax = 0`,
> `tax_type = 'percent'`."*

The problem: that row sits in a table headed **"Create behavior"**, and `tax` is
**absent** from your Q10-note list of update-required keys. So update semantics
are undocumented, and our builder is shared between create and update.

**Q-A. On `POST /api/v1/shop/products/{id}/update`, when `tax` and `tax_type`
are omitted from the body, does the DTO:**

- **(a)** keep the product's existing `tax` / `tax_type`, or
- **(b)** reset them to `0` / `'percent'`?

If the answer is **(b)**, our omission silently zeroes the stored tax on **every
product, on its first save** — a catalog-wide data loss far worse than the
mis-scaling bug we are working around. We will hold the change until you
confirm.

Please answer with the DTO line (`$data['tax'] ?? …`), not from memory.

**Q-B.** What is the ETA on the `tax_type` precedence fix (§3 item 4)? If it is
near, we would rather wait and keep sending both fields than risk (b).

> **Context:** the website seller dashboard presumably posts the same fields, so
> this bug predates our editor and existing catalog data is already shaped by
> it. We do not want to diverge from the web dashboard unilaterally.

---

## 2. Correction — Q10-note's claim about our builder was not accurate

Your Q10-note says of the update-required keys:

> *"Your `buildUpdateFormData` already sends all of them; don't strip."*

That was **not true** for three of them. `label`, `model_number`, and
`report_ref_number` were sent **conditionally** (`if (form.model_number) …`), so
whenever a seller *cleared* one of those fields the key was omitted — and per
your own note, the DTO reads them without a fallback, which errors the update.

We have fixed this on our side (all three are now always sent, empty string as
the null stand-in). Flagging it only because that answer was presented as
verified against our code — worth a second look at any other place the answers
assume FE behavior rather than checking it.

**Q-C.** Is empty string (`""`) an acceptable stand-in for null on these three
multipart keys, or does the DTO need something else? Multipart has no native
null.

---

## 3. Consolidated follow-up list

Your list, re-ordered by what blocks us, with FE status noted.

### P1 — High

| # | Item | Why it matters to us | FE status |
|---|---|---|---|
| 1 | **Widen `categoryLookups` gate** to `CREATE_PRODUCT OR UPDATE_PRODUCT OR SUPER_ADMIN` (Q9) | A `CREATE_PRODUCT`-only role gets **403 mid-create** on the cascading category dropdowns. There is no clean client-side workaround. | Blocked. Interim: role setup must also grant `UPDATE_PRODUCT`. |
| 2 | **Descriptor values: save endpoint + `/edit` prefill** (Q11) | The only genuine **feature gap**. We render descriptor inputs but cannot persist them. Requested shape: `POST /api/v1/shop/products/{id}/descriptors` with `descriptors[<group_id>][<descriptor_id>] = <value>` (same as the web `syncDescriptors`), plus `descriptor_values: [{descriptor_group_id, descriptor_id, value}]` on the `/edit` response. | We send **nothing** for descriptors and will keep sending nothing until this ships. |

### P2 — Medium (correctness bugs)

| # | Item | FE status |
|---|---|---|
| 3 | **`tax_type` precedence bug** — any truthy `tax_type` (incl. `"percent"`) makes the server treat `tax` as flat and currency-convert it | We omit both fields and have **disabled the tax inputs read-only** in the editor. Sellers cannot set tax at all until this ships. See §1. |
| 4 | **`multiplyQTY` precedence bug** — sending `"off"` *enables* it | Already safe: we only ever send `multiplyQTY="on"`, and omit the key entirely to disable. No FE change needed, but please still fix — it is a trap for any other client. |
| 5 | **Pin `status` to 0 on create** (ignore client value) | Already safe: we never send `status`. Same note as above — fix for defence in depth. |

### P3 — Low

| # | Item | FE status |
|---|---|---|
| 6 | **Weight validator `'liter'` → `'l'`** (Q7) | Already future-proofed: we require `weight > 0` for both `pc` and `l`. |
| 7 | **Mirror `count_of_pieces` 1–100 rule on update** (Q13) | We now validate 1–100 client-side on **both** create and update. Server-side update still accepts out-of-range values from any other client. |
| 8 | **Honor `cloud_video` on create**, or confirm the two-step flow is intended | We have **hidden the video section in create mode** — offering it would silently drop the upload. Sellers add video on the edit screen after the redirect. If you make create honor it, tell us and we will re-enable. |

### Docs

| # | Item |
|---|---|
| 9 | Correct `shop-seller-product.md` (the create doc): endpoints, `sync_color_images`, colors/sizes representation, units vocabulary, `images[]` example, `discount_price`, lookups nesting. Every one of these was wrong and cost us a round-trip. |
| 10 | **Capture the four §6 payloads on staging** — still outstanding, and still the highest-leverage thing you can give us. See §5. |

---

## 4. What the FE now sends (validate us against this)

Wired per your answers. One builder (`buildUpdateFormData`) feeds both endpoints.

**Endpoints**
- `GET /api/v1/shop/products/lookups` — create lookups, read **flat under `data`**
- `POST /api/v1/shop/products` — create
- `GET /api/v1/shop/products/{id}/edit` — lookups read under **`data.lookups`**
- `POST /api/v1/shop/products/{id}/update` — update

**Encoding:** multipart FormData for create and update (no file uploads — images
and videos are filenames of already-uploaded media).

| Field | What we send |
|---|---|
| `colors[]` | color **codes** (`"#000000"`) |
| `sizes[]` | size **names** (`"S"`) |
| variant keys | `{ColorName}-{SizeName}`, all whitespace stripped, `.` → `_` — e.g. `Black-M2`. Keys: `price_<k>`, `price_<k>_discount`, `price_<k>_extra`, `price_<k>_luck`, `qty_<k>`, `sku_<k>`, `barcode_<k>` |
| `images[]` | bare stored **filenames** (last path segment), never URLs |
| `sync_color_images` | **JSON string** of `[{color_code, color_name, images:[{image, position}], position}]`; image strings byte-identical to `images[]` |
| `extra_price_for_country` | **JSON string** `[{"country_iso":"SA","extra_price":12}]` |
| `custom_data` | indexed `custom_data[i][language_code|name|description]` |
| `discount_price` | canonical name (never `discount`) |
| `unit` | one of `pc,kg,gms,l` |
| `multiplyQTY` | `"on"` when enabled, **key omitted** when disabled — never `"off"` |
| `packed_after_ordering` | `"on"` or omitted |
| `label`, `model_number`, `report_ref_number` | **always present**, `""` when empty |
| `location_id` | conditional (not in your update-required list) |
| `seller_product_id` | **now optional** client-side, per Q12 |
| `tax`, `tax_type` | **not sent** — see §1 |
| `status` | **never sent** |
| `cloud_video`, `remove_videos[]` | update only; hidden in create mode |
| descriptors | **not sent** — no key exists (Q11) |

---

## 5. Still the biggest ask — the staging captures

Everything above is built against your code-verified tables, which we trust. But
§2 shows what happens when an answer is inferred rather than observed, and the
create doc showed what happens when examples are hand-written.

Please still capture, from a real successful request on staging:

1. Raw multipart body + headers of one successful `POST /api/v1/shop/products`
   with 2 colors × 2 sizes, per-color image assignments, `en` + `ar`
   `custom_data`, 1 label, 1 tag, 1 restricted country, 1 per-country extra price.
2. The matching `POST /api/v1/shop/products/{id}/update` body.
3. The `GET /api/v1/shop/products/{id}/edit` response after both saves.
4. The unedited `GET /api/v1/shop/products/lookups` response.

With those we can diff our payload byte-for-byte against a known-good one and
close this out for good.

---

*FE references: `components/SellerDashboard/productEdit/helpers.ts`
(`buildUpdateFormData`, `validate`), `components/SellerDashboard/productEdit/ProductEditor.tsx`,
`services/sellerDashboard/index.ts`. Prior thread:
`shop-seller-product-create-gaps-and-questions.md` → `shop-seller-product-create-answers.md`.*
