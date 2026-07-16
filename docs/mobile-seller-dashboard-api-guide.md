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
| `{MEDIA}` | `https://media_server.ramaaz.dev/image/upload` | All file/image/video/excel uploads |
| `{MEDIA_KEY}` | `pfxqJTg8PgGf9rKEyvred+odXPgGU4wFtOJnJPUlqngdell@DESKTOP-0DHEE8R` | Media upload `x-api-key` header |

---

## Auth — what to send

There are three token setups. Sending the wrong one fails auth.

| Sections | Base URL | Headers |
|----------|----------|---------|
| Products, Gallery, Shop Info, Team, Boutiques, Excel, Permissions | `{MARKET_API}` | `Authorization: Bearer <MARKET_TOKEN>` **+** `X-Seller-ID: <sellerId>` |
| **Comments & Reviews** | `{WEB_API}` | `Authorization: Bearer <MARKET_TOKEN>` (`sellerId` goes in the query/body) |
| Seller Stories | `{STORIES_API}` | `Authorization: Bearer <STORIES_TOKEN>` (a **different** token; `sellerId` goes in the body) |
| Any file upload | `{MEDIA}` | `x-api-key: {MEDIA_KEY}` (no user token) |

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

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Get | GET | `{MARKET_API}/shop/info` | `READ_SHOP_INFO` |
| Update | PUT | `{MARKET_API}/shop/info` | `UPDATE_SHOP_INFO` |

**PUT body:** `{ name, address, contact, image, banner }`. Validate `contact` as
`/^\+?\d+$/`. Upload logo/banner to `{MEDIA}` first (folder `seller`), then send
the returned value as a **bare filename**. If no new file is chosen, re-send the
existing filename.

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
template → fill it → upload it → process it. Allowed if `CREATE_PRODUCT` or
`UPDATE_PRODUCT`.

| Action | Method | Path | Notes |
|--------|--------|------|-------|
| List categories | GET | `{MARKET_API}/shop/excel/categories` | Items `{ id, name?/title? }`. |
| Download template | GET | `{MARKET_API}/shop/excel/downloadExcel/{category_id}` | **Binary `.xlsx`** — read as a file. On error returns JSON (`content-type: application/json`) with a `message`. |
| Upload filled file | POST | `{MEDIA}/upload/excel?folder=excel` | Media server (`x-api-key`), multipart field `file`. Returns `{ url, ... }`. `.xlsx/.xls/.xlsm/.xlsb`, ≤ 512 MB. |
| Process | POST | `{MARKET_API}/shop/excel/processExcel` | Body `{ file_url: <url from upload> }`. |
| List uploaded files | GET | `{MARKET_API}/shop/excel/getUploadedExcelFiles` | Rows at `data.data`; each `{ id, original_filename, upload_status, processing_notes, created_at, ... }`. `upload_status ∈ uploaded/processing/completed/failed`. |

**Gotcha:** the template download is **binary** — don't parse it as JSON. Upload
the filled file to `{MEDIA}` first, then send only the returned **URL** to process.

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

Every file upload goes to `{MEDIA}` with header `x-api-key: {MEDIA_KEY}` (no user
token). The market/stories backends then want the returned **filename or
`/folder/filename` path**, not the full URL (see each section).

| Upload | Method & path | Multipart fields | Returns |
|--------|---------------|------------------|---------|
| Single image | `POST {MEDIA}/upload` | `file`, `folder` | `{ url, durationSeconds? }` |
| Bulk images | `POST {MEDIA}/upload/bulk` | `folder`, repeated `files` | `{ urls: [...] }` **or** `{ url: ... }` |
| Video story | `POST {MEDIA}/upload?story=true` | `file`, `folder` | `{ url, durationSeconds }` |
| Excel | `POST {MEDIA}/upload/excel?folder=excel` | `file` | `{ url, ... }` |

Folders in use: `product` (gallery/product images), `product/meta` (meta image),
`stories`, `seller` (shop logo/banner), `excel`.

---

## Auth quick reference

| Section | Base URL | Token | `X-Seller-ID`? |
|---------|----------|-------|----------------|
| Permissions | `{MARKET_API}` | MARKET | no |
| Products, Gallery, Shop Info, Team, Boutiques, Excel | `{MARKET_API}` | MARKET | **yes** |
| Comments & Reviews | `{WEB_API}` | MARKET | no (`seller_id` in query/body) |
| Seller Stories | `{STORIES_API}` | STORIES | no (`seller_id` in body) |
| Uploads | `{MEDIA}` | `x-api-key` | no |

---

## Who to ask

- **Backend APIs** (everything on `{MARKET_API}` — request/response details,
  fields, errors): ask **Mohamad Hassan**.
- **Seller Stories** (`{STORIES_API}`): ask **Nizar Yousef**.
- **Comments & Reviews routes (`{WEB_API}`) and the media server (`{MEDIA}`)**:
  ask **Alaa Asaad**.
