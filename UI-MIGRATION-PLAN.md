# UI migration plan — demo UI becomes the real app

**Status:** Stages 0 (decisions), 1 (foundation) and 2 (login) done on 2026-10-28. Stage 3 (shell) done and
merged into `ui-migrations` on 2026-11-04 (owner's OK). Next: lane A Stage 4 here, lane B Stage 6, lane C Stage 7.
**Added on 2026-11-04:** the new store page and product page join the plan as Stages 7b and 7c (A-31..A-33).
D-45 (the "add to cart" bar) waits for the designer. D-46 (banner with no boutique): no banner for now.
**Three lanes from 2026-11-04 (A-35):** A = 4 → 5 here, B = 6 in `../trydos-chat`, C = 7 → 7b → 7c in
`../trydos-shop`. No e2e in any stage (A-34).
**Still open:** D-24 ("Web" / "lock" switches: answer delayed by the owner), D-30 (place levels: backend). Neither
blocks Stage 2. D-34 (which wallet balance is the truth) is parked by A-17: no wallet backend works yet.
**Written:** 2026-10-28, from a read-only scan of the code.
**Branch:** `ui-migrations`, cut from `development` on 2026-10-28.

## Agreed so far

| # | Decision | Answer |
|---|---|---|
| A-1 | Branch | One long-lived branch `ui-migrations` from `development`. |
| A-2 | Switch method | Hard replace. No feature flag. |
| A-3 | Tests | `/demo` and `/loginDemo` screens are now in test scope (unit + e2e). |
| A-4 | Pages with no new design | They keep the old UI and must keep working. |
| A-5 | Process | We do not use the `wf` workflow. One stage = one session. Claude asks; it never decides. |
| A-6 | Stage order | Two lanes after Stage 1 (changed on 2026-10-28). Stage 1 finishes first. Then lane A runs 3 → 4 → 5 → 7 → 7b → 7c (7b and 7c added on 2026-11-04, A-31) and lane B runs 2 → 6, at the same time. Stage 8 starts when both lanes are done. See "Lanes" under "Stages". |
| A-7 | Design is complete | **Never remove or hide any part of the demo design.** Every screen, sheet, button and row ships. |
| A-8 | No backend yet | The screen opens as designed. Fields with a real source show real data. Fields with no source show empty or a placeholder. The final action (submit, request, send) shows "Soon available". **No mock data and no fake success reach production** (no fake balances, no "any 6 digits pass"). This replaces D-5. **One exception: the wallet (A-17).** |
| A-9 | New design first | The new design has priority. Claude does not change, add or keep anything you did not ask for. When an old feature has no place in the design and no answer from you, Claude asks. |
| A-10 | Reduced motion | Respected in production. Login logo: still. Screen slides, sheets, menus, tab pill: movement is instant, fades stay (`MotionConfig reducedMotion="user"` on the new-UI roots). Bottom bar: no press pulse; the scroll shrink stays because it follows the finger. Note: a machine with "reduce motion" on (this dev machine) shows no animation. |
| A-11 | Kurdish keyboard | The drawn keyboard starts on Arabic letters on `ku` pages, as on `ar` pages. |
| A-12 | Quick Preview gaps | Fixed at 0 / 0 (as the client approved them on `/loginDemo`), not the screen defaults 35 / 56. |
| A-13 | RTL switch | `dir="rtl"` is on now for the whole new UI on `ar` / `ku` pages: the shell's page column, the login's root and every portal (tab bar, sheet layer, QR sheet). Not on `<html>`, so the old pages do not flip. Until a stage converts its screens, the Arabic screens of that stage look half-mirrored on the branch (flex rows flip, fixed positions do not). Nothing reaches production before Stage 8. |
| A-14 | Pointing icons | Icons that point a way (back arrows) are mirrored on `ar` / `ku` (`mirrorFor` in `components/DemoApp1/rtl.ts`). Icons that point no way (logo, clock, help) stay as drawn. Each stage mirrors the arrows of its own screens. |
| A-15 | Swipes | Swipe gestures work the other way on `ar` / `ku`. Each stage mirrors the swipes of its own screens (Stages 4–6). |
| A-16 | Real data | One hook per area (for example `useProfileData`). The hook reads `useAppStore` and calls the existing services. Screens get only plain values from it. Shipping code does not import the mock files (`DemoData.tsx`, `demoWallet.ts`, `demoChat*.ts`). A-8 still applies. Exception: the wallet keeps `demoWallet.ts` (A-17). |
| A-17 | Wallet keeps its mock | **Decided on 2026-10-28.** No wallet backend works yet (on staging the wallet backend answers `502` on sign-in, AUTH-01). So the wallet keeps its mock data (`components/DemoApp/demoWallet.ts`) and its design exactly as on `/demo`. This is an exception to A-8 and A-16. Stage 5 moves the wallet screens into the app with their mock data, and wires no wallet data. When the wallet backend works, a later step replaces the mock with real data: `BACKEND-REQUESTS.md` W-1..W-9, D-34, and the "Money safety" list in Stage 5. **Known effect:** shoppers see the mock balances and history, and the mock actions end in success (for example, any 6-digit withdrawal code passes). This replaces D-32, D-32b and D-34 for now. |
| A-18 | Stages 2 and 3 at the same time | **Decided on 2026-10-28.** Stage 2 (login) is built in the main folder on `ui-migrations`. Stage 3 (shell) is built at the same time by a second session, in its own git worktree (`../trydos-shell`) on the branch `ui-migrations-shell`, cut from `ui-migrations`. Rules: (1) a session never edits files in the other's folder; (2) Stage 3 deletes no old top-nav file (`AuthNavSection.tsx`, `UserNavTopSection.tsx`) until Stage 2 is merged, because Stage 2 changes the login buttons there; (3) new translation keys go only at the end of `translations.{ar,tr,ku}.js`; (4) each session edits only its own stage's section of this plan, plus its own row in this table; (5) merge order: Stage 2 into `ui-migrations` first, then `ui-migrations-shell` takes those changes and merges into `ui-migrations`. D-1 still holds: `ui-migrations` reaches `development` once, at the end. |
| A-19 | Verify flows stay on the page | **Decided on 2026-10-28.** The phone re-verify (`ConfirmMobilePhoneWidget`), the session-expired prompt (`SessionExpiredWidget`), `VerifyPhoneFlow` (personal info, `VerifyUser`) and checkout's `InlineVerifyPanel` are built from the new login screens as an **overlay on the current page**, as today. They do not go to `/[lang]/login`, because the page waits for their result: the seller request is sent again (`BecomeSellerModal.tsx` lines 630-651), a parked chat / stories / comments / wallet 401 is sent again (`utils/fetchData.ts` lines 431-454), the story or the chat opens (`ConfirmMobilePhoneWidget.tsx` lines 102-107), and checkout goes on (`OrderButton.tsx` lines 643-666). |
| A-20 | Way back from `/[lang]/login` | **Decided on 2026-10-28.** "Later", the close button and the end of the flow all go back to the page the shopper left (the return path). With no return path (a direct visit), they go to the home page `/[lang]`. |
| A-21 | Edits kept across the login | **Dropped on 2026-10-28.** It was based on a wrong finding. In personal info and photo upload, any click by a guest on the form opens the login (`onClickCapture={handleFormClick}`, `PersonalInfoForm.tsx` line 270, `UploadProfilePhoto.tsx` line 198). So a guest cannot type or pick a photo before the login, and there are no edits to keep. Only keyboard-only entry (Tab + type) could leave edits; that case is accepted as lost. Nothing is built. |
| A-22 | Sign-in with no name | **Decided on 2026-10-28.** A sign-in to an account that still has no real name (`hasRealName` false) goes verify → name → "Welcome back", the same order as the new sign-up (D-13). Today it is verify → "Welcome back" → name. |
| A-23 | QR sheet until G-1 | **Decided on 2026-10-28.** The QR sheet opens as designed. It shows a fixed QR that holds the plain text "Trydos" (it opens nothing when scanned). "Soon available" shows in the sheet's existing message box over the middle of the QR (the box the declined state uses), with no "Show a new code" link. The localStorage mock (`services/qrLogin`) is not called. |
| A-24 | Login page SEO | **Decided on 2026-10-28.** `/[lang]/login` has `robots: noindex` and is in no sitemap. |
| A-25 | No deploy before the end | **Decided on 2026-10-28** (given to the Stage 3 session). Nothing on `ui-migrations` or `ui-migrations-shell` is deployed until all stages are done (after Stage 8). A half-built state between stages is OK on the branches. |
| A-26 | Session-expired screen | **Decided on 2026-10-28.** No XD board exists (D-14: the designer must check it). It is built like the new "already registered !" screen (`NewAlreadyExistScreen`), with its colours (the light blue page `#F4F8FF`, the purple logo): logo at the top, the bold title "Your session has expired", one line of text, and two wide buttons "Login" and "Continue as Guest". The buttons keep today's actions (`SessionExpiredWidget.tsx`). |
| A-27 | Checkout verify | **Decided on 2026-10-28.** Checkout's verify (today the small `InlineVerifyPanel` inside the order button) becomes a full-screen overlay over the cart, built from the new screens. Its steps stay as today: a shopper with no number on file gets Get Started ("I have already account" / "New customer") → terms for a new customer → phone → method → code; a shopper whose account has a number starts at the method step. No name step and no welcome screen. After the verify the order goes on, as today (`OrderButton.tsx` lines 643-666). |
| A-28 | Checkout QR | **Decided on 2026-10-28.** The checkout's Get Started screen keeps its QR button (A-7: no part of the design is hidden). A tap opens the QR sheet with "Soon available" (A-23), with the same two events the login page sends (`login_start` method `qr`, `screen_view` QR screen). |
| A-29 | Login icons and brand | **Decided on 2026-10-28.** The 15 icon `alt` texts of the login screens are empty (`alt=""`): each icon sits in a button that already has a translated label, or next to text that says the same. The brand name "Trydos" in the terms line is translated with the key that already exists (`Trydos`). |
| A-30 | Number boxes in RTL | **Decided on 2026-10-28.** On `ar` / `ku` pages the phone box (`RdbPhoneInput`) and the code boxes (`RdbPinInputs`) stay left to right, as the drawn keyboard does: flag and number on the left, the send arrow on the right, the first code digit in the left box. Every number the screens show stays left to right too, so its groups never come out in reverse order. The text around them mirrors. |
| A-31 | Store and product pages | **Decided on 2026-11-04.** The store page (XD `Home Page – 47`, its colour sheet `– 54`) and the product page (`– 49`) were built on `development` from 2026-11-02 to 2026-11-04 and reached this branch with merge `0315f822`. They replace the old listing and product pages. They join lane A after Stage 7: **Stage 7b** = store page, **Stage 7c** = product page. Home opens a store and a store opens a product, so the order follows the shopper's path. |
| A-32 | Store design for every listing | **Decided on 2026-11-04.** Every product listing uses the store page design: the boutique pages (`/filters/boutiques/<slug>`, with their `/categories/<slug>` sub-path), every other `/filters/...` page (category, brand and filter results), search results, `/flashDeals/...` and `/featured/...`. |
| A-33 | Product parts with no design | **Decided on 2026-11-04.** The product page shows the design only. A live part with no place in the design is not shown, but its code is **kept, not deleted** — an exception to D-6, because the design may get a place for it later. Which live part maps to which design block is listed in Stage 7c. The size choice and the "add to cart" bar wait for D-45. |
| A-34 | E2E until the end | **Decided on 2026-11-04.** Stages ignore the browser (e2e) suite completely: no stage runs it, fixes it, updates it or adds to it, and a red e2e case blocks no stage and no merge. Every "e2e" line in a stage's "Tests to update" waits for Stage 8, which edits the suite once, for the whole new UI. The unit suite, lint, parity, typecheck and the XD check still run at the end of each stage. Replaces A-3 for e2e only. |
| A-35 | Three sessions at the same time | **Decided on 2026-11-04.** The owner is short on time and wants the plan done before the D-45 design comes. Three Claude sessions work at the same time, one per lane, each in its own folder: lane A (4 → 5), lane B (6), lane C (7 → 7b → 7c). See "Lanes". Replaces the two-lane order of A-6. |
| D-1 | Merge | Once, at the end (after Stage 8). Every stage stays on `ui-migrations`. |
| D-2 | Desktop | The 500 px centred column is OK on desktop. No desktop design work. |
| D-3 | RTL | Mirror everything for `ar` / `ku`: layout, slide direction, tab order, margins. |
| D-4 | English case | **Changed on 2026-11-04.** The new UI uses Apple's capital rules for English (`components/DemoApp1/demoCase.ts`): title style for titles, labels, buttons, chips, tabs and badges (every word capitalised except a / an / the, and / but / or / nor, and prepositions of four letters or fewer in the middle of a phrase); sentence style for body text; names (brands, countries, months, "I") always capitalised; other languages unchanged. Home, the store page, its colour sheet and the product page have it now (taken from `development`). Each later stage switches its own screens (`useDemoCase()` instead of `useDemoNav().t`). Was: Title Case for all English, new screens included. |
| D-5 | No backend yet | Replaced by A-8. |
| D-6 | Old components | Delete an old component in the same stage, only when nothing else uses it (checked with `pnpm knip` and grep). |
| D-7 | Wording | Fix all: "Man" / "Home" translations, the double `Man` in `ku`, and the XD typos ("Rining", "Desible Call", "Replay", "re-remind"). |
| D-8 | `/demo`, `/loginDemo` | Delete them (404). No protected path changes. |
| D-9 | `DemoKeyboard` | Ship it. It needs an a11y and password-manager check in Stage 1. |
| D-10 | Analytics | Old event names and properties only. No new events. |
| D-11 | Login form | A full page at `/[lang]/login` (for example `/sy-en/login`). The 13 places that open the login navigate to it. After sign-in the user goes back to the page they left. The return path is passed in the URL, and only same-site paths are accepted (no open redirect). |
| D-12 | Quick-preview | Shows on every login open. |
| D-13 | Sign-up order | verify → name → success (as in the new design). |
| D-14 | Flows with no XD board | Session expired, inline phone verify at checkout, phone re-verify (`ConfirmMobilePhoneWidget`) are built from the new login screens. The designer must check them. (Phone change in profile is not needed, see D-26.) |
| D-15 | Name check | The name must match the wallet (rdb) KYC name. Backend item C-10. |
| D-16 | QR login | Button and sheet stay (A-7). Until G-1 ships, the sheet follows A-8. The localStorage mock (`services/qrLogin`) does not ship. |
| D-17 | Paths | New screens take the old paths: `/settings`, `/settings/profile`, `/settings/profile/address`, `/settings/wallet`, … They replace the old pages at those paths. Old-only pages (for example `/settings/orders`) stay old UI. |
| D-18 | Cart | A new page `/[lang]/cart` inside the new shell, bottom nav visible. It shows the old cart content (old design), because no XD board exists for the cart items. `?cart=true` links (push notifications, `NotificationHandler.ts` line 509) go to this page. |
| D-19 | Notifications | Behind the profile's "Settings" row. That row opens a settings screen, and notifications (old UI) are one entry there. |
| D-20 | Old pages | The new bottom nav shows on every page, old pages included. The old top nav is removed. |
| D-21 | Badges | Answered by A-8: real cart count and real unread chat count. |
| D-22 | Old profile features | **Into the new Settings screen (old UI inside):** country + language switch; become a seller + seller dashboard / sales link; My checklist + preferences. **Dropped:** Contact us row, Bank cards row, QR-scanner sign-in on the profile card (A-9). **Logout:** the profile's logout row does a real logout (`/api/auth/logout`, `posthogReset`). **Phone verification:** the "Verify now" promo card starts it (new login screens, D-14). |
| D-23 | Profile rows | Terms → `/terms-of-service`, Legal → `/privacy-policy`, About → `/about` (old pages). Settings → the Settings screen (D-19). Language row → the language switch. Login history → A-8 (backend C-5). Logout → real logout (D-22). |
| D-24 | "Web" / "lock" switches | **Still open; the owner delays the answer (2026-11-04).** Until answered they follow A-8: shown, no effect. Stage 4 does not wait for it. |
| D-25 | "Get trydos Business" | Opens become-a-seller. |
| D-26 / D-27 | Phone in profile | Request only, as in the design ("Change my Phone Number Request", backend C-4, A-8 until then). The old instant phone edit and the alternative phone are dropped. So the "phone change in profile" flow in D-14 is not needed. |
| D-28 | Body save | Same pattern as the new Personal info screen (Edit / Cancel, then save). The designer must check it, because the Body board has no such button. Old limits stay: height 110–250 cm, weight 40–180 kg. The foot limit is set with backend item C-1. |
| D-29 | Address | The design's map card becomes a real map (old `Map` component) that sets `latitude` / `longitude`. Contact name and phone come from the profile. The default address is the backend `is_default` flag, used as it is. The new UI adds no control to change it (A-9). Known risk: when no address has `is_default: 1`, checkout shows no address, and the shopper picks one from the list in checkout (as today). |
| D-30 | Place levels | Waits for the backend (C-9, S-1). |
| D-31 | Client info | A-8 applies: real values from `/customer/info` where they exist (C-6), empty where not. "Verified" never shows for a guest. |
| D-32 | Wallet ships | **Replaced by A-17 for now.** Stage 5 does not wait for the wallet backend. Was: A-8 applies, real balance and real history where they exist, every other screen as designed with empty fields and "Soon available" on the action. |
| D-32b | USD + SYP cards | Both cards ship as designed. The backend must follow the design (W-1). **For now A-17:** both cards show the mock balances. Was: the country-currency card shows the real balance, the other card is empty. |
| D-33 | Old wallet extras | The design wins. Load more, row → order link, loading / error + retry / empty states and the inflow / outflow label are dropped. Known effect: the history shows only the rows of the first request (10 today), and the screen shows nothing while it loads or when the call fails. |
| D-34 | Which balance | Parked by A-17: no wallet backend works yet. Answer it when the wallet backend works. |
| D-35 | Checkout pay-with-wallet | Keeps the old UI (A-4). |
| D-36a | Chat rules kept | Paging (list + messages), 25 MB cap + video format check, notification-permission and phone-verify gates, blocked chat hides the composer. |
| D-36b | Old chat features with no design | **Kept**, built in a style taken from the new design: delete for everyone, share product message, stories row, contacts upload, reminders list, tagged-messages view, media gallery, deleted-message placeholder, upload progress, image preview. The designer must check each one, because no XD board exists for them. |
| D-36c | Order chat | The order page (old UI) opens the new conversation screen for that order. The old `ChatWidget` goes. |
| D-37 | Labels | The 5 design labels (Orders, Payment, Shipping, Question, Important), one per message. "One per message" is done in the app (remove the old label, then add the new one). `CHAT_API_CHANGES.md` line 62 says the backend accepts only its fixed list (`urgent`, `important`, `todo`, `done`), so backend item CH-3 asks it to accept the design labels. Until confirmed, A-8 applies to the labels the backend refuses. |
| D-38 | Contact page items | A-8 (shown, "Soon available" where no backend). |
| D-39 | Add person to call | A-8 (backend CH-6). |
| D-40 | Reminder times | As in the design: 1 h / tomorrow / next week. Works today. |
| D-41 | Home body | The old home sections (featured, flash deals, boutiques, recommended, stories bar; old design) sit under the new top bar, with the new bottom nav. Cache (`cacheLife("homepage")` and its tags) stays as it is. |
| D-42 | SEO | Keep all SEO: metadata (`GetHomeMetaData`), structured data, sitemaps, `robots.ts`. The old home sections give the product links. An `h1` must stay on the home page. |
| D-43 | Home chips | The chips are the real main categories from Elasticsearch (as today's `MainCategoriesNavbar`). A tap opens the category page (old listing UI). |
| D-44 | Search | All old search logic inside the new search UI: history, trending, suggestions, results (old result design under the new input), filters, Gemini analyzer, `logSearchTerm`. Voice = old voice search. Scan = old image search. "For you" chips follow A-8 (backend S-2). |
| D-45 | "Add to cart" bar | **Open (designer), 2026-11-04.** The product page design (`– 49`) has no size choice and no "add to cart" button. The owner said the designer will send an "add to cart" bar design. Stage 7c builds the buy part from that design when it comes, and does not plan it before. Note: the old listing and result design named in D-43 and D-44 is only until Stage 7b, which moves every listing to the store page design (A-32). |
| D-46 | Store page banner on a listing with no boutique | **Open, 2026-11-04.** Category, brand, filter and search result pages have no boutique to show in the store page's banner. Until the owner answers: **no banner** on those pages. |

## The main facts the scan found

1. **Every new screen is mock data.** No file in `components/DemoApp1`, `components/DemoApp` or
   `NewLoginDesign/` calls a service, the store or `fetchData`. The route `page.tsx` files under
   `app/(client)/[lang]/demo/**` return `null`. So each stage means wiring real data into the new screens,
   not moving screens.
2. **The new UI has no RTL.** There is no `dir` and no `isRtl` anywhere in the demo. Every position is a
   physical `marginLeft` / `left` / `x: ±100%`. The root `<html dir>` is commented out
   (`app/(client)/[lang]/layout.tsx` line 161). Arabic and Kurdish will show in LTR.
3. **The new UI is mobile-only.** `PAGE_MAX = 500` (`components/DemoApp1/demo1Layout.ts` line 46). No
   `lg` / `md` / `lg2` class is used. A desktop user sees a 500 px column.
4. **English is forced to Title Case.** `translateFunction` (`utils/functions.tsx` line 84) title-cases
   every English key, so XD sentence-case text does not show in `en`.
5. **Translations.** All 335 `DEMO_KEYS` exist in `ar` / `tr` / `ku`. But about 15 login strings in
   `NewLoginDesign/` are missing, and the i18n lint (`eslint.config.mjs` lines 26-31) does not check
   `NewLoginDesign/`. About 50 other strings are hardcoded (listed per stage below).
6. **Many old features have no place in the new design** (for example logout, country switch, become a
   seller, address map pin, delete-for-everyone in chat). Each one is a question in "Open decisions". Nothing
   is dropped without your answer.
7. **Many new features have no backend.** They are listed in `BACKEND-REQUESTS.md`.
8. **The new home is empty.** It has 5 fixed category chips and no body. The live home has featured,
   flash deals, boutiques, recommended and the stories bar. A straight replace removes the content that
   Google indexes.
9. **No e2e spec uses the new UI.** The new screens already have `data-pw` attributes (`demo-*`). The login
   screens reuse almost all live login `data-pw` names.

## Stages (proposed order)

The order puts the work that does not depend on other work first, and the riskiest work last.

| Stage | Session | What | Why this place |
|---|---|---|---|
| 0 | 1 | Answer the open decisions (you + designer + product) | Every later stage needs these answers. |
| 1 | 1 | Foundation: branch, RTL base, Title Case, lint, demo-only parts removed | Every screen needs these. Doing them once avoids 5 copies. |
| 2 | 1–2 | Login | It is independent of the shell, and every signed-in flow needs it. The new screens already reuse the live UI parts. |
| 3 | 1–2 | Shell, bottom nav, real routes, links to old pages | Profile, wallet and chat live inside the shell. |
| 4 | 1–2 | Profile / settings | It uses endpoints that already work. |
| 5 | 1–2 | Wallet | It has the most backend gaps. |
| 6 | 2–3 | Chat | It is the biggest stage (77 old files, real-time, calls). |
| 7 | 1–2 | Home + search | Highest risk: SEO, Elasticsearch, cache, every visitor. |
| 7b | 1–2 | Store page for every product listing (A-32) | Home opens it. Same Elasticsearch, cache and SEO work as Stage 7. |
| 7c | 2 | Product page (A-33; buy part waits for D-45) | The store opens it. SEO page of every product, and the buy flow starts here. |
| 8 | 1 | Full regression, designer sign-off, merge | Last check before `development`. |

Each stage ends with: `pnpm lint`, `pnpm lint:i18n-parity`, typecheck, `pnpm test:run`, the e2e specs of
that stage, a check against the XD boards in `ar` and `en` at 440 x 802, and your review. Nothing is
committed or merged without your OK. **Since 2026-11-04 (A-34): no e2e in any stage; Stage 8 does it all.**

### Lanes (A-6, changed to three lanes on 2026-11-04 by A-35)

| Lane | Folder / branch | Stages | Why |
|---|---|---|---|
| A | `trydos` / `ui-migrations` | 3 (done) → 4 → 5 | Profile and wallet need the shell. Stages 4 and 5 do not overlap, because both change `WalletLinkCard` and the wallet balance on the profile. Stage 5 also takes the old wallet branch `ui-migrations-wallet` (5a; renumber its A-28 row). |
| B | `../trydos-chat` / `ui-migrations-chat` | 2 (done) → 6 | Chat uses its own files (`components/DemoApp1/chat/*`, `store/chat/*`, `services/chat.ts`), and it is the biggest stage. |
| C | `../trydos-shop` / `ui-migrations-shop` | 7 → 7b → 7c | Home, store page and product page follow the shopper's path: home → store → product (A-31). They share Elasticsearch, cache and SEO work. 7c's buy part waits for D-45. |

Stage 8 starts when all three lanes are done.

Rules for the lanes:
- One Claude session per lane, in the lane's own folder. A session never edits files in another lane's folder.
- Each lane's branch is cut from `ui-migrations` and merged back into `ui-migrations` **after each stage**, not
  at the end of the lane. Before a stage starts, the lane merges `ui-migrations` in, to take the other lanes'
  finished stages. D-1 does not change: only `ui-migrations` merges into `development`, once.
- No e2e in any lane (A-34).
- Only one `next dev` at a time on this machine (7.6 GB of memory). A lane that needs the dev server for an XD
  check waits until no other lane runs one. The full unit suite runs in CI (`gh workflow run Tests --ref
  <branch>`), not on this machine.
- Shared files will conflict on merge: the three `translations.*.js` files (new keys only at the end of the
  file), `components/DemoApp/demoKeys.ts`, `components/DemoApp1/ui.tsx`, `components/DemoApp1/demoCase.ts`
  and this plan. Each session edits only its own stages' sections of this plan, plus new rows at the end of
  "Agreed so far" and the decision tables.

### Start of a lane session (copy this to the new session)

1. Read `CLAUDE.md`, then this plan: "Agreed so far", "Lanes", and the sections of your stages.
2. Work only in your lane's folder. Run `git merge ui-migrations` first.
3. One stage = one session (A-5). Claude asks; it never decides. No e2e (A-34).
4. Before the stage's last commit: `pnpm lint`, `pnpm lint:i18n-parity`, `next typegen` + `tsc`, the unit tests
   of the changed files, the XD check in `en` and `ar` at 440 x 802 (`/sy-en`, `/sy-ar`); then the full unit
   suite in CI. Then the owner's review, then merge into `ui-migrations`.

---

## Stage 0 — open decisions (answer before Stage 1)

Who answers: **You**, **Designer** (D), **Product** (P), **Backend** (B).

### For all stages — answered on 2026-10-28 (see "Agreed so far")

| # | Question | Who |
|---|---|---|
| D-1 | Merge `ui-migrations` into `development` once at the end, or after each stage? | You |
| D-2 | Desktop: does the XD file have desktop boards? If not, is a 500 px centred column OK on desktop? | D, P |
| D-3 | RTL: does the XD file have Arabic boards? Is the whole layout mirrored (slides, tab order, margins)? | D |
| D-4 | English case: keep Title Case for all English, or show the XD sentence case on the new screens? | D |
| D-5 | A feature with no backend yet: hide it, show "Soon available", or block the stage until the backend ships? | P |
| D-6 | Old components that the new UI replaces: delete them, or keep them for now? Some are shared (see each stage). | You |
| D-7 | Wording in translations: "Man" is translated as "male" (`ذكر`), "Home" as "my home" (`منزلي`), and `ku` has `Man` twice. XD typos copied as keys: "Rining", "Desible Call", "Replay", "re-remind". Fix them? | D |
| D-8 | `/demo` and `/loginDemo` after the migration: redirect them (this changes `next.config.ts` or `proxy.ts`, both protected paths) or delete them? | You |
| D-9 | `DemoKeyboard` (a page-drawn iOS keyboard for number fields, `components/DemoApp1/keyboard/*`): ship it in production, or use the device keyboard? | D, P |
| D-10 | Analytics: the new screens fire no events. Keep the old event names on the new screens? Add new events (for example reactions, reminders)? | P |

### Login (Stage 2) — answered on 2026-10-28 (see "Agreed so far")

| # | Question | Who |
|---|---|---|
| D-11 | The live login is an overlay opened from 13 places. The new one is a full page. Keep it as an overlay? | D, You |
| D-12 | Does the quick-preview (3 slides, 8 s) show on every open, or only on the first visit? | D, P |
| D-13 | Sign-up order: live is verify → success → name. New is verify → name → success. Which one? | P |
| D-14 | No new design exists for: session-expired screen, inline phone verify at checkout, phone re-verify (`ConfirmMobilePhoneWidget`), phone change in profile. Keep the old screens for these? | D |
| D-15 | "Enter your Name exact id" / "protect your funds": must the name match an ID document? Today the backend takes any string. | P |
| D-16 | QR login: there is no backend yet. Hide the QR button until it exists? | P |

### Shell and navigation (Stage 3) — answered on 2026-10-28 (see "Agreed so far")

| # | Question | Who |
|---|---|---|
| D-17 | URLs: do the new screens live at the old paths (`/settings/profile`, `/settings/wallet`, …)? Old `/settings/orders` and others stay old UI at the same path prefix. | You |
| D-18 | Cart tab: open the old cart drawer (`?cart=true`), or go to an old cart page? The new design has no cart screen. | D |
| D-19 | The live top nav has login, cart, chat, avatar and notifications. The new design has a bottom nav only. Where do notifications go? | D |
| D-20 | How does a user go from the new shell to old pages (product, listing, orders, …) and come back? Does the bottom nav show on old pages? | D |
| D-21 | Bottom nav badges are fixed at 3 (cart) and 11 (chat). Use the real cart count and unread chat count? | D |

### Profile / settings (Stage 4) — answered on 2026-10-28, except D-24 (open) and D-30 (backend)

| # | Question | Who |
|---|---|---|
| D-22 | The old UI has these; the new design has no place for them. For each: add to the new design, or drop? Logout · country switch · language switch · become a seller · seller dashboard / sales link · My checklist · Contact us · Bank cards row · QR-scanner sign-in on the profile card · phone verification (`VerifyUser`, checkout needs it) | D, P |
| D-23 | Profile rows with no action today: Settings, Terms, Legal, About, Login history, the language row, logout. What does each open? | D |
| D-24 | The "Web" and "lock" switches on the profile: what do they do? | D, P |
| D-25 | "Get trydos Business" card: what does it open? | P |
| D-26 | Change phone: live changes it at once with an OTP. The design says "Change my Phone Number Request". Which flow? | P |
| D-27 | Personal info: the old form has alternative phone and phone edit. The new one has neither. Drop them? | D, P |
| D-28 | Body: no save button and no checks in the design. Old ranges are tall 110–250, weight 40–180. Foot placeholder says "000 KG". | D |
| D-29 | Address: checkout needs `latitude` / `longitude`, contact name, phone, and a default address (`is_default`). The new form has a static map picture and no default mark. How do we keep these? | D, P |
| D-30 | Address place picker has 4 levels (Province / District / Town / Street). The backend has `province`, `city`, `town`, `street`, `building`. How do they map? | P, B |
| D-31 | Client info shows "Active", "Personal", "Verified" as fixed text (it shows "Verified" even for a guest). Where do these come from? | P, B |

### Wallet (Stage 5) — answered on 2026-10-28; D-32, D-32b and D-34 changed by A-17 (the wallet keeps its mock)

| # | Question | Who |
|---|---|---|
| D-32 | Almost every wallet action has no backend (see `BACKEND-REQUESTS.md` W-1..W-9). Is Stage 5 blocked until the wallet backend is ready, or do we ship with real balance + history and hide the rest? | P |
| D-33 | The old wallet has paging ("Load More"), a link from a row to its order, inflow/outflow labels, loading / error + Retry / empty states. Keep them? Does the XD file have boards for these states? | D |
| D-34 | Which balance is the truth: the wallet backend balance or `wallet_balance` from the core list? Today they can differ (see "Found on the way"). | B |
| D-35 | Checkout pay-with-wallet (`RdbPaymentModal`) has no new design. Keep the old one? | D |

### Chat (Stage 6) — answered on 2026-10-28 (see "Agreed so far")

| # | Question | Who |
|---|---|---|
| D-36 | The old chat has these; the new design lacks them. For each: add or drop? Delete for everyone · share product message · stories row · contacts upload · reminders list · tagged-messages view · media gallery · deleted-message placeholder · upload progress / cancel / 25 MB cap · image preview before send · notification-permission gate · phone-verify gate · blocked chat with no input · order chat widget (on the order page) · webview calls | D, P |
| D-37 | Categories: the design has 5 fixed coloured tags (Orders, Payment, Shipping, Question, Important), one per message. The backend has 4 tags (`urgent`, `important`, `todo`, `done`), several per message. Map the design to the backend tags, or ask the backend for a new list? | P, B |
| D-38 | Contact page items with no action: Delete chat, Share, Media & Files, Save to gallery, Notification. What do they do? | D |
| D-39 | Calls: "add person to a call" has no backend. Hide it? | P |
| D-40 | Reminder times: design has 1 h / tomorrow / next week. Old has 20 min / 1 h / 3 h / tomorrow. Which list? | D |

### Home and search (Stage 7) — answered on 2026-10-28 (see "Agreed so far")

| # | Question | Who |
|---|---|---|
| D-41 | What is in the home body? Live has featured, flash deals, boutiques, recommended, stories bar, banners and coupon handling. The new home has none of them. | D, P |
| D-42 | SEO: the new home has no text, no `h1` and no product links. How do we keep what Google indexes today? | P |
| D-43 | Home chips "Man / Women / Children / Home / Electronic": real categories from Elasticsearch, or gender/age filters? | P |
| D-44 | Search: keep history, trending, suggestions, results, filters, voice search, image search? The design shows a "For you" chip row and Voice / Scan buttons. What is "Scan"? | D, P |

---

## Stage 1 — foundation

**Goal:** shared base work that every later stage needs. No screen changes its look in `en`.

Steps (**Done** = built and committed on `ui-migrations`):
1. **Done.** Create `ui-migrations` from a clean `development` (after your push).
2. **Done.** RTL base (D-3, A-13, A-14):
   - `components/DemoApp1/rtl.ts`: `isRtlLocale`, `usePageDir()` (reads the locale segment), `mirrorFor()`.
   - `dir` on the shell's page column, the tab bar, the sheet layer (`Layer` in `ui.tsx`), the login's root
     and the QR sheet. The drawn keyboard keeps `dir="ltr"`, as the iPhone keyboard does.
   - The slide is mirrored in the shell and in the login: a deeper screen comes in from the left.
   - The tab slots are placed from the bar's start, so Home is on the right. Each icon keeps its drawing.
   - The shared blocks place everything from the start side: `Txt`, `Box`, `Icon` (`components/DemoApp/ui.tsx`)
     and `FileLines`, `ScreenHeader`, `InfoBanner`, `MenuRow`, `WhyCard` (`components/DemoApp1/ui.tsx`).
     In `en` the logical properties give the same result as before. The header's back arrow is mirrored.
   - Left for the stages: about 430 physical styles and about 300 motion `x` values in the screens. Each
     stage converts its own screens, mirrors its arrows (A-14) and its swipes (A-15).
3. **Done (nothing to build).** English case: D-4 keeps Title Case.
4. **Done.** Add `NewLoginDesign/**` to the i18n lint globs (`eslint.config.mjs` lines 26-31). Then add the missing
   keys to `ar` / `tr` / `ku`.
5. **Done.** Remove the demo-only parts from the shipping path:
   - `demo-controls` panel, `DebugButtons`, `DemoDeviceInfoModal` (`Demo1Shell.tsx` lines 270-300)
   - `useDemoDebug()` colour changes (`ui.tsx` lines 559 and 1097, `DemoKeyboard.tsx` line 324)
   - the demo step bar and logo config bar in `NewLoginWidget.tsx` (lines 262-405)
   - the `robots: noindex`, `userScalable: false` and `HIDE_SITE_CHROME` settings of `demo/layout.tsx`
     must not carry over to real pages by accident.
6. **Done.** Remove the dependencies on demo folders: `components/NavigationDemo/BottomNav` (`TRAVEL`,
   `useScrollScale`) and `NewLoginDesign/DemoDeviceInfoModal`.
7. **Done (agreed, A-16).** The pattern for real data in the new screens. Each stage follows it for its own area:
   - One hook per area, for example `useProfileData`, `useWalletData`, `useChatData`. The hook reads
     `useAppStore` and calls the existing services (`services/*.ts`, which call `fetchData`). A screen never
     calls `fetchData` or a service itself.
   - The hook gives the screen plain values in the shape the screen already draws. So the screen's drawing
     does not change when its data becomes real.
   - Where no backend exists, the hook gives an empty value, and the screen's final action shows
     "Soon available" (A-8). No mock value and no fake success.
   - Shipping code does not import `DemoData.tsx`, `demoWallet.ts` or `demoChat*.ts`. At the end of each
     stage a grep shows that no shipping file imports them. A mock file is deleted when nothing imports it (D-6).
   - Each hook has unit tests for its mapping, with one check per field. The backend is named when a field
     comes from one.
8. **Done.** Wording fixes (D-7): fix the "Man" and "Home" translations, the double `Man` key in `ku`, and rename the
   typo keys ("Rining", "Desible Call", "Replay", "re-remind") in all three files and in `demoKeys.ts`.
9. **Done (a code read; a check on a real phone is still needed).** `DemoKeyboard` ships (D-9). Checked
   for a screen reader, for a password manager on number fields, and for `ar` / `ku`. No screen reader and
   no password manager can run on this dev machine, so these are findings from the code
   (`components/DemoApp1/keyboard/DemoKeyboard.tsx`). Each one needs a check with VoiceOver on an iPhone:
   - **K-1 (screen reader).** A key types only on `pointerdown` (`press()`, line 551). A key has no
     `onClick`. An assistive tool that activates a button with a click alone (Switch Control, some screen
     readers, Enter / Space on a paired keyboard) may type nothing.
   - **K-2 (screen reader).** Every key has `tabIndex={-1}`, and the panel has no `role` and no name. A
     screen-reader user must find the keys by swiping, with no "keyboard" landmark. The letter keys say
     their letter; the action keys have an `aria-label` (Shift, Delete, Numbers, ...).
   - **K-3 (autofill).** A number field gets `inputmode="none"` (`adopt()`, line 109). iOS then shows no
     QuickType bar, so a saved phone number or a one-time code from Messages is not offered. Today no
     password or one-time-code field is typed by this keyboard: the login uses its own `NumericKeypad`,
     and the wallet fields set `autoComplete="off"`. The phone fields of the cash-out sheet and the new-chat
     sheet lose the contact's phone suggestion.
   - **K-4 (`ar` / `ku`).** With `NATIVE_TEXT_KEYBOARD = true` (`components/DemoApp/demoKeyboard.ts`) the
     drawn keyboard shows only on number fields, so its letter layouts are not used. If letters are turned
     on later: the Arabic layout (`layouts.ts` line 53) has none of the Kurdish letters (ڕ ۆ ێ ڵ ە ڤ پ چ ژ گ).
   - **K-5 (leftover) — fixed in Stage 1.** A dead check for the removed demo controls
     (`closest('[data-pw="demo-controls"]')`) and the comment about the removed dark-keyboard debug
     switch are gone from `DemoKeyboard.tsx`.

Tests: `tests/components/DemoApp1/rtl.test.tsx` (the helper), `tests/components/DemoApp1/ui.test.tsx` (the
shared blocks place nothing by the physical left or right), the RTL cases in
`tests/components/DemoApp1/Demo1Shell.test.tsx` (`dir`, the slide side, the tab order, the back arrow) and in
`tests/components/NewLoginWidgetReducedMotion.test.tsx` (the login's `dir`, its slide, the QR sheet).

---

## Stage 2 — login

**New:** `NewLoginDesign/NewLoginWidget.tsx` and its screens (route `app/(client)/[lang]/loginDemo/page.tsx`).
**Live:** `components/Login/Enhanced/FullEnhancedLoginWidget.tsx` (overlay, `components/Home/AuthSections.tsx` line 24).

### Build steps
- **2a — Done.** The page `app/(client)/[lang]/login/page.tsx` (noindex, A-24) shows `NewLoginWidget` with the
  real flow, moved from the live widget: send code, verify, the 3-wrong-codes lock (`attemptsLocked` added to
  `NewEnterPinScreen`), resend, name (`UpdateName`), the analytics events, `router.refresh()` and the story
  rail after sign-in. Order: D-13 and A-22. The way back is `utils/loginPath.ts` (`?next=`, only a path on this
  site, A-20). The mocks are gone: no filled-in phone, no "any 6 digits pass", no QR mock (A-23). The old
  "Later pushes `/en`" fault is gone too: "Later" now goes back to `?next=` or `/[lang]`.
  Tests: `tests/utils/loginPath.test.ts`, `tests/components/NewLoginWidget.test.tsx`, the login page case in
  `tests/app/smallRoutes.test.tsx`. Each was seen red against the old code or a broken check.
- **2b — Done.** The 13 openers go to `/[lang]/login?next=<page>`. One change in `components/Home/AuthSections.tsx`:
  when `loginOpen` turns on, it clears the flag (which also frees the scroll lock) and pushes
  `loginHref(lang, <this page>)`. On the login page itself it goes nowhere. The old overlay is no longer mounted.
  Test: `tests/components/Home/AuthSections.test.tsx` (2 new cases, seen red on the old code). (A-21 was dropped:
  there are no edits to keep.)
- **2c — Done.** The verify overlays on the new screens (A-19):
  - `NewLoginDesign/AuthStage.tsx`: the stage (slide + the one logo) taken out of `NewLoginWidget`, so the login
    page and every overlay draw the new screens the same way.
  - `VerifyPhoneFlow` shows `NewEnterPhoneScreen`, `NewSelectMethodScreen`, `NewEnterPinScreen` on that stage.
    This covers the phone re-verify (`ConfirmMobilePhoneWidget`), personal info and `VerifyUser`. Their waiting
    logic is unchanged.
  - Session expired (A-26): `NewLoginDesign/NewSessionExpiredScreen.tsx`, in the already-registered layout and
    colours ("Login" wide button, "Continue as Guest" blue link). `AuthOverlay` takes an `outerBg` for its colour.
  - Checkout (A-27): the order button opens `VerifyPhoneFlow withIntro` full screen (`AuthOverlay`) instead of the
    small `InlineVerifyPanel`. Get Started → terms for a new customer → phone → method → code → the order goes on.
    The analytics source stays `InlineVerifyPanel` (D-10). Its Get Started keeps the QR button (A-28).
  - Tests: the new-design and intro cases in `VerifyPhoneFlow.test.tsx`, the new-design case in
    `SessionExpiredWidget.test.tsx`, the overlay checks in `OrderButton.test.tsx`; each seen red on the old code.
    `ConfirmMobilePhoneWidget.test.tsx` and `VerifyPhoneFlow.test.tsx` now read the new screens' text (the
    "Send Sms" label, the grouped number). `tests/setup.ts` supplies a no-op `ResizeObserver`, as it supplies
    `matchMedia`, because the logo layer measures with one.
  - Not used any more (goes in 2e): `InlineVerifyPanel.tsx`, `screens/SessionExpiredScreen.tsx`.
- **2d — Done.**
  - RTL: the login screens place everything from the start side (73 positions in 11 files). The centred QR
    canvas, the symmetric pill padding and the `authLayout.ts` numbers stay physical, and so does the logo. The
    name screen's continue arrow is mirrored (A-14). The phone and code boxes and every shown number stay left
    to right (A-30).
  - i18n (A-29): the 15 icon alts are empty; "Trydos" uses the existing key.
  - e2e: `tests/e2e/selectors.ts` reads the new login (`loginPage`, the Quick Preview buttons, `anyAuthStep`,
    `getStartedTitle` = `get-started`, `verifyPanel` = any screen of the login stage). `tests/e2e/actions/auth.ts`:
    `openLoginWidget` checks that /[lang]/login opened and goes through the Quick Preview; `currentAuthScreen`
    tells "closed" by the login stage; `attemptAuth` waits for the login page to go back after "Welcome back".
  - Tests: `tests/components/NewLoginScreensRtl.test.tsx` (16 cases, all seen red on the old screens).
- **2e — Done.** Cleanup (D-6), each file proved unused by grep first: `FullEnhancedLoginWidget.tsx`,
  `InlineVerifyPanel.tsx`, the 12 old screens in `components/Login/Enhanced/screens/`, and their 5 test files.
  `services/qrLogin` stays: the phone-side QR scanner (`QrScannerModal`, `QrApprovalSheet`) still uses it.
- **E2e result (2026-10-28, staging):** `auth.scripted` 6/6 passed on the new login page. `auth.live`: AUTH-02 (the
  session survives a reload) and AUTH-03 (sign out) passed; AUTH-01 is red only on the wallet part ("the wallet
  sign-in did not land"), the known wallet `502` that stays red on purpose. Every other backend of the sign-in
  landed. The other specs that sign in through the UI (shopper, profile, chat, comments, stories, wishlist,
  session recovery) use the same helpers and were not run here.
- **For the team:** a native speaker reviews the new login strings; the designer checks the screens with no XD
  board (session expired A-26, checkout verify A-27, the name-first sign-in A-22).

### Logic to move into the new screens (all exists in the live widget)

- Send OTP: `AuthService.SendOtp` → `serverActions/sendOtp.ts` (Redis `otpRateLimit`, core `/auth/phone/send_otp`), then `lockNumber` / `recordSessionNumber`.
- Verify: `AuthService.VerifyOtp` → `/api/auth/login` (core `verify_otp_from_guest`, then chat, stories, comments, wallet sign-ins). Log the `is_failed` list.
- After verify: `checkWallet`, `loginSuccess*`, `setReAuthResult`, `setShouldAuthinticated(false)`, `posthogIdentify`, notification permission, `getClientData`, `router.refresh()`, `fetchStoriesForUser`.
- Wrong-code counter (`MAX_VERIFY_ATTEMPTS = 3`), `attemptsLocked`, "Tries left", 5xx handled apart from a wrong code, the "user not found" route, rate-limit text.
- Resend (today `onResend={() => {}}`).
- Name: `AuthService.UpdateName` (market + chat + stories, with rollback). `hasRealName` logic.
- `?login=true` back-button handling (`SearchParamUpdater`), the `loginOpen` gate.
- "Later" goes to `/` + lang. Today it pushes `/en`, not `/sy-en` (`NewLoginWidget.tsx` lines 507-510).
- Remove the mocks: phone pre-filled `905528002000`, any 6 digits pass, `loading` / `error` never set, QR `services/qrLogin` localStorage mock.

### All 13 places that open the login (each must navigate to `/[lang]/login` with a return path, D-11)
These call `setLoginOpen(true)`, which mounts `FullEnhancedLoginWidget` (`components/Home/AuthSections.tsx` line 24):
`UserNavTopSection.tsx` line 38, `AuthNavSection.tsx` line 71, `AddStory.tsx` line 34, `LikeButtton.tsx` line 39,
`ProductLikeButton.tsx` line 155, `setting/orders/index.tsx` line 52, `setting/profile/index.tsx` line 30,
`PersonalInfoForm.tsx` lines 244 and 266, `VerifyUser.tsx` line 48, `WalletLinkCard.tsx` line 81,
`UploadProfilePhoto.tsx` lines 136 and 198. After sign-in none of them goes on with the action today (a like is
not applied; the shopper taps again), so a page with a way back keeps their behaviour. Personal info and photo
upload lose nothing: a guest's first click on those forms already opens the login (A-21, dropped).

All 13 set the one store flag `loginOpen`, and only `components/Home/AuthSections.tsx` acts on it. So step 2b
changes that one place: it sends the shopper to `loginHref(lang, <this page>)` and clears the flag. The callers
and their tests stay as they are.

**Not these:** `setShouldAuthinticated(...)` does not open the full login. It opens the phone re-verify
(`ConfirmMobilePhoneWidget`) or the session-expired prompt (`SessionExpiredWidget`), mounted in
`components/Home/NavbarClient.tsx` lines 43-49. Those stay on the page as an overlay (A-19).

### RTL (A-13, A-14)
The login's root and the QR sheet already have `dir`, and the slide is mirrored (Stage 1). The screens'
own positions are still physical: for example the QR sheet's handle and code (`QrBottomSheet.tsx` lines 233
and 247) and the XD positions in `authLayout.ts`. Convert them, and mirror the back arrows of the login screens.

### Shared code — do not break
`components/Login/Enhanced/ui/*`, `authHeadings.ts`, `scaling/Page` (only one `<Page variant="scaled">`
may be mounted), `public/styles/rdb-auth.css`. They are shared by the new login, the live widget,
`VerifyPhoneFlow`, `InlineVerifyPanel` (checkout) and `AuthOverlay`. Do not delete `Enhanced/screens/*`
before D-14 is answered.

### Events to keep (`docs/posthog-events.md` lines 93-110)
`screen_view` per step, `login_start`, `sign_up_start`, `confirm_phone_number`, `send_otp`, `resend_otp`,
`verify_otp`, `login`, `sign_up`, `exception` (OTP_SEND_FAILED / OTP_INCORRECT), `timer_expired`,
`cancel_login`, `cancel_signup`, `later_take_look_clicked`, `create_account_continue`, `terms_services`,
`custom_user_mapping` + `SetGAUser`, `posthogIdentify`, `verify_otp_failed`, `verify_flow_opened`,
`verify_completed_returned_to_checkout`, `otp_send_attempt`.

### i18n
Missing in all three files: `. Get Started .`, `Get Started`, `Welcome !`, 3 slide titles, 3 slide texts,
6 flip labels. Hardcoded: about 14 `alt` values, `Trydos` (`NewTermsScreen`). Country names in
`RdbPhoneInput.tsx` (lines 20-58) are English only (live has the same problem).

### Tests to update
- **e2e helpers:** `tests/e2e/actions/auth.ts` (`openLoginWidget`, `currentAuthScreen`, `attemptAuth`). The
  new UI has no `join-statement`, and it opens on quick-preview.
- **e2e specs that sign in through the UI:** `auth.live` AUTH-01..03, `session.live` AUTH-04,
  `session-recovery.live` RECOV-01/02, `shopper.live` BUY-01..07 + ORD-01, `profile.live` PROF-01..08,
  `chat.live` CHAT-01..16, `comments.live` CMT-01..11, `orderRating.live` CMT-09, `wishlist-signed-in.live`
  WISH-06, `stories.live` STORY-00..05, `profile.scripted` SCRIPT-07..12, `auth.scripted`,
  `harness/qaSeed.ts` line 417. (`login-design-parity.scripted` was deleted in Stage 1.)
- **Unit:** `tests/components/Login/Enhanced/*`, `tests/components/Login/*`, `tests/components/Home/AuthSections.test.tsx`,
  `tests/components/Cart/OrderButton.test.tsx`. The service tests (`auth.otp`, `api/auth/login/route`,
  `sendOtp`, `otpLocks`) stay valid.

---

## Stage 3 — shell, navigation, routes

**Built in:** the worktree `../trydos-shell`, branch `ui-migrations-shell` (A-18).

**No deploy before the end (A-25, decided on 2026-10-28).** Nothing is deployed until all stages are done.
So a half-built state between stages is OK on `ui-migrations` and `ui-migrations-shell`. The A-25 row is
added on `ui-migrations` by the Stage 2 session and arrives here when Stage 2 is merged.

**New:** `components/DemoApp1/Demo1Shell.tsx`, `Demo1ScreenView.tsx`, `Demo1BottomNav.tsx`, `demo1Layout.ts`,
`ui.tsx`, `components/DemoApp/demoRoutes.ts`, `components/DemoApp/topTint.ts`, `app/(client)/[lang]/demo/layout.tsx`.

### Decided for Stage 3 (2026-10-28)

| # | Decision | Answer |
|---|---|---|
| S3-1 | Where the shell mounts | Around every page. The shell moves into the `[lang]` layout. On a URL that is a new screen it draws that screen; on any other URL it shows the old page, with the new bottom nav. The shell state stays alive across all pages (item 6). |
| S3-2 | Which screens move in Stage 3 | Each stage moves its own. Stage 3 builds the routing for every path, but a new screen is turned on only by its own stage: profile in 4, wallet in 5, chat in 6, home and search in 7. Stage 3 turns on only the new `/[lang]/cart` page (D-18). Until then a tab opens the old page. Old pages and their e2e cases keep working between stages. |
| S3-3 | URL style | Real paths: `/[lang]/search`, `/[lang]/cart`, `/[lang]/chat` (and `/[lang]/chat/conversation`, `/contact`, `/call`). No `?search` / `?cart` / `?chat` overlays. `?cart=true` links (`NotificationHandler.ts` line 509) go to `/[lang]/cart`. |
| S3-4 | Old top nav | It stays until Stage 2 is merged into `ui-migrations`. The last step of Stage 3 takes the Stage 2 changes, then removes the old top nav (A-18 rules 2 and 5). |
| S3-5 | Search and chat tabs before Stages 6 and 7 | They open the old features. Chat tab: the old `ChatModal` overlay (store flag `chatVar`, mounted by `NavbarClient`, not by the top nav); a guest goes to the login first, as today (after Stage 2: `/[lang]/login?next=<path>`, A-20). Search tab: the home page `/[lang]`, with the old search (`SearchIcon`, `CategoryHomeView.tsx` line 96) opened. |
| S3-6 | Pages with their own bottom bar | The new bottom nav shows on them too (D-20, no exception). The page's own bar moves up and sits on top of the nav. Known: the product page's add-to-cart bar (`AddToCartComponent.tsx` line 843). The build lists every other one it finds. |
| S3-7 | Cart | Everything on `/[lang]/cart`. Every cart opener goes to the page: the cart tab, `?cart=true`, `ProductCartHeader.tsx` line 21, `NotificationItem.tsx` line 123. The old cart and its checkout steps (cart → `OrdersPage` → payment iframe or RDB modal) run on that page. The cart drawer goes. The checkout events (D-10) fire from the same components as today. |
| S3-8 | Login page | No bottom nav on `/[lang]/login` (Stage 2): the shell steps aside there, as on `/loginDemo`. The session-expired and phone re-verify overlays (A-19) open above the nav, on any page. |
| S3-9 | What the top-nav removal removes | The whole `.home-navbar` strip, on every page: the logo link and `AuthNavContainer` (cart icon, chat icon, Verify button, avatar side menu). Until Stage 4 moves them into the new Settings screen (D-19, D-22), logout, notifications and the seller links are reached only through the old `/settings` page. That gap is OK on the branch (A-25). The chat icon's gates (`openChatAction`: notification permission, phone verify) move to the chat tab. |
| S3-10 | Lit tab | By area: `/[lang]` → Home; `/[lang]/cart` → Cart; `/[lang]/settings/*` → Profile; old chat overlay open → Chat; the old search open → Search. Any other old page (product, listing, filters, about, …) → no tab lit. The designer must check it, because the XD file has no such state. |
| S3-11 | Logout until Stage 4 | **Decided on 2026-10-29.** S3-9 was wrong about logout: the old `/settings` page has no logout. The only logout was in the account menu (`components/Home/Menu.tsx`), opened by the avatar in the old top nav. Task 9 removes both. So the new profile screen's "logout" row now does the real logout (`components/DemoApp1/logoutFromProfile.ts`), but that screen is turned on only in Stage 4. **Known effect on the branch until Stage 4:** no shopper can log out, and the Notifications and Compare entries of the old menu are gone too. AUTH-03 and the 2 other cases that sign out (`signOutAndSettle` in `profile.live`, `shopper.live`) fail on purpose with a message that names this gap. |

### What each tab opens after Stage 3

| Tab | Opens |
|---|---|
| Home | the old home page `/[lang]` |
| Search | `/[lang]` with the old search open (S3-5). No URL of its own until Stage 7. |
| Cart | the new page `/[lang]/cart`, with the old cart and its checkout (D-18, S3-7) |
| Chat | the old `ChatModal` overlay (S3-5). No URL of its own until Stage 6. |
| Profile | the old `/settings` page |

### Rules for the build (Claude's calls, from A-4 and D-42 — check them)

- **Old pages behave as today.** The shell adds only the bottom nav and room under the page, so the nav does
  not cover the page's last row. Old pages keep the browser's own scroll restore (no
  `history.scrollRestoration = "manual"`), keep `overflow-x: clip` on `<html>`, and do not slide. The slide runs
  only between two new screens. A move between a new screen and an old page does not slide.
- **Old pages still render on the server.** The shell must not put the old page inside a Suspense boundary
  that renders only in the browser, or the home page loses its SEO content (D-42). Real paths (S3-3) mean the
  shell needs no `useSearchParams`, which is what forces such a boundary.
- **The drawn keyboard works only inside new screens.** Today `DemoKeyboard` takes every number field in
  `document.body` on a touch device (`DemoKeyboard.tsx` lines 341-370). Around every page it would take
  checkout, the address forms and the seller dashboard too. So it is limited to fields inside a new screen,
  and old pages keep the phone's own keyboard (A-4).
- **Search and chat have no URL before their stage.** Before Stages 7 and 6 the tabs open the old features
  with no URL of their own, as the old icons do today; a reload closes them, as today. `/[lang]/search` and
  `/[lang]/chat` are created by Stages 7 and 6, so the tabs never link to a path that does not exist yet.
  `SearchIcon` keeps its open state in local `useState`, so the search tab needs a new way to open it.
- **The profile tab's orange ring means "phone not verified"** (`is_phone_verified`), because the
  "Verify now" card starts the phone verification (D-22). A guest gets no ring (D-31).
- **One shell only.** `/demo` and `/loginDemo` stay as the preview until the last screen moves in (D-8 is done
  then). On those paths the new shell steps aside, so the preview never gets a second shell and a second bar.
- **The bar uses real data (A-16, D-21).** One hook (`useShellData`) gives the bar the real cart count, the
  real unread chat count, the real photo and the real verified state. The fixed counts (3 / 11) and the mock
  profile go from the bar.
- **The site navbar rule changes.** `HIDE_SITE_CHROME` (`demo1Layout.ts` line 156) hides `.home-navbar`
  whenever `[data-pw="demo1-app"]` is on the page. With the shell around every page, that would hide the old
  top nav everywhere, before S3-4 allows it. Until S3-4 the rule applies only while a new screen is on show.
- **Analytics (D-10).** `DetectScreen()` (`utils/tinyUtils.tsx` line 442) maps `/[lang]/cart` to
  `CART_SCREEN`, as `?cart=true` does today. Each later stage adds the mappings for its own screens. Old
  event names only.

### Work

1. Routes: `screenFromUrl` (`demoRoutes.ts` line 61) and `hrefFor` (line 77) drop the `demo` segment and use
   the real paths (S3-3). A table says which screens are turned on (S3-2). While a screen is off, its path
   shows the old page. A path with no old page (`/search`, `/chat`) is not created until its stage.
2. Route clash: the 14 old pages under `app/(client)/[lang]/settings/` stay. A later stage replaces an old page
   when it turns its screen on. `settings/orders` stays old UI.
3. The shell moves into `app/(client)/[lang]/layout.tsx` (S3-1), following the build rules above.
4. Cart page `/[lang]/cart` (D-18, S3-7) with the old cart and its checkout. Every cart opener goes there,
   and the drawer goes. Back and `popstate` on the page (`SearchParamUpdater`, `CartProvider`) work as a page.
5. Bottom nav on every page (D-20, S3-6), with the room under each page and the old bottom bars moved up.
   The `@modal/(.)products/[productId]` and `(.)filters` intercepted routes open over `.main-content`. The
   bottom nav is portaled to `<body>` (z-index `2147482000`) and the tint strip uses `2147483647`. Check that
   a modal route, the cart drawer, the login overlay and the chat overlay are not covered by the nav.
6. **Measure, do not assume:** Next 16 keeps a left route hidden in the DOM. Check that no rule keyed on a new
   screen still acts on an old page after the shopper leaves the screen.
7. Bundle: `Demo1ScreenView.tsx` imports all 17 screens at once. Use `next/dynamic` with shape-matched
   skeletons (`components/Server/Skeleton.tsx`), never `null`.
8. Measure LCP of the home page against the live home, before and after the shell moves in.
9. `DetectScreen()` mapping for `/[lang]/cart`. The lit tab by area (S3-10). The shell steps aside on
   `/[lang]/login` (S3-8). The drawn keyboard limited to new screens.
10. Last step (S3-4, S3-9): merge the Stage 2 changes in, then remove the old top nav strip and its now-unused
    files (D-6: only when `pnpm knip` and grep show nothing else uses them). The chat tab takes over
    `openChatAction`'s gates.

Tests: `tests/components/DemoApp1/Demo1Shell.test.tsx` (it hardcodes `/demo?search`),
`tests/components/DemoApp/demoRoutes.test.ts`, `tests/app/demo/layout.test.tsx`. New unit cases for the
turned-on table and the real paths. New e2e cases: tab moves, back, deep link + reload, old page from the
shell and back, cart tab, `?cart=true` link, checkout on `/[lang]/cart` (BUY-*), the product page add-to-cart
bar above the nav, no nav on `/[lang]/login`, the lit tab per area.

### Home LCP (Task 8)

Method: production build (`pnpm build`, `pnpm start`) of both sides, run at the same time. Before is commit
`fd6b10f4` (port 3200). After is `ui-migrations-shell` at `b9c66a08` (port 3201). Chromium, 440 x 802, a fresh
context per run, `/sy-en`, last `largest-contentful-paint` entry read after `load` plus 3 s. One warm-up per
server, then 5 runs each, alternating before and after. Date: 2026-10-28.

| Side | Median | Max | The 5 values (ms, in run order) |
|---|---|---|---|
| Before | 4420 ms | 5712 ms | 5712, 484, 4420, 4780, 4248 |
| After | 4488 ms | 10764 ms | 4780, 10764, 4488, 4348, 1632 |

- The median is 68 ms slower after the shell. That is under the 100 ms limit.
- The LCP element is the same on both sides in all 10 runs: the `img.product-media-redeem-show` product image
  (200 x 290) from the media host. The shell did not change the LCP element.
- The spread is large on both sides (484 to 10764 ms). The LCP element is an image from the staging media host,
  so the likely cause is that host, but this run does not prove it.
- With this spread, 5 runs per side cannot show a 100 ms change either way. So the 100 ms check is not proved
  yet: it needs more runs, or a run with the media host's answers held still.

### The old top nav goes (Task 9, S3-4, S3-9, S3-11)

- Stage 2 merged in first (`30a3e11c`).
- The `.home-navbar` strip is gone from `app/(client)/[lang]/layout.tsx`: the logo link and `AuthNavContainer`.
  `--listing-navbar-h` is now `0px`, and the listing's pin stack is 50 px (only its own top bar).
- Deleted, each with no caller left (D-6, checked by grep): `AuthNavContainer`, `AuthNavSkeleton`,
  `AuthNavSection`, `UserNavTopSection`, `UserAvatar`, `Menu`, `ChatNotification` (all in `components/Home/`),
  `hooks/useUserData.tsx`, and their tests. `HIDE_SITE_CHROME` is gone, because there is no navbar to hide.
- **Kept with no caller:** the notifications panel (`components/Notifications/*`, `NotificationSkeleton`). Its only
  caller was the old menu. Stage 4 puts notifications behind the Settings screen (D-19) and reuses it.
- The Chat tab sends a guest to `/[lang]/login?next=<this page>` (A-20), not to the old login flag.
- The new profile's "logout" row does the real logout (S3-11). A guest's tap does nothing.
- e2e: `gotoHome` and `gotoAbout` wait for the Home tab instead of `NavLogo`. The cart and chat helpers press
  the bar's tabs, and read the bar's counts. SHELL-07 checks the login page and its way back. SHELL-08: the login
  page draws no bar.
- Tests seen red on the old code, green after: "the layout draws no .home-navbar" (`tests/app/layout.test.tsx`),
  "Chat as a guest (phone "0") opens the sign-in" (`AppShell.test.tsx`), and the signed-in logout case in
  `tests/components/DemoApp1/profileLogout.test.tsx`. The 2 guest cases in that file are guards (green before
  and after).
- `pnpm knip` cannot run: `knip` is in `package.json` scripts but not installed (`'knip' is not recognized`).
  The unused files were found by grep instead.

### Where Stage 3 stopped (2026-10-29) — continue here

Task 9 is committed and pushed on `ui-migrations-shell`. Before the commit: `pnpm lint:i18n-parity` passed, `pnpm lint`
had 0 errors (no warning in a Task 9 file), `next typegen` + `tsc` passed. **The full unit suite did not finish**
(stopped by the owner to switch work).

**Done on 2026-11-04:** step 0 in CI (run 41824786791: only the 3 chat search tests fail, red on `development` too,
from its commit `2f42f4e7`); step 3 passed (bar only, against `/demo`: every tab box the same in `en` and `ar`;
only the counts differ, real 0 against the mock 3 / 11). Steps 1 and 2 ran once in CI (E2E run 41824914664:
SHELL-01..08 green) before the owner's rule A-34 (no e2e in any stage; Stage 8 does it); the red cases and their
causes are listed in Stage 8 on `ui-migrations`. Found by that run and fixed: the new bar covered the order menu
sheets (`OrdersOptionsMenu`, `OrderOptionsMenu`, `OrderItemOptions`), so they now add `--app-bar-room`
(test: `tests/components/shell/bottomRoom.test.tsx`, 4 cases, seen red before the fix). Left: step 5.

Left, in this order (steps 1, 2 and 4 are dropped: A-34 and the owner's time limit):
0. Run `pnpm test:run` and fix only faults from Task 9 (remember: one random flaky failure is common; prove it alone).
1. Shell e2e spec on this machine: `pnpm e2e:build`, then `pnpm test:e2e:scripted -- --grep SHELL` (SHELL-01..08).
   SHELL-07 and SHELL-08 are new or changed in Task 9 and have not run yet.
2. The full browser suite once: `gh workflow run E2E --ref ui-migrations-shell` (one run at a time). Expected red
   on purpose: AUTH-01 (wallet `502`), and AUTH-03 plus the sign-out cases of `profile.live` and `shopper.live`
   (S3-11, the logout gap until Stage 4). Any other red case must name its cause.
3. The XD check of the bottom bar in `ar` and `en` at 440 x 802 (open `/sy-ar` and `/sy-en`, never `gb-*`).
4. Optional: the home LCP check with more runs (Task 8 could not prove the 100 ms limit).
5. The owner's review of Stage 3, then merge `ui-migrations-shell` into `ui-migrations` (A-18 rule 5). Then
   bring `ui-migrations-wallet` up to date and renumber its A-28 row (A-28 is "Checkout QR" on `ui-migrations`).
6. Next stage on lane A: Stage 4 (profile). It also takes the 3 items moved from Stage 3 (the path table with the
   on/off switch, drawing a new screen inside `AppShell`, `next/dynamic` for the 17 screens), turns on the new
   profile with its logout row (S3-11), and puts notifications behind Settings (D-19). The e2e sign-out helper
   (`openAccountMenu` in `tests/e2e/actions/auth.ts`) waits for Stage 8 (A-34).

---

## Stage 4 — profile / settings

**New:** `components/DemoApp1/screens/` ProfileScreen, ProfileMenuScreen, PhotoScreen, ClientIdScreen,
ClientInfoScreen, PersonalInfoScreen, BodyScreen, AddressListScreen, AddressFormScreen.
**Data today:** all from `DEMO_PROFILE` (`components/DemoApp/DemoData.tsx` lines 51-67), `demoPlaces.ts`,
a static map picture and a static QR picture.

### Decided for Stage 4 (2026-11-04)

| # | Decision | Answer |
|---|---|---|
| S4-1 | Paths | The new screens take the old paths where an old page exists (D-17): Personal info = `/settings/profile/info`, Body = `/settings/profile/size`, Photo = `/settings/profile/picture`. Screens with no old page keep the demo names: `/settings/client-id`, `/settings/profile/client-info`, `/settings/profile/address/new`. |
| S4-2 | Settings screen (D-19, D-22) | A new-style row list, built like the Profile menu (XD `Home Page – 16`): the new header "Settings" and 60 px rows. Rows: Notifications (old panel), notification topics (old `prefferences` form), My Checklist, Country, Language, Become a seller / Seller dashboard. Each row opens the old page or panel. Row icons come from the old settings page. The designer must check it (no XD board). |
| S4-3 | Settings screen path | `/settings/preferences` (new). The old `/settings/prefferences` stays as the topics page, so the notifications panel's link keeps working. |
| S4-4 | Guest | A guest never sees the profile screens: the Profile tab and every new `/settings/*` screen send a guest to `/[lang]/login?next=<path>`. |
| S4-5 | Wallet card on the profile | Shows the USD balance from `demoWallet.ts`, so it matches the wallet screen (A-17). Until Stage 5 the tap opens the old `/settings/wallet` page. |
| S4-6 | "Unverified account" card | Hidden for a shopper whose phone is verified (only the size and business cards show). An exception to A-7, because its text would be false. |
| S4-7 | Address sheets until D-30 | The Country sheet lists only the URL's country (as live). The place sheet lists the backend places (`GetProvinces`) with the design's search; a picked row fills province / city / town / street. |
| S4-8 | E-mail | A-8: the e-mail code sheet opens as designed, and "Verify" shows "Soon available". A changed e-mail is not saved until the backend has e-mail codes. Name and gender save as normal. |
| S4-9 | Words of the new screens | The `[lang]` layout sends the dictionary of all new-UI keys with every page (as `/demo` does). Measured on 2026-11-04: 370 keys, Arabic 20 KB (7 KB gzip). It grows as other stages add keys. |

### The screen mount (built first, for lanes A and B)

The 3 items moved from Stage 3: the path table with its on/off switch, drawing a new screen inside the app, and
`next/dynamic` for the screens.

- `components/DemoApp1/appScreenPaths.ts`: **one row per path** that a new screen owns (`path` after the locale →
  screen key). A path with no row shows its old page. A lane turns a screen on by adding its row, and by making
  that path's `page.tsx` render nothing (the mount draws the screen, not the page).
- `components/DemoApp1/AppScreens.tsx`: wraps the page in the `[lang]` layout. On a path with a row it draws the
  screen; on any other path it shows the old page. Screens slide only between two new screens (Stage 3 rules).
- `AppScreenView.tsx` loads each screen with `next/dynamic` and a shape-matched skeleton (`ScreenSkeleton.tsx`), so
  a page loads only the screen it shows. A new row needs an entry there too (a test checks it). `/demo` keeps
  `Demo1ScreenView.tsx`, which loads all screens at once (its tests draw a screen on the first render).
- Claude's calls (check them): on a new screen the bottom bar shows only on a tab screen (Profile), as in the
  design; inner screens have none. The drawn keyboard is mounted only while a new screen shows. The guest
  check (S4-4) is in each screen's `page.tsx` on the server (it reads the `User-Data` cookie and redirects),
  not in the mount, because the store may not hold the profile yet on the first render.
- Known limit: back from a new screen to an old page with the browser's own back button may open the old page
  at the top, not where it was left (the mount turns the browser's scroll restore off while a new screen shows).
- Merged into `ui-migrations` as `7d281d7e` (owner's OK, 2026-11-04). CI unit suite run 41844213629: only the 3
  known chat search tests are red (from `development` commit `2f42f4e7`). Lane B was told.

### Where Stage 4 stands (2026-11-04) — the profile screens

**Stage 4 is done.** The owner accepted it on 2026-11-04. Commit `6115a68c` is on `ui-migrations` (lane A works on
`ui-migrations` itself, so there is no separate merge).

What was built:
- `useProfileData` (A-16): one hook for the profile area. Real values from the store (`userProfile`, the address
  list), the orders count (`fetchOrdersCount`), the wallet USD from `demoWallet.ts` (S4-5). It reads an address row
  nested (`region_details`, `contact_info`, as checkout does) or flat.
- The 10 profile rows in `appScreenPaths.ts`; each path's `page.tsx` renders nothing and sends a guest to the login
  on the server (`serverRequests/settings/screenPage.ts`, S4-4). The old Bank Cards page is gone (D-22).
- Profile tab: real card, the verify card hidden when verified (S4-6), "Get trydos Business" opens the old
  become-a-seller form (D-25), Orders opens the old orders page, the menu rows open the old pages (D-23), Login
  history says "Soon available", the Web / lock switches have no effect (D-24, A-8).
- Client info: id, phone and "Verified" are real; status, type and "client since" stay empty (no source, D-31);
  the two request buttons say "Soon available". Client ID: real id, name and phone; the QR is still the drawn one.
- Personal info: name and gender save with `auth.UpdateProfile` (only changed fields); a new e-mail opens the
  code sheet, which ends in "Soon available" and saves no e-mail (S4-8).
- Body: Edit / Cancel / "Add & save" (D-28), limits 110–250 cm and 40–180 kg; the foot size is not saved (C-1).
- Photo: the picked file uploads (`UpdateProfileImage`), "Add & save" saves its path, "Remove" saves none.
- Address list: real list; delete = `address_deleted` + the delete call + the store, as checkout; edit opens the
  form through `startUpdateAddress`. Address form: the store's `addressDetails`; the live map (D-29); the URL's
  country only; the live provinces and address search (S4-7); the contact is the shopper's (D-29); save with
  `AddAddressList` / `UpdateAddressList` (`address_saved` / `address_save_failed` fire there).
- Settings screen (S4-2, S4-3): rows for Notifications (old panel), Notification Settings, My Checklist, Country,
  Language, and the old seller card under them.
- RTL: the physical left / right styles of these screens are logical now; the promo swipe and the address cards'
  slide are mirrored (A-15); numbers stay left to right (A-30).
- Deleted, no caller left (D-6): the old profile card and `VerifyUser`, `PersonalInfoForm`, `ProfileSizeInfo`,
  `UploadProfilePhoto`, `PersonalInfoAddress` and its modal, the old orders card, `WalletLinkCard`,
  `RouterRefresh`, and their tests.
- Tests: `tests/components/DemoApp1/profileScreens.test.tsx` (23 cases); `tests/app/settings/pages.test.tsx` checks
  the guest guard of the 10 pages. Its first run found a real bug: the list rows are nested, not flat.

Claude's calls in this part (check them): the old seller card sits as it is under the Settings rows; the address
map's own marker replaces the drawn pin, and the purple pill closes the map again; the photo goes up as picked (the
design has no crop step); an address save with no name on the profile says "Enter Your Name !"; the client ID QR
stays the drawn one, because what a real code should hold is not decided.

XD check (2026-11-04), signed in as the QA test shopper (Shopper A, 3 OTP sends), at 440 x 802: all 9 screens draw
on their paths in `en` and `ar`, right to left in Arabic, with the real data. Found and fixed:
- Arabic address lines showed the Latin place names in reverse order (bidi). Each name is now its own `<bdi>`
  (`components/DemoApp1/placeParts.tsx`). Not checked again in the browser (it needs another OTP send).
- The address list showed "Your address list is empty" before the list answered, and Orders showed "0 action"
  before the count. Both now wait for their answer (tests seen red, then green).
- On a cold dev server the Arabic screens showed empty fields for more than 2.5 s; with a longer wait they show the
  data. The store fills from `/api/auth/me` on start, so this is the slow first compile, not a gap in the app.
Seen, not changed: a hydration warning on Body and Personal info, because the drawn keyboard marks the number
fields (`inputMode="none"`) before the lazy screen hydrates (the same keyboard as `/demo`); SVG attribute warnings
from old components; the wallet backend's 503 (A-17).

**Owner's order (2026-11-04): no new unit tests and no local test runs from now on.** A broken existing test is
listed here, not fixed now; the full unit suite runs in CI. Tests already written stay.

Full unit suite in CI (run 41874241742 on `6115a68c`): 667 of 669 test files pass. The 2 red files hold the 3
chat search tests that are red on `development` too, since `2f42f4e7` (`ChatListSearch` "filters the list at
once…", `ChatLists` "shows the existing chat…" and "still offers a new chat…"). Stage 4 adds no new failure.
Lint, i18n parity and typecheck passed in the same run.

Left for later: the Arabic address line fix (`placeParts.tsx`) is not checked in the browser yet. The Stage 5 XD
check looks at it.

### Live code to link

| New screen | Live code | Service / endpoint |
|---|---|---|
| Profile | `components/setting/profile/index.tsx`, `GoToSellerDashBoard`, `setting/orders`, `WalletLinkCard` | orders count, wallet balance |
| Personal info | `components/setting/profile/PersonalInfoForm.tsx` | `auth.UpdateProfile` (`services/auth.ts` line 689) |
| Body | `components/settings/ProfileSizeInfo.tsx` | `auth.UpdateProfile` |
| Photo | `components/settings/UploadProfilePhoto.tsx` | `uploadToMediaServer` (ticket + `/gated/upload`) → `UpdateProfile({image})` |
| Address list / form | `PersonalInfoAddress.tsx`, `PersonalInfoAddressModal.tsx`, `components/Cart/AddAddressForm.tsx`, `Map`, `SelectRegion` | `services/order.ts`: list, add, update, delete, set default, provinces |
| Client ID / info | none (new) | QR can use the installed `qrcode` package |
| Logout | `components/Home/Menu.tsx` | `/api/auth/logout` |

`UpdateProfile` sends to stories, chat and market, then writes `User-Data` through `/api/auth/update-user`.
The new screens must keep this order and PROF-02 / PROF-08 behaviour.

### RTL (A-13, A-14, A-15)
Convert the physical styles of the screens above. Mirror the profile drag (`ProfileScreen.tsx` line 436,
`drag="x"` and its `velocity.x` rule on line 447).

### Shared code — do not break
Checkout uses the same address code (`AddAddressForm`, `Map`, `SelectRegion`, the `order.ts` address calls,
`store/Cart` address state, the `is_default` rule). Checkout also needs phone verification (`VerifyUser`).

### Mocks to remove
Fake 1.6 s upload (`PhotoScreen.tsx` line 45), any 6-digit e-mail code passes (`PersonalInfoScreen.tsx`
lines 331-334), 4 fixed countries, the fixed place tree, mock orders count and wallet "120 USD".

### Events to keep
`address_saved`, `address_save_failed`, `address_deleted`, `posthogReset` on logout.

### i18n
Hardcoded: `"USD"` (`ProfileScreen.tsx` line 314), share title `"Trydos"` (ProfileScreen line 122,
ClientIdScreen line 52). The downloaded ID card PNG draws name and phone as LTR canvas text.

### Tests to update
- **e2e:** `profile.live` PROF-01..08, `profile.scripted` SCRIPT-06..12, `shopper.live` BUY-01 / BUY-03 /
  ORD-01 (address), `orderRating.live` CMT-09, `locale.live` GUEST-50/51 (country and language buttons).
  Helpers: `tests/e2e/actions/profile.ts`, `tests/e2e/actions/cart.ts` (about lines 1576-1710). Selectors:
  `tests/e2e/selectors.ts` lines 284-400.
- **Unit:** `tests/app/settings/pages.test.tsx`, `tests/components/setting/profile/*`, `tests/components/settings/*`
  (PersonalInfoAddress, Modal, ProfileSizeInfo, UploadProfilePhoto), `BackBar`, `LanguageSetting`,
  `PersonalInfoCountries`, `GoToSellerDashBoard`, `BecomeSellerModal`, `WalletLinkCard`. `auth.profile.test.ts`
  and `AddAddressForm.test.tsx` stay valid if the services are reused.

---

## Stage 5 — wallet

**New:** `components/DemoApp1/screens/` WalletScreen, WalletCashInSheet, WalletCashOutSheet, WalletInfoSheet,
WalletReceipt, WalletWithdrawalRequest. **Data today:** all from `components/DemoApp/demoWallet.ts`.
**Live:** `app/(client)/[lang]/settings/wallet/page.tsx` → `components/settings/WalletTransactions.tsx`;
card `components/setting/WalletLinkCard.tsx` (its sheet says "Under Development").

### Data: the mock stays (A-17)
No wallet backend works yet. So Stage 5 keeps `components/DemoApp/demoWallet.ts` and the design exactly as on
`/demo`, and wires no wallet data. Stage 5 moves the screens into the app (paths, shell, RTL, i18n, tests).

When the wallet backend works, a later step wires these (listed here so nothing is lost):
- Balance: `GetWalletBalanceToShow` (`services/order.ts` line 157) → wallet backend. It gives **one** balance,
  in the country currency.
- History: core `/customer/wallet/list` (`services/order.ts` line 174), 10 rows per page.
- Everything else: `BACKEND-REQUESTS.md` W-1..W-9, and the answer to D-34.

### Money safety — must be fixed before any real submit (when the mock is replaced)
- Amount parse is `parseFloat(text.replace(",", "."))` (`WalletCashOutSheet.tsx` line 84,
  `WalletCashInSheet.tsx` line 130). It accepts "1.2.3", has no decimal limit and no max length.
- The fee uses float math (`amount × 1.1`).
- The withdrawal OTP accepts any 6 digits (`WalletWithdrawalRequest.tsx` line 64).
- No double-submit guard and no idempotency key (`CreateBankDeposit` takes one but nothing calls it).
- No number format: no `Intl`, no `decimal_digits`.

### RTL (A-13, A-15)
Convert the physical styles of the wallet screens. Mirror the card swipe (`WalletScreen.tsx` line 193,
`offset.x` / `velocity.x`).

### Shared code — do not break
`NumericKeypad` and `RdbPinInputs` (from `components/Login/Enhanced/ui`), `GetWallet` (shared with checkout
`PaymentMethod`), `rdbLock` in `store/Cart`, checkout pay-with-wallet (`services/rdbPayment.ts`,
`RdbPaymentModal.tsx`, `RdbPaymentLockedSheet.tsx`).

### Events to keep
`wallet_modal_opened`, `wallet_balance_refreshed`, GA `ADD_PAYMENT` (`GA_PAYMENTS.WALLET`), all `rdb_*`
events (checkout).

### i18n
All 107 wallet keys exist. About 25 raw strings are mock data (names, dates, "0,00 ", "USDT Tron TRC 20").
They go away with real data.

### Tests
Unit: `WalletLinkCard`, `WalletTransactions`, `services/wallet/index`, `walletReauthFlag`,
`api/auth/wallet-token/route`, `fetchData` wallet 401 cases. Checkout tests (`rdbPayment`, `RdbPaymentModal`,
`RdbPaymentLockedSheet`) must stay green. E2E: there is no wallet journey today. AUTH-01 stays red on
purpose (wallet backend 502). New e2e cases for the wallet are needed.

---

## Stage 6 — chat

**New:** `components/DemoApp1/screens/` ChatListScreen, ConversationScreen, ContactScreen, CallScreen;
`components/DemoApp1/chat/*`. **Data today:** `components/DemoApp/demoChat.ts`, `demoChatModel.ts`,
`demoChatState.tsx` (one `useReducer`; timers fake the ticks, typing and replies).
**Live:** `ChatModal` overlay (`components/Home/AuthSections.tsx` line 12), 77 files in `components/Chat/`,
`store/chat/*` (reducer 1572 lines), `services/chat.ts`, calls in `store/chat/callActions.ts` + Agora,
real time by FCM data messages (`utils/NotificationHandler.ts` lines 193-246).

### What the chat backend already has (wire these)
List (`my_channels`, with `pinned_channels`, `archived`), messages, send, edit, delete (`delete_for_all`),
tags, reminders, archive, unread, watched / received, jump to message, contacts, user search,
`channelSearch`, calls + Agora token, forward (`is_forward: 1`). See `CHAT_API_CHANGES.md`.

### Mocks to remove
Fixed rows and counts, fake ticks / typing / replies (`MOCK_TIMING`, `MOCK_REPLIES`), local blob
attachments (nothing uploads), voice that records no audio, fake call states and timer (no Agora), local
reminder timer.

### Must be handled (the demo does not model it)
- FCM events arrive out of order. `pinned_channels` comes as a separate array. Search answers newest first.
- `channelSearch`: whole words of 3+ letters only, and Arabic never matches (backend limits).
- Chat answers can be `200` with `isSuccessful: false`. Check `isSuccessful`.
- 401 is normal (60-second token). Chat exchanges the token, waits 2 s, then retries.
- Performance: the conversation renders every message (`ConversationScreen.tsx` line 942) and the list
  renders every row. Paging is needed. Each `MessageRow` creates framer-motion values.
- Lottie emoji load from `fonts.gstatic.com`, map tiles from `tile.openstreetmap.org`. A stricter CSP
  later would break them.
- Known old faults: CHAT-APP-2 (3-pin limit never applies), CHAT-APP-3, CHAT-APP-4.

### RTL (A-13, A-14, A-15)
Convert the physical styles of the chat screens. Mirror the back arrows (`chatBackPurple` in
`ConversationScreen.tsx` lines 417 and 501, `contactBackBlue` in `ContactScreen.tsx` line 76, `callBackGrey`
in `CallScreen.tsx` line 135). Mirror the swipes: the row swipe (`ChatListScreen.tsx` line 577), the
message swipe (`chat/useHorizontalSwipe.ts`) and the slide-to-cancel of the voice note (`chat/Composer.tsx`
line 242, which allows only a move to the left today).

### Events to keep
`chat_opened`, `chat_message_sent` (`conversation_id`, `message_type`, `is_order_chat`, `is_reply`),
`chat_product_shared`, GA `SCREEN_VIEW` `CHAT_SCREEN`.

### i18n
Hardcoded (about 14): `ReactionSheet.tsx` tab labels (lines 44-49), "Reactions" (line 250), "Search emoji"
(line 278), "No emoji found" (line 369), emoji keyword search is English only; `MessageMenu.tsx` aria-labels
(lines 296, 342); size units B / KB / MB / GB (`demoChatModel.ts` lines 459-466); file extension label
(`messages.tsx` line 527). `CategorySheet.tsx` line 41 casts backend names to `DemoKey`.

### Tests to update
- **e2e:** `chat.live` CHAT-01..16, `chat.scripted` SCRIPT-27..43, `actions/chat.ts`, `scenarios/chat.ts`,
  `selectors.ts` lines 1483-1660. The new UI has 92 `demo-*` `data-pw` names.
- **Unit:** 51 files in `tests/components/Chat/**`, `tests/store/chat/*`, `tests/store/chatSendMessage.test.ts`,
  `tests/services/chat.test.ts`, `tests/utils/chatMuteNotifications.test.ts`. Demo unit tests:
  `demoChatModel.test.ts` (40 cases), `useHorizontalSwipe.test.tsx`.

---

## Stage 7 — home and search

**New:** `components/DemoApp1/screens/HomeScreen.tsx`, `SearchScreen.tsx`.
**Live:** `app/(client)/[lang]/page.tsx` → `CategoryHomeView` (also used by `/categories/[slug]`, so it stays),
`components/Home/Search/SearchIcon.tsx` (1021 lines).
**Built in:** `../trydos-shop`, branch `ui-migrations-shop` (lane C, A-35).

### Decided for Stage 7 (2026-11-04)

| # | Decision | Answer |
|---|---|---|
| S7-1 | Home body | **Changes D-41.** Since 2026-11-02 the new home has its own body (XD `Home Page – 2`, `HomeSections.tsx`): stories row, "Brand Stores" carousel, "Stores" grid. The home shows **only this new body**, with real data. Featured, flash deals and recommended are not shown; their code is kept (as A-33). Known effect: the home page has fewer product links for search engines (D-42); the boutique cards still link to the boutique pages. |
| S7-2 | How home and search turn on | Each is its own page, not a screen drawn by `AppShell` (lane A builds that in Stage 4). `app/(client)/[lang]/page.tsx` renders the new header and body itself (server render kept, D-42). A new route `app/(client)/[lang]/search/page.tsx` renders the new search. `AppShell` changes only the Search tab: it goes to `/[lang]/search` and is lit there. |
| S7-3 | Brand Stores vs Stores | The live boutiques have no "brand store" field. Rule: boutiques in their backend order (`boutique_position`); the first 9 fill the Brand Stores carousel (3 pages of 3), the rest fill the Stores grid. A backend "brand store" flag can replace the rule later. |
| S7-4 | Category page | **Changes D-43.** `/[lang]/categories/<slug>` shows the new home too: the same header with that chip picked, and the new body for that category (the boutiques reader already filters by category). This does not clash with A-32: `/categories/<slug>` is a home page, not a listing, so Stage 7b does not move it to the store page design. Stage 7b moves only the listings (`/filters/...`, search results, `/flashDeals/...`, `/featured/...`). |
| S7-5 | Add story | The live "add story" tile has no place in `Home Page – 2`. It stays: an "add story" card first in the new stories row, drawn in the style of the new story cards. It opens the old `AddStoryWidget`, as today. The designer must check it (no XD board). |
| S7-7 | Store count | The first read takes 21 boutiques (9 for the carousel, 12 for the grid's 4 columns of 3). When the shopper slides the grid near its end, the next boutiques load into new columns, with the same reader and paging as the old home. Every boutique stays reachable from home. |
| S7-8 | Picked chip on home | On `/[lang]` no chip is picked. On `/categories/<slug>` that category's chip is picked and moves to the front, as the old category bar does. |
| S7-9 | Story card style | Every card uses the file's card 2: radius 20, shadow `0 3px 3px` black at 20%, no line. |
| S7-10 | Seen ring | Orange ring (as the file) = the person has a story not seen yet. Grey ring `#D3D3D3` = all seen, the live bar's meaning. The designer must check the grey. |
| S7-11 | Store logo | "Respect the design always": the boutique's `icon` sits in the file's logo band, 20 px high at top 65, centred under the awning, its width taken from the picture (a square icon shows at 20 x 20). A boutique with no icon shows its name in that band (the card's name mark). |
| S7-6 | Search chips | The row shows only the "For you" chip, picked, with no effect (A-8, backend S-2). The five "Empty" chips of the file are placeholders and are not drawn until the backend gives real chip names. |
| S7-12 | The home's `h1` (D-42) | Owner's answer on 2026-11-04: **a hidden `h1`**. `AppHomeView` writes one `h1` with the `sr-only` class: screen readers and search engines read it, nobody sees it. On `/[lang]` it is the existing key `Trydos` ("تريدوس" in Arabic); on a category page it is the category's name. No new translation key. |

### Progress (lane C)

1. **Done (not committed):** real data for the home. `components/DemoApp1/homeData.ts` (boutiques → cards, S7-3
   split, chips), `useHomeData.ts` (`useHomeStories`, `useHomeGrid`), `getCachedBoutiques` takes a `limit`.
2. **Done (not committed):** the new home on `/[lang]` and `/[lang]/categories/<slug>`: `AppHomeView` (server,
   cached reads) → `AppHome` (client). `HomeSections` draws the data it is given (no mock import); `/demo` passes
   the file's own data from `HomeScreen`. The header is its own file (`HomeHeader.tsx`). "Add story" card:
   `addStory.ts` (the live tile's rules). `CategoryHomeView` has no caller now (step 6 decides, D-6).
   - The new home has no request-time part, so Next stopped on the Redis metadata ("uncached data in
     `generateMetadata()`"). Fixed with an empty `connection()` part in a Suspense (`RequestTime`): the page
     behaves as before. Test seen red, then green: "keeps one request-time part, so the metadata may read
     Redis" (`tests/components/DemoApp1/AppHomeView.test.tsx`).
   - The live home had **no `h1`**, though D-42 says one "must stay". Closed by S7-12 (a hidden `h1`).
3. **Done (not committed):** the search page `/[lang]/search` (`app/(client)/[lang]/search/page.tsx` →
   `AppSearch`). The old search is split, unchanged: state and logic in `components/Home/Search/useSearch.ts`,
   results body in `SearchResults.tsx`; `SearchIcon` keeps only its overlay (its 85 old tests pass). The header
   is `SearchHeader.tsx`, shared with `/demo`. Voice and Scan are the old voice and image search with the design's
   marks (new optional `icon` / `label` props). Only "For you" (S7-6). `noindex` and `instant = false`, as the
   cart page. `DetectScreen` names `/[lang]/search` `SEARCH_SCREEN` (an old name; the overlay reported the home
   screen). Tests seen red, then green: the two `DetectScreen` search cases (`tests/utils/tinyUtils.test.ts`).
   - Found and fixed: on `/sy-ar/search` the results body made a hydration error (its client `translateFunction`
     answers English on the server). It is now drawn only in the browser, with a skeleton in the HTML. Test seen
     red, then green: "draws the results body only in the browser…" (`tests/components/DemoApp1/AppSearch.test.tsx`).
4. **Done (not committed):** the Search tab goes to `/[lang]/search` from every page and is lit there. Tests seen red,
   then green: the 3 search cases of `AppShell.test.tsx` and "lights search on the search page"
   (`appRoutes.test.ts`). The store's `openSearchRequest` mechanism has no sender now (step 6 removes it).
5. **Done (not committed):** RTL of the home and search screens (A-13, A-15). Every x is from the start edge
   (`insetInlineStart`, `marginInlineStart`, logical corner radii); a card's contents centre in a box from the start
   edge instead of `left` + `translateX(-50%)`; both sliders run right to left in `ar` / `ku` (Embla `direction`),
   so a swipe works the other way, and the hint moves the other way too. Checked in the browser at 440 x 802.
6. **Done (not committed):** old code removal (D-6, owner's OK on 2026-11-04: "delete all listed"). Deleted, each with
   no caller left: `CategoryHomeView`, the old stories bar (`StoriesBarClient`, `AddStory`, `StoriesWrapper`,
   `StoryElement`, `Story`, `StoryCard`, `StoryAvatar`, `StoriesSkeleton`), the old category bar (`MainCategories`,
   `Server/Navbar`, `CategoryNavMobile`, `MobileNavigation` skeleton), the old search box (`SearchIcon`, the store's
   `openSearchRequest` / `handledSearchRequest`), the old boutiques section (`BoutiquesListWrapper`,
   `OfferListServer`, `InfinteScroll`, `BoutiqueWrapper`, `BoutiqueElement`, `OfferList` skeleton,
   `GetNextBoutiques`), `HomeLoader` and its `is_home` branch, and their tests. Kept (S7-1): featured, flash deals,
   recommended. `FullHomeLoader` is redrawn in the new home's shape. The package `embla-carousel-auto-height` may have
   no user left (only `BoutiqueElement` used it); `package.json` is not changed.
7. **Done (2026-11-04):** the hidden `h1` (S7-12). Seen in the browser: "Trydos" on `/sy-en`, "تريدوس" on `/sy-ar`,
   "WOMEN" on `/sy-en/categories/women-7`. No new test (owner's order, see below).
8. **Done (2026-11-04):** the XD check at 440 x 802. `/sy-en` against `/sy-en/demo`: the same header, stories row,
   "Brand Stores" block and cards; the differences are data only (staging story photos, small square boutique icons
   in the 20 px logo band as S7-11 says, no chip picked as S7-8 says). `/sy-ar` mirrors all of it. `/sy-en/search`
   and `/sy-ar/search`: the header matches the file and mirrors.
   - Found and fixed: on `/sy-ar/search` the old results body read left to right. It mirrors itself by hand
     (`isRtl` → `flex-row-reverse`), and inside the new page's `dir="rtl"` it was mirrored twice. `AppSearch` now
     gives it its own `dir="ltr"` box, so it looks as it did on the old pages. Seen right in the browser after the
     fix. No red-first test (owner's order).
   - Not changed (old code, as before Stage 7): the search "Reset" button has a fixed 64 px width (`w-16`), so the
     Arabic "إعادة تعيين" breaks into 2 lines.
9. **Done (2026-11-04):** committed (`7ffb46e2`), pushed, and the full unit suite run in CI
   ([run 41877993877](https://github.com/AlaaAsaad57/Trydos/actions/runs/41877993877)). Parity, lint and the type
   check pass. Unit: 665 files pass, 2 fail, with 3 tests, none from Stage 7 (Stage 7 changes no chat file). All
   three come from commit `2f42f4e7` on `development`:
   - `tests/components/Chat/pages/ChatLists.test.tsx`: the 2 known cases (see Stage 8).
   - `tests/components/Chat/components/ChatListSearch.test.tsx`: "filters the list at once and searches contacts
     after half a second". `2f42f4e7` removed the `SearchContact` call from `ChatListSearch.tsx`, so the test waits
     for a call that no longer exists. The test is out of date, not the app. For lane B (chat) or Stage 8.
   - The `compare.test.tsx` case seen red in the stopped local run passes in CI (a random failure).
10. Left: the owner's review, then the merge into `ui-migrations` (owner's answer on 2026-11-04: stop after CI for
   the review).

### Where Stage 7 stopped (2026-11-04)

- **Owner's order, 2026-11-04 (relayed by session trydos-4f, confirmed by the owner in this lane the same day):** no new unit tests and no local test runs for the
  rest of Stage 7 and for Stages 7b and 7c (the laptop is low on memory). A broken existing test is only listed
  here; the full unit suite runs later in CI. Tests already written stay.
- Before that order: `next typegen` + `tsc` clean; `pnpm lint` 0 errors (no warning in a Stage 7 file);
  `pnpm lint:i18n-parity` OK (2813 keys); the unit tests of every changed file passed.
- A wide local run (most of `tests/`) was stopped by that order part way. Red before it stopped, none in a Stage 7
  file:
  - `tests/components/Chat/pages/ChatLists.test.tsx`: "shows the existing chat, not a new one, when only the contact
    name matches" and "still offers a new chat for a contact who has no chat yet" (known: commit `2f42f4e7` on
    `development`, see Stage 8).
  - `tests/components/global/compare.test.tsx`: "loads both products named in the address and puts them side by
    side" (not looked at; the compare page is not touched by Stage 7; may be the suite's usual random failure).

### Live parts to keep or replace (after D-41..D-44)
- Home: metadata (`GetHomeMetaData`), structured data, featured row, flash deals, boutiques, recommended,
  stories bar, `?coupon=` handling.
- Cache: `"use cache"` + `cacheLife("homepage")`, tags `categories-/featured-/flash-/boutiques-{country}-{language}`.
  Read `docs/homepage-cache-phase-2*.md` first.
- Search: history (localStorage `search-history`), trending (`/api/products/popular-search`), suggestions,
  results (products, brands, categories, boutiques), Gemini analyzer, `logSearchTerm`, voice, image search,
  filters (`/${lang}/filters...`).
- SEO: `robots.ts`, sitemaps (`sitemap-home`, `-search`, `-products`, `-boutiques`, `-static`).

### Mocks to remove
Fixed chips (`HomeScreen.tsx` line 31, `SearchScreen.tsx` line 161), empty home body (line 127), the search
input searches nothing (line 145), Voice and Scan have no action (lines 214, 222).

### Events to keep
`search` (`search_keyword`, `search_item_select`), `screen_view_event`, `view_story`, `view_item_list`,
`apply_filter`, `recommended`, `button_clicked`, `coupon_viewed`.

### Tests to update
- **e2e:** `nav.logo` (`NavLogo`) is checked by `gotoHome` (45 calls in 14 files) and `gotoAbout` (40 calls in
  16 files), so almost every case passes through it. Also `searchFor` (`searchIcon_mainPage`,
  `#search-element`, `product-result-link`), `category-Link`, GUEST-42/47/48/49, STORY-*, the guest cart
  drawer (`cart_icon_button`).
- **Unit:** `tests/app/layout.test.tsx`, `tests/components/Home/*` (CategoryHomeView, NavbarClient, AuthNav*,
  Logo, Menu, Init, stories*), `Home/Search/*`, `Server/MainCategories`, `cache/*`, `serverRequests/meta/home`,
  `serverRequests/Search`.

---

## Stage 7b — store page for every product listing (added on 2026-11-04, A-31, A-32)

**New:** `components/DemoApp1/screens/ListingScreen.tsx` (XD `Home Page – 47`), `ListingColorSheet.tsx`
(`– 54`), `ListingParts.tsx`. **Demo route:** `/[lang]/demo/store/<slug>`.
**Live:** `app/(client)/[lang]/filters/[[...filters]]/page.tsx` → `components/Listing/FiltersPageContent.tsx`;
also `/flashDeals/[[...filters]]`, `/featured/[[...filters]]` and the search result pages.
**Data today:** mock stores and products (`components/DemoApp/demoStores.ts`, `demoProduct.ts`).

### Live code to link (design block → live code)
| Design block | Live code |
|---|---|
| Header: back, store logo | `FilterListingBackButton`, `BoutiqueMiniLogo`, `BoutiqueLogoCollapse`, `ListingHeaderCollapse` |
| Header marks: search, sort, filter, share | `ListingSearchContainer`, `ListingSortControl`, `FilterWidgetServer` + `FilterListContainer` (old filter UI, A-4), `ListingShareControl` |
| Banner ("Shop … Collection Now !") | The boutique of the page; on a page with no boutique (category, brand, filter, search): no banner until D-46 is answered |
| Category slider | `ListingBoutiqueSlider` (the boutique's categories) |
| Product cards, colour picker, colour sheet | `ProductListConainer` (Elasticsearch `getProductsAndFiltersFromElastic`, paging), card colours (`colorImageGroups`) |
| Card add button | Follows D-45 (the "add to cart" bar), not before |

### Must keep
- SEO: `generateMetadataForListing`, `ListingBreadcrumbList` JSON-LD, `buildSearchRedirectTarget` redirects,
  the sitemaps of boutiques and search.
- The listing's price sort rule (see `listing-price-sort-mismatch`: the sort uses the root price, the card
  shows the country price; no fix in this stage).
- Old-only pieces with no design (the filter sheet itself, sort options) stay old UI (A-4).

### RTL (A-13, A-14, A-15)
The store page was built on `development` with no RTL. Convert its physical styles, mirror the back mark, and
mirror the category slider and the card rows.

### Mocks to remove
`demoStores.ts` / `demoProduct.ts` in shipping code (A-16), the fixed store list, the fixed colours, "the
sort, filter and share marks do nothing yet" (`ListingScreen.tsx` lines 85-86).

### Events to keep
`view_item_list`, `apply_filter`, `search`, `share_content`, `like_item`.

### Tests to update
- **e2e:** `actions/listing.ts`, `guest.live.spec.ts` (listing cases), `compare.live.spec.ts`,
  `wishlist-signed-in.live.spec.ts`, `selectors.ts`.
- **Unit:** `tests/components/Listing/*`, `tests/components/products/ProductCard`.

---

## Stage 7c — product page (added on 2026-11-04, A-31, A-33)

**New:** `components/DemoApp1/screens/ProductScreen.tsx` (XD `Home Page – 49`), `LikeHeart.tsx`.
**Demo route:** `/[lang]/demo/store/<slug>/<product>`.
**Live:** `app/(client)/[lang]/products/[productId]/page.tsx` → `components/Product/ProductPageContent.tsx`;
also the quick view `app/(client)/[lang]/@modal/(.)products/[productId]`. The URL `/products/<slug>` stays.

### Live parts (A-33: a part with no design block is hidden, its code is kept)
| Design block | Live part |
|---|---|
| Gallery, video card | `ProductPhotoSliderWrapper`, `ProductVideosWrapper` |
| Logo, name, heart, text | `ProductNameAndBrand`, `LikeButtton`, `ProductDetailsTextWrapper` |
| Rating row, recommend / size votes | `ProductRating`, `ProductSizeReviews` |
| Price and shipping pills | `ProductPricesWrapper`, `FreeShippingOption`, `FreeReturnBadge`, `ProductExpectedDeleiveryWrapper` |
| Colours | `ProductColorsWrapper` |
| "Product information" | `ProductGeneralPropertiesWrapper`, `ProductFeaturesWrapper`, `ProductDescriptorsWrapper` — check at stage start which of them the list shows |
| Reviews | `ProductBuyersCommentsWrapper` |
| Questions | `ProductFaqSectionWrapper` |
| "Start Chat about this product" | the chat with the seller (Stage 6) |
| No block (hidden, code kept) | `ProductStoriesWrapper`, `RelatedProductsSection`, `ProductExtendedSliderWrapper`, try-on, compare, share options |
| Size choice, "add to cart" | Waits for D-45 |

The mapping above is from a code read on 2026-11-04. Check each row against the board at stage start, and ask
the owner about any row that does not fit.

### Must keep
- SEO: `generateMetadata` in the page, and the product JSON-LD (`ProductStructuredData`). **The JSON-LD is
  rendered inside `ProductFooter` today**, so it must move out before the old footer stops showing.
- The quick view (`@modal`) and the hard-navigation page must show the same screen.
- The redirect of an old slug (a real 307, see `next16-streaming-metadata-redirect`).

### RTL (A-13, A-14, A-15)
Built with no RTL on `development`: convert physical styles, mirror the back mark, the gallery and the rows
that scroll sideways.

### Mocks to remove
`demoProduct.ts` and the fixed reviews, questions, votes and shipping dates in `ProductScreen.tsx` (A-16).

### Events to keep
`view_item`, `view_time_product`, `view_image`, `zoom_image`, `view_comments`, `read_more_about_product`,
`like_item`, `add_product_to_favorites`, `change_color`, `view_story` (hidden part: keep the code),
and after D-45: `change_size`, `add_to_cart`.

### Tests to update
- **e2e:** `actions/productComments.ts`, `actions/productRating.ts`, `actions/qaProduct.ts`,
  `comments.live.spec.ts`, `orderRating.live.spec.ts`, `qaLock.live.spec.ts`, the buy flow (BUY-01, after
  D-45), `selectors.ts`.
- **Unit:** `tests/components/Product/*`, `tests/components/products/*`, `tests/components/Server/product/*`.
  A test of a hidden part stays (its code stays, A-33).

---

## Stage 8 — regression, sign-off, merge

1. Run every suite: `pnpm lint`, `pnpm lint:i18n-parity`, typecheck, `pnpm test:run`, `pnpm e2e:health`, then
   the full browser suite (`gh workflow run E2E --ref ui-migrations`, one run at a time).
   **The e2e work of every stage happens here (A-34):** update the specs, helpers and `selectors.ts` for the
   new UI (each stage's "Tests to update → e2e" list), then make the suite green. Known red on 2026-11-04
   (run 41824914664, `ui-migrations-shell` at `df14944b`), with what is known:
   - AUTH-01: the wallet backend answers `502` (A-17).
   - AUTH-03, PROF-08, BUY-05: no logout until Stage 4 (S3-11).
   - CHAT-02: commit `2f42f4e7` on `development` (2026-10-31) removed the contact search call from
     `ChatListSearch.tsx`, so a phone search never reaches the chat backend. The same change turns 3 chat unit
     tests red (`ChatListSearch`, `ChatLists`). Ask the owner if the removal was meant.
   - BUY-03: a fresh checkout still shows the old address title after an edit. Cause not found yet (passed on
     `main` 2026-10-30; the cart moved to `/[lang]/cart` in Stage 3).
   - BUY-01, ORD-01: the new bar covered the order menu sheets. Fixed in Stage 3 (bar room on the sheets).
2. Check every old page that keeps the old UI: cart, checkout, orders, seller pages, seller dashboard,
   compare, about, terms, privacy, contact. (Product, listing, filters, flash deals and featured moved to the
   new design in Stages 7b and 7c.)
3. Designer pass on every new screen in `en` and `ar`, at 440 x 802 and on desktop.
4. Check `docs/posthog-events.md` against the events in code.
5. Merge into `development` (after D-1), only with your OK.

---

## Found on the way — not part of this work (each needs its own ticket)

1. **Two wallet balances can differ.** `order.GetWallet()` returns `response.data`, which has no `data`, so
   the wallet page shows `wallet_balance` from the core list, while the settings card shows the wallet
   backend balance. Seen in code only; not confirmed by a test.
2. **`/api/auth/wallet-token` sends the raw wallet token to the browser.** It was for the RDB widget, which is
   now commented out.
3. **`CLAUDE.md` security note is out of date.** The `rdb` Git dependency (with the token in its URL) is no
   longer in `package.json` (commit `091fdaae`). The old token should still be rotated, because it is in git
   history.
4. **Naming rule:** `services/qrLogin/index.ts` line 4 says "Go endpoints", and the title of
   `docs/qr-login-backend-requirements.md` names the backend language.
5. **`/[lang]/loginDemo` has no `noindex`**, but `/demo` has one.
6. **`app/loginDemo/page.tsx` redirects to `/gb-en/loginDemo`**, which opens the region modal.
7. **The brand name has duplicate keys with different spellings.** In all three translation files `Trydos` and
   `TryDos` are each written twice, without quotes (for example `translations.ar.js` lines 1139, 1213, 1219,
   1263). In Arabic `TryDos` is once ترايدوس and once تريدوس; the last one wins, so the first is dead. Found
   while adding the terms line's key in Stage 2 (A-29); nothing was changed.
8. **The category page breaks a Next rule on every load.** `/[lang]/categories/<slug>` awaits `params` outside a
   Suspense, and the dev server reports "Next.js encountered runtime data during prerendering or a navigation".
   Seen on 2026-11-04 with the old view too (`CategoryHomeView`), so Stage 7 did not cause it. Found in Stage 7
   (lane C); nothing was changed.
9. **One boutique on staging has a doubled icon path.** Its `icon` already holds a media path, so the address
   comes out as `.../boutiques/icon//image/upload/boutiques/boutiques/icon/...` and answers `404`. The live store
   page builds the address the same way (`BoutiqueMiniLogo`, `GetImageUrl(boutique.icon)`), so it is the data,
   not the new home. Found in Stage 7 (lane C); nothing was changed.
