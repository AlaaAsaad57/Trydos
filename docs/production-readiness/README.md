# Trydos web — Production readiness

**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20.
**Source:** the code only. The older files in `docs/` were not used, because they are out of date.

## The short answer

**We cannot go to production today.** Most of the shop works. We found **565 working cases** across 20 sections. But some items block launch, and they are in four groups:

1. **There is no production environment yet.** Every backend host is staging. The Elasticsearch index names fall back to the staging names (`_develop`) until the `ELASTIC_*_INDEX` values are set.
2. **Security holes in the web app.** Some API routes are open to anyone. Session tokens reach logs and Sentry. A few screens show private data.
3. **Shopper-visible placeholders.** These are the wallet, Bank Cards, virtual try-on, QR login, a developer "Notification Test" tab, the legal pages, and fake order/address data.
4. **Legal.** The shopper must accept terms they cannot open. There is no real privacy text and no cookie consent.

None of these is a big rebuild. Most are small fixes, settings, or a product decision to **hide** a feature that is not ready. The list below shows each item and who owns it.

## Status by section

🟢 Ready · 🟡 Ready with conditions (listed items first) · 🔴 Not ready

| # | Section | Status | Working cases | Launch blockers | Main blocker |
|---|---|:-:|:-:|:-:|---|
| 01 | [Home & discovery](01-home-and-discovery.md) | 🟡 | 22 | 4 | Production index names not set; recommendations Server Action trusts the user id from the browser |
| 02 | [Search](02-search.md) | 🟡 | 27 | 6 | Every 2+ word search shows a green toast with raw AI JSON; image search uses a retired Gemini model |
| 03 | [Listing & filters](03-listing-and-filters.md) | 🟡 | 24 | 4 | Price filter hidden while a flag is off; price sort wrong in countries with their own price |
| 04 | [Product page](04-product-page.md) | 🟡 | 31 | 2 | Virtual try-on is fake (waits 3 s, shows the shopper's own photo) |
| 05 | [Reviews, questions & likes](05-reviews-questions-and-likes.md) | 🟡 | 28 | 2 | Production index names not set; the review write path (CMT-09) has no stable green run |
| 06 | [Cart](06-cart.md) | 🟡 | 32 | 2 | Luck price still sent after the 50 s timer ends |
| 07 | [Checkout & payment](07-checkout-and-payment.md) | 🟡 | 27 | 6 | Every order sends the note "order note"; every address gets ZIP "123123"; terms cannot be opened |
| 08 | [Orders & returns](08-orders-and-returns.md) | 🟡 | 29 | 4 | Delivery note lost on address change; fixed refund/fee promises nobody confirmed |
| 09 | [Wallet & banking](09-wallet-and-banking.md) | 🔴 | 7 | 6 | Wallet sheet says "Under Development"; Bank Cards is a blank page; wallet sign-in answers 502 |
| 10 | [Sign-in & session](10-sign-in-and-session.md) | 🟡 | 28 | 5 | Open `/api/clearRedis` removes all OTP limits; QR login is a mock that shoppers can see |
| 11 | [Profile & settings](11-profile-and-settings.md) | 🟡 | 26 | 4 | Developer "Notification Test" tab visible to every shopper; legal links go to `#` |
| 12 | [Chat & calls](12-chat-and-calls.md) | 🟡 | 52 | 9 | Mobile-app call page shows and logs the chat token; no production chat host or Agora project |
| 13 | [Stories](13-stories.md) | 🟡 | 26 | 0 | No code blocker; Ops values and one real-iPhone video check before launch |
| 14 | [Notifications](14-notifications.md) | 🟡 | 18 | 5 | Anyone can subscribe to another shop's order pushes; chat needs push permission, so it cannot open in iPhone Safari |
| 15 | [Seller dashboard — catalog](15-seller-dashboard-catalog.md) | 🟡 | 39 | 1 | Backend 500 on product create with similar words (every "Add with AI" create) |
| 16 | [Seller dashboard — operations](16-seller-dashboard-operations.md) | 🟡 | 36 | 1 | Index names fall back to staging until `ELASTIC_*_INDEX` is set (Ops, waiting on the backend) |
| 17 | [Wishlist & compare](17-wishlist-and-compare.md) | 🟡 | 30 | 1 | Guest wishlist may be lost at sign-in (backend to confirm) |
| 18 | [Static pages & legal](18-static-pages-and-legal.md) | 🔴 | 17 | 8 | Placeholder legal text; no link to the privacy policy; no cookie consent |
| 19 | [Languages, regions, SEO & monitoring](19-languages-regions-seo-and-monitoring.md) | 🟡 | 41 | 5 | Site URL and indexing not set; region popup can block the whole site; every GA event is marked debug |
| 20 | [Security & infrastructure](20-security-and-infrastructure.md) | 🔴 | 25 | 15 | Tokens in logs; open debug routes; no production backend; paid AI APIs with no limit |
| | **Total** | | **565** | **90** | Some blockers appear in more than one file (for example the index names) |

"Launch blockers" counts the rows marked "Blocks launch = Yes" in each file.

## Go-live list (one copy of each item)

### A. Ops and environment
- [ ] Production backends exist and their URLs are set: core, gateway, chat, stories, comments, wallet, media, Elasticsearch.
- [ ] Set the ten `ELASTIC_*_INDEX` values to the production index names (listed in `.env.example`); without them `services/elastic/INDEXES.ts` falls back to the `_develop` names. Turn the TLS certificate check back on (`services/elastic/elasticsearch.config.ts:16`).
- [ ] Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ALLOW_INDEXING=true`. Without the site URL, SEO links point to `trydos.ramaaz.dev`.
- [ ] Turn off the staging gate (`STAGING_GATE`). Keep `OTP_TEST_PHONES`, `QA_VIEW_SECRET`, `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` and `REQ_LOG` empty.
- [ ] Set Redis. Without Redis, the OTP limit lets every send through and "Add with AI" always says "busy".
- [ ] Production chat host (`migration.staging.ts`) and our own Agora project. Fix the Agora App ID typo in `WebViewVoiceCall.tsx:26`.
- [ ] Choose the Firebase project for production and set the Firebase Admin values.
- [ ] Add Vercel Firewall rate limits for `/api/image-search`, `/api/speech-recognition`, OTP, and search (each text search calls Gemini).
- [ ] Sentry: set `environment` and alert rules. Write a rollback plan (Vercel instant rollback).
- [ ] Remove `debug_mode: true` from every GA event (`utils/gtag.ts:57,84`).

### B. Security fixes in code (Frontend)
- [ ] Protect or remove `/api/clearRedis`, `/api/revalidate`, `/api/revalidateStories` and `/api/info`. Today they have no auth.
- [ ] Stop sending session tokens to logs: `/api/internal/mobile-error-log`, `LogServerError`, and the Sentry setting `sendDefaultPii: true`.
- [ ] Mobile-app call page (`components/global/WebviewCall.tsx`): token in the URL, an "alert"/copy debug button, and the token sent to Sentry.
- [ ] Do not return `id_token` in the sign-in reply (`app/api/auth/login/route.ts`).
- [ ] `/api/subscribe` and `/api/unsubscribe` need auth. Shop order topic names are easy to guess.
- [ ] `GetNextRecommendations` (public Server Action) must not trust the user id from the browser.
- [ ] Do not show a story author's phone number as their name.
- [ ] Move the Google Maps key out of `MapElement.tsx` and restrict it.
- [ ] Remove or gate the tester tools `app/api/auth/simulate` and `app/simulateUser`, and the demo pages (`/demo`, `/loginDemo`, `/navigation`).

### C. Shopper-visible problems (Frontend, unless noted)
- [ ] Remove the JSON "success" toast from search (`components/Home/Search/SearchIcon.tsx:183`).
- [ ] Image search: move off `gemini-1.5-flash` (retired).
- [ ] Hide or finish: wallet sheet, Bank Cards page, virtual try-on, QR login, the "Notification Test" tab. **Product decides.**
- [ ] Stop fake data on real orders: `order_note=order note` and ZIP `123123` (`services/order.ts`).
- [ ] Check the map pin on a real phone. The `geometry` library is not loaded.
- [ ] The luck price must end when the timer ends.
- [ ] A refused chat message must not stay "sending" for ever.
- [ ] Region popup must not stay on "Loading…" when `/countries` fails.
- [ ] Chat on iPhone Safari: today chat needs push permission, which Safari tabs do not have. **Product decides.**

### D. Legal and content (Product)
- [ ] Real About, Contact, Privacy and Terms text. The privacy text must name Sentry, PostHog and Google Analytics.
- [ ] Make every "terms" / "policies" text a real link: sign-up, checkout, cancel and return screens. Fix "Legal Information" and "About Us" in settings (now `#`).
- [ ] Cookie consent banner, if our markets need one.
- [ ] Confirm or remove the fixed promises on order screens: refund in 12 hours, no fees, 3-hour cancel window.

### E. Backend team must confirm
- [ ] The wallet sign-in 502. Also check whether our app causes it: we send the e-mail as the text "undefined" (`app/api/auth/login/route.ts:285`).
- [ ] `similar_words` 500 on product create.
- [ ] The backend limits the luck price per shopper and does not trust `is_luck` from the browser.
- [ ] Like / unlike and seller stories do not trust `user_id` / `seller_id` from the browser.
- [ ] Card and crypto: is there a real payment gateway behind them?
- [ ] Does a guest's wishlist survive sign-in?
- [ ] Do not send `mobile_phone` in the public stories feed.

## Test status

| Suite | Last result | Notes |
|---|---|---|
| Unit (Vitest), local run 2026-10-20 | 7,643 of 7,645 passed | The 2 failures pass when run alone (66/66), so they are flaky, not bugs: `AsyncSelectCustom.test.tsx`, `BecomeSellerModal.test.tsx` |
| Unit, CI on `main` 2026-10-16 | Passed | |
| E2E (Playwright vs staging), CI on `main` 2026-10-16 | 81 passed, 2 failed | **AUTH-01** is red on purpose (wallet backend 502). **SCRIPT-07** (profile save refused by one backend) failed; the cause is not checked yet |

Some unit tests expect today's wrong behaviour, so they must change with the fix. Each section file names them. Examples: the search JSON toast, the `clearRedis` route, the fake ZIP code, and WebM-only story recording.

## How this was made, and what it cannot see

- One code-reading pass per section. Every working case names the file that proves it and the test that covers it.
- About 12 of the most serious claims were checked again by hand against the code. All 12 were confirmed.
- **This report cannot see the backends, the Vercel dashboard or real phones.** Backend questions are listed in every file under "Needs confirmation from the backend team". Items marked "check on a real phone" (map pin, iPhone video, Safari chat) need a device test.
- The mobile apps are not covered here. Only the web app is.
