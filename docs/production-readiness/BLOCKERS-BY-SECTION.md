# Open launch blockers, by section

**Date:** 2026-10-21

The 20 sections of the web app. Each section lists its working cases first, then only the blockers that are **still open**.

An item that belongs to more than one section is listed under each of them, with the same id.

**Owner** says who acts: Frontend, Product, Ops or Backend.

## Summary

| # | Section | Working cases | Open blockers |
|---|---|:-:|:-:|
| 01 | Home & discovery | 22 | 1 |
| 02 | Search | 27 | 0 |
| 03 | Listing & filters | 24 | 1 |
| 04 | Product page | 31 | 2 |
| 05 | Reviews, questions & likes | 28 | 0 |
| 06 | Cart | 32 | 0 |
| 07 | Checkout & payment | 27 | 3 |
| 08 | Orders & returns | 29 | 2 |
| 09 | Wallet & banking | 7 | 6 |
| 10 | Sign-in & session | 28 | 2 |
| 11 | Profile & settings | 26 | 2 |
| 12 | Chat & calls | 52 | 2 |
| 13 | Stories | 29 | 0 |
| 14 | Notifications | 18 | 0 |
| 15 | Seller dashboard — catalog | 44 | 0 |
| 16 | Seller dashboard — operations | 36 | 0 |
| 17 | Wishlist & compare | 29 | 0 |
| 18 | Static pages & legal | 17 | 4 |
| 19 | Languages, regions, SEO & monitoring | 41 | 1 |
| 20 | Security & infrastructure | 25 | 3 |
| | **Total** (a blocker in two sections counts twice) | **572** | **29** |
| | **Total** (each blocker counted once) | | **21** |

---

## 01. Home & discovery

### Working cases (22)

| # | Case |
|---|---|
| W-1 | Shopper opens `/sy-en` → the page shows the category bar, the product rows and the boutique list. |
| W-2 | The category bar lists every category once, in the shopper's language, for the shopper's country. |
| W-3 | Shopper taps a category → `/categories/{slug}` opens, the tab is marked open and moves to the front. Tapping it again goes back to the home page. |
| W-4 | On a category page, the featured row, the flash-deals row and the boutique list show only that category. The recommended row is not shown there. |
| W-5 | A category address with a bad shape (symbols, more than 64 characters) → 404 page. |
| W-6 | The category bar shows left/right scroll arrows only when the bar overflows. Right-to-left languages (`ar`, `ku`) scroll the other way. |
| W-7 | Featured row: up to 10 featured products for the country. The header links to `/featured`. A "Show More" tile appears when there are more than 8 cards. |
| W-8 | Flash-deals row: up to 10 products with an active deal (`flash_deal_status: 1`, inside the start/end dates). The header links to `/flashDeals`. |
| W-9 | A row with no products is not drawn at all, and its skeleton space is not reserved, so the boutiques do not jump up. |
| W-10 | Boutique list: 10 boutiques, each with a banner slider and a strip of category / product tiles. Banner → `/filters/boutiques/{slug}`. A tile → a category inside the boutique, or the product page. |
| W-11 | Shopper scrolls down → the next 10 boutiques load. Loading stops when a page comes back empty or with no cursor. |
| W-12 | Recommended row (home page only): 7 products from the shopper's own recommendation list. A guest, or a shopper with no list, gets the "cold start" list. "Show More" loads 7 more. |
| W-13 | Test (QA) shops — slug starting with `trydos-qa-`, any letter case — never show in the featured row, flash-deals row, boutique list or recommendations. |
| W-14 | Hidden products stay hidden: inactive or deleted product, inactive boutique or brand, seller not approved, product / brand / boutique / category blocked for the country. |
| W-15 | Prices on the home page use the country's currency and exchange rate. The rate is kept in Redis and in the page cache. |
| W-16 | Starting settings (platform shipping days, decimal digits) load once in the browser. Both key spellings are accepted: core `starting-setting` and gateway `starting_setting`. |
| W-17 | A dead product link sends the shopper to `/{lang}?message=product_not_found` → "Product not found" toast, and the `message` is removed from the address. |
| W-18 | A missing or hidden boutique sends the shopper to `/{lang}?message=boutique_not_found` → "Boutique not found" toast. An unknown `message` value is removed with no toast. |
| W-19 | Name entry: a signed-in shopper with a chat and a stories account but no name taps chat or "add story" on the home page → the name modal opens. The arrow (shown after 2 characters) saves the name to three services. If one refuses, the old name comes back and an error toast shows. |
| W-20 | The home rows come from a shared cache, one entry per country + language + category. No cookie or header is read inside the cache, so one shopper's data cannot reach another. |
| W-21 | Page title, description and share image for home and category pages, in the shopper's language, with a translated fallback when the build fails. |
| W-22 | A product opened from deep in the home page opens over it. Closing it returns the shopper to the same scroll position. |

### Open blockers (1)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A1-7 | The Elasticsearch client accepts any TLS certificate (`rejectUnauthorized: false`). A machine in the middle can read the index user name, password and data. | Frontend + Ops | `services/elastic/elasticsearch.config.ts:15-17` |

## 02. Search

### Working cases (27)

| # | Case |
|---|---|
| W-1 | Shopper taps the search icon → overlay opens, page scroll locks, store flag `enable_search` turns on |
| W-2 | Overlay opens → past search words show from the browser (`localStorage` key `search-history`) |
| W-3 | Shopper taps a past word → the word fills the box and the search runs |
| W-4 | Shopper removes one past word (X), or taps Clear All → the words leave the screen and the storage |
| W-5 | Overlay opens → "Popular Search" shows the 10 most searched words with counts |
| W-6 | Shopper taps a popular word → the word fills the box and the search runs |
| W-7 | Shopper types → after a 1.5 s pause the overlay shows up to 20 products, plus brands, categories and boutiques |
| W-8 | Shopper types fast → only the newest answer is shown; a late older answer is dropped |
| W-9 | Shopper types → grey "ghost" text completes the product name; Tab or Right Arrow accepts it |
| W-10 | Shopper taps a brand, category or boutique → it becomes a filter (marked with an icon), and results run again with the filter |
| W-11 | Shopper picks a parent category → its children leave the filter, and the other way round |
| W-12 | A category is active → "Related Categories" shows; a tap adds one |
| W-13 | Shopper taps Load More on brands, categories or boutiques → 10 more items come, with the same filters |
| W-14 | Shopper taps a product result → product page opens, the word is saved to history, GA `search` event fires |
| W-15 | The Search button shows "(Total Products: N)" and opens `/[lang]/filters/...?search=` with the filters |
| W-16 | Shopper presses Enter → the same filters page opens |
| W-17 | Reset button, or reset in the filter bar → the word and all filters clear |
| W-18 | X icon clears the word first; a second tap (or the side close icon) closes the overlay and unlocks the scroll |
| W-19 | Search of 2+ words → AI reads colour, size and product name from the text and adds them as filters |
| W-20 | AI is slow, refused or over quota → the search still runs on the raw text (6 s limit, `SEARCH_ANALYZE_TIMEOUT_MS`) |
| W-21 | Shopper taps the mic → records up to 8 s with a countdown → the text fills the box and the search runs |
| W-22 | AssemblyAI hears nothing or fails → the browser's own speech recogniser (en/ar/tr) fills the box |
| W-23 | Microphone refused, or the browser cannot record → the shopper sees a translated message |
| W-24 | A search of 3+ characters that finds products is logged once per user / IP / browser |
| W-25 | QA test products stay hidden in search, unless the request is in QA mode |
| W-26 | Mobile app calls `GET /api/products/searchInCatalog` → products, filters and a ghost-text suggestion |
| W-27 | The overlay is translated (en/ar/tr/ku) and right-to-left for ar and ku |

### Open blockers (0)

No open launch blockers.

## 03. Listing & filters

### Working cases (24)

| # | Case |
|---|---|
| W-1 | Shopper taps a boutique banner → `/filters/boutiques/{slug}` shows the boutique logo, name, banner slider and its products. |
| W-2 | A boutique that does not exist, or is a QA shop, sends the shopper home with `?message=boutique_not_found` (a "Boutique not found" toast). Inside the overlay the same move is done in the browser. |
| W-3 | Shopper taps a category tile under a boutique → `/filters/boutiques/{b}/categories/{c}` shows that boutique's products in that category. |
| W-4 | `/featured` lists only featured products that are not flash deals. |
| W-5 | `/flashDeals` lists only products with an active deal. |
| W-6 | A `/filters` link opened from inside the app shows the listing over the current page. The back arrow closes it and returns to the page below. A direct load shows the normal page. |
| W-7 | Filter chip row under the bar (categories, brands, colours, sizes, price bands). A tap goes to the new filter address. The active-filters bar removes one filter or clears all. The row shows only when there is more than 1 product. |
| W-8 | Scrolling the chip row to its end loads the next 10 chips of each kind. |
| W-9 | Filter panel (filter icon): category, brand, colour and size chips. Each change re-counts after 400 ms. "Search (Total Products: N)" applies the choice; "Reset" goes back; the cross closes the panel. A chip tapped during a count is not lost. |
| W-10 | A price band in the address works in both forms, `prices/10-50` and `prices/10,50`. The range uses the country's own price when one exists. |
| W-11 | Sort: a bottom sheet with Default, Best sellers, New arrivals (newest / oldest), Price (low→high / high→low) and Name (A→Z / Z→A). "Confirm" writes `?sort=` and the grid reloads from page 1 with skeletons. A shared link with `?sort=` is sorted on the server. |
| W-12 | Sort and filter buttons show only with 2+ products; share shows with 1+. The rule follows a typed search without a page reload. |
| W-13 | In-listing search: typing saves `?search=` 1.5 s after the shopper stops. The grid and the filter chips reload inside the current filters. Grey "ghost" text suggests a completion. |
| W-14 | A search of 2+ words is split by an AI model into product name, colour and size. If the model fails, is rate-limited or takes over 6 s, the search runs on the raw text. |
| W-15 | An old address with search in the path (`.../search/shoes`) is moved to `?search=shoes` with a permanent 308 redirect, on `/filters`, `/featured` and `/flashDeals`. Other filters and query values are kept. |
| W-16 | Infinite scroll: the next 10 products load when the bottom marker comes into view. A product already shown is never shown twice. Loading stops on a short page, an empty page or an unchanged cursor, and after 5 pages in a row with nothing new. Then "You've reached the end" shows. |
| W-17 | No results → "No products found" and a "Clear filters" button. Clearing keeps the boutique when there is one. A search with no result says so, not "end of list". |
| W-18 | Share sheet: Facebook, X, WhatsApp, Telegram, Email, Copy Link (with a "copied" toast) and the phone's own share sheet where it exists. The link keeps the filters, sort and search, plus `utm_source`. |
| W-19 | QA shops (slug starting `trydos-qa-`, any letter case) never show in listings, filters, featured or flash deals. Only a request with the `x-qa-view` header that matches `QA_VIEW_SECRET` (32+ characters) can open a QA boutique page. |
| W-20 | Hidden products never list: inactive or deleted product, inactive boutique or brand, seller not approved, or blocked for the country. |
| W-21 | With a colour filter on, each card shows the photos of the chosen colour first. |
| W-22 | Each listing has its own title, description and canonical address, with a translated fallback. Breadcrumb structured data is added for search engines. |
| W-23 | The page renders the same listing twice in one request (page + overlay slot), but asks Elasticsearch only once. |
| W-24 | A Google Analytics `view_item_list` event is sent for the first page, then only for products that are new on each later page. |

### Open blockers (1)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A1-7 | The Elasticsearch client accepts any TLS certificate. Same item as section 01. | Frontend + Ops | `services/elastic/elasticsearch.config.ts:15-17` |

## 04. Product page

### Working cases (31)

| # | Case |
|---|---|
| W-1 | Shopper opens a product URL → full page renders on the server with photos, name, details and price |
| W-2 | Shopper opens a product from inside the app → it shows as an overlay; closing it returns to the same scroll place |
| W-3 | Shopper opens a product that does not exist (backend 404) → sent to the home page with a "product not found" message |
| W-4 | A temporary backend error on the meta call does not send the shopper away; the page still renders |
| W-5 | Photo gallery: one slide set per colour, swipe, image counter, tap to open full-screen zoom |
| W-6 | Product video: small player plays muted; a tap opens it large with sound; swipe between videos |
| W-7 | Brand logo, "verified" badge, and name line "product \| category \| colour" |
| W-8 | Product description shows as HTML, cleaned by `sanitizeHtml` |
| W-9 | Rating stars, buyer count, views, "Good Quality Product", "Recommend It By N Buyer", and "Made in" flag; a tap opens the details sheet |
| W-10 | Feature labels show in blue / orange |
| W-11 | Descriptors (group, icon, values) show in a row |
| W-12 | Shopper taps a colour → URL gets `?color=`, the gallery and the active border switch at once |
| W-13 | Shopper taps a size → URL gets `?size=`, the size is marked; the add-to-bag sheet reads the same `?size=` |
| W-14 | Size reviews (small / fits / large) show when the product has sizes |
| W-15 | Expected delivery date banner: weekday, date, number of days, country name; a tap opens the delivery sheet |
| W-16 | "Free Shipping" shows when `shipping_cost` is 0; "Free Return" shows when `allow_return_in_days` > 0 |
| W-17 | Product stories row shows the stories linked to the product; test stories are hidden from non-testers |
| W-18 | "You May Also Like" row of related products, with more cards loaded on scroll |
| W-19 | Footer price row: old price, offer price, luck price, in the country currency |
| W-20 | Shopper taps the add button → the add-to-bag sheet opens with this product and colour first |
| W-21 | Shopper taps the heart → like or unlike is saved; count changes; on failure the old state comes back with a message |
| W-22 | Share sheet: share to chat contacts, Facebook, WhatsApp, email, copy link, and native share where the browser has it; each share is counted |
| W-23 | "More" sheet: notify me (price / stock topics), add to checklist, add to compare |
| W-24 | Flash-deal product → orange border and a live countdown banner on the first photo |
| W-25 | Luck product → "Luck! Add To Bag Within N seconds" counter; it pauses when the tab is hidden; a redeemed product does not show it again |
| W-26 | Back button returns to the previous page |
| W-27 | SEO: title (name, colour, size, brand, category), description, canonical and language alternates, Open Graph and Twitter image |
| W-28 | Structured data (JSON-LD): Product, Offer (price, ISO currency, stock), real rating only, breadcrumb |
| W-29 | Mobile app: `GET /api/mobile/product/details/[slug]` and `/qty/[slug]` return the product in the mobile shape |
| W-30 | Mobile app: `GET /api/related-products/[id]` returns related products |
| W-31 | Page is translated (en/ar/tr/ku) and right-to-left for ar and ku |

### Open blockers (2)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-4 | Virtual try-on is fake. "Try On" waits 3 seconds and shows the shopper's own photo as the result. The button shows on almost every product. **Product decides:** remove it or build it. | Product + Frontend | `components/products/TryOnModal.tsx:146-150`, `ProductPhotoSliderWrapper.tsx:304` |
| 04 M-12 | Every product photo shows the tag "Only This Piece", with no condition. The code never checks the stock. A shopper reads it as "this is the last one", even when many are in stock. **Product decides:** remove it, or show it only when the stock is 1. | Product + Frontend | `components/products/ProductImageIndicator.tsx:12`, `ProductPhotoSliderWrapper.tsx:300` |

## 05. Reviews, questions & likes

### Working cases (28)

| # | Case |
|---|---|
| W-1 | Open a product → the "Buyers Comment" strip shows the 5 newest reviews (stars, masked name, date, variant). Deleted reviews are skipped. The strip is hidden when there are no reviews. |
| W-2 | Tap "Load More" at the end of the review strip → the next 10 reviews are added (cursor = `search_after`). |
| W-3 | Each review shows its like heart, stars, and the "Good Quality", "True Size" and "Recommend It" badges. |
| W-4 | Under the review strip the shopper sees the "Recommend It" and "Don't Recommend It" percentages. |
| W-5 | Tap the "Buyers Comment" header → a bottom sheet opens with all reviews, aspect filter chips (in the page language), "Load More", and "There is No Comments Yet.." when empty. A second tap on a chip clears the filter. |
| W-6 | Review owner → menu → "Edit" → change words, stars or photos → "Update Rating". The card changes only after the backend agrees, in every widget at once. Enter in the text box sends only when something changed, like the button. |
| W-7 | Review owner → menu → "Delete" → confirm → the review disappears from the strip and the sheet. |
| W-8 | Open a product → the FAQ strip shows the 5 newest questions (comments with no order). Each shows the seller's answer, or "Waiting Seller Reply...". The "Q" and "A" letters follow the page language. |
| W-9 | "Load More" on the FAQ strip, and the FAQ bottom sheet (tap the header) with filters and paging. |
| W-10 | Signed-in verified shopper types in "Ask Seller Your Question…" (the box keeps the first 200 characters) → send → the question appears at the top of every FAQ widget, with the live colour and size as its variant. The footer count refreshes. |
| W-11 | Footer comment icon → comment tab → type (the box keeps the first 200 characters) → Enter or send → the question appears at the top. |
| W-12 | A guest cannot ask. The FAQ input is read-only and says "Please log in first". The comment tab shows "Please Login so You Can Add a comment" and no input. A shopper with `need_auth` gets "Please Verify Your Phone Number". |
| W-13 | Question owner → "Edit" (shown only while the seller has not answered) → save → new text in every widget. |
| W-14 | Question owner → "Delete" → confirm → the question is hidden in every widget and the count refreshes. |
| W-15 | Any shopper → menu → "Translate" on a question or review → the text changes to the page language. "Show Original" puts it back. |
| W-16 | Translate a seller's answer, and show the original again. |
| W-17 | Signed-in shopper taps the heart on a question, a review or a seller answer → the heart fills and the count goes up at once in every widget. A second tap unlikes. |
| W-18 | A guest taps a comment heart → the login sheet opens with "Please Login First". Nothing is sent. |
| W-19 | Page load shows, per comment, the like count and whether this shopper liked it. Seller-answer likes are stored under `<id>-seller_reply`. |
| W-20 | Shopper taps the product heart in the footer → like or unlike. The heart and count change only after the backend agrees. A refusal puts them back and shows "Failed to update like status. Please try again.". A GA `LIKE_ITEM` event is sent. A tap while a request runs does nothing. |
| W-21 | Page load shows the product like count and the shopper's own liked state. A product nobody has liked yet (no document in the index) shows 0 likes without a Sentry report. |
| W-22 | The footer comment icon shows the question count. The app reads it again 1.5 s after an ask or a delete. |
| W-23 | The comment tab lists questions with "Load More", and sends a GA `VIEW_COMMENTS` event on open. |
| W-24 | The comments token is older than 60 s → a write answers 401 → the app exchanges the comments refresh token, waits 2 s, and retries once. |
| W-25 | A guest taps the product heart → the login sheet opens with "Please Login First". Nothing is sent. |
| W-26 | Elasticsearch fails while reading the reviews, the FAQ or the recommendation bar → that section is left out, the error goes to Sentry, and the rest of the product page (with Add to cart) stays. |
| W-27 | The comments backend refuses a like or unlike → the heart and the count go back in every widget, and the shopper sees "Failed to update like status. Please try again.". |
| W-28 | The comments backend refuses a question, a question edit or a question delete → the shopper sees the backend's reason, or "Something went wrong". The text stays in the box. |

### Open blockers (0)

No open launch blockers.

## 06. Cart

### Working cases (32)

| # | Case |
|---|---|
| W-1 | Shopper taps a product's bag button → the sheet opens, loads the full product and the bag, and shows a loading state until both arrive. |
| W-2 | The sheet picks a default colour and size: the URL's `?color` / `?size`, then the search-filter sizes, then the first one in stock. |
| W-3 | Shopper changes colour → image, price, "Last N" and "Sale" labels follow the chosen colour. |
| W-4 | Shopper changes size → a sold-out size is red, a size the shopper waits for has a bell, "Last N" shows when 10 or fewer are left. |
| W-5 | Shopper taps "Add To Bag" with no colour or size picked → the missing picker shakes and turns red; nothing is sent. |
| W-6 | Shopper adds a new item → `POST /cart/add` → the line is stored, the header number goes up, the button says "Added To Your Bag", and the bag is read again. |
| W-7 | Shopper adds an item that is already in the bag → `POST /cart/update` with quantity + 1. |
| W-8 | The line reaches the seller's limit or the flash-deal limit (the lower one wins) → "Max Allowed Quantity Reached"; no request is sent. |
| W-9 | Shopper taps minus in the sheet → quantity − 1, or the line is removed at 1. A refused removal is not reported as done. |
| W-10 | The backend refuses an add → the shopper sees the backend's message, the error goes to Sentry, and the stock is read again. |
| W-11 | A sold-out, inactive or country-restricted product → the sheet shows "Notify me" instead of "Add To Bag". |
| W-12 | In the bag, plus is refused for stock → a "Do You Want Us To Notify You When It Is Available?" box opens. "Notify Me" asks the browser for push permission, needs a device token, and shows "subscribed" only when the backend agreed. |
| W-13 | Header bag icon shows the number of bag lines. The bag is read at page start, so the number is right before the drawer opens. Tapping the icon opens the drawer. |
| W-14 | `?cart=true` in the URL opens the drawer; opening the drawer writes `?cart=true`; the phone or browser back button closes it. |
| W-15 | Drawer lists each line: image, brand, name, colour, size, pieces, shipping days, price, old price and "Saved N%". A line that is unavailable, inactive or not sold in this country says so. |
| W-16 | Reading the bag fails → "Cart Loading Error" with "Try Again", which reads it again. |
| W-17 | Empty bag → "Cart is Empty" screen; the bottom button says "Back To HomePage" and closes the drawer. |
| W-18 | Plus / minus on a line → `POST /cart/update`. The number changes at once and goes back if the backend refuses. Plus is capped by the seller limit, the flash-deal limit and the stock left. |
| W-19 | Shopper deletes a line → `POST /cart/remove`, then the totals are read again. A refused delete puts the line back. |
| W-20 | Totals panel (swipe or tap to open): items, normal price, total discount %, shipping ("Shipping Is Completely Free…" when 0), and the payable total. Every number comes from the backend. |
| W-21 | Shopper taps "Reschedule" on a line → `POST /cart/convert_to_old`. The line leaves the bag only when the backend says it moved. |
| W-22 | "Out Of Bag!" list under the bag → `GET /old-cart/get_old_cart`, newest first, without items already back in the bag, with a live 30-minute countdown. |
| W-23 | Shopper taps "Add Again?" on an Out Of Bag item → `POST /cart/add`, then both lists are read again. |
| W-24 | Shopper taps "Hide" on one Out Of Bag item, or "Hide All" → the item(s) leave the list and `POST /old-cart/hide` is sent. |
| W-25 | Shopper types a coupon and taps "Apply" → `GET /coupon/apply?code=…`. Accepted: the discount shows on the button and the bag is read again. Refused: the backend's message shows under the box and the total stays the same. |
| W-26 | Shopper opens a shared link with `?coupon=CODE` → the code is saved, removed from the URL, and applied by itself when the checkout opens. |
| W-27 | Luck countdown: a luck product starts a 50-second window the first time it is seen. The window pauses when the tab is hidden, the card is off screen or a page is loading, and it continues after a reload. |
| W-28 | While the window runs, the sheet and the bag show the luck price in orange. Adding the item sends `is_luck: true`, and the product is written to the `redemed_ids` cookie, so the offer ends. |
| W-29 | A product this browser already redeemed shows no luck badge, also on cached pages. An inline script hides the badge before first paint; React hides it again after load. |
| W-30 | An RDB payment is pending and the shopper changes the bag → the backend answers 409. The shopper sees "You have a payment in progress" with "Continue payment" / "Cancel payment" instead of an error. |
| W-31 | A guest's bag stays after the guest signs in. |
| W-32 | Shopper taps "Confirm & Continue" with a line that is unavailable, not sold in this country or inactive → "Please Review Your Cart Some Products Not Available"; the checkout does not open. |

### Open blockers (0)

No open launch blockers.

## 07. Checkout & payment

### Working cases (27)

| # | Case |
|---|---|
| W-1 | Verified shopper taps "Confirm & Continue" → the bag and the customer profile are read again, availability is checked, and the checkout slides in. |
| W-2 | Guest, or shopper with no verified phone, taps "Confirm & Continue" → the phone + one-time-code panel opens inside the button. After a good code, the checkout opens. |
| W-3 | A line is unavailable, inactive or not sold in this country → "Please Review Your Cart Some Products Not Available"; the shopper stays in the bag. The check runs again at both checkout buttons. |
| W-4 | Checkout opens → it loads the wallet balance, the saved addresses, the provinces and the country list. The country list is kept for the session. |
| W-5 | The default address (`is_default: 1`) shows on the checkout. With none, the box says "No Address Selected"; with no address at all, it offers "Add New Shipping Address". |
| W-6 | Shopper opens "Show Address List" and taps another address → `POST /customer/address/set-default`, then the totals are re-priced for that address. The list keeps its order. |
| W-7 | Shopper adds an address → the form checks title, details, region, recipient name and phone; a missing field shakes, also when the field is undefined. `POST /customer/address/add`, then the list is read again from the backend (no local copy, no duplicate). |
| W-8 | Shopper edits an address with the pencil → the form opens filled, also when the backend sent no location. `POST /customer/address/update`. |
| W-9 | Shopper deletes an address → a "Delete Below Address?" box shows the address → "Yes Delete" → `POST /customer/address/delete`. |
| W-10 | A shopper whose name is a guest placeholder must type a user name in the address form. The name is saved with the address. |
| W-11 | Region select: the shopper picks a province from the list, or types (400 ms debounce) → `POST /api/addresses/get-address-by-text`. Picking a result fills province, city, town, street and building, and centres the map. |
| W-12 | The map box opens and loads the country border (`/api/addresses/CountryBoundaryByIso/:iso`). With no border, the map still opens. "Cancel" clears the pin. |
| W-13 | Payment list shows only the methods the backend lists in `available_payment_method` (`cash_on_delivery`, `rdb`, `crypto`, `card`). Unknown names are hidden. A second tap on the chosen method un-chooses it. |
| W-14 | Cash on delivery row shows its delivery cost (`cod_cost`); the totals then use the cash total (`total_cash`). |
| W-15 | "Confirm Shipping & Payment" with no default address or no payment → the missing box shakes, "Please Select an Address" shows, nothing is sent. |
| W-16 | "Confirm Shipping & Payment" with both → bag and availability checked again → step 2 shows the bag items, the default address, the chosen payment and the coupon discount. |
| W-17 | Shopper ticks "I read and agree to the policies and terms" → `GET /customer/approve-policies`. A shopper who agreed before (`is_approve_policies`) sees the tick already set. "Place Order" stays grey and shakes the row until the tick is set. |
| W-18 | Place Order with cash on delivery → bag checked again → `POST /customer/order/checkout/cash_on_delivery?address_id=…` → success screen with "The Purchase Was Completed Successfully" and the order number. The purchase is reported to analytics once. |
| W-19 | The backend refuses the order → its message shows as a red notice, no success screen, the button stops loading. |
| W-20 | The bag becomes empty between the two steps → the shopper goes back to the bag. |
| W-21 | The access token expires during checkout → the session is renewed and the order completes. |
| W-22 | RDB: Place Order with "RDB Wallet" → payment screen → `POST /customer/order/checkout/rdb` with the default address. The screen shows the amount and currency exactly as sent, the QR, the short code (copy button), a countdown, and an "open the RDB app" link on phones. It asks `GET /customer/order/rdb-request/:ref` every 4 s. |
| W-23 | RDB paid → the orders for the bag are loaded → success screen with the order number and the RDB receipt number. Expired, cancelled or failed → the screen says so. A 409 "already pending" opens the existing request instead of a second one. |
| W-24 | RDB cancel → `POST /customer/order/rdb-request/:ref/cancel`. If the money already landed (409), the screen shows the paid result instead. No connection → the QR is blurred and buttons wait; the screen asks again when the connection returns. |
| W-25 | Shopper leaves a pending RDB payment and later changes the bag → "You have a payment in progress" with "Continue payment" (reopens the same request) and "Cancel payment". The sheet asks the backend every 4 s and unlocks the bag when the request ends. |
| W-26 | Success screen → "Done / Back To HomePage" clears the order state and the local bag and goes home. |
| W-27 | The checkout sends **no prices** to the backend. Only `address_id` and the payment method go in the request; the backend prices the order. |

### Open blockers (3)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-11 | Every cash, card and crypto order sends the fixed text `order_note=order note`. There is no note field. Send an empty note, or build a real note field. The test `orderClass.test.ts:116` expects the wrong text and must change with the fix. | Frontend | `services/order.ts:78` |
| A4-9 | The old Google Maps key is in git history. Ops must rotate it, restrict it by HTTP referrer, and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel. | Ops | `utils/mapsConfig.ts` |
| A5-3 | Card and crypto show at checkout, but there is no proof of a real payment gateway. No test pays by card or crypto. Blocks if the backend offers them at launch. If not, the backend must leave them out of `available_payment_method`. **Product decides** if they are offered. | Backend + Product | `services/order.ts:96-104`, `components/Cart/ModalIframe.tsx:60-130` |

## 08. Orders & returns

### Working cases (29)

| # | Case |
|---|---|
| W-1 | Signed-in shopper opens Settings → the Orders card shows the number of order groups. A guest who taps it gets the sign-in sheet. |
| W-2 | Shopper opens the orders list → sees order cards (date, group id, status, item count, total, product photos), 10 per page. |
| W-3 | Shopper scrolls to the end → the next page loads. At the end the list says "No more orders". |
| W-4 | Shopper taps a status tab ("All", plus the statuses the backend sends in `starting_setting.order_group_statuses`) → the list reloads with only that status. |
| W-5 | Order totals on the list and on the details page use the currency the shopper paid with (`order.currency`), not today's shop currency. |
| W-6 | Shopper opens an order → sees group number, date, total with the payment-method icon, group status, one tab per pack, pack status and delivery address. |
| W-7 | Shopper opens a wrong or foreign order id → sees "Order Not Found" and a "Go to My Orders" button. |
| W-8 | Shopper taps a pack tab → the page shows that pack's products and status. |
| W-9 | Shopper expands the product list → each line shows colour, size, quantity, price and status (cancelled / return requested / returned quantity). Each line links to the product page with the bought colour and size. |
| W-10 | Shopper sees an expected delivery date: order date + the longest product `shipping_days` + `shipping_duration_days` from settings. |
| W-11 | Shopper changes the delivery address (pack menu → "Change Delivery Address & Note", only when `can_update_address`) → picks or edits an address, ticks the terms, confirms → the order reloads with the new address. A refusal keeps the sheet open. |
| W-12 | Shopper cancels a whole pack (pack menu → "Cancel This Pack", only when `can_cancele_order`) → picks at least one reason, ticks the terms, taps "I Agree & Cancel" → the backend cancels the pack and the page reloads. |
| W-13 | Shopper cancels one product line (product menu → "Cancel This Product", only when `can_cancele_order` and qty > 0) → confirms → the backend cancels the line and the page reloads. |
| W-14 | Shopper lowers the quantity of a line (product menu → "Change Product Request" → "Change Qty") → the app cancels the extra pieces through the same cancel-item call. |
| W-15 | Shopper changes the colour or size of a line before delivery (only when `can_change_variant`) → the app refuses options with too little stock → shopper confirms → the app sends the request and reloads the page. |
| W-16 | Shopper hides a pack (pack menu → "Hide This Pack" → confirm) → the app leaves the details page for the orders list. |
| W-17 | Shopper hides one product → stays on the page. If it was the only product of the only pack, the app warns that the whole order hides, then leaves for the list. |
| W-18 | Shopper opens "Hidden Orders" from the list menu → sees hidden packs (dimmed) and visible packs with hidden products. The browser back button returns to the list. |
| W-19 | Shopper restores a hidden pack or a hidden product (eye button → confirm) → the hidden list reloads. |
| W-20 | Shopper reports a delivered product (product menu → "Report This Product") → ticks points in 4 groups, writes a note, adds one photo (jpeg/png/webp, max 4 MB) → submits → sees a success message. The line then shows "We received your report". |
| W-21 | Shopper rates a delivered product → picks stars, writes a comment, adds up to 5 photos → the review is saved. Each line shows the stars of an earlier review. Editing an existing review updates it. |
| W-22 | Shopper starts a return of a delivered product (product menu → "Return This Product", only when `can_return_order`) → the app creates a draft return request → shopper picks a reason from the backend list (a reason with a cost shows the cost), the number of pieces, and at least one photo → confirms. |
| W-23 | Shopper edits a product already in a draft return (reason, pieces, new photos), or removes a saved photo. |
| W-24 | Shopper taps "Confirm Return Request" → the app confirms all draft requests of the group and reloads the page. |
| W-25 | Shopper taps "Cancel Return Request" under the product list → the app cancels every return request of the group and reloads the page. |
| W-26 | Shopper follows a return → each returned line shows its step (requested, approved, out for return, returned, resolved, cancelled, rejected) and the refund amount in the paid currency. |
| W-27 | Shopper chats with the delivery worker while a pack is `out_for_delivery` or its return is `out_for_return` → a chat icon opens the chat (existing channel or a new one). |
| W-28 | A push about a delivery-worker message opens the order page with `?chat_id=`, or opens the chat in a tab that is already open. |
| W-29 | A refused write (cancel, hide, report, change address, return) shows the backend's error text as a toast and keeps the sheet open. |

### Open blockers (2)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-16 | Fixed promises that nobody confirmed: "refund within 12 hours", "no fees", "cancel in 3 hours", "collection within 1 day", and a 3-hour countdown that starts again on every page load. **Product decides:** confirm the real values or remove the text. | Product + Frontend | `OrderCancelConfirmationWindow.tsx:64, 67`, `CancelOrderItemConfirmationWindow.tsx:66, 69`, `OrderItemReturnConfirmationWindow.tsx:199`, `OrderItemOptions.tsx:285`, `OrderRetailsReturnInfo.tsx:59, 251, 253` |
| A2-17 | The refund text says "Back to your wallet", but the wallet is not usable. The refund destination must be true at launch. | Product + Backend | `OrderDetailsWrapper.tsx:1374`, `OrderRetailsReturnInfo.tsx:71` |

## 09. Wallet & banking

### Working cases (7)

| # | Case |
|---|---|
| W-1 | Shopper signs in with a one-time code → the server also signs in to the wallet with the code's id token and the merchant API key → the wallet token goes into an HttpOnly cookie, and the wallet user into the `WALLET_USER` cookie. |
| W-2 | The wallet backend refuses or times out (10 s) at sign-in → the shopper is still signed in to the shop. The route names the failure `endpoint: "WALLET"` in `is_failed` and sends it to Sentry. |
| W-3 | Right after sign-in, the app checks the shopper's wallet accounts. If the check fails, the app creates a `MAIN` wallet. A 401 creates nothing. |
| W-4 | Signed-in shopper opens Settings → the wallet card shows the balance in the country's currency, with its symbol and decimals. |
| W-5 | The balance call throws (for example, the country's currency is not in the wallet) → the card shows `--` and a "Retry" button. Click, Enter or Space loads it again. |
| W-6 | A guest taps the wallet card → the sign-in sheet opens. |
| W-7 | Sign-out, an expired session, or a new guest device → the app deletes the wallet token and the `WALLET_USER` cookie. |

### Open blockers (6)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-6 | The wallet sheet is a placeholder that says "Under Development". The RDB widget is commented out. **Product decides:** hide the wallet card or finish it. | Product + Frontend | `components/setting/WalletLinkCard.tsx:100-121` |
| A2-7 | The `rdb` package is gone from `package.json`. `services/RDB/index.ts` and `serverActions.ts` are fully commented out. The wallet widget has nothing to run on. | Frontend | `services/RDB/index.ts`, `services/RDB/serverActions.ts` |
| A2-8 | "Bank Cards" in the profile menu opens a page with only a back bar. Hide the link or build the page. | Product + Frontend | `settings/profile/page.tsx:38-43`, `settings/profile/Bank-Cards/page.tsx:18-30` |
| A1-13 | `/api/auth/wallet-token` hands the raw wallet token to browser JavaScript. `WalletLinkCard` calls it on every sheet open, and nothing uses the token while the widget is off. Tokens must stay in HttpOnly cookies. | Frontend | `app/api/auth/wallet-token/route.ts`, `components/setting/WalletLinkCard.tsx:69-74` |
| A5-1 | The wallet backend answers `502` on sign-in. e2e AUTH-01 stays red on purpose. First check if our app causes it: the body sends the e-mail as the text `"undefined"`, and `lastName` takes only the second word. | Backend (Frontend checks first) | wallet `POST /auth/phone/login-with-id-token`, `app/api/auth/login/route.ts:283-285` |
| A2-17 | The refund text says "Back to your wallet", but the wallet is not usable. Same item as section 08. | Product + Backend | `OrderDetailsWrapper.tsx:1374`, `OrderRetailsReturnInfo.tsx:71` |

## 10. Sign-in & session

### Working cases (28)

| # | Case |
|---|---|
| W-1 | First visit with no cookies → a guest account is made, and the shopper can act at once |
| W-2 | A gated action opens the sign-in overlay; browser Back closes it (`?login=true` history entry) |
| W-3 | "I already have an account" → phone screen (sign-in path) |
| W-4 | "Create new account" → Terms → "Agree & Continue" → phone screen |
| W-5 | "Later, take a look" closes the overlay and sends a GA event |
| W-6 | Choose SMS or WhatsApp → the code is sent → the PIN screen opens |
| W-7 | Too many sends → the send is refused, and the screen shows a live countdown |
| W-8 | A script that posts `send_otp` through `/api/proxy` is refused. Only the server action can send. |
| W-9 | "Resend code" after the countdown → a new code is sent, and the wrong-code counter resets |
| W-10 | Correct code → the shopper is signed in. All tokens go into HttpOnly cookies. The page and the story rail refresh. |
| W-11 | Wrong code → "Tries left: N". After 3 wrong codes → "Too many wrong codes. Ask for a new code." A server or network error does not spend a try. |
| W-12 | Sign-up with a number that already has a named account → "Already registered" screen → "Log in" → success |
| W-13 | Sign-in with an unknown number → "Not found" screen → "Create account" → name screen |
| W-14 | New account → name screen → the name is saved → the overlay closes |
| W-15 | Existing account with a name → success screen → the overlay closes |
| W-16 | A signed-in shopper reloads the page → still signed in |
| W-17 | Market token expired (60 s on staging) → one renewal → the same call is sent again and succeeds. Parallel 401s share one renewal. A call sent before the last renewal just retries. |
| W-18 | Chat, stories or comments token expired → that service's own pair is renewed, wait 2 s, retry |
| W-19 | A server-rendered call gets a market 401 → renewal and retry. No refresh cookie and not verified → a guest is made. |
| W-20 | A guest's renewal is refused → one last renewal try → else every token is deleted and a new guest is made, with no prompt |
| W-21 | A verified shopper's renewal is refused → new guest + "Session expired" prompt. "Login" opens the verify widget with the old phone filled and locked → code → back in the account. "Continue as guest" reloads (seller pages go home). |
| W-22 | Chat, stories or comments renewal refused → only that service's tokens are cleared → phone re-verify widget → code → the waiting call is retried |
| W-23 | The seller dashboard session dies → prompt. "Continue as guest" sends the seller to the store home. |
| W-24 | "Logout" in the avatar menu → in-flight calls stop → every secure cookie is deleted → the push token is detached from the account after the reply → local data and the PostHog identity are cleared → reload (home from `/seller` or `/settings`) |
| W-25 | A late 401 during sign-out cannot bring the session back (30 s logout guard cookie) |
| W-26 | "Logout" shows only for a shopper with a phone, and it appears as soon as the profile loads |
| W-27 | The app reads the signed-in profile, and no token reaches page scripts |
| W-28 | Profile changes are copied into the HttpOnly profile cookies. A re-auth payload also refreshes the chat and stories token cookies. |

### Open blockers (2)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-5 | QR login is a `localStorage` mock with no backend. "Scan QR Code" is on the first login screen and on the profile card. "Approve" closes as if it worked. **Product decides:** remove it or build it. Until then, hide both entry points. | Product + Frontend | `services/qrLogin/index.ts:3`, `screens/GetStartedScreen.tsx:27`, `FullEnhancedLoginWidget.tsx:511`, `components/setting/profile/index.tsx:73-86` |
| A5-1 | The wallet backend answers `502` on sign-in. Same item as section 09. Blocks if the wallet ships at launch. | Backend (Frontend checks first) | wallet `POST /auth/phone/login-with-id-token`, `app/api/auth/login/route.ts:283-285` |

## 11. Profile & settings

### Working cases (26)

| # | Case |
|---|---|
| W-1 | Avatar menu → "Settings" → the settings hub opens |
| W-2 | Signed-in shopper sees name, phone (international format), photo and a "Verified" badge on the profile card; tap → `/settings/profile` |
| W-3 | A guest sees "Login" on the profile card; tap → the sign-in overlay |
| W-4 | "Verify Now" on the card: a stored phone → verify widget; no phone → sign-in overlay |
| W-5 | Signed-in shopper with no shop → "Become A Seller At Trydos" → the modal reads the shopper's request and shows the form, "pending", "rejected" (with the reason) or "approved" |
| W-6 | Become-seller form → every field is checked inline → at least 1 document (image or PDF) is uploaded → submit → "Request submitted successfully" → the status is read again |
| W-7 | Submit says "phone is not verified" → the verify widget opens → after the code the request is sent once more; "already exists" → the status screen |
| W-8 | Shopper who owns a shop → black "Sales" card → `/sellerProfile` |
| W-9 | The shop lookup fails → "Failed to load permissions" with a "Retry" button |
| W-10 | Orders card and wallet card open their own pages; a guest gets the sign-in overlay (pages covered in other files) |
| W-11 | Option list: "Settings" → `/settings/prefferences`, "My Checklist" → `/settings/checklist`, "Terms & Conditions" → `/terms-of-service` |
| W-12 | Country button → country list (cached per session) → pick → confirm modal ("Current" / "New") → locale cookie written, starter settings fetched → reload to `/{new country}-{lang}/settings` |
| W-13 | Language button → list from the core backend → pick → "Save" → cookie written → reload under the new language |
| W-14 | Profile page shows the photo ("Change Photo" / "Add Photo") and links to Personal Info, Size and Address |
| W-15 | Personal Info: edit name, e-mail, gender, alternative phone → checks run → only changed fields are sent → stories, then chat, then core → cookies and store updated → back to the profile page |
| W-16 | A save that one backend refuses → earlier backends are rolled back → the backend's field error appears under the right input, and the shopper is told only once |
| W-17 | Change phone: new number → confirmation → code sent to the new number → code checked → profile saved with the returned `id_token` |
| W-18 | Size: height 110–250 cm and weight 40–180 kg (Arabic digits accepted) → save → back to the profile page |
| W-19 | Picture: choose from the library or take a photo → crop → upload → saved on the account → back to the profile page |
| W-20 | "Remove Photo" → `image: null` is saved, and the app stops showing the old photo |
| W-21 | A refused photo upload → "File upload failed." and nothing is saved |
| W-22 | Address list loads; add (region picker + map) → saved; edit → saved; delete with a confirm dialog → removed |
| W-23 | Preferences: subscribed and unsubscribed topics load; "Subscribe" / "Unsubscribe" move a topic |
| W-24 | E-mail / push / WhatsApp switches and the daily / weekly / monthly select save at once; a refused save puts the old value back |
| W-25 | Avatar menu: "Notifications" opens the panel, "Compare" opens `/compare`, "Logout" for signed-in shoppers |
| W-26 | A guest who taps anything on Personal Info or Picture gets the sign-in overlay instead |

### Open blockers (2)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A2-8 | "Bank Cards" opens an empty page. Same item as section 09. | Product + Frontend | `settings/profile/page.tsx:38-43`, `settings/profile/Bank-Cards/page.tsx:18-30` |
| A2-5 | The QR icon on the profile card opens the QR login mock. Same item as section 10. | Product + Frontend | `components/setting/profile/index.tsx:73-86` |

## 12. Chat & calls

### Working cases (52)

| # | Case |
|---|---|
| W-1 | Verified shopper with notifications allowed taps the chat icon → chat window opens and loads chats, contacts and calls |
| W-2 | Guest taps the chat icon → login opens. Signed-in shopper with no chat account → phone verify opens |
| W-3 | Notifications not asked yet → the app asks first. Notifications denied → the chat stays shut and a toast says why |
| W-4 | Top-bar icon and Chats tab show how many chats have unread messages |
| W-5 | Chat list: pinned chats first, then newest. Archived chats left out. Skeleton while loading |
| W-6 | Scroll to the end of the chat list → the next page of chats loads |
| W-7 | Type in the list search → matching chats and other users (by name or phone) appear. Tap one → it opens |
| W-8 | Contacts tab → saved contacts, one row per person. Tap a contact → the existing chat opens, or a new empty chat starts |
| W-9 | Add a contact by hand → saved, and the list refreshes. A number already saved is flagged with the saved name |
| W-10 | Send a text (Enter or send button) → the bubble shows at once as "sending", then becomes the saved message |
| W-11 | Chat backend refuses a send with an error status → the bubble is taken back and a toast says "Failed to send message" |
| W-12 | First message to a person with no chat yet → the backend creates the chat, and the list shows it with the real name |
| W-13 | Send a photo → crop → preview → upload to the media server → message sent |
| W-14 | Send a video or any file → it uploads, with a cancel button on the bubble. A file over 25 MB, or a video format no browser plays, is refused before upload |
| W-15 | Record a voice note → cancel it, or send it → uploaded and sent |
| W-16 | Camera → take a photo or record a video (up to 59 s), switch front/back camera → preview → send |
| W-17 | Tap an image or video → full-screen preview. Tap a file → download |
| W-18 | Reply to a message (menu or swipe) → the reply carries the quote. Tap a quote → the chat jumps to it, and loads older messages when needed |
| W-19 | Edit my own text message → saved; both sides see the new text and the "edited" mark. A refused edit keeps the old text and shows a toast |
| W-20 | Delete a message for me, or for everyone (writer only) |
| W-21 | Forward a text, image, voice, video, file or product message to another chat |
| W-22 | Copy a text message |
| W-23 | Tag a message (suggested or free text), then remove the tag |
| W-24 | Set, move or cancel a reminder on a message. The Reminders folder lists them and opens the chat at the message. A due reminder shows a toast |
| W-25 | The other person types, records or picks a file → a status ("Typing..." and others) shows in the header and in the list |
| W-26 | Read receipts: opening a chat sends `/watched`, a received message sends `/received`, and the sender's ticks update from the push |
| W-27 | Header shows "Online" or "last seen …" for the other person |
| W-28 | Scroll to the top of a conversation → older messages load, and the view keeps its place |
| W-29 | Search inside a chat → jumps to the newest match first. Arrows walk to older and newer matches. A match outside the loaded window is loaded first |
| W-30 | Chat details: photo gallery and media/files, copy the phone number, call / video / search shortcuts |
| W-31 | Pin and unpin a chat |
| W-32 | Mute and unmute a chat → a muted chat shows no message toast and does not ring on a call |
| W-33 | Mark a chat unread, then read |
| W-34 | Archive and unarchive a chat. The Archived folder lists archived chats |
| W-35 | Delete a chat (with a confirm box) → it is gone for me; the other person keeps it |
| W-36 | Block and unblock a person → the input is replaced by "You cannot send messages or calls to this user", and the call buttons refuse |
| W-37 | A message arrives while the chat window is closed → a toast with sender, preview and picture. The list updates |
| W-38 | The other side edits, tags or deletes for everyone → my copy updates. This also works for compact pushes that carry only ids |
| W-39 | Product page → Share → pick contacts → the product goes out as a chat message, and a toast says "Product is Shared Successfully" |
| W-40 | Tap a shared product bubble → its menu opens and leads to the product |
| W-41 | Order page → chat icon → the chat with the delivery worker opens, or a new one starts. Text, media and voice calls work as in a normal chat |
| W-42 | An order-chat message arrives while that chat is closed → a toast plus a red dot on the order |
| W-43 | Start a voice call → mic permission, old calls ended, `/voice_call`, Agora join. Timer, mute and end work. The call ends by itself after 60 s with no answer. Warning at 5 min, hard end at 10 min |
| W-44 | Start a video call → camera + mic, the same flow, camera on/off, switch camera |
| W-45 | Incoming call → a bar with the caller and a ring tone. Answer → `agora_token` + `answer_call` → call screen. Decline → `end_call` + `refuse_call` |
| W-46 | The call was already answered on another device → "Call Answered from another account", and the bar closes |
| W-47 | A second call arrives during a call → the app tells the backend (`in_another_call`), and the caller sees "User In Another Call" |
| W-48 | The other side hangs up or refuses → my call screen closes |
| W-49 | Calls tab → call history, newest first, more on scroll, delete one entry, badge for missed calls |
| W-50 | Call bubbles in the conversation show missed / incoming / outgoing and the duration |
| W-51 | Stories tab → a paged list of people's stories. Tap → the story viewer opens |
| W-52 | Chat token expired → exchange, wait 2 s, retry, and the list loads. Exchange refused → chat cookies cleared, and phone verify is asked |

### Open blockers (2)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A1-11 | The mobile-app call page leaks the chat token. The token sits in the URL. A "DEBUG" button copies it and shows it in an `alert`. The error panel prints it, and `LogError` sends it to Sentry. Remove the debug button and the panel, stop sending the token to Sentry, and move the token out of the URL (or agree a short-lived call-only token with the backend and mobile teams). | Frontend + Mobile | `components/global/WebviewCall.tsx:150, 190, 249, 312-336` |
| A2-19 | The invite text is hardcoded English; Frontend translates the text. The Play Store link is fixed 2026-10-29 (`NEXT_PUBLIC_PLAY_STORE_URL`, BUG-chat-8). | Frontend | `components/Chat/components/SearchResult.tsx` |

## 13. Stories

### Working cases (29)

| # | Case |
|---|---|
| W-1 | Open the home page → a skeleton shows, then the story tiles of page 1 |
| W-2 | Scroll the bar to the end → the next page loads and is added |
| W-3 | A tile shows the first story the shopper has not seen; the ring turns grey when all are seen; the shopper's own tile shows their newest story |
| W-4 | Tap a tile → the viewer opens full screen on that author's first unseen story |
| W-5 | Watch → a progress bar runs (photo 5 s, video = its length); tap the right or left half → next or previous story; end of an author → next author; after the last author the viewer closes |
| W-6 | Swipe sideways → the cube turns to the next author; swipe down or tap X → the viewer closes |
| W-7 | The story pauses while the delete dialog, the report sheet or a sign-in prompt is open, and goes on from the same point |
| W-8 | Watch a story → the ring greys at once for every viewer; a signed-in viewer with a stories account also reports the view, once per story |
| W-9 | Tap "View More" on a story with a link → the link opens in a new tab (`https://` added when missing) |
| W-10 | Tap "View Product" on a product story → the viewer closes and the product page opens |
| W-11 | Tap "+" → no phone: login opens; no real name: the name form opens; no stories account: the re-auth prompt opens; otherwise the add-story sheet opens. The "+" tile shows only when `is_allowed_to_upload_story` is 1 |
| W-12 | Pick a photo from the gallery → crop it → add an optional link → "Share Story" → "Story Uploaded", and the new story is in the bar |
| W-13 | Take a photo with the in-app camera (front/back switch) → crop → share |
| W-14 | Pick a video (up to 10 MB and 59 s) from the gallery on a desktop or Android browser → it uploads |
| W-15 | Bad input is refused with a message: an SVG, a file over 10 MB, a video over 59 s, a link that is not a URL |
| W-16 | Own story → trash icon → confirm → the story leaves the viewer and the bar, "Story deleted successfully."; on a refusal the story stays and the backend's message shows |
| W-17 | Another person's story → flag icon → pick reasons (6) and/or write details (500 characters) → "Story reported successfully."; on a refusal the sheet stays open with the choices kept |
| W-18 | Product page → "Product Story" row (only when the product has stories) → tap → the viewer opens over the product page; more stories load on scroll; the home bar gets its list back on close |
| W-19 | Chat window → "Stories" tab → a list of authors with paging → tap a row → the viewer opens |
| W-20 | A QA story (link host `qa-test.trydos.tech`) never reaches a normal shopper or a guest; only phones listed in `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` see it. The filter runs in every reader: bar, paging, sign-in, chat tab, product row, server reader |
| W-21 | A stories call answers 401 → the client renews the stories token, waits 2 s and sends the call again (the normal path, not a bug) |
| W-22 | A story author with no name is shown as "Unknown" (translated) on the home bubble, in the viewer header and in the chat Stories tab — never by their phone number. |
| W-23 | In-app video recording uses a type the browser can record: WebM where it works, MP4 otherwise (Safari before 18.4). The shared file has the matching type and name (`.webm` or `.mp4`). |
| W-24 | A browser with no `MediaRecorder` → the red timer does not start, and the shopper sees "Not Supported". |
| W-25 | The product-page story row shows for a signed-in shopper even when their stories token has expired. On staging, `product_stories` answers 200 with no token and with a bad token, so it is a public read and the token does not matter. |
| W-26 | No open cache route for stories. |
| W-27 | The stories request fails → the bar shows no tiles (only the "+" tile), not an endless skeleton, and no error message. A dead stories service does not stop browsing. |
| W-28 | After an upload, the bar keeps the people from the later pages the shopper already loaded, and the shopper's own tile shows the new story. |
| W-29 | The product story row keeps loading while the backend has another page, even when the QA filter made a page short. It stops when the backend has no next page. |

### Open blockers (0)

No open launch blockers.

## 14. Notifications

### Working cases (18)

| # | Case |
|---|---|
| W-1 | Signed-in shopper taps chat while permission is "default" → the "Stay in the loop" card opens; "Allow" → the browser prompt; "Not now" or Escape → the card closes |
| W-2 | After a phone sign-in → the app checks the permission: granted → push starts; denied → "Notification is Denied" toast; default → the card |
| W-3 | The browser has no push support → "Notifications Not Supported" card with "Got it" |
| W-4 | Permission denied in the browser → error toast "Notification is Blocked in This Browser…"; chat stays shut |
| W-5 | "Allow" granted → the service worker registers, the push token is made, and it is registered with the market backend and the chat backend; the token is renewed when older than 24 h |
| W-6 | Each page load of a signed-in shopper with permission granted → push starts again silently |
| W-7 | The shopper changes country or language → the device's push topics move to the new pair, and the saved settings come back |
| W-8 | The network comes back and the token changed → the new token is registered again and every tracked topic is subscribed again |
| W-9 | Site open, an order or product push arrives → a toast with a link: order status → order page; order placed → order page, the cart is read again; product availability / discount / comment / price change / stock → product page; boutique or category created → filtered listing; cart expiration → cart |
| W-10 | Site open, a chat message or call push arrives → a chat toast (one per channel) or the call screen; a muted chat shows no message toast, but a call still rings |
| W-11 | Site closed or in the background → a system notification for market types, chat messages and calls; one card per product and per order (tags); a tap opens the right page in the shopper's locale |
| W-12 | Any part of the app shows a success, error or chat toast → it shows on top, closes by itself (10 s default) or by its X |
| W-13 | Menu → "Notifications" → the panel loads page 1, loads more on scroll, says "No more notifications" at the end, and reloads when a new market push arrives; a tap on an item opens the boutique, product, category or order |
| W-14 | Settings → preferences → enabled and disabled topics are listed; "Unsubscribe" / "Subscribe" moves a topic |
| W-15 | Same screen → email / push / WhatsApp switches and the frequency list (daily, weekly, monthly) save at once and go back if the save fails |
| W-16 | Product page → "Notify Me About The Product When…" → a topic turns on only after the backend confirms; with no push token the shopper is told to allow notifications |
| W-17 | Seller opens the dashboard orders → the device joins the shop's order topics; a new order appears in the list live (see the seller file) |
| W-18 | Log out → the push token goes to `/api/auth/logout` to be detached from the account, and the device's push subscription is removed |

### Open blockers (0)

No open launch blockers.

## 15. Seller dashboard — catalog

### Working cases (44)

| # | Case |
|---|---|
| W-1 | Seller opens the Products tab → grid of the shop's products: image, category, name, price with the shop currency, stock badge (out of stock / low / in stock), Active / Inactive badge. |
| W-2 | Seller pages through products with Prev / Next. |
| W-3 | Seller returns from an editor → the list is fetched again, so a new or edited product shows its new values. A failed fetch is tried again on the next arrival. |
| W-4 | Shop with no products → "No products found" plus "Add your first product" and "Add with AI" (only with `CREATE_PRODUCT`). The empty message never shows before the answer arrives. |
| W-5 | Products list fails → error message with Retry. A failed permission list shows an error, not a false "no permission". |
| W-6 | Seller without any product permission → the tile and menu entry are hidden; a direct `?tab=products` link shows "You don't have permission to view products". |
| W-7 | Seller taps a product card → the editor loads the product and every lookup list, in view mode. "Edit" shows only with `UPDATE_PRODUCT`; otherwise "View only". |
| W-8 | The editor waits for shop info. Without `READ_SHOP_INFO` it says the permission is missing (no useless retry). If shop info failed, it offers Retry. |
| W-9 | Seller creates a product: `.../products/new` → empty form in edit mode → Create → validation → confirm dialog with the list of changes → save → "Product created successfully." → the new product's page opens. |
| W-10 | Seller edits a product: Edit → change fields → Save Changes → the confirm dialog lists every change → save → view mode. Banners show the "pending admin approval", "changes were denied" and "submitted" states. |
| W-11 | The form checks before any request: name, unit, brand, Seller Product ID, location, origin country, weight, count of pieces, stock, unit price, discount below unit price, luck price limit, max 3 labels, an image for every colour. The page scrolls to the first error. |
| W-12 | Seller types a Seller Product ID that the shop already uses → message at once, save blocked. |
| W-13 | The backend refuses a save → its message goes on the matching field. Messages that fit no field show in a banner (max 5, then a count). |
| W-14 | Seller picks categories → sub-categories, sub-sub-categories and attribute groups load for every selected branch. Stale picks are removed. A failed branch keeps the saved picks. An old answer cannot overwrite a newer one. |
| W-15 | Seller sets attribute (descriptor) values on an existing product: free text for `string`, a number for `numeric`, chips for `string_choice` / `numeric_choice` (options arrive as a JSON string). They are saved only when they changed. On failure the form rolls back and says so. |
| W-16 | Seller builds variants: colours × sizes, each row with price, discount, luck price, quantity, SKU, barcode and location. |
| W-17 | Seller adds product images from the device (media server bulk upload) or from the shop gallery (with `READ_PRODUCT_IMAGES`), and links images to colours. |
| W-18 | SEO: seller sets meta title, meta description and meta image (upload or gallery). |
| W-19 | Translations (custom data): a default language, then name, description and similar words per language (en / ar / tr / ku). On edit, each row is sent with its own id. |
| W-20 | Countries: origin country, restricted countries and an extra price per country. Also labels (max 3) and tags. |
| W-21 | Seller uploads or removes a product video (edit screen). |
| W-22 | Seller with `CHANGE_PRODUCT_STATUS` presses "Allow Purchase" / "Disable" → dialog → the status changes. When the backend refuses (422), the dialog lists its reasons. |
| W-23 | Seller not approved for new products → every price except Purchase Price is hidden and not required. |
| W-24 | Money inputs refuse more decimal digits than the shop currency allows, with a short tooltip. |
| W-25 | "Add with AI": seller picks one JPEG / PNG / WebP photo → three steps show (choose, upload, analyze) → the photo goes to the media server → the AI route answers → the create form opens filled (name, description, similar words, meta title and description, brand, three category levels, photo as image and meta image), in the seller's page language. A message asks the seller to check the values. Nothing is saved until the seller presses Create. |
| W-26 | AI route safety: it needs the market cookie. It checks shop membership and `CREATE_PRODUCT` / `SUPER_ADMIN` on the core backend. It accepts only a bare file name from our media host (max 7 MB). It allows 10 calls per minute per shop (Redis). Every returned brand or category id must be one it sent, and the three levels must fit together. The Gemini key travels only in a header. |
| W-27 | AI failures are named: 401 / 403 no permission, 422 bad image, 429 too many, 503 AI busy (also when Redis is down), 500 analysis failed. The dialog lets the seller try again. |
| W-28 | Seller opens the Boutiques tab → cards with icon, name, Active / Inactive, description and slug. Empty state with "Add your first boutique" (`CREATE_BUTIKS`). Error with Retry. |
| W-29 | Seller edits a boutique: languages come from `/languages` (a built-in list if that call fails). Per language: name, description, icon and banners. Copy a field from another language. Banner size warning, one file at a time. Availability (Web / Mobile / both). Restricted countries. Save. |
| W-30 | Seller with `CHANGE_BOUTIQUE_STATUS` sets a boutique active or inactive while editing. If the status call is refused, the edits stay saved, the status goes back, and the reasons are listed. |
| W-31 | Seller creates a boutique → body with `boutique_custom_data` → the new boutique's page opens. |
| W-32 | Gallery tab (`READ_PRODUCT_IMAGES`): 60 images per page, Prev / Next, large preview, copy URL. |
| W-33 | Gallery upload (`UPLOAD_PRODUCT_IMAGES`): choose files, a folder, or drag and drop → preview → confirm → media server → saved to the shop → page 1 reloads. |
| W-34 | Gallery delete (`DELETE_PRODUCT_IMAGES`): one image with a confirm, or many in select mode. The page steps back when its last image goes. |
| W-35 | Excel tab (`CREATE_PRODUCT` or `UPDATE_PRODUCT`): searchable category picker, "only categories that have my products", and the last choice is remembered per shop. |
| W-36 | Seller downloads an empty template ("Add new products") or a sheet of own products ("Update my products"). The file streams through `/api/proxy`, with one session renewal on a 401. |
| W-37 | Seller uploads a filled sheet (.xlsx / .xls / .xlsm / .xlsb) → media server → processing request. If the sheet belongs to another category, the seller is asked. Yes sends it again with `confirm_category`; No imports nothing. |
| W-38 | Uploaded-files table: a status badge per file, Notes, Refresh, and a "failed rows" download (with a Reason column). |
| W-39 | Back from any editor returns to the same dashboard tab. |
| W-40 | The form refuses a purchase price at or above the selling price: above the unit price, or at or above the discount price when one is set. A negative purchase price is refused too. A selling price that already has its own error keeps that message. |
| W-41 | After an Excel upload, the message says "processed" only when the shop backend no longer lists a sheet as `uploaded` or `processing`. Otherwise it says the sheet is still being processed. |
| W-42 | While a sheet is still processing after an upload, the table reads the backend again every 3 s, for at most 10 minutes. It stops when no sheet is processing. |
| W-43 | The Products badge in the side menu shows the shop total from the backend (`meta.total`), not the number on one page. |
| W-44 | The catalog editor has no hidden "Save Draft" / "Load Draft" handlers, no unused image service methods, and no comment that calls the real Excel upload a "dummy". |

### Open blockers (0)

No open launch blockers.

## 16. Seller dashboard — operations

### Working cases (36)

| # | Case |
|---|---|
| W-1 | Signed-in user opens Settings → the "Sales" card shows only when the user has shops; it opens `/sellerProfile`. A user with no shops sees "Become A Seller At Trydos" (opens `BecomeSellerModal`). A failed check shows an error with retry. |
| W-2 | Server guard on every `/sellerProfile` page: a user the backend confirms (200 / 403) has no shops is sent to the home page before any HTML. A 401 or 5xx does not bounce a real seller. |
| W-3 | Per-shop guard: opening a `sellerId` the user is not a member of sends them home. The same answer decides if `GET /shop/info` may be called (`READ_SHOP_INFO`). |
| W-4 | Shop list: placeholders first, then one card per shop with logo or monogram, name, seller id, role ("Super Admin", the role name, or "Member"), permission count and "Enter Dashboard". A failed list shows an error with retry, never "No shops available". |
| W-5 | Leave a shop from the list: confirm dialog → the shop leaves the list and this device stops getting the shop's order pushes; a refusal shows the backend message. The button is disabled for the master shop (`is_master = 1`). |
| W-6 | Dashboard home: a tile per section the user may open; a tile writes `?tab=` into the URL; Back goes to home, then to the shop list. |
| W-7 | Slide-out menu: the same sections, with count badges for products, boutiques and active carts; closes on overlay, Escape, outside click or its button. |
| W-8 | Permission gating: permissions come from the shop list, or are fetched on a direct link. Every section waits (placeholder) until they are known, shows the load error with retry when the fetch failed, and says "Access Denied" with the missing right when it is missing. No tab ever shows an empty white panel. |
| W-9 | Header shows the shop logo, name, role and seller id; it updates at once after a Shop Info save. |
| W-10 | Product cards show reactions, questions, reviews and shares. The counts load in batches from Elasticsearch through a server action that checks `READ_COMMENTS` on the core backend; "—" shows until they arrive; a refused batch is tried again later. A member without `READ_COMMENTS` sees "Comment counts need the comments permission" instead, and nothing is asked. |
| W-11 | Orders tab: order list with filter tabs All / In Progress / Collected / Returned / Cancelled, more orders load on scroll, tap an order → detail screen. |
| W-12 | Seller taps "Confirm & Start Packing" on a waiting item → item is confirmed. |
| W-13 | Seller taps "Packed" on a confirmed item → item is packed. |
| W-14 | Seller taps "Cancel" on a waiting item → a confirm dialog says the whole quantity goes and the buyer will be told → the item is cancelled. A refusal shows the backend reason. |
| W-15 | A member with any order permission who opens the Orders tab is subscribed once to the shop's order push topics; a new order or order change arrives as a push → the open Orders tab reloads page 1. The subscription is removed when the member leaves the shop, loses every order permission, or (after being removed) next opens the shop list or Settings on that device. Logout tears down push delivery for the whole device. |
| W-16 | "Orders" button on a product card (`READ_ORDERS`) → modal with this product's orders, status filter and pages. A network failure shows an error with retry. |
| W-17 | Carts tab (`READ_CARTS`): active carts and old carts load together, each with pages. Tap an active cart → its lines; tap an old cart → that customer's old lines. Customer names are masked. A refused or failed call (backend refusal or network failure) shows an error with retry, not an empty list. |
| W-18 | "Carts" button on a product card → modal with every open cart line for this product. |
| W-19 | Locations tab (`READ_LOCATIONS`): list with an Active / Inactive filter and pages. |
| W-20 | Create a location (`CREATE_LOCATION`): form with country list and a Google Maps point picker; the form refuses bad values before any call. |
| W-21 | Edit a location (`UPDATE_LOCATION`) and Activate / Deactivate it (`CHANGE_LOCATION_STATUS`). |
| W-22 | Users tab, add a member (`USER_MANAGEMENT_ACCESS` or `SUPER_ADMIN`): by phone number and role (roles search, "Load more roles"); success banner; the list reloads. |
| W-23 | Users list: name, phone, role, "Load more". A member with only `READ_EMPLOYEES` sees the list read-only, with no add form and no row actions. |
| W-24 | `SUPER_ADMIN` changes a member's role (searchable role list) or deletes a member. Delete asks first ("Remove member"); the member goes only after the confirm. |
| W-25 | A member leaves the shop from their own row in the Users tab: confirm dialog → the device stops getting the shop's order pushes → back to the shop list. |
| W-26 | Permissions tab (always shown): role banner ("Super Admin" or the role name) and the user's own permissions, grouped and translated. |
| W-27 | Shop Info tab (`READ_SHOP_INFO`): form with shop name, contact, address, logo and banner. Read-only without `UPDATE_SHOP_INFO`. Required fields and a digits-only contact are checked first. A failed load shows the reason with a retry, never an empty form. |
| W-28 | Shop Info save: crop a new logo or banner → media server → `PUT /shop/info`. A picture the shop does not have is left out of the body (not `null`); a removed picture is sent as `""`. Success toast; header updates. A refused save shows the backend's own reason in the form (no browser alert). |
| W-29 | Shop info (currency, new-products approval) loads once for the whole dashboard and is never asked for without `READ_SHOP_INFO`. |
| W-30 | Stories tab (`READ_STORY`): the shop's stories with pages; link and product shown on each card. |
| W-31 | Add a story (`CREATE_STORY`): photo or video up to 10 MB, video up to 60 s, no SVG, a checked link, an optional product picked from the shop's products → media server (upload ticket) → saved. |
| W-32 | Delete a story (`DELETE_STORY`) with a confirm. |
| W-33 | Customers Comments tab (`READ_COMMENTS`): FAQ and Reviews sub-tabs with pages, cards like the product page. The server action checks membership and permission on the core backend and filters Elasticsearch by the verified shop; deleted comments are skipped. |
| W-34 | Reply (`REPLY_COMMENT`), edit a reply (`EDIT_REPLY`), delete a reply (`DELETE_REPLY`, with a confirm). Reply text loses HTML and is max 1000 characters; writes are rate-limited per shop and session. |
| W-35 | Mobile app routes for the same comments actions with a bearer token: `GET /api/seller/comments`, `POST/PUT/DELETE /api/seller/comments/reply`, `POST /api/seller/comments/social`. Same server gate. |
| W-36 | Access token expires on the dashboard → the call renews the session and tries again. If renewal is refused, the seller sees a "please login again" prompt instead of quietly becoming a guest. |

### Open blockers (0)

No open launch blockers.

## 17. Wishlist & compare

### Working cases (29)

| # | Case |
|---|---|
| W-1 | Product page → "More" → "Add To My Checklist" → the app asks whether the product is saved, then saves it. The button turns green and "Added to checklist" shows. A GA `ADD_TO_FAV` event is sent on add only. |
| W-2 | Same button on a saved product → the product is removed, the green goes away, and "Removed from checklist" shows. |
| W-3 | Open a saved product again → the "More" panel shows the checklist button green. |
| W-4 | A save or remove that the backend refuses → "Failed to update checklist". The state does not change. |
| W-5 | Avatar menu → Settings → "My Checklist" → the checklist screen loads page 1 (10 items), with a skeleton while loading. Each row shows the image and the name. |
| W-6 | A shopper with nothing saved sees "Your CheckList is empty". |
| W-7 | More than 10 saved → "Load more" appears → the next page is added; "Loading..." shows meanwhile; the button hides on the last page. `has_next` is worked out from `current_page < last_page`, because no backend sends it. |
| W-8 | Tap a checklist row → the product page opens at `/[lang]/products/{slug}`. |
| W-9 | Tap the cross on a row (or press Enter / Space on it) → the row dims with its own spinner → it is removed, and "Removed from checklist" shows. A refused remove keeps the row and shows "Failed to remove from checklist". A second tap during the remove is ignored. |
| W-10 | A guest can save and remove products. The request uses the guest's `MARKET-TOKEN` and reaches the gateway. |
| W-11 | A signed-in verified shopper saves, sees and removes a product. The request reaches the core backend. |
| W-12 | Product page → "More" → compare button → the product goes into the first free cookie slot (`f_p`, then `s_p`). The button turns green, and a toast "Added To Compare! Click To Go To Compare Page" links to `/[lang]/compare`. |
| W-13 | Both slots full → adding a third product replaces the first, and the shopper is told. |
| W-14 | Tap the green compare button again → the product leaves compare; if it was first, the second moves into first place. "Removed From Compare" shows. |
| W-15 | The compare button stays correct when the cookies change in another place: the app listens to the `compare-changed` event and to window focus. |
| W-16 | Avatar menu → "Compare" → `/[lang]/compare` opens. With nothing chosen, both columns show "-". |
| W-17 | The compare page restores the products from `?f_p=&s_p=` in the address, or from the cookies when the address names fewer than two. Each product is loaded from two market calls in parallel. |
| W-18 | Type in "Search for Product 1" or "Search for Product 2" → after 500 ms up to 10 results show → pick one → that slot fills, and the cookie and the address are updated. |
| W-19 | Tap the clear cross in a picker → that slot empties, in the table, the cookie and the address. |
| W-20 | The table shows name (link), image (link), colours, sizes, price, offer price and details. HTML details are passed through `sanitizeHtml`. The table runs right to left in Arabic and Kurdish. |
| W-21 | A product that the market backend does not know, or whose live price cannot be read → its slot is cleared and "One of the products was not found. Please try searching for a different product." shows. |
| W-22 | Both compare slots full → adding a third product replaces the first, and the message "Compare was full — replaced the first product…" shows in English, Arabic, Turkish and Kurdish. |
| W-23 | The checklist read is refused → the screen shows "Something went wrong" and a "Try again" button, not "Your CheckList is empty". "Try again" reads the list again. |
| W-24 | The shopper removes products and then taps "Load more" → every saved product is shown, none twice. The screen asks for the page that holds the first product not yet shown, and drops rows it already shows. |
| W-25 | A refused "is it saved?" read → a clear error, which the product page logs; the button shows "not saved". |
| W-26 | Each compare picker has its own search results and its own spinner. A search in one picker does not show in the other. |
| W-27 | A compare picker does not offer the product that is already in the other column, so the same product cannot fill both columns. |
| W-28 | Compare shows no currency symbol until the shopper's currency is loaded (no wrong "$"), like the rest of the app. |
| W-29 | In Arabic and Kurdish the compare row labels sit on the right side, with the column border on the correct side. |

### Open blockers (0)

No open launch blockers.

## 18. Static pages & legal

### Working cases (17)

| # | Case |
|---|---|
| W-1 | Shopper opens `/{locale}/about` → the page shows a title, an intro and two sections. |
| W-2 | Shopper opens `/{locale}/contact` → same layout, contact copy. |
| W-3 | Shopper opens `/{locale}/privacy-policy` → same layout, privacy copy. |
| W-4 | Shopper opens `/{locale}/terms-of-service` → same layout, terms copy. |
| W-5 | Shopper reads a static page in Arabic, Turkish or Kurdish → every title, intro and section is translated. All 20 strings exist in `translations.{ar,tr,ku}.js`. |
| W-6 | Arabic or Kurdish shopper opens a static page → the page is drawn right-to-left and the text is aligned right. |
| W-7 | Search engine reads a static page → translated title and description, a canonical address, and hreflang links for en/ar/tr/ku. While indexing is off, the page says `noindex`. |
| W-8 | Shopper taps the back bar on a static page → goes to `/{locale}/settings`. |
| W-9 | Shopper taps "Terms & Conditions" in the settings menu → the terms page opens in the same locale. |
| W-10 | Shopper opens an address that does not exist under a locale → the 404 page shows "Back to Home" and three links (Featured, Flash Deals, Boutiques), all in the same locale. The page also stops the navigation spinner. |
| W-11 | Arabic shopper in any country gets the Arabic 404 text. Codes other than `sa-ar` / `ae-ar` fall back to the Arabic copy through `isArabic`. |
| W-12 | Shopper opens an unknown address with no locale (for example `/foo`) → `proxy.ts` first adds the locale, then the 404 page shows under it. |
| W-13 | One part of a page throws → only that part shows "Something went wrong / We could not load this part of the page" with a "Try again" button. The rest of the page stays. The error goes to Sentry, PostHog and the backend error log. |
| W-14 | The whole app crashes → the app-wide error screen shows the logo, a message, the Sentry "Error ID", "Try Again" (reload) and "Go Home". The error goes to Sentry and to the error log with user id, country and language. |
| W-15 | The crash message contains "Connection" or "chunks" → the shopper sees a "Connection Lost" screen with "Reload Page". |
| W-16 | Visitor opens the site root `/` (staging gate off) → `proxy.ts` sends them to their saved, geo or default locale. The logo page is not shown. |
| W-17 | `STAGING_GATE=on` → `/` shows only the centred logo, and every other page navigation gets a 307 back to `/`. |

### Open blockers (4)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A3-1 | The legal text is placeholder copy: one intro and two short sections per page, about 60 words each, with promises nobody checked. Product writes the real Privacy Policy, Terms of Service, About and Contact text in en / ar / tr / ku. | Product | `privacy-policy/page.tsx:6-21`, `terms-of-service/page.tsx:6-21`, `about/page.tsx:6-21`, `contact/page.tsx:6-21` |
| A3-2 | The privacy text does not name what the code sends out: Sentry, PostHog (with the phone number), Google Analytics and Firebase push. It says nothing about cookies, how long data is kept, or how an account is deleted. | Product | `privacy-policy/page.tsx:12-21` |
| A3-3 | There is no cookie consent banner. GA, PostHog and Speed Insights start on every page. Blocks if Turkey is a launch market (KVKK). **Product decides per country.** If a banner is needed, Frontend builds it. | Product + Frontend | `app/(client)/[lang]/layout.tsx:195-213`, `components/Home/Init.tsx:136` |
| A3-9 | The support channels are not decided. The contact page shows `support@trydos.com` as plain text and links to nothing in the app. **Product decides** the channels (e-mail, phone, WhatsApp, in-app chat). | Product | `contact/page.tsx:11-20` |

## 19. Languages, regions, SEO & monitoring

### Working cases (41)

| # | Case |
|---|---|
| W-1 | New visitor from a served country opens an address with no locale → redirect to `/{geo-country}-{browser language}`, path kept. |
| W-2 | Site is behind Cloudflare → the country comes from `cf-ipcountry`, else from `x-vercel-ip-country`. "XX" and "T1" count as no country. |
| W-3 | Browser asks for `ar`, `tr`, `ku` or `en` → the address uses that language. Any other language → English. |
| W-4 | Returning visitor with saved `country` + `lang` cookies opens an address with no locale → redirect to the saved locale, path kept. |
| W-5 | Visitor opens a valid locale address with no cookies → page is served and the three locale cookies are saved for 1 year. |
| W-6 | Visitor from a country we do not serve → `/gb-{lang}?no-country=true` → the "Select Your Region" popup lists the served countries. |
| W-7 | Visitor picks a country in that popup → cookies saved, starter settings read again, page moves from `/gb-{lang}` to the chosen country. |
| W-8 | The popup shows country names in the visitor's language, not the backend's English name. |
| W-9 | Visitor opens an address for another country than the saved one → `?changed-country=new,old` → the popup offers both. The choice is saved through `_bypass=popup-selection` and the address is cleaned. |
| W-10 | Visitor with a saved country opens a `gb-*` address → redirect to the saved country, language kept. |
| W-11 | Address with capital letters in the locale (`/SY-EN`) → 308 to lower case. |
| W-12 | A page name with one hyphen (`/privacy-policy`) is not read as a locale. The path is kept. |
| W-13 | A prefetch, RSC or Server Action request with a bad locale (`/zz-qq/...`) skips `proxy.ts` but gets a 404 from the layout. |
| W-14 | Crawler on a valid locale address → page served, no cookies. Crawler with no locale → 308 to `/gb-{lang}`. Never a popup marker. |
| W-15 | Any sitemap address, also under a locale prefix, skips all locale logic. |
| W-16 | The served-country list is read from `BACKEND_URL/countries` in the background, kept 24 h in memory, and never blocks a page. On failure the list is `sy, lb, tr, iq` (plus `gb`). |
| W-17 | After logout, the next real page clears the `LOGOUT-GUARD` cookie; a redirect hop keeps it. |
| W-18 | The visitor's IP is saved in an HttpOnly cookie. An outside referer or `utm_source` is saved in the `referer` cookie. |
| W-19 | Shopper changes the language in settings → address, saved cookie and page language change, and back. |
| W-20 | Shopper changes the country in settings → address, saved cookie and flag change, and back. |
| W-21 | Every page shows the header: logo plus the user area. The user area reads 4 cookies and streams in behind a skeleton, so the rest of the page can be prerendered. |
| W-22 | The `<html lang>` value is a real BCP 47 tag for all 20 served locales (for example `ar-SY`, `ku-IQ`, `en-GB`). |
| W-23 | A new `NEXT_PUBLIC_APP_VERSION` is deployed → on the next visit the app clears storage, logs the shopper out and reloads once. |
| W-24 | Browser has cookies turned off → the shopper sees a translated warning. |
| W-25 | The three translation files are key-parallel: the parity script reports 2,600 keys in all three on this commit. ESLint fails (`local/translate-key-exists`) when code uses a key that is missing from a file. |
| W-26 | Client translations load per language, only for the language in the address. Server pages read the full table. |
| W-27 | Prices use the currency of the address's country. The rate comes from the backend and is cached in Redis per country and in the Next cache for 60 s. |
| W-28 | Each page with metadata gets a canonical address and hreflang links for en/ar/tr/ku plus `x-default`. |
| W-29 | `robots.txt` with indexing off → blocks all crawlers except 5 link-preview bots and publishes no sitemap. With indexing on → allows all and names the sitemap. |
| W-30 | Every response carries `X-Robots-Tag: noindex, nofollow` unless `NEXT_PUBLIC_ALLOW_INDEXING=true`. Page robots meta follows the same flag. |
| W-31 | Every page carries Organization and WebSite structured data, with a search box action to `/{locale}/filters?search=`. |
| W-32 | `/sitemap.xml` lists 20 locale sitemaps and the paged product and boutique sitemaps. Pages hold at most 50,000 URLs, and a page past the end is a 404. |
| W-33 | A locale sitemap for an unknown country or language answers 400. A sitemap that fails to build answers 500 as text and is logged. |
| W-34 | A client error goes to Sentry, to PostHog error tracking and to the backend error log, with user, country, language and recent paths. |
| W-35 | Sentry runs in the browser and, in any non-development build, on the server. Server request errors are captured (`onRequestError`). The QA header is removed from server events. |
| W-36 | PostHog starts in production builds through our own `/ingest` path. The path drops our cookies before it forwards. The signed-in shopper is identified, and logout resets the identity. |
| W-37 | Google Analytics loads after the page and gets events with screen, country and language. |
| W-38 | Vercel Speed Insights is mounted on every locale page. |
| W-39 | Home and category views are cached for 60 s (`HOMEPAGE_CACHE_SECONDS`), with `expire` 300 s so the segment stays prerendered. |
| W-40 | A real page gets `preconnect` hints for the media server and Google Tag Manager. A redirect does not. |
| W-41 | The PWA manifest names the app and lists 10 icon sizes. All 10 icon files exist in `public/assets/icons/`. |

### Open blockers (1)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A3-3 | No cookie consent banner. Same item as section 18. | Product + Frontend | `app/(client)/[lang]/layout.tsx:195-213`, `components/Home/Init.tsx:136` |

## 20. Security & infrastructure

### Working cases (25)

| # | Case |
|---|---|
| W-1 | `/api/proxy` only forwards to 7 named services. An unknown name gets the same 503 as a real failure, so a probe cannot learn the names |
| W-2 | `/api/proxy` refuses a target that could change the host: `//x`, `/\x`, `@x`, a full URL |
| W-3 | `/api/proxy` decodes the target up to 5 times and refuses a broken escape, so `%252F` tricks fail |
| W-4 | `/api/proxy` refuses a path that climbs out of the base (`/../..`). It forwards the exact parsed URL it checked |
| W-5 | `/api/proxy` refuses any call to `send_otp`, also when escaped. OTP send runs only through the `sendOtp` Server Action |
| W-6 | The GET form of `/api/proxy` forces method GET, sends no body, and refuses cross-site callers (`Sec-Fetch-Site`, `Origin`) |
| W-7 | Every `/api/proxy` answer is `Cache-Control: no-store`. The proxy sends no browser cookies to the backend |
| W-8 | `/api/proxy` says which market backend answered (`x-market-backend: gateway` or `core`), in role words only |
| W-9 | Proxy logs mask the token (`tokenHint`) and print only outside production |
| W-10 | OTP send has a Redis rate limit: cooldown, per-session cap, per-IP cap (`OTP_*` settings) |
| W-11 | Token cookies are `HttpOnly`, `Secure` in production, `SameSite=strict`, 48 h by default |
| W-12 | Server Actions check the `Origin` header against an allow-list (Next.js built-in) |
| W-13 | Security headers on every path: HSTS (2 years), `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, a minimal CSP (`object-src`, `base-uri`, `frame-ancestors`) |
| W-14 | `X-Powered-By` is off. The build does not publish browser source maps |
| W-15 | Every `/api/*` answer is `private, no-store`. No catch-all rule makes a personal page publicly cacheable |
| W-16 | Crawling is off unless `NEXT_PUBLIC_ALLOW_INDEXING=true` (robots.txt and `X-Robots-Tag`) |
| W-17 | Staging gate: with `STAGING_GATE=on`, every page navigation goes to the logo page with a **307** (never 308) |
| W-18 | The `/ingest` PostHog proxy strips the `Cookie` header before it calls PostHog, and drops PostHog's `Set-Cookie` |
| W-19 | Seller AI autofill checks the shop permission, allows 10 calls a minute per shop, and fails **closed** when Redis is down |
| W-20 | The search analyser has a 6 s limit, so a slow Gemini call never holds search |
| W-21 | QA mode needs a `QA_VIEW_SECRET` of 32+ characters, compared in constant time. Unset means off |
| W-22 | Sentry server events drop the `x-qa-view` header. Sentry "extras" use an allow-list with no token fields |
| W-23 | Request logging (`REQ_LOG`) is off by default and redacts credential keys (`token`, `otp`, `password`, and others) |
| W-24 | Deploy is by hand only (`gh workflow run Deploy`). Vercel's Git auto-deploy is off. By default the deploy needs green unit **and** e2e runs on that exact commit |
| W-25 | `package.json` and the lock files hold no GitLab token. Checked, clean |

### Open blockers (3)

| Id | Blocker | Owner | Where |
|---|---|---|---|
| A1-7 | The Elasticsearch client accepts any TLS certificate. Same item as section 01. | Frontend + Ops | `services/elastic/elasticsearch.config.ts:15-17` |
| A4-9 | The old Google Maps key is in git history. Rotate it, restrict it by HTTP referrer, and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel. Same item as section 07. | Ops | `utils/mapsConfig.ts` |
| 20 M-21 | Demo and test pages can be opened by anyone: `/demo`, `/loginDemo`, `/navigation`, and the tester tools `app/api/auth/simulate` and `app/simulateUser`. **Product decides:** remove them or hide them. | Product + Frontend | `app/(client)/[lang]/demo/**`, `app/loginDemo`, `app/(special)/navigation` |
