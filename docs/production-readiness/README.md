# Trydos web — Production readiness

**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20.
**Source:** the code only. The older files in `docs/` were not used, because they are out of date.


Production settings that the owner handles are in [IMPORTANT-PRODUCTION-NOTES.md](IMPORTANT-PRODUCTION-NOTES.md).
One list of every blocker, missing feature and placeholder is in [BLOCKERS-AND-PLACEHOLDERS.md](BLOCKERS-AND-PLACEHOLDERS.md).
One short list of only the open decisions, the third-party accounts and the work still to do is in [OPEN-DECISIONS.md](OPEN-DECISIONS.md).
A one-page status for the PM, scoring only the web app (no backend or server items), is in [PM-STATUS.md](PM-STATUS.md).
## The short answer

**We cannot go to production today.** Most of the shop works. We found **572 working cases** across 20 sections. But some items block launch, and they are in four groups:

1. **There is no production environment yet.** Every backend host is staging.
2. **Security holes in the web app.** Session tokens reach Sentry. A few screens show private data. (On 2026-10-20 the three open debug routes were deleted, the paid AI routes capped, the push topic routes locked to the shopper's own shops, the recommendations user id taken from the session, and guest registration limited. Items the owner accepted are in `IMPORTANT-PRODUCTION-NOTES.md`.)
3. **Shopper-visible placeholders.** These are the wallet, Bank Cards, virtual try-on, QR login, the legal page text, and a fake note on every order.
4. **Legal.** Every terms and policy link opens a page since 2026-10-20, but the page text is still a placeholder, and there is no cookie consent.

None of these is a big rebuild. Most are small fixes, settings, or a product decision to **hide** a feature that is not ready. The list below shows each item and who owns it.

## Status by section

🟢 Ready · 🟡 Ready with conditions (listed items first) · 🔴 Not ready

| # | Section | Status | Working cases | Launch blockers | Main blocker |
|---|---|:-:|:-:|:-:|---|
| 01 | [Home & discovery](01-home-and-discovery.md) | 🟡 | 22 | 1 | Elasticsearch client accepts any TLS certificate (needs the production cluster's certificate) |
| 02 | [Search](02-search.md) | ✅ | 27 | 0 | Closed — image search runs on a live Gemini model since 2026-10-20; Ops values before launch |
| 03 | [Listing & filters](03-listing-and-filters.md) | 🟡 | 24 | 2 | Price sort wrong in countries with their own price |
| 04 | [Product page](04-product-page.md) | 🟡 | 31 | 1 | Virtual try-on is fake (waits 3 s, shows the shopper's own photo) |
| 05 | [Reviews, questions & likes](05-reviews-questions-and-likes.md) | ✅ | 28 | 0 | Closed — accepted items are in `IMPORTANT-PRODUCTION-NOTES.md` |
| 06 | [Cart](06-cart.md) | 🟡 | 32 | 1 | Backend must confirm it limits the luck price per shopper and does not trust `is_luck` from the browser |
| 07 | [Checkout & payment](07-checkout-and-payment.md) | 🟡 | 27 | 3 | Every order sends the note "order note"; no proof of a real card or crypto gateway |
| 08 | [Orders & returns](08-orders-and-returns.md) | 🟡 | 29 | 3 | Fixed refund/fee promises nobody confirmed; terms links go to `#` |
| 09 | [Wallet & banking](09-wallet-and-banking.md) | 🔴 | 7 | 6 | Wallet sheet says "Under Development"; Bank Cards is a blank page; wallet sign-in answers 502 |
| 10 | [Sign-in & session](10-sign-in-and-session.md) | 🟡 | 28 | 3 | QR login is a mock that shoppers can see; `id_token` is returned in the sign-in reply |
| 11 | [Profile & settings](11-profile-and-settings.md) | 🟡 | 26 | 2 | "Bank Cards" opens an empty page; the QR scan icon is a mock |
| 12 | [Chat & calls](12-chat-and-calls.md) | 🟡 | 52 | 7 | Mobile-app call page shows and logs the chat token; no production chat host or Agora project |
| 13 | [Stories](13-stories.md) | ✅ | 29 | 0 | Closed — no code work left; Ops values and one real-iPhone video check before launch |
| 14 | [Notifications](14-notifications.md) | ✅ | 18 | 0 | Closed — the push topic routes check the session and the shop since 2026-10-20; Firebase values before launch |
| 15 | [Seller dashboard — catalog](15-seller-dashboard-catalog.md) | ✅ | 44 | 0 | Closed — accepted items are in `IMPORTANT-PRODUCTION-NOTES.md` |
| 16 | [Seller dashboard — operations](16-seller-dashboard-operations.md) | ✅ | 36 | 0 | Closed — run e2e SD-12 on staging before launch |
| 17 | [Wishlist & compare](17-wishlist-and-compare.md) | ✅ | 29 | 0 | Closed — the accepted item is in `IMPORTANT-PRODUCTION-NOTES.md` |
| 18 | [Static pages & legal](18-static-pages-and-legal.md) | 🔴 | 17 | 4 | Placeholder legal text; no cookie consent; no support channel decision (the links are wired since 2026-10-20) |
| 19 | [Languages, regions, SEO & monitoring](19-languages-regions-seo-and-monitoring.md) | 🟡 | 41 | 2 | Indexing not set; consent banner decision |
| 20 | [Security & infrastructure](20-security-and-infrastructure.md) | 🔴 | 25 | 5 | No production backend; Sentry keeps session cookies; index TLS check off; no rollback plan or alerts |
| | **Total** | | **572** | **40** | Some blockers appear in more than one file |

"Launch blockers" counts the rows marked "Blocks launch = Yes" in each file.

## Go-live list (one copy of each item)

### A. Ops and environment
- [ ] Production backends exist and their URLs are set: core, gateway, chat, stories, comments, wallet, media, Elasticsearch.
- [ ] Turn the Elasticsearch TLS certificate check back on (`services/elastic/elasticsearch.config.ts:16`).
- [ ] Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ALLOW_INDEXING=true`. Without the site URL, SEO links point to `trydos.ramaaz.dev`.
- [ ] Turn off the staging gate (`STAGING_GATE`). Keep `OTP_TEST_PHONES`, `QA_VIEW_SECRET`, `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` and `REQ_LOG` empty.
- [ ] Set Redis. Without Redis, the OTP limit lets every send through and "Add with AI" always says "busy".
- [ ] Production chat host (`migration.staging.ts`) and our own Agora project: set `NEXT_PUBLIC_AGORA_APP_ID`. (The App ID typo in `WebViewVoiceCall.tsx` is fixed and the id lives in `utils/agoraConfig.ts` since 2026-10-20.)
- [ ] Choose the Firebase project for production and set the Firebase Admin values.
- [ ] Add Vercel Firewall rate limits for `/api/image-search`, `/api/speech-recognition`, OTP, and search. The code now caps the paid calls itself (10 per minute per address; 300 search analyses per minute shared); the Firewall rule is a second layer.
- [ ] Sentry: set `environment` and alert rules. Write a rollback plan (Vercel instant rollback).
- [x] Remove `debug_mode: true` from every GA event (`utils/gtag.ts:57,84`). (done 2026-10-20)

### B. Security fixes in code (Frontend)
- [x] `/api/clearRedis`, `/api/revalidate` and `/api/info` deleted (2026-10-20).
- [ ] Stop sending session tokens to Sentry (`sendDefaultPii: true`).
- [ ] Mobile-app call page (`components/global/WebviewCall.tsx`): token in the URL, an "alert"/copy debug button, and the token sent to Sentry.
- [ ] Do not return `id_token` in the sign-in reply (`app/api/auth/login/route.ts`).
- [x] `/api/subscribe` and `/api/unsubscribe` need auth. Shop order topic names are easy to guess. (done 2026-10-20)
- [x] `GetNextRecommendations` (public Server Action) must not trust the user id from the browser. (done 2026-10-20)
- [ ] Rotate the Google Maps key, restrict it by domain, and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel. (The key is out of the code since 2026-10-20.)
- [ ] Remove or gate the tester tools `app/api/auth/simulate` and `app/simulateUser`, and the demo pages (`/demo`, `/loginDemo`, `/navigation`).

### C. Shopper-visible problems (Frontend, unless noted)
- [x] JSON "success" toast removed from search (2026-10-20).
- [x] Image search: move off `gemini-1.5-flash` (retired). (done 2026-10-20)
- [ ] Hide or finish: wallet sheet, Bank Cards page, virtual try-on, QR login. **Product decides.**
- [x] Developer "Notification Test" tab and the push debug block removed (2026-10-20).
- [ ] Stop the fake note on real orders: `order_note=order note` (`services/order.ts`).
- [x] Map pin checked on a real phone (2026-10-20).
- [x] The luck price must end when the timer ends. (done 2026-10-20)
- [x] A refused chat message must not stay "sending" for ever. (done 2026-10-20)
- [x] Region popup must not stay on "Loading…" when `/countries` fails. (done 2026-10-20)
- [ ] Chat on iPhone Safari: today chat needs push permission, which Safari tabs do not have. **Product decides.**

### D. Legal and content (Product)
- [ ] Real About, Contact, Privacy and Terms text. The privacy text must name Sentry, PostHog and Google Analytics.
- [x] Make every "terms" / "policies" text a real link: sign-up, checkout, cancel and return screens. Fix "Legal Information" and "About Us" in settings (now `#`). (done 2026-10-20; Product still replaces the page text)
- [ ] Cookie consent banner, if our markets need one.
- [ ] Confirm or remove the fixed promises on order screens: refund in 12 hours, no fees, 3-hour cancel window.

### E. Backend team must confirm
- [ ] The wallet sign-in 502. Also check whether our app causes it: we send the e-mail as the text "undefined" (`app/api/auth/login/route.ts:285`).
- [ ] The backend limits the luck price per shopper and does not trust `is_luck` from the browser.
- [ ] Like / unlike and seller stories do not trust `user_id` / `seller_id` from the browser.
- [ ] Card and crypto: is there a real payment gateway behind them?
- [ ] Do not send `mobile_phone` in the public stories feed.

## Test status

| Suite | Last result | Notes |
|---|---|---|
| Unit (Vitest), local run 2026-10-20 evening, after the 16 fixes | 7,675 of 7,676 passed (2 expected fails) | The 1 failure, `compare.test.tsx` "loads both products…", passes alone (17/17): the known random single failure under load, not a bug |
| Unit (Vitest), local run 2026-10-20 | 7,643 of 7,645 passed | The 2 failures pass when run alone (66/66), so they are flaky, not bugs: `AsyncSelectCustom.test.tsx`, `BecomeSellerModal.test.tsx` |
| Unit, CI on `main` 2026-10-16 | Passed | |
| E2E (Playwright vs staging), CI on `main` 2026-10-16 | 81 passed, 2 failed | **AUTH-01** is red on purpose (wallet backend 502). **SCRIPT-07** (profile save refused by one backend) failed; the cause is not checked yet |

Some unit tests expect today's wrong behaviour, so they must change with the fix. Each section file names them. Examples: the "order note" text and the fake virtual try-on.

## How this was made, and what it cannot see

- One code-reading pass per section. Every working case names the file that proves it and the test that covers it.
- About 12 of the most serious claims were checked again by hand against the code. All 12 were confirmed.
- **This report cannot see the backends, the Vercel dashboard or real phones.** Backend questions are listed in every file under "Needs confirmation from the backend team". Items marked "check on a real phone" (iPhone video, Safari chat) need a device test.
- The mobile apps are not covered here. Only the web app is.
