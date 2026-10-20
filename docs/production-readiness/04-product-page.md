# Product page — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** The product page shows and sells the product correctly. The virtual try-on is fake (it waits 3 s and shows the shopper's own photo), and SEO links fall back to the dev domain when one env value is missing.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
The shopper opens `/[lang]/products/[productId]` from a link, a search result, a listing card, a story or a share.
From inside the app, the same page opens as an overlay over the current page (intercepted route `app/(client)/[lang]/@modal/(.)products/[productId]`, decided by `components/ModalRoute/ModalSlot.tsx`).
Both routes render `components/Product/ProductPageContent.tsx`. The mobile app reads the same data through `/api/mobile/product/*` and `/api/related-products/[id]`.
Buyer comments, ratings and the FAQ also sit on this page. They are covered in the comments report, not here.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper opens a product URL → full page renders on the server with photos, name, details and price | core or gateway (`/web/product/globalDetails`, `/web/product/qtyPriceDetails`) + Redis (120 s cache) | `app/(client)/[lang]/products/[productId]/page.tsx`, `serverRequests/product.tsx` `GetGlobalProduct`, `GetProductPriceQtyDetails` | `tests/app/products/page.test.tsx`, `tests/components/Product/ProductPageContent.test.tsx`, `tests/serverRequests/product.test.ts`; e2e "a listing leads to a product page" (`guest.live.spec.ts`) |
| W-2 | Shopper opens a product from inside the app → it shows as an overlay; closing it returns to the same scroll place | same as W-1 | `app/(client)/[lang]/@modal/(.)products/[productId]/page.tsx`, `components/ModalRoute/ModalSlot.tsx`, `overlayScroll.ts` | `tests/app/modal/pages.test.tsx`, `tests/components/ModalRoute/ModalSlot.test.tsx`; e2e GUEST-42 |
| W-3 | Shopper opens a product that does not exist (backend 404) → sent to the home page with a "product not found" message | core or gateway (`/web/product/product-meta`) | `page.tsx` (`redirect`, 307), modal `page.tsx` (`NotFoundRedirect`), `components/Home/index.tsx` | `tests/app/products/page.test.tsx`, `tests/app/modal/pages.test.tsx` |
| W-4 | A temporary backend error on the meta call does not send the shopper away; the page still renders | same | `GetProductMeta` returns `productNotFound` only on 404 | `tests/serverRequests/product.test.ts` |
| W-5 | Photo gallery: one slide set per colour, swipe, image counter, tap to open full-screen zoom | none (data from W-1) | `ProductPhotoSliderWrapper.tsx`, `ActiveColorSlider.tsx`, `ProductDetailsSlider.tsx`, `colorImageGroups.ts` | `ProductPhotoSliderWrapper.test.tsx`, `ActiveColorSlider.test.tsx`, `ProductDetailsSlider.test.tsx`, `colorImageGroups.test.ts` |
| W-6 | Product video: small player plays muted; a tap opens it large with sound; swipe between videos | none | `ProductVideosWrapper.tsx`, `components/products/ProductVideo.tsx` | `ProductVideosWrapper.test.tsx`, `ProductVideo.test.tsx` (BUG-products-6 guard) |
| W-7 | Brand logo, "verified" badge, and name line "product \| category \| colour" | none | `ProductNameAndBrand.tsx` | `ProductNameAndBrand.test.tsx` |
| W-8 | Product description shows as HTML, cleaned by `sanitizeHtml` | none | `ProductDetailsTextWrapper.tsx`, `ProductDetailsText.tsx` | `ProductDetailsTextWrapper.test.tsx`, `ProductDetailsText.test.tsx` |
| W-9 | Rating stars, buyer count, views, "Good Quality Product", "Recommend It By N Buyer", and "Made in" flag; a tap opens the details sheet | Elasticsearch (interactions, views, comments) | `ProductGeneralPropertiesWrapper.tsx`, `GetProductGeneralData`, `GeneralPropertiesModal.tsx` | `ProductGeneralPropertiesWrapper.test.tsx`, `ProductGeneralProperties.test.tsx`, `ProductRating.test.tsx` |
| W-10 | Feature labels show in blue / orange | none | `ProductFeaturesWrapper.tsx` | `ProductFeaturesWrapper.test.tsx` |
| W-11 | Descriptors (group, icon, values) show in a row | none | `ProductDescriptorsWrapper.tsx` | `ProductDescriptorsWrapper.test.tsx` |
| W-12 | Shopper taps a colour → URL gets `?color=`, the gallery and the active border switch at once | none | `ProductColorsWrapper.tsx`, `ProductColorItem.tsx`, `hooks/useLiveColor` | `ProductColorsWrapper.test.tsx`, `ProductColorItem.test.tsx` |
| W-13 | Shopper taps a size → URL gets `?size=`, the size is marked; the add-to-bag sheet reads the same `?size=` | none | `ProductSizesWrapper.tsx`, `SizeItemWrapper.tsx`, `components/Cart/AddToCart/AddToCartComponent.tsx:267` | `ProductSizesWrapper.test.tsx`, `SizeItemWrapper.test.tsx` |
| W-14 | Size reviews (small / fits / large) show when the product has sizes | Elasticsearch | `ProductSizeReviews.tsx` | `ProductSizeReviews.test.tsx` |
| W-15 | Expected delivery date banner: weekday, date, number of days, country name; a tap opens the delivery sheet | core or gateway (starting settings) | `ProductExpectedDeleiveryWrapper.tsx`, `ExpectedDeleiveryBanner.tsx`, `ExpectedDeleiveryModal.tsx` | `ProductExpectedDeleiveryWrapper.test.tsx`, `ExpectedDeleiveryBanner.test.tsx`, `ExpectedDeleiveryModal.test.tsx` |
| W-16 | "Free Shipping" shows when `shipping_cost` is 0; "Free Return" shows when `allow_return_in_days` > 0 | none | `FreeShippingOption.tsx`, `FreeReturnBadge.tsx` | `FreeShippingOption.test.tsx`, `FreeReturnBadge.test.tsx` |
| W-17 | Product stories row shows the stories linked to the product; test stories are hidden from non-testers | stories backend (`/api/v1/stories/product_stories/{id}`) | `ProductStoriesWrapper.tsx`, `GetProductStoriesData`, `ProductStories.tsx` | `ProductStoriesWrapper.test.tsx`, `ProductStories.test.tsx`; e2e SST-06, SST-08 |
| W-18 | "You May Also Like" row of related products, with more cards loaded on scroll | Elasticsearch | `RelatedProductsSection.tsx`, `RelatedProductsInfiniteScroll.tsx`, `GetRelatedProducts` | `RelatedProductsSection.test.tsx`, `RelatedProductsInfiniteScroll.test.tsx` |
| W-19 | Footer price row: old price, offer price, luck price, in the country currency | core or gateway (currency) | `ProductFooter.tsx`, `ProductFooterClient.tsx`, `ProductPricesWrapper.tsx` | `ProductFooter.test.tsx`, `ProductFooterClient.test.tsx`, tests in `tests/components/Server/product/ProductPrices/` |
| W-20 | Shopper taps the add button → the add-to-bag sheet opens with this product and colour first | core or gateway (`/cart/add`, in the cart section) | `components/products/AddToCartButton.tsx` | `AddToCartButton.test.tsx`; e2e BUY-01 (adds the QA product from its page) |
| W-21 | Shopper taps the heart → like or unlike is saved; count changes; on failure the old state comes back with a message | comments backend (`/products/like`, `/products/unlike`) | `ProductFooter.tsx/ProductLikeButton.tsx` | tests in `tests/components/Server/product/ProductFooter.tsx/`, `LikeButtton.test.tsx`; e2e CMT-01, CMT-08 |
| W-22 | Share sheet: share to chat contacts, Facebook, WhatsApp, email, copy link, and native share where the browser has it; each share is counted | chat backend (`share_product_on_apps`, contacts) | `ShareSection.tsx`, `ShareOptions.tsx`, `ShareButton.tsx` | `ShareSection.test.tsx`, `ShareOptions.test.tsx`, `ShareButton.test.tsx` |
| W-23 | "More" sheet: notify me (price / stock topics), add to checklist, add to compare | market backend + FCM; wishlist; compare | `MoreOptionsSection.tsx` | `MoreOptionsSection.test.tsx`; e2e WISH-02, WISH-03, WISH-04, CMP-02 |
| W-24 | Flash-deal product → orange border and a live countdown banner on the first photo | none | `ProductPhotoSliderWrapper.tsx`, `FlashDealBanner.tsx` | `FlashDealBanner.test.tsx`, `ProductPhotoSliderWrapper.test.tsx` |
| W-25 | Luck product → "Luck! Add To Bag Within N seconds" counter; it pauses when the tab is hidden; a redeemed product does not show it again | none (client timer + `redemed_ids` cookie) | `ProductRedeemCounter.tsx`, `hooks/useLuckTimer.ts`, `utils/luck` | `ProductRedeemCounter.test.tsx`, `tests/utils/luckIndex.test.ts` |
| W-26 | Back button returns to the previous page | none | `ProductBackButton.tsx` | `ProductBackButton.test.tsx` |
| W-27 | SEO: title (name, colour, size, brand, category), description, canonical and language alternates, Open Graph and Twitter image | core or gateway (`product-meta`) + Redis (1 h) | `GetProductMeta` (`serverRequests/product.tsx`), `generateMetadata` in `page.tsx` | `tests/serverRequests/product.test.ts`, `tests/app/products/page.test.tsx` |
| W-28 | Structured data (JSON-LD): Product, Offer (price, ISO currency, stock), real rating only, breadcrumb | Elasticsearch (rating) | `serverRequests/meta/StructuredData/ProductStructuredData.tsx` | `tests/serverRequests/meta/StructuredData/ProductStructuredData.test.ts` |
| W-29 | Mobile app: `GET /api/mobile/product/details/[slug]` and `/qty/[slug]` return the product in the mobile shape | core or gateway + Elasticsearch | `app/api/mobile/product/details/[slug]/route.ts`, `qty/[slug]/route.ts` | `tests/app/api/mobile/product/details/route.test.ts`, `tests/app/api/mobile/product/qty/route.test.ts` |
| W-30 | Mobile app: `GET /api/related-products/[id]` returns related products | Elasticsearch | `app/api/related-products/[id]/route.ts` | `tests/app/api/related-products/route.test.ts` |
| W-31 | Page is translated (en/ar/tr/ku) and right-to-left for ar and ku | none | `ProductPageContent.tsx` (`isRtl`) and children | covered inside the component tests above |

## ⚠️ Works, with limits
- **L-1** Product data, price and stock come from a Redis cache for up to 120 s (`PRODUCT_REDIS_TTL_SECONDS`). A price or stock change can take 2 minutes to show.
- **L-2** SEO metadata is cached for 1 hour per product, language and country. A deleted product keeps its page for up to 1 hour before the 404 redirect works.
- **L-3** The delivery banner says "Work Days", but the code adds calendar days (`Date.now() + days * 24 h`). Weekends and holidays are not skipped (`ProductExpectedDeleiveryWrapper.tsx:29`).
- **L-4** "Free Return" shows when returns are allowed at all (`allow_return_in_days` > 0). The text says "completely free", but the code does not check who pays for the return.
- **L-5** Likes and share counts come from Elasticsearch. Right after a like, a reload can show the old state for a few seconds. This is the normal index lag.
- **L-6** On the heart, the icon flips before the "already busy" check. A fast double tap can show the wrong heart until the next reload (`ProductLikeButton.tsx:145`).
- **L-7** The meta description fallback ("Shop X on Trydos — secure checkout…") is English for all languages (`serverRequests/product.tsx:331`).
- **L-8** The overlay route has no `generateMetadata`. When the product opens as an overlay, the browser tab keeps the title of the page underneath.
- **L-9** The footer (price, add button, like, share) mounts only after the page runs in the browser. The server HTML has no visible price; the JSON-LD has it.
- **L-10** The stories row is read on the server with the stories token as it is. The token lives 60 s, and this server call does not renew it (see backend questions).
- **L-11** Email share uses the English subject "Check this out" when the product has no name.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | Virtual try-on is not built. "Try On" only waits 3 s (`setTimeout`) and then shows the shopper's own photo as the "result". No AI call exists. | A try-on button on the first photo of every product whose first category has an icon. The result is the same photo they uploaded. | `components/products/TryOnModal.tsx:146-150`; button shown by `ProductPhotoSliderWrapper.tsx:304` | Frontend / Product | Yes — a fake feature on almost every product; hide it or build it |
| M-2 | Canonical, Open Graph and JSON-LD URLs fall back to `https://trydos.ramaaz.dev` when `NEXT_PUBLIC_SITE_URL` is missing | Shared links and Google results point to the dev domain | `serverRequests/meta/StructuredData/Constants.ts:4` | Ops | Yes — set the env value in production |
| M-3 | The meta cache key has no colour or size, but the title has them. The first visitor's title is kept for 1 hour for everyone. | Title "Shirt \| red \| …" on the plain product URL, or the plain title on a colour URL | `serverRequests/product.tsx:278` and `:302-305` | Frontend | No |
| M-4 | Flash-deal end is "23:59:59 of the end date" in local time. The server (Vercel, UTC) and the shopper's phone use different time zones. | In Syria / Iraq (UTC+3) the countdown can run 3 hours past the planned end, or the banner can show on a deal the backend already closed | `ProductPhotoSliderWrapper.tsx:47`, `FlashDealBanner.tsx:38` | Product / Backend | No — but agree the time zone before the first flash deal |
| M-5 | The flash-deal banner checks only the end date. It does not check a start date or a status. | A deal that has not started can show a countdown | `ProductPhotoSliderWrapper.tsx` `isFlashDeal` | Frontend / Backend | No — confirm the backend sends the end date only for running deals |
| M-6 | Size system tabs (Standard / EU / IN / US / UK, and IN / CM) are static. They have no click handler. | Tabs look tappable but do nothing | `components/Server/product/ProductSizesWrapper.tsx:17`, `:43`, `:51`, `:60` | Frontend / Product | No — hide them or build them |
| M-7 | If the notify-types call fails, `NotificationsType` becomes `undefined`, and the "More" sheet reads `.length` on it | The "More" sheet can crash into the error screen | `components/products/MoreOptionsSection.tsx:315` (`services/notifications.ts` returns `undefined` on failure) | Frontend | No — but fix it with a test, small change |
| M-8 | If the price call throws, `GetProductPriceQtyDetails` returns `undefined`. Two parts then read a field on `undefined`. | The whole product page shows the error screen instead of the parts that worked | `components/Server/product/ProductDescriptorsWrapper.tsx:7`, `components/products/FreeShippingOption.tsx:10` | Frontend | No |
| M-9 | Bad JSON in `label_names` throws during render | The page shows the error screen | `components/Server/product/ProductFeaturesWrapper.tsx:10` | Frontend | No |
| M-10 | Like and unlike send `user_id` from the browser in the body | Nothing visible; risk if the backend trusts this field | `ProductLikeButton.tsx:50`, `:87` | Backend | No — confirm (see questions) |
| M-11 | `/api/related-products/[id]` has no cap on `limit` and allows any origin | Slow answers under abuse | `app/api/related-products/[id]/route.ts:70` | Frontend | No |

## 🔒 Must do before launch
- [ ] Hide the virtual try-on button, or connect a real try-on service (M-1).
- [ ] Set `NEXT_PUBLIC_SITE_URL` (and `NEXT_PUBLIC_ALLOW_INDEXING=true` on the real domain only) in production (M-2).
- [ ] Get the backend's answer on the luck window and the like `user_id` (questions below). If the backend trusts the client, this becomes a blocker.

## ❓ Needs confirmation from the backend team
- **Luck price:** the browser sends `is_luck: true` to `/cart/add`, and the countdown runs only in the browser. Does the backend check the luck window and the "already redeemed" rule itself?
- **Like / unlike:** does the comments backend take the user from the token, or from the `user_id` in the body?
- **Flash deal:** is `flash_deal_end_date` a date or a date-time, and in which time zone? Is it sent only while the deal is running?
- **Product stories:** when the stories token has expired, does `product_stories` answer 401, or does it answer as a guest (without "seen" marks)?
- **Free return:** does `allow_return_in_days` > 0 mean the return is free for the shopper?
- **Cache:** is 120 s an acceptable delay for price and stock changes on the product page?

## 🧪 Tests that cover this section
- Unit (Vitest):
  - Routes: `tests/app/products/page.test.tsx`, `tests/app/modal/pages.test.tsx`, `tests/components/ModalRoute/ModalSlot.test.tsx`
  - Page and footer: `tests/components/Product/ProductPageContent.test.tsx`, `ProductFooter.test.tsx`, `ProductFooterClient.test.tsx`, `RelatedProductsInfiniteScroll.test.tsx`
  - Server parts: every wrapper under `tests/components/Server/product/` (photo slider, extended slider, name and brand, details text, general properties, features, descriptors, colours, sizes, size item, size reviews, expected delivery, stories, videos, related products, rating, colour groups, footer, prices, like button)
  - Client parts: `tests/components/products/` (add to bag, flash deal banner, redeem counter, colour item, gallery sliders, video, share section / options / button, more options, try-on modal and wrapper, free shipping, free return, delivery banner and sheet, back button, details text, general properties)
  - Data and SEO: `tests/serverRequests/product.test.ts`, `tests/serverRequests/meta/StructuredData/ProductStructuredData.test.ts`, `tests/utils/luckIndex.test.ts`
  - Mobile routes: `tests/app/api/mobile/product/details/route.test.ts`, `tests/app/api/mobile/product/qty/route.test.ts`, `tests/app/api/related-products/route.test.ts`
  - Bug guards (plain `it`, green): BUG-products-1, BUG-products-2 (try-on), BUG-products-6 (video). There are no `it.fails` markers in this section.
- E2E (Playwright, staging): "a listing leads to a product page" and GUEST-42 (`guest.live.spec.ts`); BUY-01 (adds the QA product from its page); CMT-01, CMT-08 (like / unlike); WISH-02, WISH-03, WISH-04 (checklist from the page); CMP-02 (compare from the page); SST-06, SST-08 (product stories).
- **No test** for:
  - colour and size selection on staging (no e2e taps a colour or a size);
  - the flash-deal countdown and the luck window with a real product;
  - the missing-product redirect on staging;
  - SEO metadata and JSON-LD on the built page;
  - the share sheet and the "notify me" topics on staging.
- `TryOnModal.test.tsx:82` asserts the 3 s fake wait as correct behaviour. It has to change with M-1.
