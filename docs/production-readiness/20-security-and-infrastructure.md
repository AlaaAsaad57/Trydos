# Security and infrastructure — Production readiness

**Status:** 🔴 Not ready
**In one line:** The `/api/proxy` guards, the cookies and the OTP limiter are solid. The three open debug routes are deleted and the paid AI routes are capped (2026-10-20). There is still no production backend, Sentry still keeps session cookies, and the index TLS check is off.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
This section covers everything that is not one page but decides if production can go live.
It covers the API routes, the request guards, the staging gate, environments and secrets, paid third-party APIs, CI and deploy, and monitoring.
`proxy.ts` (the Next.js 16 middleware) does **not** run on `/api/*`. Its matcher excludes `api` (`proxy.ts:694-713`). So nothing in `proxy.ts` protects an API route. Each route must protect itself, or the Vercel Firewall must.

### API route inventory (34 route files under `app/api`, plus `app/ingest/[...path]`)

| Route | Method | Kind | Auth in code | App-side rate limit | CORS |
|---|---|---|---|---|---|
| `auth/login` | GET | Production | Guest cookie; OTP checked by core | None | none |
| `auth/refresh`, `auth/expire`, `auth/clear-tokens`, `auth/logout`, `auth/update-user`, `auth/me` | POST | Production | Session cookies | None | none |
| `auth/register-device` | POST | Production (makes a new guest) | None (by design) | None | none |
| `auth/wallet-token` | GET | Production | Wallet cookie | None | none |
| `auth/simulate` | POST | Tester tool | see 🔒 checklist | — | — |
| `proxy` | POST, GET | Production | Token from HttpOnly cookie; backend checks it | None | none (same-origin only) |
| `ticket` | POST | Production (media upload ticket) | Market token required | None | none |
| `seller/comments`, `.../reply`, `.../social` | GET, POST, PUT, DELETE | Production (seller app) | Bearer token in header required | None | `*` |
| `seller/products/ai-autofill` | POST | Production (paid AI) | Shop permission check | Yes — 10 per minute per shop | none |
| `image-search` | POST | Production (paid AI) | Session cookie required | Yes — 10 per minute per address, 4 MB cap, busy when Redis is down | none |
| `speech-recognition` | POST | Production (paid AI) | Session cookie required | Yes — 10 per minute per address, 4 MB cap, busy when Redis is down | none |
| `products/searchInCatalog` | GET | Production (web + mobile app; calls paid AI) | None | AI step only: one shared budget of 300 analyses per minute, store per search text for 24 h | `*` |
| `products/featured`, `products/recomended`, `products/popular-search`, `products/comments/buyers_comments`, `products/comments/fqa_comments`, `related-products/[id]`, `mobile/product/details/[slug]`, `mobile/product/qty/[slug]`, `home/boutiques`, `home/mainCategories` | GET | Production (public catalog reads) | None (public data) | None | `*` on most |
| `products/comments/order_rating` | POST | Production | None — `user_id` comes from the body | None | `*` |
| `subscribe`, `unsubscribe` | POST | Production (push topics) | **None** | None | none |
| `internal/mobile-error-log` | POST | Production (error sink) | **None** | None | none |
| `/ingest/[...path]` | any | Production (PostHog proxy) | n/a | None | n/a |

The debug routes `clearRedis`, `revalidate` and `info` were deleted on 2026-10-20. No app code called them. If something outside the app still calls them, it now gets a 404.

## ✅ Working cases
| # | Case (what is protected / what works) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | `/api/proxy` only forwards to 7 named services. An unknown name gets the same 503 as a real failure, so a probe cannot learn the names | all | `app/api/proxy/route.ts:18-22, 209-213`; `utils/server/tokenManager.ts:53-61` | `tests/app/api/proxy/route.test.ts` (AC-34) |
| W-2 | `/api/proxy` refuses a target that could change the host: `//x`, `/\x`, `@x`, a full URL | all | `route.ts:57-60, 236-246` | `route.test.ts` (AC-32) |
| W-3 | `/api/proxy` decodes the target up to 5 times and refuses a broken escape, so `%252F` tricks fail | all | `route.ts:32-45, 236-246` | `route.test.ts` ("targets that are hard to decode", BUG-app-1) |
| W-4 | `/api/proxy` refuses a path that climbs out of the base (`/../..`). It forwards the exact parsed URL it checked | all | `route.ts:255-282, 318` | `route.test.ts` (AC-33) |
| W-5 | `/api/proxy` refuses any call to `send_otp`, also when escaped. OTP send runs only through the `sendOtp` Server Action | core | `route.ts:304-313` | `route.test.ts` (AC-31); e2e `tests/e2e/session.live.spec.ts` (3 steps) |
| W-6 | The GET form of `/api/proxy` forces method GET, sends no body, and refuses cross-site callers (`Sec-Fetch-Site`, `Origin`) | all | `route.ts:119-153, 186-193` | `route.test.ts` ("the query-string (GET) contract") |
| W-7 | Every `/api/proxy` answer is `Cache-Control: no-store`. The proxy sends no browser cookies to the backend | all | `route.ts:366-376, 418-452` | `route.test.ts` ("never lets an answer be cached", "carries the credential … and no cookies") |
| W-8 | `/api/proxy` says which market backend answered (`x-market-backend: gateway` or `core`), in role words only | core / gateway | `route.ts:391-397` | `route.test.ts` (AC-35, AC-36) |
| W-9 | Proxy logs mask the token (`tokenHint`) and print only outside production | all | `tokenManager.ts:380-405` | `route.test.ts` ("prints no credential in the line it logs") |
| W-10 | OTP send has a Redis rate limit: cooldown, per-session cap, per-IP cap (`OTP_*` settings) | core, Redis | `serverActions/sendOtp.ts:121-124`; `serverRequests/radis/index.ts:205-271` | `tests/serverActions/sendOtp.test.ts`; `tests/serverRequests/radis/index.test.ts` |
| W-11 | Token cookies are `HttpOnly`, `Secure` in production, `SameSite=strict`, 48 h by default | — | `tokenManager.ts:21-33` | `tests/utils/server/tokenManager.test.ts` |
| W-12 | Server Actions check the `Origin` header against an allow-list (Next.js built-in) | — | `next.config.ts:236-248` | none |
| W-13 | Security headers on every path: HSTS (2 years), `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, a minimal CSP (`object-src`, `base-uri`, `frame-ancestors`) | — | `next.config.ts:79-135` | none (see 🧪) |
| W-14 | `X-Powered-By` is off. The build does not publish browser source maps | — | `next.config.ts:66, 271` | none |
| W-15 | Every `/api/*` answer is `private, no-store`. No catch-all rule makes a personal page publicly cacheable | — | `next.config.ts:136-176` | `tests/next-config.test.ts` |
| W-16 | Crawling is off unless `NEXT_PUBLIC_ALLOW_INDEXING=true` (robots.txt and `X-Robots-Tag`) | — | `app/robots.ts`; `next.config.ts:9, 140-145`; `utils/server/helpers.ts:458` | none |
| W-17 | Staging gate: with `STAGING_GATE=on`, every page navigation goes to the logo page with a **307** (never 308) | — | `proxy.ts:27, 324-328` | `tests/proxy.test.ts` ("the staging gate", 6 cases) |
| W-18 | The `/ingest` PostHog proxy strips the `Cookie` header before it calls PostHog, and drops PostHog's `Set-Cookie` | PostHog | `app/ingest/[...path]/route.ts` (strip lists) | none found |
| W-19 | Seller AI autofill checks the shop permission, allows 10 calls a minute per shop, and fails **closed** when Redis is down | core, Gemini | `app/api/seller/products/ai-autofill/route.ts:38-53` | `tests/app/api/seller/products/ai-autofill/route.test.ts` (AC-4, AC-6, AC-15) |
| W-20 | The search analyser has a 6 s limit, so a slow Gemini call never holds search | Gemini | `services/elastic/analyzeSearchText.ts:36-38` | not checked one by one |
| W-21 | QA mode needs a `QA_VIEW_SECRET` of 32+ characters, compared in constant time. Unset means off | — | `utils/server/qaMode.ts` | `tests/utils/server/qaMode.test.ts` |
| W-22 | Sentry server events drop the `x-qa-view` header. Sentry "extras" use an allow-list with no token fields | Sentry | `sentry.server.config.ts:40-70`; `utils/errorReported.tsx:77-99` | none |
| W-23 | Request logging (`REQ_LOG`) is off by default and redacts credential keys (`token`, `otp`, `password`, and others) | — | `reqLogger/index.ts:43-66` | none found |
| W-24 | Deploy is by hand only (`gh workflow run Deploy`). Vercel's Git auto-deploy is off. By default the deploy needs green unit **and** e2e runs on that exact commit | Vercel | `.github/workflows/deploy.yml`; `vercel.json` (`git.deploymentEnabled: false`) | n/a |
| W-25 | `package.json` and the lock files hold no GitLab token. Checked, clean | — | `package.json` (no `rdb` Git URL left) | n/a |

## ⚠️ Works, with limits
- **L-1** The staging gate covers page navigations only. `/api/*`, sitemaps, prefetches and Server Actions stay live while the gate is on, because the shipped matcher excludes them. A full gate needs a second edit: swap in the commented gate matcher (`proxy.ts:688-692`). Nothing checks that the flag and the matcher agree.
- **L-2** The shared Redis limiter fails **open**. If Redis is down or slow, OTP send has no limit (`radis/index.ts:221, 270`). The paid calls do not: AI autofill, image search and voice search answer busy, and the search analyser skips the AI.
- **L-3** `OTP_TEST_PHONES` skips the OTP limiter fully for the listed numbers (`utils/server/otpAllowlist.ts`). The setting is safe only while the list is empty in production.
- **L-4** The CSP is minimal. It has no `script-src` and no `default-src`, so it does not block injected scripts (`next.config.ts:131`). HSTS has no `preload`.
- **L-5** `auth/wallet-token` returns the raw wallet token to page JavaScript (`app/api/auth/wallet-token/route.ts:9-14`). The code calls this a controlled exception for the wallet widget. Any XSS can read the token.
- **L-6** `products/comments/order_rating` (POST, CORS `*`) reads rating comments for any `user_id` and order ids taken from the body (`route.ts:18-30`). No session check.
- **L-7 — Closed 2026-10-20.** `NEXT_PUBLIC_MEDIA_API_KEY` is removed from the code, the env example and the test envs. The media store never read it under `/gated/*` (its auth hook accepts the upload ticket alone), so every upload now sends only `X-Upload-Ticket`. Proof: `tests/services/auth.profile.test.ts`, `tests/services/story.test.ts`, `tests/services/sellerDashboard/updateShopInfoBody.test.ts`, `tests/services/orderClass.test.ts` (ticket-only cases, seen red first).
- **L-8** The Elasticsearch client falls back to `http://localhost:9200` when `ELASTICSEARCH_NODE` is missing (`services/elastic/elasticsearch.config.ts:7`). A missing setting fails quietly at runtime, not at build.
- **L-9** `migration.staging.ts` has "staging" in its name, but it exports the new chat API set (`NEW_CHATEnv`, line 19). Six chat files import it. The production chat backend must speak that same API.
- **L-10** The middleware matcher lists names with no route behind them: `fcm-dashboard`, `testBoutique`, `backend-compare`, `sentry-test`, `noposter` (`proxy.ts:704`). A future page with one of these names would skip locale routing.
- **L-11** `images.domains` lists staging and placeholder hosts: `media_server.ramaaz.dev`, `media.ramaaz.dev`, `market_staging.trydos.tech`, `example.com`, `cdn.example.com`, `placehold.co` (`next.config.ts:220-231`). `images.unoptimized: true` is set, so the optimizer is off and the list gates nothing today. The list is still stale.
- **L-12** Server Actions accept the origins `*.ramaaz.dev` and `localhost:3000` (`next.config.ts:242-247`). These are staging and dev hosts. Token cookies are `SameSite=strict`, which limits the risk.
- **L-13** Public catalog routes send CORS `*` for the mobile app (`searchInCatalog`, `featured`, `recomended`, `mobile/*`, `related-products`, comment reads). The data is public and these routes use no cookies, so `*` is acceptable. But each call runs a Vercel function and an Elasticsearch query, and nothing limits the rate.
- **L-14** Seller comment routes send CORS `*` (`app/api/seller/comments/_utils.ts`). They take the token from a header, not a cookie, so `*` does not expose a session.
- **L-15** Image URL helpers branch on the text `media_server` in the host (`utils/functions.tsx:122`, `utils/tinyUtils.tsx:329`, `utils/server/helpers.ts:18, 33, 85`). `helpers.ts:71` rewrites `media_server.ramaaz.dev` to `media.ramaaz.dev`. A production media host with another name changes how image URLs are built.
- **L-16** `LISTING_PRICE_AGG_DEBUG` has no effect in production. The code checks it together with `NODE_ENV !== "production"`, and the debug block is commented out (`services/elastic/elasticSearch.ts:161-163, 466`). `NEXT_PUBLIC_IS_STORE_LAST_JSON` is read by `_isStoreLastJson()`, but nothing calls that function. Both settings are harmless.
- **L-17** No code reads two settings that `.env.example` lists: `WALLET_SECRET_KEY` and `FIREBASE_SERVER_KEY`.
- **L-18** Demo and test pages are live in every build: `/[lang]/demo/**` (11 pages, `noindex`), `/[lang]/loginDemo`, `/loginDemo` (redirects to `/gb-en/loginDemo`), and `/navigation` (`app/(special)/navigation`). They call no backend (checked `NewLoginDesign/` and `components/NavigationDemo/`). But shoppers can open them. `/loginDemo` and `/navigation` have no `noindex`.

## ❌ Missing, broken or not built
| # | Problem | Risk (what can happen) | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-3 | **Fixed 2026-10-20.** `GET /api/clearRedis` had no auth and deleted every OTP limiter key with a blocking `KEYS` call. The route and its test were deleted | — | — | Frontend | No — closed |
| M-4 | **Fixed 2026-10-20.** `GET /api/revalidate` had no secret and sent CORS `*`. The route and its test were deleted. A cache purge now needs a new, secret-protected route if the backend ever needs one | — | — | Frontend | No — closed |
| M-5 | **Fixed 2026-10-20.** `GET /api/info?token=` used the Firebase admin credential with no auth. The route and its test were deleted | — | — | Frontend | No — closed |
| M-6 | There is no production backend environment. Every backend host is staging today | Production has nothing to point at | Vercel env (not in code) | Backend / Ops | Yes |
| M-7 | The Elasticsearch client does not check TLS certificates: `rejectUnauthorized: false` | A man-in-the-middle can read the Elasticsearch user name and password, and change results | `services/elastic/elasticsearch.config.ts:15-17` | Frontend | Yes |
| M-8 | **Fixed 2026-10-20.** Every text search called Gemini with no cache and no limit. Now one shared budget of 300 analyses per minute (`SEARCH_ANALYZE_MAX_PER_MINUTE`) and a 24-hour store per search text (`SEARCH_ANALYZE_CACHE_SECONDS`), keyed by a hash, never the words. Over the budget, or with Redis down, the search runs on the raw text | A bot can still make the search route busy; it cannot grow the Gemini bill past the budget | `services/elastic/analyzeSearchText.ts` | Frontend | No — closed. A Firewall rule on the search route is still wise |
| M-9 | **Fixed 2026-10-20.** `image-search` and `speech-recognition` had no auth and no limit. Now: session cookie required (401), 4 MB cap (413), 10 calls per address per minute (429), busy when Redis is down (503) — `utils/server/paidRouteGuard.ts` | — | `app/api/image-search/route.ts`; `app/api/speech-recognition/route.ts` | Frontend | No — closed |
| M-10 | **Fixed 2026-10-20.** Image search now calls Gemini over HTTP with the model from `GEMINI_IMAGE_SEARCH_MODEL` (default `gemini-2.5-flash-lite`); the `@google/generative-ai` dependency is removed | — | `app/api/image-search/route.ts` | Frontend | No — proof: `tests/app/api/image-search/route.test.ts` |
| M-11 | Sentry has `sendDefaultPii: true` on server, edge and client. The server config's own comment says events still carry session cookies | Sentry stores HttpOnly session tokens | `sentry.server.config.ts:36-37, 65`; `sentry.edge.config.ts:16`; `instrumentation-client.ts:14` | Frontend | Yes |
| M-12 | **Fixed 2026-10-20.** `auth/register-device` allows 30 calls per address per 10 minutes (Redis, hashed address) and answers 429 over that; without Redis the call goes through, because a guest must always be registerable | — | `app/api/auth/register-device/route.ts` | Frontend (code limit), Ops (Firewall rule as a second layer) | No — proof: `tests/app/api/auth/register-device/route.test.ts` |
| M-13 | **Fixed 2026-10-20.** `subscribe` and `unsubscribe` need the session cookie and accept only the shop order topics; subscribe also checks the shop membership (file 14 M-1) | — | `app/api/subscribe/route.ts`, `app/api/unsubscribe/route.ts` | Frontend | No — proof: the two route tests |
| M-14 | OTP verify is a GET with the code in the query (`?verificationId=&otp=`) | OTP codes land in Vercel request logs | `app/api/auth/login/route.ts:112, 123-125` | Frontend | No |
| M-15 | **Code fixed 2026-10-20:** the key is read from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only; the literal and the fallback are gone. The old key stays in git history | The old key keeps working until Ops rotates it | `utils/mapsConfig.ts` | Ops | No — rotate, restrict by referrer, set the value (file 07 M-5) |
| M-16 | **Fixed 2026-10-20.** The Agora App ID was hardcoded in 4 files with 2 different values. Now `utils/agoraConfig.ts` reads `NEXT_PUBLIC_AGORA_APP_ID` (staging project as the fallback) and the four call screens import it | — | `utils/agoraConfig.ts` | Frontend (code), Ops (set the production value) | No — code read; `ChatVoiceCall.test.tsx` and `ChatVideoCall.test.tsx` green |
| M-17 | **Part fixed 2026-10-20.** The structured-data fallback URL `https://trydos.ramaaz.dev` is gone (proof: `tests/serverRequests/meta/StructuredData/Constants.test.ts`, seen red first). A staging media URL is still written in the push service worker | Broken push images | `public/firebase-messaging-sw.js:4` | Frontend | No (cleanup) |
| M-18 | The repo has no rollback plan. No file mentions `vercel rollback`, `vercel promote` or Instant Rollback | No agreed way to undo a bad production deploy | — | Ops | Yes |
| M-19 | Monitoring is not ready for production. The code sets no Sentry `environment` and no `tracesSampleRate`. No alert rules live in the repo. Source-map upload needs `SENTRY_AUTH_TOKEN`, and `.env.example` does not list it | Staging and production errors may mix; no performance data; nobody gets an alert | `sentry.server.config.ts:54-71`; `next.config.ts:287-304` | Ops | Yes |
| M-20 | CI does not build the app. Tests run only on Friday or by hand, never on a push or PR. `deploy.yml` says its Vercel secrets are "none of which exist yet" | A change that breaks `next build` shows up only at deploy time | `.github/workflows/tests.yml`; `.github/workflows/deploy.yml:49-53` | Ops | No — confirm the secrets |
| M-21 | Demo and test pages are reachable (see L-18) | Shoppers see unfinished screens | `app/(client)/[lang]/demo/**`, `app/(client)/[lang]/loginDemo`, `app/loginDemo`, `app/(special)/navigation` | Product / Frontend | Product decides |

## 🔒 Must do before launch

**Code**
- [ ] `app/api/auth/simulate` and `app/simulateUser`: remove or gate before production.
- [x] `clearRedis`, `revalidate` and `info` deleted (M-3, M-4, M-5, done 2026-10-20).
- [ ] Turn TLS certificate checks back on for Elasticsearch (M-7).
- [ ] Set `sendDefaultPii: false`, or remove `cookies` and `Authorization` in `beforeSend`, in all 3 Sentry configs. Set `environment` per deployment (M-11, M-19).
- [x] Fix or remove image search (`gemini-1.5-flash`) (M-10). (done 2026-10-20)
- [x] Search analysis stored and capped (M-8, done 2026-10-20). Proof: `tests/services/elastic/analyzeSearchText.test.ts`, seen red first.
- [ ] Move OTP verify to POST so codes leave the URL (M-14).
- [x] Google Maps literal and fallback removed (M-15, done 2026-10-20). Ops still rotates the old key and sets the env value.
- [ ] Remove staging, `localhost` and `example.com` hosts from `images.domains` and `serverActions.allowedOrigins`. Add the production hosts (L-11, L-12).
- [ ] Remove or gate the demo pages if Product decides so (M-21).
- [ ] If the gate must stay on for some time after go-live, change both halves together: `STAGING_GATE` and the matcher (L-1).

**Config / env** (names only)
- [ ] Backends: `BACKEND_URL`, `GO_BACKEND_URL`, `STORIES_BACKEND_URL`, `NEXT_PUBLIC_CHAT_BACKEND_URL`, `COMMENT_BACKEND_URL`, `WALLET_BACKEND_URL`, `WALLET_PUBLIC_API_KEY`, `ELASTIC_BACKEND_URL`.
- [ ] Media: `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, `NEXT_PUBLIC_BASE_MEDIA_URL`, `NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL`. (No static media key: uploads are authorised by the ticket alone since 2026-10-20.)
- [ ] Search: `ELASTICSEARCH_NODE`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD`. Optional: `ELASTIC_LISTING_PIT`, `ELASTIC_LISTING_PIT_KEEPALIVE`, `LISTING_PRICE_AGG_ENABLED`, `MIN_CATEGORIES_UNDER_BOUTIQUE`.
- [ ] Redis: `REDIS_URL`, `REDIS_USERNAME`, `REDIS_PASS`. Optional: `PRODUCT_REDIS_TTL_SECONDS`, `HOMEPAGE_CACHE_SECONDS`.
- [ ] Sign-in and OTP: `OTP_KEY_SALT`. Optional: `OTP_COOLDOWN_SECONDS`, `OTP_WINDOW_SECONDS`, `OTP_IP_MAX`, `OTP_SESSION_MAX`, `TOKEN_COOKIE_MAX_AGE`, `DEFAULT_COOKIE_MAX_AGE`.
- [ ] Push: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- [ ] Monitoring and analytics: `NEXT_PUBLIC_DSN_SENTRY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (build only), `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`.
- [ ] AI: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `ASSEMBLYAI_BASE_URL`. Optional: `GEMINI_SEARCH_MODEL`, `SEARCH_ANALYZE_TIMEOUT_MS`.
- [ ] Site: `NEXT_PUBLIC_SITE_URL` (the production domain), `NEXT_PUBLIC_ALLOW_INDEXING=true`, `NEXT_PUBLIC_DEFAULT_COUNTRY`, `NEXT_PUBLIC_DEFAULT_LANGUAGE`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_MAX_ARRAY_LENGTH`.
- [ ] Must be **empty or off** in production: `STAGING_GATE` (not `on` after launch), `OTP_TEST_PHONES`, `QA_VIEW_SECRET`, `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES`, `REQ_LOG`, `REQ_LOG_BODY`, `NEXT_PUBLIC_ANALYTICS_LOG`, `ENABLE_SENTRY` (dev only), `ANALYZE`. `LISTING_PRICE_AGG_DEBUG` and `NEXT_PUBLIC_IS_STORE_LAST_JSON` do nothing in production (L-16); leave them unset.
- [ ] Remove the unused `WALLET_SECRET_KEY` and `FIREBASE_SERVER_KEY` from `.env.example` and from Vercel (L-17).
- [ ] GitHub secrets for deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- [ ] Keep the Vercel install command `yarn install --production=false`. Never add `packageManager` to `package.json`.

**Vercel dashboard** (Firewall and platform — none of these live in code)
- [ ] Rate limit per IP: `/api/auth/register-device`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/expire`.
- [ ] Tight rate limit per IP: `/api/image-search`, `/api/speech-recognition`, `/api/products/searchInCatalog`, and page URLs that carry a search text. The code now has its own caps (10 per minute per address on the two paid routes; 300 analyses per minute shared on search); the Firewall rule is a second layer that also stops the function from being invoked.
- [ ] Rate limit per IP: `/api/internal/mobile-error-log`, `/api/subscribe`, `/api/unsubscribe`, `/api/proxy`, `/api/ticket`, `/api/products/comments/order_rating`.
- [ ] Turn on bot protection. Agree when to use Attack Mode.
- [ ] Write the rollback steps: Vercel Instant Rollback to the last good production deploy, and who may run it (M-18).
- [ ] Set Sentry alert rules (new issue, error spike) and a channel that alerts a person on duty.

**Backend**
- [ ] Stand up the production backends: core, gateway, chat, stories, comments, wallet, media, Elasticsearch, Redis (M-6).
- [ ] Limit who can read the gateway error log (`/mobile_error_log/store`): it holds session tokens (see `IMPORTANT-PRODUCTION-NOTES.md`).

## ❓ Needs confirmation from the backend / ops team
- Are Vercel Firewall rate-limit rules set today? On which paths, and with which limits? The repo cannot show this.
- What is the production domain? The code names both `trydos.tech` (Server Actions) and `trydos.ramaaz.dev` (structured-data fallback).
- Does the core backend limit wrong OTP **verify** attempts per `verificationId`? The app has no limit on `auth/login`.
- Who can read the gateway `mobile_error_log` store? How long does it keep records?
- Will the production media host still have `media_server` in its name (L-15)?
- Which Firebase project do the hardcoded web config (`utils/firebaseInitv1.tsx`, `public/firebase-messaging-sw.js`) and the admin env point to? Is there a separate production project?
- Do the two hardcoded Agora App IDs belong to production projects with token auth (App Certificate) on?
- Is the Google Maps key limited by HTTP referrer and by API in Google Cloud?
- Does Google still serve `gemini-1.5-flash` for our key? Is there a Gemini spend cap? Is there an AssemblyAI spend cap?
- Is the Redis connection encrypted? The client sets no TLS option and fixes port 6379 (`serverRequests/radis/index.ts:28-37`).
- Does the production chat backend use the "new chat" API set that `migration.staging.ts` selects?
- Do the deploy secrets exist now? `deploy.yml` still says "none of which exist yet".
- Today `main` deploys to the Vercel **production** target, and `main` is staging. How will real production be separate: a new Vercel project, or a new branch?
- How does Sentry tell staging and production apart today?

## 🧪 Tests that cover this section
**Unit (Vitest)**
- `tests/app/api/proxy/route.test.ts` — allow-list, host escape, path climb, `send_otp` block, cross-site GET refusal, no-store, role-only backend label, masked logs (AC-31 to AC-36).
- `tests/proxy.test.ts` — locale and country routing, crawlers, the staging gate (6 cases), and the shipped matcher (AC-11).
- `tests/next-config.test.ts` — Cache-Control rules only (API no-store, no public catch-all, static assets, homepage cache profile).
- `tests/utils/server/` — `tokenManager.test.ts`, `authRefresh.test.ts`, `qaMode.test.ts`, `otpAllowlist.test.ts`, `otpIdentity.test.ts`, `otpTelemetry.test.ts`, `mobileErrorLog.test.ts`, `helpers.test.ts`, `index.test.ts`.
- `tests/serverActions/sendOtp.test.ts` and `tests/serverRequests/radis/index.test.ts` — the OTP limiter and the fixed-window limiter.
- Every `app/api` route has a test folder under `tests/app/api/`, `seller/products/ai-autofill` included (permission, rate limit, key never leaked). `image-search` and `speech-recognition` prove the session check, the size cap and the limit; `tests/utils/server/paidRouteGuard.test.ts` proves the shared guard; `tests/services/elastic/analyzeSearchText.test.ts` proves the search store and budget.

**E2E (Playwright vs staging)**
- `tests/e2e/session.live.spec.ts` — the live proxy refuses `send_otp` (plain, escaped, GET).

**Important protections with NO test**
- Security headers: HSTS, `X-Frame-Options`, CSP, `Permissions-Policy`, `poweredByHeader: false`.
- Server Actions `allowedOrigins`.
- `/ingest` cookie stripping.
- Sentry scrubbing (`stripQaHeader`), and any check that no token reaches Sentry.
- `reqLogger` credential redaction.
- No test checks that production config has no staging hosts.
