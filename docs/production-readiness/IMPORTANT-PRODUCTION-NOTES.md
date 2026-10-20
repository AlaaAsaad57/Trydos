# IMPORTANT — Production notes

Settings that must be in place before the site goes to production, and the items the owner accepted as they are. The owner handles these. They are not listed in the section files.

## Elasticsearch index names

The app reads every Elasticsearch index name from an environment value (`services/elastic/INDEXES.ts`). When a value is empty, the app falls back to the **staging** index. So production reads and writes staging data until all ten values are set.

| Environment value | Staging fallback | Used by |
|---|---|---|
| `ELASTIC_CATALOG_INDEX` | `products_catalog_develop` | home, search, listing and filters, compare search, sitemaps |
| `ELASTIC_VIEWS_INDEX` | `product_views_develop` | product page (view counts) |
| `ELASTIC_RECOMMENDATION_INDEX` | `recommended_system_develop` | home (recommended products) |
| `ELASTIC_RECOMMENDATION_COLD_INDEX` | `cold_start_recommendations_develop` | home (recommendations for new shoppers) |
| `ELASTIC_COMMENTS_INDEX` | `comments_develop` | reviews and questions, seller comments tab |
| `ELASTIC_PRODUCT_INTERACTIONS_INDEX` | `product_interactions_develop` | product likes and counts, seller social counts |
| `ELASTIC_USER_INTERACTIONS_INDEX` | `user_product_likes_develop` | product likes |
| `ELASTIC_COMMENTS_INTERACTIONS_INDEX` | `comments_reactions_develop` | comment likes, seller comments tab |
| `ELASTIC_SHARE_INDEX` | `shared_products` | product share counts |
| `ELASTIC_SEARCH_LOG_INDEX` | `search_logs_develop` | search history and trending searches (written on every search) |

- [ ] Set all ten values in the Vercel **production** environment. `.env.example` lists them.
- [ ] The production indexes must exist and be filled by a production backend first. The cluster has plain-name copies (`comments`, `comments_reactions`, `product_interactions`), but they are months old: the staging backends write only to the `_develop` names.
- [ ] Check the mapping of each production index against the `_develop` index it replaces.
- [ ] After the first production deploy, open a product, a listing and the search, and check that the data is production data.

## Seller dashboard

| Environment value | What needs it | Without it |
|---|---|---|
| `GEMINI_API_KEY` | "Add with AI" (also the search analyser and image search) | "Add with AI" cannot read a photo |
| `REDIS_URL` (plus `REDIS_USERNAME` and `REDIS_PASS` when the server asks for them) | the "Add with AI" limit of 10 calls per minute per shop | "Add with AI" answers "busy" every time. The paid AI never runs without a limit |
| `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, `NEXT_PUBLIC_BASE_MEDIA_URL` (no static media key: uploads use the ticket alone since 2026-10-20) | every upload in the dashboard: product images and video, gallery, Excel sheets, boutique icons and banners, shop logo | every upload stops with "Media server upload is not configured" |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | the shop location map | the map uses the key that is written in `utils/mapsConfig.ts` |

- [ ] Set these values in the Vercel **production** environment. `.env.example` lists them.
- [ ] In the Google Cloud console, limit the Maps key to our production domains (HTTP referrer). A Maps key is always visible in the browser, so only this limit protects it.
- [ ] After the first production deploy, upload one product image and one Excel sheet, and run "Add with AI" once.

## Listing price filter

| Environment value | What needs it | Without it |
|---|---|---|
| `LISTING_PRICE_AGG_ENABLED=true` | the price section (slider and count) in the listing filter panel | the filter panel never shows the price section. The panel opens with no `prices.total`, and after a chip tap the price answer is `null` (`FilterWidgetServer.tsx:29-35`, `elasticSearch.ts:331`, `:987`) |

- [ ] Check `LISTING_PRICE_AGG_ENABLED=true` on staging first (the price aggregation runs on every listing query).
- [ ] Set it in the Vercel **production** environment. Moved here from 03 M-2 / A2-22 on 2026-10-20; it is a setting, not open work.

## Accepted by the owner

These items stay in production as they are. The owner accepted them, so they are not open work. They are listed only here, not in the section files or in `BLOCKERS-AND-PLACEHOLDERS.md`. Support and Product should know them.

### Checkout and orders

- **Fake ZIP and "Not Entered" on addresses** (accepted 2026-10-20; was 07 M-2, A2-12). Every new or edited address is saved with ZIP `123123`. An empty city, province, town, street or building is saved as "Not Entered" (`services/order.ts:270-280, 325-335`). Labels, invoices and the seller's order screen show these values. `tests/services/orderClass.test.ts:510-515` checks them.
- **The delivery note on an address change is lost** (accepted 2026-10-20; was 08 M-1, A2-15). The "Delivery Note" tab lets the shopper write a note, but `ChangeAddress()` sends only the group id and the address id (`components/Orders/ChangeAddressWidget.tsx:61-75`, `services/order.ts:595-620`). The change succeeds and the note is dropped. The backend endpoint has no note field. Known bug **BUG-products-3**: the `it.fails` case in `tests/components/Orders/ChangeAddressWidget.test.tsx:189` stays an expected failure.

### Reviews, questions and likes

Accepted 2026-10-20 (was in file 05).

- **Review photos are not shown on the product page.** The author of a review can add or change photos in the edit sheet, but `BuyersCommentItem` renders no `comments_images_customer`. Other shoppers never see them.
- **The footer "comments" count counts questions only.** `GetProductCommentsCount` leaves out everything with an `order_details_id`, so reviews are not counted (`serverRequests/product.tsx`).
- **The CMT-09 browser test goes red on and off.** CMT-09 writes, changes and removes a review. The cause is not pinned (`tests/e2e/orderRating.live.spec.ts:150`). It is a test task; no fault in the app code is known.

### Search

- **The search log keeps IP, user agent and user id with no retention rule** (accepted 2026-10-20; was 02 M-5, A2-28). `logSearchTerm` in `services/elastic/helpers.ts` writes every search with the caller's IP, user agent and user id, and nothing deletes old rows.
- **Popular words have no blocklist** (accepted 2026-10-20; was 02 M-4, A2-3). The check in `services/elastic/helpers.ts` is a placeholder (`isBlacklisted = false`), and QA or test searches are logged too, so any searched word can appear under "Popular Search".

### Chat

- **A new message cannot be found by search for more than 20 minutes** (accepted 2026-09-29; was 12 L-4). The chat backend indexes new messages late. An edited message is found at once.
- **Chat does not open on an iPhone Safari tab that has no push** (accepted 2026-10-20; was 14 M-5, A2-20). Opening chat needs push permission. Safari versions that give push to a tab work; older versions and in-app browsers show the "Notifications Not Supported" card instead of the chat.

### Wishlist

- **A guest's saved products do not survive sign-in** (accepted 2026-10-20; was in file 17). A guest's checklist is saved on the gateway. A signed-in shopper's checklist is read from the core backend, and nothing moves the list at sign-in. After sign-in the shopper sees only the checklist of the signed-in account.

### Seller dashboard — catalog

Accepted 2026-10-20 (was in file 15).

- **No search on the Products tab** (was M-1). Only Prev / Next pages, so a seller with many products must page through them (`page.tsx:1269-1504`, `services/sellerDashboard/index.ts:106`).
- **No product delete** (was M-2). A seller can only disable a product.
- **Boutique delete is turned off** (was M-3). `const canDelete = false` hides the button; the handler and the service call exist (`boutiqueEdit/BoutiqueEditor.tsx:111, 630`).
- **L-1** Attributes and video exist only on the edit screen. A new product gets them after its first save (`ProductEditor.tsx:1108, 1114`).
- **L-2** Create sends only the default-language translation. Other languages are added on the edit screen (`productEdit/helpers.ts:1466-1485`).
- **L-3** A product with total stock 0 cannot be saved, because the rule refuses `<= 0` (`productEdit/helpers.ts:938`). A seller cannot edit a sold-out product without typing a stock.
- **L-4** No size or count limit before upload for product images, meta image, video and gallery files (`productEdit/sections.tsx:1125, 1282, 1904`; `GalleryTab.tsx:140`). A large file fails only at the media server.
- **L-5** The boutiques list asks for one answer only, with no page parameter (`services/sellerDashboard/index.ts:121`). If the backend pages boutiques, later pages never show.
- **L-6** Boutique status can change only in edit mode, so it also needs `UPDATE_BUTIKS` (`BoutiqueEditor.tsx:608`). A user with only `CHANGE_BOUTIQUE_STATUS` cannot use it.
- **L-7** The Excel category picker indents by the backend `level` field (`ExcelUploadTab.tsx:1121`). That field is wrong for many categories, so the indent is wrong. The full path text is still shown.
- **L-8** The Excel "Download" link is built from `original_filename` (`ExcelUploadTab.tsx:68`), not from the stored media key. It may point to a file that does not exist.
- **L-9** "Add with AI" needs Redis. When Redis is down, the route answers "busy" every time. This is on purpose: the paid AI never runs without a limit.
- **L-10** The AI category tree is built from the `display_name` path, not from `level`, because `level` is wrong on the backend (`_autofill.ts` `buildCategoryLists`). Mismatches are reported to Sentry.

### Seller dashboard — operations

Accepted 2026-10-20 (was in file 16).

- **No order-level status change** (was M-1). The control is commented out, so `updateOrderStatus` is never called. Only per-item Confirm / Packed / Cancel work (`orders.tsx`, `services/sellerDashboard/index.ts:174-191`).
- **No screen to create or edit roles** (was M-2), although `CREATE_ROLES` / `UPDATE_ROLES` exist. The Permissions tab shows only the user's own permissions.
- **L-1** Order item buttons (Confirm, Packed, Cancel) show to anyone with **any** order permission. The backend decides; a refusal shows its reason.
- **L-2** Old carts can be searched by the service (`services/sellerDashboard/index.ts:1338-1358`), but the Carts tab has no search box.
- **L-3** Comment permissions are cached in Redis for 30 s, and a stale copy is used for up to 1 hour when the core backend is down (`services/elastic/sellerComments.ts:79-81, 186-205`). A removed member can still reply during that time.
- **L-4** Only `SUPER_ADMIN` sees "Change Role" and "Delete" in the Users tab. `UPDATE_EMPLOYEES` and `DELETE_EMPLOYEES` are not used.
- **L-5** A location cannot be deleted, only deactivated (no backend endpoint; `services/sellerDashboard/index.ts:1148`).
- **L-6** The order push clean-up for a **removed** member runs on that member's device, the next time they open the shop list or Settings (`utils/shopOrderTopics.ts`, `reconcileShopOrderTopics`). Until then the device still holds the topic.

### Security

Accepted 2026-10-20 (was 20 M-1, M-2 and A1-1, A1-2).

- **The error sink copies session tokens into the gateway error log.** `internal/mobile-error-log` adds the market, chat, stories and wallet tokens, `USER_ID_HASH` and every cookie (`cookiesSnapshot`, so refresh tokens too). `LogServerError` adds the same five tokens to every server error it posts (`app/api/internal/mobile-error-log/route.ts:14-41`, `utils/serverErrorReporter.ts:26-37, 78-82`, `utils/server/mobileErrorLog.ts:18-32`). Anyone who can read `/mobile_error_log/store` can take over shopper sessions, wallet sessions included. `tests/app/api/internal/mobile-error-log/route.test.ts` expects `cookiesSnapshot` in the record.
- **The error sink has no auth and no limit** (`app/api/internal/mobile-error-log/route.ts:6`). Any client can POST without end, and each POST becomes a gateway write.
- [ ] Because of these two items, the backend must limit who can read the gateway error log. A Vercel Firewall rate limit on `/api/internal/mobile-error-log` is still wise.
