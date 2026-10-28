# Open decisions and work before launch

**Source:** the 20 section files, `BLOCKERS-AND-PLACEHOLDERS.md` and `IMPORTANT-PRODUCTION-NOTES.md`, as on disk on 2026-10-20.
**Updated 2026-10-20 (evening):** F-1, F-2, F-6, F-7, F-8, F-10, F-11, F-12, F-3, F-4, F-13, F-14, F-15 and L-2 are fixed in code and removed from this list.
**Scope:** only items that block launch and still need a **decision** or **work**. Not listed: anything fixed, anything the owner accepted, the backend host names (known), and items that repeat each other. Where several rows in the section files are one decision, they are one line here. The ids in brackets point at `BLOCKERS-AND-PLACEHOLDERS.md`. The D / L / F ids here keep their numbers, so a removed id is simply missing.

---

## 1. Decisions the owner or Product must make

| # | Decision | What happens today | Ids |
|---|---|---|---|
| D-1 | **Wallet: hide it, or finish it.** Hiding means: remove the wallet sheet, the "Bank Cards" page, the "Back to your wallet" refund text, and the `wallet-token` route. Finishing means the RDB package comes back and the widget is wired. | The sheet says "Under Development", the RDB package is gone, "Bank Cards" is an empty page, and the raw wallet token still reaches the browser. | A2-6, A2-7, A2-8, A2-17, A1-13 |
| D-2 | **Virtual try-on: remove the button, or build it.** | "Try On" waits 3 s and shows the shopper's own photo. The button is on almost every product. | A2-4 |
| D-3 | **QR login: remove it, or give it a backend.** | A `localStorage` mock. "Scan QR Code" is on the first login screen and the profile card. "Approve" closes as if it worked. | A2-5 |
| D-4 | **The order promises.** Confirm or change: "refund within 12 hours", "no fees", "cancel in 3 hours", "collection within 1 day", and the 3-hour countdown. | Fixed text nobody confirmed. The countdown restarts on every page load. | A2-16 |
| D-5 | **Cookie consent, per launch country.** Decide the launch countries. Turkey (KVKK) needs a consent step before analytics start. | GA, PostHog and Speed Insights start on every page with no consent. | A3-3 |
| D-6 | **Support channels.** Is `support@trydos.com` live, and who answers? Phone, chat, or e-mail only? | The contact page shows the address as plain text, and nothing in the app links to it. | A3-9 |
| D-8 | **Card and crypto at launch: offered or not?** If yes, name the provider and test one real payment. | No proof of a real gateway. No test pays by card or crypto. | A5-3 |
| D-10 | **Play Store id for the invite text.** | The invite points at `your.app.id`. | A2-19 |
| D-12 | **Demo and mock pages: remove them, or gate them, before production.** The settings demo `/[lang]/demo` (11 pages: settings, photo, client-id, wallet, profile, personal-info, client-info, body, address, new address), the login demo `/[lang]/loginDemo` and `/loginDemo` (the unwired `NewLoginDesign/` screens), and the tester tools `/simulateUser` and `POST /api/auth/simulate`. | All are live in every build. They call no backend, but any shopper can open them. `/loginDemo` has no `noindex`. The simulate route sets session cookies from the request body with no gate. | 20 L-18, 20 M-21, Part B |

## 2. Legal text to write (Product writes)

Every legal link is wired since 2026-10-20: "terms", "policies", "Legal Information" and "About Us" open the pages that exist. Product only replaces the page text.

| # | Work | Ids |
|---|---|---|
| L-1 | Real Privacy Policy, Terms of Service, About and Contact text in en / ar / tr / ku. The privacy text must name Sentry, PostHog, Google Analytics, Firebase push, cookies and account deletion. | A3-1, A3-2 |

## 3. Third-party accounts, keys and subscriptions

Each service below needs a production account, a key in Vercel, and a named owner for the bill. None of this lives in code, so nobody can confirm it exists.

| Service | Used for | What is missing | Ids |
|---|---|---|---|
| **Google Maps Platform** | The address pin at checkout and the become-seller map | A production key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Rotate the old key (it is in git history). Restrict the new key by HTTP referrer and to the Maps JavaScript API. A billing account with a quota alert. | A4-9 |
| **Google Gemini** | Search text analysis (`gemini-2.5-flash-lite` by default), image search, seller "Add with AI" | A production key in `GEMINI_API_KEY` on a **paid** tier: the shared search budget is 300 analyses a minute, far above the free tier. A spend cap. A billing owner. Image search uses `GEMINI_IMAGE_SEARCH_MODEL` (default `gemini-2.5-flash-lite`) since 2026-10-20; set it only to change the model. | A2-2, Part C1 |
| **AssemblyAI** | Voice search | A production key in `ASSEMBLYAI_API_KEY` **and** `ASSEMBLYAI_BASE_URL` (the route breaks without the second one). A spend cap. A billing owner. | Part C1 |
| **Agora** | Voice and video calls | A production project (App ID, App Certificate with token auth on). Set the production App ID in `NEXT_PUBLIC_AGORA_APP_ID` (one env value since 2026-10-20; without it the staging project is used). | A2-24, A2-25 |
| **Firebase (FCM)** | Push notifications | Decide which Firebase project production uses. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. The web config is hardcoded in two files, so a different project needs a code change. | Part C1, 14 L-10 |
| **Sentry** | Error reporting | `NEXT_PUBLIC_DSN_SENTRY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (build), `SENTRY_ENVIRONMENT` and `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (read since 2026-10-20; without them the Vercel deployment type is used). Alert rules with a person on duty. A `tracesSampleRate`. | A4-6, A1-10 |
| **PostHog** | Session replay and product analytics | `NEXT_PUBLIC_POSTHOG_KEY` for production. Decide whether preview builds get their own key (today every production build sends data). Consent per D-5. | 19 questions, A3-3 |
| **Google Analytics** | Events | `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Remove `debug_mode: true` from every event, or a "developer traffic" filter drops all real data. | A2-27 |
| **Vercel** | Hosting | Firewall rules on the open and paid routes (list in `BLOCKERS-AND-PLACEHOLDERS.md` Part C3). Bot protection on. An Instant Rollback plan with a named person. Speed Insights on for the production project. GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Keep the install command `yarn install --production=false`. | A4-5, A4-7 |
| **Redis** | OTP limiter, the paid-call limiters, the search analysis store, product cache | A production instance (`REDIS_URL`, `REDIS_USERNAME`, `REDIS_PASS`, `PRODUCT_REDIS_TTL_SECONDS`). Without it: image search, voice search and "Add with AI" always answer "busy", and OTP send has no limit. | Part C1 |
| **Elasticsearch** | Listings, search, product pages, reviews | A production cluster with a valid TLS certificate, so the client can stop accepting any certificate. The ten `ELASTIC_*_INDEX` names, filled by the backend team. Without them the app reads and writes staging data. | A1-7, A4-8 |
| **Media server** | Every upload | `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`. Without it every upload fails. No static key: the media store authorises uploads by the ticket alone (`NEXT_PUBLIC_MEDIA_API_KEY` removed 2026-10-20). | Part C1 |

Also to set in production: `NEXT_PUBLIC_SITE_URL` (optional since 2026-10-20: without it the code uses the production domain Vercel gives the project), `NEXT_PUBLIC_ALLOW_INDEXING=true`, `OTP_KEY_SALT`, `NEXT_PUBLIC_DEFAULT_COUNTRY`, `NEXT_PUBLIC_DEFAULT_LANGUAGE`. Must be **empty** in production: `STAGING_GATE`, `OTP_TEST_PHONES`, `QA_VIEW_SECRET` (or a random value only QA holds), `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`, `REQ_LOG`, `REQ_LOG_BODY`, `NEXT_PUBLIC_ANALYTICS_LOG`, `ENABLE_SENTRY`, `ANALYZE`.

## 4. Frontend work that needs no decision

Security:

| # | Work | Ids |
|---|---|---|
| F-5 | The mobile-app call page: take the chat token out of the URL, the "DEBUG" button, the error panel and the Sentry log. | A1-11 |

Shopper-visible:

| # | Work | Ids |
|---|---|---|
| F-9 | A real order note field, or send no note. Every order sends the text `order note` today. | A2-11 |
| F-16 | The invite text: real Play Store id (D-10) and translated text. | A2-19 |

## 5. Backend answers that still decide a blocker

| Question | Decides |
|---|---|
| Why does the wallet sign-in answer `502`? Does it refuse the e-mail value `"undefined"` that our app sends? | A5-1, and D-1 |
| Does `/cart/add` check `is_luck`, the 50-second window and "already redeemed" per shopper? | A5-2 |
| Which provider is behind the card and crypto checkout? Are orders created before payment? | A5-3, D-8 |
| Can the index carry one sortable price per country? Today sort uses the root price and the card shows the country price. | A2-23 |
| Which Elasticsearch cluster and index names will production use, and when are they filled? | A4-8 |
| Where does a refund go today, and how long does it take? Are the 12-hour / no-fee / 3-hour values true? | D-4 |
| Do like / unlike, comment create and seller stories take the user from the token or from the body? | becomes a blocker if from the body |
| Do product create and update refuse a purchase price above the unit or discount price? | 15 M-1 becomes a blocker if No |
| Does the public stories feed send `mobile_phone`? | privacy; remove it |
