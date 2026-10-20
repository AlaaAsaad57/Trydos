# Seller dashboard — catalog (products, boutiques, gallery, Excel, AI) — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Sellers can list, create, edit and enable products and boutiques, manage images and bulk-import by Excel; creating a product with "similar words" (always the case with "Add with AI") still depends on a backend fix.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
A seller with the right shop permissions manages the shop's catalog from the seller dashboard.
Route: `/[lang]/sellerProfile/sellerDashboard/[sellerId]?tab=products|boutiques|gallery|excel`.
Editors: `.../products/new`, `.../products/[productId]`, `.../boutiques/new`, `.../boutiques/[boutiqueId]`. "Add with AI" sits on the Products tab.
All shop calls go through `fetchData` with `server: "market-dashboard"`. `/shop/*` and `/seller/product/*` are not in `GATEWAY_APIS` (`utils/server/tokenManager.ts:74`), so they reach the **core** backend.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Seller opens the Products tab → grid of the shop's products: image, category, name, price with the shop currency, stock badge (out of stock / low / in stock), Active / Inactive badge. | core `GET /shop/products` | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx:552-587, 1269-1504`; `services/sellerDashboard/index.ts:106` | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`; e2e SD-13 |
| W-2 | Seller pages through products with Prev / Next. | core `GET /shop/products?page=n` | `page.tsx:1492-1501` | none |
| W-3 | Seller returns from an editor → the list is fetched again, so a new or edited product shows its new values. A failed fetch is tried again on the next arrival. | core | `page.tsx:533-549, 1050-1054` | `listRefresh.test.tsx` (AC-1, AC-2, AC-6, AC-14) |
| W-4 | Shop with no products → "No products found" plus "Add your first product" and "Add with AI" (only with `CREATE_PRODUCT`). The empty message never shows before the answer arrives. | core | `page.tsx:1231-1267` | `listRefresh.test.tsx` (AC-7, AC-15) |
| W-5 | Products list fails → error message with Retry. A failed permission list shows an error, not a false "no permission". | core | `page.tsx:1213-1235` | `listRefresh.test.tsx` (AC-13, AC-14) |
| W-6 | Seller without any product permission → the tile and menu entry are hidden; a direct `?tab=products` link shows "You don't have permission to view products". | core `GET /shop/auth/permissions` | `page.tsx:464-466, 1222-1229` | `listRefresh.test.tsx`; e2e SCRIPT-26 |
| W-7 | Seller taps a product card → the editor loads the product and every lookup list, in view mode. "Edit" shows only with `UPDATE_PRODUCT`; otherwise "View only". | core `GET /shop/products/{id}/edit` | `components/SellerDashboard/productEdit/ProductEditor.tsx:225-276, 974-1011` | `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx`; `tests/app/sellerProfile/sellerDashboard/productPages.test.tsx` |
| W-8 | The editor waits for shop info. Without `READ_SHOP_INFO` it says the permission is missing (no useless retry). If shop info failed, it offers Retry. | core `GET /shop/info` (only when permitted) | `ProductEditor.tsx:99-124, 806-849`; `components/SellerDashboard/ShopInfoLoader.tsx` | `ProductEditor.test.tsx`; `tests/components/SellerDashboard/ShopInfoLoader.test.tsx` |
| W-9 | Seller creates a product: `.../products/new` → empty form in edit mode → Create → validation → confirm dialog with the list of changes → save → "Product created successfully." → the new product's page opens. | core `GET /shop/products/lookups`, `POST /shop/products` (multipart) | `ProductEditor.tsx:230-245, 519-599`; `productEdit/helpers.ts` `buildUpdateFormData` (about lines 1380-1508) | `ProductEditor.test.tsx` (create cases) |
| W-10 | Seller edits a product: Edit → change fields → Save Changes → the confirm dialog lists every change → save → view mode. Banners show the "pending admin approval", "changes were denied" and "submitted" states. | core `POST /shop/products/{id}/update` | `ProductEditor.tsx:579-666, 1014-1050` | `ProductEditor.test.tsx` |
| W-11 | The form checks before any request: name, unit, brand, Seller Product ID, location, origin country, weight, count of pieces, stock, unit price, discount below unit price, luck price limit, max 3 labels, an image for every colour. The page scrolls to the first error. | none (client) | `productEdit/helpers.ts:899-1015` | `tests/components/SellerDashboard/productEdit/helpers.test.ts`, `validate.luckPrice.test.ts`, `validate.weight.test.ts` |
| W-12 | Seller types a Seller Product ID that the shop already uses → message at once, save blocked. | lookups list from core | `ProductEditor.tsx:506-517` | `tests/components/SellerDashboard/productEdit/sellerProductId.test.ts` |
| W-13 | The backend refuses a save → its message goes on the matching field. Messages that fit no field show in a banner (max 5, then a count). | core | `ProductEditor.tsx:547-577`; `productEdit/helpers.ts` `mapServerErrors` | `tests/components/SellerDashboard/productEdit/serverErrors.test.ts`; `ProductEditor.test.tsx` |
| W-14 | Seller picks categories → sub-categories, sub-sub-categories and attribute groups load for every selected branch. Stale picks are removed. A failed branch keeps the saved picks. An old answer cannot overwrite a newer one. | core `GET /shop/products/categories/{id}/lookups` | `ProductEditor.tsx:283-433` | `ProductEditor.test.tsx` |
| W-15 | Seller sets attribute (descriptor) values on an existing product: free text for `string`, a number for `numeric`, chips for `string_choice` / `numeric_choice` (options arrive as a JSON string). They are saved only when they changed. On failure the form rolls back and says so. | core `POST /shop/products/{id}/descriptors` (full replace) | `productEdit/sections.tsx:744-852`; `productEdit/helpers.ts:97-215`; `ProductEditor.tsx:610-646` | `ProductEditor.test.tsx`; `helpers.test.ts` |
| W-16 | Seller builds variants: colours × sizes, each row with price, discount, luck price, quantity, SKU, barcode and location. | core (in the save body) | `productEdit/sections.tsx:1346`; `productEdit/helpers.ts` `combos` / `buildUpdateFormData` | `tests/components/SellerDashboard/productEdit/sections.test.tsx` |
| W-17 | Seller adds product images from the device (media server bulk upload) or from the shop gallery (with `READ_PRODUCT_IMAGES`), and links images to colours. | media server `/gated/upload/bulk` (with upload ticket); core `GET /shop/products/images` | `ProductEditor.tsx:437-461`; `productEdit/sections.tsx:1200-1290`; `productEdit/GalleryPickerModal.tsx:48` | `ProductEditor.test.tsx`; `GalleryPickerModal.test.tsx` |
| W-18 | SEO: seller sets meta title, meta description and meta image (upload or gallery). | media server; core (save body) | `productEdit/sections.tsx:1098-1198`; `ProductEditor.tsx:463-484` | `ProductEditor.test.tsx`; `sections.test.tsx` |
| W-19 | Translations (custom data): a default language, then name, description and similar words per language (en / ar / tr / ku). On edit, each row is sent with its own id. | core (`custom_data[i][...]`) | `productEdit/sections.tsx:1660-1866`; `productEdit/helpers.ts:1466-1500` | `helpers.test.ts`; `sections.test.tsx` |
| W-20 | Countries: origin country, restricted countries and an extra price per country. Also labels (max 3) and tags. | core (save body) | `productEdit/sections.tsx:854-1096` | `sections.test.tsx` |
| W-21 | Seller uploads or removes a product video (edit screen). | media server `/gated/upload`; core (save body) | `ProductEditor.tsx:486-500`; `productEdit/sections.tsx:1868` | `ProductEditor.test.tsx` |
| W-22 | Seller with `CHANGE_PRODUCT_STATUS` presses "Allow Purchase" / "Disable" → dialog → the status changes. When the backend refuses (422), the dialog lists its reasons. | core `POST /shop/products/{id}/change-status` | `ProductEditor.tsx:750-778, 961-973` | `ProductEditor.test.tsx` |
| W-23 | Seller not approved for new products → every price except Purchase Price is hidden and not required. | core `GET /shop/info` (`is_new_products_approval`) | `ProductEditor.tsx:121-124`; `productEdit/helpers.ts:953-993` | `helpers.test.ts` ("with prices locked") |
| W-24 | Money inputs refuse more decimal digits than the shop currency allows, with a short tooltip. | core `GET /shop/info` (`currency.decimal_digits`) | `productEdit/sections.tsx:143-200` | `sections.test.tsx` |
| W-25 | "Add with AI": seller picks one JPEG / PNG / WebP photo → three steps show (choose, upload, analyze) → the photo goes to the media server → the AI route answers → the create form opens filled (name, description, similar words, meta title and description, brand, three category levels, photo as image and meta image), in the seller's page language. A message asks the seller to check the values. Nothing is saved until the seller presses Create. | media server; Next route `POST /api/seller/products/ai-autofill` → Gemini `gemini-2.5-flash` | `productEdit/AiAutofillDialog.tsx`; `productEdit/aiPrefill.ts`; `ProductEditor.tsx:87-93, 780-800` | `AiAutofillDialog.test.tsx`; `aiPrefill.test.ts`; `ProductEditor.test.tsx` (AC-10, AC-11, AC-12, AC-17) |
| W-26 | AI route safety: it needs the market cookie. It checks shop membership and `CREATE_PRODUCT` / `SUPER_ADMIN` on the core backend. It accepts only a bare file name from our media host (max 7 MB). It allows 10 calls per minute per shop (Redis). Every returned brand or category id must be one it sent, and the three levels must fit together. The Gemini key travels only in a header. | core `GET /shop/auth/permissions`, `GET /shop/products/lookups`, `GET /shop/excel/categories`; Redis; Gemini | `app/api/seller/products/ai-autofill/route.ts`; `app/api/seller/products/ai-autofill/_autofill.ts` | `tests/app/api/seller/products/ai-autofill/route.test.ts`, `_autofill.test.ts` |
| W-27 | AI failures are named: 401 / 403 no permission, 422 bad image, 429 too many, 503 AI busy (also when Redis is down), 500 analysis failed. The dialog lets the seller try again. | as above | `route.ts`; `AiAutofillDialog.tsx` (`KNOWN_MESSAGES`) | `route.test.ts`; `AiAutofillDialog.test.tsx` |
| W-28 | Seller opens the Boutiques tab → cards with icon, name, Active / Inactive, description and slug. Empty state with "Add your first boutique" (`CREATE_BUTIKS`). Error with Retry. | core `GET /shop/boutiques` | `page.tsx:589-615, 1506-1647` | `listRefresh.test.tsx` (AC-3, AC-4, AC-5) |
| W-29 | Seller edits a boutique: languages come from `/languages` (a built-in list if that call fails). Per language: name, description, icon and banners. Copy a field from another language. Banner size warning, one file at a time. Availability (Web / Mobile / both). Restricted countries. Save. | core `GET /shop/boutiques/{id}/edit`, `GET /languages`, `POST /shop/boutiques/{id}/update`; media server | `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx:117-480`; `boutiqueEdit/helpers.ts:281-335` | `tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx`, `helpers.test.ts`, `sections.test.tsx` |
| W-30 | Seller with `CHANGE_BOUTIQUE_STATUS` sets a boutique active or inactive while editing. If the status call is refused, the edits stay saved, the status goes back, and the reasons are listed. | core `POST /shop/boutiques/{id}/change-status` | `BoutiqueEditor.tsx:446-476, 608-617` | `BoutiqueEditor.test.tsx` |
| W-31 | Seller creates a boutique → body with `boutique_custom_data` → the new boutique's page opens. | core `GET /shop/boutiques/lookups`, `POST /shop/boutiques` | `BoutiqueEditor.tsx:127-140, 410-430` | `BoutiqueEditor.test.tsx`; `tests/app/sellerProfile/sellerDashboard/boutiquePages.test.tsx` |
| W-32 | Gallery tab (`READ_PRODUCT_IMAGES`): 60 images per page, Prev / Next, large preview, copy URL. | core `GET /shop/products/images` | `components/SellerDashboard/GalleryTab.tsx:79-117` | `tests/components/SellerDashboard/GalleryTab.test.tsx` |
| W-33 | Gallery upload (`UPLOAD_PRODUCT_IMAGES`): choose files, a folder, or drag and drop → preview → confirm → media server → saved to the shop → page 1 reloads. | media server `/gated/upload/bulk`; core `POST /shop/products/images` | `GalleryTab.tsx:140-175`; `services/sellerDashboard/index.ts:519-651` | `GalleryTab.test.tsx` |
| W-34 | Gallery delete (`DELETE_PRODUCT_IMAGES`): one image with a confirm, or many in select mode. The page steps back when its last image goes. | core `DELETE /shop/products/images` `{ids}` | `GalleryTab.tsx:182-275` | `GalleryTab.test.tsx` |
| W-35 | Excel tab (`CREATE_PRODUCT` or `UPDATE_PRODUCT`): searchable category picker, "only categories that have my products", and the last choice is remembered per shop. | core `GET /shop/excel/categories` | `components/SellerDashboard/ExcelUploadTab.tsx:86-263` | `tests/components/SellerDashboard/ExcelUploadTab.test.tsx` |
| W-36 | Seller downloads an empty template ("Add new products") or a sheet of own products ("Update my products"). The file streams through `/api/proxy`, with one session renewal on a 401. | core `GET /shop/excel/downloadExcel/{id}` (`mode=template` or `mode=products`) | `ExcelUploadTab.tsx:264-291`; `services/sellerDashboard/index.ts:25-88, 780-792` | `ExcelUploadTab.test.tsx`; e2e SD-16 |
| W-37 | Seller uploads a filled sheet (.xlsx / .xls / .xlsm / .xlsb) → media server → processing request. If the sheet belongs to another category, the seller is asked. Yes sends it again with `confirm_category`; No imports nothing. | media server `/gated/upload/excel`; core `POST /shop/excel/processExcel` (409 `category_mismatch`) | `ExcelUploadTab.tsx:312-414`; `services/sellerDashboard/index.ts:813-880`; `utils/fetchData.ts:712-717` | `ExcelUploadTab.test.tsx` |
| W-38 | Uploaded-files table: a status badge per file, Notes, Refresh, and a "failed rows" download (with a Reason column). | core `GET /shop/excel/getUploadedExcelFiles`, `GET /shop/excel/failedRows/{id}` | `ExcelUploadTab.tsx:215-235, 415-447` | `ExcelUploadTab.test.tsx` |
| W-39 | Back from any editor returns to the same dashboard tab. | none | `components/SellerDashboard/useDashboardDetailBack.ts` | `tests/components/SellerDashboard/useDashboardDetailBack.test.tsx` |

## ⚠️ Works, with limits
- **L-1** — Attributes and video exist only on the edit screen. A new product gets them after its first save (`ProductEditor.tsx:1108, 1114`).
- **L-2** — Create sends only the default-language translation. Other languages are added on the edit screen (`productEdit/helpers.ts:1466-1485`).
- **L-3** — A product with total stock 0 cannot be saved, because the rule refuses `<= 0` (`productEdit/helpers.ts:938`). A seller cannot edit a sold-out product without typing a stock.
- **L-4** — No size or count limit before upload for product images, meta image, video and gallery files (`productEdit/sections.tsx:1125, 1282, 1904`; `GalleryTab.tsx:140`). A large file fails only at the media server.
- **L-5** — The side-menu product badge shows the number on the current page, not the shop total (`page.tsx:2415`). The tab header shows the real total.
- **L-6** — The boutiques list asks for one answer only, with no page parameter (`services/sellerDashboard/index.ts:121`). If the backend pages boutiques, later pages never show.
- **L-7** — Boutique status can change only in edit mode, so it also needs `UPDATE_BUTIKS` (`BoutiqueEditor.tsx:608`). A user with only `CHANGE_BOUTIQUE_STATUS` cannot use it.
- **L-8** — The Excel category picker indents by the backend `level` field (`ExcelUploadTab.tsx:1121`). That field is wrong for many categories, so the indent is wrong. The full path text is still shown.
- **L-9** — After an Excel upload the message says "File uploaded and processed successfully!" (`ExcelUploadTab.tsx:432`), even when the backend still lists the file as `processing`. The table does not refresh by itself.
- **L-10** — The Excel "Download" link is built from `original_filename` (`ExcelUploadTab.tsx:68`), not from the stored media key. It may point to a file that does not exist.
- **L-11** — "Add with AI" needs Redis. When Redis is down, the route answers "busy" every time (`route.ts`, `rl.ttl === 0`). This is on purpose: the paid AI never runs without a limit.
- **L-12** — The AI category tree is built from the `display_name` path, not from `level`, because `level` is wrong on the backend (`_autofill.ts` `buildCategoryLists`). Mismatches are reported to Sentry.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | Product create fails when the form carries similar words. This is a known backend fault: `custom_data[i][similar_words]` gives 500 on create only, and a half-made product is left behind. "Add with AI" always fills 3–10 similar words, so every AI-filled create hits it. | "Failed to create product" after Create; an orphan product may stay in the shop. | `productEdit/helpers.ts:1483-1485`; `productEdit/aiPrefill.ts:108-112`; `productEdit/sections.tsx:1823` | Backend | Yes — the AI create flow cannot finish, and a manual create with similar words fails. |
| M-2 | BUG-seller-100: the purchase price checks run only when the purchase price is **empty**. So the form never refuses a filled purchase price above the unit (or discount) price. | A seller can save a purchase price higher than the selling price, unless the backend refuses it. | `productEdit/helpers.ts:962-969`; test `helpers.test.ts:571` (`it.fails`) | Frontend | No — but Yes if the backend does not check it either (see questions). |
| M-3 | No search on the Products tab. Only Prev / Next pages. | A seller with many products must page through them to find one. | `page.tsx:1269-1504`; `services/sellerDashboard/index.ts:106` | Product / Frontend | No |
| M-4 | No product delete anywhere in the dashboard. | A seller can only disable a product. | `services/sellerDashboard/index.ts` (no delete call) | Product | No |
| M-5 | Boutique delete is switched off in code (`const canDelete = false`). The handler and the service call exist, but no button shows. | No "Delete boutique" button. | `boutiqueEdit/BoutiqueEditor.tsx:111, 630` | Product | No |
| M-6 | The "Save Draft" / "Load Draft" buttons are commented out. The handlers still exist (dead code). | Nothing. | `ProductEditor.tsx:678-746, 939-954, 988-1003, 1119-1134` | Frontend | No |
| M-7 | Two comments call the Excel upload a "dummy". The code under them is the real upload, so the comments mislead readers. | Nothing. | `ExcelUploadTab.tsx:395`; `services/sellerDashboard/index.ts:837` | Frontend | No |
| M-8 | Service methods with no caller: `getUploadedImages`, `deleteImage`. | Nothing. | `services/sellerDashboard/index.ts:376-407` | Frontend | No |

Re-checked older findings: the hard-coded boutique "verified / top-seller" badges and the decorative size-guide toggles are **not** in the code any more.

## 🔒 Must do before launch
- [ ] Backend fixes product create with `custom_data[i][similar_words]` (M-1). Then create one AI-filled product end to end on staging.
- [ ] Confirm that the backend refuses a purchase price above the unit or discount price. If it does not, fix BUG-seller-100 (M-2) and turn the `it.fails` test green.
- [ ] Set `GEMINI_API_KEY` and a working Redis on the production deployment. Without Redis, "Add with AI" always answers "busy".
- [ ] Set `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, `NEXT_PUBLIC_MEDIA_API_KEY` and `NEXT_PUBLIC_BASE_MEDIA_URL` for production. Without them every upload in this section stops with "Media server upload is not configured".

## ❓ Needs confirmation from the backend team
- Is the `similar_words` create fault (500 plus an orphan product) fixed on the core backend?
- Do `POST /shop/products` and `POST /shop/products/{id}/update` refuse a purchase price above the unit or discount price?
- Does `GET /shop/boutiques` page its answer? The app reads one answer only.
- Is a product with stock 0 valid on the backend? The form refuses it.
- Does `POST /shop/excel/processExcel` finish the import in the same request, or does it queue the file? The success text assumes it finished.
- Is `<media base>/file/upload/excel/<original_filename>` a real download address for an uploaded sheet, or should the link use the stored key?
- When will `GET /shop/excel/categories` return a correct `level` field?
- Does the media server refuse an upload without a valid `X-Upload-Ticket`? The `x-api-key` it also reads is a public (`NEXT_PUBLIC_`) value in the browser bundle.

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`, `productPages.test.tsx`, `boutiquePages.test.tsx`
- `tests/components/SellerDashboard/productEdit/` — `ProductEditor.test.tsx`, `helpers.test.ts`, `sections.test.tsx`, `serverErrors.test.ts`, `sellerProductId.test.ts`, `validate.luckPrice.test.ts`, `validate.weight.test.ts`, `GalleryPickerModal.test.tsx`, `AiAutofillDialog.test.tsx`, `aiPrefill.test.ts`
- `tests/app/api/seller/products/ai-autofill/route.test.ts`, `_autofill.test.ts`
- `tests/components/SellerDashboard/boutiqueEdit/` — `BoutiqueEditor.test.tsx`, `helpers.test.ts`, `sections.test.tsx`
- `tests/components/SellerDashboard/GalleryTab.test.tsx`, `ExcelUploadTab.test.tsx`, `ShopInfoLoader.test.tsx`, `useDashboardDetailBack.test.tsx`
- `tests/components/SellerDashboard/ui/primitives.test.tsx`, `ui/RichTextEditor.test.tsx`

**Expected failure:** `tests/components/SellerDashboard/productEdit/helpers.test.ts:571` — `it.fails("BUG-seller-100: refuses a purchase price above the unit price")`. It stays an expected failure until M-2 is fixed.

**Browser (Playwright):**
- `tests/e2e/sellerDashboard.live.spec.ts` — SD-02 (tiles open sections), SD-13 (products list: status, price and stock from the backend), SD-16 (Excel template download).
- `tests/e2e/sellerDashboard.scripted.spec.ts` — SCRIPT-26 (a small role sees only its sections).
- `tests/e2e/qaLock.live.spec.ts` — QA-01..QA-11 (the QA product and boutique stay hidden from shoppers).

**No test at all for:**
- creating or editing a product, or changing its status, against a real backend (no e2e; the unit tests mock the service);
- "Add with AI" end to end with the real Gemini and media server;
- creating or editing a boutique against a real backend;
- gallery upload and delete against a real backend (SD-14 is reserved and not written);
- Excel upload and processing against a real backend;
- Products tab Prev / Next paging.
