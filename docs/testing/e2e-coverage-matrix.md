# E2E coverage matrix — what the browser suite covers, and what it does not

Date: 2026-10-19. Branch: `development`.

This file lists every case a shopper or a seller can meet on the site. That includes small sub-tasks, not only the big journeys. For each case it says whether the browser (e2e) suite proves it.

## How this file was made

- Each section was built by its own agent. The agent listed the cases from the **app code** (`components/`, `app/`, `services/`, `store/`). Then it opened the e2e tests (`tests/e2e/`) and checked what each test **really asserts**.
- The seller dashboard was done twice. A first pass covered it in one go. Then one agent per seller area went deeper, re-checked the first pass, and fixed its mistakes. Only the deep pass is kept here.
- The code was read on 2026-10-19, with some uncommitted changes in `components/SellerDashboard/orders.tsx` and `services/sellerDashboard/index.ts`.

## Legend

| Mark | Meaning |
|---|---|
| ✅ | An e2e test asserts this case. |
| ⚠️ | Partly covered. The test touches the case but does not assert it, or checks only the happy path, or runs only against a **faked** backend (`*.scripted.spec.ts`). The Notes column says which. |
| ❌ | No e2e test covers it. "unit only: <file>" means a Vitest test in `tests/` covers it, but no browser test does. |

Some ❌ rows are features the app **does not have** (for example a size guide or a product delete). They stay in the table so the reader knows they were checked. Their Notes say "Not in the app".

**Out of scope:** the simulate and demo pages (`/demo`, `/loginDemo`, `simulateUser`, `app/api/auth/simulate`) and `products/temp`. They have no rows here.

Row ids (`CHAT-x1`, `SDP-x12`, …) belong to this file only. They are not test ids. Real test ids (`CHAT-01`, `BUY-03`, `SD-13`, …) are in the "E2E test" column and in `docs/testing/E2E_SCENARIOS.md`.

A few cases appear in two sections, because two flows share them (for example a seller reply is both a seller action and a shopper comment). So the totals count a few cases twice.

## Summary

### Shopper side

| Section | ✅ | ⚠️ | ❌ | Rows |
|---|---|---|---|---|
| Viewing pages | 29 | 13 | 40 | 82 |
| Search | 5 | 3 | 44 | 52 |
| Filter | 0 | 3 | 50 | 53 |
| Sort | 0 | 1 | 41 | 42 |
| Product page actions | 13 | 1 | 41 | 55 |
| Add to cart | 10 | 5 | 53 | 68 |
| Cart | 17 | 13 | 38 | 68 |
| Wishlist | 13 | 3 | 21 | 37 |
| Checkout, payment and orders | 23 | 14 | 46 | 83 |
| Login, sign-up and session | 20 | 16 | 33 | 69 |
| Profile and account | 18 | 10 | 46 | 74 |
| Comments, reviews and reactions | 31 | 9 | 38 | 78 |
| Chat | 26 | 19 | 47 | 92 |
| Stories | 25 | 11 | 42 | 78 |
| Locale, region, navigation and other | 36 | 11 | 58 | 105 |
| **Shopper total** | **266** | **132** | **638** | **1036** |

### Seller dashboard

| Section | ✅ | ⚠️ | ❌ | Rows |
|---|---|---|---|---|
| Entry, permissions and staff | 8 | 10 | 73 | 91 |
| Shop info and locations | 21 | 7 | 65 | 93 |
| Products and the product editor | 5 | 2 | 88 | 95 |
| Boutiques and image gallery | 0 | 8 | 104 | 112 |
| Excel import and export | 5 | 5 | 55 | 65 |
| Orders, product orders and carts | 0 | 3 | 94 | 97 |
| Seller comments and seller stories | 38 | 7 | 87 | 132 |
| **Seller total** | **77** | **42** | **566** | **685** |

### Whole site

| | ✅ | ⚠️ | ❌ | Rows |
|---|---|---|---|---|
| **All sections** | **343 (20%)** | **174 (10%)** | **1204 (70%)** | **1721** |

What the numbers say:
- The e2e suite proves the **main journeys** well: sign-in to each backend, add to bag, place a cash order, chat text messages, stories upload and delete, product comments, locale routing, and the QA safety lock.
- Most ❌ rows are **edge cases and error branches**: refusals, empty states, paging, permission gates, RTL. Most of these have a unit test, so they are not untested. They are only unproved against the real backends.
- Four areas have almost **no browser test at all**: filter (0 ✅), sort (0 ✅), seller orders and carts (0 ✅), and boutiques and gallery (0 ✅).

## The most important gaps

These are the gaps with the highest risk. Each one is a main path, or a path where real money or real data is involved.

1. **Filter and sort are never used in a browser** (FLT-x17, FLT-x18, SORT-x9, SORT-x10). No test checks that the results really match a filter, or that prices really go up or down after a sort. GUEST-44 to GUEST-46 are reserved for this and not written yet.
2. **No payment other than cash on delivery runs in e2e** (ORD-x31 to ORD-x34). RDB wallet, the RDB payment modal, the cart lock sheet, and card / crypto are unit only.
3. **The seller's order actions never run against the backend** (SDO-x40 to SDO-x43). Confirm, Packed and Cancel are unit only. BUY-01 already places a real order, so the data for a test exists.
4. **Product create and edit through the seller editor are never driven** (SDP-x71 to SDP-x81). The QA seed uses its own API body, so a broken form body would go unseen.
5. **A card's Buy corner is never pressed** (ATC-x9 to ATC-x17). Every e2e add starts from the product page. Home, listing, category and boutique cards are where most real adds happen.
6. **A search is never submitted, and no result is clicked** (SRCH-x4, SRCH-x22, SRCH-x43). GUEST-03 only checks "at least one result link".
7. **Stories, comments and wallet 401 paths are never forced** (AUTH-x56 to AUTH-x58, STO-t2, CMT-x75). The access token lives 60 seconds, so every shopper meets these paths. Only chat has a test, and it is scripted.
8. **The "sign in again" prompt is never answered** (AUTH-x49, AUTH-x50). RECOV-02 stops when the prompt shows.
9. **Seller permission gates are proved only with a faked answer** (SDE-x43, SDP-x94, SDO-x6). No real small-role seller account exists, so no test shows that the backend itself refuses.
10. **Nothing is tested in Arabic, Turkish or Kurdish beyond one page title** (LOC-x10 to LOC-x15, SRCH-x35). RTL layout is not checked anywhere.
11. **Returns and refunds have no e2e** (ORD-x72 to ORD-x75). CMT-09 already reaches a delivered order, so a return case could start from the same setup.
12. **The 404 page and the route error boundary are never opened in a browser** (VIEW-E1, VIEW-E3, OTH-x16). One Elasticsearch throw once blanked a whole page.

## Things the agents found on the way

These are not coverage gaps. They are possible problems in the app or in the tests, seen while reading the code. **None is confirmed by a test yet.** By the repo rule, each needs a red test before any fix.

### Possible app problems
- **Search shows raw JSON to the shopper.** `components/Home/Search/SearchIcon.tsx` calls `showSuccessNotification(JSON.stringify(res.isAnalyzed))` (SRCH-x32).
- **A price band that starts at 0 may be dropped.** `FiltersButton.tsx` (about line 145) uses `prices[0] &&`, which treats 0 as false (FLT-x12).
- **Guest wishlist may be lost on sign-in.** The gateway and core keep separate lists and the app has no merge step (WISH-x34).
- **Five seller sections draw an empty panel instead of Access Denied** when opened by link without permission: Gallery, Stories, Comments, Excel, Shop Info (SDE-x40, SDG-x3, SDM-x5, SDS-x4, SDX-x6, SDI-x14).
- **The Users tile shows for roles that the Users section then refuses** (SDE-x41).
- **A direct `?tab=orders` link may show a wrong Access Denied**, because Orders does not wait for `permissionsReady` (SDO-x7).
- **A refused seller reply or delete gives the seller no message**, only a Sentry log (SDM-x36, SDM-x48).
- **A refused comment like never rolls back** on a 200 refusal, because `home.LikeComment` ignores the answer (CMT-x34).
- **Product editor saves skip `utils/fieldErrors.ts`**, so a core field error packed in `message` shows only generic text (SDP-x89).
- **The boutique list ignores paging** (`meta` is ignored), so later boutiques may never show (SDB-x9).
- **Excel upload statuses are not translated** (SDX-x57).
- **Three settings links point to `#`**: "About Us", "Legal Information", "Share App" (NAV-x16).
- **`dir` is commented out** in `app/(client)/[lang]/layout.tsx:161`, so the page has no RTL direction (LOC-x13).
- **The QA seed reads the seller request status as a number, but the modal expects words** (SDE-x75). No test shows which one is right.

### Test problems
- **QA-11 cannot fail.** It searches home-page `<a href>` values that never hold a story link (STO-s45).
- **SST-09's "bad link turns Share off" check passes for the wrong reason.** No media was chosen, so Share is off anyway (SDS-x36).
- **`proveSignInLanded` labels the storefront leg `COMMENTS`** (`tests/e2e/actions/auth.ts`, about line 977). A core failure would name the wrong backend (AUTH-x30).
- **The `watchCartAdd` comment says the app shows no message on a refused add.** That is wrong: `utils/fetchData.ts` shows an error toast (ATC-x59).
- **The SCRIPT-05 comment says a server error spends an OTP try.** The app does not count it (AUTH-x20).
- **SD-12 may no longer be red.** Commit e6776135 leaves out a missing picture's key. Re-run it to learn its real state (SDI-x23).
- **SD-16's download check accepts any category id** (SDX-x30).
- **SCRIPT-26 never checks the Carts tile** (SDC-x3).
- **`tests/components/SellerDashboard/orders.test.tsx` line 108** says the browser suite uses `order-shop-card`. No e2e file uses it.
- **`docs/testing/E2E_SCENARIOS.md` is out of date** in two places: the CMT line numbers are old (see the Comments section), and GUEST-43 is a duplicate row of GUEST-42.

---

## Part A — Shopper side

### Viewing pages
This section asks whether each storefront page opens and shows its content: home, listings, product, static, error and SEO paths, for guests and signed-in shoppers. Search, filter, sort, cart, wishlist and comments are not in scope.

#### Home page (`/[lang]`)
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-H1 | `/` redirects to a `/xx-xx` locale path | ✅ | guest.live.spec.ts › GUEST-01 | Checks the URL shape only. |
| VIEW-H2 | Home renders and hydrates with no uncaught page error | ✅ | guest.live.spec.ts › GUEST-02 | Cart button visible; no `pageerror`. |
| VIEW-H3 | Region picker shows over home for a country we do not serve | ✅ | locale.live.spec.ts › GUEST-07 | |
| VIEW-H4 | Main category bar lists real entries | ✅ | listings.live.spec.ts › GUEST-47 | Skeleton links are left out by the `[data-id]` selector. |
| VIEW-H5 | Boutiques list shows cards and loads more on scroll | ⚠️ | guest.live.spec.ts › GUEST-42 (step 1) | Asserts first card and scroll > 400px. The count growing is not asserted. |
| VIEW-H6 | Boutique product strip opens a product | ✅ | guest.live.spec.ts › GUEST-42 | `openProductFromLastBoutique` |
| VIEW-H7 | Featured products row shows product cards | ⚠️ | guest.live.spec.ts › GUEST-04 | Only "first card visible". Name, price and image are not checked. |
| VIEW-H8 | Flash deals row on home | ❌ | — | unit only: tests/components/Server/FlashDealsProducts.test.tsx |
| VIEW-H9 | Recommended products row | ❌ | — | unit only: tests/components/Server/RecomendedProducts.test.tsx |
| VIEW-H10 | Offers / boutique offer widgets row | ❌ | — | unit only: tests/components/Server/OfferListServer.test.tsx |
| VIEW-H11 | Stories bar on home shows content | ⚠️ | stories.live.spec.ts › STORY-03; qaLock.live.spec.ts › QA-11 | Checks only that the feed has content. See the Stories section. |
| VIEW-H12 | Home scroll position comes back after a product overlay closes | ✅ | guest.live.spec.ts › GUEST-42 | GUEST-43 in the doc is a duplicate row of the same test. |
| VIEW-H13 | Home loading skeletons (nav, featured, offers) | ❌ | — | unit only: tests/components/Home/CategoryHomeView.test.tsx, tests/components/Server/Skeleton.test.tsx |
| VIEW-H14 | Home when a home row fails (route error boundary, not a blank page) | ❌ | — | unit only: tests/app/error.test.tsx. `pnpm e2e:health` only probes backends. |
| VIEW-H15 | Home for a signed-in shopper | ⚠️ | used by signed-in cases through `gotoHome` (e.g. AUTH-02) | Only the logo is asserted. No signed-in-only content is checked. |
| VIEW-H16 | Home holds real content and no QA shop | ✅ | qaLock.live.spec.ts › QA-09a | Served < 400, body > 200 chars, no `trydos-qa-`. |
| VIEW-H17 | Old `?mainCategory=` address renders the plain home page | ❌ | — | D-14 behaviour in `app/(client)/[lang]/page.tsx`. |

#### Category page (`/[lang]/categories/[slug]`)
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-C1 | Tapping a category opens its page, marked open, moved to the front | ✅ | listings.live.spec.ts › GUEST-47 | |
| VIEW-C2 | Category page shows that category's products | ⚠️ | listings.live.spec.ts › GUEST-47 | The page opens, but its products are never read. |
| VIEW-C3 | Open category entry leads back home | ✅ | listings.live.spec.ts › GUEST-47 | The link is read, not tapped (search box covers it). |
| VIEW-C4 | Invalid category slug gives 404 | ❌ | — | unit only: tests/app/categories/page.test.tsx |
| VIEW-C5 | Category URL opened directly (cold load) | ❌ | — | GUEST-47 always arrives from the bar. |

#### Listing pages (featured, flash deals, filters, boutique, brand)
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-L1 | Featured page shows only products the featured query returns | ✅ | listings.live.spec.ts › GUEST-48 | Asks `/api/products/featured` first. |
| VIEW-L2 | Flash deals page shows flash-deal products | ⚠️ | listings.live.spec.ts › GUEST-49 | Skips when staging has no flash deal (200 with none). |
| VIEW-L3 | Featured listing never shows the QA shop | ✅ | qaLock.live.spec.ts › QA-09b | |
| VIEW-L4 | Listing empty state (no products) | ❌ | — | GUEST-48/49 skip on empty; the empty UI is never asserted. |
| VIEW-L5 | Listing loading skeleton (`ListingSkeleton`) | ❌ | — | unit only: tests/components/Server/Skeleton.test.tsx |
| VIEW-L6 | Infinite scroll / next page on a listing | ❌ | — | unit only: tests/components/ListingPage/ProductInfiniteScroll.test.tsx. GUEST-44..46 are reserved, not written. |
| VIEW-L7 | Listing card content (image, name, price) | ❌ | — | unit only: tests/components/products/ProductCard/index.test.tsx |
| VIEW-L8 | `/filters` page base view with no filter | ❌ | — | unit only: tests/app/filters/page.test.tsx |
| VIEW-L9 | Boutique page (boutique view of the filters page) | ❌ | — | unit only: tests/components/filterPage/SearchBoutiquePage.test.tsx. QA-02b reads the route, not the page. |
| VIEW-L10 | Brand page (brand view of listing) | ❌ | — | There is no own route; no e2e opens a brand. |

#### Product page (`/[lang]/products/[productId]` and `@modal` overlay)
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-P1 | Product opens from a listing card and draws a non-empty name | ✅ | guest.live.spec.ts › GUEST-04 | A blank name is blamed on the core backend. |
| VIEW-P2 | Product URL opened directly shows its name | ✅ | qaLock.live.spec.ts › QA-06 | QA product only. |
| VIEW-P3 | Product opens as an intercepted overlay, at its own top | ✅ | guest.live.spec.ts › GUEST-42 | |
| VIEW-P4 | Product back arrow leaves the page | ✅ | guest.live.spec.ts › GUEST-42 | `leaveProductPage` |
| VIEW-P5 | Price shown on the product page | ❌ | — | `product.price` selector exists but no test asserts it. unit only: tests/components/Server/product/ProductPrices |
| VIEW-P6 | Photo gallery / slider | ❌ | — | unit only: tests/components/Server/product/ProductPhotoSliderWrapper.test.tsx |
| VIEW-P7 | Colour variants shown | ⚠️ | shopper.live.spec.ts › BUY-01 (via actions/cart.ts) | Picked during add-to-bag only; the colours on the page are not asserted. |
| VIEW-P8 | Size variants shown | ⚠️ | shopper.live.spec.ts › BUY-01 (via actions/cart.ts) | Same as above. See the Add to cart section. |
| VIEW-P9 | Sold-out variant shows "Notify me" instead of buy | ⚠️ | actions/cart.ts (used by BUY cases) | Used to skip products, never asserted as a state. |
| VIEW-P10 | Description / details text | ❌ | — | unit only: tests/components/Server/product/ProductDetailsTextWrapper.test.tsx |
| VIEW-P11 | Specs (descriptors, general properties, features) | ❌ | — | unit only: ProductDescriptorsWrapper, ProductGeneralPropertiesWrapper, ProductFeaturesWrapper tests |
| VIEW-P12 | Expected delivery, free shipping and free return badges | ❌ | — | unit only: tests/components/Server/product/ProductExpectedDeleiveryWrapper.test.tsx |
| VIEW-P13 | Related products section | ❌ | — | unit only: tests/components/Server/product/RelatedProductsSection.test.tsx |
| VIEW-P14 | Product stories and videos | ❌ | — | unit only: ProductStoriesWrapper.test.tsx, ProductVideosWrapper.test.tsx |
| VIEW-P15 | Size reviews block | ❌ | — | unit only: tests/components/Server/product/ProductSizeReviews.test.tsx |
| VIEW-P16 | Missing product redirects to home with `?message=product_not_found` | ❌ | — | unit only: tests/app/products/page.test.tsx |
| VIEW-P17 | Product skeleton while the page streams | ❌ | — | No e2e check. |
| VIEW-P18 | Product page for a signed-in shopper | ⚠️ | shopper.live.spec.ts › BUY-01, BUY-03 | Opened to buy; page content is not asserted. |
| VIEW-P19 | Product page in Arabic (RTL) | ❌ | — | Every product case runs in English. |

#### Static and other public pages
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-S1 | About page shows its title, back bar and logo | ✅ | staticPages.live.spec.ts › GUEST-37 | Title "About TryDos". |
| VIEW-S2 | Contact page renders with no page error | ✅ | staticPages.live.spec.ts › GUEST-38 | |
| VIEW-S3 | Privacy policy page renders (locale-less path kept) | ✅ | staticPages.live.spec.ts › GUEST-39; locale.live.spec.ts › GUEST-36 | |
| VIEW-S4 | Terms of service page renders | ✅ | staticPages.live.spec.ts › GUEST-40 | |
| VIEW-S5 | Static back bar goes to settings, stays in app | ✅ | staticPages.live.spec.ts › GUEST-41 | |
| VIEW-S6 | Static page body text is shown | ⚠️ | staticPages.live.spec.ts › GUEST-37..40 | Only the title and container are visible; the body copy is not read. |
| VIEW-S7 | Static pages in ar / tr / ku | ❌ | — | unit only: tests/app/staticPages.test.tsx |
| VIEW-S8 | FAQ page | ❌ | — | No FAQ route exists in `app/`. |
| VIEW-S9 | Compare page opens with both slots empty | ✅ | compare.live.spec.ts › CMP-01 | See the Product page actions section for the rest. |

#### Error pages
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-E1 | Unknown path shows the 404 page | ❌ | — | unit only: tests/app/not-found.test.tsx |
| VIEW-E2 | 404 "Back to Home" button works | ❌ | — | unit only: tests/app/not-found.test.tsx, tests/components/global/NotFoundRedirect.test.tsx |
| VIEW-E3 | `[lang]/error.tsx` boundary shows and logs to Sentry | ❌ | — | unit only: tests/app/error.test.tsx |
| VIEW-E4 | `global-error.tsx` replaces the document | ❌ | — | unit only: tests/app/global-error.test.tsx |
| VIEW-E5 | Call route error pages (`call_direct`, `callInProg`, `endCall`) | ❌ | — | unit only: tests/app/special/routes.test.tsx |

#### SEO, sitemaps and robots
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-SEO1 | `robots.txt` served as text/plain, no redirect | ✅ | locale.live.spec.ts › GUEST-28 | |
| VIEW-SEO2 | `robots.txt` rules content is correct | ❌ | — | unit only: tests/app/robots.test.ts |
| VIEW-SEO3 | `sitemap.xml` index served as XML | ✅ | locale.live.spec.ts › GUEST-29 | |
| VIEW-SEO4 | Country-prefixed sitemap served as XML | ✅ | locale.live.spec.ts › GUEST-30 | |
| VIEW-SEO5 | Sitemap index holds no QA data | ✅ | qaLock.live.spec.ts › QA-09d | |
| VIEW-SEO6 | `sitemap-products.xml` content | ⚠️ | qaLock.live.spec.ts › QA-09c | Only body > 200 chars and no QA shop. Product URLs are not checked. |
| VIEW-SEO7 | `sitemap-home`, `-boutiques`, `-search`, `-static` | ❌ | — | unit only: tests/app/sitemapRoutes.test.ts |
| VIEW-SEO8 | Sitemap pagination | ❌ | — | unit only: tests/app/sitemapPagination.test.ts |
| VIEW-SEO9 | Page `<title>` follows the language | ⚠️ | locale.live.spec.ts › GUEST-50 | Settings page title in Arabic only. Home, product and listing titles are not checked. |
| VIEW-SEO10 | `<html lang>` matches the address | ✅ | locale.live.spec.ts › GUEST-50 | |
| VIEW-SEO11 | Open Graph / Twitter tags | ❌ | — | unit only: tests/serverRequests/meta |
| VIEW-SEO12 | Canonical and hreflang alternates | ❌ | — | unit only: tests/serverRequests/buildAlternates.test.ts |
| VIEW-SEO13 | JSON-LD structured data | ❌ | — | unit only: tests/serverRequests/structuredDataUtils.test.ts |
| VIEW-SEO14 | Crawler gets the page with no cookies | ✅ | locale.live.spec.ts › GUEST-19 | |
| VIEW-SEO15 | Crawler gets a 308 to a locale and never sees the picker | ✅ | locale.live.spec.ts › GUEST-20, GUEST-21 | |
| VIEW-SEO16 | Capitals in the address get a 308 to lower case | ✅ | locale.live.spec.ts › GUEST-31 | |

#### Internal pages
| # | Page / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| VIEW-I3 | `(special)/navigation` | ❌ | — | unit only: tests/app/special/routes.test.tsx |

**Summary:** 82 rows: ✅ 29 / ⚠️ 13 / ❌ 40.

**Top gaps:**
1. **VIEW-E1 / VIEW-E3** — no e2e opens the 404 page or the route error boundary. A broken page can look green: one Elasticsearch throw blanks the page.
2. **VIEW-P5 / VIEW-P6 / VIEW-P10 / VIEW-P11** — the product page is checked only for its name. Price, gallery, description and specs are never asserted in a browser.
3. **VIEW-L6** — no listing case scrolls to the next page. GUEST-44..46 are reserved but not written.
4. **VIEW-P16** — a missing product should redirect to home with `?message=product_not_found`. This has a unit test only.
5. **VIEW-SEO11 / VIEW-SEO12 / VIEW-SEO13** — OG tags, canonical/hreflang and JSON-LD are never read from a served page.

### Search
Scope: the nav search overlay (typing, autocomplete, history, popular words, image and voice search, AI analyzer, submit), the listing search box and `?search=` results page, and the search routes. Filters and sort are in their own sections. Main files: `components/Home/Search/SearchIcon.tsx`, `components/filterPage/SearchBoutiquePage.tsx`, `serverRequests/Search.tsx`, `services/elastic/analyzeSearchText.ts`.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SRCH-x1 | Open the overlay from the nav icon; the input becomes enabled | ✅ | guest.live.spec.ts › GUEST-03; qaLock.live.spec.ts › QA-01 | `searchFor` polls until the input is enabled, and says so in a message if it never is. |
| SRCH-x2 | Type a word; after the 1.5 s debounce, product rows show | ✅ | guest.live.spec.ts › GUEST-03 | Happy path only. Term "a"; asserts more than 0 result links. Row content not checked. |
| SRCH-x3 | A result row points at the right product (`href` slug) | ✅ | qaLock.live.spec.ts › QA-01 | QA mode only: a row must carry the seeded product slug. |
| SRCH-x4 | Click a product result to open the product page; the overlay closes | ❌ | — | No e2e clicks a result. Unit only: tests/components/Home/Search/Results/ProductItem.test.tsx |
| SRCH-x5 | A result click saves the word to history, with no duplicates (any letter case) | ❌ | — | Unit only: tests/utils/functions.test.ts (`onClickSearchHistory`) |
| SRCH-x6 | A result click sends the GA `search` event (keyword, position, ids) | ❌ | — | Unit only: tests/components/Home/Search/Results/ProductItem.test.tsx |
| SRCH-x7 | Brand / category / boutique rows show for a word | ❌ | — | Unit only: SearchIcon.test.tsx, Results/BrandItem, CategoryItem, BoutiqueItem tests |
| SRCH-x8 | Search by shop / brand / category: tapping a chip narrows the search; a parent replaces its children | ❌ | — | Unit only: tests/components/Home/Search/SearchIcon.test.tsx |
| SRCH-x9 | "Related Categories" row for an active category; a chip already chosen is not offered again | ❌ | — | Unit only: SearchIcon.test.tsx (BUG-home-8) |
| SRCH-x10 | "Load More" in the brand / category / boutique rows (overlay paging) | ❌ | — | Unit only: SearchIcon.test.tsx (BUG-home-7 slug fix) |
| SRCH-x11 | A chip tap is ignored while a search is loading | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x12 | Inline grey-text autocomplete; Tab or ArrowRight at the end accepts it | ❌ | — | Unit only: SearchIcon.test.tsx, tests/serverRequests/Search.test.ts |
| SRCH-x13 | Suggestion language order: shopper language, then English, then any; an empty box asks nobody | ❌ | — | Unit only: tests/serverRequests/Search.test.ts |
| SRCH-x14 | Recent searches row shows on open (from localStorage); an empty store shows none | ❌ | — | Unit only: SearchHistory.test.tsx, SearchIcon.test.tsx |
| SRCH-x15 | Tap a history word to run that search again | ❌ | — | Unit only: SearchHistory.test.tsx |
| SRCH-x16 | Remove one history word (in the row and in the full list) | ❌ | — | Unit only: SearchHistory.test.tsx (BUG-home-3) |
| SRCH-x17 | Open the full history list, then "Clear All" | ❌ | — | Unit only: SearchHistory.test.tsx (BUG-home-4) |
| SRCH-x18 | Popular searches row from `/api/products/popular-search` (top 10) | ❌ | — | Unit only: SearchTrending.test.tsx, popular-search/route.test.ts, services/search.test.ts |
| SRCH-x19 | Tap a popular word to fill the box; full list with counts; its "Clear All" empties the word | ❌ | — | Unit only: SearchTrending.test.tsx |
| SRCH-x20 | Popular-search failure (500 / ES down): the overlay still opens, the error is logged | ❌ | — | Unit only: SearchIcon.test.tsx, popular-search/route.test.ts |
| SRCH-x21 | The search word is logged (`logSearchTerm`) only when it found products | ❌ | — | Unit only: tests/serverRequests/Search.test.ts |
| SRCH-x22 | Enter submits to `/filters?search=<word>`, with the chosen chips in the path | ❌ | — | Unit only: SearchIcon.test.tsx. The app uses `?search=`, not `?query=`. |
| SRCH-x23 | "Search" button with the "Total Products" count opens results and closes the overlay | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x24 | Search button shows a spinner while loading | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x25 | The "Reset" button and the chip bar X clear the word and all chips | ❌ | — | Unit only: SearchIcon.test.tsx, ActiveSearchFilterBar.test.tsx |
| SRCH-x26 | Clear input: the first X click clears the word, the next one closes the overlay | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x27 | The side close icon closes the overlay when the box is empty | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x28 | No-results state: total 0 hides the Search button and shows only Reset (no message) | ❌ | — | QA-02 checks that no QA rows come back, not the empty UI. |
| SRCH-x29 | A misspelled word still finds products (fuzzy match) | ❌ | — | No test found, unit or e2e. |
| SRCH-x30 | Race: an older answer that lands late is dropped | ❌ | — | Unit only: SearchIcon.test.tsx |
| SRCH-x31 | Search request fails: the error is logged, the spinner stops, the shopper sees no message | ❌ | — | Unit only: SearchIcon.test.tsx, serverRequests/Search.test.ts |
| SRCH-x32 | AI analyzer (Gemini) on multi-word text pulls out name / colour / size; a toast shows the result | ⚠️ | qaLock.live.spec.ts › QA-01, QA-02, QA-10 | "Trydos QA" is two words, so the analyzer runs, but no test asserts its output. The toast shows raw JSON. Unit: Search.test.ts |
| SRCH-x33 | Analyzer refuses, hits the 429 quota, or passes the 6 s timeout: the search runs on the raw text | ⚠️ | qaLock.live.spec.ts › QA-09e | The route must answer, but the analyzer failure itself is not asserted. Unit: analyzeSearchText.test.ts |
| SRCH-x34 | A one-word search skips the analyzer | ❌ | — | Unit only: tests/serverRequests/Search.test.ts |
| SRCH-x35 | Search in Arabic / Kurdish (RTL layout, Arabic analyzer) | ❌ | — | Every e2e search runs in English (`gotoHome`). |
| SRCH-x36 | Search in Turkish | ❌ | — | No test, unit or e2e. |
| SRCH-x37 | Placeholder and labels are translated ("Search", "Find Products", "Find Brands"…) | ❌ | — | Only `lint:i18n-parity` checks the keys. Nothing checks the screen. |
| SRCH-x38 | Results are scoped to the shopper's country | ❌ | — | No case compares the same word in two countries. |
| SRCH-x39 | QA mode: the QA product shows only with the QA header | ✅ | qaLock.live.spec.ts › QA-01, QA-02, QA-10 | Asserts that the header went out and checks the row shop slug. |
| SRCH-x40 | Mobile catalogue search route `/api/products/searchInCatalog?search_text=` | ⚠️ | qaLock.live.spec.ts › QA-09e | Asserts only: answered, not empty, no QA shop. Unit: searchInCatalog/route.test.ts |
| SRCH-x41 | Image search: menu, camera or file, crop, `/api/image-search` fills the word; a non-image is refused | ❌ | — | Unit only: SearchImage.test.tsx, tests/app/api/image-search/route.test.ts |
| SRCH-x42 | Voice search: record, `/api/speech-recognition`, browser fallback, microphone refused, no support, 8 s auto-stop | ❌ | — | Unit only: SearchVoice.test.tsx, tests/app/api/speech-recognition/route.test.ts |
| SRCH-x43 | Results page `/filters?search=` opened directly: the box is pre-filled and products match | ❌ | — | Unit only: ListingSearchContainer.test.tsx, tests/app/filters/page.test.tsx |
| SRCH-x44 | Listing search box writes to `?search=` after a pause; Enter writes at once | ❌ | — | Unit only: tests/components/filterPage/SearchBoutiquePage.test.tsx |
| SRCH-x45 | A `?search=` change refetches the grid and the filter list (no stale RSC) | ❌ | — | Unit only: SortableGrid.test.tsx, FilterListReactive.test.tsx |
| SRCH-x46 | Empty the listing box to remove `?search=`; a search cleared elsewhere empties the box | ❌ | — | Unit only: SearchBoutiquePage.test.tsx |
| SRCH-x47 | Listing box spinner and grey-text suggestion | ❌ | — | Unit only: SearchBoutiquePage.test.tsx |
| SRCH-x48 | Search results paging on the listing (page 2+ keeps `search_text`) | ❌ | — | Unit only: tests/components/Server/ProductListConainer.test.tsx |
| SRCH-x49 | Old path `/filters/search/<word>` redirects to `?search=` | ❌ | — | Unit only: tests/utils/searchPathRedirect.test.ts |
| SRCH-x50 | Search on the featured / flash-deal pages | ❌ | — | GUEST-48/49 open those pages with no word typed. |
| SRCH-x51 | The compare page's own search box fills a slot | ✅ | compare.live.spec.ts › CMP-06 | A separate surface. A nothing-found answer names the search backend. |
| SRCH-x52 | Header "search mode" (`enable_search`) and the body scroll lock while the overlay is open | ❌ | — | Unit only: SearchIcon.test.tsx (mocked DisableScroll / setEnableSearch) |

**Summary:** ✅ 5 / ⚠️ 3 / ❌ 44 (52 rows). Most ❌ rows have a unit test. The browser suite tests only "open, type, see at least one link" (GUEST-03) and QA-mode visibility (QA-01/02/10, QA-09e).

**Top gaps:**
- **SRCH-x4**: no e2e clicks a search result and lands on the product page. This is the main search journey.
- **SRCH-x22 / SRCH-x23 / SRCH-x43**: no e2e submits a search (Enter or the Search button) and checks the `/filters?search=` results page.
- **SRCH-x35**: no e2e searches in Arabic or Kurdish. Both use a separate Arabic analyzer and an RTL layout.
- **SRCH-x32**: no e2e asserts what the AI analyzer pulls from a multi-word search. The analyzer also shows its raw JSON to the shopper as a toast (`showSuccessNotification(JSON.stringify(res.isAnalyzed))` in `components/Home/Search/SearchIcon.tsx`). That needs a product decision.
- **SRCH-x28**: no e2e checks the no-results state. The overlay shows only a "Reset" button and no message.

### Filter
Scope: the filter panel, the filter chip rows and the active-filter bar on `/filters`, `/featured`, `/flashDeals` and shop (`/filters/boutiques/<slug>`) pages. Sort and search text are in their own sections.

**The key fact:** no e2e test opens a filter. No spec loads `/filters/...` and none taps a filter chip. `docs/testing/E2E_SCENARIOS.md` keeps GUEST-44 to GUEST-46 for "the filter, sort and paging cases, which are not written yet". Only three cases touch filter-like paths, and only from the side.

Rating, gender, in-stock, discount and descriptor filters do not exist in the app. The Elasticsearch query (`services/elastic/helpers.ts` `buildBaseConditions`) filters only on shop, category, brand, color, size, price (country-aware), tags, and the featured and flash-deal flags. Descriptors are only search-text match fields. So those filter types have no rows.

| # | Filter / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| FLT-x1 | Open the filter panel (`filter-widget-button` → `filterEnabled`) | ❌ | — | unit only: `tests/components/filterPage/FilterBoutiquePageButton.test.tsx` |
| FLT-x2 | Close the panel (back icon, red cross); page can scroll again | ❌ | — | unit only: `FiltersWindow/index.test.tsx` |
| FLT-x3 | Panel draws a row only for a facet that has values; no price section when 1 product | ❌ | — | unit only: `FiltersWindow/index.test.tsx` |
| FLT-x4 | Category chip in panel, with sub-categories (`CategoryImageCircel`) | ❌ | — | unit only: `FiltersWindow/CategoryImageCircel.test.tsx` |
| FLT-x5 | Brand chip in panel (`ImageCircel`) | ❌ | — | unit only: `FiltersWindow/ImageCircel.test.tsx` |
| FLT-x6 | Color chip in panel (`#` prefix on and off) | ❌ | — | unit only: `FiltersWindow/ImageCircel.test.tsx` |
| FLT-x7 | Size chip in panel | ❌ | — | unit only: `FiltersWindow/ImageCircel.test.tsx` |
| FLT-x8 | Price slider min/max and price chart (`PriceSliderComponent`, `SmoothPolygon`) | ❌ | — | unit only: `PriceSliderComponent.test.tsx`, `PriceShape.test.tsx` |
| FLT-x9 | Price-only reset (price cross) keeps the other chips | ❌ | — | unit only: `FiltersWindow/index.test.tsx` "clears only the price band" |
| FLT-x10 | Live re-count after a chip change (waits 400 ms, asks once, asks again after a busy request) | ❌ | — | unit only: `FiltersWindow/index.test.tsx` |
| FLT-x11 | Re-count request refused → error logged, chosen chips kept | ❌ | — | unit only: `FiltersWindow/index.test.tsx` |
| FLT-x12 | "Search (Total Products: n)" button builds the filter URL | ❌ | — | unit only: `FiltersButton.test.tsx`. Possible bug: `prices[0] &&` drops a band with min 0 |
| FLT-x13 | Panel with 0 matching products hides the Search button | ❌ | — | unit only: `FiltersButton.test.tsx` |
| FLT-x14 | Panel Reset button returns to the applied filters | ❌ | — | unit only: `FiltersWindow/index.test.tsx` |
| FLT-x15 | Panel on featured / flash pages builds `/featured/...` or `/flashDeals/...` | ❌ | — | unit only: `FiltersButton.test.tsx` |
| FLT-x16 | Chip rows under the listing bar (category, brand, color, size, price) | ❌ | — | unit only: `tests/components/Server/FilterList.test.tsx` |
| FLT-x17 | Apply one filter from a row chip → path like `/filters/brands/<slug>` | ❌ | — | unit only: `FilterItem.test.tsx`, `utils/listing/filterItemState.test.ts` |
| FLT-x18 | Results really match the filter (each card has the brand/color/size) | ❌ | — | no test reads cards against a filter |
| FLT-x19 | Tap an active chip again to remove that one filter | ❌ | — | unit only: `filterItemState.test.ts` |
| FLT-x20 | Combine two filter types (e.g. brand + color) | ❌ | — | unit only: `filterItemState.test.ts` |
| FLT-x21 | Several values in one type (OR inside brands) | ❌ | — | unit only: `filterItemState.test.ts` |
| FLT-x22 | Price is one choice only: a new band replaces the old one | ❌ | — | unit only: `filterItemState.test.ts` |
| FLT-x23 | Sub- or grand-category chip replaces its parent category | ❌ | — | unit only: `filterItemState.test.ts` (`parentValue`) |
| FLT-x24 | `related_categories` in the path merges into `categories` | ❌ | — | unit only: `tests/utils/server/helpers.test.ts` |
| FLT-x25 | More chips load on scroll when a row has 10 or more (`InfiniteScrollFilters`) | ❌ | — | unit only: `InfiniteScrollFilters.test.tsx` |
| FLT-x26 | Row-switch button and filter count dots (`countFilters`) | ❌ | — | unit only: `SwitchFiltersButton.test.tsx`, `FilterList.test.tsx` |
| FLT-x27 | Active-filter bar (`filterInfo`) shows a chip for each applied type | ❌ | — | unit only: `FilterList.test.tsx` |
| FLT-x28 | Remove one chip from the active-filter bar | ❌ | — | The app has no such control. The bar chips only show; use FLT-x19 or clear all |
| FLT-x29 | Clear all (`reset_filter_button`) → plain `/filters`, `?search=` dropped | ❌ | — | unit only: `FilterList.test.tsx` |
| FLT-x30 | Clear all on a shop page keeps the shop and hides its chip | ❌ | — | unit only: `FilterList.test.tsx` |
| FLT-x31 | Active bar hidden on a shop page with nothing else applied | ❌ | — | unit only: `FilterList.test.tsx` |
| FLT-x32 | A chip tap keeps the current `?search=` and `?sort=` | ❌ | — | unit only: `filterItemState.test.ts` |
| FLT-x33 | Filter survives a full reload | ❌ | — | no test |
| FLT-x34 | Browser back/forward restores the previous filter state | ❌ | — | no test |
| FLT-x35 | A deep link `/filters/brands/x/colors/y` opens with those filters on | ❌ | — | unit only: `tests/utils/server/helpers.test.ts` (`parseFiltersFromParams`) |
| FLT-x36 | Unknown path segment ignored; bad URL encoding does not break the page | ❌ | — | unit only: `tests/utils/server/helpers.test.ts` |
| FLT-x37 | Price band written as `min-max` or `min,max` keeps both bounds | ❌ | — | unit only: `tests/components/Listing/FiltersPageContent.test.tsx` |
| FLT-x38 | No results after a filter → "No products found" | ❌ | — | unit only: `tests/components/Server/ProductList.test.tsx` |
| FLT-x39 | Loading more filtered results keeps the filter (same PIT snapshot) | ❌ | — | unit only: `ProductInfiniteScroll.test.tsx` |
| FLT-x40 | Price filter uses the country price (`country_offer_prices`) | ❌ | — | unit only: `tests/services/elastic/helpers.test.ts` |
| FLT-x41 | Price chips and slider show the country currency and decimals | ❌ | — | unit only: `FilterItem.test.tsx` (currency cases) |
| FLT-x42 | Shop page as a filter: banner shown, only that shop's products | ❌ | — | no e2e opens `/filters/boutiques/<slug>` |
| FLT-x43 | Missing shop → home with `message=boutique_not_found` (full page and overlay) | ❌ | — | unit only: `FiltersPageContent.test.tsx` |
| FLT-x44 | Filter page opened as an overlay (`@modal/(.)filters`) vs as a full page | ❌ | — | no test |
| FLT-x45 | Tag filter (`tags_names`) chip and query | ❌ | — | unit only: `FilterList.test.tsx`, `services/elastic/helpers.test.ts` |
| FLT-x46 | Featured flag listing shows only featured products | ⚠️ | `listings.live.spec.ts` › GUEST-48 | Compares cards with the app's own route only, not the product flag |
| FLT-x47 | Flash-deal flag listing shows only flash deals | ⚠️ | `listings.live.spec.ts` › GUEST-49 | Same as GUEST-48; skips when staging has no flash deal |
| FLT-x48 | Category page from the home category bar | ⚠️ | `listings.live.spec.ts` › GUEST-47 | Checks address and "open" mark only; products not checked |
| FLT-x49 | Filters applied on featured / flash pages (`/featured/brands/...`) | ❌ | — | no test |
| FLT-x50 | Search popup filter bar (category, brand, shop chips; reset) | ❌ | — | unit only: `tests/components/Home/Search/ActiveSearchFilterBar.test.tsx` |
| FLT-x51 | Mobile vs desktop filter panel and rows | ❌ | — | no test at any viewport |
| FLT-x52 | RTL (ar/ku): rows and chips run right to left | ❌ | — | unit only: `FilterList.test.tsx` |
| FLT-x53 | QA shop never appears in filter results or the shop facet | ❌ | — | QA-09 checks home, featured and search route; `/filters` not checked |

**Summary:** ✅ 0 · ⚠️ 3 · ❌ 50 (53 rows).

**Top gaps:**
- **FLT-x18:** no test checks that the results really match a filter. A filter that does nothing would pass every run.
- **FLT-x17 / FLT-x20:** applying one filter and combining two have no e2e at all. These are the core shopper paths.
- **FLT-x40:** the country price filter is checked only in the unit suite. A wrong country price shows wrong products, and only staging data can show it.
- **FLT-x33 / FLT-x34:** no e2e checks that a filter survives a reload or browser back.
- **FLT-x12:** the panel's Search button may drop a price band that starts at 0. In `components/ListingPage/filterComponents/FiltersWindow/FiltersButton.tsx` (around line 145), `prices[0] &&` treats 0 as false. This is a possible bug only, not confirmed by a test.

### Sort
Scope: the listing sort sheet (`components/Listing/ListingSortControl.tsx`), the `?sort=` URL param, the grid refetch (`components/Server/SortableGrid.tsx`, `ProductInfiniteScroll.tsx`), and the Elasticsearch sort clause (`services/elastic/helpers.ts` › `buildSortClause`, `sortKeys.ts`). It covers the filters, search, shop (boutique), featured and flash-deals pages. No browser test touches sort today. `docs/testing/E2E_SCENARIOS.md` holds GUEST-44 to GUEST-46 for "filter, sort and paging", and says they are "not written yet".

| # | Sort option / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SORT-x1 | Sort button shows in the listing bar when there are several results | ❌ | — | unit only: `tests/components/Server/ListingBarActions.test.tsx` |
| SORT-x2 | Sort button hidden at 0 or 1 result, and follows a client-side search's new count | ❌ | — | unit only: `ListingBarActionsClient.test.tsx`, `ProductInfiniteScroll.test.tsx` |
| SORT-x3 | Tap sort icon opens the bottom sheet (title, 5 groups) | ❌ | — | unit only: `tests/components/Listing/ListingSortControl.test.tsx` |
| SORT-x4 | Trigger aria-label names the applied sort; red dot when not Default | ❌ | — | Label: unit only, `ListingSortControl.test.tsx`. No test checks the dot. |
| SORT-x5 | Default order (relevance, no `?sort=`, `_score` desc) | ⚠️ | `listings.live.spec.ts` › GUEST-48, GUEST-49 | Only loads featured/flash pages with the default sort. Checks which cards show, never their order. |
| SORT-x6 | Best sellers: order really follows `orders_count` desc | ❌ | — | unit only: `tests/services/elastic/helpers.test.ts` (clause shape only) |
| SORT-x7 | Newest: order follows `created_at` desc | ❌ | — | unit only: `helpers.test.ts`. The card does not show the date, so check it against an index read. |
| SORT-x8 | Oldest: order follows `created_at` asc | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x9 | Price Low to High: card prices really go up | ❌ | — | unit only: `helpers.test.ts` (clause shape, not real order) |
| SORT-x10 | Price High to Low: card prices really go down | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x11 | Price sort uses root `offered_price`; card shows the country price (known mismatch, e.g. `sy`) | ❌ | — | A locked decision, not a bug. No test pins it. Roadmap Phase 10 plans to. |
| SORT-x12 | Name A to Z: no case split, uses the shopper's language | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x13 | Name Z to A | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x14 | Product missing the sort field or name sits last, both directions | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x15 | Field missing from the index mapping (`unmapped_type`) does not 500 the listing | ❌ | — | unit only: `helpers.test.ts` |
| SORT-x16 | Popular / best rating / discount / has-offer options | ❌ | — | Not in the app. The design spec left them out because they need backend fields. Nothing to test yet. |
| SORT-x17 | Tapping a row only stages a draft; the URL stays the same | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x18 | Confirm writes `?sort=<key>` and closes the sheet | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x19 | Confirm is disabled while the draft equals the applied sort | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x20 | Reset stages Default; disabled at Default; confirming Default removes `?sort=` | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x21 | Closing the sheet without Confirm drops the draft; reopening shows the applied sort | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x22 | URL changes through `history.pushState` (no router); other query params kept | ❌ | — | unit only: `ListingSortControl.test.tsx` |
| SORT-x23 | Grid shows card skeletons, then sorted page 1 (in place, no full loader) | ❌ | — | unit only: `tests/components/Server/SortableGrid.test.tsx`, `ProductInfiniteScroll.test.tsx` |
| SORT-x24 | Unknown `?sort=` value falls back to Default (widget and ES) | ❌ | — | unit only: `ListingSortControl.test.tsx`, `helpers.test.ts` |
| SORT-x25 | Reload with `?sort=` renders the sorted grid from the server; cache key includes sort | ❌ | — | unit only: `FiltersPageContent.test.tsx`, `tests/app/filters/page.test.tsx` |
| SORT-x26 | Shared link keeps `?sort=`, and opening it shows the same order | ❌ | — | unit only: `ListingShareControl.test.tsx` (query kept). No test opens the link. |
| SORT-x27 | Back to the unsorted URL shows the server grid again | ❌ | — | unit only: `SortableGrid.test.tsx` (address matches server) |
| SORT-x28 | Back/forward between two sorts gives each sort's right order | ❌ | — | No test anywhere. |
| SORT-x29 | Infinite scroll page 2+ keeps the same sort (`sort` sent to `GetProducts`) | ❌ | — | No unit test checks that the next-page call carries `sort`. |
| SORT-x30 | Sorted paging has no repeats or gaps (`id` tie-breaker, `search_after`, PIT) | ❌ | — | unit only: `helpers.test.ts`, `elasticSearch.test.ts` AC-5 |
| SORT-x31 | Changing sort resets paging to page 1 (remount keys include sort) | ❌ | — | unit only: `SortableGrid.test.tsx` |
| SORT-x32 | Sort + filter: toggling a filter keeps `?sort=` | ❌ | — | unit only: `tests/utils/listing/filterItemState.test.ts` |
| SORT-x33 | Sort + filter: filter pending shows skeletons, then filtered list stays sorted | ❌ | — | unit only: `SortableGrid.test.tsx` (skeleton part) |
| SORT-x34 | Sort + search together (`?search=…&sort=…`) | ❌ | — | unit only: `ListingSortControl.test.tsx`, `SortableGrid.test.tsx` |
| SORT-x35 | Sort on a shop (boutique) listing | ❌ | — | No test. |
| SORT-x36 | Sort on the featured page | ❌ | — | GUEST-48 opens the page with the default sort only. |
| SORT-x37 | Sort on the flash-deals page | ❌ | — | GUEST-49 opens the page with the default sort only. Staging holds few flash deals. |
| SORT-x38 | Sort inside the intercepted filters modal route | ❌ | — | unit only: `tests/app/modal/pages.test.tsx` |
| SORT-x39 | Category page (`/categories/{slug}`) has no sort control (home-style view) | ❌ | — | GUEST-47 opens the page but does not check this. |
| SORT-x40 | Mobile API `/api/products/searchInCatalog?sort=` | ❌ | — | unit only: `tests/app/api/products/searchInCatalog/route.test.ts` |
| SORT-x41 | Sorted page load fails: error toast, retry after 3 s | ❌ | — | Retry: unit only, `ProductInfiniteScroll.test.tsx`. Not checked for a sorted grid. |
| SORT-x42 | RTL sheet layout and translated labels (ar / tr / ku) | ❌ | — | No test. Only `lint:i18n-parity` checks that the keys exist. |

**Summary:** ✅ 0 / ⚠️ 1 / ❌ 41. No browser spec, action or harness file mentions sort. A grep over `tests/e2e/` finds only unrelated JS `.sort()` calls. `gridWalk.ts` is for the seller dashboard grid, not for listings.

**Top gaps:**
- **SORT-x9 / SORT-x10:** no browser test checks that card prices really go up or down after Confirm.
- **SORT-x11:** the known price-sort mismatch on country prices is not pinned by any test, so a change to it would pass without notice.
- **SORT-x29 / SORT-x30:** no test checks that page 2+ keeps the sort with no repeats. No unit test checks that `sort` reaches the next-page `GetProducts` call either.
- **SORT-x25 / SORT-x28:** no test checks that `?sort=` survives a reload, or that back and forward give the right order.
- **SORT-x32 / SORT-x34:** no browser test runs sort together with a filter or a search.

### Product page actions
Scope: what a shopper does on `/[lang]/products/[slug]` (full page and overlay). Add to cart, the checklist and writing comments have their own sections. The app has **no** quantity picker, report button, follow/visit shop, chat-with-seller button, recently viewed list, read-more control or size guide on this page. A grep of `components/products`, `components/Server/product` and `components/Product` found none, so those have no rows.

| # | Action / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| PDP-x1 | Open a product from a listing card; the page has a title | ✅ | guest.live.spec.ts › GUEST-04 | Checks the URL and the title only. |
| PDP-x2 | Open a product by its own address | ✅ | qaLock.live.spec.ts › QA-06 | `gotoQaProduct`; checks only that the name is not empty. |
| PDP-x3 | Page body is complete after opening (photos, price row, footer) | ⚠️ | GUEST-04, QA-06 | Tests wait for the title only. No spec reads the price, the photos or the footer prices. |
| PDP-x4 | Overlay product opens at its top; back arrow returns home with scroll kept | ✅ | guest.live.spec.ts › GUEST-42 | The doc lists GUEST-43 for the same single test (duplicate row). |
| PDP-x5 | Back arrow on a full page: last page, boutique loader, or home on direct entry | ❌ | — | unit only: tests/components/products/ProductBackButton.test.tsx |
| PDP-x6 | Unknown slug on the full page → 307 to `?message=product_not_found` | ❌ | — | unit only: tests/app/products/page.test.tsx |
| PDP-x7 | Unknown slug in the overlay → client redirect (`NotFoundRedirect`) | ❌ | — | unit only: tests/app/modal/pages.test.tsx, NotFoundRedirect.test.tsx |
| PDP-x8 | Tap another colour → `?color=` changes, active border moves | ❌ | — | unit only: ProductColorItem.test.tsx, clientWrapper/product/ProductColorsWrapper.test.tsx |
| PDP-x9 | Colour switch swaps main slider and zoom photos to that colour | ❌ | — | unit only: ActiveColorSlider.test.tsx, colorImageGroups.test.ts |
| PDP-x10 | Colour switch adds the colour name to the title line | ❌ | — | unit only: Server/product/ProductNameAndBrand.test.tsx |
| PDP-x11 | Colour row hidden for 0–1 colours; "N Colors Available" label | ❌ | — | unit only: Server/product/ProductColorsWrapper.test.tsx |
| PDP-x12 | Tap a size chip → `?size=` is set, chip is marked | ❌ | — | unit only: Server/product/SizeItemWrapper.test.tsx |
| PDP-x13 | Size section and size-fit reviews hidden when the product has no sizes | ❌ | — | unit only: ProductSizesWrapper.test.tsx, ProductSizeReviews.test.tsx |
| PDP-x14 | Size system tabs (Standard/EU/IN/US/UK, IN/CM) | ❌ | — | The tabs have no click handler, so they cannot be used yet. Nothing tests them. |
| PDP-x15 | Swipe the main photo slider (RTL in ar/ku) | ❌ | — | unit only: ProductImageSlider.test.tsx |
| PDP-x16 | Tap a photo → full-screen zoom at that photo, swipe, close | ❌ | — | unit only: ProductDetailsSlider.test.tsx |
| PDP-x17 | Product video: small muted autoplay, tap opens full size, arrows, close | ❌ | — | unit only: ProductVideo.test.tsx (includes BUG-products-6) |
| PDP-x18 | Flash-deal banner and countdown on the first photo | ❌ | — | unit only: FlashDealBanner.test.tsx. GUEST-49 checks only the listing. |
| PDP-x19 | Luck/redeem price and counter (`redemed_ids` cookie) | ❌ | — | unit only: ProductRedeemCounter.test.tsx, PricesRowClientLogic.test.tsx |
| PDP-x20 | Footer price: offer price, strike-through when discounted, country currency | ❌ | — | unit only: ProductPricesWrapper.test.tsx. The `product.price` selector exists, but no spec uses it. |
| PDP-x21 | Expected delivery line (day, date, work days, country name) | ❌ | — | unit only: ProductExpectedDeleiveryWrapper.test.tsx |
| PDP-x22 | Tap delivery banner → stats sheet loads once, 10-day chart, return sections | ❌ | — | unit only: ExpectedDeleiveryModal.test.tsx, ExpectedDeleiveryBanner.test.tsx |
| PDP-x23 | Free-shipping and free-return badges (hidden at 0 return days) | ❌ | — | unit only: FreeShippingOption.test.tsx, FreeReturnBadge.test.tsx |
| PDP-x24 | Tap rating/views strip → general properties sheet (stars, recommend, sizing) | ❌ | — | unit only: ProductGeneralProperties.test.tsx |
| PDP-x25 | Descriptors (specs) row shows groups and values | ❌ | — | unit only: ProductDescriptorsWrapper.test.tsx |
| PDP-x26 | Details text (sanitised HTML) and label row | ❌ | — | unit only: ProductDetailsText.test.tsx, ProductFeaturesWrapper.test.tsx |
| PDP-x27 | Open the share panel from the footer | ❌ | — | unit only: ProductShareButton.test.tsx, ShareSection.test.tsx |
| PDP-x28 | Copy link → clipboard and "Link Copied" notice | ❌ | — | unit only: ShareOptions.test.tsx. Copy uses the raw URL with no `utm_source`, unlike the other share paths. |
| PDP-x29 | Share to Facebook / X / WhatsApp / Telegram → share count POST on the chat backend | ❌ | — | unit only: ShareOptions.test.tsx (`share_product_on_apps`) |
| PDP-x30 | Share by e-mail (Gmail on desktop, mailto on phone) | ❌ | — | unit only: ShareOptions.test.tsx |
| PDP-x31 | Native share sheet only where `navigator.share` exists; cancel is not an error | ❌ | — | unit only: ShareOptions.test.tsx |
| PDP-x32 | Share to chat contacts: pick contacts, Share sends; error with no contact | ❌ | — | unit only: ShareOptions.test.tsx, ShareButton.test.tsx. No chat spec covers it. |
| PDP-x33 | Open the More (three-dot) panel | ✅ | wishlist.live.spec.ts › WISH-02; compare.live.spec.ts › CMP-02 | `openMoreOptions` asserts that the panel is visible. |
| PDP-x34 | Add to compare from the product page (first slot) | ✅ | compare.live.spec.ts › CMP-02 | Checks the cookie, the address and the table separately. |
| PDP-x35 | Second product fills slot 2 | ✅ | compare.live.spec.ts › CMP-03 | — |
| PDP-x36 | Third product replaces the first, and the shopper is told | ✅ | compare.live.spec.ts › CMP-04 | The notice is counted, not read. |
| PDP-x37 | Reopened product shows "Added"; toggle off removes it and shifts slot 2 | ✅ | compare.live.spec.ts › CMP-05 | The "Removed From Compare" notice is not asserted. |
| PDP-x38 | Tap the "Added to compare" notice → compare page opens | ❌ | — | Cases open `/compare` by address (`gotoCompare`). No case taps the notice. |
| PDP-x39 | Compare toggle re-syncs on focus and on the compare-changed event | ❌ | — | unit only: MoreOptionsSection.test.tsx |
| PDP-x40 | Notify-me topics: subscribe, unsubscribe, refuse with no push token | ❌ | — | unit only: MoreOptionsSection.test.tsx. The test Chromium has no PushManager. |
| PDP-x41 | Like the product (heart) on the comments backend; it stays after reload | ✅ | comments.live.spec.ts › CMT-01, CMT-06 | `setProductHeart` waits for an accepted answer. |
| PDP-x42 | Unlike the product, and it stays off | ✅ | comments.live.spec.ts › CMT-08 | — |
| PDP-x43 | Like count moves by one; a failed like rolls back with an error notice | ❌ | — | unit only: Server/product/ProductFooter.tsx/ProductLikeButton.test.tsx. `CountOfLoves` is never read. |
| PDP-x44 | Open the comments extended area from the footer | ✅ | comments.live.spec.ts › CMT-02 | `openExtendedArea` asserts that the area opened. |
| PDP-x45 | Close the extended area by tapping the backdrop | ✅ | comments.live.spec.ts › CMT-02 | Checked for the comments tab only. Share and More panels are not checked. |
| PDP-x46 | Open the reviews sheet from its top bar (`BuyersCommentModal`) | ❌ | — | unit only: BuyersCommentModal.test.tsx |
| PDP-x47 | Open the Q&A sheet from the FAQ top bar (`FaqSectionModal`) | ❌ | — | unit only: tests/components/Server/product/ProductFAQSection/ |
| PDP-x48 | Product story section shows a story attached to the product | ✅ | sellerStories.live.spec.ts › SST-06 | Visibility only. |
| PDP-x49 | Tap a product story → viewer opens; more stories load on scroll | ❌ | — | unit only: ProductStories.test.tsx |
| PDP-x50 | "You May Also Like" row shows related cards | ❌ | — | unit only: RelatedProductsSection.test.tsx |
| PDP-x51 | Tap a related card → that product opens | ❌ | — | No unit test or e2e case found. |
| PDP-x52 | Related "Show More": paging, no duplicates, "Reach End", retry after a failed page | ❌ | — | unit only: RelatedProductsInfiniteScroll.test.tsx |
| PDP-x53 | Header cart summary (count and total) → tap opens the cart | ❌ | — | unit only: ProductBackButton.test.tsx |
| PDP-x54 | Virtual try-on: icon opens modal, camera/upload, result, retry, close | ❌ | — | unit only: TryOnModal.test.tsx, VirtualTryOnWrapper.test.tsx. The result is faked (3 s timer, no backend). |
| PDP-x55 | Footer hidden during the navigation loader and while login is open | ❌ | — | unit only: ProductFooterClient.test.tsx, ProductFooter.tsx/ProductFooter.test.tsx |

**Summary:** ✅ 13 · ⚠️ 1 · ❌ 41 (55 rows). Every ❌ row except PDP-x14, PDP-x38 and PDP-x51 has a unit test. Browser coverage of the product page is only: open it, compare, like, the comments area, and the story section.

**Top gaps:**
- **PDP-x8 / PDP-x9: pick a colour and the photos change.** This is the main variant action. It depends on client-side `?color` reading, because the server render goes stale. It can break only in a real browser and router, and no browser case touches it.
- **PDP-x20: the product page price is never read.** No spec checks the offer price, the discount strike-through or the country currency on the product page. BUY-03 checks money only in the bag.
- **PDP-x28 / PDP-x29: share (copy link, social) has no browser case.** The share count POST to the chat backend is unchecked outside the unit suite.
- **PDP-x6 / PDP-x7: a missing product redirect.** The 307 from the full page and the client redirect in the overlay are proved only in units. The overlay path exists to fix a Next 16 streaming problem.
- **PDP-x22 / PDP-x24: the delivery stats sheet and the general properties sheet.** Both are taps that load backend data (`GetProductDeliveryTimes`, rating and sizing stats), and no browser case opens either.

### Add to cart
Scope: every add-to-bag entry point in the app, from the button press to the bag holding the line. Cart editing and checkout are in their own sections.

Code facts behind this table:
- Only two controls start an add. The **Buy corner** on a product card (`ProductButtonWrapper.tsx`) and the **Buy tab** on the product page (`components/products/AddToCartButton.tsx`). Both open one sheet (`AddToCartComponent.tsx`), and its "Add To Bag" button (`Button.tsx`) calls `services/cart.ts > AddToCart`.
- Search, stories, chat, wishlist and compare have no add control in code. `setSelectedProductForCart` has only these two UI callers.
- Every browser-suite add goes through `addOpenProductToBag` in `tests/e2e/actions/cart.ts`. That function opens the **product page by address**. No e2e test ever presses a card's Buy corner (`data-pw="buy-button"`).

| # | Surface / case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| ATC-x1 | Product page: the purple Buy tab is drawn | ✅ | shopper.live.spec.ts › BUY-01, BUY-02, BUY-05 (via `addOpenProductToBag`) | Asserts "the product page drew no Buy control". |
| ATC-x2 | Product page: Buy tab opens the add-to-bag sheet | ✅ | shopper.live.spec.ts › BUY-01 (via `addOpenProductToBag`) | Sheet card visible is asserted. "Buy does not add by itself" is not asserted. |
| ATC-x3 | Sheet finishes reading the product before any press | ✅ | shopper.live.spec.ts › BUY-01 (via `addOpenProductToBag`) | Waits for `data-loading="false"`. The message names the core backend. |
| ATC-x4 | Product page: Add To Bag raises the cart badge | ✅ | shopper.live.spec.ts › BUY-01 step "the QA product goes into the bag" | Polls the badge until it is above the old count. Signed-in shopper, QA product. |
| ATC-x5 | After the add, the bag holds the added line | ✅ | shopper.live.spec.ts › BUY-01 step "the bag holds what was added" | Checks the line count only, not the line's name. |
| ATC-x6 | Buy tab locks page scroll and jumps to the top | ❌ | — | unit only: tests/components/products/AddToCartButton.test.tsx |
| ATC-x7 | Buy tab sends the luck price for an unredeemed luck product | ❌ | — | unit only: tests/components/products/AddToCartButton.test.tsx |
| ATC-x8 | Product modal (`@modal` intercepted route) Buy tab | ❌ | — | No e2e opens a product as a modal and adds from it. |
| ATC-x9 | Home: Featured Products card Buy corner opens the sheet | ❌ | — | unit only: tests/components/ServerWrapper/ProductWrapper/ProductButtonWrapper.test.tsx |
| ATC-x10 | Home: Flash Deals row card Buy corner | ❌ | — | No e2e presses a Buy corner. |
| ATC-x11 | Home: Recommended products row card | ❌ | — | Same Buy corner. Never pressed in e2e. |
| ATC-x12 | Category home page (`/categories/<slug>`) card rows | ❌ | — | Never pressed in e2e. |
| ATC-x13 | Listing / filters grid, including cards loaded on scroll | ❌ | — | listings.live.spec.ts only reads the grid. It never adds. |
| ATC-x14 | Featured listing (`/featured/...`) | ❌ | — | Never pressed in e2e. |
| ATC-x15 | Flash-deals listing (`/flashDeals`) | ❌ | — | GUEST-49 checks only that products are shown. No add. |
| ATC-x16 | Boutique page (`/filters/boutiques/<slug>`) | ❌ | — | Never pressed in e2e. |
| ATC-x17 | Related products row: sheet opens for *that* product | ❌ | — | Never pressed in e2e. |
| ATC-x18 | Buy corner tap does not open the product page | ❌ | — | The code calls `preventDefault`. Not checked in e2e. |
| ATC-x19 | Adding from a listing keeps the scroll place | ❌ | — | Not checked anywhere. |
| ATC-x20 | Search drop-down results have no Buy control | ❌ | — | No add control in code. The absence is never asserted. |
| ATC-x21 | Stories have no add control | ❌ | — | No add control in code. stories.live.spec.ts never checks the absence. |
| ATC-x22 | Chat product card has no add control | ❌ | — | No add control in code. The absence is never asserted. |
| ATC-x23 | Wishlist (checklist) has no add control | ❌ | — | No add control in code. Wishlist specs do not touch the cart. |
| ATC-x24 | Compare page has no add control | ❌ | — | No add control in code. compare.live.spec.ts does not touch the cart. |
| ATC-x25 | Quantity picker before add | ❌ | — | Not in app code. The sheet always sends `qty: 1`. |
| ATC-x26 | Size guide | ❌ | — | Not in app code. |
| ATC-x27 | Buy now / direct checkout | ❌ | — | Not in app code. Every add goes through the sheet. |
| ATC-x28 | Colour and size are already picked when the sheet opens | ❌ | — | unit only: tests/components/Cart/AddToCart/AddToCartComponent.test.tsx |
| ATC-x29 | Pick a colour and size, then add | ⚠️ | shopper.live.spec.ts › BUY-01 (via `addOpenProductToBag`) | Clicks colours and sizes. Never checks which variant reached the bag. |
| ATC-x30 | No colour or size picked: picker shakes, nothing is added | ❌ | — | unit only: tests/components/Cart/AddToCart/Button.test.tsx |
| ATC-x31 | Colour change updates the sheet's picture and price | ❌ | — | Not checked in e2e. |
| ATC-x32 | Product with no variants (no rows, "Last N" in the middle) | ❌ | — | unit only: AddToCartComponent.test.tsx |
| ATC-x33 | Another colour or size makes a new bag line | ❌ | — | Not checked anywhere. |
| ATC-x34 | Minus-button count covers all variants of the product | ❌ | — | Not checked anywhere. |
| ATC-x35 | Low stock "Last N" on a size or colour | ❌ | — | unit only: SizeSelect.test.tsx, ColorSelect.test.tsx |
| ATC-x36 | Sold-out variant: Notify Me replaces Add To Bag | ⚠️ | actions/cart.ts › `addOpenProductToBag` | Skips sold-out variants and asserts nothing. The QA product is always in stock. |
| ATC-x37 | Notify Me tap: "We Will Inform You" | ❌ | — | unit only: AddToCartComponent.test.tsx, NotifyButton.test.tsx |
| ATC-x38 | Notify twice: green "already notified" message | ❌ | — | unit only: AddToCartComponent.test.tsx |
| ATC-x39 | Notify with notifications blocked: red message | ❌ | — | unit only: AddToCartComponent.test.tsx |
| ATC-x40 | Country-restricted or inactive product shows notify, not add | ❌ | — | unit only: AddToCartComponent.test.tsx |
| ATC-x41 | Packed-after-ordering product: no stock lines, never notify | ❌ | — | unit only: AddToCartComponent.test.tsx, SizeSelect.test.tsx |
| ATC-x42 | "product availability" push reloads the open sheet | ❌ | — | `NotificationHandler.ts` sets `shouldUpdate`. No test found. |
| ATC-x43 | Add the same variant again: `/cart/update` with qty + 1 | ❌ | — | unit only: Button.test.tsx. The e2e add stops after the first add. |
| ATC-x44 | Label becomes "Add More to Your Bag" and the minus button shows | ❌ | — | No unit or e2e test found. |
| ATC-x45 | Sheet knows the bag from another surface | ❌ | — | Not checked anywhere. |
| ATC-x46 | Max quantity reached (seller or flash-deal limit, lower wins) | ❌ | — | unit only: AddToCartComponent.test.tsx, Button.test.tsx |
| ATC-x47 | A max of 0 means no limit | ❌ | — | unit only: AddToCartComponent.test.tsx |
| ATC-x48 | Double tap: second press ignored while the request runs | ❌ | — | unit only: Button.test.tsx |
| ATC-x49 | Guest add, answered by the gateway | ✅ | shopper.live.spec.ts › BUY-05 step "the guest puts the QA product in the bag, and the gateway takes it" | Asserts `x-market-backend` is `gateway`. |
| ATC-x50 | Fresh visitor with no verified phone can fill a bag | ✅ | shopper.live.spec.ts › BUY-02 | The add is asserted, then the phone gate. |
| ATC-x51 | Signed-in add | ✅ | shopper.live.spec.ts › BUY-01 (also BUY-03, BUY-04, ORD-01; orderRating.live.spec.ts › CMT-09) | All use `addQaProductToBag`. |
| ATC-x52 | Signed-in add is answered by the core backend | ⚠️ | shopper.live.spec.ts › BUY-01 | `added.backend` is returned but never asserted for a signed-in shopper. |
| ATC-x53 | Guest's added line survives sign-in | ✅ | shopper.live.spec.ts › BUY-05 | Same line name and quantity after sign-in. Core answers the read. |
| ATC-x54 | Add with an expired access token (401, refresh, retry) | ⚠️ | — | Can happen by chance (60 s token). No test forces a 401 on `/cart/add`. |
| ATC-x55 | Refresh refused during an add: shopper becomes a guest | ❌ | — | session-recovery.live.spec.ts covers the cart read only, not the add. |
| ATC-x56 | Bag icon animates and "Added To Your Bag" shows | ❌ | — | unit only: Button.test.tsx |
| ATC-x57 | Success toast with the backend message (status 1) | ❌ | — | unit only: tests/utils/fetchData.test.ts |
| ATC-x58 | Backend refuses the add: bag does not grow, failure quotes the answer | ⚠️ | actions/cart.ts › `addOpenProductToBag` | Reported only if it happens. Never forced, so no refusal is asserted. |
| ATC-x59 | Error toast when the backend refuses | ❌ | — | unit only: fetchData.test.ts. The e2e comment wrongly says the app shows nothing. |
| ATC-x60 | Network failure: no crash, stock is read again | ❌ | — | unit only: Button.test.tsx |
| ATC-x61 | Answer with status 0 or no `id_cart` adds nothing | ❌ | — | unit only: tests/services/cart.test.ts |
| ATC-x62 | RDB payment lock: lock sheet shows, nothing is added | ❌ | — | unit only: tests/services/cart.test.ts |
| ATC-x63 | Luck card: countdown and luck price on the Buy corner | ❌ | — | unit only: ProductButtonWrapper.test.tsx |
| ATC-x64 | Luck product added at the luck price, luck ends at once | ❌ | — | unit only: Button.test.tsx |
| ATC-x65 | Flash-deal price in the sheet matches the card | ❌ | — | Not checked anywhere. |
| ATC-x66 | Close the sheet with Escape | ✅ | shopper.live.spec.ts › BUY-01 (via `closeAddToBagSheet`) | Asserts the sheet is hidden after Escape. |
| ATC-x67 | Close the sheet by backdrop tap or drag | ❌ | — | unit only: tests/components/global/BottomSheet.test.tsx |
| ATC-x68 | "Add Again?" from Out Of Bag puts an old item back | ❌ | — | unit only: tests/components/Cart/OldCartContainer.test.tsx |

**Summary:** ✅ 10 · ⚠️ 5 · ❌ 53 (68 rows). Of the 53 ❌ rows, 27 are "unit only". 8 more are surfaces or features with no add control in app code (ATC-x20 to ATC-x27).

**Top gaps:**
1. **ATC-x9 to ATC-x17: no e2e presses a card's Buy corner.** Home, category, listing, flash deals, boutique and related rows all share `ProductButtonWrapper`. That is most real add traffic, and it is not tested end to end.
2. **ATC-x59 / ATC-x58: a refused add is never forced.** No case checks that the shopper sees the error toast. Also, the `watchCartAdd` comment in `tests/e2e/actions/cart.ts` says the app shows no message. That is wrong: `utils/fetchData.ts` calls `showErrorMessage` for every "cart widget" call.
3. **ATC-x43 / ATC-x44 / ATC-x46: adding an item already in the bag.** Adding again goes to `/cart/update`, and the max-quantity block sits on this path too. Neither is covered in e2e.
4. **ATC-x54 / ATC-x55: add with an expired token.** Nothing forces a 401 on `/cart/add`. Nothing proves that the retry lands, or that a refused refresh turns the shopper into a guest.
5. **ATC-x36 / ATC-x40: sold-out, restricted or inactive product.** The e2e helper skips the Notify state and asserts nothing about it, so a swap that hides Add To Bag by mistake would go unseen.

### Cart
The cart drawer after items are in it: open/close, lines, quantity, remove, totals, coupon, the checkout gate, guest vs signed-in, Out Of Bag. The app has no undo button (only an automatic put-back when the backend refuses a removal), no "clear all" button, no group-by-shop view and no "price changed" notice. So those have no rows.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| CART-x1 | Open cart from the nav cart icon (signed-in) | ✅ | shopper.live.spec.ts › BUY-01, BUY-04 (`openCart`) | `openCart` asserts the drawer is visible |
| CART-x2 | Open cart as a guest | ✅ | guest.live.spec.ts › GUEST-05 "the cart drawer opens for a guest" | Only asserts the drawer opens, not its contents |
| CART-x3 | Open cart from `?cart=true` in the URL | ❌ | — | unit only: tests/components/Cart/CartProvider.test.tsx |
| CART-x4 | Product-page header: line count + total, tap opens cart | ❌ | — | unit only: tests/components/products/ProductBackButton.test.tsx |
| CART-x5 | Open cart from a notification item | ❌ | — | No test |
| CART-x6 | Close the cart with its back arrow | ✅ | shopper.live.spec.ts › BUY-05 (`closeCart`) | Asserts the drawer is hidden |
| CART-x7 | Close the cart with the browser back button | ❌ | — | unit only: CartProvider.test.tsx |
| CART-x8 | Loading skeleton while the cart reads | ❌ | — | `openCart` waits through it, never asserts it |
| CART-x9 | Opening the cart gets a 200 from `/cart/cart_shipping` | ✅ | auth.live.spec.ts › AUTH-02; session-recovery.live.spec.ts › RECOV-01 | Used as a session probe; lines not checked |
| CART-x10 | Cart read fails → "Cart Loading Error" + Try Again | ❌ | — | unit only: tests/components/CartErrorComponent.test.tsx |
| CART-x11 | Header "Shopping Bag N Items" count | ❌ | — | Selector `length-ofItems` exists but no test uses it |
| CART-x12 | Line shows the product name | ⚠️ | shopper.live.spec.ts › BUY-04, BUY-05 (`bagLineName`) | Only "name not empty"; never matched to the product added |
| CART-x13 | Line shows the product image | ❌ | — | No test |
| CART-x14 | Line shows colour / size variant | ❌ | — | unit only: tests/components/Cart/CartItem.test.tsx |
| CART-x15 | Line shows pieces and shipping days | ❌ | — | unit only: CartItem.test.tsx |
| CART-x16 | Line price, struck old price, "Saved %" | ❌ | — | unit only (currency symbol only): QuantutyInput.test.tsx |
| CART-x17 | Luck price shown on a luck line | ❌ | — | No test |
| CART-x18 | Flash deal banner on a line | ❌ | — | No test |
| CART-x19 | "Hurry Up!" time-left / quantity-left banner | ❌ | — | unit only: CartItem.test.tsx |
| CART-x20 | Availability label (Out Of Stock / Not In Your Country / Not Available Now) | ⚠️ | checkout.scripted.spec.ts › SCRIPT-16, SCRIPT-17 | Scripted fake bag; the label itself is never read |
| CART-x21 | Tap a line → product page with colour/size in the URL | ❌ | — | unit only: QuantutyInput.test.tsx (CartItemLink block) |
| CART-x22 | Tap a line of the product already open → URL update + cart closes | ❌ | — | unit only: QuantutyInput.test.tsx |
| CART-x23 | Plus raises a line to 2; the re-read confirms it | ✅ | shopper.live.spec.ts › BUY-04 | Reads the quantity only after `/cart/cart_shipping` answers |
| CART-x24 | Minus lowers a line | ❌ | — | Helper supports minus, no spec uses it. unit only: QuantutyInput.test.tsx |
| CART-x25 | A row of 1 shows delete in place of minus | ⚠️ | emptyTheBag (BUY-01/03/04/05 setup) | Clicks delete at qty 1; never asserts minus is absent |
| CART-x26 | Max cap (per-order / flash deal / stock): plus disabled + "Max Allowed Quantity Reached" | ❌ | — | BUY-04 reads `aria-disabled` only as a precondition. unit only: QuantutyInput.test.tsx |
| CART-x27 | Backend refuses a quantity change → number goes back | ❌ | — | unit only: QuantutyInput.test.tsx, tests/services/cart.test.ts |
| CART-x28 | Refused raise (status 0) → "Notify when available" modal | ❌ | — | unit only: QuantutyInput.test.tsx |
| CART-x29 | Second press while a change is loading is ignored | ❌ | — | No test |
| CART-x30 | Remove a line at quantity 1 | ✅ | shopper.live.spec.ts › BUY-05; `emptyTheBag` | Waits for `/cart/cart_overview` before judging |
| CART-x31 | Remove a line at quantity above 1 | ✅ | shopper.live.spec.ts › BUY-04 | Removes the line after raising it to 2 |
| CART-x32 | Removal refused → row put back (automatic undo) | ❌ | — | Helpers would catch it, but nothing forces a refusal. unit only: services/cart.test.ts |
| CART-x33 | A removal stays removed after a reload | ✅ | shopper.live.spec.ts › BUY-05 | Core read is proven after the reload |
| CART-x34 | Empty every line, one by one | ✅ | `emptyTheBag` in BUY-01/03/04/05 | Asserts 0 lines and no nav badge |
| CART-x35 | Empty cart state ("Cart is Empty" text) | ⚠️ | `emptyTheBag` | Counts 0 lines; never reads the empty text. unit: EmptyCart.test.tsx |
| CART-x36 | Empty cart: "Back To HomePage" button closes the cart | ❌ | — | unit only: tests/components/Cart/OrderButton.test.tsx |
| CART-x37 | Nav badge line count | ⚠️ | `addOpenProductToBag`, `emptyTheBag` | Asserts it rises and goes to 0; never compared to the line count |
| CART-x38 | Payable total equals the core backend's total | ✅ | shopper.live.spec.ts › BUY-03 | Compares against `/cart/cart_shipping`, with the currency rate |
| CART-x39 | Shipping fee equals the core backend's shipping | ✅ | shopper.live.spec.ts › BUY-03 | |
| CART-x40 | Tap the total row to open the breakdown | ⚠️ | shopper.live.spec.ts › BUY-03 (`readCartMoney`) | Opened as a step; not asserted on its own |
| CART-x41 | Fold the breakdown (backdrop tap / swipe down) | ❌ | — | unit only: OrderButton.test.tsx |
| CART-x42 | "Normal Price" figure (total + discount − shipping) | ⚠️ | shopper.live.spec.ts › BUY-03 | Read by `readCartMoney`, never asserted |
| CART-x43 | Total discount amount and % | ❌ | — | No test |
| CART-x44 | "Shipping is completely free" text at shipping 0 | ❌ | — | No test |
| CART-x45 | Struck-through total before discount | ❌ | — | No test |
| CART-x46 | Cash on delivery chosen → total shows `total_cash` | ❌ | — | unit only: OrderButton.test.tsx |
| CART-x47 | Another address re-prices the bag figures | ✅ | shopper.live.spec.ts › BUY-03 | Figures read back in the bag after the re-price |
| CART-x48 | Unknown coupon refused, total unchanged | ✅ | shopper.live.spec.ts › BUY-07 | Coupon box is on the checkout screen |
| CART-x49 | Accepted coupon → bag read again, new total | ⚠️ | checkout.scripted.spec.ts › SCRIPT-21 | Faked backend only |
| CART-x50 | Coupon from a `?coupon=` link applied by itself | ⚠️ | checkout.scripted.spec.ts › SCRIPT-22 | Faked backend only |
| CART-x51 | Confirm & Continue → checkout (verified shopper) | ✅ | shopper.live.spec.ts › BUY-01, BUY-03 | |
| CART-x52 | Confirm & Continue as guest/unverified → verify panel | ✅ | shopper.live.spec.ts › BUY-02 | Asserts no checkout and the panel is visible |
| CART-x53 | Verify panel success → goes on to checkout | ❌ | — | unit only: OrderButton.test.tsx |
| CART-x54 | Unavailable line blocks checkout + "Please Review Your Cart" toast | ⚠️ | checkout.scripted.spec.ts › SCRIPT-16 | Faked backend; checks a toast exists, not its text |
| CART-x55 | Country-restricted line blocks checkout | ⚠️ | checkout.scripted.spec.ts › SCRIPT-17 | Faked backend only |
| CART-x56 | Inactive line (`is_active: false`) blocks checkout | ❌ | — | SCRIPT-16/17 cover only the other two fields |
| CART-x57 | Bag empties between checkout steps → back to cart | ⚠️ | checkout.scripted.spec.ts › SCRIPT-18 | Faked backend only |
| CART-x58 | Confirm button label shows item count + total | ❌ | — | No test |
| CART-x59 | Guest bag on the gateway, signed-in bag on core | ✅ | shopper.live.spec.ts › BUY-05 | Reads `x-market-backend` for both |
| CART-x60 | Guest bag kept on sign-in, same quantity, nothing extra | ✅ | shopper.live.spec.ts › BUY-05 | |
| CART-x61 | Cart lines are still there after a reload | ⚠️ | auth.live.spec.ts › AUTH-02 | Proves only a 200 read after the reload; lines not checked |
| CART-x62 | Cart per country (switch country with items in the bag) | ❌ | — | Suite always seeds `sy`; no switch case |
| CART-x63 | "Reschedule" moves a line to Out Of Bag | ❌ | — | unit only: QuantutyInput.test.tsx |
| CART-x64 | Out Of Bag list: countdown, "Add Again?" | ❌ | — | unit only: tests/components/Cart/OldCartContainer.test.tsx |
| CART-x65 | Out Of Bag: Hide one / Hide All | ❌ | — | unit only: OldCartContainer.test.tsx |
| CART-x66 | RDB payment lock: cart write refused, lock sheet shown | ❌ | — | unit only: services/cart.test.ts, RdbPaymentLockedSheet.test.tsx |
| CART-x67 | Success / refusal toasts on remove and update | ❌ | — | No test reads them |
| CART-x68 | Cart layout in RTL (ar / ku) | ❌ | — | No test |

**Summary:** ✅ 17 / ⚠️ 13 / ❌ 38 (68 rows).

**Top gaps:**
- **CART-x26** – No e2e test checks the max-quantity cap or its "Max Allowed Quantity Reached" message.
- **CART-x24** – No e2e test uses minus. The `changeLineQuantity` helper supports it, but no spec calls it.
- **CART-x27 / CART-x32** – When the backend refuses a change or a removal, the app rolls it back. Only unit tests prove this.
- **CART-x66** – No e2e test covers the RDB payment lock on cart writes.
- **CART-x62 / CART-x63–65** – No e2e test covers the cart per country or the Out Of Bag ("Reschedule") flow.

### Wishlist
Saving products to the "checklist" (code name: wishlist). You save from the product page's three-dot panel and view the list at `/settings/checklist`. The market channel serves it: the gateway for a guest, the core backend for a verified shopper. The app has no heart icon on cards, no save from home, story or search, no move-to-cart, no count badge, no share and no collections. The heart on the product footer is a "like" (comments service), not the wishlist.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| WISH-x1 | Open the three-dot panel on a product page to reach "Add To My Checklist" | ✅ | wishlist.live.spec.ts › WISH-02 | `openMoreOptions` asserts the trigger and the panel are visible. |
| WISH-x2 | Toggle shows "not saved" on mount for an unsaved product (`isInWishlist` on mount) | ✅ | wishlist.live.spec.ts › WISH-02; wishlist-signed-in.live.spec.ts › WISH-06 | Asserts the toggle is not green before the press. |
| WISH-x3 | Save from the product page as a guest (POST `/checklist`, gateway) | ✅ | wishlist.live.spec.ts › WISH-02 | Toggle turns green and the backend list holds the slug. Separate checks. |
| WISH-x4 | Save from the product page as a signed-in verified shopper (core) | ✅ | wishlist-signed-in.live.spec.ts › WISH-06 step "the core backend takes the save" | Also asserts `x-market-backend` is `core`. |
| WISH-x5 | Toggle re-checks membership before acting (add or remove decided by a fresh `isInWishlist`) | ⚠️ | wishlist.live.spec.ts › WISH-02 | Only the add branch runs. Unit: MoreOptionsSection.test.tsx. |
| WISH-x6 | Remove from the product page toggle (press again on a saved product) | ❌ | — | No e2e presses the toggle off. Unit only: MoreOptionsSection.test.tsx. |
| WISH-x7 | Toast "Added to checklist" after save | ❌ | — | No e2e reads the toast. Unit only: MoreOptionsSection.test.tsx. |
| WISH-x8 | Toast "Removed from checklist" (product page and checklist screen) | ❌ | — | Unit only: MoreOptionsSection.test.tsx, ChecklistView.loadMore.test.tsx. |
| WISH-x9 | Spinner and `aria-busy` on the toggle while the request runs; a second tap is ignored | ❌ | — | The e2e polls state and never asserts the spinner. Unit covers no-id guard only. |
| WISH-x10 | Toggle save fails → "Failed to update checklist" toast, toggle stays as it was | ❌ | — | Unit only: MoreOptionsSection.test.tsx. The e2e only names the backend status when the toggle never turns. |
| WISH-x11 | Mount status read fails → logged to Sentry, toggle shows unsaved | ❌ | — | Unit only: MoreOptionsSection.test.tsx. |
| WISH-x12 | Product with no id → toggle does nothing | ❌ | — | Unit only: MoreOptionsSection.test.tsx. |
| WISH-x13 | Saved state survives a fresh product page load (toggle green, `/exist` true) | ✅ | wishlist.live.spec.ts › WISH-04 | The backend `/exist` answer and the toggle are asserted separately. |
| WISH-x14 | Single-product `/exist` agrees with the list (core) | ✅ | wishlist-signed-in.live.spec.ts › WISH-06 | `savedOnBackend` asserted after the save. |
| WISH-x15 | GA `add_product_to_favorites` fires on add only, not on remove | ❌ | — | Unit only: MoreOptionsSection.test.tsx. |
| WISH-x16 | Settings → "My Checklist" entry link opens the screen | ❌ | — | The e2e goes to `/settings/checklist` directly. Unit only: tests/app/settings/pages.test.tsx. |
| WISH-x17 | Checklist screen loads (back bar, skeletons, then list or empty panel) | ✅ | wishlist.live.spec.ts › WISH-01, WISH-03 | `gotoChecklist` asserts the back bar, then skeletons hidden within 45 s. |
| WISH-x18 | Empty state "Your CheckList is empty" for a new guest | ✅ | wishlist.live.spec.ts › WISH-01 | Backend list empty, empty panel visible, zero rows. Panel text not read. |
| WISH-x19 | Saved product listed on the screen (guest, gateway) | ✅ | wishlist.live.spec.ts › WISH-03 | Matched by slug in the row link. |
| WISH-x20 | Saved product listed on the screen (signed-in, core) | ✅ | wishlist-signed-in.live.spec.ts › WISH-06 step "the checklist screen shows it" | — |
| WISH-x21 | Row shows the product image and name | ❌ | — | The row is matched by link slug only. Image and name content not asserted. |
| WISH-x22 | Tap a row → opens the product page | ❌ | — | No e2e clicks `checklist-item-link`. |
| WISH-x23 | Remove a row with the X (guest), and the backend no longer lists it | ✅ | wishlist.live.spec.ts › WISH-05 | Row gone, backend list without slug, empty panel after reload. |
| WISH-x24 | Remove a row with the X (signed-in, core) | ✅ | wishlist-signed-in.live.spec.ts › WISH-06 step "the core backend takes the removal" | No reload check after removal, unlike WISH-05. |
| WISH-x25 | Per-row spinner and dim while removing; a second tap is ignored | ❌ | — | Unit only: ChecklistItem.test.tsx, ChecklistView.loadMore.test.tsx. |
| WISH-x26 | Row removal fails → "Failed to remove from checklist" toast, row stays | ❌ | — | Unit only: ChecklistView.loadMore.test.tsx. |
| WISH-x27 | First page load fails → "Something went wrong" toast | ❌ | — | Unit only: ChecklistView.loadMore.test.tsx. |
| WISH-x28 | Pagination: "Load more" shows when `current_page < last_page` (BUG-1 fix) | ❌ | — | No e2e saves 11+ products. Unit only: ChecklistView.loadMore.test.tsx, services/wishlist.test.ts. |
| WISH-x29 | "Load more" fetches the next page, shows "Loading...", hides on the last page | ❌ | — | Unit only: ChecklistView.loadMore.test.tsx. |
| WISH-x30 | "Load more" fails → toast, current list kept | ❌ | — | Unit only: ChecklistView.loadMore.test.tsx. |
| WISH-x31 | Saved list survives a reload and a new visit (backend is the source, no local copy) | ✅ | wishlist.live.spec.ts › WISH-03, WISH-04, WISH-05 | Fresh loads of the screen and product page read backend state. |
| WISH-x32 | Routing: guest → gateway, verified → core | ⚠️ | wishlist-signed-in.live.spec.ts › WISH-06 | Core asserted. The guest file quotes the backend label in its messages but never asserts it is `gateway`. Unit: tokenManager.test.ts. |
| WISH-x33 | 401 on a checklist call → refresh, then retry | ⚠️ | wishlist.live.spec.ts › WISH-01 | Only avoided: `waitForShopCredential` waits out the first 401. No forced-expiry retry case. |
| WISH-x34 | Guest saves, then signs in: is the guest's list merged or lost? | ❌ | — | The app has no merge code. Gateway and core keep separate lists, so behaviour is unknown and untested. |
| WISH-x35 | RTL layout of the toggle and rows (ar / ku) | ❌ | — | All e2e runs use `en`. |
| WISH-x36 | Saved product later goes out of stock or is deleted | ❌ | — | The row has no stock state. Untested on screen and backend. |
| WISH-x37 | Save from listing card, home, story or search; heart on cards; count badge; move to cart; share; collections | ❌ | — | Not built in the app. `WISHLIST_BUTTON` GA name exists but has no caller. |

**Summary:** ✅ 13 / ⚠️ 3 / ❌ 21 (WISH-x37 covers features the app does not have).

**Top gaps:**
- **WISH-x34:** no test of what happens to a guest's saved products after sign-in. The gateway and core lists are separate, and the app has no merge step, so a shopper can lose saved items without any message.
- **WISH-x6 / WISH-x10:** remove from the product page toggle, and the toggle's failure branch, are unit only. The e2e only presses the toggle on.
- **WISH-x28 / WISH-x29:** pagination ("Load more", BUG-1) is unit only. No live case has more than 10 saved products, so a backend paginator change would go unseen.
- **WISH-x22 / WISH-x21:** no e2e opens a product from a checklist row, or checks that the row's image and name are filled in.
- **WISH-x33:** no forced 401-then-retry case on the checklist calls. The suite only waits out the first 401 on a new guest.

### Checkout, payment and orders
Scope: from the bag's Confirm & Continue, through address, totals, coupon, payment and placing the order, to the shopper's order list and order page, then cancel, change, hide, return, notifications and rating after delivery.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| ORD-x1 | Confirm & Continue in the bag opens the checkout for a verified shopper | ✅ | shopper.live.spec.ts › BUY-01 "the bag leads to the checkout screen"; also ORD-01, orderRating.live.spec.ts › CMT-09 | Failure message says if the session became a guest. |
| ORD-x2 | Phone gate in the bag: a visitor with no verified phone gets the verify panel, not checkout | ✅ | shopper.live.spec.ts › BUY-02 | Asserts the panel shows and checkout does not open. |
| ORD-x3 | Phone re-check on Confirm Shipping & Payment (`OrdersPage` VerifyCart) | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx. `is_phone_verified` never flips back, so this is hard to reach. |
| ORD-x4 | Phone, empty-bag and unavailable re-checks on Place Order (`PlaceOrderButtons` VerifyCart) | ❌ | — | unit only: tests/components/Cart/PlaceOrderButtons.test.tsx |
| ORD-x5 | A bag line with `check_availability: false` blocks checkout | ⚠️ | checkout.scripted.spec.ts › SCRIPT-16 | Faked backend only. |
| ORD-x6 | A country-restricted line (`is_country_restricted`) blocks checkout | ⚠️ | checkout.scripted.spec.ts › SCRIPT-17 | Faked backend only. |
| ORD-x7 | An inactive line (`is_active: false`) blocks checkout | ❌ | — | No case for the third condition. unit only: OrdersPage.test.tsx (unavailable/restricted). |
| ORD-x8 | Bag empties between the two steps, so the shopper is sent back and nothing is posted | ⚠️ | checkout.scripted.spec.ts › SCRIPT-18 | Faked backend only. |
| ORD-x9 | Checkout shows the account's default address | ✅ | shopper.live.spec.ts › BUY-01, ORD-01 "the order has a delivery address" | Waits up to 45 s; refuses a probe address. |
| ORD-x10 | Add a delivery address from the checkout when the account has none | ⚠️ | shopper.live.spec.ts › BUY-01 (branch) | Runs only when the account has no address; normally skipped. |
| ORD-x11 | No default address: shopper picks one from the saved list | ⚠️ | orderRating.live.spec.ts › CMT-09 "the order has a delivery address" (branch) | Runs only if no default exists; not forced. |
| ORD-x12 | Checkout refuses with no default address ("Please Select an Address", shake) | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx |
| ORD-x13 | Tap another saved address; core stores it as the default | ✅ | shopper.live.spec.ts › BUY-03 "tapping the probe…", "the core backend stored the tap" | Checked on screen and on core. |
| ORD-x14 | Edit an address from the checkout sheet | ✅ | shopper.live.spec.ts › BUY-03 "editing the probe…", "the core backend stored the edit" | Title field only. |
| ORD-x15 | Delete an address from the checkout (confirm modal) | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx. BUY-03 deletes through the API in teardown. |
| ORD-x16 | Address form: region picker, map pin, contact and alternative phone, validation | ❌ | — | unit only: AddAddressForm.test.tsx, SelectRegion.test.tsx, Map.test.tsx |
| ORD-x17 | Shipping method, expected delivery and delivery note on the checkout | ❌ | — | The app has no method picker; expected delivery is display only. No test. |
| ORD-x18 | Bag shipping and payable total equal the core backend's figures | ✅ | shopper.live.spec.ts › BUY-03 "the bag's shipping…", "payable total…" | Compared with this run's answer, not a fixed number. |
| ORD-x19 | A new address re-prices the bag | ✅ | shopper.live.spec.ts › BUY-03 "the shop re-priced the bag…" | |
| ORD-x20 | Review-step summary: items, shipping cost, coupon discount, total, Place Order label | ❌ | — | unit only: tests/components/Cart/PlaceOrderWidget.test.tsx |
| ORD-x21 | Unknown coupon is refused, shopper is told, total does not change | ✅ | shopper.live.spec.ts › BUY-07 | Judges the core answer, then the box, then the total. |
| ORD-x22 | Valid coupon is applied and the bag is read again | ⚠️ | checkout.scripted.spec.ts › SCRIPT-21 | Faked backend only. Staging has no coupon the suite owns. |
| ORD-x23 | Coupon from a `?coupon=` link is applied by itself, then cleared | ⚠️ | checkout.scripted.spec.ts › SCRIPT-22 | Faked backend only. |
| ORD-x24 | Empty coupon field message ("Please Enter Coupon Information") | ❌ | — | unit only: tests/components/Cart/couponElement.test.tsx |
| ORD-x25 | Cash on delivery is offered and chosen in Syria | ✅ | shopper.live.spec.ts › BUY-01, ORD-01 "cash on delivery is offered and chosen" | Seeds `sy`; offered and chosen are two separate checks. |
| ORD-x26 | No cash on delivery outside Syria | ❌ | — | No case shows it is absent in `iq` or elsewhere. |
| ORD-x27 | Pressing the chosen method again un-chooses it | ❌ | — | unit only: tests/components/Cart/PaymentMethod.test.tsx |
| ORD-x28 | Checkout refuses with no payment method chosen | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx |
| ORD-x29 | RDB wallet row: balance shown, refresh button | ❌ | — | unit only: tests/components/Cart/PaymentMethod.test.tsx |
| ORD-x30 | Balance below the total blocks checkout ("Your Balance Not meet purchase value") | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx |
| ORD-x31 | RDB payment modal: start, QR and payment code, copy, open RDB app or web, countdown | ❌ | — | unit only: RdbPaymentModal.test.tsx, tests/services/rdbPayment.test.ts. Uses real money. |
| ORD-x32 | RDB outcomes: received, failed, expired, cancelled, no internet, could not start | ❌ | — | unit only: tests/components/Cart/RdbPaymentModal.test.tsx |
| ORD-x33 | RDB cart lock sheet: continue, cancel, already paid | ❌ | — | unit only: RdbPaymentLockedSheet.test.tsx, tests/services/orderClass.test.ts |
| ORD-x34 | Card / crypto: choose, checkout returns a URL, payment iframe opens | ❌ | — | unit only: PaymentMethod.test.tsx, ModalIframe.test.tsx, orderClass.test.ts. Uses real money. |
| ORD-x35 | Tick "I read and agree to the policies and terms" | ⚠️ | shopper.live.spec.ts › BUY-01 (inside the `placeOrder` helper) | Helper ticks it and waits for `data-agreed`; not its own step. |
| ORD-x36 | Place Order refused while terms are not ticked | ❌ | — | unit only: tests/components/Cart/PlaceOrderButtons.test.tsx |
| ORD-x37 | Order placed with cash on delivery on staging and carries a number | ✅ | shopper.live.spec.ts › BUY-01, ORD-01; orderRating.live.spec.ts › CMT-09; scripted control SCRIPT-14 | Panel shown and number present are two checks. |
| ORD-x38 | A 401 during checkout is renewed and the order completes | ⚠️ | checkout.scripted.spec.ts › SCRIPT-20 | Faked backend only. |
| ORD-x39 | Order refused by the shop (500): no success panel, shopper is told | ⚠️ | checkout.scripted.spec.ts › SCRIPT-15 | Faked backend only. |
| ORD-x40 | After a failed order the bag is reloaded and the shopper goes back to the bag | ❌ | — | unit only: tests/components/Cart/OrdersPage.test.tsx. SCRIPT-15 does not assert this. |
| ORD-x41 | Success panel shows the order number | ✅ | shopper.live.spec.ts › BUY-01 "the order is placed and carries a number" | |
| ORD-x42 | Receipt number and Order Invoice on the success panel | ❌ | — | unit only: tests/components/Cart/OrderSuccess.test.tsx |
| ORD-x43 | Done / Back To HomePage clears the checkout and goes home | ⚠️ | shopper.live.spec.ts › BUY-01, ORD-01 (click only) | Clicked; the home page and the cleared state are not asserted. |
| ORD-x44 | My orders list opens from settings and shows the order with a state | ✅ | shopper.live.spec.ts › BUY-01 "the order is in the shopper's own list" | Also checks the state is not already cancelled. |
| ORD-x45 | Order list loads more pages on scroll | ⚠️ | shopper.live.spec.ts › BUY-01 (`findOrderInList`) | Scrolls only when needed; paging is not asserted. |
| ORD-x46 | Order list status filter tabs | ❌ | — | unit only: tests/components/setting/orders/OrdersListWrapper.test.tsx |
| ORD-x47 | Empty list / "No orders found for this status" | ❌ | — | unit only: tests/components/setting/orders/OrdersListWrapper.test.tsx |
| ORD-x48 | Order page opens from the list and shows its state | ✅ | shopper.live.spec.ts › BUY-01 "the order can be opened" | Opened by row click, URL checked. |
| ORD-x49 | Order lines stay collapsed until the count is tapped | ✅ | shopper.live.spec.ts › ORD-01 (`attemptCancelLine`) | Asserts the count card and then the line become visible. |
| ORD-x50 | Order page address card shows the recipient | ✅ | shopper.live.spec.ts › ORD-01 "the order offers an address change…" | Yes/no check, no address text in output. |
| ORD-x51 | Order number copy, order date, expected delivery date cards | ❌ | — | unit only: OrderNumberCard.test.tsx, OrderDateCard.test.tsx, OrderExpectedDeliveryCard.test.tsx |
| ORD-x52 | Order invoice card on the order page | ❌ | — | unit only: OrderInvoiceCard.test.tsx, OrderInvoice.test.tsx |
| ORD-x53 | "Order Not Found" page for a bad link | ❌ | — | unit only: OrderDetailsWrapper.test.tsx. Selector `orders.notFound` exists but no test uses it. |
| ORD-x54 | One group with several seller packs | ⚠️ | shopper.live.spec.ts › ORD-01 "the core backend holds its packs" | Only a one-seller order is placed. |
| ORD-x55 | Status moves to delivered (admin, then fleet) and the shopper's page shows it | ✅ | orderRating.live.spec.ts › CMT-09 "the shopper's own order page shows it delivered" | Needs QA seed plus admin and fleet logins; red on and off. |
| ORD-x56 | In-between states (e.g. `ready_to_shipping`) shown to the shopper | ❌ | — | CMT-09 reads only the final `delivered` state. |
| ORD-x57 | Push "order status changed" refreshes the list and shows a toast | ❌ | — | No e2e and no unit test found for `NotificationHandler`. |
| ORD-x58 | Push "order placed" shows a toast that links to the order | ❌ | — | No test found. |
| ORD-x59 | Cancel the whole order through the screens; the list agrees | ✅ | shopper.live.spec.ts › BUY-01 "cancelling it…", "the list agrees…" | Offered, confirmation, and state are separate checks. |
| ORD-x60 | Cancel not offered (`can_cancele_order` false) or refused by core | ❌ | — | BUY-01 only asserts that cancel is offered. |
| ORD-x61 | Cancel needs a reason; "I Disagree" closes the confirmation | ❌ | — | unit only: CancelOrderWrapper.test.tsx, OrderCancelConfirmationWindow.test.tsx |
| ORD-x62 | Cancel one order line | ✅ | shopper.live.spec.ts › ORD-01 "cancelling the only line…", "nothing of the order is still live" | Core shows quantity 0. |
| ORD-x63 | Cancel part of a line's quantity | ❌ | — | unit only: tests/components/setting/orders/CancelOrderItemWrapper.test.tsx |
| ORD-x64 | Change the order's delivery address | ✅ | shopper.live.spec.ts › ORD-01 "the order offers an address change…" | Core holds the probe on every pack. |
| ORD-x65 | Change the order's delivery note | ❌ | — | unit only: tests/components/Orders/ChangeAddressWidget.test.tsx |
| ORD-x66 | Address change not allowed (`can_update_address` false) | ❌ | — | ORD-01 goes red if this happens; there is no case for it. |
| ORD-x67 | Change a product's size, colour or quantity in an order | ❌ | — | unit only: ChangeOrderItem.test.tsx, ChangeOrderItemConfirmWindow.test.tsx, ModifyOrderItemModal.test.tsx |
| ORD-x68 | Hide a pack, see it in Hidden Orders, restore it | ✅ | shopper.live.spec.ts › ORD-01 "hiding the order…", "the hidden view…" | Checked on screen and on core. |
| ORD-x69 | Hide or restore one product line | ❌ | — | unit only: OrderItemOptions.test.tsx, HiddenOrdersWidget.test.tsx, HiddenOrderItem.test.tsx |
| ORD-x70 | Hidden Orders empty state | ❌ | — | unit only: tests/components/setting/orders/HiddenOrdersWidget.test.tsx |
| ORD-x71 | Report a product (points, note, photo, 4 MB limit) | ❌ | — | unit only: tests/components/setting/orders/ReportOrderItemWrapper.test.tsx |
| ORD-x72 | Start a return: quantity, reason, photos | ❌ | — | unit only: ReturnOrderItemWrapper.test.tsx, OrderItemReturnConfirmationWindow.test.tsx, UploadImageComponent.test.tsx |
| ORD-x73 | Confirm, update or cancel a return request | ❌ | — | unit only: OrderDetailsWrapper.test.tsx, OrderRetailsReturnInfo.test.tsx |
| ORD-x74 | Refund info ("Back To Your Wallet") on a returned or cancelled item | ❌ | — | unit only: tests/components/Orders/OrderRetailsReturnInfo.test.tsx |
| ORD-x75 | Return not allowed, or return window over | ❌ | — | unit only: tests/components/setting/orders/OrderItemOptions.test.tsx |
| ORD-x76 | Reorder / buy again | ❌ | — | No such feature in the shopper app. |
| ORD-x77 | Chat with the delivery worker from the order (`chat_id` deep link) | ❌ | — | unit only: tests/components/settings/OrderChatIcon.test.tsx |
| ORD-x78 | Rating offered only after delivery | ⚠️ | orderRating.live.spec.ts › CMT-09 | Rates after delivery; "no stars before delivery" is not asserted. unit: OrderItemsList.test.tsx |
| ORD-x79 | Rate a delivered product from the order (stars and comment) | ✅ | orderRating.live.spec.ts › CMT-09 "the shopper rates the product…" | Judged on the comments backend's answer. |
| ORD-x80 | Order page shows the stars the shopper gave | ✅ | orderRating.live.spec.ts › CMT-09 "the order page shows the stars…" | |
| ORD-x81 | Edit and delete the review | ✅ | orderRating.live.spec.ts › CMT-09 "changes the words…", "removes…", "survives a reload" | Done on the product page, not from the order. |
| ORD-x82 | "Update Rating" from the order's rating sheet | ❌ | — | unit only: tests/components/Orders/RatingOrderItem.test.tsx |
| ORD-x83 | Photo upload with a rating | ❌ | — | unit only: tests/components/Orders/RatingOrderItem.test.tsx |

**Summary:** ✅ 23 · ⚠️ 14 · ❌ 46 (83 rows). Of the ⚠️ rows, 7 run only against a faked backend (SCRIPT-15, -16, -17, -18, -20, -21, -22) and 7 are touched on staging but not fully asserted.

**Top gaps:**
- **ORD-x31 to ORD-x34: no payment other than cash on delivery runs in e2e.** That covers RDB wallet, the RDB modal and its outcomes, the RDB cart lock sheet, and card / crypto. All of it is unit only. These use real money, so a faked (scripted) case is the realistic next step.
- **ORD-x72 to ORD-x75: return and refund have no e2e at all.** CMT-09 already reaches a delivered order, so a return case could start from the same setup.
- **ORD-x57 / ORD-x58: no test of any kind for order push notifications.** "Order placed" and "order status changed" are handled in `utils/NotificationHandler.ts` and have no unit test either.
- **ORD-x12, ORD-x28, ORD-x30: no e2e for the refusals on Confirm Shipping & Payment.** No default address, no payment method, and balance too low are unit only. The live cases only ever see the happy path.
- **ORD-x67 / ORD-x71: no e2e for changing or reporting a line in a placed order.** Changing size, colour or quantity and reporting a product are both unit only.

### Login, sign-up and session
Scope: the login popup (Enhanced widget), OTP send and verify, sign-up, the sign-in fan-out to each backend, guest registration, token refresh and recovery, need_auth and re-verify prompts, and logout. The app has no social login, so there are no rows for it.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| AUTH-x1 | Open login popup from the nav login control, lands on Get Started | ✅ | auth.live.spec.ts › AUTH-01; auth.scripted.spec.ts › SCRIPT-01..05 | `openLoginWidget` asserts it opened and is on "get-started". |
| AUTH-x2 | Open login from other entry points (like button, add story, orders, profile, upload photo, wallet link card) | ❌ | — | Only the nav control is used. Unit only: LikeButtton.test.tsx, AddStory.test.tsx, WalletLinkCard.test.tsx. |
| AUTH-x3 | Get Started: "I have an account" vs "create account" | ✅ | auth.scripted.spec.ts › SCRIPT-01..04 | Real UI; only the verify call is faked. |
| AUTH-x4 | Terms screen must be agreed before the sign-up phone step | ✅ | auth.scripted.spec.ts › SCRIPT-01 | `AgreeTerms` asserts the phone field appears. |
| AUTH-x5 | "Later, take a look" / cancel links close the widget | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx. |
| AUTH-x6 | Close the widget (close button, Escape, browser back via `?login=true`) | ⚠️ | auth.live.spec.ts › AUTH-01 | Escape is pressed only as setup. Close button and back press are not tested. |
| AUTH-x7 | Back between screens, change number, change method | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx. |
| AUTH-x8 | Phone input: country found from dial code, exact digit count | ⚠️ | actions/auth.ts `enterPhone` (AUTH-01, SCRIPT-*) | Happy path only (full sy number). Flag is not asserted. Unit: RdbPhoneInput.test.tsx. |
| AUTH-x9 | Short or too-long number: no send control | ❌ | — | Unit only: RdbPhoneInput.test.tsx. |
| AUTH-x10 | Send OTP by WhatsApp (real) | ✅ | auth.live.spec.ts › AUTH-01; session-recovery.live.spec.ts › RECOV-01, RECOV-02 | `selectOtpMethod` waits for the PIN screen. |
| AUTH-x11 | Send OTP by SMS | ❌ | — | Every case uses WhatsApp. The parity spec only measures where the SMS button sits. |
| AUTH-x12 | Send refused: `send-otp-error` text shown | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx (translated fallback). |
| AUTH-x13 | Client cooldown countdown (`otp-cooldown`) on phone, method and PIN screens | ⚠️ | actions/auth.ts `sendOtpWithRetry` | The helper reads the cooldown and waits. It never asserts it. Unit: otpLocks.test.ts, EnterPinScreen.test.tsx. |
| AUTH-x14 | Session number cap (`otp-cap-reached`) | ❌ | — | Unit only: InlineVerifyPanel.test.tsx, otpLocks.test.ts. |
| AUTH-x15 | Server OTP rate limit (Redis), test-number allowlist | ❌ | — | Unit only: serverActions/sendOtp.test.ts, otpAllowlist.test.ts. |
| AUTH-x16 | `/api/proxy` refuses `send_otp` (limiter bypass) | ✅ | session.live.spec.ts › AUTH-04 | Covers POST, escaped POST and GET, one step each. |
| AUTH-x17 | Wrong OTP shows "tries left: N" | ⚠️ | auth.scripted.spec.ts › SCRIPT-05, SCRIPT-13 | Verify is faked. SCRIPT-13 asserts the exact line for each try. |
| AUTH-x18 | Three wrong codes lock the code boxes | ⚠️ | auth.scripted.spec.ts › SCRIPT-13 | Faked verify. Asserts the boxes are disabled. |
| AUTH-x19 | Throttled verify shows a message | ⚠️ | auth.scripted.spec.ts › SCRIPT-05 | Faked. Asserts only that some message appears. |
| AUTH-x20 | Server error on verify does not spend a try | ⚠️ | auth.scripted.spec.ts › SCRIPT-05 (step 3) | Asserts only "a message shows". Its comment says every failure counts, but the app code does not count it. Unit: FullEnhancedLoginWidget.test.tsx. |
| AUTH-x21 | Code expires after 120 s; resend countdown | ❌ | — | Unit only: EnterPinScreen.test.tsx. |
| AUTH-x22 | Resend code, and resend failure message | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx, InlineVerifyPanel.test.tsx. |
| AUTH-x23 | OTP success, existing account: welcome, then close | ✅ | auth.live.spec.ts › AUTH-01; auth.scripted.spec.ts › SCRIPT-02 | Asserts the screen is `welcome` or `closed`. |
| AUTH-x24 | Login with an unregistered number: not-registered screen | ⚠️ | auth.scripted.spec.ts › SCRIPT-03 | Faked verify. Bare `expect`, no message. |
| AUTH-x25 | Not-registered → "create account" → name step | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx. |
| AUTH-x26 | Sign-up with a new number: success, then name screen | ⚠️ | auth.scripted.spec.ts › SCRIPT-01 | Faked. Stops at the name screen. Live staging cannot reach it. |
| AUTH-x27 | Sign-up with a registered number: already-registered → "log in" | ⚠️ | auth.scripted.spec.ts › SCRIPT-04 | Faked. The "log in" button is never pressed. |
| AUTH-x28 | Login for an account with a placeholder name asks for the name | ❌ | — | Unit only: FullEnhancedLoginWidget.test.tsx. |
| AUTH-x29 | Name submit saves on core, chat and stories; refused → rollback | ❌ | — | Unit only: services/auth.profile.test.ts. |
| AUTH-x30 | Sign-in lands on the storefront (core), phone verified | ✅ | auth.live.spec.ts › AUTH-01 | The message wrongly passes the label `COMMENTS` for the storefront leg (`proveSignInLanded`). |
| AUTH-x31 | Chat sign-in lands | ✅ | auth.live.spec.ts › AUTH-01 | Soft check, names CHAT. |
| AUTH-x32 | Stories sign-in lands | ✅ | auth.live.spec.ts › AUTH-01 | Soft check, names STORIES. |
| AUTH-x33 | Comments sign-in lands | ✅ | auth.live.spec.ts › AUTH-01 | Judged by the token held now. |
| AUTH-x34 | Wallet sign-in lands | ✅ | auth.live.spec.ts › AUTH-01 | Red on purpose: the wallet backend answers 502. |
| AUTH-x35 | `is_failed` per-service list quoted by endpoint label | ✅ | auth.live.spec.ts › AUTH-01 | `recordSignInOutcome` quotes the app's label. Unit: login/route.test.ts. |
| AUTH-x36 | Partial sign-in: one leg refused, shopper still signed in, that leg stores nothing | ⚠️ | auth.live.spec.ts › AUTH-01 | Seen live only while the wallet is down. No faked case for each leg. Unit: login/route.test.ts. |
| AUTH-x37 | Storefront token is HttpOnly | ✅ | auth.live.spec.ts › AUTH-01; session-recovery.live.spec.ts › RECOV-01 | Boolean check only. |
| AUTH-x38 | Signed-in session survives a full reload | ✅ | auth.live.spec.ts › AUTH-02 | A backend answers the cart after the reload. |
| AUTH-x39 | First visit registers a guest (`register-device`) | ✅ | session.live.spec.ts › GUEST-32 | Both cookies are held and the app can name the guest. |
| AUTH-x40 | Guest market 401 → `/api/auth/refresh` → same guest | ✅ | session.live.spec.ts › GUEST-33 | Both tokens rotate, identity is kept, no new guest. |
| AUTH-x41 | Verified market 401 → refresh → same shopper, no prompt | ✅ | session-recovery.live.spec.ts › RECOV-01 | Uses test steps, one per AC. |
| AUTH-x42 | 401 in the middle of a save or checkout is retried | ⚠️ | profile.scripted.spec.ts › SCRIPT-10; checkout.scripted.spec.ts › SCRIPT-20 | Scripted (faked backend) only. |
| AUTH-x43 | Parallel 401s share one exchange | ❌ | — | Unit only: services/authRefreshSession.test.ts. |
| AUTH-x44 | Late 401 sent before the last rotation retries with no new exchange (`sentAt`) | ❌ | — | Unit only: authRefreshSession.test.ts, fetchData.test.ts. |
| AUTH-x45 | Guest refused pair → new guest without notice, no prompt | ✅ | session.live.spec.ts › GUEST-34 | Expire route seen; both prompts absent. |
| AUTH-x46 | Verified refused pair → "sign in again" prompt, new guest, sub-service cookies deleted | ✅ | session-recovery.live.spec.ts › RECOV-02 | Each part is its own step. |
| AUTH-x47 | Renewal refused in the middle of a save → session-expired prompt | ⚠️ | profile.scripted.spec.ts › SCRIPT-11 | Scripted only. |
| AUTH-x48 | `/api/auth/expire` last-chance renewal keeps the session (race loser) | ❌ | — | Unit only: auth.session.test.ts, expire/route.test.ts. |
| AUTH-x49 | Session-expired prompt "Log in" → OTP widget with saved phone → retry | ❌ | — | RECOV-02 stops at the prompt. Unit only: SessionExpiredWidget.test.tsx, ConfirmMobilePhoneWidget.test.tsx. |
| AUTH-x50 | Session-expired prompt "Continue as guest" → reload | ❌ | — | Unit only: SessionExpiredWidget.test.tsx. |
| AUTH-x51 | Seller dashboard 401 → prompt; a guest is sent home | ❌ | — | Seller e2e only refuses to go on if the prompt shows. Unit only: fetchData.test.ts. |
| AUTH-x52 | Server-side 401 (`HandleAuthedFetch`): exchange and retry; refused → 401, no guest | ❌ | — | Unit only: serverRequests/HandleAuthedFetch.test.ts. |
| AUTH-x53 | Page leaves during an exchange → pair lost → shopper becomes a guest | ❌ | — | `harness/renewalGate.ts` only avoids this. No case proves the app's behaviour. |
| AUTH-x54 | Chat 401 → refresh, wait 2 s, retry | ⚠️ | chat.scripted.spec.ts › SCRIPT-34 | Scripted only. |
| AUTH-x55 | Chat refresh refused → only the chat tokens cleared + verify-phone prompt | ⚠️ | chat.scripted.spec.ts › SCRIPT-35 | Scripted only. Asserts the clear-tokens list. |
| AUTH-x56 | Stories 401: refresh, or the need_auth prompt | ❌ | — | Unit only: fetchData.test.ts. |
| AUTH-x57 | Comments 401: refresh, or the need_auth prompt | ❌ | — | Unit only: fetchData.test.ts. |
| AUTH-x58 | Wallet 401 → need_auth prompt (no refresh) | ❌ | — | Unit only: fetchData.test.ts, walletReauthFlag.test.ts. |
| AUTH-x59 | need_auth: chat icon with no chat account → phone check, not the chat | ⚠️ | chat.scripted.spec.ts › SCRIPT-29 | Scripted (faked shopper) only. |
| AUTH-x60 | need_auth: guest adds a story, likes a product, links the wallet → login or verify | ❌ | — | Unit only: AddStory.test.tsx, LikeButtton.test.tsx, WalletLinkCard.test.tsx. |
| AUTH-x61 | Re-verify widget uses the account phone; success resumes the flow (open chat / story) | ❌ | — | Unit only: ConfirmMobilePhoneWidget.test.tsx, VerifyPhoneFlow.test.tsx. |
| AUTH-x62 | Re-verify widget dismissed: clears sub-service tokens, reloads (seller → home) | ❌ | — | Unit only: ConfirmMobilePhoneWidget.test.tsx. |
| AUTH-x63 | Become-seller phone re-verify | ❌ | — | No e2e found. `qaSeed.ts` only names it. |
| AUTH-x64 | Checkout inline verify panel (`OrderButton`) | ❌ | — | Unit only: InlineVerifyPanel.test.tsx. Memory says this gate may be dead code. |
| AUTH-x65 | Logout from the menu: every backend cookie gone, a new guest appears | ✅ | auth.live.spec.ts › AUTH-03 | Checks absent cookies by name, and that the account changed. |
| AUTH-x66 | Logout hidden for a shopper with no phone | ❌ | — | Unit only: Menu.test.tsx. |
| AUTH-x67 | Logout aborts in-flight requests, so a late 401 cannot bring the session back | ❌ | — | Unit only: fetchData.test.ts. |
| AUTH-x68 | Logout detaches the FCM device from chat; clears local and session storage | ❌ | — | Unit only: logout/route.test.ts. No test found for the storage clear. |
| AUTH-x69 | QR login (scan, approve) | ❌ | — | Unit only: QrLoginScreen.test.tsx, QrScannerModal.test.tsx. The service is still a mock. |

**Summary:** ✅ 20 · ⚠️ 16 · ❌ 33 (69 rows).

**Top gaps:**
- **AUTH-x49 / AUTH-x50.** No e2e presses either button on the "sign in again" prompt. RECOV-02 stops when the prompt shows, so getting the account back after a refused renewal is never tested in a browser.
- **AUTH-x56 / AUTH-x57 / AUTH-x58.** The stories, comments and wallet 401 paths (refresh, then the need_auth prompt) have no e2e. Only chat has one, and it is scripted.
- **AUTH-x22 / AUTH-x21.** Resend OTP and the 120 s code life have no e2e. Shoppers hit these often.
- **AUTH-x43 / AUTH-x53.** No browser test checks that parallel 401s share one exchange. No test covers the pair being lost when the page leaves during an exchange. Both are known causes of a lost session.
- **AUTH-x2 / AUTH-x60.** The login popup and need_auth prompts are opened only from the nav control. Protected actions (like, add story, wallet link, profile) never open them in e2e.

**Test defects found (no status change):**
- **Wrong label in `proveSignInLanded`.** The storefront leg in `tests/e2e/actions/auth.ts` (about line 977) passes the label `COMMENTS` to the failure message. If the core backend fails, the message can name the wrong backend.
- **SCRIPT-05 comment does not match the app.** The comment says a server error spends a try. `FullEnhancedLoginWidget.tsx` does not count a server error as a try.

### Profile and account
Scope: the settings home card, the profile screens (info, size, picture, address, bank cards), phone change and verify, language and country, notification settings, the seller entry, the wallet card, logout, and the guest view. Orders and the checklist are in their own sections.

**Not in the app code (no row):**
- No followed shops, "my reviews" screen, delete account, or birthday field. Each appears only in `components/DemoApp1`.
- The wallet profile leg is commented out in `services/auth.ts`.
- The profile save writes no copy to the comments backend.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| PROF-x1 | Settings card shows the signed-in shopper's own name and phone, not a guest | ✅ | profile.live.spec.ts › PROF-01 | Compares the name with the account. Uses soft expects. |
| PROF-x2 | Card shows "Verified" for a verified account, not "Verify Now" | ✅ | profile.live.spec.ts › PROF-01 | Checks both flags. |
| PROF-x3 | "Verify Now" on the card opens the re-verify overlay (unverified number) | ❌ | — | unit only: tests/components/setting/profile/VerifyUser.test.tsx |
| PROF-x4 | Card QR button scans a code and opens the sign-in approval sheet | ❌ | — | unit only: tests/components/setting/profile/index.test.tsx |
| PROF-x5 | Card "Add Size" link opens the size screen | ❌ | — | unit only: tests/components/setting/profile/index.test.tsx |
| PROF-x6 | Card picture link opens the picture screen | ✅ | profile.live.spec.ts › PROF-06 | Finds the link by href, because the links have no accessible name. |
| PROF-x7 | Profile page (/settings/profile): photo plus links to Info, Size, Address, Bank Cards | ❌ | — | unit only: tests/app/settings/pages.test.tsx. E2E opens these screens by URL. |
| PROF-x8 | Bank Cards page (back bar only, no content) | ❌ | — | unit only: tests/app/settings/pages.test.tsx |
| PROF-x9 | Personal info form is filled from the account (name, phone) | ✅ | profile.live.spec.ts › PROF-01 | Checks the content, not only that a field exists. |
| PROF-x10 | Change the name and save | ✅ | profile.live.spec.ts › PROF-02 | Puts the name back in `finally`. |
| PROF-x11 | One save fans out to stories, chat and core, and each leg is judged on its own | ✅ | profile.live.spec.ts › PROF-02, PROF-03, PROF-04 | `the ${leg} backend took the change` steps. Wallet leg is commented out in code. |
| PROF-x12 | Gender, e-mail and alternative phone save and survive a reload | ✅ | profile.live.spec.ts › PROF-03 | One check per field. |
| PROF-x13 | After a save the app moves on, and its stored copy (cookie) keeps the value after a reload | ✅ | profile.live.spec.ts › PROF-02, PROF-03, PROF-04 | A reload proves only the app's own copy. |
| PROF-x14 | Backends' own copy still holds the new name and picture after sign-out and sign-in | ✅ | profile.live.spec.ts › PROF-08 | Red on purpose per the doc: the stories/chat row mismatch. |
| PROF-x15 | Name validation: empty, or under 8 characters | ❌ | — | unit only: tests/components/setting/profile/PersonalInfoForm.test.tsx |
| PROF-x16 | Phone validation: cleared or invalid number | ❌ | — | unit only: PersonalInfoForm.test.tsx |
| PROF-x17 | E-mail format check (optional when empty) | ❌ | — | unit only: PersonalInfoForm.test.tsx |
| PROF-x18 | No gender chosen blocks the save | ❌ | — | unit only: PersonalInfoForm.test.tsx. PROF-02 only checks the precondition. |
| PROF-x19 | Backend field refusal is shown under its input, and the typed values are kept | ❌ | — | unit only: PersonalInfoForm.test.tsx |
| PROF-x20 | One backend refuses the save: not reported as done, and the shopper is told once | ⚠️ | profile.scripted.spec.ts › SCRIPT-07 | Scripted only: a faked core 500. |
| PROF-x21 | Legs that finished are rolled back when a later leg fails | ⚠️ | profile.scripted.spec.ts › SCRIPT-07 | Checks only that each leg was asked, not the rollback. unit: tests/services/auth.profile.test.ts |
| PROF-x22 | Shopper with no chat record: chat leg is skipped, and the save completes | ⚠️ | profile.scripted.spec.ts › SCRIPT-08 | Scripted only. |
| PROF-x23 | Credential refused (401) mid-save is renewed, and the retry carries the new value | ⚠️ | profile.scripted.spec.ts › SCRIPT-10 | Scripted only. |
| PROF-x24 | Renewal also fails: the shopper is asked to sign in again | ⚠️ | profile.scripted.spec.ts › SCRIPT-11 | Scripted only. |
| PROF-x25 | Size screen saves height and weight, and they survive a reload | ✅ | profile.live.spec.ts › PROF-04 | Fan-out checked per leg. |
| PROF-x26 | Size validation: required, 110–250 cm, 40–180 kg | ❌ | — | unit only: tests/components/settings/ProfileSizeInfo.test.tsx |
| PROF-x27 | Upload a picture, then remove it (media store and stored copy) | ✅ | profile.live.spec.ts › PROF-05 | Skips when the media store env is not set. |
| PROF-x28 | Refused picture upload is reported, and nothing is saved | ⚠️ | profile.scripted.spec.ts › SCRIPT-09 | Scripted only. |
| PROF-x29 | Photo crop/drag, take photo with the camera, choose from library | ❌ | — | unit only: tests/components/settings/UploadProfilePhoto.test.tsx |
| PROF-x30 | Changing the phone asks for an OTP confirmation, then the save carries it | ⚠️ | profile.scripted.spec.ts › SCRIPT-12 | Legs are faked. Only the code send is real. |
| PROF-x31 | Phone change: wrong code, or the overlay is closed | ❌ | — | SCRIPT-05 covers the login PIN only. unit: PersonalInfoForm.test.tsx |
| PROF-x32 | Real phone change reaches the backends | ❌ | — | Not run live, because it would change the shared account. |
| PROF-x33 | Address list shows saved addresses with their details | ✅ | profile.live.spec.ts › PROF-07 | `addressIsListed` checks the detail text. |
| PROF-x34 | Add an address from the profile (region from list, detail, title, recipient, phone) | ✅ | profile.live.spec.ts › PROF-07 | Checks that the list grew and that the content is right. |
| PROF-x35 | Empty address list message | ❌ | — | unit only: tests/components/settings/PersonalInfoAddress.test.tsx |
| PROF-x36 | Address form validation shakes the missing field | ❌ | — | unit only: tests/components/Cart/AddAddressForm.test.tsx |
| PROF-x37 | Backend refuses a new address, so nothing is listed | ❌ | — | unit only: AddAddressForm.test.tsx |
| PROF-x38 | Edit an address from the profile list (edit icon) | ⚠️ | shopper.live.spec.ts › BUY-03 | BUY-03 edits from the checkout sheet. The profile edit icon is never clicked. |
| PROF-x39 | Delete an address with the confirm modal | ⚠️ | profile.live.spec.ts › PROF-07 | Only cleanup in `finally`, a soft check, on the UI list only. Backend not checked. |
| PROF-x40 | Set the default address from the profile | ❌ | — | No UI: the tap handler is commented out in PersonalInfoAddress.tsx. Tests use the API. |
| PROF-x41 | Default address is highlighted in the list | ❌ | — | No check anywhere. |
| PROF-x42 | Map pin pick and country border | ❌ | — | unit only: tests/components/Cart/Map.test.tsx, MapElement.test.tsx |
| PROF-x43 | Region search by text | ❌ | — | unit only: tests/components/Cart/SelectRegion.test.tsx |
| PROF-x44 | A shopper with no name is asked for one on the address form | ❌ | — | unit only: AddAddressForm.test.tsx |
| PROF-x45 | Language picked in settings changes the URL, the cookie and `<html lang>`, and back | ✅ | locale.live.spec.ts › GUEST-50 | Guest only. |
| PROF-x46 | Language Save is hidden when the language is unchanged | ❌ | — | unit only: tests/components/settings/LanguageSetting.test.tsx |
| PROF-x47 | Country picked with confirm changes the URL, the cookie and the flag, and back | ✅ | locale.live.spec.ts › GUEST-51 | Guest only. |
| PROF-x48 | Cancel in the country confirm keeps the old country | ❌ | — | unit only: tests/components/settings/PersonalInfoCountries.test.tsx |
| PROF-x49 | Starter settings refused on a country change: the app does not move | ❌ | — | unit only: PersonalInfoCountries.test.tsx |
| PROF-x50 | Signed-in shopper changes language or country | ❌ | — | Only the guest path is covered. |
| PROF-x51 | Notification settings load from core | ❌ | — | unit only: tests/components/Home/SettingsModal.test.tsx |
| PROF-x52 | Topic subscribe / unsubscribe | ❌ | — | unit only: SettingsModal.test.tsx |
| PROF-x53 | E-mail / Firebase / WhatsApp toggles save, and go back on failure | ❌ | — | unit only: SettingsModal.test.tsx |
| PROF-x54 | Notification frequency select saves | ❌ | — | unit only: SettingsModal.test.tsx |
| PROF-x55 | Notification Test tab | ❌ | — | unit only: tests/components/global/NotificationsTest.test.tsx |
| PROF-x56 | Shop owner sees the Sales card, which opens the seller profile | ✅ | sellerDashboard.live.spec.ts › SD-01 | Also asserts the permissions error is hidden. |
| PROF-x57 | Seller permissions fail: error and Retry | ❌ | — | unit only: tests/components/settings/GoToSellerDashBoard.test.tsx |
| PROF-x58 | Account with no shop sees "Become A Seller At Trydos" | ❌ | — | unit only: GoToSellerDashBoard.test.tsx |
| PROF-x59 | Become-seller modal: pending, rejected and approved status screens | ❌ | — | unit only: tests/components/settings/BecomeSellerModal.test.tsx |
| PROF-x60 | Become-seller form: validation, document upload, submit | ⚠️ | harness/qaSeed.ts + qaLock.live.spec.ts › QA-03 | The seed posts the request by API, once per environment. The modal is never driven. |
| PROF-x61 | Become-seller submit with an unverified phone asks to re-verify, then retries | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| PROF-x62 | Guest sees no seller entry | ❌ | — | unit only: GoToSellerDashBoard.test.tsx |
| PROF-x63 | Wallet card shows the balance and symbol | ❌ | — | unit only: tests/components/setting/WalletLinkCard.test.tsx |
| PROF-x64 | Wallet balance fails: message and Retry | ❌ | — | unit only: WalletLinkCard.test.tsx |
| PROF-x65 | Wallet card tap opens the "Under Development" sheet and fetches the wallet token | ❌ | — | unit only: WalletLinkCard.test.tsx |
| PROF-x66 | Wallet transactions page: list, Load More, open an order | ❌ | — | unit only: tests/components/settings/WalletTransactions.test.tsx |
| PROF-x67 | Sign out from the account menu removes the whole session | ✅ | auth.live.spec.ts › AUTH-03 | Also a step in PROF-08. Signs out on /about, not settings. |
| PROF-x68 | Sign out while on /settings goes to the home page | ❌ | — | That code branch is in Menu.tsx. No e2e signs out on settings. |
| PROF-x69 | Logout item is hidden for a guest | ❌ | — | unit only: tests/components/Home/Menu.test.tsx |
| PROF-x70 | Guest settings card shows "Login", and a tap opens sign-in | ❌ | — | unit only: tests/components/setting/profile/index.test.tsx |
| PROF-x71 | Guest on the info, size or photo screen: faded, and taps open sign-in | ❌ | — | unit only: PersonalInfoForm.test.tsx, UploadProfilePhoto.test.tsx |
| PROF-x72 | Guest wallet card tap opens sign-in | ❌ | — | unit only: WalletLinkCard.test.tsx |
| PROF-x73 | Settings menu links (Settings, Terms; Legal, About, Share App point to "#") | ❌ | — | unit only: tests/app/settings/pages.test.tsx. Three links are dead. |
| PROF-x74 | Back bar on a static page lands on settings | ✅ | staticPages.live.spec.ts › GUEST-41 | Checks the URL only. |

**Summary:** ✅ 18 · ⚠️ 10 · ❌ 46 (74 rows)

**Top gaps:**
1. **PROF-x51 to PROF-x55: notification settings.** No browser test saves a toggle, a topic or the frequency against core. A refused save that does not go back is unseen outside unit tests.
2. **PROF-x70 to PROF-x72: guest view of the profile.** No e2e test checks that a guest sees "Login" and gets the sign-in surface, not a broken form.
3. **PROF-x58 / PROF-x59: become a seller.** The settings card and the modal (form, status screens) are never driven. The seed uses the API only.
4. **PROF-x40 / PROF-x41: default address in the profile.** There is no way to set the default from the profile (the code is commented out), and nothing checks the highlight. Edit and delete from the profile list are also only partly covered (PROF-x38, PROF-x39).
5. **PROF-x63 to PROF-x65: wallet card.** Balance, error with Retry, and the sheet have no browser check, so a dead wallet on the settings page goes unnoticed.

### Comments, reviews and reactions
Scope: product questions (FAQ) and shop answers, reviews from a delivered order, likes on products, questions and answers, the seller dashboard Comments section, the comments token, and Elasticsearch lag.

These features are not in the app code, so they have no rows: report a comment, dislike or emoji reactions, story likes, shop likes. "dislike" shows up only as a GA label on the product unlike. Reporting a story (`ReportStoryModal`) is in the Stories section.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| CMT-x1 | Shopper likes the product (footer heart) | ✅ | comments.live.spec.ts › CMT-01 "the comments backend accepted the product like" | Judged on the `/products/like` answer and the filled heart |
| CMT-x2 | Shopper unlikes the product | ✅ | comments.live.spec.ts › CMT-08 "the product like is removed" | |
| CMT-x3 | Product like or unlike survives a reload | ✅ | comments.live.spec.ts › CMT-06, CMT-08 | Bounded `checkpoint` reloads |
| CMT-x4 | A refused product like rolls back and shows an error | ❌ | — | unit only: ProductLikeButton.test.tsx |
| CMT-x5 | Seller sees the shopper's like in the product card's reaction count | ✅ | comments.live.spec.ts › CMT-03 | Walks the grid pages; `/api/seller/comments/social` |
| CMT-x6 | Ask a question in the in-page FAQ (`FaqAskInput`) | ✅ | comments.live.spec.ts › CMT-01 "a question asked in the page FAQ section" | Judged on the create answer |
| CMT-x7 | Ask a question in the extended area (`CommentBar`) | ✅ | comments.live.spec.ts › CMT-01 "a question asked in the extended area" | |
| CMT-x8 | The two asks create two different questions | ✅ | comments.live.spec.ts › CMT-01 | Asserts the ids differ |
| CMT-x9 | Guest: ask box is read-only and says "Please log in first" | ❌ | — | unit only: FaqAskInput.test.tsx |
| CMT-x10 | Guest in extended area: "Please Login so You Can Add a comment", no bar | ❌ | — | unit only: CommentSection.test.tsx |
| CMT-x11 | Unverified phone: "Please Verify Your Phone Number", nothing sent | ❌ | — | unit only: FaqAskInput.test.tsx, CommentBar.test.tsx |
| CMT-x12 | Empty box not sent; Enter sends; 200-character cap | ❌ | — | unit only: CommentBar.test.tsx, FaqAskInput.test.tsx |
| CMT-x13 | A refused ask keeps the text and logs the error | ❌ | — | unit only: CommentBar.test.tsx, FaqAskInput.test.tsx |
| CMT-x14 | Edit own question in the in-page FAQ | ✅ | comments.live.spec.ts › CMT-02 "the page question is edited" | |
| CMT-x15 | Edit own question from the extended area | ✅ | comments.live.spec.ts › CMT-02 "the extended-area question is edited" | |
| CMT-x16 | Question edits survive a reload | ✅ | comments.live.spec.ts › CMT-02, CMT-06 | |
| CMT-x17 | Edit is hidden once the shop has answered | ✅ | comments.live.spec.ts › CMT-05 "an answered question offers no Edit" | |
| CMT-x18 | Edit/Delete are hidden on other shoppers' comments | ❌ | — | unit only: BuyersCommentMenu.test.tsx |
| CMT-x19 | Delete own question through the confirm step | ✅ | comments.live.spec.ts › CMT-08 "each question is deleted" | Both deleted from the in-page section; delete from the extended area is not driven |
| CMT-x20 | Question delete sticks after a reload | ✅ | comments.live.spec.ts › CMT-08 "a reload keeps the deletes and the unlike" | |
| CMT-x21 | Translate a question, then Show Original | ⚠️ | comments.live.spec.ts › CMT-02 "the comments backend answered the translate call" | Only checks status < 400. Translated text and Show Original not asserted |
| CMT-x22 | Translate the shop's answer (`BuyersReplyMenu`) | ❌ | — | unit only: BuyersReplyMenu.test.tsx |
| CMT-x23 | "Waiting Seller Reply..." on an unanswered question (shopper side) | ❌ | — | unit only: FaqItemComponent.test.tsx |
| CMT-x24 | In-page FAQ Load More (paging by offset) | ❌ | — | unit only: FaqQuestionsList.test.tsx |
| CMT-x25 | Extended-area comments Load More | ❌ | — | unit only: CommentSection.test.tsx |
| CMT-x26 | FAQ sheet (`FaqSectionModal`): list, filter, Load More, edit/delete | ❌ | — | unit only: FaqSectionModal.test.tsx |
| CMT-x27 | Footer comment count is read again after an ask | ❌ | — | unit only: ProductCommentButton.test.tsx |
| CMT-x28 | One edit/like/delete shows in every widget at once (shared store) | ❌ | — | unit only: commentsReducer.test.ts; e2e reads only after a reload |
| CMT-x29 | Like a question; the count moves by one | ✅ | comments.live.spec.ts › CMT-02 "each question is liked" | `setHeart` checks `data-liked` and count +1 |
| CMT-x30 | Like the shop's answer | ✅ | comments.live.spec.ts › CMT-05 "each answer is liked" | |
| CMT-x31 | Unlike a question and an answer | ✅ | comments.live.spec.ts › CMT-07 "every like is removed" | |
| CMT-x32 | Comment and answer likes survive a reload | ✅ | comments.live.spec.ts › CMT-06, CMT-07 | Only the reload can see a refused unlike |
| CMT-x33 | Guest taps a comment heart: login opens, "Please Login First" | ❌ | — | unit only: LikeButtton.test.tsx |
| CMT-x34 | A refused comment like rolls back | ❌ | — | unit only: LikeButtton.test.tsx. `home.LikeComment` ignores the answer, so a 200 refusal never rolls back |
| CMT-x35 | Like a review card | ❌ | — | e2e likes only questions and answers. unit only: LikeButtton.test.tsx |
| CMT-x36 | Seller opens the Comments section (READ_COMMENTS) | ✅ | comments.live.spec.ts › CMT-04 "the seller is offered the comments section" | Tells "access denied" apart from "never loaded" |
| CMT-x37 | Comments tab is withheld without READ_COMMENTS | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Fake permissions answer. Checks the tile only; direct-link refusal is checked for locations only |
| CMT-x38 | A new question reaches the seller list despite ES lag | ✅ | comments.live.spec.ts › CMT-04 (`findQuestionCard`) | Opens the section again up to 4 times, 15 s apart |
| CMT-x39 | Seller answers a question | ✅ | comments.live.spec.ts › CMT-04 | Card must carry this run's mark and have no answer yet |
| CMT-x40 | The shop's answer reaches the shopper | ✅ | comments.live.spec.ts › CMT-05 "both answers are on the product page" | Checks the answer text |
| CMT-x41 | Seller edits an answer; the shopper sees the edit | ✅ | comments.live.spec.ts › CMT-10, CMT-11 | |
| CMT-x42 | Seller deletes an answer (confirm); the question stays | ✅ | comments.live.spec.ts › CMT-10, CMT-11 | |
| CMT-x43 | A refused reply keeps the reply form open | ❌ | — | e2e has the success path only. unit only: CommentsTab.test.tsx |
| CMT-x44 | Empty or spaces-only answer is not sent | ❌ | — | unit only: CommentsTab.test.tsx |
| CMT-x45 | Reply / Edit Reply / Delete Reply hidden without their permission | ❌ | — | unit only: CommentsTab.test.tsx |
| CMT-x46 | Reviews sub-tab ("Reviewing") shows stars and offers no reply | ❌ | — | unit only: CommentsTab.test.tsx |
| CMT-x47 | Seller comments Load More | ❌ | — | unit only: CommentsTab.test.tsx |
| CMT-x48 | Seller empty state "No comments found." | ❌ | — | unit only: CommentsTab.test.tsx |
| CMT-x49 | Product name and variant on each seller comment card | ❌ | — | unit only: CommentProductInfo.test.tsx |
| CMT-x50 | Server-side permission check and shop binding for seller comments | ❌ | — | unit only: tests/services/elastic/sellerComments.test.ts, tests/app/api/seller/comments/* |
| CMT-x51 | Rating stars drawn only for a delivered, not-returned line | ⚠️ | orderRating.live.spec.ts › CMT-09 | Proves delivered shows stars. "Hidden otherwise" not asserted; unit: OrderItemsList.test.tsx |
| CMT-x52 | Write a review from the order (stars + words) | ✅ | orderRating.live.spec.ts › CMT-09 "the shopper rates the product they were sent" | Judged on the create answer; sheet closes |
| CMT-x53 | Send stays disabled until stars and words are given | ⚠️ | orderRating.live.spec.ts › CMT-09 | Checks enabled after filling only. Disabled state: unit only RatingOrderItem.test.tsx |
| CMT-x54 | Order page shows the stars given (order_rating feed) | ✅ | orderRating.live.spec.ts › CMT-09 "the order page shows the stars the shopper gave" | Polled, up to 90 s |
| CMT-x55 | A refused review keeps the rating sheet open | ❌ | — | unit only: RatingOrderItem.test.tsx |
| CMT-x56 | Rate again from the order page (update an earlier rating) | ❌ | — | unit only: RatingOrderItem.test.tsx |
| CMT-x57 | Photos in a review (upload, remove, 5 MB / 5-photo limits) | ❌ | — | unit only: UploadImageComponent.test.tsx, RatingCommentOptions.test.tsx |
| CMT-x58 | A review is possible only after purchase | ⚠️ | orderRating.live.spec.ts › CMT-09 | Positive path only. No check that a non-buyer is refused |
| CMT-x59 | The order links to the bought product | ✅ | orderRating.live.spec.ts › CMT-09 "the product page is reached from the order" | |
| CMT-x60 | The review shows in the product's Buyers Comment section | ✅ | orderRating.live.spec.ts › CMT-09 "the review is in the product's Buyers Comment section" | Bounded reloads for ES; checks the words |
| CMT-x61 | Edit own review text from the product page | ✅ | orderRating.live.spec.ts › CMT-09 "the shopper changes the words of their own review" | |
| CMT-x62 | Edit the review's stars | ⚠️ | orderRating.live.spec.ts › CMT-09 | Sends 4 stars, never reads them back |
| CMT-x63 | Update Rating stays disabled until something changes | ❌ | — | unit only: RatingCommentOptions.test.tsx |
| CMT-x64 | Delete own review through the confirm step | ✅ | orderRating.live.spec.ts › CMT-09 "the shopper removes their own review" | |
| CMT-x65 | Review delete survives a reload (ES skips `status: deleted`) | ✅ | orderRating.live.spec.ts › CMT-09 "the removal survives a reload" | 6 × 10 s, reads at `load` |
| CMT-x66 | Translate a review | ❌ | — | unit only: BuyersCommentMenu.test.tsx |
| CMT-x67 | Reviews Load More (5 per page) | ❌ | — | unit only: ProductBuyersCommentList.test.tsx |
| CMT-x68 | Buyers Comment sheet with filter keys | ❌ | — | unit only: BuyersCommentModal.test.tsx |
| CMT-x69 | Recommend / Don't Recommend summary bar | ❌ | — | unit only: BuyerCommentRateInfo.test.tsx |
| CMT-x70 | Review tags: Good Quality, True Size, Recommend It | ❌ | — | unit only: BuyerCommentRateInfo.test.tsx |
| CMT-x71 | Product average rating stars (`final_rating`) | ❌ | — | unit only: ProductRating.test.tsx |
| CMT-x72 | "Buyers Reviews On Product Sizing" block | ❌ | — | unit only: ProductSizeReviews.test.tsx |
| CMT-x73 | Buyers Comment section hidden when there are no reviews | ❌ | — | unit only: ProductBuyersCommentsWrapper.test.tsx |
| CMT-x74 | Sign-in writes the comments session (`USER_ID_HASH`, `COMMENTS-REFRESH-TOKEN`) | ⚠️ | auth.live.spec.ts › AUTH-01 (`proveSignInLanded`) | Checks only that the `USER_ID_HASH` name exists. Refresh cookie and content not checked. AUTH-01 stays red (wallet 502) |
| CMT-x75 | Comments 401 → exchange, wait 2 s, retry | ⚠️ | all CMT writes via `watchCommentCall` | Accepts a 401 then judges the retry, but never forces one. unit only: fetchData.test.ts, authRefresh.test.ts |
| CMT-x76 | Refused comments exchange → `need_auth` prompt | ❌ | — | unit only: tests/utils/fetchData.test.ts |
| CMT-x77 | Refused market exchange deletes the comments cookies | ⚠️ | session-recovery.live.spec.ts › RECOV-02 | Checks `USER_ID_HASH` only; `COMMENTS-REFRESH-TOKEN` not in its list |
| CMT-x78 | Read after write waits for Elasticsearch, so a slow index is not called a lost write | ✅ | comments.live.spec.ts › CMT-02/05/06/07/08/11; orderRating.live.spec.ts › CMT-09 | `checkpoint`: 6 reloads, 10 s apart, 60 s bound |

**Summary:** ✅ 31 · ⚠️ 9 · ❌ 38 (78 rows).
- CMT-09 (orderRating.live.spec.ts) is on and off red. So rows CMT-x51 to CMT-x65 are only as reliable as that one case.
- The line numbers in E2E_SCENARIOS.md are out of date. Real test lines: CMT-01 :299, CMT-02 :381, CMT-03 :508, CMT-04 :550, CMT-05 :592, CMT-06 :672, CMT-07 :760, CMT-10 :847, CMT-11 :886, CMT-08 :948, and CMT-09 is at orderRating.live.spec.ts:241.

**Top gaps:**
1. **CMT-x9 / CMT-x10 / CMT-x33:** no e2e test has a guest try to comment or like, so the login prompt is never seen in a browser.
2. **CMT-x75 / CMT-x76:** the comments 401 → 2 s retry, and the refused-exchange `need_auth` path, are never forced in a browser. The suite only puts up with a 401 when one happens.
3. **CMT-x57:** photos in a review are not covered end to end (upload goes to the rating folder, sent as `comments_images_customer`).
4. **CMT-x45 / CMT-x46:** the seller's per-permission gates and the Reviews sub-tab are covered only by unit tests.
5. **CMT-x34:** a refused comment like is not tested in a browser. Also, `home.LikeComment` ignores the backend answer, so a 200 refusal never rolls back.

### Chat
Shopper-to-shopper chat (the QA seller acts as Shopper B): opening it, the list, the conversation, message actions, the details drawer, realtime parts, calls, the delivery chat, and chat tokens. The app has no "chat with seller" button on a product or shop page, and no "report user" action. So neither has a row.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| CHAT-x1 | A signed-in shopper opens the chat from the nav icon (notifications granted) | ✅ | chat.live.spec.ts › CHAT-01 | Real chat backend. Opens past the notification gate. |
| CHAT-x2 | The chat part of the sign-in lands (chat token + chat user) | ✅ | auth.live.spec.ts › AUTH-01; chat.live.spec.ts › CHAT-01 | Names the CHAT leg when it is missing. |
| CHAT-x3 | A guest presses the chat icon → the sign-in opens | ❌ | — | unit only: tests/components/Home/AuthNavSection.test.tsx |
| CHAT-x4 | A verified shopper with no chat account → phone check, not the chat | ⚠️ | chat.scripted.spec.ts › SCRIPT-29 | Faked chat backend only. |
| CHAT-x5 | Browser refuses notifications → shopper is told, chat stays shut | ⚠️ | chat.scripted.spec.ts › SCRIPT-27 | Faked backend only. |
| CHAT-x6 | Browser not asked yet → "allow notifications" window first | ⚠️ | chat.scripted.spec.ts › SCRIPT-28 | Faked backend only. |
| CHAT-x7 | Firebase push token fails → open chat turns into "Please Enable Notification" | ❌ | — | Known bug CHAT-APP-3. No reliable trigger. |
| CHAT-x8 | Close the chat window (X), which also clears a pending forward | ❌ | — | unit only: tests/components/Chat/pages/ChatWindow.test.tsx |
| CHAT-x9 | The chat list loads from the chat backend | ✅ | chat.live.spec.ts › CHAT-01 | |
| CHAT-x10 | Each row shows its own unread count | ✅ | chat.live.spec.ts › CHAT-04; chat.scripted.spec.ts › SCRIPT-30 | Live: B's row has a positive count. |
| CHAT-x11 | Nav icon badge counts chats with unread messages | ⚠️ | chat.scripted.spec.ts › SCRIPT-30 | Faked only. No live check of the nav badge. |
| CHAT-x12 | A pinned chat is listed first, with a pin mark | ✅ | chat.live.spec.ts › CHAT-11 | Also SCRIPT-31. |
| CHAT-x13 | Other chats are ordered newest first | ⚠️ | chat.scripted.spec.ts › SCRIPT-31 | Faked only. |
| CHAT-x14 | Load more chats when the list is long (GetMoreChats) | ❌ | — | unit only: tests/components/Chat/components/GetMoreChats.test.tsx |
| CHAT-x15 | Delivery-worker chats are kept out of the main list | ❌ | — | Filter in ChatLists.jsx line 68. No test found. |
| CHAT-x16 | Find a person by phone in the list search and open the conversation | ✅ | chat.live.spec.ts › CHAT-02 | Checks the chat id against the backend's list. |
| CHAT-x17 | List search filters chats by name | ❌ | — | unit only: ChatListSearch.test.tsx, pages/ChatLists.test.tsx |
| CHAT-x18 | Search text typed before the list loads is wiped | ❌ | — | Known bug CHAT-APP-4. Live cases wait it out. |
| CHAT-x19 | Invite a person who is not on the app | ❌ | — | unit only: tests/components/Chat/components/SearchResult.test.tsx |
| CHAT-x20 | First message to a new contact creates the chat (`ch-<id>` placeholder) | ⚠️ | chat.live.spec.ts › CHAT-02 | Only checks the placeholder id. Usually A already has the chat. |
| CHAT-x21 | Contacts list (contacts icon) and "No Contacts" empty state | ❌ | — | unit only: pages/ContactLists.test.tsx, pages/ChatWindow.test.tsx |
| CHAT-x22 | Add a contact by hand / sync phone contacts, and their errors | ❌ | — | unit only: components/ChatContactsUpload.test.tsx |
| CHAT-x23 | Calls tab (call log) | ❌ | — | unit only: tests/components/Chat/CallList.test.tsx |
| CHAT-x24 | Stories tab in the chat (paging, "No more stories") | ❌ | — | unit only: tests/components/Chat/pages/StoriesList.test.tsx |
| CHAT-x25 | Pin and unpin a chat from the row | ✅ | chat.live.spec.ts › CHAT-11 | Saved, and still there after a reload. |
| CHAT-x26 | A fourth pin is refused (3-pin limit) | ⚠️ | chat.scripted.spec.ts › SCRIPT-37 | Strict `test.fail`, bug CHAT-APP-2. Faked only. |
| CHAT-x27 | Mute and unmute a chat | ✅ | chat.live.spec.ts › CHAT-12 | Checks the backend flag after a reload. The row's mute icon is not checked. |
| CHAT-x28 | A muted chat raises no notification | ❌ | — | unit only: tests/utils/chatMuteNotifications.test.ts |
| CHAT-x29 | Mark a chat unread, then read | ✅ | chat.live.spec.ts › CHAT-13 | |
| CHAT-x30 | Archive and unarchive; the Archived folder shows the chat | ✅ | chat.live.spec.ts › CHAT-14 | |
| CHAT-x31 | Empty folders: "No archived chats" / "No reminders" | ❌ | — | No test found. |
| CHAT-x32 | Archive / unread refused → toast | ❌ | — | unit only: tests/store/chatSendMessage.test.ts |
| CHAT-x33 | Delete a chat from the row, confirm it; the other person keeps it | ✅ | chat.live.spec.ts › CHAT-16 | |
| CHAT-x34 | Delete chat: Cancel, and deleting from the details drawer | ❌ | — | unit only: tests/components/Chat/DeleteChatConfirm.test.tsx |
| CHAT-x35 | Send a text with Enter; the backend saves it with an id | ✅ | chat.live.spec.ts › CHAT-03 | Still there after a reload. |
| CHAT-x36 | Send a text with the send button | ❌ | — | No e2e uses `how: "button"`. unit only: pages/ConversationContainer.test.tsx |
| CHAT-x37 | Blank text is not sent | ❌ | — | unit only: pages/ConversationContainer.test.tsx |
| CHAT-x38 | Message status moves from "sending" to sent | ✅ | chat.live.spec.ts › CHAT-03 | The local id swaps for the saved id. |
| CHAT-x39 | Read receipt: the other person reads it and the sender sees "read" | ✅ | chat.live.spec.ts › CHAT-04 | `data-status="watched"` after a reload. |
| CHAT-x40 | Send refused (HTTP error) → message removed, shopper told | ⚠️ | chat.scripted.spec.ts › SCRIPT-32 | Faked 500 only. |
| CHAT-x41 | Send refused inside a 200 | ⚠️ | chat.scripted.spec.ts › SCRIPT-33 | Strict `test.fail`, bug CHAT-APP-1. |
| CHAT-x42 | Scroll to the top loads older messages | ⚠️ | chat.scripted.spec.ts › SCRIPT-41 | Faked only. |
| CHAT-x43 | Send an image: gallery → crop → preview → send | ❌ | — | unit only: ConversationContainer.test.tsx, ChatImagePreviewBeforeSend.test.tsx |
| CHAT-x44 | Send a video; a non-media file or an unplayable video is refused | ❌ | — | unit only: tests/components/Chat/chatVideoFormatGate.test.ts |
| CHAT-x45 | Send a document (plus button) | ❌ | — | unit only: pages/ConversationContainer.test.tsx |
| CHAT-x46 | A file over 25 MB is refused before upload | ⚠️ | chat.scripted.spec.ts › SCRIPT-40 | Faked only. Also unit: chatUploadSizeCap.test.ts |
| CHAT-x47 | Upload fails → pending bubble removed + toast; cancel an upload | ❌ | — | unit only: ConversationContainer.test.tsx, messages/Types/*.test.tsx |
| CHAT-x48 | Camera photo/video; camera permission refused | ❌ | — | unit only: CameraComponent.test.tsx, ConversationContainer.test.tsx |
| CHAT-x49 | Voice note: record, cancel, send; "No available Microphone" | ❌ | — | unit only: pages/ConversationContainer.test.tsx |
| CHAT-x50 | Show received image/video/file/audio messages, and download | ❌ | — | unit only: messages/Types/*.test.tsx, MediaMessagePreview.test.tsx |
| CHAT-x51 | Share a product into chat from the product page | ❌ | — | unit only: tests/components/products/ShareButton.test.tsx, tests/services/chat.test.ts |
| CHAT-x52 | Product message: View Product, copy link | ❌ | — | unit only: messages/Types/ProductMessage.test.tsx |
| CHAT-x53 | Reply from the menu; the quote shows on the other side | ✅ | chat.live.spec.ts › CHAT-05 | Parent id checked. |
| CHAT-x54 | Cancel the reply bar | ❌ | — | unit only: components/ReplyMessage.test.tsx |
| CHAT-x55 | Swipe a message to reply | ❌ | — | unit only: messages/useMessageSwipe.test.tsx |
| CHAT-x56 | Tap a quote → jump to the original (loads the gap) | ❌ | — | unit only: pages/ConversationContainer.test.tsx |
| CHAT-x57 | Edit own message; Edited mark; the other person sees the new text | ✅ | chat.live.spec.ts › CHAT-06 | |
| CHAT-x58 | Edit refused → old text stays, shopper told | ⚠️ | chat.scripted.spec.ts › SCRIPT-43 | Faked only. |
| CHAT-x59 | Only the writer may edit or "delete for all" | ⚠️ | chat.scripted.spec.ts › SCRIPT-38 | Faked only. |
| CHAT-x60 | Delete a message for everyone / only for me | ✅ | chat.live.spec.ts › CHAT-10 | Both sides checked after a reload. |
| CHAT-x61 | Forward a message; Forwarded mark | ✅ | chat.live.spec.ts › CHAT-09 | `is_forward` sent. |
| CHAT-x62 | Forward into a different chat; cancel a forward | ⚠️ | chat.live.spec.ts › CHAT-09 | Forwards into the same chat only. Cancel is unit only: ChatWindow.test.tsx |
| CHAT-x63 | Copy message text | ❌ | — | unit only: MessageOptionsEdit.test.tsx, store/chat/chatUtils.test.tsx |
| CHAT-x64 | Tag a message, then remove the tag | ✅ | chat.live.spec.ts › CHAT-07 | |
| CHAT-x65 | Custom new tag; tag refused → toast | ❌ | — | unit only: messages/MessagePickers.test.tsx, store/chatSendMessage.test.ts |
| CHAT-x66 | Tagged-messages filter in details | ❌ | — | Hidden in UI (`false &&`, ChatInfo.tsx). unit only: TaggedMessages.test.tsx |
| CHAT-x67 | Set a reminder (preset), cancel it; the Reminders folder lists it | ✅ | chat.live.spec.ts › CHAT-08 | 1-hour preset only. |
| CHAT-x68 | Custom date reminder; a past time is refused; a refused set | ❌ | — | unit only: messages/MessagePickers.test.tsx |
| CHAT-x69 | Reminders folder opens the chat at that message | ⚠️ | chat.scripted.spec.ts › SCRIPT-42 | Faked only. Live CHAT-08 only lists it. |
| CHAT-x70 | Reminder whose chat cannot be found → "Could not open the chat" | ❌ | — | unit only: components/RemindersList.test.tsx |
| CHAT-x71 | Date separators and hover dates on messages | ❌ | — | unit only: ConversationContainer.test.tsx, MessageHoverDates.test.tsx |
| CHAT-x72 | Open the details drawer from the header name | ✅ | chat.live.spec.ts › CHAT-15 | Via `openChatDetails` check. |
| CHAT-x73 | Block / unblock: both see "cannot send", no input; typing comes back | ✅ | chat.live.spec.ts › CHAT-15; chat.scripted.spec.ts › SCRIPT-36 | |
| CHAT-x74 | A blocked chat refuses voice/video calls | ❌ | — | unit only: pages/ConversationContainer.test.tsx |
| CHAT-x75 | Block / unblock refused by the backend | ❌ | — | unit only: tests/components/Chat/DeleteChatConfirm.test.tsx |
| CHAT-x76 | Copy the other person's phone from details | ❌ | — | unit only: tests/components/Chat/DeleteChatConfirm.test.tsx |
| CHAT-x77 | Media & Files tabs in details | ❌ | — | unit only: components/ChatInfo.test.tsx, DeleteChatConfirm.test.tsx |
| CHAT-x78 | Search in a conversation: newest first, older/newer | ⚠️ | chat.scripted.spec.ts › SCRIPT-39 | Faked only. Live CHAT-17 removed (CHAT-BE-2). |
| CHAT-x79 | Search hit not loaded yet (loads the gap) / no match | ❌ | — | unit only: tests/components/Chat/ChatSearch.test.tsx |
| CHAT-x80 | Typing indicator | ❌ | — | Firebase cut in e2e. unit only: ConversationContainer.test.tsx, ChatItem.test.tsx |
| CHAT-x81 | Online / last seen in the header | ❌ | — | unit only: components/ChatHeader.test.tsx |
| CHAT-x82 | A new message arrives live while the chat is open | ❌ | — | Push does not run in e2e. Cases reload instead. |
| CHAT-x83 | In-app chat toast; a notification click opens that chat | ❌ | — | unit only: tests/components/global/NotificationsContainer.test.tsx |
| CHAT-x84 | Voice/video calls: place, incoming, answer, refuse, missed | ❌ | — | unit only: store/chat/callActions.test.ts, ChatVoiceCall/ChatVideoCall tests |
| CHAT-x85 | "Chat with delivery worker" from an order opens the private chat | ❌ | — | unit only: OrderDetailsWrapper.test.tsx, settings/OrderChatIcon.test.tsx |
| CHAT-x86 | Chat token 401 → the chat token (not the market one) is renewed, list loads | ⚠️ | chat.scripted.spec.ts › SCRIPT-34 | Faked only. |
| CHAT-x87 | Chat renewal refused → only the chat tokens cleared, phone check | ⚠️ | chat.scripted.spec.ts › SCRIPT-35 | Faked only. |
| CHAT-x88 | Sign-out removes the chat cookies | ✅ | auth.live.spec.ts › AUTH-03 | |
| CHAT-x89 | A lost market session deletes the chat cookies | ✅ | session-recovery.live.spec.ts › RECOV-02 | |
| CHAT-x90 | A profile name change reaches the chat backend | ✅ | profile.live.spec.ts › PROF-02 | |
| CHAT-x91 | Chat keeps the new name after signing out and in | ✅ | profile.live.spec.ts › PROF-08 | Red on purpose: chat backend stores and reads different rows. |
| CHAT-x92 | No chat record → the chat leg of the profile save is skipped | ⚠️ | profile.scripted.spec.ts › SCRIPT-08 | Faked only. |

**Summary:** ✅ 26 · ⚠️ 19 · ❌ 47 (92 rows). The live journey (CHAT-01 to CHAT-16) covers text messages and chat/row actions well. Every media, realtime, call and entry-point path outside the nav icon has no browser test.

**Top gaps:**
- **CHAT-x43 / x45 / x49**: no browser test sends an image, a document or a voice note to the real chat backend or the media upload. Only text is proved end to end.
- **CHAT-x51**: sharing a product into chat from the product page has no browser test. It crosses the product page and the chat backend.
- **CHAT-x85**: the order page's "Chat with delivery worker" (`/api/v1/channels/orderChatParticipant/get-recipient`) has no browser test.
- **CHAT-x82 / x83 / x80**: live arrival of a message, the in-app toast, opening from a notification, and the typing indicator are all untested in the browser. Push and Firebase are cut off in e2e.
- **CHAT-x3**: a guest pressing the chat icon (the sign-in opens) has no browser test. Every shopper who is not signed in meets this path.

### Stories
Scope: the shopper stories bar, the story viewer, upload, report and delete, product links, the QA story filter, stories sessions, and the seller dashboard Stories section.

**Not in the app (no rows, nothing to test):** hold to pause, a mute button, likes, reactions, replies, share, add to cart from a story, and a deep link to one story. The app only writes the `?stories=true` and `?StoryModal=true` markers. Video is muted only on panes that are not in front.

#### Shopper
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| STO-s1 | Stories bar loads page 1 and draws tiles (guest and signed-in) | ✅ | stories.live.spec.ts › STORY-03b; sellerStories.live.spec.ts › SST-04 | Both poll for tile count > 0 before they judge absence. |
| STO-s2 | Bar keeps the skeleton and shows no toast when the stories backend fails | ❌ | — | unit only: tests/components/Home/storiesBarClient.test.tsx |
| STO-s3 | Bar pagination: scrolling to the end loads the next page | ⚠️ | stories.live.spec.ts › STORY-03/04 (`openRing`) | The test scrolls only when it needs to. Growth is never asserted. Unit: StoriesPaginationWrapper.test.tsx |
| STO-s4 | Bar keeps loaded pages and watched rings across a route change | ❌ | — | unit only: tests/components/Home/storiesWrapper.test.tsx |
| STO-s5 | Own tile shows the newest story; other tiles show the first unseen | ❌ | — | No test found for StoryElement. |
| STO-s6 | Tap a tile to open that author's ring | ✅ | stories.live.spec.ts › STORY-03; sellerStories.live.spec.ts › SST-05 | Asserts the tile is visible, clicks it, then lands on the run's story. |
| STO-s7 | Ring opens on the first unseen story (others) or the newest (own) | ❌ | — | unit only: tests/components/Home/Stories/StoryHolder.test.tsx |
| STO-s8 | Tap right half: next story / next author | ⚠️ | stories.live.spec.ts › STORY-03/04/05 (`advanceToStory`) | Used as a tool to reach the run's story. Single steps are not asserted. |
| STO-s9 | Tap left half: previous story / previous author | ❌ | — | unit only: StoryViewer.test.tsx, StoryHolder.test.tsx |
| STO-s10 | Auto-advance (5 s photo, video end); the end of a ring moves to the next author | ❌ | — | unit only: tests/components/Home/Stories/StoryViewer.test.tsx |
| STO-s11 | Progress bars fill for each story | ❌ | — | unit only: StoryViewer.test.tsx |
| STO-s12 | Swipe sideways between authors (cube) | ❌ | — | unit only: tests/components/Home/Stories/NewStories.test.tsx |
| STO-s13 | Pull down to close; a short pull springs back | ❌ | — | unit only: NewStories.test.tsx |
| STO-s14 | Close the viewer with the X | ⚠️ | stories.live.spec.ts › STORY-03, STORY-05 | Clicked as clean-up with `.catch`. The close itself is never asserted. |
| STO-s15 | Viewer pauses while the report or delete sheet is open, and resumes after | ⚠️ | stories.live.spec.ts › STORY-04 (`reportShowingStory`) | The story id is checked again with the sheet open, which implies a pause. Resume is not checked. |
| STO-s16 | Video story plays and takes its length from the file | ❌ | — | unit only: StoryViewer.test.tsx. The owner removed the e2e video case on 2026-09-20. |
| STO-s17 | Author header (name, time, placeholder avatar) | ❌ | — | unit only: StoryViewer.test.tsx |
| STO-s18 | Loader shows until the media loads | ❌ | — | unit only: StoryViewer.test.tsx |
| STO-s19 | "View More" external link button (adds https) | ❌ | — | unit only: StoryViewer.test.tsx. E2E stories carry a link, but the button is never pressed. |
| STO-s20 | "View Product" button drawn for a story with a product | ✅ | sellerStories.live.spec.ts › SST-05 | Checks `data-has-product` and the button's href. |
| STO-s21 | Product button opens the right product page | ✅ | sellerStories.live.spec.ts › SST-08 | Compares the product name with the seed product's own page. |
| STO-s22 | Seen state: the ring greys out on this device | ❌ | — | unit only: tests/services/story.test.ts, StoryHolder.test.tsx |
| STO-s23 | View sent to the stories backend (`increase_viewers`), only for a stories user | ❌ | — | unit only: tests/services/story.test.ts |
| STO-s24 | Report control shown to a signed-in viewer who does not own the story | ✅ | stories.live.spec.ts › STORY-04 | The second account sees the report icon. |
| STO-s25 | Report control hidden from guests and owners | ❌ | — | unit only: StoryHolder.test.tsx |
| STO-s26 | Report sheet: pick a reason and submit | ⚠️ | stories.live.spec.ts › STORY-04 | Picks "spam" and clicks Submit. It never waits for the `/report` answer or the success toast. |
| STO-s27 | Report rules: Submit is off until a reason is picked; "Other" focuses the details box | ❌ | — | unit only: tests/components/Home/Stories/ReportStoryModal.test.tsx |
| STO-s28 | Report refused: the sheet stays open and shows an error | ❌ | — | unit only: ReportStoryModal.test.tsx |
| STO-s29 | Delete control for the owner only, with a confirm modal | ✅ | stories.live.spec.ts › STORY-05 | Asserts the icon is visible and the confirm modal appears. |
| STO-s30 | Delete removes the story at the stories backend | ✅ | stories.live.spec.ts › STORY-05 | `findOwnStoriesLeft` must return an empty list. |
| STO-s31 | After a delete, the viewer moves on; an empty ring leaves the bar | ❌ | — | unit only: StoryHolder.test.tsx |
| STO-s32 | Delete refused: the story stays and an error shows | ❌ | — | unit only: StoryHolder.test.tsx |
| STO-s33 | Add-story tile shown only when `is_allowed_to_upload_story` is set | ⚠️ | stories.live.spec.ts › STORY-01 (`uploadStory`) | The visible case is asserted. The hidden case is unit only: AddStory.test.tsx |
| STO-s34 | Add-story gate: no phone opens login, `need_auth` asks for a phone check, no name opens the name modal | ❌ | — | unit only: tests/components/Home/AddStory.test.tsx |
| STO-s35 | Upload a photo from the gallery: crop, link, Share (media server + stories backend) | ✅ | stories.live.spec.ts › STORY-01 | Names the backend that refused. |
| STO-s36 | Backend stores the QA link; the new story is in the feed within a minute | ✅ | stories.live.spec.ts › STORY-01 | Reads the backend feed without the filter. |
| STO-s37 | Success toast and in-place bar refresh after an upload | ⚠️ | stories.live.spec.ts › STORY-03 | The story is found after a reload. The toast and in-place refresh are not asserted. |
| STO-s38 | Video upload (≤ 59 s); a longer video is refused | ❌ | — | unit only: tests/components/Home/addStoryWidget.test.tsx |
| STO-s39 | Camera: take a photo or record a video; camera permission revoked | ❌ | — | unit only: tests/components/Home/Stories/CameraStory.test.tsx, addStoryWidget.test.tsx |
| STO-s40 | Shopper sheet refuses an SVG, a file over 10 MB and a bad link | ❌ | — | unit only: addStoryWidget.test.tsx. SST-09 covers the seller form only. |
| STO-s41 | Upload refused by the media server or the stories backend shows "Upload Failed Try Again" | ❌ | — | unit only: addStoryWidget.test.tsx |
| STO-s42 | Clear the preview; close the sheet with the X | ❌ | — | unit only: addStoryWidget.test.tsx |
| STO-s43 | QA story hidden from a guest | ✅ | stories.live.spec.ts › STORY-03b; sellerStories.live.spec.ts › SST-04 | Reads the ring tile by group id, after content is proven. |
| STO-s44 | QA story shown to allow-listed test accounts | ✅ | stories.live.spec.ts › STORY-03, STORY-04 | Both accounts find the ring on the bar. |
| STO-s45 | No QA story link on the home page | ⚠️ | qaLock.live.spec.ts › QA-11 | Searches `<a href>` on the home page. No home anchor carries a story link, so the case cannot fail. |
| STO-s46 | Product page "Product Story" section lists an attached story | ✅ | sellerStories.live.spec.ts › SST-06 | Checks the section and the card by group id. |
| STO-s47 | Open a story from the product page row; the shared list is given back on close | ❌ | — | unit only: tests/components/products/ProductStories.test.tsx |
| STO-s48 | Product story row: pagination; hidden when the product has no stories | ❌ | — | unit only: ProductStories.test.tsx, ProductStoriesWrapper.test.tsx |
| STO-s49 | Chat window "Stories" tab: list, paging, open a story | ❌ | — | unit only: tests/components/Chat/pages/StoriesList.test.tsx |
| STO-s50 | Browser Back closes the open viewer (popup history entry) | ❌ | — | No story-specific test found. |
| STO-s51 | `/api/revalidateStories` — removed: it cleared the `stories` tag, which no cache entry used | — | — | none (route removed) |

#### Stories session
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| STO-t1 | Sign-in lands the stories part of the session | ✅ | stories.live.spec.ts › STORY-00a, STORY-00b; auth.live.spec.ts › AUTH-01 | AUTH-01 stays red on purpose because of the wallet `502`. |
| STO-t2 | Stories 401: exchange, wait 2 s, retry | ❌ | — | unit only: tests/utils/fetchData.test.ts ("stories 401 refresh succeeds") |
| STO-t3 | Stories exchange refused: falls through to the `need_auth` prompt | ❌ | — | unit only: tests/utils/fetchData.test.ts |
| STO-t4 | Lost market session deletes the stories cookies | ✅ | session-recovery.live.spec.ts › RECOV-02 | Covers the stories token, its refresh token and `USER_STORIES`. |
| STO-t5 | A profile change reaches the stories backend's copy | ✅ | profile.live.spec.ts › PROF-02, PROF-08 | PROF-08 is red on purpose: the stories backend answers sign-in from an old row. |

#### Seller
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| STO-d1 | Stories section opens from the dashboard menu | ✅ | sellerStories.live.spec.ts › SST-01 | Section visible with READ_STORY. |
| STO-d2 | CREATE_STORY and DELETE_STORY are read before anything is written | ✅ | sellerStories.live.spec.ts › SST-01 | Reads `data-can-create` and `data-can-delete`. |
| STO-d3 | Add button and bin hidden without the permission | ❌ | — | unit only: tests/components/SellerDashboard/StoriesTab.test.tsx |
| STO-d4 | Stories tab withheld from a small role | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. Proves only the dashboard's own gating. |
| STO-d5 | Grid lists the seller's stories | ✅ | sellerStories.live.spec.ts › SST-02, SST-07 | Backend list read, and the card is visible before the delete. |
| STO-d6 | Empty state "No stories yet" | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d7 | List error state and Retry | ❌ | — | unit only: StoriesTab.test.tsx. E2E only fails when the error shows. |
| STO-d8 | Pagination (Previous / Next, page of N) | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d9 | Story stats: view count on the card | ❌ | — | unit only: StoriesTab.test.tsx ("shows a photo story with its view count") |
| STO-d10 | Open the story preview modal (media, link, product, date) | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d11 | Upload a photo with crop, link and product; the backend keeps both | ✅ | sellerStories.live.spec.ts › SST-02 | Checks the link and the product id on the seller list. |
| STO-d12 | Product picker: pick, change, remove, load more, failed load | ⚠️ | sellerStories.live.spec.ts › SST-02 | Only the pick is covered. The rest is unit only: StoriesTab.test.tsx |
| STO-d13 | Video upload; a video over 60 s is refused | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d14 | SVG and a file over 10 MB are refused with a message | ✅ | sellerStories.live.spec.ts › SST-09 | No crop step, no preview, Share is off, a toast shows. |
| STO-d15 | A bad link shows an error and turns Share off; a real link clears it | ✅ | sellerStories.live.spec.ts › SST-09 | — |
| STO-d16 | Save refused by the backend: the window stays open and shows an error | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d17 | Cancel closes the upload form | ✅ | sellerStories.live.spec.ts › SST-09 | `closeStoryForm` asserts the dialog is hidden. |
| STO-d18 | After an upload: success toast and the list reloads on screen | ⚠️ | sellerStories.live.spec.ts › SST-02 | Reads the backend list, not the screen. The toast is not checked. |
| STO-d19 | Delete with confirm; the row leaves the screen and the backend | ✅ | sellerStories.live.spec.ts › SST-07 | Proves the row was there before the delete. |
| STO-d20 | Delete cancelled, or refused by the backend | ❌ | — | unit only: StoriesTab.test.tsx |
| STO-d21 | Seller story reaches the home feed | ✅ | sellerStories.live.spec.ts › SST-03 | Backend `users_stories` read. SST-05 then sees the ring on the bar. |
| STO-d22 | Seller story hidden from a guest | ✅ | sellerStories.live.spec.ts › SST-04 | — |

**Summary:** ✅ 25 · ⚠️ 11 · ❌ 42 (78 rows)

**Top gaps:**
- **STO-t2.** No browser test covers the stories 401 → exchange → 2 s → retry path. The access token lives 60 seconds, so any viewer who stays more than a minute meets this path.
- **STO-s26.** STORY-04 files a report it can never take back, but it never checks that the stories backend accepted it. A refused report passes green.
- **STO-s45.** QA-11 searches home-page `<a href>` values that can never hold a story link, so it cannot fail. STORY-03b had the same flaw and was fixed by reading the ring tile. QA-11 needs the same fix.
- **STO-s22 / STO-s23 / STO-d9.** No e2e test covers the seen state or the `increase_viewers` call. The seller's view count depends on both.
- **STO-s9 / STO-s10.** Previous-tap and auto-advance (including moving to the next author at the end of a ring) have no e2e check. Only the forward tap is used, as a tool.

### Locale, region, navigation and other
Scope: `proxy.ts` locale, region and crawler rules, the staging gate, language and country switching, RTL and translations, nav and back bars, static and settings links, the notifications panel and FCM push, the wallet card, share links, analytics, error pages and the QA safety lock.

#### Locale
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| LOC-x1 | `/` redirects to a `/xx-xx` path | ✅ | guest.live.spec.ts › GUEST-01 | Checks the URL shape only. |
| LOC-x2 | `Accept-Language` picks a language we support | ✅ | locale.live.spec.ts › GUEST-08 | Only `ar` is tried. Fetch-level, no browser. |
| LOC-x3 | An unsupported browser language falls back to English | ✅ | locale.live.spec.ts › GUEST-09 | |
| LOC-x4 | An address with no locale keeps its path (hyphenated path too) | ✅ | locale.live.spec.ts › GUEST-12, GUEST-36 | |
| LOC-x5 | A matching address is served untouched, with no `Set-Cookie` | ✅ | locale.live.spec.ts › GUEST-13 | |
| LOC-x6 | A locale in capitals gets a 308 to lower case | ✅ | locale.live.spec.ts › GUEST-31 | |
| LOC-x7 | An unsupported pair in the address for a person (`/xx-en`, `/gb-fr`) | ❌ | — | unit only: tests/proxy.test.ts |
| LOC-x8 | Switch to Arabic in settings: address, `language` cookie, `<html lang>` | ✅ | locale.live.spec.ts › GUEST-50 step "Arabic is picked and saved" | |
| LOC-x9 | Switch back to English: all three layers follow | ✅ | locale.live.spec.ts › GUEST-50 step "English is picked again…" | |
| LOC-x10 | Switch to Turkish | ❌ | — | unit only: tests/components/settings/LanguageSetting.test.tsx |
| LOC-x11 | Switch to Kurdish | ❌ | — | unit only: tests/components/settings/LanguageSetting.test.tsx |
| LOC-x12 | Save shows only after a different language is picked | ⚠️ | locale.live.spec.ts › GUEST-50 | Save is pressed. The hidden state is never asserted. |
| LOC-x13 | RTL layout for `ar` / `ku` | ❌ | — | `dir` is commented out in `[lang]/layout.tsx:161`. Components use `flex-row-reverse`. Nothing checks it. |
| LOC-x14 | Arabic copy shown, no English leak | ⚠️ | locale.live.spec.ts › GUEST-50 | Only the page title is checked for Arabic script. |
| LOC-x15 | No English leak in `tr` / `ku` | ❌ | — | unit only: tests/public/translationsTr.test.ts, plus `lint:i18n-parity` |

#### Region
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| REG-x1 | A served geo country goes straight there, with no picker | ✅ | locale.live.spec.ts › GUEST-06 | Spoofs `x-vercel-ip-country`. |
| REG-x2 | A country we do not serve falls back to the default with `no-country=true` | ✅ | locale.live.spec.ts › GUEST-07 | Checks the URL marker, not the modal. |
| REG-x3 | The "Select Your Region" modal shows and lists countries | ⚠️ | actions/nav.ts `chooseRegionIfAsked` (via `gotoHome`) | Setup helper only. No case asserts the modal. |
| REG-x4 | Picking a country in the modal sets cookies and moves to the new address | ⚠️ | actions/nav.ts `chooseRegionIfAsked`; GUEST-22/23 replay the answer | The helper waits for the URL. GUEST-22/23 only replay the answer by fetch. |
| REG-x5 | The country list never arrives (`getCountries` has no retry) | ⚠️ | actions/nav.ts `chooseRegionIfAsked` | The helper reloads once and fails with a message. Not a case. |
| REG-x6 | A saved country beats the geo country | ✅ | locale.live.spec.ts › GUEST-10 | |
| REG-x7 | Address country differs from the saved one → `changed-country` | ✅ | locale.live.spec.ts › GUEST-11 | URL level only. |
| REG-x8 | Changed-country modal: "keep A OR B", both buttons | ❌ | — | unit only: tests/utils/PopupCountry.test.tsx |
| REG-x9 | Picker markers do not loop | ✅ | locale.live.spec.ts › GUEST-15, GUEST-16 | |
| REG-x10 | Half a saved pair; the `gb` global bucket | ✅ | locale.live.spec.ts › GUEST-17, GUEST-35, GUEST-18 | |
| REG-x11 | The picker answer is remembered (extra query; no country in address) | ✅ | locale.live.spec.ts › GUEST-22, GUEST-23, GUEST-24 | |
| REG-x12 | Loop guard `x-redirect-count`; `_t` is dropped | ✅ | locale.live.spec.ts › GUEST-25, GUEST-26, GUEST-27 | |
| REG-x13 | Country change in settings + Confirm: address, cookie, flag, and back | ✅ | locale.live.spec.ts › GUEST-51 | |
| REG-x14 | Country change window: Cancel keeps the old country | ❌ | — | The Cancel button exists in `PersonalInfoCountries.tsx:408`. Nothing presses it. |
| REG-x15 | A shared valid link with nothing saved is served, and the choice is saved | ✅ | locale.live.spec.ts › GUEST-14 | |
| REG-x16 | A crawler on a valid address gets no cookies | ✅ | locale.live.spec.ts › GUEST-19 | |
| REG-x17 | A crawler with no country gets a 308 | ✅ | locale.live.spec.ts › GUEST-20 | |
| REG-x18 | A crawler on an unsupported pair gets the default locale, with no doubled prefix | ❌ | — | unit only: tests/proxy.test.ts |
| REG-x19 | A crawler is never asked to pick a country | ✅ | locale.live.spec.ts › GUEST-21 | |
| REG-x20 | `robots.txt` and sitemaps skip the locale rules | ✅ | locale.live.spec.ts › GUEST-28, GUEST-29, GUEST-30 | |
| REG-x21 | `userIP` cookie is set HttpOnly | ❌ | — | unit only: tests/proxy.test.ts |
| REG-x22 | `referer` / `utm_source` cookie | ❌ | — | unit only: tests/proxy.test.ts |
| REG-x23 | Preconnect `Link` headers | ❌ | — | unit only: tests/proxy.test.ts |
| REG-x24 | Staging logo gate (`STAGING_GATE=on`: only `/`, else 307) | ❌ | — | unit only: tests/proxy.test.ts. The matcher swap is fixed at build time and no test can check it. |

#### Navigation
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| NAV-x1 | Nav logo is visible | ✅ | staticPages.live.spec.ts › GUEST-37 | Also checked in `gotoHome`. |
| NAV-x2 | Clicking the logo goes home (`href="/"`) | ❌ | — | No case clicks `NavLogo`. |
| NAV-x3 | Avatar opens the account menu | ⚠️ | actions/auth.ts `openAccountMenu` | Used only on the sign-out path (login area). |
| NAV-x4 | Menu → Settings | ❌ | — | unit only: tests/components/Home/Menu.test.tsx |
| NAV-x5 | Menu → Notifications | ❌ | — | unit only: tests/components/Home/Menu.test.tsx |
| NAV-x6 | Menu → Compare | ❌ | — | The CMP cases open `/compare` by address. unit only: Menu.test.tsx |
| NAV-x7 | Category bar tap opens the page, marked open, and leads back home | ✅ | listings.live.spec.ts › GUEST-47 | Shared with the Viewing pages section. |
| NAV-x8 | Desktop category bar scroll arrows | ❌ | — | unit only: tests/components/Server/Navbar.test.tsx |
| NAV-x9 | Mobile bottom tab bar | ❌ | — | Not built. Only `/demo` has one (`DemoBottomNav`). |
| NAV-x10 | Static page back bar → settings | ✅ | staticPages.live.spec.ts › GUEST-41 | |
| NAV-x11 | Product overlay back arrow → home, at the same scroll | ✅ | guest.live.spec.ts › GUEST-42 | |
| NAV-x12 | Settings back bar → home; sub-page back bars → settings | ❌ | — | unit only: tests/app/settings/pages.test.tsx |
| NAV-x13 | Browser Back takes the popup history entry off (`ParamsUpdater`) | ⚠️ | actions/nav.ts `waitForPopupHistorySettled` | Waited for, never asserted. unit: tests/utils/popupHistory.test.ts |
| NAV-x14 | About / Contact / Privacy / Terms render with no crash | ✅ | staticPages.live.spec.ts › GUEST-37, GUEST-38, GUEST-39, GUEST-40 | |
| NAV-x15 | Settings → Terms & Conditions link | ❌ | — | GUEST-40 opens the page by address. |
| NAV-x16 | Settings "Legal Information", "About Us", "Share App" | ❌ | — | All three are `href="#"` in `settings/page.tsx:72,82,92`. They are dead entries. |
| NAV-x17 | Site footer links | ❌ | — | Not built. There is no storefront footer. The Contact entry is commented out. |
| NAV-x18 | Navigation loader (gate and safety net) | ❌ | — | unit only: NavigationLoaderGate.test.tsx, NavigationLoaderSafetyNet.test.tsx |

#### Notifications
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| NTF-x1 | Panel opens and loads page 1 (`/user-notifications/get`) | ❌ | — | unit only: tests/components/Notifications/NotificationsPanel.test.tsx |
| NTF-x2 | Infinite scroll, "Loading...", "No more notifications" | ❌ | — | unit only: NotificationsPanel.test.tsx |
| NTF-x3 | Close with X or an outside click; body scroll is locked and restored | ❌ | — | unit only: NotificationsPanel.test.tsx |
| NTF-x4 | Panel reloads when a market push arrives | ❌ | — | unit only: NotificationsPanel.test.tsx |
| NTF-x5 | Item click opens the boutique / product / category / order | ❌ | — | unit only: tests/components/Notifications/NotificationItem.test.tsx |
| NTF-x6 | Mark as read / unread badge | ❌ | — | Not built. Market notifications have no read state. |
| NTF-x7 | Debug box: permission, Firebase support, FCM token copy | ❌ | — | unit only: NotificationsPanel.test.tsx |
| NTF-x8 | Link to notification settings (`/settings/prefferences`) | ❌ | — | unit only: NotificationsPanel.test.tsx |
| NTF-x9 | Topic subscribe / unsubscribe in preferences | ❌ | — | unit only: SettingsModal.test.tsx, tests/app/api/subscribe and unsubscribe route.test.ts |
| NTF-x10 | Email / FCM / WhatsApp toggles, frequency, rollback on failure | ❌ | — | unit only: tests/components/Home/SettingsModal.test.tsx |
| NTF-x11 | Notification Test tab | ❌ | — | unit only: tests/components/global/NotificationsTest.test.tsx |
| NTF-x12 | Permission prompt "Allow / Not now" (permission `default`) | ⚠️ | chat.scripted.spec.ts › SCRIPT-28 | Scripted. Only the chat entry point is checked. |
| NTF-x13 | Permission denied → the shopper is told | ⚠️ | chat.scripted.spec.ts › SCRIPT-27 | Scripted. Chat entry only. |
| NTF-x14 | "Notifications Not Supported" window | ❌ | — | unit only: NotSupportedNotificationsWidget.test.tsx |
| NTF-x15 | FCM token is registered on start (`/api/subscribe`) | ❌ | — | The e2e suite cuts Firebase. unit only: tests/utils/firebaseInitv1.test.ts, tests/services/home.test.ts |
| NTF-x16 | Topics are subscribed again after going back `online` | ❌ | — | unit only: firebaseInitv1.test.ts, fcmTopicTracker.test.ts |
| NTF-x17 | Foreground market push → toast with link (cart expiry, product, boutique, order) | ❌ | — | unit only: tests/utils/chatMuteNotifications.test.ts |
| NTF-x18 | Background push click in the service worker (open page / delivery chat) | ❌ | — | unit only: tests/public/firebaseMessagingSwTags.test.ts |
| NTF-x19 | In-app toast shows; 5 s auto-hide; click goes to its link | ⚠️ | harness/notifications.ts; compare.live.spec.ts › CMP-04; checkout.scripted | Asserts only that something was said. The timer and the click are not checked. |

#### Other
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| OTH-x1 | Wallet card shows the balance | ❌ | — | AUTH-01 checks the wallet sign-in, not the card. unit only: WalletLinkCard.test.tsx |
| OTH-x2 | Wallet balance fails → message and Retry | ❌ | — | unit only: tests/components/setting/WalletLinkCard.test.tsx |
| OTH-x3 | Wallet card tap: guest → login; signed in → "Under Development" sheet | ❌ | — | unit only: WalletLinkCard.test.tsx |
| OTH-x4 | Wallet `need_auth` prompt | ❌ | — | Cannot be reached: the RDB widget is commented out in `WalletLinkCard.tsx`. |
| OTH-x5 | Follow shops | ❌ | — | Not built. No follow feature in the storefront. |
| OTH-x6 | Listing share (`navigator.share` / copy link) | ❌ | — | unit only: tests/components/Listing/ListingShareControl.test.tsx |
| OTH-x7 | Product share options | ❌ | — | unit only: tests/components/products/ShareOptions.test.tsx |
| OTH-x8 | Shared link: first visit honoured; other country asks | ✅ | locale.live.spec.ts › GUEST-14, GUEST-11 | |
| OTH-x9 | Coupon deep link `/?coupon=CODE` | ⚠️ | checkout.scripted.spec.ts › SCRIPT-22 | Scripted backend. See ORD-x23. |
| OTH-x10 | PWA `manifest.json` is served and valid | ❌ | — | No test in either suite. |
| OTH-x11 | Cookie consent | ❌ | — | Not built. No consent component. |
| OTH-x12 | GA `gtag` loads and sends a page view | ❌ | — | unit only: tests/utils/gtag.test.ts |
| OTH-x13 | PostHog starts through the `/ingest` proxy | ❌ | — | unit only: tests/utils/posthog.test.ts, tests/app/ingest/route.test.ts |
| OTH-x14 | PostHog events fire | ❌ | — | unit only: tests/utils/posthogEvents.test.ts |
| OTH-x15 | Home page renders with no uncaught exception | ✅ | guest.live.spec.ts › GUEST-02 | |
| OTH-x16 | Route error boundary (`route-error`) | ❌ | — | unit only: tests/app/error.test.tsx |
| OTH-x17 | 404 not-found page | ❌ | — | unit only: tests/app/not-found.test.tsx |
| OTH-x18 | `global-error.tsx` | ❌ | — | unit only: tests/app/global-error.test.tsx |
| OTH-x19 | A dead product or boutique overlay redirects (`NotFoundRedirect`) | ❌ | — | unit only: tests/components/global/NotFoundRedirect.test.tsx |
| OTH-x20 | Offline state | ❌ | — | Not built. There is no offline page; only FCM registers again on `online`. |
| OTH-x21 | `VersionChecker` updates to a new build | ❌ | — | unit only: VersionChecker.test.tsx, version-manager.test.ts |

#### QA safety lock
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| QAL-x1 | QA mode header finds the QA product in search | ✅ | qaLock.live.spec.ts › QA-01 | |
| QAL-x2 | Without QA mode, no QA row and no header sent | ✅ | qaLock.live.spec.ts › QA-02 | |
| QAL-x3 | QA boutique is visible in QA mode, absent without it | ✅ | qaLock.live.spec.ts › QA-02b | |
| QAL-x4 | Seed: seller approved, slug marked, product owned, active, built once, own data only | ✅ | qaLock.live.spec.ts › QA-03 to QA-08 | |
| QAL-x5 | Home, featured, sitemaps and catalogue search hide the QA shop | ✅ | qaLock.live.spec.ts › QA-09a to QA-09e | |
| QAL-x6 | The index really holds the QA product (stops a false pass) | ✅ | qaLock.live.spec.ts › QA-10 | |
| QAL-x7 | A QA story never reaches the feed | ✅ | qaLock.live.spec.ts › QA-11 | The Stories section (STO-s45) shows that this check cannot fail as written. |
| QAL-x8 | A real shop named `trydos-qa-…` is blocked when it is created | ❌ | — | The scenario doc lists this as not covered. |

**Summary:** ✅ 36 · ⚠️ 11 · ❌ 58 (105 rows). Six ❌ rows are features the app does not have: NAV-x9, NAV-x17, NTF-x6, OTH-x5, OTH-x11, OTH-x20.

**Top gaps:**
- **NTF-x1 / NTF-x5 – the notifications panel.** No e2e case opens it, loads it, or follows an item. The menu entry, paging and links are proved by unit tests only.
- **LOC-x13 / LOC-x10 / LOC-x11 – RTL and the `tr` / `ku` switch.** `dir` is commented out in `[lang]/layout.tsx:161`, and no case checks the layout direction. Only Arabic is switched to.
- **NAV-x16 – dead settings entries.** "About Us", "Legal Information" and "Share App" all link to `#` in `settings/page.tsx`, even though `/about` exists. This is a product finding, not only a test gap.
- **REG-x8 / REG-x3 – the region modals.** No case asserts the "Select Your Region" modal itself. No case presses the "keep A OR B" changed-country buttons. The suite checks only the URL markers.
- **OTH-x16 / OTH-x17 – route error boundary and 404.** An Elasticsearch throw once blanked the whole page. The boundary that fixes this has unit tests only.

---

## Part B — Seller dashboard

All live seller cases use the QA seed's seller account. That account owns its shop and holds every permission, so the live suite only ever sees "yes".

### Entry, permissions and staff
Scope: the Settings seller card, the server-side shop guards, the shop list, entering the dashboard, home tiles, side menu, back and `?tab=`, the `/shop/auth/permissions` gating, the Users and Permissions tabs, become-a-seller and admin approval.

All live cases open the QA seed's seller jar. That account owns its shop and holds every permission. So the live suite only ever sees "yes". No account with a small role exists, and no account that is not a seller is ever driven.

#### Entry
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x1 | Settings: a guest (no phone, no cookie) sees no seller entry, and no shops call is sent | ❌ | — | unit only: tests/components/settings/GoToSellerDashBoard.test.tsx |
| SDE-x2 | Settings: a spinner shows while the shops call loads | ❌ | — | unit only: GoToSellerDashBoard.test.tsx |
| SDE-x3 | Settings: a seller sees the black Sales card, and a tap opens `/sellerProfile` | ✅ | sellerDashboard.live.spec.ts › SD-01 | The "0 Action" count is fixed at 0 in the code. |
| SDE-x4 | Settings: the shops call fails → "Failed to load permissions" + Retry | ❌ | — | unit only: GoToSellerDashBoard.test.tsx. SD-01 only checks that the box is hidden. |
| SDE-x5 | Settings: a 204 or an empty list → "Become A Seller At Trydos" button | ❌ | — | unit only: GoToSellerDashBoard.test.tsx. No non-seller account is driven. |
| SDE-x6 | Server guard: zero shops (200/403) → redirect home; a 401/5xx falls through | ❌ | — | unit only: tests/app/sellerProfile/layouts.test.tsx |
| SDE-x7 | Server guard: a `sellerId` that is not in the user's list → redirect home | ❌ | — | unit only: layouts.test.tsx. Safe to test live with a wrong id. |
| SDE-x8 | Shop list: the skeleton paints first, not the empty state | ❌ | — | unit only: tests/app/sellerProfile/shopListFirstPaint.test.tsx |
| SDE-x9 | Shop list: the QA shop card shows its name and seller id | ⚠️ | sellerDashboard.live.spec.ts › SD-01 | The test finds the card by its id attribute and checks only "text not empty". It never compares the name. |
| SDE-x10 | Shop card: role chip, "Super Admin", permission count | ❌ | — | unit only: shopListFirstPaint.test.tsx |
| SDE-x11 | Shop list empty: "No shops available" | ❌ | — | unit only: shopListFirstPaint.test.tsx |
| SDE-x12 | Shop list load failure | ❌ | — | unit only: shopListFirstPaint.test.tsx. The app shows the empty state. There is no error and no Retry. |
| SDE-x13 | Shop list back bar → storefront home | ❌ | — | No e2e test. |
| SDE-x14 | Leave shop: the dialog opens; Cancel and the backdrop close it | ❌ | — | unit only: shopListFirstPaint.test.tsx. No `data-pw` on the leave button. |
| SDE-x15 | Leave shop: confirm → the shop leaves the list | ❌ | — | unit only: shopListFirstPaint.test.tsx. A real leave cannot be undone on the shared account. |
| SDE-x16 | Leave shop refused → the backend message shows in the dialog; the shop stays | ❌ | — | unit only: shopListFirstPaint.test.tsx |
| SDE-x17 | Leave is disabled on the master shop (`is_master: 1`) | ❌ | — | unit only: shopListFirstPaint.test.tsx. This is a read-only check, so it is safe to test live. |
| SDE-x18 | Enter Dashboard opens this shop's dashboard (URL + seller id) | ✅ | sellerDashboard.live.spec.ts › SD-01 | |
| SDE-x19 | The dashboard opens on its home screen | ✅ | sellerDashboard.live.spec.ts › SD-01 | |
| SDE-x20 | Header: shop name, logo/monogram, role chip, Seller ID | ⚠️ | sellerDashboard.live.spec.ts › SD-01 | Only the seller id is checked. Role chip: unit only, permissionsTab.test.tsx. |

#### Moving around
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x21 | Every offered home tile opens its section (URL + `data-tab`) | ✅ | sellerDashboard.live.spec.ts › SD-02 | Navigation only. The section's data is not read. |
| SDE-x22 | Side menu: every entry opens its section | ⚠️ | sellerDashboard.live.spec.ts › SD-03 | Locations only, out of 12 entries. Unit: listRefresh.test.tsx covers all of them. |
| SDE-x23 | Side menu closes from the overlay, Escape, an outside click and its own button | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x24 | Side menu: shop name/image header, Seller ID footer, check mark on the active entry | ❌ | — | unit only (drawer image): listRefresh.test.tsx |
| SDE-x25 | Side menu badges: products, boutiques, carts counts, with a spinner while loading | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x26 | Back arrow inside a section → dashboard home | ✅ | sellerDashboard.live.spec.ts › SD-02, SD-03 | |
| SDE-x27 | Back arrow on home → shop list | ✅ | sellerDashboard.live.spec.ts › SD-03 | |
| SDE-x28 | Browser back/forward with `?tab=` (`router.replace`, one history entry) | ❌ | — | Only the app's own back arrow is pressed. |
| SDE-x29 | A direct `?tab=` link opens that section | ✅ | sellerDashboard.live.spec.ts › SD-04 to SD-13, SD-16 | Locations, shopInfo, products and excel only. Users and permissions are never opened by link. |
| SDE-x30 | An unknown `?tab=` value falls back to home | ❌ | — | No test found. The code falls back to `"none"`. |

#### Gating
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x31 | Coming from the shop list: permissions come from the list, with no extra call | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x32 | Opening by URL: `/shop/auth/permissions` is fetched, and the tiles are built from the real answer | ✅ | sellerDashboard.live.spec.ts › SD-02 | Asserts the tiles are not empty and include locations and shopInfo by name. |
| SDE-x33 | Permissions still loading → skeleton, not a refusal | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x34 | Permissions call fails → error + Retry on home and on every gated section | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x35 | A 200 with no entry for this shop is treated as a failure | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x36 | Small role: home offers only that role's tiles, each checked by name | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. "carts" is missing from the withheld list. |
| SDE-x37 | The Permissions tile shows for every role | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted. |
| SDE-x38 | Direct link to a forbidden Locations → Access Denied | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted, Locations only. |
| SDE-x39 | Access Denied on a direct link: Products, Boutiques, Users, Orders, Carts | ❌ | — | unit only: listRefresh.test.tsx, orders.test.tsx, carts/CartsTab.test.tsx |
| SDE-x40 | Direct link to Gallery, Stories, Comments, Excel or Shop Info without permission | ❌ | — | The app draws an empty panel there, with no Access Denied. No test. |
| SDE-x41 | The Users tile shows for any EMPLOYEES permission, but the section needs USER_MANAGEMENT_ACCESS or SUPER_ADMIN | ❌ | — | So a role with READ_EMPLOYEES only sees the tile, then gets Access Denied. No test. |
| SDE-x42 | Header role chip shows the backend's role name for a small role | ❌ | — | SCRIPT-26 fakes "Scripted limited role" but never reads the chip. |
| SDE-x43 | The core backend itself refuses a small role's calls | ❌ | — | No real small-role account exists. |
| SDE-x44 | Action gates: Change Role and Delete (SUPER_ADMIN only), Leave Shop (own row only) | ❌ | — | unit only: listRefresh.test.tsx |

#### Users
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x45 | Users section opens | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Navigation only. SD-15 is reserved for team cases and not written yet. |
| SDE-x46 | Users list rows: name, phone, role | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x47 | Users list skeleton; "No users found" | ❌ | — | No unit test for the empty state found. |
| SDE-x48 | Load more users (next page appended) | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x49 | Users backend refusal → error alert | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x50 | Add-user form: phone with format hint; Seller ID read-only | ❌ | — | No e2e test. |
| SDE-x51 | Role picker: "Loading roles…", "No roles found", the role list | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x52 | Role search (400 ms debounce, server search) + "Load more roles" | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x53 | Add stays disabled until phone and role are set; an empty form sends nothing | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x54 | Add user succeeds: banner for 3 s, form cleared, list fetched again | ❌ | — | unit only: listRefresh.test.tsx. A live add changes the shared shop's staff. |
| SDE-x55 | Add user refused → the backend message shows | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x56 | Roles call fails → error in the add-user panel | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x57 | Change Role dropdown: open, search, load more, close on outside click or Escape | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x58 | Change Role saves; the row shows the new role name | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x59 | Change Role refused → error alert | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x60 | Delete user removes the row | ❌ | — | unit only: listRefresh.test.tsx. The code has no confirm step. |
| SDE-x61 | Delete refused → error alert | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x62 | Leave Shop (own row): confirm modal → back to the shop list | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x63 | Leave Shop refused → error shows, modal closes | ❌ | — | unit only: listRefresh.test.tsx |

#### Permissions tab
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x64 | Permissions section opens | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Navigation only. The content is never read. |
| SDE-x65 | Skeleton until ready; error + Retry on failure | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x66 | Grouped cards with translated group names; an unknown permission goes under "Other" | ❌ | — | unit only: permissionsTab.test.tsx, listRefresh.test.tsx |
| SDE-x67 | Permission chips named in words ("Read Products"), translated | ❌ | — | unit only: permissionsTab.test.tsx |
| SDE-x68 | Role banner shows the role name, with "Member" as the fallback | ❌ | — | unit only: permissionsTab.test.tsx |
| SDE-x69 | Super Admin banner | ❌ | — | unit only: permissionsTab.test.tsx |
| SDE-x70 | "No permissions assigned" | ❌ | — | unit only: listRefresh.test.tsx |
| SDE-x71 | Opening by URL on this tab fetches the permissions and shows the role | ❌ | — | unit only: permissionsTab.test.tsx |

#### Become a seller
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDE-x72 | The button opens the modal; a spinner shows while the status loads | ❌ | — | unit only: tests/components/settings/BecomeSellerModal.test.tsx |
| SDE-x73 | Status 404 or an unknown status → the form | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x74 | Status lookup fails → error + Retry | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x75 | Pending screen | ❌ | — | unit only. The seed reads the status as 0/1/2, but the modal expects words. Not checked live. |
| SDE-x76 | Rejected screen with the backend's reason, or generic text | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x77 | Approved screen | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x78 | Close, X and Cancel close the modal | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x79 | Blur checks: required fields, email, phone, password strength, repeat match | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x80 | 10-character cap on first name, last name, shop name, location name | ❌ | — | unit only: becomeSellerLimits.test.ts |
| SDE-x81 | Country selects: list from the countries call (session cache), URL country as default | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x82 | Map pick sets latitude and longitude | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x83 | Documents: type required, image or PDF only, upload by presigned URL + PUT, list, Remove | ❌ | — | unit only. The seed makes the same two calls by API, not through the form. |
| SDE-x84 | Document upload failures (presign refused, PUT refused or thrown) | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x85 | Submit disabled with no document; an incomplete form shows every error and sends nothing | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x86 | Submit succeeds → toast, status read again → pending screen | ❌ | — | unit only. The seed posts `/shop/vendor-requests` by API. |
| SDE-x87 | "User already exists" → status read again, no error | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x88 | Phone not verified → verify widget → sent again once; cancel stops; 5-minute timeout | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x89 | Other backend errors → one toast per `detailed_error` entry | ❌ | — | unit only: BecomeSellerModal.test.tsx |
| SDE-x90 | Admin approval turns the account into a seller (a seller id appears) | ⚠️ | harness/qaSeed.ts; qaLock.live.spec.ts › QA-03 | New environment only. Done by API and the admin screen; QA-03 checks only that a seller id exists. |
| SDE-x91 | After approval, Settings shows Sales instead of Become a seller | ⚠️ | sellerDashboard.live.spec.ts › SD-01 | Sales is checked for an already-approved seller. The switch itself is never watched. |

**Summary:** ✅ 8 · ⚠️ 10 · ❌ 73 (91 rows).

Changes to the first pass:
- The shop card name row goes down to ⚠️. The test checks only that the card text is not empty.
- The side menu row is now ⚠️ as "every entry". Only Locations is driven.

**Top gaps:**
- **SDE-x46 to SDE-x63: Users tab.** No e2e test reads the staff list, adds a user, changes a role, deletes a user or leaves the shop. These are the only staff-management writes. Unit only.
- **SDE-x5, SDE-x72 to SDE-x89: become-a-seller from the screen.** The form, document upload, phone re-verify and the status screens are never driven in a browser. The seed uses the API. The seed reads the status as a number while the modal expects words (SDE-x75), and no test can show which one is right.
- **SDE-x43: the backend's own permission check.** Gating is proved only on screen with a faked answer. No real small-role account exists.
- **SDE-x40 / SDE-x41: gating holes in the code.** Five sections draw an empty panel instead of Access Denied when opened by link without permission. The Users tile shows for roles that the section then refuses. No test covers either case.
- **SDE-x6 / SDE-x7: server-side guards.** The redirect for "no shops" and for "not your shop" is unit only. A live check with a wrong `sellerId` would be safe and cheap.

### Shop info and locations
Scope: the Shop Info tab (load, fields, rules, media, save, permissions, the product editor's need for shop info) and the Locations tab (list, filter, paging, create, edit, status, rules, map, permissions).

All live cases open the QA seed's seller jar. That seller holds every permission. Unit file paths below are short forms: `ShopInfo.test.tsx` = `tests/components/SellerDashboard/ShopInfo.test.tsx`, `locations/*.test.tsx` = `tests/components/SellerDashboard/locations/`.

Corrections to the first pass:
- **SD-12 may no longer be red.** The spec header says SD-12 is red for a core 422 on image/banner. But commit e6776135 (2026-09-22) makes the app leave out a missing picture's key. Re-run SD-12 to learn its real state (SDI-x23).
- **The read-only location form is never opened by the app.** Add and Edit are hidden without the permission (SDL-x20).
- **A direct Shop Info link without READ_SHOP_INFO draws an empty panel.** It shows no Access Denied (SDI-x14).

#### Shop info: getting in and loading
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDI-x1 | Home tile is offered with READ_SHOP_INFO and opens Shop Info | ✅ | sellerDashboard.live.spec.ts › SD-02 | Tile checked by name, then opened. SCRIPT-26 also checks it (scripted). |
| SDI-x2 | Side-menu "Shop Info" entry opens the section | ❌ | — | SD-03 uses the menu for Locations only. |
| SDI-x3 | Direct `?tab=shopInfo` link opens the form | ✅ | sellerDashboard.live.spec.ts › SD-10, SD-11, SD-12 | `openShopInfo(direct: true)`. |
| SDI-x4 | Skeletons stay in place while `GET /shop/info` runs | ⚠️ | SD-10 (via `openShopInfo`) | The test waits past the skeletons but never checks them as a state. |
| SDI-x5 | Name, contact and address are filled from `GET /shop/info` | ✅ | sellerDashboard.live.spec.ts › SD-10 | Each field is compared with the core record. |
| SDI-x6 | Stored logo and banner are drawn with file names; a folder-only URL (ends in `/`) counts as no media | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x7 | No media: logo monogram, "No banner yet", button says Upload, not Change | ❌ | — | unit only: ShopInfo.test.tsx ("leaves an empty form…") |
| SDI-x8 | `GET /shop/info` refused: the form stays empty | ❌ | — | unit only: ShopInfo.test.tsx. The app shows no error and no Retry, only LogError. |
| SDI-x9 | Navbar and drawer shop name and image follow the load and the save | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx |

#### Shop info: permissions
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDI-x10 | No UPDATE_SHOP_INFO: name, contact and address disabled, no Save | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. |
| SDI-x11 | Read-only extras: "Read only" badge, Upload/Change disabled, clear X hidden | ❌ | — | unit only (badge only): ShopInfo.test.tsx. SCRIPT-26 checks only the text fields. |
| SDI-x12 | No READ_SHOP_INFO: tile and menu entry hidden | ❌ | — | SCRIPT-26's role holds READ_SHOP_INFO, so this is never tested. |
| SDI-x13 | No READ_SHOP_INFO: the loader never sends `GET /shop/info`; an unknown permission list still fetches | ❌ | — | unit only: ShopInfoLoader.test.tsx, tests/app/sellerProfile/layouts.test.tsx |
| SDI-x14 | Direct `?tab=shopInfo` without READ_SHOP_INFO | ❌ | — | The app draws an empty panel with no Access Denied. `openShopInfo` would time out. |
| SDI-x15 | Core backend itself refuses read/save for a small role | ❌ | — | No real small-role seller account exists. |

#### Shop info: field rules
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDI-x16 | Empty name → "Shop Name is required", nothing sent | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x17 | Empty contact refused, error shown, no PUT sent | ✅ | sellerDashboard.live.spec.ts › SD-11 | |
| SDI-x18 | Contact with letters refused, error shown, no PUT sent | ✅ | sellerDashboard.live.spec.ts › SD-11 | |
| SDI-x19 | Contact rule edges: leading `+` allowed, spaces/dashes refused, spaces-only = empty | ❌ | — | No test for these edges. Rule is `^\+?\d+$` after trim. |
| SDI-x20 | Empty address → "Address is required", nothing sent | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x21 | A field's error clears when the seller types in it | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x22 | Core's own contact rule (422 "must be a valid phone number") | ❌ | — | The app shows only the generic alert. SD-12 builds a valid number to avoid this case. |

#### Shop info: saving
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDI-x23 | Contact and address change reaches core and is stored | ⚠️ | sellerDashboard.live.spec.ts › SD-12 | Asserted. Spec header says red (core 422 on image/banner). Fix e6776135 may have cleared it. Re-run. |
| SDI-x24 | Save leaves name, logo and banner unchanged | ⚠️ | sellerDashboard.live.spec.ts › SD-12 | Asserted, but only reached when SD-12 passes. |
| SDI-x25 | Body shape: trimmed text, stored media as bare file name, a missing picture's key left out | ❌ | — | unit only: tests/services/sellerDashboard/updateShopInfoBody.test.ts, ShopInfo.test.tsx |
| SDI-x26 | Changing the shop name through the form | ❌ | — | SD-12 never changes the name on purpose, because the seed finds the shop by name. unit only: ShopInfo.test.tsx |
| SDI-x27 | Success toast "Shop Info Updated Successfully!"; "Saving..." button state | ❌ | — | unit only: ShopInfo.test.tsx. SD-12 checks only that no failure alert appeared. |
| SDI-x28 | Save refused → `alert("Failed to update")` | ❌ | — | unit only: ShopInfo.test.tsx. The alert does not say why. SD-12 reads the PUT body instead. |

#### Shop info: logo and banner
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDI-x29 | Pick a logo → crop widget → preview and file name | ❌ | — | unit only: ShopInfo.test.tsx. The live suite avoids media writes. |
| SDI-x30 | Pick a banner (6:1) → crop → preview | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x31 | Cancel the crop: nothing kept; the same file can be picked again | ❌ | — | unit only: ShopInfo.test.tsx |
| SDI-x32 | Save with new media: upload to media server (ticket) first, then PUT the bare name | ❌ | — | unit only: ShopInfo.test.tsx, updateShopInfoBody.test.ts |
| SDI-x33 | Media upload fails or is not set up → alert, no PUT sent | ❌ | — | unit only: updateShopInfoBody.test.ts, ShopInfo.test.tsx |
| SDI-x34 | Clear a stored logo/banner (X) → the next save sends `""` | ❌ | — | unit only: ShopInfo.test.tsx. Not proved that core accepts `""`. |

#### Shop info: the product editor's dependency
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDI-x35 | Editor shows a skeleton until shop info is settled | ❌ | — | unit only: productEdit/ProductEditor.test.tsx |
| SDI-x36 | No READ_SHOP_INFO: both create and edit say the permission is missing (no Retry) | ❌ | — | unit only: ProductEditor.test.tsx |
| SDI-x37 | Shop info failed: error + Retry clears the record and fetches once more | ❌ | — | unit only: ProductEditor.test.tsx, ShopInfoLoader.test.tsx |
| SDI-x38 | Shop currency code and `decimal_digits` drive the price inputs | ❌ | — | unit only: productEdit/sections.test.tsx, ShopInfoLoader.test.tsx |
| SDI-x39 | `is_new_products_approval` false → prices locked on create; approval note text | ❌ | — | unit only: ShopInfoLoader.test.tsx, sections.test.tsx |
| SDI-x40 | Product cards show the shop's currency label | ❌ | — | SD-13 checks the price number (2 decimals), not the label. |

#### Locations: getting in and the list
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x1 | Home tile is offered and opens Locations | ✅ | sellerDashboard.live.spec.ts › SD-02 | |
| SDL-x2 | Side-menu entry opens Locations | ✅ | sellerDashboard.live.spec.ts › SD-03 | |
| SDL-x3 | Direct `?tab=locations` link loads the list after permissions arrive late | ✅ | sellerDashboard.live.spec.ts › SD-04 to SD-09 | Covers the fixed `canRead` bug that left the list loading for ever. Unit test too. |
| SDL-x4 | Before permissions load, a direct link shows Access Denied, not a loading state | ❌ | — | The app shows a refusal for a moment. `settleLocations` waits past it. unit: LocationsTab.test.tsx |
| SDL-x5 | List draws every first-page row the backend returns, with names | ✅ | sellerDashboard.live.spec.ts › SD-04 | First page only. |
| SDL-x6 | Row shows its address | ✅ | sellerDashboard.live.spec.ts › SD-07 | Read after an edit. |
| SDL-x7 | Row shows a country chip; "Address: —" when the row has no address | ❌ | — | unit only (country): locations/LocationsTab.test.tsx |
| SDL-x8 | Row status pill (Active/Inactive) | ✅ | sellerDashboard.live.spec.ts › SD-08 | Read from `data-active`. |
| SDL-x9 | Header count shows `meta.total` | ❌ | — | No test found. |
| SDL-x10 | Paging Next / Previous | ❌ | — | unit only: LocationsTab.test.tsx. Staging probably has more than one page now (SD-06 adds a row every run). |
| SDL-x11 | Active / inactive filter matches the backend | ✅ | sellerDashboard.live.spec.ts › SD-05 | Checks extra and missing ids. |
| SDL-x12 | Filter back to "All statuses"; a filter change goes back to page 1 | ❌ | — | unit only: LocationsTab.test.tsx. There is no country filter in the UI, though the service supports one. |
| SDL-x13 | Empty state; "Add your first location" only on All + CREATE_LOCATION | ❌ | — | unit only: LocationsTab.test.tsx. The QA shop always has a location. |
| SDL-x14 | Load failure shows the backend message + Retry | ❌ | — | unit only: LocationsTab.test.tsx. The live suite only asserts that the error is hidden. |

#### Locations: permissions
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x15 | No location permission: tile hidden; direct link shows Access Denied | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: permissions faked. |
| SDL-x16 | Add Location hidden without CREATE_LOCATION | ❌ | — | unit only: LocationsTab.test.tsx |
| SDL-x17 | Edit hidden without UPDATE_LOCATION | ❌ | — | unit only: LocationsTab.test.tsx |
| SDL-x18 | Deactivate/Activate hidden without CHANGE_LOCATION_STATUS | ❌ | — | unit only: LocationsTab.test.tsx |
| SDL-x19 | Update-only user gets countries from the edit answer and never calls lookups | ❌ | — | unit only: locations/LocationFormModal.test.tsx |
| SDL-x20 | Read-only form (fields locked, no Save, map disabled) | ❌ | — | unit only: LocationFormModal.test.tsx. The app never opens it, because Add/Edit are hidden without permission. |
| SDL-x21 | Core backend itself refuses a small role | ❌ | — | No real small-role seller account exists. |

#### Locations: create
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x22 | Add Location opens an empty form in create mode | ✅ | sellerDashboard.live.spec.ts › SD-06 | Checks `data-mode="create"`. |
| SDL-x23 | Create form offers countries from `/shop/locations/lookups` | ✅ | sellerDashboard.live.spec.ts › SD-06 | |
| SDL-x24 | Lookups refused → error banner in the form | ❌ | — | unit only: LocationFormModal.test.tsx |
| SDL-x25 | Save: backend holds the name and address, row starts active, row is drawn | ✅ | sellerDashboard.live.spec.ts › SD-06 | |
| SDL-x26 | Typed latitude, longitude and country are stored | ⚠️ | sellerDashboard.live.spec.ts › SD-06 | The test types them but never reads them back from the backend. |
| SDL-x27 | Empty optional fields are left out, so no coordinate is sent as 0 | ❌ | — | unit only: LocationFormModal.test.tsx |
| SDL-x28 | Success toast "Location created successfully"; list reloads | ⚠️ | sellerDashboard.live.spec.ts › SD-06 | Reload is proved; the toast is not checked. |
| SDL-x29 | Same name in the same country → 422 shown under the name box + summary | ❌ | — | unit only: LocationFormModal.test.tsx. SD-06 always uses a unique name. |
| SDL-x30 | A second Save is ignored while the first is running | ❌ | — | unit only: LocationFormModal.test.tsx |

#### Locations: edit
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x31 | Edit form loads from `GET /shop/locations/{id}/edit`, filled in | ✅ | sellerDashboard.live.spec.ts › SD-07 | Name only. Address, country and coordinates are not checked. |
| SDL-x32 | Address edit reaches the backend and the list | ✅ | sellerDashboard.live.spec.ts › SD-07 | |
| SDL-x33 | Edit name, country or coordinates | ❌ | — | unit only: LocationFormModal.test.tsx |
| SDL-x34 | Edit load refused → error banner | ❌ | — | unit only: LocationFormModal.test.tsx |

#### Locations: status
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x35 | Deactivate, then Activate; backend holds each status | ✅ | sellerDashboard.live.spec.ts › SD-08 | |
| SDL-x36 | Toast "Status changed successfully"; new status taken from the answer | ❌ | — | unit only: LocationsTab.test.tsx |
| SDL-x37 | Status change refused → banner, row unchanged | ❌ | — | unit only: LocationsTab.test.tsx. The e2e helper reads the banner but never causes one. |
| SDL-x38 | Only one status change runs at a time | ❌ | — | unit only: LocationsTab.test.tsx |
| SDL-x39 | Product editor location list; an inactive location stays on its products | ❌ | — | unit only (dropdown): productEdit/sections.test.tsx. Nothing tests the detach rule. |
| SDL-x40 | Delete a location | ❌ | — | Not in the app: there is no delete API. Nothing to test. |

#### Locations: field rules and closing
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x41 | Empty name refused, error shown, nothing sent | ✅ | sellerDashboard.live.spec.ts › SD-09 | |
| SDL-x42 | Country required | ❌ | — | unit only: LocationFormModal.test.tsx. SD-09 leaves the country empty but checks only the name error. |
| SDL-x43 | Latitude outside -90..90 blocked, nothing sent | ✅ | sellerDashboard.live.spec.ts › SD-09 | Browser range check (`rangeOverflow`), not the component's rule. |
| SDL-x44 | Longitude outside -180..180 blocked | ❌ | — | unit only: LocationFormModal.test.tsx. The browser blocks it too. |
| SDL-x45 | Editing name or country clears both errors | ❌ | — | unit only: LocationFormModal.test.tsx |
| SDL-x46 | Name limited to 255 characters | ❌ | — | No test found (`maxLength`). |
| SDL-x47 | Cancel closes the form without saving | ✅ | sellerDashboard.live.spec.ts › SD-09 | |
| SDL-x48 | Close X, Escape and backdrop close the form | ❌ | — | unit only: LocationFormModal.test.tsx |

#### Locations: map picker
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDL-x49 | Map click drops a pin and fills latitude/longitude (6 decimals) | ❌ | — | unit only: locations/LocationMapPicker.test.tsx, LocationFormModal.test.tsx |
| SDL-x50 | Pin drawn at the saved coordinates on edit | ❌ | — | unit only: LocationMapPicker.test.tsx |
| SDL-x51 | "Use my current location": fills, pans, zooms, spinner | ❌ | — | unit only: LocationMapPicker.test.tsx |
| SDL-x52 | Location refused or not supported → message | ❌ | — | unit only: LocationMapPicker.test.tsx |
| SDL-x53 | Maps script failed or no key → "Map is unavailable"; typing coordinates still works | ❌ | — | unit only: LocationMapPicker.test.tsx |

**Summary:** ✅ 21 · ⚠️ 7 · ❌ 65 (93 rows: shop info 40, locations 53).

**Top gaps:**
- **SDI-x29 to SDI-x34: logo and banner.** Crop, upload, save and clear are never run in a browser. Also not proved: that core accepts `""` for a cleared picture.
- **SDI-x35 to SDI-x39: the product editor's shop-info gate.** The permission message, Retry, currency and approval lock have unit tests only.
- **SDI-x16, SDI-x20, SDI-x28: shop info.** Empty name and empty address are not tested in the browser. The refused-save alert is not either, and that alert gives the seller no reason.
- **SDL-x10, SDL-x14: locations.** Paging and the load-failure + Retry state have no e2e, even though staging probably has more than one page now.
- **SDL-x49 to SDL-x51: map picker.** Map click and "Use my current location" are never driven in a browser. SDL-x26 also never reads typed coordinates back from the backend.

### Products and the product editor
Scope: the Products grid in the seller dashboard (`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`), plus the add and edit pages (`products/new`, `products/[productId]`). Both pages draw `components/SellerDashboard/productEdit/ProductEditor.tsx`, `sections.tsx`, `helpers.ts` and `GalleryPickerModal.tsx`.

Two facts explain most of the ❌ rows:
- `docs/seller-dashboard-e2e-test-cases.md` tells test writers to ignore the edit page and the Allow Purchase toggle, because the page is "being removed". The page is still live in the code.
- The QA seed (`harness/qaSeed.ts`) creates, repairs and activates the product through direct API calls. It builds its own request body, not the app's `buildUpdateFormData`, so it proves no screen.

The browser suite never opens the add or edit page. The grid is covered only by SD-13 and CMT-03.

#### Grid
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDP-x1 | Products section opens (tile, direct `?tab=products`) | ✅ | sellerDashboard.live.spec.ts › SD-02 (tile), SD-13 (direct link, card found) | |
| SDP-x2 | Products tile offered to a role with only `READ_PRODUCTS` | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. The section is never opened. |
| SDP-x3 | No product permission → "You don't have permission to view products" | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx |
| SDP-x4 | Loading skeleton; never "No products" before the answer arrives | ❌ | — | unit only: listRefresh.test.tsx (AC-7) |
| SDP-x5 | Empty state "No products found" + "Add your first product" | ❌ | — | unit only: listRefresh.test.tsx (AC-15). The QA shop always has a product. |
| SDP-x6 | Load failure → error + Retry | ❌ | — | unit only: listRefresh.test.tsx (AC-14) |
| SDP-x7 | Header count shows `meta.total` | ❌ | — | No test reads the count. |
| SDP-x8 | Status badge matches the backend (`data-status`, Active / Inactive) | ✅ | sellerDashboard.live.spec.ts › SD-13 | The word is checked only as non-empty. |
| SDP-x9 | Price shown with 2 decimals | ✅ | sellerDashboard.live.spec.ts › SD-13 | The shop currency suffix is not checked on its own. |
| SDP-x10 | Stock matches the backend (`data-stock`) | ✅ | sellerDashboard.live.spec.ts › SD-13 | |
| SDP-x11 | Stock badge states: "Out of stock" at 0, amber at 5 or less | ❌ | — | No test. The QA stock is fixed. |
| SDP-x12 | Card image or "No Image", name or "Unnamed Product", category line | ❌ | — | No test reads them. |
| SDP-x13 | Card links to its edit page | ⚠️ | sellerDashboard.live.spec.ts › SD-13 | The href is checked. The link is never followed. |
| SDP-x14 | Paging (Next / Prev) | ❌ | — | unit only: listRefresh.test.tsx, tests/harness/gridWalk.test.ts. The QA grid has one page, so Next is never pressed. |
| SDP-x15 | Reaction (heart) count shows the shopper's like | ✅ | comments.live.spec.ts › CMT-03 | Count ≥ 1. |
| SDP-x16 | Questions, reviews, shares counts | ❌ | — | unit only: tests/services/elastic/sellerComments.test.ts |
| SDP-x17 | Counts show "—" until they arrive; a refused batch is asked again | ❌ | — | unit only: listRefresh.test.tsx |
| SDP-x18 | "Add Product" shown only with `CREATE_PRODUCT` | ❌ | — | No test at all. The first pass was wrong: listRefresh does not check it. |
| SDP-x19 | Carts / Orders buttons on the card (`READ_CARTS` / `READ_ORDERS`) | ❌ | — | unit only: listRefresh.test.tsx. The modal contents are in the orders/carts sub-section. |
| SDP-x20 | Grid shows a new or edited product after returning | ❌ | — | unit only: listRefresh.test.tsx (AC-1, AC-2) |
| SDP-x21 | Grid search / filter | ❌ | — | Not in the app. The grid has no search or filter. |

#### Editor fields
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDP-x22 | Edit page opens read-only: "You're viewing this product. Tap Edit…" | ❌ | — | unit only: productEdit/ProductEditor.test.tsx, productPages.test.tsx |
| SDP-x23 | Create page opens in edit mode with lookups from `GET /shop/products/lookups` | ❌ | — | unit only: ProductEditor.test.tsx. The seed reads lookups by API. |
| SDP-x24 | Shop-info gate: skeleton while shop info is pending | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x25 | No `READ_SHOP_INFO` → block message (add / edit wording), no Retry | ❌ | — | unit only: ProductEditor.test.tsx, ShopInfoLoader.test.tsx |
| SDP-x26 | Shop info failed → error + Retry sends `GET /shop/info` again | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x27 | `/edit` answers 403 → Access Denied; missing product → error + Retry | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x28 | Header: cover, name or "Untitled Product", ID · seller id, Purchasable / Disabled pill | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x29 | Approval states: "Pending Approval" pill, pending-update banner wins, denied banner | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x30 | General: name, seller id, barcode, unit, brand, boutique, location, model no., report ref. | ❌ | — | unit only: productEdit/sections.test.tsx |
| SDP-x31 | Description (rich text); Multiply Shipping × Qty and Packed After Ordering toggles | ❌ | — | unit only: sections.test.tsx, ui/RichTextEditor.test.tsx |
| SDP-x32 | Drop-down: search, "No options found", clear with "Select", locked in view mode | ❌ | — | unit only: sections.test.tsx |
| SDP-x33 | Seller Product ID: unique against the lookups list, own id allowed, quotes removed | ❌ | — | unit only: sellerProductId.test.ts, helpers.test.ts, ProductEditor.test.tsx |
| SDP-x34 | Pricing & stock inputs (unit, discount, purchase, luck, stock, weight, max qty, pieces, shipping, tax, tax type) | ❌ | — | unit only: sections.test.tsx |
| SDP-x35 | Currency decimals: 0 digits blocks decimals; n digits capped, with tooltip | ❌ | — | unit only: sections.test.tsx (prices, variant cells, extra price) |
| SDP-x36 | Seller not approved (`is_new_products_approval` 0): 6 price inputs, extra price, variant money columns hidden | ❌ | — | unit only: sections.test.tsx, helpers.test.ts. Needs a second, unapproved shop. |
| SDP-x37 | Stock locked and totalled from the variants | ❌ | — | unit only: sections.test.tsx |
| SDP-x38 | Required fields (name, unit, brand, seller id, location, origin, stock, weight, image, category); on create also boutique, description | ❌ | — | unit only: helpers.test.ts, validate.weight.test.ts |
| SDP-x39 | Price rules: discount < unit, luck ≤ discount or unit, purchase price | ❌ | — | unit only: validate.luckPrice.test.ts, helpers.test.ts. BUG-seller-100: a filled purchase price is never checked. |
| SDP-x40 | Pieces must be a whole number 1–100; at most 3 labels | ❌ | — | unit only: helpers.test.ts |
| SDP-x41 | Create translations: Default Language picker, one block, copied to name / description | ❌ | — | unit only: sections.test.tsx |
| SDP-x42 | Edit translations: en/ar/tr/ku; en name required; name and description in pairs | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x43 | Similar words: add by button or Enter, skip a repeat, remove; sent in `custom_data` | ❌ | — | unit only: sections.test.tsx, helpers.test.ts. Known core fault: these answer 500 on create. |
| SDP-x44 | SEO: meta title, description, meta image (device or gallery) | ❌ | — | unit only: sections.test.tsx |
| SDP-x45 | Categories: main / sub / sub-sub chips, search, branch lookups, spinner, Save disabled while loading | ❌ | — | unit only: sections.test.tsx, ProductEditor.test.tsx |
| SDP-x46 | Removing a category prunes children; a failed branch keeps the selection; the latest selection wins | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x47 | Read-only seller: no category-lookups call; saved categories still shown | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x48 | Attributes (edit only): string, string_choice, numeric_choice set / clear | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x49 | Labels (max 3) and tags, with search | ❌ | — | unit only: sections.test.tsx |
| SDP-x50 | Country of origin (required) | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x51 | Restricted countries (`countries_iso` = hidden in those countries) | ❌ | — | unit only: sections.test.tsx. The seed sends none, by API. |
| SDP-x52 | Per-country extra price: add, edit, remove | ❌ | — | unit only: sections.test.tsx |
| SDP-x53 | Flash deal field | ❌ | — | Not in the app. The editor has no flash-deal input. |
| SDP-x54 | Dimensions (length / width / height) | ❌ | — | Not in the app. The only size field is weight. |

#### Variants and media
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDP-x55 | One row per colour × size; colour-only and size-only rows | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x56 | Row cells: price, discount, luck, qty, SKU, barcode, location; defaults seeded | ❌ | — | unit only: sections.test.tsx |
| SDP-x57 | Row rules: qty, no negatives, discount < price, luck limits, location and SKU required | ❌ | — | unit only: helpers.test.ts |
| SDP-x58 | SKU unique within the product (any case); every duplicate row marked | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x59 | Remove a colour (with its images list) or a size | ❌ | — | unit only: sections.test.tsx |
| SDP-x60 | Colour images: every colour ≥1 image, every image assigned; "Upload images first." | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDP-x61 | Upload several images from the device; uploading tile; Save disabled meanwhile | ❌ | — | unit only: sections.test.tsx, ProductEditor.test.tsx |
| SDP-x62 | Upload failure or no files → toast, nothing added | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x63 | Gallery picker: multi / single pick, paging, empty, refusal + Retry, duplicates ignored | ❌ | — | unit only: GalleryPickerModal.test.tsx, sections.test.tsx |
| SDP-x64 | Cover badge on the first image; move with arrows; remove | ❌ | — | unit only: sections.test.tsx |
| SDP-x65 | Video (edit only): upload, mark existing for removal / Keep, drop new | ❌ | — | unit only: sections.test.tsx, ProductEditor.test.tsx |
| SDP-x66 | Create hides the Attributes and Video sections | ❌ | — | unit only: ProductEditor.test.tsx |

#### Save and publish
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDP-x67 | Invalid save blocked: "Please fix the highlighted fields", scrolls to the first | ❌ | — | unit only: ProductEditor.test.tsx, serverErrors.test.ts |
| SDP-x68 | No changes → "No changes to save." | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x69 | Confirm dialog: title, item count, Added / Removed / Updated, expandable views | ❌ | — | unit only: ProductEditor.test.tsx, helpers.test.ts (buildDiff) |
| SDP-x70 | Confirm dialog closes on Cancel or backdrop, but not while saving | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x71 | Create body: `POST /shop/products` multipart from `buildUpdateFormData` | ❌ | — | unit only: helpers.test.ts. The seed posts its own hand-built body. |
| SDP-x72 | Create success: toast, go to the new id's page (or the dashboard); starts Disabled | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x73 | Update body: `POST /shop/products/{id}/update`, required keys always sent | ❌ | — | unit only: helpers.test.ts. The seed's repair call uses its own body. |
| SDP-x74 | Update success: "Product updated successfully.", back to read-only | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x75 | `requires_approval` → "Changes were submitted…" banner, no toast | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x76 | Attributes sync (`/descriptors`) only when changed; a failure rolls back with a message | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x77 | Cancel edit restores values and clears errors; Cancel on create → dashboard | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x78 | Back bar returns to the dashboard tab | ❌ | — | unit only: useDashboardDetailBack.test.tsx, productPages.test.tsx |
| SDP-x79 | Allow Purchase: dialog, "Status updated.", pill flips | ❌ | — | unit only: ProductEditor.test.tsx. The seed activates by API, not through the UI. |
| SDP-x80 | Disable purchasing | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x81 | "Cannot enable yet" list from `detailed_error`; pill unchanged | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x82 | Save Draft / Load Draft | ❌ | — | Not reachable: the buttons are commented out in ProductEditor.tsx. No unit test. |

#### Errors and permissions
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDP-x83 | 422 refusal naming a field: the backend's text under that field, page scrolls | ❌ | — | unit only: serverErrors.test.ts, ProductEditor.test.tsx |
| SDP-x84 | Messages with no field go to the box: deduped, max 5, "More problems were reported: N" | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x85 | Raw text with no code is withheld; the 4 image asserts use our own wording | ❌ | — | unit only: serverErrors.test.ts |
| SDP-x86 | Prices locked: a refused hidden price key goes to the box | ❌ | — | unit only: serverErrors.test.ts (AC-30) |
| SDP-x87 | Typing clears only that field's backend message | ❌ | — | unit only: serverErrors.test.ts, ProductEditor.test.tsx |
| SDP-x88 | Toast choice: highlighted / first message / "Failed to create/update product" | ❌ | — | unit only: serverErrors.test.ts |
| SDP-x89 | Core field errors packed as JSON inside `message` | ❌ | — | The editor reads only `detailed_error`; saves skip `utils/fieldErrors.ts`, so the generic text shows. |
| SDP-x90 | No `UPDATE_PRODUCT`: lock icon + "View only", no Edit | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x91 | No `CHANGE_PRODUCT_STATUS`: no Allow Purchase / Disable button | ❌ | — | No test checks that the button is hidden. |
| SDP-x92 | No `READ_PRODUCT_IMAGES`: device upload only, no gallery choice | ❌ | — | unit only: sections.test.tsx, ProductEditor.test.tsx |
| SDP-x93 | Deep link with empty context loads this shop's permissions | ❌ | — | unit only: ProductEditor.test.tsx |
| SDP-x94 | Core backend's own refusal of create / update / status for a small role | ❌ | — | No real small-role seller account exists. |
| SDP-x95 | Delete a product | ❌ | — | Not in the app. There is no delete control and no service call. |

**Summary:** ✅ 5 · ⚠️ 2 · ❌ 88 (95 rows). 5 of the ❌ rows are features that are not in the app or cannot be reached: SDP-x21, x53, x54, x82, x95.

Changes from the first pass:
- Paging (SDP-x14) moved from ⚠️ to ❌, because Next is never pressed live.
- The "Add Product" gate (SDP-x18) has no unit test either.
- Save Draft / Load Draft are dead UI, because the buttons are commented out.

**Top gaps:**
- **SDP-x71, SDP-x72: create a product through the form.** No e2e drives Create Product. The seed uses its own body, so a broken `buildUpdateFormData` would go unseen.
- **SDP-x67 to SDP-x74: edit, the "Confirm changes" dialog and the update save.** None of these runs against the real core backend.
- **SDP-x79 to SDP-x81: Allow Purchase, Disable and "Cannot enable yet".** The real activation checks are proved only by the seed's API call, never on screen.
- **SDP-x83, SDP-x89: backend refusals.** The mapping is proved only on faked answers. A core refusal packed as JSON in `message` shows only the generic text.
- **SDP-x36, SDP-x55 to SDP-x60: the unapproved-seller price lock, variants and colour images.** These are the most rule-heavy parts of the editor, and they have unit tests only.

### Boutiques and image gallery
Scope: the Boutiques list, the boutique editor (create, edit, translations, media, status, delete), the shopper side of a boutique, the Gallery tab, and the gallery picker in the product editor.

No e2e test drives any boutique or gallery screen beyond opening the section. The QA seed (`harness/qaSeed.ts`) creates, updates and activates the QA boutique through **direct API calls**. So the seed proves the core backend contract, but no UI.

Change to the first pass: **boutique delete is turned off in the app** (`BoutiqueEditor.tsx` line 111, `canDelete = false`), so the first pass's delete row was wrong.

#### Boutiques list
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x1 | Home tile opens the Boutiques section | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Opened only because it is offered, not checked by name. Checks the URL only, not the cards. |
| SDB-x2 | Direct `?tab=boutiques` link opens the list | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx |
| SDB-x3 | Card image from `icon` (or "No Image"); name (or "Unnamed Boutique") | ❌ | — | unit only (name only): listRefresh.test.tsx |
| SDB-x4 | Card status badge: Active (1) / Inactive; no badge when the field is missing | ❌ | — | No unit test either. |
| SDB-x5 | Card description: HTML stripped, cut at 100 chars + "...", or "No description" | ❌ | — | No unit test either. |
| SDB-x6 | Card slug chip `/slug`, hidden when empty | ❌ | — | No unit test either. |
| SDB-x7 | Header "Boutiques (count)" and the side-menu count badge | ❌ | — | unit only (badge): listRefresh.test.tsx |
| SDB-x8 | Card opens `…/boutiques/{id}`; back returns to the Boutiques tab | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/boutiquePages.test.tsx |
| SDB-x9 | Paging of the list | ❌ | — | Not in the app: one call, `meta` ignored. If the backend pages, later boutiques never show. |
| SDB-x10 | Placeholder while permissions load; grid skeleton while the list loads | ❌ | — | unit only (placeholder): listRefresh.test.tsx (AC-13) |
| SDB-x11 | Empty state "No boutiques found" + "Add your first boutique" | ❌ | — | unit only: listRefresh.test.tsx |
| SDB-x12 | Load failure → error + Retry | ❌ | — | unit only: listRefresh.test.tsx |
| SDB-x13 | List shows a created / edited / dropped boutique after coming back | ❌ | — | unit only: listRefresh.test.tsx (AC-3, AC-4, AC-5) |

#### Boutique permission gates
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x14 | Tile hidden when the role holds no BUTIKS / CHANGE_BOUTIQUE_STATUS permission | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: `/shop/auth/permissions` is faked. |
| SDB-x15 | Direct link without permission → "You don't have permission to view boutiques" | ❌ | — | unit only: listRefresh.test.tsx. SCRIPT-26 checks Locations only. |
| SDB-x16 | "+ Add Boutique" / "Add your first boutique" only with CREATE_BUTIKS | ❌ | — | unit only (shown case): listRefresh.test.tsx. The hidden case is not tested. |
| SDB-x17 | Edit button only with UPDATE_BUTIKS, else "View only" | ❌ | — | unit only: BoutiqueEditor.test.tsx. GET /edit needs UPDATE_BUTIKS, so a read-only seller likely gets Access Denied. |
| SDB-x18 | Set active / Set inactive only with CHANGE_BOUTIQUE_STATUS | ❌ | — | No unit test for the hidden case. |
| SDB-x19 | Editor deep link loads the permissions when the context is empty | ❌ | — | unit only: tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx |
| SDB-x20 | 403 / "permission" on edit or lookups → Access Denied | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x21 | Core backend itself refuses a small role's boutique calls | ❌ | — | No real small-role seller account exists. |

#### Boutique editor: loading and view mode
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x22 | Skeleton, then header: icon, name, status pill, "ID: n" | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x23 | Language tabs come from GET /languages; if that fails, the built-in en/ar/tr/ku list is used | ❌ | — | unit only: BoutiqueEditor.test.tsx, boutiqueEdit/helpers.test.ts |
| SDB-x24 | Form filled from GET /edit (per-language fields, banners by sequence, countries, availability) | ❌ | — | unit only: helpers.test.ts. The seed reads /edit by API for row ids only. |
| SDB-x25 | "Boutique not found." / other load failure → error + Retry | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x26 | Opens in view mode: fields locked, upload and Copy from hidden | ❌ | — | unit only: boutiqueEdit/sections.test.tsx |
| SDB-x27 | Right-to-left for ar / ku | ❌ | — | unit only: boutiquePages.test.tsx, BoutiqueEditor.test.tsx |

#### Boutique editor: fields
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x28 | Name per language | ❌ | — | unit only: sections.test.tsx |
| SDB-x29 | Description (rich text), sanitised on save | ❌ | — | unit only: sections.test.tsx, helpers.test.ts |
| SDB-x30 | Bio per language | ❌ | — | unit only: sections.test.tsx |
| SDB-x31 | Availability select: Web / Mobile / Web + Mobile; unknown values not offered | ❌ | — | unit only: sections.test.tsx |
| SDB-x32 | Restricted countries chips; empty = everywhere; "No countries available." | ❌ | — | unit only: sections.test.tsx. The seed once left the QA boutique restricted in `sy`. |
| SDB-x33 | "Copy from" another language: name, description, bio, icon, banners | ❌ | — | unit only: sections.test.tsx, BoutiqueEditor.test.tsx |
| SDB-x34 | Switching the language tab keeps each language's own values | ❌ | — | unit only: sections.test.tsx |
| SDB-x35 | Related products | ❌ | — | Not in the app: kept untouched (deferred). Activation needs an active related product. |

#### Boutique editor: icon and banners
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x36 | Icon upload to the media server, preview, bare file name stored | ❌ | — | unit only: BoutiqueEditor.test.tsx. The seed uploads to the same folder by API, not through the editor. |
| SDB-x37 | Icon refused: not an image, over 10 MB | ❌ | — | unit only: helpers.test.ts, BoutiqueEditor.test.tsx |
| SDB-x38 | Icon upload fails, or returns no file name → message | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x39 | Add several banners: queued one at a time, "Uploading…" | ❌ | — | unit only: BoutiqueEditor.test.tsx, sections.test.tsx |
| SDB-x40 | Banner refused: not an image, over 10 MB | ❌ | — | unit only: helpers.test.ts, BoutiqueEditor.test.tsx |
| SDB-x41 | Size warning (width < 600 or ratio outside 1.5–1.8): Cancel skips, "Ignore & upload" sends, the queue goes on | ❌ | — | unit only: BoutiqueEditor.test.tsx, helpers.test.ts |
| SDB-x42 | Remove a banner; Move left / right (disabled at the ends) | ❌ | — | unit only: BoutiqueEditor.test.tsx, sections.test.tsx |
| SDB-x43 | Banner order is sent as `sequence` 1..n and kept after a reload | ❌ | — | unit only (body): helpers.test.ts. No live read-back. |

#### Boutique validation and save
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x44 | Every language needs name, description, bio, icon and at least one banner | ❌ | — | unit only: helpers.test.ts |
| SDB-x45 | Failed check: jump to the first language with an error, shake the fields, show the toast | ❌ | — | unit only: BoutiqueEditor.test.tsx, sections.test.tsx |
| SDB-x46 | Save Changes → POST /update (`custom_data`); success toast; leaves edit mode | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x47 | Core backend accepts the update body (bare file names, row ids kept) | ⚠️ | harness/qaSeed.ts › "put the QA boutique's own settings right" | Seed only: direct API on every run, no UI. |
| SDB-x48 | Update refused → detailed_error, then message, then fallback; stays in edit mode | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x49 | Cancel puts the loaded form back | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x50 | A saved edit is really stored (GET /edit read-back) | ❌ | — | No test does a read-back after a UI save. |

#### Boutique status
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x51 | Set active / inactive flips the form only; the call is sent on Save | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x52 | Status change succeeds: the pill follows `data.status` | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x53 | Activation refused: edits kept, toggle put back, "Status could not be changed:" list, "saved but status not changed" toast | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x54 | Core backend accepts `change-status 1` for a complete boutique | ⚠️ | harness/qaSeed.ts › "approve and activate" | Seed only, by API. QA-04 checks only the slug and the id. |
| SDB-x55 | Core refusal messages ("Missing Translations", not approved, no active related products) | ❌ | — | No test. The seed only prints them when it fails. |

#### Boutique create
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x56 | "+ Add Boutique" opens `/boutiques/new`: lookups, "New Boutique", edit mode on | ❌ | — | unit only: BoutiqueEditor.test.tsx, boutiquePages.test.tsx |
| SDB-x57 | Create Boutique → POST `/shop/boutiques`; toast; opens the edit page by `boutique_id` (dashboard if no id) | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x58 | Core backend accepts the create body under `boutique_custom_data` | ⚠️ | harness/qaSeed.ts › "find or create the QA boutique" | Seed only, by API. Runs only on a fresh environment. |
| SDB-x59 | A new boutique starts inactive; create sends no status call | ❌ | — | unit only: helpers.test.ts |
| SDB-x60 | Create refused → detailed_error, then message, then fallback | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x61 | Both Cancel buttons on create go back to the dashboard | ❌ | — | unit only: BoutiqueEditor.test.tsx |
| SDB-x62 | The new boutique shows in the list after coming back | ❌ | — | unit only: listRefresh.test.tsx (AC-3) |

#### Boutique delete
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x63 | Delete boutique with confirm; a 404 counts as done | ❌ | — | Not in the app: `canDelete = false`, so there is no button. Only the service URL has a unit test. |

#### Boutique on the shopper side
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDB-x64 | The active QA boutique is served by the home boutiques route in QA mode | ⚠️ | qaLock.live.spec.ts › QA-02b | API route read of the seeded boutique, not a dashboard change. |
| SDB-x65 | A seller's edit (name, icon, banner, description) shows on the shopper boutique page | ❌ | — | No test. Elasticsearch lags, so a test needs bounded reloads. |
| SDB-x66 | Inactive, restricted country or availability hides the boutique from shoppers | ❌ | — | No test. |

#### Gallery: opening and permission gates
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x1 | Home tile opens the Gallery section | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | URL only; opened only because it is offered. SD-14 is still not written. |
| SDG-x2 | Tile hidden without READ_PRODUCT_IMAGES | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: permissions faked. |
| SDG-x3 | Direct `?tab=gallery` without READ_PRODUCT_IMAGES | ❌ | — | The app draws an empty panel with no Access Denied (`page.tsx`). No unit test. |
| SDG-x4 | Drop zone hidden without UPLOAD_PRODUCT_IMAGES | ❌ | — | unit only: tests/components/SellerDashboard/GalleryTab.test.tsx |
| SDG-x5 | Toolbar, tile checkboxes and bin hidden without DELETE_PRODUCT_IMAGES | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x6 | A seller with neither permission still sees the grid, View and Copy URL | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x7 | Core backend itself refuses a small role's gallery calls | ❌ | — | No real small-role seller account exists. |

#### Gallery: list
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x8 | Page 1 asked at `per_page=60`; each tile shows its file name (falls back to path / id) | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x9 | "N images" count from `meta.total` | ❌ | — | No unit test. Shown only to sellers with DELETE_PRODUCT_IMAGES. |
| SDG-x10 | Paging Next / Previous, only when `last_page > 1` | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x11 | Loading skeleton | ❌ | — | No unit test. |
| SDG-x12 | Empty state "No images found" | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x13 | Load failure: banner with the backend reason, dismissable | ❌ | — | unit only: GalleryTab.test.tsx. There is no Retry button. |
| SDG-x14 | Search images | ❌ | — | Not in the app: the service takes `search`, but there is no UI for it. |

#### Gallery: upload
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x15 | Select Files → "Confirm Upload" with previews and "n files selected" | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x16 | Select Folder (whole folder) | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x17 | Drag and drop: zone lights up; a drop with no images is ignored | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x18 | Remove one file in the confirm panel; removing the last one closes it | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x19 | Cancel drops the selection | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x20 | Upload: media server bulk → POST `/shop/products/images` `{url,name}` → page 1 | ❌ | — | unit only: GalleryTab.test.tsx, tests/services/sellerDashboard/updateShopInfoBody.test.ts |
| SDG-x21 | The new image is really stored and shown in the grid | ❌ | — | No test. |
| SDG-x22 | Upload refused: the panel stays open and shows the reason | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x23 | Media server stored nothing → "No images were uploaded to the media server" | ❌ | — | unit only: updateShopInfoBody.test.ts |
| SDG-x24 | Non-image files are dropped | ❌ | — | unit only: GalleryTab.test.tsx. They are dropped silently; the seller gets no message. |
| SDG-x25 | File size / count limit | ❌ | — | Not in the app: no size or count check; only the media server limits. |

#### Gallery: delete one
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x26 | Confirm window with a preview; Cancel and the backdrop close it | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x27 | Delete sends DELETE `/shop/products/images` `{ids:[id]}`; the page is fetched again | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x28 | Deleting the last image on a page steps back one page | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x29 | Delete refused → error banner | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x30 | The image is really gone on the backend | ❌ | — | No test. |

#### Gallery: select and bulk delete
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x31 | Select mode from the toolbar or a tile checkbox; a tile click toggles; "n selected" | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x32 | Select all / Deselect all (current page only) | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x33 | "Delete (n)" disabled when nothing is selected | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x34 | Bulk confirm: up to 12 thumbnails + "+n"; Cancel / backdrop keep the selection | ❌ | — | unit only (Cancel and backdrop): GalleryTab.test.tsx. The 12 cap is not tested. |
| SDG-x35 | Bulk delete sends every id in one call, then leaves select mode | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x36 | Bulk delete refused → backend message or "Failed to delete images" | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x37 | Cancel leaves select mode and clears the selection | ❌ | — | unit only: GalleryTab.test.tsx |

#### Gallery: view and copy
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x38 | View opens the large view; a click on the picture keeps it open; close button / backdrop close it | ❌ | — | unit only: GalleryTab.test.tsx |
| SDG-x39 | Copy URL writes the address; "Copied!" for 1.5 s; a clipboard refusal stays quiet | ❌ | — | unit only: GalleryTab.test.tsx |

#### Gallery picker in the product editor
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDG-x40 | "Choose from gallery" offered only with READ_PRODUCT_IMAGES; otherwise device only | ❌ | — | unit only: productEdit/ProductEditor.test.tsx, productEdit/sections.test.tsx |
| SDG-x41 | Product images: pick several, "Add selected (n)", duplicates ignored | ❌ | — | unit only: productEdit/GalleryPickerModal.test.tsx, sections.test.tsx |
| SDG-x42 | Meta image: single pick, only the last pick kept | ❌ | — | unit only: GalleryPickerModal.test.tsx, sections.test.tsx |
| SDG-x43 | Picker: Load more, empty gallery, error + Retry, later page fails | ❌ | — | unit only: GalleryPickerModal.test.tsx |
| SDG-x44 | Picker closes (✕, backdrop, Cancel) without picking | ❌ | — | unit only: GalleryPickerModal.test.tsx |
| SDG-x45 | A picked image is saved on the product and reaches the shopper | ❌ | — | No test. Product save is never driven live (see SDP-x71). |
| SDG-x46 | An image uploaded from the device in the product editor appears in the gallery | ❌ | — | Not in the app: the editor uploads to the media server only, never to `/shop/products/images`. |

**Summary:** ✅ 0 · ⚠️ 8 · ❌ 104 (112 rows: boutiques 66, gallery 46).
- 5 of the ⚠️ rows are navigation, faked-permission or route-read checks: SDB-x1, SDB-x14, SDB-x64, SDG-x1, SDG-x2.
- The other 3 ⚠️ rows are seed-only API calls with no UI: SDB-x47, SDB-x54, SDB-x58.
- 6 ❌ rows are features that are not in the app: SDB-x9, SDB-x35, SDB-x63, SDG-x14, SDG-x25, SDG-x46.

**Top gaps:**
- **SDB-x46, SDB-x50, SDB-x57: boutique save and create through the editor.** No test presses Save Changes or Create Boutique and reads the backend back. The seed uses the API, so a broken form body (for example `custom_data` against `boutique_custom_data`) would go unseen live.
- **SDB-x53: "saved but status not changed".** The activation-refusal path (edits kept, toggle put back, blockers listed) has never run against the real core backend.
- **SDB-x65: a seller's change reaching the shopper.** No test checks that a boutique edit shows on the shopper boutique page after Elasticsearch catches up.
- **SDG-x20, SDG-x21, SDG-x27, SDG-x30: gallery upload and delete.** The media server → `/shop/products/images` chain, and DELETE with `ids`, never run live. SD-14 is still only reserved.
- **SDG-x3: app finding.** A direct `?tab=gallery` link without READ_PRODUCT_IMAGES draws an empty panel instead of Access Denied. No test covers it, unit or e2e.

### Excel import and export
Scope: the dashboard's "Upload Excel File" section (`components/SellerDashboard/ExcelUploadTab.tsx`, `services/sellerDashboard/index.ts` lines 761–890, the gate in `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` line 513). That covers the category picker, the two download modes, the file pick, the upload and processing, the category-mismatch question, the uploaded files table and the failed-rows download.

| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDX-x1 | Home tile opens the Excel section (`?tab=excel`) | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Runs only if the QA seller is offered the tile. "excel" is never required by name. |
| SDX-x2 | Side-menu "Upload Excel File" entry opens the section | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx (SUPER_ADMIN) |
| SDX-x3 | Direct `?tab=excel` link opens the section and draws the picker | ✅ | sellerDashboard.live.spec.ts › SD-16 (`openExcelSection`) | Clears the remembered choice first. |
| SDX-x4 | Tile hidden without CREATE_PRODUCT or UPDATE_PRODUCT | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: permissions faked. "excel" is checked by name in WITHHELD. |
| SDX-x5 | Tile shown with only CREATE_PRODUCT, or only UPDATE_PRODUCT | ❌ | — | No test found, unit or e2e. |
| SDX-x6 | Direct link without the permission | ❌ | — | App gap: the panel is blank. Other tabs show Access Denied. No test. |
| SDX-x7 | Core backend itself refuses `/shop/excel/*` for a small role | ❌ | — | No real small-role seller account exists. |
| SDX-x8 | "Loading categories..." spinner while the list loads | ❌ | — | No test found. SD-16 only waits for the picker. |
| SDX-x9 | Picker lists the categories from `GET /shop/excel/categories` | ✅ | sellerDashboard.live.spec.ts › SD-16 | Reads ids only. Names are not checked. |
| SDX-x10 | Name fallback (display_name → name → title → `#id`) | ❌ | — | unit only: tests/components/SellerDashboard/ExcelUploadTab.test.tsx |
| SDX-x11 | Categories fail to load: backend message + Retry | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x12 | "(N Products)" after a category that has the seller's products | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x13 | Sub-categories indented by level (0–2) | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x14 | Clicking an option picks it; the picker shows it | ✅ | sellerDashboard.live.spec.ts › SD-16 (`downloadTemplate`) | Asserts the picker's `data-value`. |
| SDX-x15 | Search box inside the dropdown filters by name, any letter case | ❌ | — | unit only: ExcelUploadTab.test.tsx. Newest commit. SD-16 never types. |
| SDX-x16 | Search with no match shows "No categories match" | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x17 | Keyboard: arrows, Enter picks, Escape closes and keeps the pick | ⚠️ | sellerDashboard.live.spec.ts › SD-16 | SD-16 presses Escape and never checks that the picker closed. Other keys: unit only. |
| SDX-x18 | Click outside closes the panel and clears the search | ❌ | — | No test found. |
| SDX-x19 | "Show only categories that have my products" filters the list; count badge | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x20 | That box is disabled when the seller has no products anywhere | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x21 | Ticking that box clears a picked category that has no products | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x22 | Last category, box and mode remembered per seller; stale choice dropped | ❌ | — | unit only: ExcelUploadTab.test.tsx. SD-16 deletes the key on purpose. |
| SDX-x23 | Section still works when localStorage is blocked | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x24 | Download is disabled before a category is chosen | ✅ | sellerDashboard.live.spec.ts › SD-16 | |
| SDX-x25 | Two modes offered; "Add new products" chosen first | ⚠️ | sellerDashboard.live.spec.ts › SD-16 | SD-16 ticks the template radio itself. The default is not asserted. |
| SDX-x26 | "Update my products" off with no category, or off with a hint for a category with no products | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x27 | Picking a category with no products moves the mode back to template | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x28 | Button text: "Download empty template" / "Download N products" / "Preparing file..." | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x29 | Empty template: real .xlsx (`PK`), `.xls*` name, `mode=template` | ✅ | sellerDashboard.live.spec.ts › SD-16 | Tries up to 3 categories. |
| SDX-x30 | Download asks for the category that was picked | ⚠️ | sellerDashboard.live.spec.ts › SD-16 | The regex `[^?]+` accepts any id. The chosen id is not matched. |
| SDX-x31 | "Update my products": `mode=products` file holds the seller's products | ❌ | — | unit only: ExcelUploadTab.test.tsx. Read-only, so safe to run live with the QA product. |
| SDX-x32 | Download refused (JSON or non-200): red status with the backend's words | ❌ | — | unit only: ExcelUploadTab.test.tsx, services/sellerDashboard/updateShopInfoBody.test.ts. SD-16 only quotes it. |
| SDX-x33 | Download gets a 401: renew the session once, then retry | ❌ | — | unit only: updateShopInfoBody.test.ts. A live run can reach it by chance, but nothing checks it. |
| SDX-x34 | Click the drop zone, pick a sheet: name and KB size shown | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x35 | Drag and drop: zone lights up, the drop sets the file | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x36 | Wrong file type refused with the ".xlsx, .xls, .xlsm, .xlsb" message | ❌ | — | unit only: ExcelUploadTab.test.tsx. No backend call, so safe to run live. |
| SDX-x37 | File size check | ❌ | — | Not in the app. There is no client check. Only the media server limits size (512 MB, per a service comment). |
| SDX-x38 | "Upload Excel" disabled until a file is chosen | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x39 | Remove the picked file (X button) | ❌ | — | unit only: ExcelUploadTab.test.tsx. This is the only cancel before an upload starts. |
| SDX-x40 | Cancel an upload in flight | ❌ | — | Not in the app. There is no abort. |
| SDX-x41 | Upload progress | ❌ | — | Not in the app. Only an "Uploading..." spinner, no percent. |
| SDX-x42 | Upload ticket, then media `POST /gated/upload/excel` | ❌ | — | unit only: updateShopInfoBody.test.ts, ExcelUploadTab.test.tsx. Not live: it creates real products. |
| SDX-x43 | Media server refuses: its `error`/`message` is shown | ❌ | — | unit only: updateShopInfoBody.test.ts, ExcelUploadTab.test.tsx |
| SDX-x44 | Media server not set up: "Media server upload is not configured" | ❌ | — | unit only: updateShopInfoBody.test.ts |
| SDX-x45 | `processExcel` sends `file_url` + `expected_category_id`, and none without a category | ❌ | — | unit only: ExcelUploadTab.test.tsx, updateShopInfoBody.test.ts |
| SDX-x46 | Success: green message, file cleared, table reloaded | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x47 | Total failure: `processExcel` not successful, backend message shown | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x48 | Partial failure: row shows "Completed with errors" + failed rows | ❌ | — | unit only: ExcelUploadTab.test.tsx. The green success message still shows. Only the table says rows failed. |
| SDX-x49 | 409 `category_mismatch`: a question dialog, not an error | ❌ | — | unit only: ExcelUploadTab.test.tsx, tests/utils/fetchData.test.ts |
| SDX-x50 | "Yes" processes again with `confirm_category`, no new upload | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x51 | "No", backdrop or Escape: "Upload cancelled. Nothing was imported." | ❌ | — | unit only for "No": ExcelUploadTab.test.tsx. No test for backdrop or Escape. |
| SDX-x52 | A 409 that is not about the category is shown as an error | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x53 | Files table loading skeleton | ❌ | — | No test found. |
| SDX-x54 | Files table fails to load: message + Retry, upload form still usable | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x55 | Empty table: "No files uploaded yet." | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x56 | Rows read from the paginator's `data.data`: name, id, status, date | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x57 | Status badge colour per `upload_status`; "—" for a missing value | ❌ | — | unit only: ExcelUploadTab.test.tsx. App i18n gap: raw statuses are not translated. |
| SDX-x58 | Refresh reloads the table and is disabled while loading | ❌ | — | unit only: ExcelUploadTab.test.tsx. No auto-poll while a file is processing. |
| SDX-x59 | Paging through older uploads | ❌ | — | Not in the app. Only the paginator's first page is drawn. |
| SDX-x60 | Notes: disabled without notes; window shows them; closes by X or backdrop | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x61 | Download the uploaded file (media link); greyed when it has no name | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x62 | "Download N failed rows" shown only when `failed_rows_count` > 0 | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x63 | Failed rows download: file, "Preparing file...", "Fix the rows…" notice | ❌ | — | unit only: ExcelUploadTab.test.tsx, updateShopInfoBody.test.ts |
| SDX-x64 | Failed rows refused: backend words in the table notice | ❌ | — | unit only: ExcelUploadTab.test.tsx |
| SDX-x65 | Right-to-left layout for ar / ku (section and both dialogs) | ❌ | — | No test found. |

**Summary:** ✅ 5 · ⚠️ 5 · ❌ 55 (65 rows). Four ❌ rows are features the app does not have: size check, in-flight cancel, progress and paging (SDX-x37, x40, x41, x59). One ❌ row is an app gap: the blank panel without permission (SDX-x6).

Changes to the first pass:
- **"Cancel an upload" was wrong.** The app cannot stop an upload that has started. The only cancels are the X on the picked file (SDX-x39) and "No" on the category question (SDX-x51).
- **The template download check is weaker than it looks.** The URL check accepts any category id (SDX-x30).

**Top gaps:**
- **SDX-x42 to SDX-x48: the upload itself.** No e2e test sends a sheet. So nobody checks the media server, `processExcel`, or the success, partial and total failure screens against staging. The live suite skips it because it would create real products.
- **SDX-x31: "Update my products" download.** It is read-only, and the QA shop already has a product. It is safe to add to SD-16 and is not covered.
- **SDX-x15: category search inside the dropdown.** This is the newest commit and has unit tests only. SD-16 never types in the search box.
- **SDX-x62 / SDX-x63: download failed rows.** This is the seller's only way to fix a partly failed import, and no e2e test covers it.
- **SDX-x6: direct link without the permission.** The section renders blank instead of Access Denied, and no test pins that down.

### Orders, product orders and carts
Scope: the seller Orders tab (list, filters, paging, detail, item actions), the Product Orders modal on a product card, and the Carts tab with its details and the Product Carts modal.

No e2e test reads seller order or cart data. The only e2e contact is SD-02, which opens the tiles. The live shopper suite already places a real order on the QA product (`shopper.live.spec.ts` › BUY-01). So seller-side data exists, but no test reads it. CMT-09 moves orders through the admin and fleet screens (`harness/adminOrders.ts`, `fleetOrders.ts`), never through the seller dashboard.

Fixes to the first pass:
- The product-card Orders and Carts buttons, and their permission checks, have **no** unit test. Only the modals have unit tests.
- OldCartDetails **is** unit-tested, through `CartsTab.test.tsx`.
- SCRIPT-26 never checks the Carts tile.
- **Wrong comment in a unit test:** `tests/components/SellerDashboard/orders.test.tsx` (line 108) says the browser suite uses `order-shop-card`. No e2e file uses it.

#### Orders tab — getting in and permission gates
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDO-x1 | Orders tile opens the section (URL `?tab=orders` + panel `data-tab`) | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Runs only if the tile is offered. SD-02 requires only locations and shopInfo by name. |
| SDO-x2 | Side-menu "Orders" entry opens the section | ❌ | — | No test at all. SD-03 uses the Locations entry only. |
| SDO-x3 | Small role: Orders tile is not offered | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: `/shop/auth/permissions` is faked. |
| SDO-x4 | Direct link with no order permission: "Access Denied" + "You need order viewing permissions…", no `GET /shop/orders` | ❌ | — | unit only: tests/components/SellerDashboard/orders.test.tsx. Uses its own text, not the shared AccessDenied hook. |
| SDO-x5 | Tab opens for any of 11 order permissions; the list call may still need READ_ORDERS | ❌ | — | No real small-role account. |
| SDO-x6 | Core backend refuses Confirm / Packed / Cancel for a read-only role | ❌ | — | The UI shows the buttons to any order permission. Only the backend can refuse. |
| SDO-x7 | Direct link while permissions are loading, or when the permissions call fails | ❌ | — | No test. page.tsx draws Orders without the `permissionsReady` wait, so a wrong "Access Denied" may show. Not confirmed. |

#### Orders tab — list
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDO-x8 | First load: 4 placeholder cards, then `GET /shop/orders` page 1 with no status | ❌ | — | unit only: orders.test.tsx |
| SDO-x9 | The list shows the orders the backend holds (live) | ❌ | — | No test. BUY-01 already makes a real QA-product order to check against. |
| SDO-x10 | Card: created time (string or {date,time}) + remaining minutes ("125m") | ❌ | — | unit only: orders.test.tsx |
| SDO-x11 | Card: order id | ❌ | — | unit only: orders.test.tsx |
| SDO-x12 | Card: status label, translated; "N/A" when missing | ❌ | — | unit only: orders.test.tsx (BUG-seller-704) |
| SDO-x13 | Card: item count = sum of quantities; amount in USD | ❌ | — | unit only: orders.test.tsx |
| SDO-x14 | Card: up to 4 pictures (cart_image → thumbnail → images[0]); "No image", "No items" | ❌ | — | unit only: orders.test.tsx |
| SDO-x15 | Card click opens that order's detail | ❌ | — | unit only: orders.test.tsx |
| SDO-x16 | Filter tabs All / In Progress / Collected / Returned / Cancelled send none / in_progress / collected / returned / canceled | ❌ | — | unit only: orders.test.tsx |
| SDO-x17 | Each tab shows only matching orders (backend honours the filter) | ❌ | — | No test. The unit tests mock the backend. |
| SDO-x18 | Tab names translated in ar / tr / ku | ❌ | — | unit only: orders.test.tsx (BUG-seller-704) |
| SDO-x19 | Tabs are disabled while a page or the next page loads | ❌ | — | No test at all. New uncommitted code (`tabsLocked`). |
| SDO-x20 | Empty tab: "No orders found" | ❌ | — | unit only: orders.test.tsx |
| SDO-x21 | Scroll to the bottom loads the next page, adds it, stops at `has_more_pages: false` | ❌ | — | unit only: orders.test.tsx |
| SDO-x22 | Next page loading keeps the list + one placeholder | ❌ | — | unit only: orders.test.tsx (BUG-seller-705) |
| SDO-x23 | Next page refused: first page kept, red inline alert | ❌ | — | unit only: orders.test.tsx |
| SDO-x24 | Load failure with an empty list: backend message + Retry; Retry reloads | ❌ | — | unit only: orders.test.tsx |
| SDO-x25 | Orders bar back arrow returns to the dashboard home | ❌ | — | unit only: orders.test.tsx. SD-02 presses the dashboard's own back, not this one. |
| SDO-x26 | Push refresh: FCM topics `shop_<id>_order(_detail)`; a push reloads page 1 | ❌ | — | unit only: orders.test.tsx (reload). No e2e for FCM. |
| SDO-x27 | Switch shop: only the new shop's orders show | ❌ | — | No test at all. `sellerOrders` lives in the global store. |
| SDO-x28 | Filter icon (list) and ⋮ button (detail) | ❌ | — | Not in the app: no click handler. Nothing to test. |

#### Orders tab — order detail
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDO-x29 | Order Number, Order Date, Order Invoice (USD) | ❌ | — | unit only: orders.test.tsx |
| SDO-x30 | Collect Type icons turn black when all items are confirmed / packed / collected | ❌ | — | No test at all. |
| SDO-x31 | Duration To Do Action: "Remaining 2h 5m" / "2h" / "45m" / "No remaining time" | ❌ | — | unit only: orders.test.tsx |
| SDO-x32 | Counts Confirmed x/N, Packed x/N, Collected x/N, by quantity | ❌ | — | unit only: orders.test.tsx (Confirmed only) |
| SDO-x33 | Item block: brand, name ("Product #id" fallback), colour / size / N/A, ID, quantity, picture | ❌ | — | unit only: orders.test.tsx |
| SDO-x34 | Item price: offer price, or unit price when there is no offer; "price / total" when qty > 1 | ❌ | — | unit only: orders.test.tsx (BUG-seller-702) |
| SDO-x35 | Item status label Pending / Confirmed / Packed | ❌ | — | unit only: orders.test.tsx |
| SDO-x36 | Data shapes: `product_details` as a JSON string; grouped (array) details | ❌ | — | unit only: orders.test.tsx |
| SDO-x37 | Back from the detail: list on the same tab, error cleared | ❌ | — | unit only: orders.test.tsx |
| SDO-x38 | Open order leaves the list → "No order selected" + back | ❌ | — | unit only: orders.test.tsx |

#### Orders tab — item actions
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDO-x39 | Pending item offers "Confirm & Start Packing" and "Cancel" | ❌ | — | unit only: orders.test.tsx |
| SDO-x40 | Confirm: `PUT /shop/orders/details/status/confirmed`; item → Confirmed, "Packed" button shows | ❌ | — | unit only: orders.test.tsx. CMT-09 moves orders through admin + fleet, not the seller. |
| SDO-x41 | Packed: `PUT …/status/packed`; item → Packed + "Ready To Collect" | ❌ | — | unit only: orders.test.tsx |
| SDO-x42 | Cancel: `PUT /shop/orders/details/cancel` with the whole qty; item leaves the order | ❌ | — | unit only: orders.test.tsx, services/sellerDashboard/updateShopInfoBody.test.ts (BUG-seller-701). There is no confirm dialog. |
| SDO-x43 | Backend keeps Confirm / Pack / Cancel after a reload | ❌ | — | No test. The screen updates locally only. |
| SDO-x44 | Shopper's order page shows the seller's confirm, pack or cancel | ❌ | — | No cross-flow test. |
| SDO-x45 | Seller sees "Collected" after the fleet collects | ❌ | — | No test. CMT-09's delivered order could feed this check. |
| SDO-x46 | "Updating..." label; buttons disabled during the call (no double send) | ❌ | — | No test at all. |
| SDO-x47 | Buttons disabled on a cancelled order or a qty-0 line | ❌ | — | unit only: orders.test.tsx (cancelled order only) |
| SDO-x48 | Refused or thrown action: item state kept, backend reason in a red alert | ❌ | — | unit only: orders.test.tsx (BUG-seller-703) |
| SDO-x49 | Item with no id, or qty 0, sends nothing | ❌ | — | unit only: orders.test.tsx |
| SDO-x50 | Order-level "Change status" (`PATCH /shop/orders/status`) | ❌ | — | Not in the app: the UI is commented out. Only the service remains. |

#### Product Orders modal (from a product card)
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDO-x51 | Card "Orders" button shows only with READ_ORDERS exactly (not any order permission) | ❌ | — | No test at all. No unit test covers the button. |
| SDO-x52 | Orders button opens the modal and does not follow the card's edit link | ❌ | — | No test at all. |
| SDO-x53 | Header: product picture, name ("Product Orders" fallback), Product ID | ❌ | — | No test at all. |
| SDO-x54 | Open: `GET /shop/products/{id}/orders` page 1, no status | ❌ | — | unit only: productOrders/ProductOrdersModal.test.tsx, services/sellerDashboard/productOrders.test.ts |
| SDO-x55 | Card in the shopper's shape: "Today \| time", id, status → icon, invoice | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x56 | Total in the shop currency, USD fallback | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x57 | Pictures are this product's lines only | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x58 | Live: modal lists the QA product's real orders | ❌ | — | No test. BUY-01's order could be checked here. |
| SDO-x59 | Filter All / In Progress / Collected / Returned / Canceled asks that status from page 1; old rows cleared | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x60 | A late answer for an older filter is ignored | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x61 | Paging Next / Previous; disabled while loading; no bar on one page | ❌ | — | unit only: ProductOrdersModal.test.tsx (Next only) |
| SDO-x62 | Empty: "No orders found" + a subtitle per filter | ❌ | — | unit only: ProductOrdersModal.test.tsx ("All" only) |
| SDO-x63 | Load failure: error card + Retry; inline alert when rows exist | ❌ | — | unit only: ProductOrdersModal.test.tsx (message only; Retry not pressed) |
| SDO-x64 | Close by ×, Close button, backdrop, Esc | ❌ | — | unit only: ProductOrdersModal.test.tsx |
| SDO-x65 | Modal is read-only (no actions on cards) | ❌ | — | No test. Read-only by design. |

#### Carts tab
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDC-x1 | Carts tile opens the section | ⚠️ | sellerDashboard.live.spec.ts › SD-02 | Runs only if offered. `DashboardTab` type has no "carts". |
| SDC-x2 | Side-menu Carts entry + badge = active carts total, one shared call | ❌ | — | unit only: tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx |
| SDC-x3 | Small role: Carts tile not offered | ❌ | — | SCRIPT-26 does not list carts in WITHHELD. |
| SDC-x4 | No READ_CARTS: "You do not have permission to view carts.", no fetch | ❌ | — | unit only: carts/CartsTab.test.tsx |
| SDC-x5 | Permissions loading → placeholder, not a refusal | ❌ | — | unit only: listRefresh.test.tsx |
| SDC-x6 | Opening loads `GET /shop/carts` and `GET /shop/old-carts` page 1; counts in the labels and the badge | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x7 | Active row: masked name (Axxxx), cart_group_id, Updated date, Items, Pieces | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x8 | Live: the shopper's bag with the QA product shows as an active cart | ❌ | — | No test. The shopper suite fills that bag. |
| SDC-x9 | Active list paging | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x10 | Active empty state | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x11 | Active load failure + Retry | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x12 | Old row: masked name or "Customer #id", Last added, Items | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x13 | Old list paging | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x14 | Old empty state; old failure + Retry | ❌ | — | unit only: CartsTab.test.tsx (failure text only) |
| SDC-x15 | Search in old carts | ❌ | — | Not in the tab UI. The service supports `?search=`; only the modal uses it. |
| SDC-x16 | Active "View Details": `GET /shop/carts/{id}`; "Back to Carts" | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x17 | Active detail header: masked name, Cart Group ID, "Orders with your shop" | ❌ | — | unit only: CartsTab.test.tsx (in part) |
| SDC-x18 | Line: picture / "No Image", name, colour, size, qty, stock badge, discount price, line total | ❌ | — | unit only: CartsTab.test.tsx, ActiveCartDetails.test.tsx ("in stock" only; out-of-stock not tested) |
| SDC-x19 | One cart total per currency; Items Count | ❌ | — | unit only: carts/ActiveCartDetails.test.tsx |
| SDC-x20 | Detail failure + Retry; "Cart not found" | ❌ | — | unit only: ActiveCartDetails.test.tsx (failure text only) |
| SDC-x21 | "View Carts" on a line opens the Product Carts modal | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x22 | Old "View Details": `GET /shop/old-carts/{customerId}`, "Out Of Bag!" banner, lines, back | ❌ | — | unit only: CartsTab.test.tsx |
| SDC-x23 | Old cart detail paging | ❌ | — | No test at all. |
| SDC-x24 | Old detail failure + Retry; "Old cart not found" | ❌ | — | unit only: CartsTab.test.tsx (failure text only) |
| SDC-x25 | Card "Carts" button (READ_CARTS) opens the modal; card link not followed | ❌ | — | No test at all. No unit test covers the button. |
| SDC-x26 | Modal loads `GET /shop/products/{id}/carts` + `GET /shop/old-carts?search={id}`; counts | ❌ | — | unit only: carts/ProductCartsModal.test.tsx. The search may also match a customer id. |
| SDC-x27 | Active sub-tab: lines with masked customer | ❌ | — | unit only: ProductCartsModal.test.tsx |
| SDC-x28 | Old sub-tab rows (cannot be clicked) | ❌ | — | unit only: ProductCartsModal.test.tsx |
| SDC-x29 | Modal paging | ❌ | — | unit only: ProductCartsModal.test.tsx (active only) |
| SDC-x30 | Modal empty states; failure + Retry | ❌ | — | unit only: ProductCartsModal.test.tsx (failure text only) |
| SDC-x31 | Close by ×, Close button, backdrop, Esc | ❌ | — | unit only: ProductCartsModal.test.tsx |
| SDC-x32 | Live: modal shows the shopper's open line for the QA product | ❌ | — | No test. |

**Summary:** ✅ 0 · ⚠️ 3 · ❌ 94 (97 rows).

**Top gaps:**
- **SDO-x40 to SDO-x43: Confirm, Packed and Cancel never run against the backend.** No test proves that the change stays after a reload. This is the seller's money path. Cancel was broken until BUG-seller-701 (wrong path). Only a unit test caught it.
- **SDO-x9 / SDO-x58: no test reads the real order list or the Product Orders modal.** BUY-01 already places a real order on the QA product, so the data exists for both checks.
- **SDO-x6 / SDO-x51: no permission check runs against the backend.** The UI shows the item actions to any order permission. The card Orders button needs exactly READ_ORDERS, and no test covers that button at all.
- **SDO-x7: possible wrong "Access Denied" on a direct `?tab=orders` link.** The page draws Orders without the `permissionsReady` wait that Carts uses. This is not confirmed and has no test.
- **SDC-x8 / SDC-x32: no test checks a cart on the seller side.** The shopper's bag holding the QA product is never checked in the Carts tab or the Product Carts modal.

### Seller comments and seller stories
Scope: the seller dashboard Comments tab (FAQ / Reviewing, reply / edit / delete, permission gates, server checks in `services/elastic/sellerComments.ts` and `app/api/seller/comments/*`) and the Stories tab (list, preview, upload, product picker, delete, reach to shoppers). This sub-section goes deeper than the seller rows in the Comments and Stories sections above.

Fixes to earlier rows:
- **SDS-x36 passes for the wrong reason** (fixes STO-d15). No media was chosen, so Share is off anyway.
- **SDM-x19:** the unit test checks the review text, not the stars (fixes CMT-x46).
- **SDM-x5 / SDS-x4:** a direct link without permission opens a blank section with no Access Denied (fixes CMT-x36 note).

#### Comments — open and gate
| # | Case / sub-task | Status | E2E test (file › ID or test name) | Notes |
|---|---|---|---|---|
| SDM-x1 | Comments entry opens the section (READ_COMMENTS) | ✅ | comments.live.spec.ts › CMT-04, CMT-10 "the seller is offered the comments section" | Opens through the tile (`openTab`). |
| SDM-x2 | First FAQ page loads from ES and draws at least one card | ✅ | comments.live.spec.ts › CMT-04 (`openCommentsSection`) | Fails by name when the read never answers. |
| SDM-x3 | Skeleton while the first read runs | ❌ | — | No test. |
| SDM-x4 | Tile withheld without READ_COMMENTS | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. Checks the tile only. |
| SDM-x5 | Direct link `?tab=comments` without READ_COMMENTS | ❌ | — | The app draws nothing and no Access Denied. The helper's "denied" branch never fires for this tab. |
| SDM-x6 | Permission list fails to load, then the seller opens Comments | ❌ | — | The tab draws nothing and offers no retry. No test. |

#### Comments — FAQ / Reviewing filter
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x7 | Opens on FAQ by default | ⚠️ | comments.live.spec.ts › CMT-04 | Question cards are found. The segment state is not asserted. |
| SDM-x8 | Switch to "Reviewing" loads reviews from page 1 | ❌ | — | unit only: tests/components/SellerDashboard/CommentsTab.test.tsx |
| SDM-x9 | Reviews collapse to one per order line (duplicate docs) | ❌ | — | unit only: tests/services/elastic/sellerComments.test.ts |
| SDM-x10 | Comments with `status: deleted` are not listed | ❌ | — | No test. CMT-08 checks the shopper page only. |

#### Comments — card content
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x11 | Card is bound to its comment id | ✅ | comments.live.spec.ts › CMT-04 (`requireOurCard`) | `data-comment-id` asserted. |
| SDM-x12 | Question text on the card | ✅ | comments.live.spec.ts › CMT-04 | Text is read for the run mark and never printed. |
| SDM-x13 | Shopper name and avatar (fallback picture) | ❌ | — | unit only: CommentsTab.test.tsx (name only; avatar fallback not tested) |
| SDM-x14 | Question date (ar-EG format in Arabic) | ❌ | — | No test. |
| SDM-x15 | Product name, image and "View product" link | ❌ | — | unit only: CommentProductInfo.test.tsx. The link is `/products/<slug>`, with no locale prefix. |
| SDM-x16 | Variant colour / size, "Standard" fallback | ❌ | — | unit only: CommentProductInfo.test.tsx, CommentsTab.test.tsx |
| SDM-x17 | Product details fail: "Product #id" and a fallback icon | ❌ | — | unit only: CommentProductInfo.test.tsx |
| SDM-x18 | One product fetch per product id | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x19 | Stars on a review card; no stars when rating is null | ❌ | — | No test. The unit test checks the review text, not the stars. |
| SDM-x20 | Heart counts on the question and on the reply | ❌ | — | unit only: sellerComments.test.ts (server side adds the counts) |
| SDM-x21 | "Waiting Seller Reply..." on an unanswered question | ⚠️ | comments.live.spec.ts › CMT-04 | `data-has-reply="false"` is asserted, not the label. The label is unit only. |
| SDM-x22 | RTL layout in ar / ku | ❌ | — | No test. |

#### Comments — paging, empty and errors
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x23 | Load More is shown only when more pages exist | ❌ | — | unit only: CommentsTab.test.tsx. The selector exists in selectors.ts but no test uses it. |
| SDM-x24 | Load More adds the next page to the list | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x25 | Load More read fails | ❌ | — | No test. The failure is only logged; the seller sees nothing. |
| SDM-x26 | Empty state "No comments found." | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x27 | List read refused: shows the same empty state, no retry | ❌ | — | unit only: CommentsTab.test.tsx. The seller cannot tell a refusal from "no comments". |
| SDM-x28 | Page past the 10 000-result window is refused | ❌ | — | unit only: sellerComments.test.ts |

#### Comments — reply
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x29 | Reply opens the form bound to that question | ✅ | comments.live.spec.ts › CMT-04 (`answerQuestion`) | The form's `data-comment-id` is asserted. |
| SDM-x30 | Form shows the shopper name and the quoted question | ❌ | — | No test. |
| SDM-x31 | Submit: the form closes and the card shows the answer | ✅ | comments.live.spec.ts › CMT-04 | The form closes only when the backend says yes. |
| SDM-x32 | Answer is shown as the shop's ("A" + shop name, "Dear <shopper>") with a reply date | ❌ | — | unit only: CommentsTab.test.tsx (attribution). Reply date: no test. |
| SDM-x33 | Empty answer: Submit is off | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x34 | Answer of only spaces is not sent | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x35 | Cancel and X close the form; nothing is sent | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x36 | Reply refused: the form stays open | ❌ | — | unit only: CommentsTab.test.tsx. The seller sees no message; there is only a Sentry log. |
| SDM-x37 | Submitting state (loading button) | ❌ | — | No test. |
| SDM-x38 | Server strips HTML from the reply and caps it at 1000 characters | ❌ | — | unit only: sellerComments.test.ts |
| SDM-x39 | The answer reaches the shopper's product page | ✅ | comments.live.spec.ts › CMT-05 | Bounded reloads for ES lag. Checks the text. |
| SDM-x40 | The answer survives a shopper reload | ✅ | comments.live.spec.ts › CMT-06 | — |

#### Comments — edit reply
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x41 | Edit Reply opens the form filled with the current answer | ✅ | comments.live.spec.ts › CMT-10 (`editAnswer`) | The title "Edit Reply" is not asserted. |
| SDM-x42 | Edit is saved; the card shows the new text | ✅ | comments.live.spec.ts › CMT-10 | The edit-vs-create call is checked by unit test only. |
| SDM-x43 | An answer survives a fresh read of the seller list | ✅ | comments.live.spec.ts › CMT-10 (`requireOurAnsweredCard`) | The section is opened again; the answer must carry the run mark. |
| SDM-x44 | The edited answer reaches the shopper | ✅ | comments.live.spec.ts › CMT-11 | — |
| SDM-x45 | Edit refused by the backend | ❌ | — | No test, unit included. |

#### Comments — delete reply
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x46 | Delete Reply asks to confirm; accepting clears the answer | ✅ | comments.live.spec.ts › CMT-10 (`deleteAnswer`) | `data-has-reply` goes back to "false". |
| SDM-x47 | Confirm cancelled: nothing is sent | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x48 | Delete refused: the answer stays | ❌ | — | unit only: CommentsTab.test.tsx. The seller sees no message. |
| SDM-x49 | "Deleting..." state; no second delete at the same time | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x50 | Shopper sees no answer, and the question stays | ✅ | comments.live.spec.ts › CMT-11 | — |

#### Comments — permission gates in the UI
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x51 | With all three permissions, Reply / Edit / Delete are offered | ✅ | comments.live.spec.ts › CMT-04, CMT-10 | Messages name REPLY_COMMENT, EDIT_REPLY and DELETE_REPLY. |
| SDM-x52 | Reply hidden without REPLY_COMMENT | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x53 | Edit Reply hidden without EDIT_REPLY | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x54 | Delete Reply hidden without DELETE_REPLY | ❌ | — | unit only: CommentsTab.test.tsx |
| SDM-x55 | No reply control on a review, even with REPLY_COMMENT | ❌ | — | unit only: CommentsTab.test.tsx |

#### Comments — server-side checks and routes
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x56 | Server action checks the permission again at core (`/shop/auth/permissions`) | ❌ | — | unit only: sellerComments.test.ts. SCRIPT-26 fakes only the browser's answer. |
| SDM-x57 | Seller is not a member of the shop: "Not authorized for this shop." | ❌ | — | unit only: sellerComments.test.ts |
| SDM-x58 | Another shop's comment id: "Comment not found or not permitted." | ❌ | — | unit only: sellerComments.test.ts |
| SDM-x59 | Missing shop id or missing comment id is refused | ❌ | — | unit only: sellerComments.test.ts |
| SDM-x60 | Rate limit on reads and writes ("Too many requests") | ❌ | — | unit only: sellerComments.test.ts. Each e2e re-open uses one read from the limit. |
| SDM-x61 | Stale permissions copy is used while core fails | ❌ | — | unit only: sellerComments.test.ts |
| SDM-x62 | Mobile routes: 401 with no token, CORS preflight, POST / PUT / DELETE | ❌ | — | unit only: tests/app/api/seller/comments/*. No e2e test calls these routes. |
| SDM-x63 | Route maps the failure text to 403 / 401 / 404 / 429 | ❌ | — | unit only: route.test.ts (only the 400 fallback). 403 / 404 / 429 have no test. |
| SDM-x64 | `/social` counters (reactions, FAQ, reviews, shares) | ❌ | — | unit only: sellerComments.test.ts, social/route.test.ts |

#### Comments — ES lag
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDM-x65 | A new question reaches the seller list despite ES lag | ✅ | comments.live.spec.ts › CMT-04 (`findQuestionCard`) | Opens the section again, up to 4 times, 15 s apart. |

#### Stories — open and gate
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x1 | Stories entry and section render with READ_STORY | ✅ | sellerStories.live.spec.ts › SST-01 | Checks the menu entry before opening. |
| SDS-x2 | CREATE_STORY and DELETE_STORY are read before anything is written | ✅ | sellerStories.live.spec.ts › SST-01 | Reads `data-can-create` / `data-can-delete`. |
| SDS-x3 | Tile withheld for a small role | ⚠️ | sellerDashboard.scripted.spec.ts › SCRIPT-26 | Scripted: the permissions answer is faked. |
| SDS-x4 | Direct link `?tab=stories` without READ_STORY | ❌ | — | The app draws nothing and no Access Denied. No test. |
| SDS-x5 | Add Story hidden without CREATE_STORY | ❌ | — | unit only: tests/components/SellerDashboard/StoriesTab.test.tsx |
| SDS-x6 | Bin hidden without DELETE_STORY | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x7 | With neither permission, the seller can still view stories | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x8 | Stories backend refuses create / delete for a small role | ❌ | — | No test. Needs a real small-role account. |

#### Stories — list
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x9 | Skeleton while loading | ❌ | — | No test. |
| SDS-x10 | Grid lists the shop's stories; each card has its id | ✅ | sellerStories.live.spec.ts › SST-07, SST-02 | SST-07 sees the card on screen; SST-02 reads the backend list. |
| SDS-x11 | Card shows thumbnail, Photo / Video badge and date | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x12 | View count on the card | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x13 | Link and product slug in the card footer | ❌ | — | unit only: StoriesTab.test.tsx. SST-02 reads the backend row, not the card. |
| SDS-x14 | Total count in the header (`meta.total`) | ❌ | — | No test found. |
| SDS-x15 | A story is treated as video when it has a video path but no `is_video` | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x16 | Grouped and `data.stories` answer shapes are flattened | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x17 | Empty state "No stories yet" | ❌ | — | unit only: StoriesTab.test.tsx. `waitForStoriesList` accepts it but asserts nothing. |
| SDS-x18 | List error with the backend's reason; Retry loads the same page | ❌ | — | unit only: StoriesTab.test.tsx. E2E only fails by name when the error shows. |
| SDS-x19 | Next / Previous and "Page X of N" | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x20 | Stories 401: exchange, wait 2 s, retry; a refused exchange shows the verify prompt | ⚠️ | sellerStories.live.spec.ts › all cases (`waitForStoriesList`) | A guard only. It names a lost session, but no case forces a 401. |

#### Stories — preview modal
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x21 | Preview shows the photo, link, product slug, viewers and date | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x22 | Video plays; a story with no media shows a blank frame | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x23 | Close with X or the backdrop | ❌ | — | unit only: StoriesTab.test.tsx (X only). The backdrop has no test. |

#### Stories — upload form
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x24 | Add Story opens the form | ✅ | sellerStories.live.spec.ts › SST-02, SST-09 | — |
| SDS-x25 | Both upload buttons open the file picker | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x26 | Photo goes to the crop step, then the preview | ✅ | sellerStories.live.spec.ts › SST-02 | Crop opening is asserted. The preview is implied: Share stays off without it. |
| SDS-x27 | Crop closed without saving: no preview, input reset | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x28 | Remove the preview; Change media | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x29 | Video up to 60 s is previewed with no crop step | ❌ | — | unit only: StoriesTab.test.tsx. E2E uploads no video. |
| SDS-x30 | Video over 60 s refused ("1 minutes video only") | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x31 | SVG refused with a toast; no crop, no preview | ✅ | sellerStories.live.spec.ts › SST-09 | — |
| SDS-x32 | File over 10 MB refused with a toast | ✅ | sellerStories.live.spec.ts › SST-09 | Share state is not checked in this step. |
| SDS-x33 | File of an unknown type is ignored | ❌ | — | unit only: StoriesTab.test.tsx. The seller gets no message. |
| SDS-x34 | Share is off with no media | ✅ | sellerStories.live.spec.ts › SST-09 (SVG step) | — |
| SDS-x35 | A bad link shows an error | ✅ | sellerStories.live.spec.ts › SST-09 | — |
| SDS-x36 | A bad link turns Share off | ⚠️ | sellerStories.live.spec.ts › SST-09 | No media was chosen, so Share is off anyway. The check passes for the wrong reason. |
| SDS-x37 | A real link (bare domain) clears the error | ✅ | sellerStories.live.spec.ts › SST-09 | — |
| SDS-x38 | A bare domain is saved with `https://` | ❌ | — | unit only: StoriesTab.test.tsx. SST-02 uses a full link. |
| SDS-x39 | An empty link is sent as null | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x40 | Cancel closes the form | ✅ | sellerStories.live.spec.ts › SST-09 (`closeStoryForm`) | "Nothing sent" is not checked. X: unit only. |

#### Stories — product picker
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x41 | Pick a product; the chosen chip shows it | ✅ | sellerStories.live.spec.ts › SST-02 | — |
| SDS-x42 | Change the product | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x43 | Remove the product | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x44 | Load more products | ❌ | — | unit only: StoriesTab.test.tsx. SST-02 needs the product on page 1. |
| SDS-x45 | Product load fails: "No products found" | ❌ | — | unit only: StoriesTab.test.tsx. The failure looks like a shop with no products. |
| SDS-x46 | Close the picker with X or the backdrop | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x47 | The product id reaches the stories backend | ✅ | sellerStories.live.spec.ts › SST-02 | The slug is kept but not asserted. |

#### Stories — save
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x48 | Media upload, then save; a failure names which leg failed | ✅ | sellerStories.live.spec.ts › SST-02 (`watchSellerUpload`) | The save leg is asserted. The message names the media server or the stories backend. |
| SDS-x49 | Media server refuses, or is not set up | ❌ | — | No test forces it. The app shows "Upload Failed Try Again". |
| SDS-x50 | Save refused: the form stays open and a toast shows | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x51 | While uploading, the form is locked and Share shows loading | ❌ | — | No test. |
| SDS-x52 | Success toast "Story uploaded successfully" | ❌ | — | No test found. SST-02 does not record toasts. |
| SDS-x53 | After success, the form closes and the list reloads on screen | ⚠️ | sellerStories.live.spec.ts › SST-02 | Reads the backend list, not the screen. The reload is checked by unit test only. |
| SDS-x54 | Video duration is sent with the story | ❌ | — | No e2e video upload. |

#### Stories — delete
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x55 | Delete asks to confirm; confirming takes the card off the screen | ✅ | sellerStories.live.spec.ts › SST-07 (`deleteSellerStory`) | — |
| SDS-x56 | The backend list no longer holds the story | ✅ | sellerStories.live.spec.ts › SST-07 | Proves the story was there before the delete. |
| SDS-x57 | Confirm cancelled: nothing is deleted | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x58 | Delete refused: the story stays and a toast gives the reason | ❌ | — | unit only: StoriesTab.test.tsx |
| SDS-x59 | Delete loading state turns off the buttons | ❌ | — | No test. |

#### Stories — reaching the shopper
| # | Case / sub-task | Status | E2E test | Notes |
|---|---|---|---|---|
| SDS-x60 | The story is in the home feed (`users_stories`) | ✅ | sellerStories.live.spec.ts › SST-03 | Reads up to 3 pages; names the stories backend if missing. |
| SDS-x61 | The ring is on the uploader's own bar | ✅ | sellerStories.live.spec.ts › SST-05 | — |
| SDS-x62 | The story is hidden from a guest | ✅ | sellerStories.live.spec.ts › SST-04 | Checks the bar has content first, then that the story is absent. |
| SDS-x63 | The opened story offers a product button | ✅ | sellerStories.live.spec.ts › SST-05 | Reads `data-has-product` on this run's own story. |
| SDS-x64 | The product page lists the story | ✅ | sellerStories.live.spec.ts › SST-06 | — |
| SDS-x65 | The product button opens the product | ✅ | sellerStories.live.spec.ts › SST-08 | — |
| SDS-x66 | A deleted story leaves the home feed and the product page | ❌ | — | SST-07 checks the seller list only. |
| SDS-x67 | The view count rises after a shopper views the story | ❌ | — | No test (`increase_viewers`). |

**Summary:** ✅ 38 · ⚠️ 7 · ❌ 87 (132 rows). Comments: ✅ 16, ⚠️ 3, ❌ 46. Stories: ✅ 22, ⚠️ 4, ❌ 41.

**Top gaps:**
1. **SDM-x56 / SDM-x57 / SDM-x58: the server-side checks have no e2e test.** These are the permission check at core and the shop binding, and they are the real security boundary. Only unit tests cover them. No e2e case sends a forged shop id or another shop's comment id.
2. **SDM-x36 / SDM-x48: a refused reply or a refused delete has no e2e test.** The app also shows the seller no message in these cases, only a Sentry log. This is a likely product gap, not just a test gap.
3. **SDM-x52 to SDM-x54 / SDS-x5 to SDS-x8: the per-permission gates are checked by unit tests only.** No real small-role account exists. SCRIPT-26 fakes the browser's answer, so it cannot prove that the backend refuses.
4. **SDS-x66: no test checks that a deleted story leaves the home feed and the product page.** So a shopper could keep seeing a story that was removed, and no test would notice.
5. **SDS-x29 / SDS-x30 / SDS-x54: the whole video upload path is unit only.** This covers the preview, the 60 s limit and the duration sent to the backend.

