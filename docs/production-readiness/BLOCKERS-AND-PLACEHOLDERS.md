# Launch blockers, missing features and placeholders

**Source:** the 20 section files in this folder and `IMPORTANT-PRODUCTION-NOTES.md`, as they are on disk on 2026-10-20 (branch `development`).
**Updated 2026-10-20:** the owner accepted the error-log token copies (old A1-1, A1-2). The three open debug routes were deleted, the paid AI routes and the search analysis were capped, and the Google Maps key left the code (old A1-3, A1-4, A1-5, A1-15, A1-16, A1-14). Later the same day the search debug toast, the developer "Notification Test" tab and the push debug block were removed, and the map pin was checked on a real phone (old A2-1, A2-9, A2-10, A2-13). The owner accepted the fake ZIP, the lost delivery note, the iPhone Safari chat block, the search log retention and the missing popular-words blocklist (old A2-12, A2-15, A2-20, A2-28, A2-3). In the evening Frontend closed 15 more items in code: auth on the push topic routes, the recommendations user id, the contact data sent to Sentry, a limit on guest registration, image search on a live Gemini model, the luck price after the timer, the refused chat send, a retry on the region popup, the chat translations, the GA debug flag, and every legal link (old A1-6, A1-8, A1-12, A1-17, A2-2, A2-14, A2-18, A2-21, A2-26, A2-27, A3-4 to A3-8), and the Agora App ID moved to one env value with the wrong copy fixed (old A2-24, A2-25). Then the sign-in reply stopped carrying `id_token`, and Sentry stopped receiving cookies and IP addresses (old A1-9, A1-10). See "Closed on 2026-10-20" at the end of Part A. Accepted items are listed in `IMPORTANT-PRODUCTION-NOTES.md`.
**What this file is:** one list of everything that is still open. Part A holds the items that block launch. Part B holds the features that are missing, fake, or placeholder, but do not block launch. Part C holds the environment values that must be set. Part D holds the backend answers that decide a blocker.

An item that appears in more than one section file is listed once here, with every section id in brackets.

---

## Part A — Launch blockers

Every row in a section file marked "Blocks launch = Yes". The section files count 63 rows; after removing duplicates there are **28 items** (3 security, 10 shopper-visible, 4 legal, 8 ops, 3 backend). Ids keep their original numbers, so a closed id is simply missing.

### A1. Security (Frontend)

| # | Problem | Where | Sections |
|---|---|---|---|
| A1-7 | The Elasticsearch client accepts any TLS certificate (`rejectUnauthorized: false`). | `services/elastic/elasticsearch.config.ts:15-17` | 01 M-1, 03 M-1, 20 M-7 |
| A1-11 | The mobile-app call page leaks the chat token: it sits in the URL, a "DEBUG" button copies it and shows it in an `alert`, the error panel prints it, and `LogError` sends it to Sentry. | `components/global/WebviewCall.tsx:150, 190, 249, 312-336` | 12 M-2 |
| A1-13 | `/api/auth/wallet-token` hands the raw wallet token to browser JavaScript. `WalletLinkCard` calls it on every sheet open, and nothing uses it while the widget is off. | `app/api/auth/wallet-token/route.ts`, `components/setting/WalletLinkCard.tsx:69-74` | 09 M-4 |

### A2. Fake data, fake features and debug screens that shoppers can see (Frontend, Product decides for some)

| # | Problem | Where | Sections |
|---|---|---|---|
| A2-4 | Virtual try-on is fake. "Try On" waits 3 s and shows the shopper's own photo as the result. The button shows on almost every product. | `components/products/TryOnModal.tsx:146-150`, `ProductPhotoSliderWrapper.tsx:304` | 04 M-1 |
| A2-5 | QR login is a `localStorage` mock with no backend. "Scan QR Code" is on the first login screen and the profile card. "Approve" closes as if it worked. | `services/qrLogin/index.ts:3`, `screens/GetStartedScreen.tsx:27`, `FullEnhancedLoginWidget.tsx:511`, `components/setting/profile/index.tsx:73-86` | 10 M-2, 11 M-7 |
| A2-6 | The wallet sheet is a placeholder that says "Under Development". The RDB widget is commented out. | `components/setting/WalletLinkCard.tsx:100-121` | 09 M-1 |
| A2-7 | The `rdb` package is gone from `package.json`. `services/RDB/index.ts` and `serverActions.ts` are fully commented out. The wallet widget has nothing to run on. | `services/RDB/index.ts`, `services/RDB/serverActions.ts` | 09 M-2 |
| A2-8 | "Bank Cards" in the profile menu opens a page with only a back bar. | `settings/profile/page.tsx:38-43`, `settings/profile/Bank-Cards/page.tsx:18-30` | 09 M-3, 11 M-4 |
| A2-11 | Every cash, card and crypto order sends the fixed text `order_note=order note`. There is no note field. | `services/order.ts:78` (test `orderClass.test.ts:116` asserts it) | 07 M-1 |
| A2-16 | Fixed promises nobody confirmed: "refund within 12 hours", "no fees", "cancel in 3 hours", "collection within 1 day", and a 3-hour countdown that restarts on every page load. | `OrderCancelConfirmationWindow.tsx:64, 67`, `CancelOrderItemConfirmationWindow.tsx:66, 69`, `OrderItemReturnConfirmationWindow.tsx:199`, `OrderItemOptions.tsx:285`, `OrderRetailsReturnInfo.tsx:59, 251, 253` | 08 M-4 |
| A2-17 | Refund text says "Back to your wallet", but the wallet is not usable. | `OrderDetailsWrapper.tsx:1374`, `OrderRetailsReturnInfo.tsx:71` | 08 M-5, 09 M-8 |
| A2-19 | The invite text points to a placeholder Play Store id (`your.app.id`), and the text is hardcoded English (BUG-chat-8, `it.fails` in `SearchResult.test.tsx:146`). | `components/Chat/components/SearchResult.tsx:62, 81, 93, 103` | 12 M-8 |
| A2-23 | Price sort uses the root `offered_price`, but the card shows the country price. In a country with its own prices the order is wrong. Needs a backend field. | `services/elastic/helpers.ts:177-186` | 03 M-3 |

### A3. Legal and content (Product writes, Frontend links)

| # | Problem | Where | Sections |
|---|---|---|---|
| A3-1 | The legal text is placeholder copy: one intro and two short sections per page, about 60 words each, with promises nobody checked. Needed in en/ar/tr/ku. | `privacy-policy/page.tsx:6-21`, `terms-of-service/page.tsx:6-21`, `about/page.tsx:6-21`, `contact/page.tsx:6-21` | 18 M-1 |
| A3-2 | The privacy text does not name what the code sends out: Sentry (with PII), PostHog (with the phone number), Google Analytics, Firebase push. Nothing about cookies, retention, or account deletion. | `privacy-policy/page.tsx:12-21` | 18 M-2 |
| A3-3 | No cookie consent banner. GA, PostHog and Speed Insights start on every page. Blocks launch if Turkey is a launch market (KVKK). **Product decides per country.** | `app/(client)/[lang]/layout.tsx:195-213`, `components/Home/Init.tsx:136` | 18 M-3, 19 M-8 |
| A3-9 | The support channels are not decided. The contact page has `support@trydos.com` in plain text and links to nothing in the app. | `contact/page.tsx:11-20` | 18 M-10 |

### A4. Ops and environment

| # | Problem | Where | Sections |
|---|---|---|---|
| A4-1 | There is no production backend environment. Every backend host is staging: core, gateway, chat, stories, comments, wallet, media, Elasticsearch, Redis. | Vercel env | 20 M-6 |
| A4-2 | The production chat backend URL is the same staging `.dev` host as preview and development. | `.env.production` `NEXT_PUBLIC_CHAT_BACKEND_URL` | 12 M-1 |
| A4-4 | Indexing is off unless `NEXT_PUBLIC_ALLOW_INDEXING=true`. `robots.txt` blocks all, every page says `noindex`. Set on production only. | `utils/server/helpers.ts:458`, `next.config.ts:9`, `app/robots.ts:35` | 19 M-2 |
| A4-5 | No rollback plan. No file mentions Vercel Instant Rollback or who may run it. | — | 20 M-18 |
| A4-6 | Monitoring is not ready: no `tracesSampleRate`, no alert rules, and `SENTRY_AUTH_TOKEN` is not in `.env.example`. (`environment` is set since 2026-10-20.) | `sentry.server.config.ts`, `next.config.ts:287-304` | 20 M-19 |
| A4-7 | Vercel Firewall rules are needed for the paid and open routes (see Part C3). None live in code, so nobody can confirm they exist. The code now caps the paid calls itself; the Firewall rule is a second layer. | Vercel dashboard | 20 M-12 |
| A4-9 | The old Google Maps key is in git history. Ops must rotate it, restrict it by HTTP referrer, and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel. The code reads the env value only since 2026-10-20. | `utils/mapsConfig.ts` | 07 M-5, 20 M-15 |
| A4-8 | Elasticsearch index names: all ten `ELASTIC_*_INDEX` values are empty in production, so the app would read and write staging data. The production indexes must exist first (the plain-name copies are months old). **Blocked on the backend team.** | `services/elastic/INDEXES.ts` | IMPORTANT-PRODUCTION-NOTES |

### A5. Backend must confirm or fix

| # | Problem | Where | Sections |
|---|---|---|---|
| A5-1 | The wallet backend answers `502` on sign-in. e2e AUTH-01 stays red on purpose. Check first whether our app causes it: the body sends the e-mail as the text `"undefined"` and `lastName` takes only the second word. | wallet `POST /auth/phone/login-with-id-token`; `app/api/auth/login/route.ts:283-285` | 09 M-5, 10 M-5, 10 M-6 |
| A5-2 | The luck offer is limited only in the browser (a `localStorage` timer and a cookie of 5 products). `/cart/add` takes `is_luck` from the browser. Blocks until the backend confirms it limits luck per shopper and per time. | `utils/luck/index.ts:3-11, 132-140`, `services/cart.ts:24-31` | 06 M-2 |
| A5-3 | Card and crypto have no proof of a real payment gateway. No test pays by card or crypto. Blocks if the backend offers them at launch. | `services/order.ts:96-104`, `components/Cart/ModalIframe.tsx:60-130` | 07 M-8 |

### Closed on 2026-10-20

| Old # | What changed | Proof |
|---|---|---|
| A1-1, A1-2, A2-12, A2-15 | Accepted by the owner: the error-log token copies, the fake ZIP and "Not Entered" on addresses, and the lost delivery note. They are listed in `IMPORTANT-PRODUCTION-NOTES.md`. | — |
| A1-3, A1-4, A1-5 | `/api/clearRedis`, `/api/revalidate` and `/api/info` deleted, with their tests. No app code called them. | the route folders are gone |
| A1-14 | The Google Maps key is read from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only. The literal in `MapElement.tsx` and the fallback in `mapsConfig.ts` are gone. Rotation is now A4-9. | `tests/utils/mapsConfig.test.ts`, `tests/components/Cart/MapElement.test.tsx` (env case), seen red first |
| A1-15 | `/api/image-search` and `/api/speech-recognition` refuse a caller with no session (401), an upload over 4 MB (413), more than 10 calls per address per minute (429), and answer busy when Redis is down (503). The browser now sends the session cookie. | `tests/utils/server/paidRouteGuard.test.ts`, both route tests, `SearchImage.test.tsx`, `SearchVoice.test.tsx`, seen red first |
| A1-16 | The search analysis is stored for 24 hours per search text (hashed key) and capped at 300 paid calls per minute, shared. Over the cap, or with Redis down, the search runs on the raw text. Env: `SEARCH_ANALYZE_CACHE_SECONDS`, `SEARCH_ANALYZE_MAX_PER_MINUTE`. | `tests/services/elastic/analyzeSearchText.test.ts`, seen red first |
| A2-1 | The search no longer shows the raw AI result as a success toast. | `SearchIcon.test.tsx` "…shows the products, but never the AI analysis", seen red first |
| A2-9 | The "Notification Test" tab, `NotificationsTest` and the 8 `TestNotification*` service functions are removed. The app no longer calls `/firebase_device_tokens/send_*`; the backend should still close them (Part D). | `SettingsModal.test.tsx` "never shows the developer Notification Test tab…", seen red first |
| A2-10 | The push debug block is removed from the Notifications panel, and the switch says "Enable Push Notifications". | `NotificationsPanel.test.tsx` "shows no push debug data…", `SettingsModal.test.tsx` "names the push switch…", seen red first |
| A2-13 | The owner tested the map pin on a real phone. | manual check on a real phone |
| A2-20 | Accepted by the owner: chat on iPhone Safari works in some versions, so the push-permission block is not a launch item. | — |
| A2-28 | Accepted by the owner: the search log keeps IP, user agent and user id with no retention rule. | — |
| A2-3 | Accepted by the owner: popular words have no blocklist, and QA searches are logged too. | — |
| A2-22 | Moved to `IMPORTANT-PRODUCTION-NOTES.md` as a production setting: `LISTING_PRICE_AGG_ENABLED=true`. The owner sets it; it is not open work. | — |
| A4-3 | The site origin no longer falls back to the staging domain. It is `NEXT_PUBLIC_SITE_URL`, else the production domain Vercel gives the project (`VERCEL_PROJECT_PRODUCTION_URL`), else localhost. An empty setting no longer breaks `metadataBase`. | `tests/serverRequests/meta/StructuredData/Constants.test.ts`, seen red first |
| A1-9 | `/api/auth/login` no longer returns `data.id_token`. The credential is used on the server to sign in to chat, stories, comments and the wallet, and no page script needed it. | `tests/app/api/auth/login/route.test.ts` "keeps the one-time sign-in credential (id_token) out of the answer", seen red first |
| A1-10 | `sendDefaultPii: false` on server, edge and client, so no cookie and no IP address reaches Sentry. Each config also sets `environment` from `SENTRY_ENVIRONMENT` (browser: `NEXT_PUBLIC_SENTRY_ENVIRONMENT`), else the Vercel deployment type. | the three config files (code read; protected runtime paths, changed on the owner's request) |
| A1-6 | `/api/subscribe` needs a session and accepts only the shop order topics (`shop_{id}_order`, `shop_{id}_order_detail`). It asks the core backend for the shopper's shops and refuses a shop the shopper is not in, or has no order permission for. `/api/unsubscribe` needs a session and the same topic pattern. | `tests/app/api/subscribe/route.test.ts`, `tests/app/api/unsubscribe/route.test.ts` (no session 401, other topic 403, not a member 403) |
| A1-8 | `GetNextRecommendations` moved to `serverRequests/recommendations.ts`. It reads the shopper id from the `User-Data` cookie and caps `limit` at 20. The browser sends no user id. | `tests/components/Server/RecomendedProducts.test.tsx`, `tests/cache/noRuntimeReadsInCachedTree.test.ts` |
| A1-12 | A failed contact save logs only the error and the scenario. | `components/Chat/components/ChatContactsUpload.tsx` (code read; no test) |
| A1-17 | `auth/register-device` allows 30 calls per address per 10 minutes (Redis, hashed address) and answers 429 over that. Without Redis the call goes through: a guest must always be registerable. The Firewall rule is now a second layer. | `tests/app/api/auth/register-device/route.test.ts` (429 case, fail-open case) |
| A2-2 | Image search calls Gemini over HTTP with the model from `GEMINI_IMAGE_SEARCH_MODEL` (default `gemini-2.5-flash-lite`). The old SDK dependency is removed. | `tests/app/api/image-search/route.test.ts` (23 cases) |
| A2-14 | Both add-to-bag calls read the luck state when the shopper taps (`isLuckActive`), so after the timer ends the normal price is sent. | `tests/components/Cart/AddToCart/Button.test.tsx` (existing luck case; no new test) |
| A2-18 | A send answered 200 with `isSuccessful: false`, or with no message id, is a refusal: the pending copy is removed and "Failed to send message" shows. The `test.fail` marker on SCRIPT-33 is removed. | `tests/store/chatSendMessage.test.ts`; e2e SCRIPT-33 still needs a staging run |
| A2-21 | When `/countries` fails the popup shows "The country list could not be loaded" and a "Try again" button that reloads the list. | `tests/utils/PopupCountry.test.tsx`, `tests/components/Home/Init.test.tsx` (existing cases; no new test) |
| A2-24, A2-25 | The Agora App ID is read in one place, `utils/agoraConfig.ts`, from `NEXT_PUBLIC_AGORA_APP_ID`, with the staging project as the fallback. The four call screens import it, so the mobile-app voice call no longer uses a different id. Ops sets the production project's id. | `utils/agoraConfig.ts`, the four call screens (code read; `ChatVoiceCall.test.tsx`, `ChatVideoCall.test.tsx` green) |
| A2-26 | The chat text is translated where it is shown. The call end pages read the `lang` cookie. "Sending file..." and "Recording..." are translated on the receiver like "Typing..." (the stored value stays English for the mobile app). "Delivery Worker" is translated at display and stays a stored marker. "User", the upload errors and the "Sent a …" previews use fixed keys. | `tests/app/special/routes.test.tsx`, `tests/utils/chatMuteNotifications.test.ts`, `tests/components/Chat/chatUploadSizeCap.test.ts` |
| A2-27 | `debug_mode` removed from every GA event. | `utils/gtag.ts` (code read) |
| A3-4, A3-8 | "Legal Information" opens `/[lang]/privacy-policy` and "About Us" opens `/[lang]/about`. Product still replaces the page text (L-1). | `app/(client)/[lang]/settings/page.tsx` |
| A3-5 | "Terms Of Services" on both sign-up Terms screens opens `/[locale]/terms-of-service` in a new tab. | `tests/components/Login/Enhanced` (green) |
| A3-6 | "policies" and "terms" at checkout open the privacy and terms pages in a new tab. A tap on a link no longer ticks the box. | `tests/components/Cart/PlaceOrderButtons.test.tsx` (green) |
| A3-7 | "Cancellation Terms.", "Return Terms.", the change terms on the four order screens and the change-address terms open `/[lang]/terms-of-service`. | the four confirmation window tests and `ChangeAddressWidget.test.tsx` (green) |

---

## Part B — Missing, placeholder or fake, but not a launch blocker

These are rows marked "Blocks launch = No", plus items from the "Works, with limits" lists that are placeholders, dead code or hardcoded values.

### B1. Features that are not built or switched off

| Section | Item | Where |
|---|---|---|
| 04 M-6 | Size system tabs (Standard / EU / IN / US / UK, IN / CM) are static. No click handler. | `components/Server/product/ProductSizesWrapper.tsx:17, 43, 51, 60` |
| 06 M-4 | The totals panel has a "Gift — First Shopping" row that always shows "- 0". | `components/Cart/OrderButton.tsx:452-465` |
| 06 M-5 | The share icon in the bag drawer header has no action. | `components/Cart/index.tsx:318` |
| 07 M-9 | On the success screen, "Order Invoice" and "My Account / My Orders" are plain text, not links. | `components/Cart/OrderSuccess.tsx:129, 202` |
| 08 M-2 | Cancel reasons never reach the backend. The shopper must pick one; the shop never gets it. | `OrderCancelConfirmationWindow.tsx:27-35`, `CancelOrderItemWrapper.tsx` |
| 08 M-6 | The per-product "Cancel Return Request" link never shows. No code calls `setActivePacks`. | `components/Orders/OrderRetailsReturnInfo.tsx:27, 270`, `store/Cart/reducer.ts:179` |
| 08 M-7 | Exchange is not built. Every return sends `is_for_exchange=0`. | `services/order.ts:746, 850` |
| 08 M-8 | "Learn More Tips." looks like a link but has no action. | `CancelOrderWrapper.tsx:79`, `CancelOrderItemWrapper.tsx:101`, `ReturnOrderItemWrapper.tsx:197` |
| 08 M-9 | No downloadable invoice or receipt. | — |
| 09 M-6 | Wallet functions with no caller: `GetBanks`, `UploadMedia`, `CreateBankDeposit`, `CalculateFees`, `GetBankDepostits`. | `services/wallet/index.ts:229-376` |
| 09 M-7 | No payment from the wallet balance. `pay_by_wallet` is gone from checkout; the old wallet list call is commented out. | `services/order.ts:74-75, 130-135` |
| 09 L-9, 11 L-5 | Wallet and comments copies of the profile are never updated. The wallet `PATCH /users/me` is commented out. | `services/auth.ts:703-757, 917-965` |
| 09 L-1..L-3 | The transactions page is not linked from the UI, reads the wrong wallet, and shows an unclear currency. | `components/settings/WalletTransactions.tsx` |
| 11 M-3, 18 M-7 | "Share App" links to `#`. | `settings/page.tsx:92` |
| 11 M-5 | The "Sales" card shows "0 Action" for every seller. The number is hardcoded. | `components/settings/GoToSellerDashBoard.tsx:188` |
| 11 L-3 | No "set as default" in the settings address list. The call is commented out. | `PersonalInfoAddress.tsx:172` |
| 11 L-17, 17 L-5, 18 M-8 | "Contact Us" and "Compare" are commented out of the settings list. The `/contact` page cannot be reached from the app. | `settings/page.tsx:74-78, 84-88` |
| 12 M-10 | The 3-pin chat limit never applies. Nothing fills `state.pinnedChats` (CHAT-APP-2, `test.fail` in SCRIPT-37). | `store/chat/reducer.ts:1202`, `ChatOptions.tsx:58` |
| 12 M-13 | The "messages by tag" view is switched off with `{false && …}`. | `components/Chat/components/ChatInfo.tsx:323` |
| 13 M-2 | Story view-time analytics are dead: `onStoryViewTime` is never passed, and six GA events are commented out. | `StoryViewer.tsx:51, 129`, `StoryHolder.tsx:258-313`, `AddStoryWidget.tsx` |
| 13 M-3 | A shopper cannot see who viewed their own story. | `components/Home/Stories/` |
| 15 M-5 | "Save Draft" / "Load Draft" buttons are commented out; the handlers are dead code. | `ProductEditor.tsx:678-746, 939-954, 988-1003, 1119-1134` |
| 15 M-7 | Service methods with no caller: `getUploadedImages`, `deleteImage`. | `services/sellerDashboard/index.ts:376-407` |
| 17 M-1 | No save-to-wishlist button on product cards. Only the product page "More" panel. | — |
| 18 M-9 | There is no site footer, so no second place for legal links on desktop. | `app/(client)/[lang]/layout.tsx` |
| 20 M-21 | Demo and test pages are reachable: `/demo`, `/loginDemo`, and the tester tools `app/api/auth/simulate` and `app/simulateUser` (known, tester-only; remove or gate before production). | `app/(client)/[lang]/demo/**`, `app/loginDemo` |

### B2. Placeholder values, hardcoded values and stale comments

| Section | Item | Where |
|---|---|---|
| 14 M-6 | The device registration body carries a placeholder `auth_token: "some_random_token_for_now"` and a `user_id` from the browser. | `utils/firebaseInitv1.tsx:177-187` |
| 14 L-10 | The Firebase web config is hardcoded in two files. All environments use one Firebase project. | `utils/firebaseInitv1.tsx:11-20`, `public/firebase-messaging-sw.js:58-67` |
| 20 M-17 | A staging media URL is hardcoded in the push service worker. | `public/firebase-messaging-sw.js:4` |
| 20 L-11, 19 L-14 | `images.domains` lists staging and placeholder hosts: `media_server.ramaaz.dev`, `media.ramaaz.dev`, `market_staging.trydos.tech`, `example.com`, `cdn.example.com`, `placehold.co`. | `next.config.ts:220-231` |
| 20 L-12 | Server Actions accept the origins `*.ramaaz.dev` and `localhost:3000`. | `next.config.ts:242-247` |
| 20 L-15 | Image URL helpers branch on the text `media_server` in the host name. A production media host with another name changes how URLs are built. | `utils/functions.tsx:122`, `utils/tinyUtils.tsx:329`, `utils/server/helpers.ts:18, 33, 71, 85` |
| 20 L-17 | Unused env names in `.env.example` and Vercel: `WALLET_SECRET_KEY`, `FIREBASE_SERVER_KEY`. | `.env.example` |
| 20 M-20 | `deploy.yml` says its Vercel secrets are "none of which exist yet". CI never builds the app on a push or PR. | `.github/workflows/deploy.yml:49-53` |
| 11 L-12 | Become-seller sends fixed values: latitude 0 / longitude 0 when the map is skipped (check commented out), currency always "USD", language always "en". | `BecomeSellerModal.tsx:397-399, 759-762` |
| 11 L-15 | Stale comment "TODO: Upload file to server"; the next line uploads. | `UploadProfilePhoto.tsx:149` |
| 15 M-6 | Two comments call the Excel upload a "dummy". The code is the real upload. | `ExcelUploadTab.tsx:395`, `services/sellerDashboard/index.ts:837` |
| 02 W-10 | A "Mock implementation" comment at `SearchIcon.tsx:578` is old; the code is real. | `components/Home/Search/SearchIcon.tsx:578` |
| 01 M-9 | The home view writes a readable cookie `token` that today holds the text `undefined`. Dead code. | `components/Home/index.tsx:57-62` |
| 19 L-1 | First-time visitors outside the served countries see a fake progress bar of 2–3 seconds (random steps, not tied to loading), then a blocking picker with no close button. Default country `gb` is not a market. | `utils/PopupCountry.tsx:101-117` |
| 19 L-4 | `dir` on `<html>` is commented out. The body class `text-rtl` has no CSS rule anywhere. | `[lang]/layout.tsx:161` |
| 18 L-2 | The 404 page is hardcoded for four locales only; `tr` and `ku` see English. | `not-found.tsx:26-55` |
| 20 M-14 | OTP verify is a GET with the code in the query, so codes land in Vercel request logs. | `app/api/auth/login/route.ts:112, 123-125` |

### B3. Untranslated visible text (repo rule, not blocking on its own)

| Section | Item | Where |
|---|---|---|
| 01 M-10 | "Scroll categories left/right" `aria-label` texts. | `components/Server/Navbar.tsx:95, 138` |
| 02 M-7 | Image search route errors ("No product detected", "Internal server error", "Invalid file type"). | `app/api/image-search/route.ts`, `SearchImage.tsx:104` |
| 03 M-9 | Email share subject falls back to "Check this out". | `components/Listing/ListingShareControl.tsx:81` |
| 18 L-1 | English legal body shown in Title Case; real text will be hard to read. | static pages |

### B4. Accepted by the owner

Accepted items are not open work, so they are not listed here. They are in `IMPORTANT-PRODUCTION-NOTES.md`.

---

## Part C — Environment values and dashboard settings that are missing

### C1. Must be set in Vercel production

- Backends: `BACKEND_URL`, `GO_BACKEND_URL`, `STORIES_BACKEND_URL`, `NEXT_PUBLIC_CHAT_BACKEND_URL`, `COMMENT_BACKEND_URL`, `WALLET_BACKEND_URL`, `WALLET_PUBLIC_API_KEY`, `ELASTIC_BACKEND_URL`.
- Elasticsearch: `ELASTICSEARCH_NODE` (without it the client quietly points at `http://localhost:9200`), `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD`, and the ten `ELASTIC_*_INDEX` names (see `IMPORTANT-PRODUCTION-NOTES.md`). Optional: `ELASTIC_LISTING_PIT`, `ELASTIC_LISTING_PIT_KEEPALIVE`, `LISTING_PRICE_AGG_ENABLED`, `MIN_CATEGORIES_UNDER_BOUTIQUE`.
- Redis: `REDIS_URL`, `REDIS_USERNAME`, `REDIS_PASS`, `PRODUCT_REDIS_TTL_SECONDS` (without it the Redis write fails with `EX NaN`). Without Redis the OTP limiter lets every send through and "Add with AI" always says "busy".
- Media: `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, `NEXT_PUBLIC_BASE_MEDIA_URL`, `NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL`. Without the first every upload fails with "Media server upload is not configured". There is no static media key any more: uploads are authorised by the upload ticket alone (2026-10-20).
- Sign-in and OTP: `OTP_KEY_SALT`. Optional: `OTP_COOLDOWN_SECONDS`, `OTP_WINDOW_SECONDS`, `OTP_IP_MAX`, `OTP_SESSION_MAX`, `TOKEN_COOKIE_MAX_AGE`, `DEFAULT_COOKIE_MAX_AGE`.
- Push: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Decide which Firebase project production uses.
- Monitoring and analytics: `NEXT_PUBLIC_DSN_SENTRY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (build only), `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`.
- AI: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `ASSEMBLYAI_BASE_URL` (the voice route breaks without it, because the code checks only the key). Optional: `GEMINI_SEARCH_MODEL`, `GEMINI_IMAGE_SEARCH_MODEL` (image search model, default `gemini-2.5-flash-lite`), `SEARCH_ANALYZE_TIMEOUT_MS`.
- Site: `NEXT_PUBLIC_SITE_URL` (optional since 2026-10-20: the code falls back to the Vercel production domain, never to staging), `NEXT_PUBLIC_ALLOW_INDEXING=true`, `NEXT_PUBLIC_DEFAULT_COUNTRY`, `NEXT_PUBLIC_DEFAULT_LANGUAGE`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_MAX_ARRAY_LENGTH`.
- GitHub secrets for deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

### C2. Must be empty or off in production

`STAGING_GATE`, `OTP_TEST_PHONES`, `QA_VIEW_SECRET` (or a random 32+ character value only QA holds), `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` (inlined into the browser bundle), `REQ_LOG`, `REQ_LOG_BODY`, `NEXT_PUBLIC_ANALYTICS_LOG`, `ENABLE_SENTRY`, `ANALYZE`.

### C3. Vercel dashboard (nothing in code can prove these exist)

- Rate limit per IP: `/api/auth/register-device`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/expire`, `/api/internal/mobile-error-log`, `/api/subscribe`, `/api/unsubscribe`, `/api/proxy`, `/api/ticket`, `/api/products/comments/order_rating`.
- Tight rate limit per IP: `/api/image-search`, `/api/speech-recognition`, `/api/products/searchInCatalog`, and page URLs that carry a search text.
- Until the code fix lands: block `/api/clearRedis`, `/api/revalidate` and `/api/info`.
- Bot protection on. Rollback steps written. Sentry alert rules with a person on duty.
- Keep the install command `yarn install --production=false`. Never add `packageManager` to `package.json`.

---

## Part D — Backend answers that decide a blocker

Only the questions whose answer turns an item on or off as a blocker. The full question lists are in each section file.

| Question | Decides |
|---|---|
| Why does wallet `POST /auth/phone/login-with-id-token` answer `502`? Does it refuse the e-mail value `"undefined"`? | A5-1 |
| Does `/cart/add` check `is_luck`, the 50-second window and "already redeemed" per shopper? | A5-2 |
| Which provider is behind `/customer/order/checkout/card` and `/crypto`? Are orders created before payment? | A5-3 |
| Do `POST /shop/products` and `/update` refuse a purchase price above the unit or discount price? | 15 M-1 becomes a blocker if No |
| Do like / unlike, the comment create call, and seller stories take the user from the token, or from `user_id` / `seller_id` in the body? | 04 M-10, 05, 13, 16 become blockers if from the body |
| Does `POST /firebase_device_tokens` ignore `user_id` and `auth_token` in the body? Who may call `/firebase_device_tokens/send_*` in production? | 14 M-6 |
| Can the index carry one sortable price per country? | A2-23 |
| Which Elasticsearch cluster and which index names will production use? When are they filled? | A4-8 |
| Where does a refund go today, and how long does it take? Are the 12-hour / no-fee / 3-hour values true? | A2-16, A2-17 |
| Does the `users_stories` public feed send `mobile_phone`? | privacy; remove it |
| Will Cloudflare be in front of the production domain? | geo headers |
| Is `support@trydos.com` live, and who answers it? | A3-9 |

---

## Tests that lock in the wrong behaviour today

These tests pass against the bug and must change with the fix: `TryOnModal.test.tsx:82` (A2-4), `orderClass.test.ts:116` (A2-11), `AddToCartComponent.test.tsx:586-594` (06 M-3), `cartReducer.test.ts:1064-1080` (06 M-6), `Organaization.test.ts` (19 M-6), and "keeps the spinner up while the countries have not arrived" in `PopupCountry.test.tsx` (A2-21).
