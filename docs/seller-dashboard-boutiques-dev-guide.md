# Seller Dashboard — Boutiques: Developer Guide

How to build the **Boutiques** section of the shop (seller) dashboard: the
list, the detail page, **add**, **edit** and **set active / inactive**. It
explains every field of the form and gives the full API contract.

> **Source of truth.** This guide was checked against the web code on
> `development` (2026-10-04). If this guide and the code disagree, the code is
> right — fix this file.
>
> - List: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` → `renderBoutiques`
> - Routes: `…/[sellerId]/boutiques/new/page.tsx`, `…/[sellerId]/boutiques/[boutiqueId]/page.tsx`
> - Editor: `components/SellerDashboard/boutiqueEdit/` — `BoutiqueEditor.tsx`, `sections.tsx`, `controls.tsx`, `helpers.ts`
> - API calls: `services/sellerDashboard/index.ts`
> - Edit/update/status contract: `shop-seller-product-boutique-apis.md` §4
> - Tests: `tests/components/SellerDashboard/boutiqueEdit/*`, `tests/app/sellerProfile/sellerDashboard/boutiquePages.test.tsx`

---

## 1. What the section does

A **boutique** is a small storefront inside a shop. It has its own name, icon,
banners and text in every language.

| Action | Where | Permission |
|---|---|---|
| **Show** the list | Dashboard → *Boutiques* tab | any boutique permission (see §3.3) |
| **Show** one boutique | `/{local}/sellerProfile/sellerDashboard/{sellerId}/boutiques/{boutiqueId}` | `UPDATE_BUTIKS` (the page loads through `/edit`) |
| **Add** | `/{local}/sellerProfile/sellerDashboard/{sellerId}/boutiques/new` | `CREATE_BUTIKS` |
| **Edit** | same page as *show*, after pressing **Edit** | `UPDATE_BUTIKS` |
| **Set active / inactive** | same page, in edit mode | `CHANGE_BOUTIQUE_STATUS` |
| Delete | built, but **switched off** (`canDelete = false` in `BoutiqueEditor.tsx`) | `DELETE_BUTIKS` |

`SUPER_ADMIN` passes every permission check.

Add and edit use **one component**: `BoutiqueEditor`, with `mode="create"` or
`mode="edit"` (the default).

---

## 2. The flows at a glance

```
LIST  GET /shop/boutiques ──► cards ──tap──► DETAIL (view mode)
  │                                              │
  │ "+ Add Boutique"                             │ "Edit"
  ▼                                              ▼
ADD (always in edit mode)                    EDIT MODE
  GET /languages                               (form unlocked, "Set active" button)
  GET /shop/boutiques/lookups                    │ "Save Changes"
  │ "Create Boutique"                            ▼
  ▼                                          POST /shop/boutiques/{id}/update
POST /shop/boutiques                             │ only if the status toggle moved:
  │ success → open the new boutique              ▼
  ▼                                          POST /shop/boutiques/{id}/change-status
DETAIL of the new boutique (status = inactive)
```

Image files never go to the shop API. The app uploads them to the **media
server** first. Then the save body carries only the stored **file name** (§7).

---

## 3. Before any call

### 3.1 Which backend

All `/shop/boutiques…` calls go to the **core** backend. The web client sends
them as `server: "market-dashboard"` through `/api/proxy`. The proxy adds the
token from the `MARKET-TOKEN` cookie. No `/shop/*` path is on the gateway list,
so these calls always reach the core backend.

`GET /languages` is sent as `server: "market"`. The proxy picks core or gateway
for that one. Read the `x-market-backend` response header to see which one
answered.

### 3.2 Headers

| Header | Required | Value |
|---|---|---|
| `Authorization` | yes | `Bearer <MARKET token>` (the proxy adds it on web) |
| `X-Seller-ID` | **yes** | the shop id (`sellerId` from the URL) |
| `Accept` | yes | `application/json` |
| `Content-Type` | yes on POST | `application/json` |
| `lang` | no | `en`, `ar`, `tr`, `ku` — language of looked-up names. Default `en`. |

`X-Seller-ID` is required on every `/shop/*` call. Without it, the backend
cannot find the caller's role in that shop, so it refuses the call. It also
limits every read and write to that shop's own records. On web, pass `sellerId`
to `fetchData` and it becomes the `x-seller-id` header.

### 3.3 Permissions

Read them from `GET /shop/auth/permissions` (with `X-Seller-ID`). The answer is
a list of shops. Pick the one where `seller_id == sellerId` and read its
`permissions` array.

| Permission | What it unlocks in the UI |
|---|---|
| `READ_BUTIKS` | the Boutiques tab and the list |
| `CREATE_BUTIKS` | the **+ Add Boutique** button and the `/new` page |
| `UPDATE_BUTIKS` | opening a boutique (`/edit`), the **Edit** button, **Save** |
| `CHANGE_BOUTIQUE_STATUS` | the **Set active / Set inactive** button |
| `DELETE_BUTIKS` | the delete button (switched off today) |

The tab shows when the user has **any** of the five. The detail page has its
own check too: when someone opens a boutique URL directly, the permissions may
not be loaded yet, so `BoutiqueEditor` calls `/shop/auth/permissions` itself.

> **Note — "View only".** The detail page shows a *View only* label when the
> user has no `UPDATE_BUTIKS`. But the page loads its data through
> `GET …/edit`, and the contract says `/edit` needs `UPDATE_BUTIKS`. So a
> user with only `READ_BUTIKS` gets a `403` and sees *"You don't have
> permission to view or edit this boutique."* instead. There is no read-only
> "show one boutique" endpoint today.

### 3.4 Response envelope

Every `/shop/*` endpoint answers with the same envelope:

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Data Got",
  "detailed_error": null,
  "data": { }
}
```

On an error:

```json
{
  "isSuccessful": false,
  "code": 422,
  "hasContent": false,
  "message": "Boutique name is required!",
  "detailed_error": [ { "code": "name", "message": "Boutique name is required!" } ],
  "data": null
}
```

- `message` — the first error. Safe to show in a toast.
- `detailed_error[]` — all errors. A validation error has `code` (the field
  name). A business-rule error may have only `message`.
- On web, `fetchData` adds `success` (`true` for HTTP 2xx) and `httpStatus`.
  The code checks `res.success`, not `isSuccessful`.

How the web shows errors: join every `detailed_error[].message` with `" • "`.
If the list is empty, use `message`. If that is empty too, use a fixed text such
as *"Failed to update boutique."*

| Code | Meaning |
|---|---|
| `200` | success |
| `403` | the user lacks the permission → `"You do not have permission to access."` |
| `404` | the boutique does not exist **or belongs to another shop** → `"Boutique not found."` |
| `422` | validation failed, or a business rule blocked the action |

The backend answers `404` (not `403`) for another shop's boutique on purpose.
So nobody can learn that a boutique id exists in another shop.

---

## 4. Show — the list

### 4.1 API

```
GET /api/v1/shop/boutiques
```

`data.boutiques[]` (the web also accepts a bare array in `data`). `data.meta`
also comes back, but the web does not page — it loads the whole list once.

```json
{
  "data": {
    "boutiques": [
      {
        "id": 12,
        "name": "My Boutique",
        "description": "<p>Summer collection…</p>",
        "icon": "boutiques/boutiques/icon/xyz.webp",
        "slug": "my-boutique-12",
        "status": 1
      }
    ],
    "meta": { }
  }
}
```

### 4.2 The card

| Field | How the card uses it |
|---|---|
| `icon` | image on top, 160 px tall. Turn it into a full URL first (`GetImageUrl`). If empty: boutique icon + *"No Image"*. |
| `name` | white title over the image. If empty: *"Unnamed Boutique"*. |
| `status` | badge: `1` → green **Active**, anything else → grey **Inactive**. No badge when the field is missing. |
| `description` | **HTML**. Remove the tags, cut at 100 characters, add `...` if longer. If empty: *"No description"*. |
| `slug` | blue chip `/my-boutique-12`. Hidden when empty. |
| `id` | the card links to `…/boutiques/{id}`. |

### 4.3 States

| State | What to show |
|---|---|
| permissions not loaded | small skeleton |
| no boutique permission | *"You don't have permission to view boutiques"* |
| loading, list empty | grid skeleton (`BoutiqueGridSkeleton`) |
| error, list empty | error box with **Retry** |
| empty list | *"No boutiques found"* + **Add your first boutique** (only with `CREATE_BUTIKS`) |
| list | header *Boutiques (count)* + **+ Add Boutique** (only with `CREATE_BUTIKS`) + card grid (1 column on phone, 3 on desktop) |

---

## 5. Show one boutique, and edit it

### 5.1 Loading the page

The page makes two calls, in this order:

1. `GET /languages` — the language list. It decides which language tabs the
   form has (§6.2). If this call fails, the web uses a built-in list:
   `en` English, `ar` العربية, `tr` Türkçe, `ku` کوردی.
2. `GET /shop/boutiques/{boutiqueId}/edit` — the boutique and the lookups.

Then `buildFormFromEdit(boutique, languages)` turns the answer into the form
(§8.1). The page keeps **two copies**: `form` (what the user edits) and
`initial` (what is saved). **Cancel** copies `initial` back into `form`.

If the error text contains `permission`, `forbidden` or `403`, show the
*access denied* screen. Any other error shows an error box with **Retry**.

### 5.2 View mode and edit mode

The page opens in **view mode**: every field is locked, upload and remove
buttons are hidden, and *Copy from* is hidden.

**Header card:**

- icon (English icon, or the active tab's icon), name, status pill
  (**Active** / **Inactive**), and `ID: {boutiqueId}`.
- View mode: **Edit** button (with `UPDATE_BUTIKS`), or a *View only* label.
- Edit mode: **Set active** / **Set inactive** (with `CHANGE_BOUTIQUE_STATUS`),
  **Cancel**, **Save Changes**.

In edit mode a **sticky bar** at the bottom repeats **Cancel** and **Save
Changes**.

### 5.3 Saving an edit

1. Run `validate(form)` (§6.7). If there are errors: switch to the first
   language tab that has an error, shake the bad fields, toast *"Please fix
   the highlighted fields before saving."*, and stop.
2. Build the body with `buildUpdatePayload(form, languages, "update")` (§8.2).
3. `POST /shop/boutiques/{id}/update`. If it fails, show the error and stay in
   edit mode.
4. If the status toggle moved (`form.status !== initial.status`), call
   change-status now (§5.4).
5. Save the result as the new `initial`, leave edit mode, toast *"Boutique
   updated successfully."*

### 5.4 Set active / inactive

The **Set active** button does **not** call the API. It only flips
`form.status` (0 ↔ 1) in the form. The real call happens on **Save**, after
the update succeeds. Two reasons:

- `update` never changes `status`, `request_status` or `position`. The backend
  keeps their old values. Only `change-status` can change `status`.
- Activation can be **refused** (`422`). The other edits must stay saved even
  then.

```
POST /shop/boutiques/{id}/change-status   { "status": 1 }
```

| Result | What the web does |
|---|---|
| success | read `data.status`, keep it, toast *"Boutique updated successfully."* |
| refused | edits **are** saved; status goes back to the old value; red box *"Status could not be changed:"* lists each `detailed_error[].message`; toast *"Your changes were saved, but the status could not be updated."* |

Setting `status: 0` is always allowed. Setting `status: 1` can be refused with
these messages:

| Message | Meaning |
|---|---|
| `you need to be approved` | the boutique is not approved yet, or the shop is suspended |
| `Missing Translations` | an active language has no translation |
| `This Boutique Didn't Have active Related Products.` | no active product is attached to the boutique |

> The third message matters. The web form **cannot attach products** yet
> (§6.6). So a new boutique can only be activated after products are attached
> some other way.

---

## 6. The form, field by field

### 6.1 The form model

```ts
// components/SellerDashboard/boutiqueEdit/helpers.ts
interface BoutiqueForm {
  countries_iso: string[];                       // restricted countries
  related_product_ids: (number | string)[];      // kept as loaded, never edited
  translations: Record<LangCode, TranslationForm>; // one entry per language
  status: number;                                // 0 inactive / 1 active
  availability: number;                          // 1 Web · 2 Mobile · 3 Web+Mobile
}

interface TranslationForm {
  id?: number;          // translation id from /edit — missing = new language row
  language_code: string;
  name: string;
  description: string;  // HTML from the rich-text editor
  bio: string;          // plain text
  icon: string;         // bare file name, sent to the API
  iconPreview: string;  // full URL or blob: URL, only for display
  banners: BannerItem[];
}

interface BannerItem {
  id?: number;          // banner id from /edit — missing = new banner
  banner: string;       // bare file name, sent as `file_path`
  previewUrl: string;   // full URL or blob: URL, only for display
  isNew?: boolean;
}
```

The form has three sections, in this order: **Availability**, **Translations**,
**Restricted countries**.

### 6.2 Content is per language

Name, description, bio, icon and banners belong to **one language each**. The
storefront shows each language on its own, so every language must be complete.

- The **Translations** section has one tab per language from `GET /languages`.
  The tab label is the language's own name (`native_name`).
- Only the active tab is shown. Errors use keys like
  `translations.ar.name`, so the page can jump to the right tab.
- The **English** (`en`) translation also fills `boutique_global_data`. This is
  the boutique's own row. If there is no English entry, the first language is
  used.

### 6.3 Availability

Where shoppers can see the boutique.

| Value | Label |
|---|---|
| `1` | Web |
| `2` | Mobile |
| `3` | Web + Mobile (**default** on create, and when the stored value is unknown) |

- Options come from `lookups.availabilities`. Only the values 1, 2 and 3 are
  offered.
- If the lookups have no availabilities, the web uses the three above.
- The backend `label` (`"WebMobile"`) is **never** shown. The UI shows its own
  translated label for each value.
- Sent as `boutique_global_data.availability`. Required by the backend.

### 6.4 Translations — the five fields per language

Every field below is **required for every language**. Each one has a
**Copy from…** menu (§6.5).

| Field | Control | Rules | Sent as |
|---|---|---|---|
| **Name** | one-line text | not empty. The backend wants it unique across boutiques, max 255 characters. | `name` |
| **Boutique icon** | square preview + **Upload icon** | image file only, max **10 MB**. No size or shape check. | `icon` = bare file name |
| **Description** | rich-text editor (TipTap, loaded on demand) | not empty. An empty editor gives `""`, not `<p></p>`. The HTML is cleaned with `sanitizeHtml` before it is sent. | `description` |
| **Bio** | 3-line text area | not empty. Plain text. | `bio` |
| **Banners** | 16:9 tiles + **Add banner** tile | at least **one**. Order matters. | `banners[]` |

**Banners in detail:**

- **Add banner** opens a file picker that takes **several files**. The files
  go into a queue and upload **one at a time**.
- Each file is checked first (`checkBannerFile`):

  | Check | Result |
  |---|---|
  | not an image | **blocked** — *"Please choose an image file."* |
  | larger than 10 MB | **blocked** — *"Banner image must be 10 MB or smaller."* |
  | width < 600 px, or width ÷ height outside **1.5 – 1.8** | **warning** dialog: *"This banner may not display well"*, with the recommended size, the real size, and **Cancel** / **Ignore & upload**. The queue waits for the answer. |
  | the browser cannot read the size | allowed |

- Recommended size: **1280 × 750** (about 16:9). Keep important content in the
  centre, because the storefront may cut the top and bottom.
- Each tile has **←** / **→** to move it, and a red **delete** button. Banners
  are always laid out left-to-right, also in Arabic and Kurdish.
- The order in the list becomes `sequence` (1, 2, 3 …) on save.
- Removing a banner here only removes it from the list. The backend deletes it
  on **Save**, because the list is a full replace (§9.4).

### 6.5 Copy from another language

Each field has a small **Copy from…** menu. It lists only the **other**
languages where that field is already filled. Picking one copies the value into
the **active** tab.

- Text fields: the text is copied.
- Icon: the file name and the preview are copied. No new upload.
- Banners: the file names and previews are copied, but **without their `id`**.
  So the backend creates **new banner rows** for this language and does not
  move the other language's rows.

The menu is hidden in view mode, and when no other language has the field.

### 6.6 Restricted countries

- A wrap of chips, one per country from `lookups.countries` (`{ iso, name }`).
  The chip label is the country name in the app language, built on the
  client from `iso` (`getLocalizedCountryName`). The backend `name` is not
  shown.
- Tap a chip to select it, tap again to clear it. A selected chip has an
  outline and a light tint (not a checkbox).
- **Empty = available in every country.** Selected = the boutique is limited
  to those countries.
- Sent as `boutique_global_data.countries_iso` (ISO codes, e.g. `["SY","IQ"]`).

**Attached products** are not in the form. The web keeps
`related_product_ids` from `/edit` and sends them back unchanged as
`product_resources`. On create it sends `[]`.

### 6.7 Validation (client side)

`validate(form)` checks **every language** and returns one message per bad
field:

| Key | Message |
|---|---|
| `translations.<code>.name` | *Name is required.* |
| `translations.<code>.description` | *Description is required.* |
| `translations.<code>.bio` | *Bio is required.* |
| `translations.<code>.icon` | *Icon is required.* |
| `translations.<code>.banners` | *At least one banner is required.* |

The icon check exists because the backend refuses a save with no icon (on both
add and update). Checking it here avoids a `422` on every save.

The backend still runs its own checks (for example, a duplicate name). Its
`422` errors show as a toast built from `detailed_error`.

All user-visible text above goes through `translateFunction`. The keys exist in
`public/translations/translations.{ar,tr,ku}.js`.

---

## 7. Image upload (media server)

Upload first, save second. The save body carries only the **bare file name**.

### 7.1 Steps

1. **Get an upload ticket.** `POST /api/ticket` (this app's own route)
   `{ "folder": "<folder>", "story": false, "count": <number of files> }` →
   `{ "success": true, "ticket": "<ticket>" }`. The route asks the media
   server (`/gated/ticket`) for it.
2. **Upload** to the media server (`NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`), with
   headers `x-api-key: <NEXT_PUBLIC_MEDIA_API_KEY>` and
   `X-Upload-Ticket: <ticket>`, as `multipart/form-data`:

   | What | Endpoint | Form fields | Folder | Answer |
   |---|---|---|---|---|
   | Icon | `POST /gated/upload` | `file`, `folder` | `boutiques/boutiques/icon` | `{ "url": "…/boutiques/boutiques/icon/abc.webp" }` |
   | Banner | `POST /gated/upload/bulk` | `files` (one per file), `folder` | `boutiques/boutiques` | a list of uploaded files (see below) |

3. **Keep only the file name.** `fileNameOf(url)` turns
   `…/boutiques/boutiques/icon/abc.webp` into `abc.webp`.
4. Show the local file at once with `URL.createObjectURL(file)`.

The bulk answer has no fixed shape yet. `extractUploadedNames` accepts `files`,
`urls`, `results` or `data`, and each item can be a string or an object with
`url`, `path`, `file_name` or `name`.

### 7.2 Why only the file name

The **backend adds the folder itself**. When the web sent
`boutiques/boutiques/abc.webp`, the stored path became
`boutiques/boutiques/boutiques/boutiques/abc.webp`. So:

- `icon` = `abc.webp`
- `banners[].file_path` = `banner-1.webp`
- This also applies to **existing** images: `/edit` returns full URLs, and the
  form strips them down to the file name before it sends them back.

> ⚠️ The examples in `shop-seller-product-boutique-apis.md` §4.2 show
> `"boutiques/boutiques/…"` paths. **Do not copy them.** The working client
> sends the bare file name.

---

## 8. Mapping between the API and the form

### 8.1 GET `/edit` → form (`buildFormFromEdit`)

| Form | From the `/edit` answer |
|---|---|
| `countries_iso` | `boutique.restricted_countries_iso` (or `[]`) |
| `related_product_ids` | `boutique.related_product_ids` (or `[]`) |
| `status` | `boutique.status` (or `0`) |
| `availability` | `boutique.availability` if it is 1, 2 or 3, else `3` |
| `translations[code].id` | `translations[i].id` |
| `translations[code].name / description / bio` | same names in `translations[i]` |
| `translations[code].icon` | file name of `translations[i].icon`, else of `boutique.icon` |
| `translations[code].iconPreview` | full `translations[i].icon`, else `boutique.icon` |
| `translations[code].banners` | `translations[i].banners`, **sorted by `sequence`**; `id` kept, `banner` = file name, `previewUrl` = full URL |

Translations are matched by `language_code` (lower-case). A language from
`/languages` with no translation gets an **empty** entry with no `id`.

### 8.2 Form → save body (`buildUpdatePayload`)

```ts
buildUpdatePayload(form, languages, mode)  // mode: "update" | "create"
```

| Body | From the form |
|---|---|
| `boutique_global_data.name` | English name |
| `boutique_global_data.availability` | `availability` |
| `boutique_global_data.description` | English description, cleaned |
| `boutique_global_data.bio` | English bio |
| `boutique_global_data.icon` | English icon file name |
| `boutique_global_data.countries_iso` | `countries_iso` |
| `boutique_global_data.product_resources` | `related_product_ids` (unchanged) |
| per-language list, one item per language | `id` (only if it exists), `language_code`, `name`, `description` (cleaned), `bio`, `icon`, `banners[]` |
| `banners[]` item | `id` (only if it exists), `file_path` = file name, `sequence` = position + 1 |

> ⚠️ **The per-language key is different on the two endpoints.**
> - update → **`custom_data`**
> - create → **`boutique_custom_data`**
>
> If create gets `custom_data`, the backend **silently drops every
> translation**. Always pass the right `mode`.

A language item with an empty name and no `id` is left out. In practice this
never happens, because validation needs a name in every language.

`status` is **never** in the body.

---

## 9. API contract

Base: `{{host}}/api/v1`. Headers as in §3.2.

### 9.1 List boutiques

```
GET /shop/boutiques
```

| | |
|---|---|
| Permission | `READ_BUTIKS` |
| Body | — |
| Success `data` | `{ boutiques: [{ id, name, description?, icon?, slug?, status? }], meta }` |
| Web method | `getSellerBoutiques(sellerId)` |

### 9.2 Lookups for a new boutique

```
GET /shop/boutiques/lookups
```

| | |
|---|---|
| Permission | `CREATE_BUTIKS` |
| Body | — |
| Success `data` | the lookups object **directly** under `data` (not under `data.lookups`) |
| Web method | `getBoutiqueCreateForm(sellerId)` |

```json
{
  "data": {
    "categories":     [ { "id": 2, "name": "Clothing" } ],
    "colors":         [ { "id": 3, "code": "#000000", "name": "Black" } ],
    "sizes":          [ { "id": 1, "name": "S" } ],
    "countries":      [ { "iso": "SY", "name": "Syria" } ],
    "languages":      [ ],
    "availabilities": [
      { "value": 1, "label": "Web" },
      { "value": 2, "label": "Mobile" },
      { "value": 3, "label": "WebMobile" }
    ]
  }
}
```

The web uses only `countries` and `availabilities`. It reads
`res.data.lookups ?? res.data`, so both shapes work.

### 9.3 Create a boutique

```
POST /shop/boutiques
```

| | |
|---|---|
| Permission | `CREATE_BUTIKS` |
| Success `data` | `{ "boutique_id": 57 }` |
| Web method | `addBoutique(sellerId, payload)` |

```json
{
  "boutique_global_data": {
    "name": "Summer Boutique",
    "availability": 3,
    "description": "<p>Light clothes for summer.</p>",
    "bio": "Summer 2026 collection",
    "icon": "a1b2c3.webp",
    "countries_iso": ["SY"],
    "product_resources": []
  },
  "boutique_custom_data": [
    {
      "language_code": "en",
      "name": "Summer Boutique",
      "description": "<p>Light clothes for summer.</p>",
      "bio": "Summer 2026 collection",
      "icon": "a1b2c3.webp",
      "banners": [
        { "file_path": "banner-en-1.webp", "sequence": 1 }
      ]
    },
    {
      "language_code": "ar",
      "name": "بوتيك الصيف",
      "description": "<p>ملابس خفيفة للصيف.</p>",
      "bio": "مجموعة صيف 2026",
      "icon": "a1b2c3.webp",
      "banners": [
        { "file_path": "banner-ar-1.webp", "sequence": 1 }
      ]
    }
  ]
}
```

No `id` anywhere — everything is new. No `status` — a new boutique starts
**inactive**.

After success, the web reads the new id (`data.boutique_id`, then
`data.boutique.id`, then `data.id`) and opens
`…/boutiques/{newId}` with `router.replace`. If no id comes back, it opens the
dashboard. There is **no status button in create mode**, because there is no id
to call change-status with yet. The seller activates the boutique from its page.

### 9.4 Load a boutique for editing

```
GET /shop/boutiques/{boutiqueId}/edit
```

| | |
|---|---|
| Permission | `UPDATE_BUTIKS` |
| Body | — |
| Success `data` | `{ boutique, lookups }` |
| Web method | `getBoutiqueForEdit(sellerId, boutiqueId)` |

```json
{
  "boutique": {
    "id": 12,
    "name": "My Boutique",
    "slug": "my-boutique-12",
    "description": "…",
    "bio": "…",
    "icon": "https://…/boutiques/boutiques/icon/xyz.webp",
    "position": 0,
    "status": 1,
    "request_status": 1,
    "availability": 3,
    "restricted_countries_iso": ["SA", "AE"],
    "resource_types": ["product"],
    "related_product_ids": [123, 124, 130],
    "translations": [
      {
        "id": 45,
        "language_code": "en",
        "name": "My Boutique",
        "description": "…",
        "bio": "…",
        "icon": "https://…/boutiques/boutiques/icon/en.webp",
        "banners": [
          { "id": 7, "banner": "https://…/boutiques/boutiques/banner1.webp", "sequence": 1 }
        ]
      }
    ]
  },
  "lookups": {
    "categories": [ ],
    "colors": [ ],
    "sizes": [ ],
    "countries": [ { "iso": "SA", "name": "Saudi Arabia" } ],
    "languages": [ ],
    "availabilities": [ { "value": 1, "label": "Web" }, { "value": 2, "label": "Mobile" }, { "value": 3, "label": "WebMobile" } ]
  }
}
```

| Field | Meaning |
|---|---|
| `status` | `0` inactive / `1` active. Change it only through change-status. |
| `request_status` | approval state, set by an admin. Read-only. |
| `position` | display order, set by the backend. Read-only. |
| `availability` | `1` Web · `2` Mobile · `3` Web+Mobile |
| `restricted_countries_iso` | the countries the boutique is limited to. Empty = all. |
| `related_product_ids` | products attached to the boutique |
| `translations[]` | per-language name / description / bio / icon / banners. Images are **full URLs** here. |

### 9.5 Update a boutique

```
POST /shop/boutiques/{boutiqueId}/update
```

| | |
|---|---|
| Permission | `UPDATE_BUTIKS` |
| Success `data` | `[]`, message `"Boutique updated successfully"` |
| Web method | `updateBoutique(sellerId, boutiqueId, payload)` |

```json
{
  "boutique_global_data": {
    "name": "My Boutique",
    "availability": 3,
    "description": "<p>Updated description</p>",
    "bio": "Updated bio",
    "icon": "en.webp",
    "countries_iso": ["SA", "AE"],
    "product_resources": [123, 124, 130]
  },
  "custom_data": [
    {
      "id": 45,
      "language_code": "en",
      "name": "My Boutique",
      "description": "<p>Updated description</p>",
      "bio": "Updated bio",
      "icon": "en.webp",
      "banners": [
        { "id": 8, "file_path": "banner2.webp", "sequence": 1 },
        { "id": 7, "file_path": "banner1.webp", "sequence": 2 },
        {          "file_path": "banner-new.webp", "sequence": 3 }
      ]
    },
    {
      "language_code": "tr",
      "name": "Butiğim",
      "description": "<p>Türkçe açıklama</p>",
      "bio": "Türkçe biyografi",
      "icon": "en.webp",
      "banners": [ { "file_path": "banner-tr.webp", "sequence": 1 } ]
    }
  ]
}
```

In this example the English banners were reordered and one was added. The
Turkish entry has no `id`, so the backend creates a new Turkish row.

**`boutique_global_data`**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string ≤ 255 | yes | unique across boutiques (this one excluded) |
| `availability` | int | yes | 1 / 2 / 3 |
| `description` | string | no | HTML |
| `bio` | string | no | |
| `icon` | string ≤ 191 | no | file name of an uploaded icon |
| `countries_iso` | string[] | no | empty = everywhere |
| `product_resources` | int[] | no | attached product ids |

**`custom_data[]`** (create: `boutique_custom_data[]`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | int | no | existing translation id. Leave it out to create a new language row. |
| `language_code` | string ≤ 10 | no | `en`, `ar`, … |
| `name` | string ≤ 255 | yes | |
| `description` | string | no | |
| `bio` | string | no | |
| `icon` | string ≤ 191 | no | per-language icon file name. Leave it out to keep the current icon. |
| `category_id` | int | no | in the contract; the web does not send it |
| `banners` | array | no | see below |

**`banners[]`**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | int | no | send it to **keep** an existing banner; leave it out to **create** one |
| `file_path` | string ≤ 191 | no | bare file name |
| `sequence` | int | yes | display order, starts at 1 |

> ⚠️ **Banners are a full-replace list, per language.**
> - An existing banner whose `id` is **not** in the list is **deleted**.
> - To keep a banner, send it back with its `id`.
> - To reorder, send all banners with new `sequence` values.
> - `banners: []` deletes all banners of that language.
> - Leaving out the `banners` key keeps them as they are.
>
> The web always sends the full list, so remove / reorder / add all work
> through this one rule.

> **Two icon levels.** `boutique_global_data.icon` is the boutique's own icon.
> Each `custom_data[].icon` is the icon for one language. The backend keeps them
> apart. The web sets the global icon from the English one.

> `update` never changes `status`, `request_status` or `position`.

### 9.6 Change status

```
POST /shop/boutiques/{boutiqueId}/change-status
```

| | |
|---|---|
| Permission | `CHANGE_BOUTIQUE_STATUS` |
| Body | `{ "status": 0 }` or `{ "status": 1 }` |
| Success `data` | `{ "status": 1, "warnings": [] }` |
| Web method | `changeBoutiqueStatus(sellerId, boutiqueId, status)` |

`warnings` are messages that do not block the change. The web does not show
them today.

Refused (`422`):

```json
{
  "isSuccessful": false,
  "code": 422,
  "message": "Missing Translations",
  "detailed_error": [ { "message": "Missing Translations" } ],
  "data": null
}
```

The three refusal messages are listed in §5.4.

### 9.7 Delete (not used in the UI)

```
DELETE /shop/boutiques/{boutiqueId}/delete
```

| | |
|---|---|
| Permission | `DELETE_BUTIKS` |
| Success `data` | `[]` |
| Web method | `deleteBoutique(sellerId, boutiqueId)` |

A soft delete: the boutique stops showing in lists, and there is no undo. A
`404` "Boutique not found." means it is already gone or belongs to another
shop. The web treats that as done. The button, confirm dialog and handler are
all in `BoutiqueEditor.tsx`, but `canDelete` is fixed to `false` until product
decides whether sellers may delete boutiques.

### 9.8 Languages

```
GET /languages          (server: market, cached on the client)
```

The answer shape is not fixed. `mapLanguages` reads the list from
`data.languages`, `languages`, `data` or the answer itself. For each item:

| Form | Read from (first one found) |
|---|---|
| `code` | `code`, `language_code`, `iso`, `slug` (lower-case) |
| `label` | `native_name`, `name`, `title`, `label`, else the code |
| `isRtl` | `is_rtl`, `rtl`, `direction`/`dir == "rtl"`, else a fixed list (`ar`, `ku`, `fa`, `he`, `ur`, `ps`, `sd`) |

Duplicates are removed. An empty or broken answer gives the built-in
en / ar / tr / ku list.

### 9.9 Quick reference

| Method | Path | Permission | Body | Success `data` |
|---|---|---|---|---|
| GET | `/shop/boutiques` | `READ_BUTIKS` | — | `{ boutiques, meta }` |
| GET | `/shop/boutiques/lookups` | `CREATE_BUTIKS` | — | lookups object |
| POST | `/shop/boutiques` | `CREATE_BUTIKS` | `{ boutique_global_data, boutique_custom_data }` | `{ boutique_id }` |
| GET | `/shop/boutiques/{id}/edit` | `UPDATE_BUTIKS` | — | `{ boutique, lookups }` |
| POST | `/shop/boutiques/{id}/update` | `UPDATE_BUTIKS` | `{ boutique_global_data, custom_data }` | `[]` |
| POST | `/shop/boutiques/{id}/change-status` | `CHANGE_BOUTIQUE_STATUS` | `{ status }` | `{ status, warnings }` |
| DELETE | `/shop/boutiques/{id}/delete` | `DELETE_BUTIKS` | — | `[]` |
| GET | `/languages` | — | — | language list |
| GET | `/shop/auth/permissions` | — | — | shops with `permissions` |

---

## 10. Open points and traps

1. **Create, lookups and delete are not in the repo contract.**
   `shop-seller-product-boutique-apis.md` covers only edit, update and
   change-status. The shapes in §9.2, §9.3 and §9.7 come from the working
   code and its comments. Add them to that file when the backend sends the
   final contract.
2. **`/languages` is not documented.** If it changes shape, `mapLanguages`
   falls back to four fixed languages. The UI keeps working, but a new
   language will not appear.
3. **Bare file names** for `icon` and `file_path` (§7.2). The repo contract
   shows paths with folders. Follow the code.
4. **`custom_data` vs `boutique_custom_data`** (§8.2). A wrong key on create
   loses every translation with no error.
5. **No product picker.** A boutique needs active attached products before it
   can be activated (§5.4), but the form cannot attach them.
6. **A user with only `READ_BUTIKS`** can see the list but cannot open a
   boutique (§3.3).
7. **Image previews.** The editor loads every language's images into the
   browser cache once the page loads, so switching tabs or pressing Cancel
   does not show an empty box for 1–2 seconds.

---

## 11. Build checklist

- [ ] Every `/shop/*` call sends `X-Seller-ID`.
- [ ] Buttons follow their own permission (§3.3). Hide them; do not just
      disable them.
- [ ] Language tabs come from `GET /languages`, with a fallback list.
- [ ] Every language needs name, description, bio, icon and ≥ 1 banner
      before save.
- [ ] Images upload to the media server first; the body carries only the bare
      file name.
- [ ] Banner checks: block non-images and files > 10 MB; warn on width < 600
      or ratio outside 1.5–1.8.
- [ ] Update sends `custom_data`; create sends `boutique_custom_data`.
- [ ] Existing translations and banners are sent back **with their `id`**.
      Copied or new ones have **no** `id`.
- [ ] The full banner list is sent for every language, `sequence` from 1.
- [ ] The status button only changes the form. Change-status runs **after** a
      successful update, and only when the status moved.
- [ ] A refused status change keeps the edits, puts the old status back, and
      lists every `detailed_error` message.
- [ ] After create, open the new boutique's page (`data.boutique_id`).
- [ ] Every user-visible string is translated (ar / tr / ku).
