# Seller dashboard — operations (shops, access, orders, carts, locations, team, shop info, stories, comments) — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** The shop list, guards, permission gating and every operations tab work end to end, and the frontend items found in the first review are fixed.
**Checked:** branch `development`, 2026-10-20 — from the code only. First review at commit `6a0265a1`; re-checked after the fixes in the commit that carries this file.

## What this section is
A shop member opens Settings → "Sales" → `/[lang]/sellerProfile` (the list of their shops) → "Enter Dashboard".
The dashboard `/[lang]/sellerProfile/sellerDashboard/[sellerId]` shows section tiles and a slide-out menu. Each section opens as `?tab=orders|carts|locations|users|permissions|shopInfo|stories|comments`.
Shop calls use `server: "market-dashboard"` and reach the **core** backend (`/shop/*` is not in `GATEWAY_APIS`, `utils/server/tokenManager.ts:74`). Stories use the stories backend. Comments read and write Elasticsearch through server actions.
"Become a seller" (Settings → `BecomeSellerModal`) is only the entry link here; it is not reviewed in this file.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Signed-in user opens Settings → the "Sales" card shows only when the user has shops; it opens `/sellerProfile`. A user with no shops sees "Become A Seller At Trydos" (opens `BecomeSellerModal`). A failed check shows an error with retry. | core `GET /shop/auth/permissions` | `components/settings/GoToSellerDashBoard.tsx:46-90, 165-185` | `tests/components/settings/GoToSellerDashBoard.test.tsx`; e2e SD-01 |
| W-2 | Server guard on every `/sellerProfile` page: a user the backend confirms (200 / 403) has no shops is sent to the home page before any HTML. A 401 or 5xx does not bounce a real seller. | core `GET /shop/auth/permissions` (server, once per request via `cache()`) | `app/(client)/[lang]/sellerProfile/layout.tsx:21-25`; `serverRequests/settings/index.ts:28-53`; `serverRequests/settings/sellerShopsGuard.ts` | `tests/app/sellerProfile/layouts.test.tsx`; `tests/serverRequests/settings/index.test.ts` |
| W-3 | Per-shop guard: opening a `sellerId` the user is not a member of sends them home. The same answer decides if `GET /shop/info` may be called (`READ_SHOP_INFO`). | core | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/layout.tsx:25-49` | `layouts.test.tsx` |
| W-4 | Shop list: placeholders first, then one card per shop with logo or monogram, name, seller id, role ("Super Admin", the role name, or "Member"), permission count and "Enter Dashboard". A failed list shows an error with retry, never "No shops available". | core `GET /shop/auth/permissions` | `app/(client)/[lang]/sellerProfile/page.tsx:40-70, 150-170` | `tests/app/sellerProfile/shopListFirstPaint.test.tsx`; e2e SD-01 |
| W-5 | Leave a shop from the list: confirm dialog → the shop leaves the list and this device stops getting the shop's order pushes; a refusal shows the backend message. The button is disabled for the master shop (`is_master = 1`). | core `DELETE /shop/users/leave`; Next route `POST /api/unsubscribe` | `sellerProfile/page.tsx:72-100, 250-320` | `shopListFirstPaint.test.tsx` |
| W-6 | Dashboard home: a tile per section the user may open; a tile writes `?tab=` into the URL; Back goes to home, then to the shop list. | none | `sellerDashboard/[sellerId]/page.tsx` (`renderHome`, `changeTab`) | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`; e2e SD-02, SD-03 |
| W-7 | Slide-out menu: the same sections, with count badges for products, boutiques and active carts; closes on overlay, Escape, outside click or its button. | core (products, boutiques, carts counts) | `page.tsx` (`initializeData`, the menu) | `listRefresh.test.tsx`; e2e SD-03 |
| W-8 | Permission gating: permissions come from the shop list, or are fetched on a direct link. Every section waits (placeholder) until they are known, shows the load error with retry when the fetch failed, and says "Access Denied" with the missing right when it is missing. No tab ever shows an empty white panel. | core `GET /shop/auth/permissions` | `page.tsx` (`permissionsReady`, `getSellerPermissions`, `renderGated`) | `listRefresh.test.tsx` (AC-13); `tests/app/sellerProfile/sellerDashboard/permissionsTab.test.tsx`; e2e SCRIPT-26 |
| W-9 | Header shows the shop logo, name, role and seller id; it updates at once after a Shop Info save. | core | `page.tsx` (`handleShopInfoUpdated`, the header) | `listRefresh.test.tsx` |
| W-10 | Product cards show reactions, questions, reviews and shares. The counts load in batches from Elasticsearch through a server action that checks `READ_COMMENTS` on the core backend; "—" shows until they arrive; a refused batch is tried again later. A member without `READ_COMMENTS` sees "Comment counts need the comments permission" instead, and nothing is asked. | core `GET /shop/auth/permissions`; Elasticsearch | `page.tsx` (the social-counts effect and the card footer); `services/elastic/sellerComments.ts:765`; `app/api/seller/comments/social/route.ts` | `tests/services/elastic/sellerComments.test.ts`; `tests/app/api/seller/comments/social/route.test.ts` |
| W-11 | Orders tab: order list with filter tabs All / In Progress / Collected / Returned / Cancelled, more orders load on scroll, tap an order → detail screen. | core `GET /shop/orders?page=&status=` | `components/SellerDashboard/orders.tsx` (`RenderOrders`, `OrderListScreen`) | `tests/components/SellerDashboard/orders.test.tsx` |
| W-12 | Seller taps "Confirm & Start Packing" on a waiting item → item is confirmed. | core `PUT /shop/orders/details/status/confirmed` | `orders.tsx` (`handleConfirmItem`) | `orders.test.tsx` (BUG-seller-703) |
| W-13 | Seller taps "Packed" on a confirmed item → item is packed. | core `PUT /shop/orders/details/status/packed` | `orders.tsx` (`handlePackItem`) | `orders.test.tsx` |
| W-14 | Seller taps "Cancel" on a waiting item → a confirm dialog says the whole quantity goes and the buyer will be told → the item is cancelled. A refusal shows the backend reason. | core `PUT /shop/orders/details/cancel` | `orders.tsx` (`cancelTarget`, `handleCancelItem`) | `orders.test.tsx`; `tests/services/sellerDashboard/updateShopInfoBody.test.ts` (BUG-seller-701) |
| W-15 | A member with any order permission who opens the Orders tab is subscribed once to the shop's order push topics; a new order or order change arrives as a push → the open Orders tab reloads page 1. The subscription is removed when the member leaves the shop, loses every order permission, or (after being removed) next opens the shop list or Settings on that device. Logout tears down push delivery for the whole device. | Next routes `POST /api/subscribe`, `POST /api/unsubscribe` (FCM topics `shop_{id}_order`, `shop_{id}_order_detail`); FCM | `orders.tsx` (the topic effect); `utils/shopOrderTopics.ts`; `sellerProfile/page.tsx` (`getInitialData`, `confirmLeaveShop`); `components/settings/GoToSellerDashBoard.tsx` (`getPermission`); `utils/tinyUtils.tsx` (`clearAllUserData`) | none |
| W-16 | "Orders" button on a product card (`READ_ORDERS`) → modal with this product's orders, status filter and pages. A network failure shows an error with retry. | core `GET /shop/products/{id}/orders` | `page.tsx` (`productOrdersTarget`); `components/SellerDashboard/productOrders/ProductOrdersModal.tsx` | `tests/components/SellerDashboard/productOrders/ProductOrdersModal.test.tsx`; `tests/services/sellerDashboard/productOrders.test.ts` |
| W-17 | Carts tab (`READ_CARTS`): active carts and old carts load together, each with pages. Tap an active cart → its lines; tap an old cart → that customer's old lines. Customer names are masked. A refused or failed call (backend refusal or network failure) shows an error with retry, not an empty list. | core `GET /shop/carts`, `/shop/carts/{cartGroupId}`, `/shop/old-carts`, `/shop/old-carts/{customerId}` | `components/SellerDashboard/carts/CartsTab.tsx:90-200`; `ActiveCartDetails.tsx`; `OldCartDetails.tsx`; `CartLineItem.tsx:33-34`; `carts/types.ts` (`ApiResponse`) | `tests/components/SellerDashboard/carts/CartsTab.test.tsx`, `ActiveCartDetails.test.tsx` |
| W-18 | "Carts" button on a product card → modal with every open cart line for this product. | core `GET /shop/products/{id}/carts` | `page.tsx` (`productCartsTarget`); `carts/ProductCartsModal.tsx` | `tests/components/SellerDashboard/carts/ProductCartsModal.test.tsx` |
| W-19 | Locations tab (`READ_LOCATIONS`): list with an Active / Inactive filter and pages. | core `GET /shop/locations` | `components/SellerDashboard/locations/LocationsTab.tsx:63-137, 160-303` | `tests/components/SellerDashboard/locations/LocationsTab.test.tsx`; e2e SD-04, SD-05 |
| W-20 | Create a location (`CREATE_LOCATION`): form with country list and a Google Maps point picker; the form refuses bad values before any call. | core `GET /shop/locations/lookups`, `POST /shop/locations` | `locations/LocationFormModal.tsx:100-210`; `locations/LocationMapPicker.tsx` | `LocationFormModal.test.tsx`, `LocationMapPicker.test.tsx`; e2e SD-06, SD-09 |
| W-21 | Edit a location (`UPDATE_LOCATION`) and Activate / Deactivate it (`CHANGE_LOCATION_STATUS`). | core `GET /shop/locations/{id}/edit`, `POST .../update`, `POST .../change-status` | `LocationFormModal.tsx:105, 197`; `LocationsTab.tsx:104-130` | `LocationsTab.test.tsx`; e2e SD-07, SD-08 |
| W-22 | Users tab, add a member (`USER_MANAGEMENT_ACCESS` or `SUPER_ADMIN`): by phone number and role (roles search, "Load more roles"); success banner; the list reloads. | core `GET /shop/users/roles`, `POST /shop/users/add` | `page.tsx` (`handleAddUser`, the add form) | `listRefresh.test.tsx` |
| W-23 | Users list: name, phone, role, "Load more". A member with only `READ_EMPLOYEES` sees the list read-only, with no add form and no row actions. | core `GET /shop/users?page=&lang=` | `page.tsx` (`canViewUsersList`, `renderUsers`) | `listRefresh.test.tsx` |
| W-24 | `SUPER_ADMIN` changes a member's role (searchable role list) or deletes a member. Delete asks first ("Remove member"); the member goes only after the confirm. | core `PUT /shop/users/role/update`, `DELETE /shop/users/{id}/delete` | `page.tsx` (`handleUpdateUserRole`, `deleteUserTarget`, `handleDeleteUser`) | `listRefresh.test.tsx` |
| W-25 | A member leaves the shop from their own row in the Users tab: confirm dialog → the device stops getting the shop's order pushes → back to the shop list. | core `DELETE /shop/users/leave`; Next route `POST /api/unsubscribe` | `page.tsx` (`handleLeaveShop`) | `listRefresh.test.tsx` |
| W-26 | Permissions tab (always shown): role banner ("Super Admin" or the role name) and the user's own permissions, grouped and translated. | core `GET /shop/auth/permissions` | `page.tsx` (`renderPermissions`) | `permissionsTab.test.tsx`; `listRefresh.test.tsx` |
| W-27 | Shop Info tab (`READ_SHOP_INFO`): form with shop name, contact, address, logo and banner. Read-only without `UPDATE_SHOP_INFO`. Required fields and a digits-only contact are checked first. A failed load shows the reason with a retry, never an empty form. | core `GET /shop/info` | `components/SellerDashboard/ShopInfo.tsx` (`loadData`, `loadError`) | `tests/components/SellerDashboard/ShopInfo.test.tsx`; e2e SD-10, SD-11 |
| W-28 | Shop Info save: crop a new logo or banner → media server → `PUT /shop/info`. A picture the shop does not have is left out of the body (not `null`); a removed picture is sent as `""`. Success toast; header updates. A refused save shows the backend's own reason in the form (no browser alert). | media server `/gated/upload`; core `PUT /shop/info` | `ShopInfo.tsx` (`handleSubmit`, `saveError`); `services/sellerDashboard/index.ts:709-759` | `ShopInfo.test.tsx`; `tests/services/sellerDashboard/updateShopInfoBody.test.ts`; e2e SD-12 |
| W-29 | Shop info (currency, new-products approval) loads once for the whole dashboard and is never asked for without `READ_SHOP_INFO`. | core `GET /shop/info` | `components/SellerDashboard/ShopInfoLoader.tsx` | `tests/components/SellerDashboard/ShopInfoLoader.test.tsx` |
| W-30 | Stories tab (`READ_STORY`): the shop's stories with pages; link and product shown on each card. | stories backend `GET /api/v1/stories/seller-stories` | `components/SellerDashboard/StoriesTab.tsx:923-975`; `services/sellerDashboard/index.ts:447-465` | `tests/components/SellerDashboard/StoriesTab.test.tsx`; e2e SST-01 |
| W-31 | Add a story (`CREATE_STORY`): photo or video up to 10 MB, video up to 60 s, no SVG, a checked link, an optional product picked from the shop's products → media server (upload ticket) → saved. | media server `/gated/upload` (`?story=true` for video); stories backend `POST /api/v1/stories/add-seller-story`; core `GET /shop/products` (picker) | `StoriesTab.tsx:62-66, 240-380, 405-520`; `services/sellerDashboard/index.ts:409-497` | `StoriesTab.test.tsx`; e2e SST-02..SST-06, SST-08, SST-09 |
| W-32 | Delete a story (`DELETE_STORY`) with a confirm. | stories backend `POST /api/v1/stories/delete-seller-story` | `StoriesTab.tsx:976-1010` | `StoriesTab.test.tsx`; e2e SST-07 |
| W-33 | Customers Comments tab (`READ_COMMENTS`): FAQ and Reviews sub-tabs with pages, cards like the product page. The server action checks membership and permission on the core backend and filters Elasticsearch by the verified shop; deleted comments are skipped. | core `GET /shop/auth/permissions`; Elasticsearch | `components/SellerDashboard/CommentsTab.tsx:89-160`; `services/sellerDashboard/comments.ts`; `services/elastic/sellerComments.ts:212-330, 493` | `tests/components/SellerDashboard/CommentsTab.test.tsx`, `CommentProductInfo.test.tsx`; `tests/services/elastic/sellerComments.test.ts` |
| W-34 | Reply (`REPLY_COMMENT`), edit a reply (`EDIT_REPLY`), delete a reply (`DELETE_REPLY`, with a confirm). Reply text loses HTML and is max 1000 characters; writes are rate-limited per shop and session. | Elasticsearch (`updateByQuery`); Redis | `CommentsTab.tsx:214-280`; `services/elastic/sellerComments.ts:505-760` | `CommentsTab.test.tsx`; `sellerComments.test.ts`; `tests/services/sellerDashboardComments.test.ts` |
| W-35 | Mobile app routes for the same comments actions with a bearer token: `GET /api/seller/comments`, `POST/PUT/DELETE /api/seller/comments/reply`, `POST /api/seller/comments/social`. Same server gate. | as W-33 / W-34 | `app/api/seller/comments/**` | `tests/app/api/seller/comments/route.test.ts`, `reply/route.test.ts`, `social/route.test.ts` |
| W-36 | Access token expires on the dashboard → the call renews the session and tries again. If renewal is refused, the seller sees a "please login again" prompt instead of quietly becoming a guest. | `/api/auth/refresh` → core | `utils/fetchData.ts:247-330` | `tests/utils/fetchData.test.ts`; `tests/services/authRefreshSession.test.ts` |

## ⚠️ Works, with limits
- **L-1** — Order item buttons (Confirm, Packed, Cancel) show to anyone with **any** order permission (`orders.tsx`, `OrderDetailScreen`). The backend decides; a refusal shows its reason.
- **L-2** — Old carts can be searched by the service (`services/sellerDashboard/index.ts:1338-1358`), but the Carts tab has no search box.
- **L-3** — Comment permissions are cached in Redis for 30 s, and a stale copy is used for up to 1 hour when the core backend is down (`services/elastic/sellerComments.ts:79-81, 186-205`). A removed member can still reply during that time.
- **L-4** — Only `SUPER_ADMIN` sees "Change Role" and "Delete" in the Users tab. `UPDATE_EMPLOYEES` and `DELETE_EMPLOYEES` are not used.
- **L-5** — A location cannot be deleted, only deactivated (no backend endpoint; `services/sellerDashboard/index.ts:1148`).
- **L-6** — The location map uses a public Google Maps key (`utils/mapsConfig`); it must be limited to our domains in the Google console.
- **L-7** — The order push clean-up for a **removed** member runs on that member's device, the next time they open the shop list or Settings (`utils/shopOrderTopics.ts`, `reconcileShopOrderTopics`). Until then the device still holds the topic. Only the backend can stop it sooner (see the backend question on topic pushes).

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | Order-level status change is not available: the control is commented out, so `updateOrderStatus` is never called. | Only per-item Confirm / Packed / Cancel. | `orders.tsx` (`OrderDetailScreen`); `services/sellerDashboard/index.ts:174-191` | Product | No |
| M-2 | No screen to create or edit roles, although `CREATE_ROLES` / `UPDATE_ROLES` exist. The Permissions tab shows only the user's own permissions. | No roles management. | `page.tsx` (`PERMISSION_GROUPS.ROLES`, `renderPermissions`) | Product | No |

## 🔒 Must do before launch
- [ ] Run e2e SD-12 on staging. It was red on purpose because `PUT /shop/info` refused a shop with no logo (`422 The image field must be a string`). The app now leaves a missing picture out of the body; confirm a shop with no logo can save its contact and address.
- [ ] Get the backend answers below about the stories backend and the comment writes.

## ❓ Needs confirmation from the backend team
- Stories backend: the browser sends `user_id` and `seller_id` in the body of `add-seller-story` and `delete-seller-story`. Does the backend take the user from the token and check that the user is a member of `seller_id` with `CREATE_STORY` / `DELETE_STORY`?
- Comments: seller replies are written straight into the Elasticsearch comments index, not to the comments backend. Will a re-index from the comments backend keep or erase these replies?
- `PUT /shop/info`: is an absent `image` / `banner` now accepted as "do not change"? Is `""` accepted as "remove the picture"?
- Order item actions: does the core backend check the specific permission (for example `CHANGE_ORDER_STATUS_PACKAGED`, `CHANGE_ORDER_STATUS_CANCELED`, `CANCEL_ORDER`) for confirm, pack and cancel?
- Does the backend send shop order pushes only to members, or to anyone subscribed to the FCM topic? (Topic pushes reach every subscribed device. The app now removes the topic on leave and on the next visit after a removal, but only the backend can stop a push at once.)
- Does `POST /shop/users/add` check that the phone belongs to a verified user, and does it notify that user?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/app/sellerProfile/layouts.test.tsx`, `shopListFirstPaint.test.tsx` (load failure with retry), `SellerProfileContext.test.tsx`
- `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` (delete confirm), `permissionsTab.test.tsx`
- `tests/serverRequests/settings/index.test.ts`
- `tests/components/settings/GoToSellerDashBoard.test.tsx`
- `tests/components/SellerDashboard/orders.test.tsx` (BUG-seller-702..705, all fixed and passing; cancel confirm)
- `tests/components/SellerDashboard/carts/CartsTab.test.tsx`, `ActiveCartDetails.test.tsx`, `ProductCartsModal.test.tsx`
- `tests/components/SellerDashboard/productOrders/ProductOrdersModal.test.tsx`; `tests/services/sellerDashboard/productOrders.test.ts`
- `tests/components/SellerDashboard/locations/LocationsTab.test.tsx`, `LocationFormModal.test.tsx`, `LocationMapPicker.test.tsx`
- `tests/components/SellerDashboard/ShopInfo.test.tsx` (load error with retry, save error in the form), `ShopInfoLoader.test.tsx`; `tests/services/sellerDashboard/updateShopInfoBody.test.ts` (BUG-seller-400, BUG-seller-701)
- `tests/components/SellerDashboard/StoriesTab.test.tsx`
- `tests/components/SellerDashboard/CommentsTab.test.tsx`, `CommentProductInfo.test.tsx`; `tests/services/elastic/sellerComments.test.ts`; `tests/services/sellerDashboardComments.test.ts`; `tests/services/sellerDashboard/commentPermissions.test.ts`
- `tests/app/api/seller/comments/route.test.ts`, `reply/route.test.ts`, `social/route.test.ts`
- `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx`

No `it.fails` or `test.fail` marker in this section's tests.

**Browser (Playwright):**
- `tests/e2e/sellerDashboard.live.spec.ts` — SD-01 (reach the dashboard from Settings), SD-02 (tiles), SD-03 (menu and back), SD-04..SD-09 (locations list, filter, create, edit, status, form checks), SD-10..SD-12 (shop info read, form checks, save and restore). **SD-12 is marked red on purpose** for the core backend (media 422); the app code has changed since, so its current result needs a new run.
- `tests/e2e/sellerDashboard.scripted.spec.ts` — SCRIPT-26 (a small role: only its sections, refused elsewhere, read-only shop info). It fakes the permission answer, so it does not prove the backend refuses.
- `tests/e2e/sellerStories.live.spec.ts` — SST-01..SST-09 (open, upload, feed, guest, product button, product page, delete, refused files and links).

**No test at all for:**
- order item Confirm / Packed / Cancel against a real backend (no e2e);
- the order push refresh and the topic subscribe / unsubscribe (W-15) against real Firebase;
- carts against a real backend;
- the Users tab (add, change role, delete, leave) against a real backend (SD-15 is reserved and not written);
- comment reply / edit / delete against the real Elasticsearch;
- leaving a shop from the shop list against a real backend.
