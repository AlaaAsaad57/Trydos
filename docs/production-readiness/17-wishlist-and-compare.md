# Wishlist and compare — Production readiness

**Status:** ✅ Closed — the owner closed this section on 2026-10-20. Nothing is left to do here before launch.
**In one line:** Saving, listing, paging and removing products work for guests and signed-in shoppers, and compare works end to end. The one open item was accepted by the owner (see "Accepted by the owner").
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.
**Fixed after the first check:** M-1, M-2, L-1, L-4, L-6, L-7, L-8 and the RTL labels of L-9. They are now W-22 to W-29. Each code fix has a unit test that was seen red before the fix and green after it.

## What this section is
**Wishlist ("checklist").** The shopper saves a product from the product page: footer "More" (three dots) → "Add To My Checklist". They see the list at `/[lang]/settings/checklist` (avatar menu → Settings → "My Checklist"), open a product from it, load more, and remove items.
**Compare.** The shopper adds up to two products from the product page ("More" → compare button), then opens `/[lang]/compare` from the avatar menu → "Compare". The page has two product pickers and a side-by-side table.
The checklist is stored on the market backend: a guest reaches the **gateway**, a verified shopper reaches the **core** backend (`utils/server/tokenManager.ts:176-190`). Compare stores nothing on a server; it keeps two cookies, `f_p` and `s_p`.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Product page → "More" → "Add To My Checklist" → the app asks whether the product is saved, then saves it. The button turns green and "Added to checklist" shows. A GA `ADD_TO_FAV` event is sent on add only. | Market: `GET /checklist/product/{id}/exist`, then `POST /checklist` (gateway for a guest, core when verified) | `components/products/MoreOptionsSection.tsx:157-195`, `services/wishlist.ts` (`isInWishlist`, `addToWishlist`) | `tests/components/products/MoreOptionsSection.test.tsx`, `tests/services/wishlist.test.ts`; e2e WISH-02, WISH-06 |
| W-2 | Same button on a saved product → the product is removed, the green goes away, and "Removed from checklist" shows. | Market `DELETE /checklist/{id}` | `MoreOptionsSection.tsx:166-169`, `services/wishlist.ts` (`removeFromWishlist`) | `MoreOptionsSection.test.tsx` "adds to and removes from the checklist" |
| W-3 | Open a saved product again → the "More" panel shows the checklist button green. | Market `GET /checklist/product/{id}/exist` | `MoreOptionsSection.tsx:141-155` | e2e WISH-04 |
| W-4 | A save or remove that the backend refuses → "Failed to update checklist". The state does not change. | Market | `MoreOptionsSection.tsx:190-191`, `services/wishlist.ts` (throws on `success: false`) | `MoreOptionsSection.test.tsx` "warns when the checklist fails…", `wishlist.test.ts` "throws error when API returns success: false" |
| W-5 | Avatar menu → Settings → "My Checklist" → the checklist screen loads page 1 (10 items), with a skeleton while loading. Each row shows the image and the name. | Market `GET /checklist?page=1&page_size=10` | `app/(client)/[lang]/settings/page.tsx:59-63`, `app/(client)/[lang]/settings/checklist/page.tsx`, `components/setting/checklist/ChecklistView.tsx`, `ChecklistItem.tsx` | `tests/components/setting/checklist/ChecklistView.loadMore.test.tsx`, `tests/app/settings/pages.test.tsx`; e2e WISH-03 |
| W-6 | A shopper with nothing saved sees "Your CheckList is empty". | Market `GET /checklist` | `ChecklistView.tsx:142-151` | `ChecklistView.loadMore.test.tsx` "shows the empty state…"; e2e WISH-01 |
| W-7 | More than 10 saved → "Load more" appears → the next page is added; "Loading..." shows meanwhile; the button hides on the last page. `has_next` is worked out from `current_page < last_page`, because no backend sends it. | Market `GET /checklist?page=N` | `services/wishlist.ts:74-103`, `ChecklistView.tsx:58-73` | `ChecklistView.loadMore.test.tsx` (BUG-1, now a normal passing case), `wishlist.test.ts` |
| W-8 | Tap a checklist row → the product page opens at `/[lang]/products/{slug}`. | none (navigation) | `ChecklistItem.tsx` (`NextLink`) | none |
| W-9 | Tap the cross on a row (or press Enter / Space on it) → the row dims with its own spinner → it is removed, and "Removed from checklist" shows. A refused remove keeps the row and shows "Failed to remove from checklist". A second tap during the remove is ignored. | Market `DELETE /checklist/{id}` | `ChecklistView.tsx:75-94`, `ChecklistItem.tsx` | `ChecklistItem.test.tsx`, `ChecklistView.loadMore.test.tsx` "removes a product, ignores a second tap…"; e2e WISH-05, WISH-06 |
| W-10 | A guest can save and remove products. The request uses the guest's `MARKET-TOKEN` and reaches the gateway. | Gateway `/checklist*` | `utils/server/tokenManager.ts:78`, `:122`, `:181` | e2e WISH-01 to WISH-05 |
| W-11 | A signed-in verified shopper saves, sees and removes a product. The request reaches the core backend. | Core `/checklist*` | `utils/server/tokenManager.ts:176-190` | e2e WISH-06 |
| W-12 | Product page → "More" → compare button → the product goes into the first free cookie slot (`f_p`, then `s_p`). The button turns green, and a toast "Added To Compare! Click To Go To Compare Page" links to `/[lang]/compare`. | none (cookies) | `MoreOptionsSection.tsx:500-532`, `utils/functions.ts` (`addToCompare`) | `MoreOptionsSection.test.tsx` "adds to compare…", `tests/utils/functions.test.ts`; e2e CMP-02, CMP-03 |
| W-13 | Both slots full → adding a third product replaces the first, and the shopper is told. | none (cookies) | `MoreOptionsSection.tsx:515-529`, `utils/functions.ts` (`addToCompare`) | `MoreOptionsSection.test.tsx`; e2e CMP-04 |
| W-14 | Tap the green compare button again → the product leaves compare; if it was first, the second moves into first place. "Removed From Compare" shows. | none (cookies) | `MoreOptionsSection.tsx:506-512`, `utils/functions.ts` (`removeFromCompare`) | `MoreOptionsSection.test.tsx`; e2e CMP-05 |
| W-15 | The compare button stays correct when the cookies change in another place: the app listens to the `compare-changed` event and to window focus. | none | `MoreOptionsSection.tsx:197-215` | `MoreOptionsSection.test.tsx` "reads compare from the cookies on focus and on the compare event" |
| W-16 | Avatar menu → "Compare" → `/[lang]/compare` opens. With nothing chosen, both columns show "-". | none | `components/Home/Menu.tsx:206-215`, `app/(client)/[lang]/compare/page.tsx` | `tests/components/Home/Menu.test.tsx`; e2e CMP-01 |
| W-17 | The compare page restores the products from `?f_p=&s_p=` in the address, or from the cookies when the address names fewer than two. Each product is loaded from two market calls in parallel. | Market `GET /web/product/globalDetails/{slug}`, `GET /web/product/qtyPriceDetails/{slug}` (gateway for a guest, core when verified) | `components/global/compare.tsx:37-94` (mount), `:156` (`GetProductData`) | `tests/components/global/compare.test.tsx`; e2e CMP-02, CMP-03 |
| W-18 | Type in "Search for Product 1" or "Search for Product 2" → after 500 ms up to 10 results show → pick one → that slot fills, and the cookie and the address are updated. | Next route `GET /api/products/searchInCatalog` → Elasticsearch catalog | `compare.tsx:117` (`searchFunction`), `:198` (`handleProductSelect`), `:285` (`debouncedChangeHandler`) | `compare.test.tsx` "finds products by search…"; e2e CMP-06 |
| W-19 | Tap the clear cross in a picker → that slot empties, in the table, the cookie and the address. | none | `compare.tsx:328` (`handleClear`) | `compare.test.tsx` "empties each slot…"; e2e CMP-07 |
| W-20 | The table shows name (link), image (link), colours, sizes, price, offer price and details. HTML details are passed through `sanitizeHtml`. The table runs right to left in Arabic and Kurdish. | Market (data from W-17) | `compare.tsx:351` (`compareFields`), `:640` (table) | `compare.test.tsx` (incl. "lays the table out right to left in Arabic", BUG-global-100 as a normal passing case) |
| W-21 | A product that the market backend does not know, or whose live price cannot be read → its slot is cleared and "One of the products was not found. Please try searching for a different product." shows. | Market | `compare.tsx:251` (`handleProductSelect` catch) | `compare.test.tsx` "drops a product the market backend does not know…", "drops a product whose live price cannot be read" |
| W-22 | Both compare slots full → adding a third product replaces the first, and the message "Compare was full — replaced the first product…" shows in English, Arabic, Turkish and Kurdish. | none (cookies) | `MoreOptionsSection.tsx:527`, `public/translations/translations.{ar,tr,ku}.js` | i18n parity check (`scripts/i18n-parity.mjs`); e2e CMP-04 (English only) |
| W-23 | The checklist read is refused → the screen shows "Something went wrong" and a "Try again" button, not "Your CheckList is empty". "Try again" reads the list again. | Market `GET /checklist` | `services/wishlist.ts` (`getWishlist` throws on `success: false`), `ChecklistView.tsx` (`checklist-error`, `checklist-retry`) | `wishlist.test.ts` "getWishlist throws when the market backend refuses the list", `ChecklistView.loadMore.test.tsx` "shows an error with a retry…" |
| W-24 | The shopper removes products and then taps "Load more" → every saved product is shown, none twice. The screen asks for the page that holds the first product not yet shown, and drops rows it already shows. | Market `GET /checklist?page=N` | `ChecklistView.tsx` (`loadMore`, `removedSinceLoad`), `services/wishlist.ts` (`CHECKLIST_PAGE_SIZE`) | `ChecklistView.loadMore.test.tsx` "shows every product after the shopper removes some and taps Load more" |
| W-25 | A refused "is it saved?" read → a clear error, which the product page logs; the button shows "not saved". | Market `GET /checklist/product/{id}/exist` | `services/wishlist.ts` (`isInWishlist`), `MoreOptionsSection.tsx:141-155` | `wishlist.test.ts` "isInWishlist throws a plain error, not a TypeError…" |
| W-26 | Each compare picker has its own search results and its own spinner. A search in one picker does not show in the other. | Next route `GET /api/products/searchInCatalog` | `compare.tsx` (`options1` / `options2`, `searchHandler1` / `searchHandler2`) | `compare.test.tsx` "keeps each picker's search results to itself" |
| W-27 | A compare picker does not offer the product that is already in the other column, so the same product cannot fill both columns. | none | `compare.tsx` (`toSelectOptions`) | `compare.test.tsx` "does not offer the product that is already in the other column" |
| W-28 | Compare shows no currency symbol until the shopper's currency is loaded (no wrong "$"), like the rest of the app. | none | `compare.tsx` (`compareFields`, price rows) | `compare.test.tsx` "…with no symbol when no currency is set" |
| W-29 | In Arabic and Kurdish the compare row labels sit on the right side, with the column border on the correct side. | none | `compare.tsx` (`text-start`, `border-e`) | none (CSS only) |

## ⚠️ Works, with limits
- **L-1 — The button text never changes.** When the product is saved, the button still says "Add To My Checklist"; only the background turns green (`MoreOptionsSection.tsx:346`, `:497`). There is no "Remove" wording.
- **L-2 — Two calls per tap, and maybe two toasts.** Every tap first asks `/exist`, then writes (`MoreOptionsSection.tsx:164`). The add and remove calls do not pass `noMessage`, so if the backend sends a message, `fetchData` shows it as a toast next to the app's own "Added to checklist".
- **L-3 — Checklist rows are minimal.** A row shows only the image and the name. There is no price, stock or variant, because the list answer carries only `id`, `name`, `slug`, `image`.
- **L-4 — Compare is limited.** Only two products. No "add to cart" from the table.
- **L-5 — Compare is only in the avatar menu.** The "Compare" entry in Settings is commented out (`app/(client)/[lang]/settings/page.tsx:84-88`). The route itself works.
- **L-6 — The compare product details are cached for the whole visit.** `globalDetails` is read with `useCached: true`, and that cache has no expiry (`compare.tsx:174`). Price and stock are always read fresh.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | There is no save button on product cards (listing, home, search). Saving is possible only from the product page "More" panel. | No heart on cards. | no code (searched all `components/`) | Product | No — a product decision. |

## ✔️ Accepted by the owner
The owner accepted this on 2026-10-20. It does not block launch.
- **A guest's saved products do not survive sign-in.** A guest's checklist is saved on the gateway; a signed-in shopper's checklist is read from the core backend, and nothing moves the list at sign-in. After sign-in the shopper sees the checklist of their signed-in account only.

## 🔒 Must do before launch
Nothing.

## ❓ Needs confirmation from the backend team
- Do the gateway and core `/checklist` endpoints answer the same shape in production (`current_page`, `last_page`, `data[]` with `id`, `name`, `slug`, `image`)? Staging matched on 2026-09-19, per the comment in `services/wishlist.ts`.
- Does `POST /checklist` refuse a product that is already saved, or accept it again? The app always reads `/exist` first, so a refusal would only show in a race.
- Do the add and remove answers carry a `message`? If yes, the shopper gets two toasts (L-2).
- Does `/checklist/product/{id}/exist` answer for a product that is hidden or deleted? And does `GET /checklist` still list such products?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/services/wishlist.test.ts`
- `tests/components/setting/checklist/ChecklistView.loadMore.test.tsx` (BUG-1 is a normal passing case), `tests/components/setting/checklist/ChecklistItem.test.tsx`
- `tests/components/products/MoreOptionsSection.test.tsx`
- `tests/components/global/compare.test.tsx` (BUG-global-100 is a normal passing case), `tests/components/global/AsyncSelectCustom.test.tsx`
- `tests/components/Home/Menu.test.tsx`, `tests/app/settings/pages.test.tsx`, `tests/utils/functions.test.ts`, `tests/utils/server/tokenManager.test.ts`

**Browser (Playwright, staging):**
- `tests/e2e/wishlist.live.spec.ts` — WISH-01 to WISH-05, as a guest (gateway).
- `tests/e2e/wishlist-signed-in.live.spec.ts` — WISH-06, as the shared signed-in account (core). It skips when the test account secrets are missing.
- `tests/e2e/compare.live.spec.ts` — CMP-01 to CMP-07.

There are no `it.fails` or `test.fail` markers in this section.

**Important cases with NO test:**
- Opening a product from a checklist row (W-8).
- Removing a saved product from the product page, in the browser suite (unit only).
- The compare page and its messages in Arabic, Turkish or Kurdish in the browser suite. The unit suite checks only the RTL table direction.
