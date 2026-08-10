# Seller Dashboard — Mobile API Guide

Build the **Seller Dashboard** into the app. This covers every section a shop
member can use **except Orders** (already handled separately). Match the
website's screens for layout and behaviour; this doc is the API contract.

---

## Base URLs & keys (to be provided)

> Fill these in before use. Everywhere below, `{NAME}` refers to a row here.

| Name | Value | Used for |
|------|-------|----------|
| `{MARKET_API}` | `https://trydos_develop.ramaaz.dev/api/v1` | Products, Gallery, Shop Info, Team, Boutiques, Excel, Permissions |
| `{WEB_API}` | `https://dev.trydos.com` | Comments & Reviews |
| `{STORIES_API}` | `NEXT_PUBLIC_STORIES_BACKEND_URL` | Seller Stories |
| `{MEDIA}` | `https://media_server.ramaaz.dev` | Media server **host**. Uploads live under `/gated/…`, file reads under `/file/upload/…` |
| `{MEDIA_IMG}` | `https://media_server.ramaaz.dev/image/upload` | Base for **displaying** a stored image path (older drafts of this doc called this `{MEDIA}`) |
| `{MEDIA_KEY}` | `pfxqJTg8PgGf9rKEyvred+odXPgGU4wFtOJnJPUlqngdell@DESKTOP-0DHEE8R` | `x-api-key` header on every upload — **read the warning in [Uploads](#uploads) before shipping it** |

---

## Auth — what to send

There are three token setups. Sending the wrong one fails auth.

| Sections | Base URL | Headers |
|----------|----------|---------|
| Products, Gallery, Shop Info, Team, Boutiques, Excel, Permissions | `{MARKET_API}` | `Authorization: Bearer <MARKET_TOKEN>` **+** `X-Seller-ID: <sellerId>` |
| **Comments & Reviews** | `{WEB_API}` | `Authorization: Bearer <MARKET_TOKEN>` (`sellerId` goes in the query/body) |
| Seller Stories | `{STORIES_API}` | `Authorization: Bearer <STORIES_TOKEN>` (a **different** token; `sellerId` goes in the body) |
| Any file upload | `{MEDIA}` | `x-api-key: {MEDIA_KEY}` **+** `X-Upload-Ticket` (the ticket call itself uses the market token — see [Uploads](#uploads)) |

Also send `country` and `lang` headers on `{MARKET_API}` calls (drive currency and
language).

**Response envelope:** most responses are `{ success, message, data }`. **Check
`success` — don't rely on HTTP status alone.** Product validation errors come back
as **HTTP 422** with `detailed_error: [{ message }]`.

---

## Permissions (do this first, then gate every screen)

**`GET {MARKET_API}/shop/auth/permissions`** — returns all shops the user can
manage. Call once on dashboard open; build the shop switcher from it.

```jsonc
{
  "success": true,
  "data": [
    {
      "seller_id": 123,
      "shop_name": "My Shop",
      "shop_role": "OWNER",
      "permissions": ["READ_PRODUCTS", "CREATE_PRODUCT", "READ_COMMENTS", "..."]
    }
  ]
}
```

**Gating rule:** a control is allowed if
`permissions.includes(<PERM>) || permissions.includes("SUPER_ADMIN")`.
`SUPER_ADMIN` unlocks everything.

| Section | Permissions |
|---------|-------------|
| Products | `READ_PRODUCTS`, `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `CHANGE_PRODUCT_STATUS` |
| Gallery | `READ_PRODUCT_IMAGES`, `UPLOAD_PRODUCT_IMAGES`, `DELETE_PRODUCT_IMAGES` |
| Stories | `READ_STORY`, `CREATE_STORY`, `DELETE_STORY` |
| Shop Info | `READ_SHOP_INFO`, `UPDATE_SHOP_INFO` |
| Comments | `READ_COMMENTS`, `REPLY_COMMENT`, `EDIT_REPLY`, `DELETE_REPLY` |
| Team members | `READ_EMPLOYEES`, `CREATE_EMPLOYEES`, `UPDATE_EMPLOYEES`, `DELETE_EMPLOYEES` |
| Roles | `READ_ROLES`, `CREATE_ROLES`, `UPDATE_ROLES`, `DELETE_ROLES` |
| Boutiques | `READ_BUTIKS`, `CREATE_BUTIKS`, `UPDATE_BUTIKS`, `DELETE_BUTIKS`, `CHANGE_BOUTIQUE_STATUS` |
| Excel | *(none of its own — allowed if `CREATE_PRODUCT` or `UPDATE_PRODUCT`)* |
| Admin / bypass | `SUPER_ADMIN`, `USER_MANAGEMENT_ACCESS` |

Client gating is UX only — the backend re-enforces every permission.

---

## Products

Browse the shop's products and toggle whether each one is purchasable.

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List products | GET | `{MARKET_API}/shop/products?page=N` | `READ_PRODUCTS` |
| Change status | POST | `{MARKET_API}/shop/products/{id}/change-status` | `CHANGE_PRODUCT_STATUS` |

- **List** → `{ data: { products: [...], meta: { current_page, last_page } } }`.
  Only `?page` (page 1 sends no param). Card fields: `product_id` (fallback `id`),
  `name`, `images[]`, `status` (`1` = purchasable), `unit_price`, `current_stock`,
  `categories[0].name`.
- **Change status:** body `{ status: 0|1 }`. `0` always works. `1` succeeds only if
  the product passes activation checks; otherwise **422** with
  `detailed_error: [{ message }]` listing what to fix (approval, `en` translation,
  stock, boutique, sync color images) — render it as a checklist.

---

## Gallery (product images)

A shared image library per shop: browse, upload (single/multi/folder), copy URL,
preview, delete one or many.

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Browse | GET | `{MARKET_API}/shop/products/images?page=&per_page=&search=` | `READ_PRODUCT_IMAGES` |
| Save uploaded | POST | `{MARKET_API}/shop/products/images` | `UPLOAD_PRODUCT_IMAGES` |
| Delete (single & bulk) | DELETE | `{MARKET_API}/shop/products/images` | `DELETE_PRODUCT_IMAGES` |

- Upload flow: upload the files to `{MEDIA}` (folder `product`, see
  [Uploads](#uploads)) → then **Save** with `{ images: [{ url, name }] }`.
- The media server returns only a **filename** (e.g. `1781080470388204.png`) —
  build `/product/<filename>` before saving.
- **Delete** always takes `{ ids: [...] }` — even for one image.
- **Browse response** is tolerant: images at `data.images` / `data.data` /
  `data`; meta at `data.meta` (`current_page`, `last_page`, `total`). Item:
  `{ id, url?|path?, name?|file_name? }` — display URL = `url ?? path`, and `id` is
  what you send to delete.

---

## Seller Stories

Per-shop stories (image or short video, video ≤ 60 s / ≤ 10 MB), optionally with an
outbound link and/or linked to a product.

> Uses `{STORIES_API}` and the **STORIES token** — not the market token — and **no**
> `X-Seller-ID` (the shop is the `seller_id` field in the query/body).

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List | GET | `{STORIES_API}/api/v1/stories/seller-stories?user_id=&seller_id=&page=&perPage=` | `READ_STORY` |
| Add | POST | `{STORIES_API}/api/v1/stories/add-seller-story` | `CREATE_STORY` |
| Delete | POST | `{STORIES_API}/api/v1/stories/delete-seller-story` | `DELETE_STORY` |

- Upload the media to `{MEDIA}` first (folder `stories`; video uses
  `?story=true`), then send `file_path` = `{MEDIA}` + the returned URL.
- **Add body** (note singular `video_duration_in_second`):
  ```jsonc
  {
    "user_id": <the logged-in user id>,   // NOT the shop id
    "seller_id": <shop id>,
    "file_path": "<full media URL>",
    "is_video": 0 | 1,
    "link": "<https url>" | null,
    "product_id": <id> | null,
    "product_slug": "<slug>" | null,
    "video_duration_in_second": <int>,
    "order_detail_id": null
  }
  ```
- **Delete body:** `{ user_id, seller_id, story_id }`.
- **List** may return the array at `data.data` / `data.stories` / `data`, flat or
  grouped (each group has a nested `stories[]`); `perPage` defaults to 20.

**Gotcha:** `user_id` (the logged-in user) and `seller_id` (the shop) are two
different ids — both required.

---

## Shop Info

View/edit the shop's public profile: `name`, `address`, `contact` phone
(country-code first, e.g. `971…`), square **logo**, wide **banner**.

> Checked against the web client on `develop`: `components/SellerDashboard/ShopInfo.tsx`,
> `components/SellerDashboard/ShopInfoLoader.tsx`, `services/sellerDashboard/index.ts`.
> Anything the web client does not do is marked **not verified** — it means nobody
> has tried it, not that it is forbidden.

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Get | GET | `{MARKET_API}/shop/info` | `READ_SHOP_INFO` |
| Update | PUT | `{MARKET_API}/shop/info` | `UPDATE_SHOP_INFO` |

### Do not call GET without the permission

`GET /shop/info` is gated by `READ_SHOP_INFO`; without it the call can only ever
fail. The web client reads the permission list first and **skips the request
entirely**, then tells the user the permission is missing — no spinner, no retry
button, because a retry cannot succeed. Do the same.

If the permission list itself failed to load (unknown, not "no"), send the
request anyway and let the backend decide — an unknown must not lock out a
seller who really does have access.

### GET returns more than this screen shows

The same record feeds other dashboard screens. Fields the web client actually
reads:

| Field | Used for |
|-------|----------|
| `name`, `address`, `contact` | the form |
| `image`, `banner` | logo / banner |
| `currency: { code, name }` | the currency shown next to prices across the dashboard (product form, product list) |
| `is_new_products_approval` | whether new products need admin approval before they go live |

`is_new_products_approval` rule as implemented: **missing or `null` means "not
gated"** (treat as `true`); only an explicit false-y value (`false`, `0`, or
their string forms) restricts the seller. Do not treat "absent" as "blocked".

The response body is read tolerantly as `res.data ?? res`. There is **no
published field list** for this endpoint — read every field defensively, and
expect fields this table does not mention.

### `image` / `banner` have no stable shape

What comes back may be a bare filename, a relative path, or a full URL. Build a
display URL the way the web client does: if the value contains `http`, use it as
is; otherwise prefix `{MEDIA_IMG}` and make sure there is exactly one `/`
between them.

### PUT replaces all five fields — there is no partial update

**Body:** `{ name, address, contact, image, banner }` — every field, every time.

- `image` and `banner` are sent as a **bare filename**: the client keeps only
  the part after the last `/`, so `/seller/1781080470388204.png` is sent as
  `1781080470388204.png`. The folder is never sent; the backend infers it.
- If the user picked no new file, the **existing** value is re-sent, flattened
  to a bare filename in the same way. So every save flattens whatever path the
  GET returned.
- Send `null` when there is no image at all.
- **Honest gap:** this round-trip only holds while shop media stays in the one
  `seller` folder. If the backend ever returns a value from another folder, the
  folder is lost on the next save and the image can break. Nobody has tested
  that case.

**Validation is client-side only, and it is weak.** Name, contact and address
must not be empty, and contact only has to match `/^\+?\d+$/` — no length check
and no real country-code check, despite the "971…" hint. The backend's own rules
(max lengths, phone format, whether `image` may be `null`) are **not verified**;
show whatever `message` comes back.

**Errors:** the web client treats a body with `success: false` as the failure
case — check `success`, do not rely on the HTTP status alone.

**Not editable here:** currency, approval standing, boutique banners and shop
locations are all other screens/endpoints. This screen changes five fields only.

**Upload flow for logo/banner:** crop the image → upload it to the media server
with folder `seller` (see [Uploads](#uploads) — it needs an upload **ticket**,
not just the api key) → take the returned value down to a bare filename → PUT.

---

## Team Management (members & roles)

Invite a user by phone + role, list members, change a member's role, remove a
member, or leave the shop yourself.

| Action | Method | Path | Body / Query | Permission |
|--------|--------|------|--------------|------------|
| List members | GET | `{MARKET_API}/shop/users?page=&lang=` | — | `READ_EMPLOYEES` |
| List roles | GET | `{MARKET_API}/shop/users/roles?page=&search=` | — | `READ_ROLES` |
| Invite | POST | `{MARKET_API}/shop/users/add` | `{ phone, role_id, seller_id }` | `CREATE_EMPLOYEES` |
| Change role | PUT | `{MARKET_API}/shop/users/role/update` | `{ user_id, role_id }` | `UPDATE_EMPLOYEES` |
| Remove member | DELETE | `{MARKET_API}/shop/users/{userId}/delete` | — | `DELETE_EMPLOYEES` |
| Leave shop | DELETE | `{MARKET_API}/shop/users/leave` | — | any member |

- Members at `data.users` (fallback `data`), count from `data.meta.total`. Each
  user: `id`, `name`, `phone`, and role as **either** `role.name`, `role_name`, or
  a string `role` — handle all three.
- Roles at `data.shop_roles` (fallback `data`), meta `has_more_pages` for infinite
  scroll; each role `{ id, name, description }`.
- After **Leave shop** succeeds, navigate the user out of the shop.

---

## Boutiques

The shop's boutiques ("butiks"). **Read-only** for now.

**`GET {MARKET_API}/shop/boutiques`** — permission `READ_BUTIKS`. Returns
`data.boutiques` (fallback `data`); each `{ id, name, description? (may be HTML),
icon?, slug?, status? (1 = Active) }`.

---

## Excel Bulk Upload

Bulk create/update products from an Excel template: pick a category → download its
template → fill it → upload the file to the media server → hand its URL to the
backend → **poll** the uploads list for the result.

> Checked against the web client on `develop`:
> `components/SellerDashboard/ExcelUploadTab.tsx`, `services/sellerDashboard/index.ts`.

**Permission:** this section has **no permission of its own**. The web client
shows the tab when the user holds `CREATE_PRODUCT` **or** `UPDATE_PRODUCT` (or
`SUPER_ADMIN`). What the backend itself enforces on these five endpoints is
**not verified** — handle a 403 anyway.

| Action | Method | Path | Notes |
|--------|--------|------|-------|
| List categories | GET | `{MARKET_API}/shop/excel/categories` | Items `{ id, name?/title? }`. The list is read tolerantly as `data.categories` / `categories` / `data`. |
| Download template | GET | `{MARKET_API}/shop/excel/downloadExcel/{category_id}` | **Binary `.xlsx`** — read as a file. On error it returns JSON (`content-type: application/json`) with a `message`, so check the content type before saving. |
| Upload filled file | POST | `{MEDIA}/gated/upload/excel?folder=excel` | Media server. Headers `x-api-key` **and** `X-Upload-Ticket` (see [Uploads](#uploads)). Multipart field `file` **only** — `folder` must stay in the query string, it is read before the file streams. Returns `{ url, key, filename, originalName, contentType }`. |
| Process | POST | `{MARKET_API}/shop/excel/processExcel` | Body `{ file_url }` — **the client builds this string**, see below. |
| List uploaded files | GET | `{MARKET_API}/shop/excel/getUploadedExcelFiles` | A paginator: the rows are at `data.data`. |

### The `file_url` you send is not the URL the upload returned

The upload response has both a `url` and a `key`. The web client ignores `url`
and builds the value itself:

```
file_url = {MEDIA} + "/file/upload/" + <key from the upload response>
```

It also refuses the upload when `key` is missing. Sending the media server's own
`url` field is **not** what the backend receives today, so nobody knows whether
it works — build the string from `key`.

### Processing is asynchronous — a 200 does not mean "products created"

`processExcel` returning success only means the file was **accepted**. The web
client's banner says "File uploaded and processed successfully!" — that wording
is wrong, do not copy it. Say "queued" and then refresh the list.

- There is **no webhook and no push**. The only way to learn the outcome is to
  poll `getUploadedExcelFiles`. The web client does not even poll — it has a
  manual **Refresh** button.
- `upload_status` is one of `uploaded`, `processing`, `completed`, `failed`.
- Per-row results exist only as **free text** in `processing_notes`, shown in a
  modal. There is no structured per-row error list, so do not try to parse it
  into a table.

### Row fields from `getUploadedExcelFiles`

`id`, `original_filename`, `s3_path`, `file_size`, `mime_type`,
`uploaded_by_user_type`, `uploaded_by_user_id`, `upload_status`,
`processing_notes`, `created_at`, `updated_at`.

The web client sends **no** paging parameters, so which ones this paginator
accepts (`page`, `per_page`) is **not verified**.

### Known problems — plan around these

- **Client validation is extension-only** (`.xlsx`, `.xls`, `.xlsm`, `.xlsb`).
  There is no size check and no MIME check. The "512 MB" figure is a comment in
  the code, never enforced and never verified — an oversized file simply fails
  at the media server.
- **The "download my uploaded file" link is unreliable.** The web client builds
  `{MEDIA}/file/upload/excel/<original_filename>`, i.e. from the name the user's
  file had, while the media server stores the object under its own `key`. The
  row's `s3_path` is returned but never used. When the two names differ the link
  404s. Prefer `s3_path` when it looks like a usable path, and treat the link as
  best effort.
- **The template download is binary** — do not parse it as JSON. The web client
  goes through its own proxy, which drops `Content-Disposition` and falls back
  to `template-<category_id>.xlsx`; a direct call from the app should read
  `Content-Disposition` when it is there. That same web path also hardcodes
  `sy` / `en` as its country/language fallback — send the user's real values.
- There is **no upload progress**, **no cancel**, and **no delete** for an
  uploaded file.

---

## Comments & Reviews

Read and respond to customer feedback. Two kinds:
- **FAQ / questions** (`type=faq`) — customer questions on a product. Seller can
  reply / edit reply / delete reply.
- **Reviews** (`type=review`) — star-rated purchase reviews. **Display-only, no
  reply.**

Each comment and each reply shows a heart/reaction total. Per-product social
counters can be fetched in a batch.

> **These endpoints are on `{WEB_API}`**, not `{MARKET_API}`. Send
> `Authorization: Bearer <MARKET_TOKEN>` (or `x-market-token: <MARKET_TOKEN>`) and
> put `seller_id` in the query/body. The server verifies your token owns that shop
> **and** holds the required permission before anything happens — a wrong
> `seller_id`/`comment_id` just returns nothing.

| Action | Method & path | Body / query | Permission |
|--------|---------------|--------------|------------|
| List | `GET {WEB_API}/api/seller/comments` | `?seller_id=&type=faq\|review&page=&page_size=` | `READ_COMMENTS` |
| Reply (create) | `POST {WEB_API}/api/seller/comments/reply` | `{ seller_id, comment_id, reply_text }` | `REPLY_COMMENT` |
| Edit reply | `PUT {WEB_API}/api/seller/comments/reply` | `{ seller_id, comment_id, reply_text }` | `EDIT_REPLY` |
| Delete reply | `DELETE {WEB_API}/api/seller/comments/reply` | `{ seller_id, comment_id }` | `DELETE_REPLY` |
| Product social counts | `POST {WEB_API}/api/seller/comments/social` | `{ seller_id, product_ids: [...] }` (≤ 100) | `READ_COMMENTS` |

**Responses:** success → `{ success: true, data: ... }`. Failure → `{ success:
false, message }` with a matching status: **401** missing/invalid token, **403** not
a member / no permission, **429** rate-limited, **400** bad input, **404** comment
not found.

**List `data`** = `{ comments: [...], meta }`.

Comment fields:

| Field | Type | Notes |
|-------|------|-------|
| `comment_id` | string | id for reply/edit/delete |
| `product_id` | string | |
| `user_id`, `user_name`, `user_avatar` | string | avatar may be empty → use a placeholder |
| `text` | string | the question / review body |
| `rating` | number \| null | stars; `null` for FAQ, shown only for reviews |
| `variant` | string | variant label |
| `created_at` | string \| null | |
| `has_reply` | boolean | reply exists vs "waiting for reply" |
| `seller_reply` | string | reply text |
| `seller_name` | string | reply attribution |
| `reply_created_at` | string \| null | |
| `total_likes` | number | hearts on the comment |
| `reply_total_likes` | number | hearts on the reply |

`meta` = `{ current_page, per_page, total, last_page, has_more_pages }` — show
"Load More" while `has_more_pages`.

**Product social `data`** = a map `product_id → { total_reactions, total_fqa,
total_reviews, total_shares }` (every requested id present, zero-filled).

**Behaviour:**
- Reviews have **no** reply UI — only FAQ questions get reply/edit/delete.
- Create vs edit is decided by `has_reply`. Editing doesn't change
  `reply_created_at`.
- Delete clears the reply (`has_reply=false`); the comment stays.
- `reply_text` is capped at **1000 chars** (HTML stripped) — empty/too-long is
  rejected.
- `page_size` default 10, **max 50**. Reactions are display-only (no like/unlike).

---

## Uploads

**The api key on its own is no longer enough.** Every upload now goes to a
**`/gated/…`** path and needs an **upload ticket** as well:

1. **Get a ticket** — `POST {MEDIA}/gated/ticket` with
   `Authorization: Bearer <MARKET_TOKEN>` and body
   `{ folder, story, count }` (`count` = how many files you are about to send,
   `story` = whether it is a story). It replies `{ ticket }`.
2. **Upload** — send the file(s) with **both** `x-api-key: {MEDIA_KEY}` and
   `X-Upload-Ticket: <ticket>`.

The web client goes through its own `/api/ticket` route only because its token
lives in an HttpOnly cookie; the app can call `{MEDIA}/gated/ticket` directly.
How long a ticket lives, and whether one can be reused, is **not documented** —
take a fresh ticket for each upload.

| Upload | Method & path | Multipart fields | Returns |
|--------|---------------|------------------|---------|
| Single image | `POST {MEDIA}/gated/upload` | `file`, `folder` | `{ url, durationSeconds? }` |
| Bulk images | `POST {MEDIA}/gated/upload/bulk` | `folder`, repeated `files` | `{ urls: [...] }` **or** `{ url: ... }` |
| Video story | `POST {MEDIA}/gated/upload?story=true` | `file`, `folder` | `{ url, durationSeconds }` |
| Excel | `POST {MEDIA}/gated/upload/excel?folder=excel` | `file` (folder stays in the query) | `{ url, key, filename, originalName, contentType }` |

The market/stories backends then want the returned **filename or
`/folder/filename` path**, not the full URL (see each section) — and the bulk
endpoint often returns a bare filename rather than a URL, so build the
`/folder/filename` path yourself.

Folders in use: `product` (gallery/product images), `product/meta` (meta image),
`stories`, `seller` (shop logo/banner), `excel`.

**Reading a file back** — two different bases, this trips people up:
`{MEDIA_IMG}/<path>` for stored **images**, `{MEDIA}/file/upload/<path>` for
uploaded **files** (this is what the Excel screens use).

> ⚠️ **`{MEDIA_KEY}` is a leaked credential.** It is committed to this repo's
> git history and ships inside the website's browser bundle. It is being retired
> in favour of the ticket flow above. It still works today, so it is written
> here — but do not treat it as a secret, and expect it to be rotated or removed
> without notice.

---

## Auth quick reference

| Section | Base URL | Token | `X-Seller-ID`? |
|---------|----------|-------|----------------|
| Permissions | `{MARKET_API}` | MARKET | no |
| Products, Gallery, Shop Info, Team, Boutiques, Excel | `{MARKET_API}` | MARKET | **yes** |
| Comments & Reviews | `{WEB_API}` | MARKET | no (`seller_id` in query/body) |
| Seller Stories | `{STORIES_API}` | STORIES | no (`seller_id` in body) |
| Upload ticket | `{MEDIA}` | MARKET (`Authorization: Bearer`) | no |
| Uploads | `{MEDIA}` | `x-api-key` **+** `X-Upload-Ticket` | no |

---

## Who to ask

- **Backend APIs** (everything on `{MARKET_API}` — request/response details,
  fields, errors): ask **Mohamad Hassan**.
- **Seller Stories** (`{STORIES_API}`): ask **Nizar Yousef**.
- **Comments & Reviews routes (`{WEB_API}`) and the media server (`{MEDIA}`)**:
  ask **Alaa Asaad**.
