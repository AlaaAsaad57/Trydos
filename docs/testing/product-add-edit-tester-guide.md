# Add / Edit Product (Seller Dashboard) — Tester Guide

How to test the **New Product** and **Product** screens in the Seller Dashboard.
Everything here is taken from the code, not from older docs.

---

## 1. Where the screens are

Open URLs with the **`sy-en`** locale. `gb-en` opens the region picker over the page.

| Screen | URL |
| --- | --- |
| Dashboard (product list) | `/sy-en/sellerProfile/sellerDashboard/<sellerId>` |
| Add product | `/sy-en/sellerProfile/sellerDashboard/<sellerId>/products/new` |
| Edit product | `/sy-en/sellerProfile/sellerDashboard/<sellerId>/products/<productId>` |

How to reach them by clicking:

- **Add** — the "Add product" button on the dashboard. It only appears with `CREATE_PRODUCT`.
- **Edit** — click any product row in the dashboard product list.

Both screens use the **same form component**. The differences are listed in section 6.

---

## 2. Permissions

| Permission | Effect |
| --- | --- |
| `CREATE_PRODUCT` | The "Add product" button shows on the dashboard. |
| `UPDATE_PRODUCT` | The **Edit** button shows on the product screen. Without it you see a lock icon and the text **"View only"**. |
| `CHANGE_PRODUCT_STATUS` | The **Allow Purchase** / **Disable** button shows. |
| `READ_SHOP_INFO` | Needed for the form to open **at all** (see section 3). |
| `READ_PRODUCT_IMAGES` | The **"Choose from gallery"** button shows in the Images and SEO sections. |
| `SUPER_ADMIN` | Counts as having every permission above. |

Note: the seller can open the **Edit** screen in read-only mode without `UPDATE_PRODUCT`,
but the category dropdowns then only show the **already selected** items. That is
expected — the cascading lookup call needs `UPDATE_PRODUCT`.

---

## 3. Shop info gate — check this first

Before any form is drawn, the page waits for `GET /shop/info`. Four outcomes:

| Situation | What you must see |
| --- | --- |
| Still loading | A grey skeleton form. No fields yet. |
| No `READ_SHOP_INFO` | "Adding a product needs permission to view shop info…" (add) or "Opening a product needs permission…" (edit). **No Retry button.** |
| Call failed (5xx / network) | "Couldn't load your shop details…" **with a Retry button.** Retry must re-issue the call. |
| Success | The form renders. Money fields show the shop currency code (e.g. `SYP`) inside the input. |

The form must **never** appear first and then be taken away. If you see the form flash and then vanish, that is a bug.

---

## 4. The two seller cases — approved vs not approved

This is driven by `is_new_products_approval` from `GET /shop/info`.

- **Approved seller** — the value is `1` / `true`, **or missing / null**. Missing counts as approved.
- **Not approved seller** — the value is explicitly `0` or `false`.

### Case A — approved seller

All price fields are visible and editable:

Unit Price, Discount Price, Purchase Price, Luck Price, Shipping Cost, Tax, Tax Type,
Per-country Extra Price, and the variant table columns **Price / Discount / Luck**.

Price rules that are checked (see section 8).

### Case B — NOT approved seller

**Purchase Price is the only price the seller may enter.** These are **hidden**, not greyed out — they must not be on the page at all:

- Pricing section: **Unit Price**, **Discount Price**, **Luck Price**, **Shipping Cost**, **Tax**, **Tax Type**
- Origin & Countries section: the whole **Per-country Extra Price** block (label, Add button, rows)
- Variants table: the **Price**, **Discount** and **Luck** columns — header cells **and** body cells

Still visible and editable for this seller: Purchase Price, Current Stock, Weight,
Max Allowed Qty, Pieces / Unit, Shipping Days, and the variant Qty / SKU / Barcode / Location columns.

What else changes for a not-approved seller:

1. **Price validation is skipped.** The unit-price, discount-price and luck-price rules do not run.
   Purchase Price is still required and must be a number ≥ 0.
2. **The variant price rules are skipped** — "unit price must be greater than discount price"
   and the variant luck-price limits do not run.
3. **The request still sends every price key.** The hidden fields go out as `0` or their existing value.
   So a save must still succeed.
4. **If the backend refuses one of those six hidden price keys**, the message must appear in the
   **grey message box above the form**, not under a field. There is no field on screen to mark.

> ✅ **Test tip:** ask for two shops — one with `is_new_products_approval = 1` and one with `= 0`.
> Testing "no shop info permission" needs a third account.

---

## 5. Adding a product — the flow

1. Open the Add product URL. The form opens **already in edit mode** (no "Edit" button step).
2. Fill the form (sections below).
3. Click **Create Product** (top right, or in the sticky bar at the bottom).
4. A confirm dialog opens: **"Confirm new product"** with the line
   *"These details will be saved (N item(s))."* and a list of what you entered.
5. Click confirm.
6. **Check:** success message **"Product created successfully."**
7. **Check:** the page moves to the edit screen of the new product
   (`…/products/<newId>`). If the backend returns no id, it goes back to the dashboard instead.

Points to check on the Add screen:

- **Attributes** section is **not shown**. Attributes are only editable after the product exists.
- **Video** section is **not shown**. The create endpoint drops video, so it is only offered on edit.
- The **Translations** section shows a **Default Language** picker and **one** language block.
- No approval banner appears after create, even for a not-approved seller.
  Create always shows "Product created successfully."
- The new product always starts as **Disabled** (not purchasable).

---

## 6. Editing a product — the flow

1. Open a product from the dashboard list. The form opens **read-only**.
2. **Check:** the line *"You're viewing this product. Tap Edit to make changes."* is shown (only with `UPDATE_PRODUCT`).
3. Click **Edit**. All fields become editable and a sticky save bar appears at the bottom.
4. Change something and click **Save Changes**.
5. Confirm dialog: **"Confirm changes"** — *"These fields will be updated (N item(s))."*
   Each row is tagged **Added** / **Removed** / **Updated**.
6. Click confirm.

Expected results:

- **Check:** "Product updated successfully." — but **only** when the backend did not flag approval.
- If the backend returns `requires_approval`, no success toast. Instead a green banner:
  - approved seller → **"Changes were submitted"**
  - not-approved seller → **"Changes were submitted and are pending admin approval — they go live once approved."**
- After a successful save the form goes back to **read-only** mode.

**Cancel** must put every field back to the value it had before you clicked Edit, and clear all error messages.

### Attributes (edit only)

Attributes save through their own request, sent **after** the product save, and **only when they changed**.

- **Check:** editing a normal field with no attribute change must not touch attributes.
- If the product saved but attributes failed: message **"Product updated, but attributes failed to save."**
  and the attribute values on screen must **roll back** to the stored ones. The rest of your edit stays saved.

### Header banners (edit only)

| State | Banner |
| --- | --- |
| Product has a pending update | "This product has pending changes awaiting admin approval. The form below shows your submitted changes; the live product still shows the previous values until approval." |
| Last change was denied (`request_status = 2`) | "Your last changes to this product were denied. The live product still shows the previous values." |
| Waiting for first approval (`request_status = 0`) | A yellow **"Pending Approval"** pill next to the name. |

The pending-changes banner **wins** over the other two. You must never see the "Pending Approval" pill and the pending-changes banner at the same time.

---

## 7. The form sections, in order

| # | Section | Shown on Add? | Shown on Edit? |
| --- | --- | --- | --- |
| 1 | General | yes | yes |
| 2 | SEO / Meta | yes | yes |
| 3 | Translations | yes (single language) | yes (all 4 languages) |
| 4 | Pricing & Stock | yes | yes |
| 5 | Variants | yes | yes |
| 6 | Images | yes | yes |
| 7 | Categories | yes | yes |
| 8 | Attributes | **no** | yes |
| 9 | Labels & Tags | yes | yes |
| 10 | Origin & Countries | yes | yes |
| 11 | Video | **no** | yes |

---

## 8. Validation — what must block the save

When any check fails: a red toast **"Please fix the highlighted fields before saving."**,
the page scrolls to the **first failing field reading top to bottom**, and the confirm dialog does **not** open.

### Always required (Add and Edit)

| Field | Rule / message |
| --- | --- |
| Product Name | "Product name is required" |
| Unit | must be one of `pc`, `kg`, `gms`, `l` |
| Brand | "Brand is required" |
| Seller Product ID | "Seller Product ID is required" |
| Seller Product ID | must be unique — "This Seller Product ID is already used". Checked **live while typing**, against the list the backend sent. On edit, the product's **own** id must stay allowed. |
| Location | "Location is required" |
| Country of Origin | "Select a valid origin country" |
| Pieces / Unit | required, and a whole number **1–100** |
| Current Stock | must be **greater than 0** |
| Weight | "Weight is required"; then must be **greater than 0** — for every unit, including `kg` and `gms` |
| Purchase Price | required, number ≥ 0 |
| Labels | at most 3 — "At most 3 labels allowed" |
| Images | at least one — "At least one product image is required" |
| Categories | at least one — "Select at least one category" |

### Only on Add

| Field | Rule |
| --- | --- |
| Boutique | "Boutique is required" (on Edit an empty boutique is allowed) |
| Description | required (on Edit an empty description is allowed) |
| Translations | the default-language **Name** must not be empty |

### Only on Edit

- An **English (en)** name is required.
- Per language, Name and Description are a **pair**: fill both or leave both empty.
  Half-filled gives "Description is required for AR" or "Product name is required for AR".

### Prices — approved seller only

- Unit Price: required, number ≥ 0.
- Discount Price: if entered, must be **lower than** Unit Price.
- Luck Price: must be **≤ Discount Price** when a discount is set, otherwise **≤ Unit Price**.

**Known current behaviour, do not report as a bug:** the two checks
"Discount price must be greater than purchase price" and "Unit price must be greater
than purchase price" can never fire. The code only reaches them when Purchase Price is
empty, and an empty Purchase Price already fails its own check first.

### Colours and images

Only checked when at least one colour is selected:

- Every colour needs at least one image →
  "Every color needs at least one image (missing: <colour name>)"
- Every image must be assigned to some colour →
  "Every image must be assigned to a color (N unassigned)"

### Variants

Adding a colour or a size builds one row per combination. Per row:

- Qty is required and cannot be negative.
- SKU is required, and must be **unique inside this product** — "SKU must be unique within the product".
- Location is required.
- Price / Discount / Luck cannot be negative (checked even for a not-approved seller).
- Approved seller only: row Price must be greater than row Discount; row Luck must not
  be above the row Discount, or above the row Price when there is no discount.

**Current Stock becomes read-only once variants exist** and is recalculated as the **sum of
the variant quantities**. So if every variant qty is 0, Current Stock becomes 0 and the save
is blocked with "Enter a Valid Value for Quantity In Variants Table".

### No changes

Clicking Save with nothing changed shows **"No changes to save."** and does not open the dialog.
Test this: click Edit, change nothing, click Save Changes.

---

## 9. Backend refusals

If the save is refused, check where each message lands:

- A refusal that **names a known field** must appear **under that field**, in the backend's own words,
  and the page must scroll to it.
- A refusal about something with no input on screen (a colour row, a translation row, a hidden
  price field for a not-approved seller) must appear in the **grey box above the form**.
- The box shows at most **5 lines**, deduplicated. Extra lines are counted:
  "More problems were reported: N".
- The toast line: if any field got marked → "Please fix the highlighted fields before saving.";
  otherwise the **first** message from the box; otherwise "Failed to create product" /
  "Failed to update product".
- **Fixing a field must clear that field's backend message as you type**, and must not clear
  the messages on other fields.

---

## 10. Images and video

- **Upload from device** — the Images picker takes **several files at once**.
- **Choose from gallery** — only with `READ_PRODUCT_IMAGES`.
- The **first** image carries the **Cover** badge. Reorder with the arrows and check the badge moves.
- While an upload is running, every Save button is **disabled** and shows "Uploading…".
- Failed upload → red toast with the message. Nothing is added to the grid.
- SEO section has its own single **meta image** upload.
- Video (edit only): upload one video, or tick existing videos for removal.

---

## 11. Allow Purchase / Disable

Needs `CHANGE_PRODUCT_STATUS`. Edit screen only.

1. The pill next to the product name reads **Purchasable** or **Disabled**.
2. Click **Allow Purchase** → dialog "Allow this product to be purchased?".
3. Click **Disable** → dialog "Disable purchasing?".
4. **Check:** on success → toast "Status updated." and the pill flips.
5. **Check:** when the product fails activation checks, the dialog stays open and lists the
   reasons under **"Cannot enable yet — resolve these first:"**. The pill must **not** change.

Turning purchasing **off** should always work. Turning it **on** is the one that can be refused.

---

## 12. Categories

- Picking a main category loads its sub-categories and sub-sub-categories, plus the
  Attributes for that branch. A spinner covers the section while it loads.
- **Every Save button is disabled while categories are loading.**
- Removing a category must remove its sub-categories, sub-sub-categories and attribute
  values from your selection.
- **If a category lookup call fails**, your saved selections must **stay**. They must not be
  silently cleared. Nothing is pruned when any branch failed to load.
- Changing selection quickly several times must end on the **last** selection, not an older one.

---

## 13. Quick checklist

**Approved seller**

- [ ] Add: all price fields present; create succeeds; lands on the new product's edit page
- [ ] Add: Attributes and Video sections absent
- [ ] Edit: opens read-only; Edit button works; Cancel restores values
- [ ] Edit: confirm dialog lists exactly what changed
- [ ] Save with no change → "No changes to save."
- [ ] Discount ≥ Unit Price is blocked; Luck above the selling price is blocked
- [ ] Duplicate Seller Product ID is caught while typing
- [ ] Duplicate variant SKU is blocked
- [ ] Allow Purchase works, and refusal reasons show inside the dialog

**Not-approved seller**

- [ ] Unit / Discount / Luck / Shipping Cost / Tax / Tax Type are **not on the page**
- [ ] Per-country Extra Price block is **not on the page**
- [ ] Variant table has no Price / Discount / Luck columns
- [ ] Purchase Price is present and required
- [ ] Create and Update both still succeed
- [ ] After update, the banner says the changes are pending admin approval
- [ ] A backend price refusal shows in the box above the form, never under a field

**Both**

- [ ] No `READ_SHOP_INFO` → permission message, no Retry
- [ ] Shop info request fails → error message **with** Retry, and Retry re-tries
- [ ] No `UPDATE_PRODUCT` → "View only", no Edit button
- [ ] Arabic (`sy-ar`) — the form is right-to-left and the currency stays inside the input
