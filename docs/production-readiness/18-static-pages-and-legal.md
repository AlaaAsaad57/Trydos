# Static pages, legal and error pages — Production readiness

**Status:** 🔴 Not ready
**In one line:** The pages and error screens work, but the legal text is placeholder copy, the Privacy Policy cannot be reached from the app, and the shopper agrees to terms they cannot open.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
- Four "trust" pages: `/{locale}/about`, `/contact`, `/privacy-policy`, `/terms-of-service`. All four use one layout, `components/static/StaticPage.tsx`.
- The error screens: the 404 page (`app/(client)/[lang]/not-found.tsx`), the page error screen (`[lang]/error.tsx`) and the app-wide error screen (`app/global-error.tsx`).
- The root logo page (`app/page.tsx`), the links to the legal pages inside the app, the cookie banner, and the contact channels.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper opens `/{locale}/about` → the page shows a title, an intro and two sections. | none | `app/(client)/[lang]/about/page.tsx`, `components/static/StaticPage.tsx` | `tests/app/staticPages.test.tsx`; e2e `staticPages.live.spec.ts` "the about page renders its title and back bar" |
| W-2 | Shopper opens `/{locale}/contact` → same layout, contact copy. | none | `app/(client)/[lang]/contact/page.tsx` | `tests/app/staticPages.test.tsx`; e2e "the contact page renders without errors" |
| W-3 | Shopper opens `/{locale}/privacy-policy` → same layout, privacy copy. | none | `app/(client)/[lang]/privacy-policy/page.tsx` | `tests/app/staticPages.test.tsx`; e2e "the privacy policy page renders without errors" |
| W-4 | Shopper opens `/{locale}/terms-of-service` → same layout, terms copy. | none | `app/(client)/[lang]/terms-of-service/page.tsx` | `tests/app/staticPages.test.tsx`; e2e "the terms of service page renders without errors" |
| W-5 | Shopper reads a static page in Arabic, Turkish or Kurdish → every title, intro and section is translated. All 20 strings exist in `translations.{ar,tr,ku}.js`. | none | `StaticPage.tsx` calls the server `translateFunction` for each string | `tests/components/static/StaticPage.test.tsx` |
| W-6 | Arabic or Kurdish shopper opens a static page → the page is drawn right-to-left and the text is aligned right. | none | `StaticPage.tsx` sets `direction: rtl` when the language is `ar` or `ku` | `tests/components/static/StaticPage.test.tsx` |
| W-7 | Search engine reads a static page → translated title and description, a canonical address, and hreflang links for en/ar/tr/ku. While indexing is off, the page says `noindex`. | none | `generateMetadata` in each page; `serverRequests/meta/buildAlternates.ts`; `getRobotsConfig` in `utils/server/helpers.ts:461` | `tests/app/staticPages.test.tsx` |
| W-8 | Shopper taps the back bar on a static page → goes to `/{locale}/settings`. | none | `StaticPage.tsx` (`preivous_page`) | e2e "the back button on a static page keeps the visitor in the app" |
| W-9 | Shopper taps "Terms & Conditions" in the settings menu → the terms page opens in the same locale. | none | `app/(client)/[lang]/settings/page.tsx:64-68` | none |
| W-10 | Shopper opens an address that does not exist under a locale → the 404 page shows "Back to Home" and three links (Featured, Flash Deals, Boutiques), all in the same locale. The page also stops the navigation spinner. | none | `not-found.tsx` | `tests/app/not-found.test.tsx` |
| W-11 | Arabic shopper in any country gets the Arabic 404 text. Codes other than `sa-ar` / `ae-ar` fall back to the Arabic copy through `isArabic`. | none | `not-found.tsx:59-60` | `tests/app/not-found.test.tsx` "BUG-app-4…" (green, no expected-failure marker) |
| W-12 | Shopper opens an unknown address with no locale (for example `/foo`) → `proxy.ts` first adds the locale, then the 404 page shows under it. | none | `proxy.ts:610-663` | `tests/proxy.test.ts` "puts the pair in front of the path…" |
| W-13 | One part of a page throws → only that part shows "Something went wrong / We could not load this part of the page" with a "Try again" button. The rest of the page stays. The error goes to Sentry, PostHog and the backend error log. | gateway (error log, through `/api/internal/mobile-error-log`) | `[lang]/error.tsx`; `LogError` in `utils/functions.tsx:311` | `tests/app/error.test.tsx` |
| W-14 | The whole app crashes → the app-wide error screen shows the logo, a message, the Sentry "Error ID", "Try Again" (reload) and "Go Home". The error goes to Sentry and to the error log with user id, country and language. | gateway (error log) | `app/global-error.tsx` | `tests/app/global-error.test.tsx` |
| W-15 | The crash message contains "Connection" or "chunks" → the shopper sees a "Connection Lost" screen with "Reload Page". | none | `global-error.tsx:44-130` | `tests/app/global-error.test.tsx` (`it.each`) |
| W-16 | Visitor opens the site root `/` (staging gate off) → `proxy.ts` sends them to their saved, geo or default locale. The logo page is not shown. | none | `proxy.ts:610-663` | `tests/proxy.test.ts` "handles the site root…" |
| W-17 | `STAGING_GATE=on` → `/` shows only the centred logo, and every other page navigation gets a 307 back to `/`. | none | `proxy.ts:27`, `proxy.ts:324-328`; `app/page.tsx` | `tests/proxy.test.ts` "the staging gate"; `tests/app/smallRoutes.test.tsx` |

## ⚠️ Works, with limits
- **L-1 — English legal text is shown in Title Case.** The server `translateFunction` capitalises every English word (`utils/server/index.tsx:24` → `titleCaseWords`). So the English privacy text reads "We Collect The Details You Provide When You Create An Account…". Real legal paragraphs will look the same. The meta descriptions are also in Title Case.
- **L-2 — The 404 page in Turkish and Kurdish is half English.** The title, the description, "Back to Home" and the search tip are hardcoded for `gb-en`, `sa-ar`, `ae-en` and `ae-ar` only (`not-found.tsx:26-55`). A `tr` or `ku` shopper sees these four in English, while the three popular links are translated. The Arabic link labels are hardcoded text, not translation keys (`not-found.tsx:138-161`).
- **L-3 — The app-wide error screen shows the raw error message** to the shopper (`global-error.tsx:96-98` and `:166-168`). The document is always `lang="en"` with no right-to-left setting. The English text is also in Title Case (see L-1).
- **L-4 — The static pages are not in the main sitemap.** `app/sitemap-static.xml` lists them, but the sitemap index (`services/elastic/sitemap.service.ts:1144`) does not link `sitemap-static.xml`, and the per-locale sitemaps do not include them. The `lastmod` dates are not real: they are "today minus 30 or 60 days" (`sitemap.service.ts:320-322`).
- **L-5 — Static pages have no Open Graph image or text.** A shared link to `/about` gets no preview picture.
- **L-6 — The contact email is plain text.** `support@trydos.com` sits inside a paragraph (`contact/page.tsx:14`). It is not a `mailto:` link. There is no phone number, WhatsApp link or contact form.
- **L-7 — The root logo page has its own Google verification token** (`app/page.tsx:12`). The locale layout carries two more (`[lang]/layout.tsx:45-50`). The logo page is only visible while the staging gate is on.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The legal text is placeholder copy: one intro and two short sections per page, written as constants. The text makes promises nobody has checked ("Thousands of products", "easy returns", "We never sell your personal information"). | A Privacy Policy and Terms of about 60 words each. | `privacy-policy/page.tsx:6-21`, `terms-of-service/page.tsx:6-21`, `about/page.tsx:6-21`, `contact/page.tsx:6-21` | Product | Yes — a shop that takes orders and payments needs real, approved terms and a real privacy policy in 4 languages. |
| M-2 | The privacy text does not name the data the app sends out: Sentry with `sendDefaultPii: true`, PostHog with the user's phone number (`components/Home/Init.tsx:144-147`), Google Analytics and Firebase push. It says nothing about cookies, how long data is kept, or how to delete an account. | Nothing — the shopper is not told. | `privacy-policy/page.tsx:12-21` | Product | Yes — the policy must describe what the code really does. |
| M-3 | No cookie consent banner exists. Google Analytics, PostHog and Speed Insights start on every page without asking. No file in `app/`, `components/` or `utils/` mentions "consent". | No banner. Tracking starts at once. | `app/(client)/[lang]/layout.tsx:195-213`; `components/Home/Init.tsx:136` | Product (decide), Frontend (build) | Yes, if Turkey is a launch market (KVKK asks for consent for analytics cookies). Product must decide per country. |
| M-4 | **Fixed 2026-10-20.** The Privacy Policy had no link. "Legal Information" in settings now opens `/[lang]/privacy-policy`. | — | `settings/page.tsx` | Frontend | No |
| M-5 | **Fixed 2026-10-20.** "Terms Of Services" on both sign-up Terms screens now opens `/[locale]/terms-of-service` in a new tab. | — | `components/Login/Enhanced/screens/TermsScreen.tsx`, `components/Login/Enhanced/InlineVerifyPanel.tsx` | Frontend | No |
| M-6 | **Fixed 2026-10-20.** "policies" and "terms" at checkout open the privacy and terms pages in a new tab. A tap on a link no longer ticks the box. | — | `components/Cart/PlaceOrderButtons.tsx` | Frontend | No |
| M-7 | **Fixed 2026-10-20.** "About Us" opens `/[lang]/about` and "Legal Information" opens `/[lang]/privacy-policy`. "Contact Us" is still commented out and "Share App" is still `#` (file 20 D-10). | — | `settings/page.tsx` | Frontend | No |
| M-8 | The Contact page cannot be reached from the app. | Only a shopper who types the address finds it. | `settings/page.tsx:74-78` (commented out) | Frontend | No |
| M-9 | There is no site footer, so there is no second place for legal links on desktop. | No footer on any page. | `app/(client)/[lang]/layout.tsx` (none) | Product | No |
| M-10 | The support channels are not decided. The contact page mentions `support@trydos.com` and "through the app", but it links to no in-app support entry. | A shopper with a problem has one email address in plain text. | `contact/page.tsx:11-20` | Product | Yes — shoppers who pay need a working way to reach support. |

## 🔒 Must do before launch
- [ ] Product: write and approve the full Privacy Policy, Terms, About and Contact text, in en/ar/tr/ku (M-1).
- [ ] Product: list in the Privacy Policy every service that receives user data: Sentry, PostHog, Google Analytics, Firebase, the core backend and the gateway (M-2).
- [ ] Product: decide per launch country if a cookie consent banner is required. If yes, Frontend builds it and holds GA and PostHog until consent (M-3).
- [ ] Frontend: show the English legal body without Title Case, or the real text will be hard to read (L-1).
- [x] Frontend: link the Privacy Policy from the settings menu (M-4). (done 2026-10-20)
- [x] Frontend: make "Terms Of Services" on both sign-up Terms screens open the terms page (M-5). (done 2026-10-20)
- [x] Frontend: make "policies" and "terms" at checkout open the right pages, without ticking the box (M-6). (done 2026-10-20)
- [x] Frontend: point "About Us" to `/{locale}/about`, and give "Legal Information" a real target or remove it (M-7). (done 2026-10-20)
- [ ] Product: decide the support channels (email, phone, WhatsApp, in-app chat) and put them on the contact page as links (M-10, L-6).
- [ ] Frontend: translate the 404 title, text and button for `tr` and `ku` (L-2).

## ❓ Needs confirmation from the backend team
- Backend / ops team: is the `support@trydos.com` mailbox live, and who answers it?
- Backend / ops team: which of the three Google site-verification tokens (two in `[lang]/layout.tsx`, one in `app/page.tsx`) and the file `public/google210329fcef4fbcff.html` belong to the production Search Console property?

## 🧪 Tests that cover this section
- Unit: `tests/app/staticPages.test.tsx`, `tests/components/static/StaticPage.test.tsx`, `tests/app/not-found.test.tsx`, `tests/app/error.test.tsx`, `tests/app/global-error.test.tsx`, `tests/app/smallRoutes.test.tsx` (root logo page), `tests/proxy.test.ts` (root redirect, staging gate).
- E2E: `tests/e2e/staticPages.live.spec.ts` — 5 tests (four pages render, back button).
- Expected-failure markers: none active in these files. `BUG-app-4` in `not-found.test.tsx` is a plain test and is green.
- **No test covers:**
  - the settings menu legal links (the `#` links in M-7 are not checked);
  - the sign-up Terms screens or the checkout terms text — no test checks that the terms can be opened (M-5, M-6);
  - the Title Case on English legal text (L-1);
  - the 404 page in Turkish or Kurdish (L-2);
  - that the static pages appear in the sitemap index (L-4).
