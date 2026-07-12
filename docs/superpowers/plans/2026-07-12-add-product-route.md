# Add-New-Product Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `products/new` route that renders the existing `ProductEditor` in a create mode — loads a blank form + lookups from `GET /shop/products/create`, submits the same body to `POST /shop/products/add`, and redirects to the new product's edit page.

**Architecture:** Reuse `ProductEditor` via a new `mode` prop (no fork). Add two service methods + two `REQUESTS_DATA` entries, an `emptyProductForm()` factory, the create-mode branches in `ProductEditor`, the route page, and an "Add Product" entry button.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind. pnpm.

## Global Constraints

- **No automated tests** (CLAUDE.md). Do NOT add test files. Verify each task with `pnpm lint` + `npx tsc --noEmit` + the manual check.
- Endpoints (confirmed with the requester): lookups `GET /shop/products/create` → `{ data: { lookups } }`; submit `POST /shop/products/add` (same `buildUpdateFormData` body as update). Permission: `CREATE_PRODUCT`.
- After a successful create, redirect to `.../products/{newId}` where `newId = res.data.product_id ?? res.data.id`.
- Edit-mode behavior must be unchanged — every create change is behind `isCreate`/`mode === "create"`.
- Do NOT create a git branch; commit on `develop`. Stage ONLY each task's named files. The working tree has unrelated pre-existing dirty/untracked files — never stage them.
- React Compiler is ON — no manual `useMemo`/`useCallback`.

## File Structure

- **Modify** `utils/Requests.ts` — two new `REQUESTS_DATA` entries.
- **Modify** `services/sellerDashboard/index.ts` — `getProductCreateForm`, `addProduct`.
- **Modify** `components/SellerDashboard/productEdit/helpers.ts` — `emptyProductForm()`.
- **Modify** `components/SellerDashboard/productEdit/ProductEditor.tsx` — `mode` prop + create branches.
- **Create** `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page.tsx`.
- **Modify** `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` — "Add Product" entry.

---

## Task 1: Scaffolding — endpoints, service methods, blank-form factory

**Files:**
- Modify: `utils/Requests.ts` (before the closing `};` of `REQUESTS_DATA`, after `FETCH_HIDDEN_ORDERS`)
- Modify: `services/sellerDashboard/index.ts` (after `updateProduct`, before `changeProductStatus`)
- Modify: `components/SellerDashboard/productEdit/helpers.ts` (after `emptyVariantRow`)

**Interfaces:**
- Produces: `REQUESTS_DATA.GET_PRODUCT_CREATE_FORM`, `REQUESTS_DATA.ADD_PRODUCT`; `SellerDashboardService.getProductCreateForm(sellerId): Promise<any>` (envelope with `data.lookups`); `SellerDashboardService.addProduct(sellerId, formData): Promise<any>`; `emptyProductForm(): ProductForm`.

- [ ] **Step 1: Add REQUESTS_DATA entries**

In `utils/Requests.ts`, immediately after the `FETCH_HIDDEN_ORDERS` line (`code: 187`) and before the closing `};`, add:

```ts
  GET_PRODUCT_CREATE_FORM: { reqTitle: "GET_PRODUCT_CREATE_FORM", code: 188 },
  ADD_PRODUCT: { reqTitle: "ADD_PRODUCT", code: 189 },
```

- [ ] **Step 2: Add the two service methods**

In `services/sellerDashboard/index.ts`, immediately after the `updateProduct` method (it ends with a `}` closing the async method, before the `// POST /shop/products/{id}/change-status` comment), insert:

```ts
  // GET /shop/products/create — CREATE_PRODUCT | SUPER_ADMIN
  // Returns the lookups needed to render a BLANK product form (no product yet).
  async getProductCreateForm(sellerId: string) {
    const res = await fetchData({
      url: `/shop/products/create`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_PRODUCT_CREATE_FORM,
      sellerId,
    });
    if (!res?.success) {
      throw new Error(res?.message || "Failed to load product form");
    }
    return res;
  }

  // POST /shop/products/add — CREATE_PRODUCT | SUPER_ADMIN
  // Same multipart body as update (buildUpdateFormData). Returns the new product
  // in the standard envelope; on a requires-approval seller it is stored pending.
  async addProduct(sellerId: string, formData: FormData) {
    return fetchData({
      url: `/shop/products/add`,
      method: "POST",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.ADD_PRODUCT,
      body: formData,
      sellerId,
      noMessage: true,
    });
  }
```

- [ ] **Step 3: Add `emptyProductForm` to helpers.ts**

In `components/SellerDashboard/productEdit/helpers.ts`, immediately after the `emptyVariantRow` function, add:

```ts
/** A blank ProductForm for the create flow. Defaults are chosen to satisfy the
 *  same shape validate()/buildUpdateFormData() expect (unit "pc", tax percent,
 *  status disabled, all number fields empty strings, empty collections). */
export function emptyProductForm(): ProductForm {
  return {
    name: "",
    unit: "pc",
    barcode: "",
    seller_product_id: "",
    description: "",
    brand_id: "",
    boutique_id: "",
    label: "",
    model_number: "",
    report_ref_number: "",
    location_id: "",
    unit_price: "",
    discount_price: "",
    purchase_price: "",
    luck_price: "",
    current_stock: "",
    weight: "",
    max_allowed_qty: "",
    count_of_pieces: "",
    shipping_cost: "",
    shipping_days: "",
    tax: "",
    tax_type: "percent",
    multiply_qty: false,
    packed_after_ordering: false,
    meta_title: "",
    meta_description: "",
    meta_image: "",
    meta_image_url: "",
    origin_country_iso: "",
    status: 0,
    category_id: [],
    sub_category_id: [],
    sub_sub_category_id: [],
    labels: [],
    tags_ids: [],
    countries_iso: [],
    extra_price_for_country: [],
    images: [],
    cloud_video: "",
    remove_videos: [],
    existing_videos: [],
    colors: [],
    sizes: [],
    variations: {},
    colorImages: {},
    translations: [],
  };
}
```

- [ ] **Step 4: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors.

Run: `npx tsc --noEmit`
Expected: clean. If `emptyProductForm`'s return is missing or has an extra `ProductForm` field, tsc will error here — fix to match the `ProductForm` interface exactly.

- [ ] **Step 5: Commit**

```bash
git add utils/Requests.ts services/sellerDashboard/index.ts components/SellerDashboard/productEdit/helpers.ts
git commit -m "feat(product-edit): add create-form + add-product endpoints and blank-form factory

getProductCreateForm (GET /shop/products/create) and addProduct
(POST /shop/products/add, same body as update), plus emptyProductForm() for the
create flow. No consumer yet.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `ProductEditor` create mode

**Files:**
- Modify: `components/SellerDashboard/productEdit/ProductEditor.tsx`

**Interfaces:**
- Consumes: `getProductCreateForm`, `addProduct`, `emptyProductForm` (Task 1); `useRouter` from `next/navigation`.
- Produces: `ProductEditor` accepts `{ sellerId: string; productId?: string; local: string; mode?: "edit" | "create" }`. In create mode it loads a blank form, submits via `addProduct`, and redirects to the new product's edit page.

- [ ] **Step 1: Imports + props**

Add `useRouter` to the `next/navigation` import (there is already a `"use client"` file; add the import near the top with the other imports):

```ts
import { useRouter } from "next/navigation";
```

Add `emptyProductForm` and `getProductCreateForm`/`addProduct` usage: `emptyProductForm` comes from `./helpers` — add it to the existing `./helpers` import list. (`getProductCreateForm`/`addProduct` are called via `SellerDashboardService`, already imported.)

Change the component signature to:

```ts
export default function ProductEditor({
  sellerId,
  productId,
  local,
  mode = "edit",
}: {
  sellerId: string;
  productId?: string;
  local: string;
  mode?: "edit" | "create";
}) {
  const router = useRouter();
  const isCreate = mode === "create";
```

(Add the two lines `const router = ...` and `const isCreate = ...` right after the destructure, before `const { sellerProducts, ... } = useSellerProfile();`.)

- [ ] **Step 2: Permission flag**

Just after `const canChangeStatus = has("CHANGE_PRODUCT_STATUS");`, add:

```ts
  const canCreate = has("CREATE_PRODUCT");
```

- [ ] **Step 3: Branch `load()` for create**

Replace the body of `load()`'s `try` block so create loads the blank form. The full `load` becomes:

```ts
  const load = async () => {
    setLoading(true);
    setLoadError(null);
    setDenied(false);
    try {
      if (isCreate) {
        const res = await SellerDashboardService.getProductCreateForm(sellerId);
        const lk = (res.data?.lookups || {}) as Lookups;
        const built = emptyProductForm();
        setLookups(lk);
        setForm(built);
        setInitial(built);
        setStatus(0);
        setEditMode(true);
        return;
      }
      const res = await SellerDashboardService.getProductForEdit(
        sellerId,
        productId as string,
      );
      const product = res.data?.product;
      const lk = (res.data?.lookups || {}) as Lookups;
      if (!product) throw new Error("Product not found");
      const built = buildFormFromEdit(product, lk);
      setLookups(lk);
      setForm(built);
      setInitial(built);
      setStatus(Number(product.status ?? 0));
      setProductMeta({ request_status: product.request_status });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.load", error: msg, productId: productId ?? "new" });
      if (/permission|forbidden|403/i.test(msg)) setDenied(true);
      else setLoadError(msg || t("Failed to load product"));
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Branch `confirmSave()` for create**

Replace `confirmSave` with:

```ts
  const confirmSave = async () => {
    if (!form) return;
    setSaving(true);
    setApprovalNote(false);
    try {
      const fd = buildUpdateFormData(form);
      if (isCreate) {
        const res = await SellerDashboardService.addProduct(sellerId, fd);
        if (!res?.success) {
          const detail =
            Array.isArray(res?.detailed_error) && res.detailed_error.length
              ? res.detailed_error.map((d: any) => d.message).join(" • ")
              : "";
          throw new Error(detail || res?.message || t("Failed to create product"));
        }
        setConfirm(null);
        showSuccessMessage(t("Product created successfully."));
        const newId = res.data?.product_id ?? res.data?.id;
        router.replace(
          newId != null
            ? `/${local}/sellerProfile/sellerDashboard/${sellerId}/products/${newId}`
            : `/${local}/sellerProfile/sellerDashboard/${sellerId}`,
        );
        return;
      }
      const res = await SellerDashboardService.updateProduct(
        sellerId,
        productId as string,
        fd,
      );
      if (!res?.success) {
        const detail =
          Array.isArray(res?.detailed_error) && res.detailed_error.length
            ? res.detailed_error.map((d: any) => d.message).join(" • ")
            : "";
        throw new Error(detail || res?.message || t("Failed to update product"));
      }
      // success
      setConfirm(null);
      setInitial(form);
      setEditMode(false);
      setErrors({});
      const requiresApproval = !!res.data?.requires_approval;
      setApprovalNote(requiresApproval);
      if (!requiresApproval) showSuccessMessage(t("Product updated successfully."));
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      LogError({ scenario: "ProductEditor.update", error: msg, productId: productId ?? "new" });
      showErrorMessage(msg);
      setConfirm(null);
    } finally {
      setSaving(false);
    }
  };
```

- [ ] **Step 5: Create-mode header actions + Cancel**

The header "Actions" block currently renders the change-status button and the Edit/Cancel/Save buttons. Replace that Actions `<div className="flex items-center gap-2.5">…</div>` block with a create-aware version:

```tsx
          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {isCreate ? (
              <>
                <DashButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/${local}/sellerProfile/sellerDashboard/${sellerId}`)
                  }
                >
                  {t("Cancel")}
                </DashButton>
                <DashButton icon="check" onClick={startSave}>
                  {t("Create Product")}
                </DashButton>
              </>
            ) : (
              <>
                {canChangeStatus && (
                  <DashButton
                    variant={status === 1 ? "danger" : "secondary"}
                    size="sm"
                    icon={status === 1 ? "lock" : "check"}
                    onClick={() => {
                      setStatusBlockers([]);
                      setStatusTarget(status === 1 ? 0 : 1);
                    }}
                  >
                    {status === 1 ? t("Disable") : t("Allow Purchase")}
                  </DashButton>
                )}
                {!editMode ? (
                  canUpdate ? (
                    <DashButton icon="edit" onClick={() => setEditMode(true)}>
                      {t("Edit")}
                    </DashButton>
                  ) : (
                    <span className="text-[12px] text-[#8e8e8e] flex items-center gap-1.5">
                      <DashIcon name="lock" size={14} /> {t("View only")}
                    </span>
                  )
                ) : (
                  <>
                    <DashButton variant="ghost" size="sm" onClick={cancelEdit}>
                      {t("Cancel")}
                    </DashButton>
                    <DashButton icon="check" onClick={startSave}>
                      {t("Save Changes")}
                    </DashButton>
                  </>
                )}
              </>
            )}
          </div>
```

- [ ] **Step 6: Create-mode title, status pill, ID line**

In the header title block, make the title/pill/ID create-aware. Replace the title `<h1>…</h1>` + `StatusPill` + `request_status` badge + the ID `<p>` with:

```tsx
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[18px] bold text-[#3c3c3c] truncate">
                {isCreate ? t("New Product") : form.name || t("Untitled Product")}
              </h1>
              {!isCreate && (
                <StatusPill active={status === 1}>
                  {status === 1 ? t("Purchasable") : t("Disabled")}
                </StatusPill>
              )}
              {!isCreate && productMeta.request_status === 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] semibold bg-[#fbf6e6] text-[#b8860b]">
                  {t("Pending Approval")}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#8e8e8e] mt-0.5">
              {isCreate
                ? t("Fill in the details and create your product.")
                : `${t("ID")}: ${productId} · ${form.seller_product_id}`}
            </p>
```

- [ ] **Step 7: Sticky save bar — create label + cancel**

In the sticky save bar (the `editMode && (...)` block near the end), make its Cancel + Save create-aware. Replace its two `DashButton`s with:

```tsx
              <DashButton
                variant="ghost"
                size="sm"
                onClick={
                  isCreate
                    ? () =>
                        router.push(
                          `/${local}/sellerProfile/sellerDashboard/${sellerId}`,
                        )
                    : cancelEdit
                }
              >
                {t("Cancel")}
              </DashButton>
              <DashButton icon="check" onClick={startSave}>
                {isCreate ? t("Create Product") : t("Save Changes")}
              </DashButton>
```

- [ ] **Step 8: Confirm dialog wording (create)**

Where `ConfirmDialog` is rendered (`{confirm && (<ConfirmDialog … />)}`), pass a `create` flag:

```tsx
      {confirm && (
        <ConfirmDialog
          diff={confirm}
          saving={saving}
          create={isCreate}
          onCancel={() => !saving && setConfirm(null)}
          onConfirm={confirmSave}
        />
      )}
```

And update the `ConfirmDialog` component signature + header text to accept it:

```tsx
function ConfirmDialog({
  diff,
  saving,
  create,
  onCancel,
  onConfirm,
}: {
  diff: DiffEntry[];
  saving: boolean;
  create?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
```

and its header block text:

```tsx
        <h3 className="text-[16px] bold text-[#3c3c3c]">
          {create ? t("Confirm new product") : t("Confirm changes")}
        </h3>
        <p className="text-[12px] text-[#8e8e8e] mt-0.5">
          {create
            ? `${t("These details will be saved")} (${diff.length}).`
            : `${t("These fields will be updated")} (${diff.length}).`}
        </p>
```

- [ ] **Step 9: Lint + type-check**

Run: `pnpm lint`
Expected: no new errors.

Run: `npx tsc --noEmit`
Expected: clean. In particular no error about `productId` being possibly undefined (the edit paths now use `productId as string`, guarded by `isCreate`).

- [ ] **Step 10: Manual verification (deferred to human)**

With `pnpm dev`: existing edit route still loads/saves a product unchanged (regression check). Create route is verified in Task 3.

- [ ] **Step 11: Commit**

```bash
git add components/SellerDashboard/productEdit/ProductEditor.tsx
git commit -m "feat(product-edit): add create mode to ProductEditor

mode=\"create\" loads a blank form + lookups from getProductCreateForm, submits via
addProduct, and redirects to the new product's edit page. Edit behavior unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: The `products/new` route page

**Files:**
- Create: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page.tsx`

**Interfaces:**
- Consumes: `ProductEditor` with `mode="create"` (Task 2).

- [ ] **Step 1: Create the route page**

Create the file (mirrors the edit route page, no `productId`, `mode="create"`):

```tsx
"use client";
import { useParams } from "next/navigation";
import BackBar from "components/setting/BackBar";
import { translateFunction } from "utils/functions";
import ProductEditor from "components/SellerDashboard/productEdit/ProductEditor";

export default function SellerProductCreatePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const local = params.lang?.toString() || "";
  const [, language] = local.split("-");
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen pb-10">
      <div className="mb-3 bg-white">
        <BackBar
          isRtl={isRtl}
          local={local}
          name={translateFunction("New Product", language)}
          preivous_page={`/${local}/sellerProfile/sellerDashboard/${sellerId}`}
          DataCy="seller-product-create-screen"
        />
      </div>

      <div className="px-3 lg:px-0">
        <ProductEditor sellerId={sellerId} local={local} mode="create" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint + type-check**

Run: `pnpm lint` and `npx tsc --noEmit`
Expected: clean. (`BackBar` prop spelling `preivous_page` matches the edit page — keep as-is; it's the component's actual prop name.)

- [ ] **Step 3: Manual verification**

With `pnpm dev`, navigate to `/{lang}/sellerProfile/sellerDashboard/{sellerId}/products/new`:
- Blank form renders with lookups populated (colors/sizes/categories/brands).
- Fill name, a price, one image (assigned to a color if colors are chosen), qty+SKU per variant, and an English translation → **Create Product** → confirm dialog lists the values → on success you land on `.../products/{newId}` (the edit page).
- Confirm the static `new` segment does not collide with the `[productId]` edit route (open an existing product edit page too).

- [ ] **Step 4: Commit**

```bash
git add "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page.tsx"
git commit -m "feat(product-edit): add products/new route (create) reusing ProductEditor

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: "Add Product" entry on the products tab

**Files:**
- Modify: `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderProducts`)

**Interfaces:**
- Consumes: the `products/new` route (Task 3); the existing `hasPermission` helper and `Link` import in `page.tsx`.

- [ ] **Step 1: Add the button beside the products header**

In `renderProducts`, the success branch renders `<SectionHeader … />` then the products grid. Wrap the header row so an "Add Product" link sits opposite the `SectionHeader`, shown only with `CREATE_PRODUCT`. Replace the `<SectionHeader … />` line with:

```tsx
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionHeader
            icon="products"
            title={translateFunction("Products")}
            count={productsMeta?.total ?? sellerProducts.length}
          />
          {hasPermission("CREATE_PRODUCT") && (
            <Link
              href={`/${local}/sellerProfile/sellerDashboard/${sellerId}/products/new`}
              className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[12px] bg-[#5d5d5d] text-white text-[13px] medium hover:bg-[#4d4d4d] transition-colors active:scale-[0.98]"
            >
              + {translateFunction("Add Product")}
            </Link>
          )}
        </div>
```

- [ ] **Step 2: Add "Add your first product" in the empty state**

Replace the products empty-state block (`if (sellerProducts.length === 0) return (<EmptyState … />)`) with one that includes the create link when permitted:

```tsx
    if (sellerProducts.length === 0)
      return (
        <div>
          <EmptyState
            icon="products"
            title={translateFunction("No products found")}
            subtitle={translateFunction(
              "Products added to this shop will appear here.",
            )}
          />
          {hasPermission("CREATE_PRODUCT") && (
            <div className="flex justify-center mt-4">
              <Link
                href={`/${local}/sellerProfile/sellerDashboard/${sellerId}/products/new`}
                className="inline-flex items-center gap-1.5 h-[40px] px-5 rounded-[12px] bg-[#5d5d5d] text-white text-[14px] medium hover:bg-[#4d4d4d] transition-colors active:scale-[0.98]"
              >
                + {translateFunction("Add your first product")}
              </Link>
            </div>
          )}
        </div>
      );
```

- [ ] **Step 3: Lint + type-check**

Run: `pnpm lint` and `npx tsc --noEmit`
Expected: clean. If `hasPermission` or `Link` is not in scope in `page.tsx`, confirm the correct names (grep shows `hasPermission("CREATE_PRODUCT")` and `Link` both already used in this file) and use them.

- [ ] **Step 4: Manual verification**

With `pnpm dev`, open the seller dashboard products tab as a user WITH `CREATE_PRODUCT`: an "Add Product" button shows by the header (and "Add your first product" when there are none) and links to `.../products/new`. As a user WITHOUT `CREATE_PRODUCT`, no button appears.

- [ ] **Step 5: Commit**

```bash
git add "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx"
git commit -m "feat(seller-dashboard): add \"Add Product\" entry to the products tab

Links to products/new, gated on CREATE_PRODUCT; shown by the header and in the
empty state.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Endpoints + service methods (create-form, add) → Task 1 ✓
- `emptyProductForm` → Task 1 ✓
- `ProductEditor` create mode (load blank, submit add, redirect, header/title/actions, permission) → Task 2 ✓
- `products/new` route → Task 3 ✓
- "Add Product" entry gated on `CREATE_PRODUCT` → Task 4 ✓

**Placeholder scan:** none — every step has complete code and exact commands.

**Type consistency:**
- `getProductCreateForm`/`addProduct`/`emptyProductForm` defined in Task 1, consumed in Task 2 with matching signatures.
- `ProductEditor` prop shape `{ sellerId; productId?; local; mode? }` defined in Task 2, used with `mode="create"` (no `productId`) in Task 3 and with `productId` in the existing edit page (unchanged — `productId` optional keeps it valid).
- `ConfirmDialog` gains an optional `create?: boolean` (Task 2 Step 8) — passed from the same file; no external consumer.
- `emptyProductForm` must return every `ProductForm` field (helpers.ts interface) — tsc enforces in Task 1 Step 4.
- Redirect id uses `res.data.product_id ?? res.data.id`; route matches Task 3's path.
