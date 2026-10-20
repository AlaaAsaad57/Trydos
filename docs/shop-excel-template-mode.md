# Shop API — Excel Bulk Import: Template Mode, Failed Rows, Category Check (Contract)

The seller dashboard's bulk-import page lets the seller download either an **empty template**
(to add new products) or **their products of a category** (to update them), and shows how
many products each category has. After an import with errors it offers the failed rows as a
file to fix, and before an upload it warns when the file was made for another category. This
document gives the shop dashboard the same three features.

| | |
| --- | --- |
| **Tickets** | [`z8n6b616ez`](https://app.clickup.com/t/90182710436/z8n6b616ez) (Shop API), parity with [`z8n6b60wv5`](https://app.clickup.com/t/90182710436/z8n6b60wv5), [`z8n6b616f0`](https://app.clickup.com/t/90182710436/z8n6b616f0) and [`z8n6b616f2`](https://app.clickup.com/t/90182710436/z8n6b616f2) (seller dashboard) |
| **Base URL** | `{{host}}/api/v1/shop` |
| **Auth** | Bearer token from the core backend, guard `auth:api` |
| **Audience** | Shop dashboard front end |
| **Backend code** | Core backend, Excel controller (`getCategories`, `downloadShopExcel`, `processShopExcel`, `getUploadedExcelFiles`, `downloadShopFailedRows`), with its own feature tests for template mode, failed rows and the category check |
| **Backward compatible** | Yes. Every change is additive; the current shop dashboard keeps working unchanged. |

---

## 1. What changes for the front end

| # | Change | Endpoint |
| --- | --- | --- |
| 1 | Every category now has `products_count` | `GET /excel/categories` |
| 2 | New optional query parameter `mode=template` \| `products` | `GET /excel/downloadExcel/{category_id}` |
| 3 | Every uploaded file now has `failed_rows_count` | `GET /excel/getUploadedExcelFiles` |
| 4 | **New endpoint**: download the failed rows of an upload | `GET /excel/failedRows/{uploadedFileId}` |
| 5 | New optional fields `expected_category_id`, `confirm_category`; new `409` answer | `POST /excel/processExcel` |

Nothing else changes: same URLs, headers, permissions, response envelope and file format.

---

## 2. Headers (unchanged)

| Header | Required | Value | Notes |
| --- | --- | --- | --- |
| `Authorization` | ✅ | `Bearer <access_token>` | Access token of the logged-in shop user |
| `X-Seller-ID` | ✅ | `<sellerId>` | Scopes the counts and the products to this seller |
| `Accept` | ✅ | `application/json` | For the download, errors still come back as JSON |
| `lang` | ⬜ | e.g. `en`, `ar` | |

### Permission (unchanged)

Both endpoints need **one of** `CREATE_PRODUCT`, `UPDATE_PRODUCT` or `SUPER_ADMIN` for the
`X-Seller-ID` seller. Otherwise they return **403**.

---

## 3. `GET /excel/categories`

Active categories as a three-level tree, in display order. **New:** `products_count`.

### Response `200`

```json
{
  "isSuccessful": true,
  "hasContent": true,
  "code": 200,
  "message": "Data Got!",
  "detailed_error": null,
  "data": [
    { "id": 12, "name": "Clothes", "display_name": "Clothes", "level": 0, "products_count": 37 },
    { "id": 45, "name": "Men", "display_name": "Clothes -> Men", "level": 1, "products_count": 12 },
    { "id": 78, "name": "Shirts", "display_name": "Clothes -> Men -> Shirts", "level": 2, "products_count": 5 },
    { "id": 13, "name": "Shoes", "display_name": "Shoes", "level": 0, "products_count": 0 }
  ]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | Pass it to `downloadExcel/{category_id}` |
| `name` | string | The category's own name |
| `display_name` | string | Full path, `Parent -> Sub -> SubSub`. Use it as the label and for search |
| `level` | int | `0`, `1` or `2`. Use it for the indent |
| `products_count` | int | **New.** How many of the `X-Seller-ID` seller's products are in this category, at any level. `0` when none. It is exactly the number of products a `mode=products` download of this category returns |

> A parent's count includes the products of its sub categories (a product is linked to its
> parent and its sub category), so `Clothes` can show 37 while `Clothes -> Men` shows 12.

---

## 4. `GET /excel/downloadExcel/{category_id}?mode=…`

Returns the `.xlsx` file (binary, `Content-Disposition: attachment`).

### Query parameters

| Parameter | Required | Values | Meaning |
| --- | --- | --- | --- |
| `mode` | ⬜ | `template` | **Empty template**: headers, dropdown lists and hidden sheets only, **no product rows**. For adding new products |
| | | `products` | **The seller's products of this category**, one row per variation, with current values. For updating them |
| | | *(missing)* | Same as `products` (today's behaviour, kept so the current dashboard does not change) |

> ✅ **Always send `mode`.** The seller dashboard defaults to `template`, and the shop
> dashboard should do the same, so a "new products" file never carries existing rows by
> mistake. The "no mode = products" default exists only for backward compatibility.

### File name

`<CategoryName>_template_<yyyy-mm-dd_hh-mm-ss>.xlsx` (unchanged).

### Errors

| Status | When | Body |
| --- | --- | --- |
| `403` | No `CREATE_PRODUCT` / `UPDATE_PRODUCT` / `SUPER_ADMIN` | Standard envelope, `message: "You do not have permission to access."` |
| `422` | `mode` is anything other than `template` or `products` | Standard envelope, `detailed_error[0].code = "mode"` |

```json
{
  "isSuccessful": false,
  "code": 422,
  "hasContent": false,
  "message": "The selected mode is invalid.",
  "detailed_error": [{ "code": "mode", "message": "The selected mode is invalid." }],
  "data": null
}
```

Because the download is a file, request it with `responseType: 'blob'` and, on a non-2xx
status, read the blob as JSON to show `message`.

---

## 5. Recommended UI (same as the seller dashboard)

Mirror the seller dashboard's "Step 1: Select Category" card:

```
┌ Step 1: Select Category ─────────────────────────────────────────────┐
│ ☐ Show only categories that have my products  [4]                    │
│ [ Clothes -> Men -> Shirts (5 Products)                    ▼ 🔍 ]   │
│                                                                      │
│ What do you want to do?                                              │
│ (•) Add new products                                                 │
│     Download an empty template: column headers and lists only,       │
│     no product rows. Your existing products are not changed.         │
│ ( ) Update my products                                               │
│     Download the 5 products of this category with their current      │
│     values, edit them and upload the file. Do not change the Id.     │
│                                         [ ⬇ Download empty template ] │
└──────────────────────────────────────────────────────────────────────┘
```

| # | Element | Behaviour |
| --- | --- | --- |
| UI-1 | **Category select** | Searchable (type to filter on `display_name`). Indent by `level`. Label: `display_name`, plus ` (N Products)` when `products_count > 0` |
| UI-2 | **"Show only categories that have my products"** checkbox | Filters the list to `products_count > 0`. Show the number of such categories next to it. Disable it when that number is 0. If the selected category is filtered out, clear the selection |
| UI-3 | **"Add new products"** (radio) | Default. Sends `mode=template` |
| UI-4 | **"Update my products"** (radio) | Sends `mode=products`. **Disabled** when no category is selected or the selected category has `products_count = 0`; hint: *"You have no products in this category yet. Use Add new products."* If it was selected and becomes disabled, switch back to "Add new products" |
| UI-5 | **Download button** | Disabled until a category is selected. Text: *"Download empty template"* or *"Download N products"* (N = `products_count`) |
| UI-6 | *(optional)* Remember the last choice | Store `{category, onlyWithProducts, mode}` in `localStorage` under a key that includes the seller id (e.g. `bulk-import:shop:<sellerId>`), and restore it on the next visit. Restore "Update my products" only if that category still has products. Wrap storage calls in `try/catch` |

### Request examples

```http
GET {{host}}/api/v1/shop/excel/categories
Authorization: Bearer <token>
X-Seller-ID: 42
Accept: application/json
```

```http
GET {{host}}/api/v1/shop/excel/downloadExcel/78?mode=template
Authorization: Bearer <token>
X-Seller-ID: 42
Accept: application/json
```

```ts
const res = await api.get(`/excel/downloadExcel/${categoryId}`, {
  params: { mode: updateMyProducts ? 'products' : 'template' },
  headers: { 'X-Seller-ID': sellerId },
  responseType: 'blob',
});
```

---

## 6. Already in the file, nothing to build

The downloaded template now explains itself (ticket
[`z8n6b616f1`](https://app.clickup.com/t/90182710436/z8n6b616f1)); this comes with the file
and needs no front-end work:

- the header row stays visible while scrolling;
- required columns (Product Name, Purchase Price, Sell Price, Sell Price After Discount,
  Quantity) have a dark red header;
- every header has a note explaining what it expects.

Header names are unchanged, so the upload (`POST /excel/processExcel`) is unchanged.

---

## 7. Failed rows after an import with errors

When an import finishes "Completed with errors" or "failed", the seller can download a file
with **only the rows that were not imported**, each with its reason, fix them and upload that
file again. It is the uploaded workbook itself (all lists, dropdowns and hidden sheets kept),
with the other rows removed and a **Reason** column added at the end. The import ignores the
Reason column, so the fixed file uploads as is.

### 7.1 `GET /excel/getUploadedExcelFiles` — new `failed_rows_count`

The response is unchanged (paginated, 10 per page) except that each file has one more field.
The other file fields are unchanged and left out of this example:

```json
{
  "isSuccessful": true,
  "code": 200,
  "message": "Data Got!",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 931,
        "original_filename": "shirts.xlsx",
        "upload_status": "completed_with_errors",
        "processing_notes": "Import finished: 49 of 50 products saved. 2 rows ignored. ...",
        "created_at": "2026-10-15T09:12:44.000000Z",
        "failed_rows_count": 2
      }
    ],
    "per_page": 10,
    "total": 1
  }
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `failed_rows_count` | int | **New.** Rows of this file that were not imported. `0` when none (also while the file is still processing) |

### 7.2 `GET /excel/failedRows/{uploadedFileId}` — new

Returns the `.xlsx` file (binary). Same headers and permission as the other Excel endpoints.
Request it with `responseType: 'blob'`; errors come back as JSON.

| Status | When | `message` |
| --- | --- | --- |
| `200` | The file | — (file name `<original name>_failed_rows_<yyyy-mm-dd_hh-mm-ss>.xlsx`) |
| `403` | No product permission | `You do not have permission to access.` |
| `404` | Not an upload of the `X-Seller-ID` seller (or no such id) | `Uploaded file not found.` |
| `404` | The original file is no longer in storage | `The original file is no longer available.` |
| `422` | The file has no failed rows | `This file has no failed rows.` |
| `500` | The file could not be built | `The failed rows file could not be created. Please try again.` |

### 7.3 UI

| # | Element | Behaviour |
| --- | --- | --- |
| UI-7 | **"Download failed rows"** button on each row of the uploaded files list | Show it only when `failed_rows_count > 0`. Label it with the count, e.g. *"Download 2 failed rows"*. Tooltip: *"Fix these rows and upload the file again"* |
| UI-8 | After a download | Optionally remind: *"Fix the rows, keep the Id column, and upload this file again. The Reason column is ignored."* |

---

## 8. Warning when the file is for another category

Every template carries the category it was made for (hidden sheet `Category`). When the
seller has chosen a category in the dashboard and uploads a file made for a **different**
category, the backend asks first instead of importing.

### 8.1 `POST /excel/processExcel` — new optional fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file_url` | url | ✅ | Unchanged |
| `expected_category_id` | int | ⬜ | **New.** The category selected in the dashboard. Omit it when none is selected: then there is no check |
| `confirm_category` | bool | ⬜ | **New.** Send `true` after the seller confirmed the question below |

### 8.2 New answer `409 Conflict`

Nothing is stored or queued. The standard envelope, with the two categories in `data`:

```json
{
  "isSuccessful": false,
  "code": 409,
  "hasContent": false,
  "message": "This file is for another category than the one selected.",
  "detailed_error": [{ "message": "This file is for another category than the one selected." }],
  "data": {
    "category_mismatch": true,
    "file_category": { "id": 78, "name": "Shirts" },
    "chosen_category": { "id": 13, "name": "Shoes" }
  }
}
```

The file is always imported into **its own** category (`file_category`), as before. The
question only stops an upload the seller did not mean.

No `409` when: `expected_category_id` is missing, it equals the file's category, or the file
has no `Category` sheet (the import then reports that itself).

### 8.3 Flow

```ts
async function upload(fileUrl: string, categoryId?: number, confirm = false) {
  try {
    return await api.post('/excel/processExcel', {
      file_url: fileUrl,
      ...(categoryId ? { expected_category_id: categoryId } : {}),
      ...(confirm ? { confirm_category: true } : {}),
    });
  } catch (e) {
    const body = e.response?.data;
    if (e.response?.status === 409 && body?.data?.category_mismatch) {
      const { file_category, chosen_category } = body.data;
      const ok = await confirmDialog(
        `This file is for "${file_category.name}", but "${chosen_category.name}" is selected. ` +
        `Import it into "${file_category.name}"?`
      );
      if (ok) return upload(fileUrl, categoryId, true);
      toast.info('Upload cancelled. Nothing was imported.');
      return;
    }
    throw e;
  }
}
```

| # | Element | Behaviour |
| --- | --- | --- |
| UI-9 | Upload | Send the selected category as `expected_category_id` |
| UI-10 | On `409` with `data.category_mismatch` | Show a confirm dialog naming both categories. **Yes** → send the same request again with `confirm_category: true`. **No** → *"Upload cancelled. Nothing was imported."* |

---

## 9. Front-end test checklist

- [ ] The category list shows `(N Products)` for categories with products, and nothing for the rest.
- [ ] Ticking the checkbox leaves only categories with products; unticking brings all back.
- [ ] "Add new products" downloads a file with headers only, even for a category with products.
- [ ] "Update my products" downloads exactly N product rows (N = the count shown), only this seller's.
- [ ] "Update my products" is disabled for a category with 0 products and when nothing is selected.
- [ ] The button text follows the choice ("Download empty template" / "Download N products").
- [ ] A user without product permission sees the 403 message, not a broken file.
- [ ] Switching the seller (`X-Seller-ID`) changes the counts.
- [ ] "Download failed rows" shows only for files with `failed_rows_count > 0`, and the file holds exactly those rows with a Reason column.
- [ ] Uploading the fixed failed-rows file imports the rows.
- [ ] Uploading a Shirts file with Shoes selected shows the question; **No** uploads nothing; **Yes** imports it.
- [ ] Uploading with the matching category, or with no category selected, shows no question.
