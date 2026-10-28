# UI migration plan — demo UI becomes the real app

**Status:** Stage 0 (decisions) and Stage 1 (foundation) done on 2026-10-28. Next: Stage 2 (login).
**Still open:** D-24 ("Web" / "lock" switches: designer / product), D-30 (place levels: backend). Neither
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
| A-6 | Stage order | Two lanes after Stage 1 (changed on 2026-10-28). Stage 1 finishes first. Then lane A runs 3 → 4 → 5 → 7 and lane B runs 2 → 6, at the same time. Stage 8 starts when both lanes are done. See "Lanes" under "Stages". |
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
| D-1 | Merge | Once, at the end (after Stage 8). Every stage stays on `ui-migrations`. |
| D-2 | Desktop | The 500 px centred column is OK on desktop. No desktop design work. |
| D-3 | RTL | Mirror everything for `ar` / `ku`: layout, slide direction, tab order, margins. |
| D-4 | English case | Keep Title Case for all English, new screens included. |
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
| D-24 | "Web" / "lock" switches | **Still open.** Until answered they follow A-8: shown, no effect. |
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
| 8 | 1 | Full regression, designer sign-off, merge | Last check before `development`. |

Each stage ends with: `pnpm lint`, `pnpm lint:i18n-parity`, typecheck, `pnpm test:run`, the e2e specs of
that stage, a check against the XD boards in `ar` and `en` at 440 x 802, and your review. Nothing is
committed or merged without your OK.

### Lanes (A-6)

| Lane | Stages | Why |
|---|---|---|
| A | 3 → 4 → 5 → 7 | Profile, wallet and home need the shell and the real routes from Stage 3. Stages 4 and 5 do not overlap, because both change `WalletLinkCard` and the wallet balance on the profile. Stage 7 has the highest risk, so it comes last. |
| B | 2 → 6 | Login is independent of the shell. Chat uses its own files (`components/DemoApp1/chat/*`, `store/chat/*`, `services/chat.ts`), and it is the biggest stage. |

Rules for the two lanes:
- Neither lane starts before Stage 1 is done. Stage 1's RTL base and data pattern (steps 2 and 7) are the
  base of every later stage.
- Each lane works in its own folder (`git worktree`) on its own branch, cut from `ui-migrations` and merged
  back into `ui-migrations`. Two sessions never share one folder. D-1 does not change: only `ui-migrations`
  merges into `development`, once.
- E2E runs one at a time. `test-e2e.yml` uses one global `live-suite` group, and both lanes use the same
  shopper account. A lane waits for the other lane's run to finish.
- Shared files will conflict on merge: the three `translations.*.js` files, `components/DemoApp/demoKeys.ts`,
  `tests/e2e/selectors.ts`, `components/DemoApp1/ui.tsx` and this plan. Merge a lane back into
  `ui-migrations` after each stage, not at the end of the lane.

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
`UserNavTopSection.tsx`, `AuthNavSection.tsx`, `AddStory.tsx`, `LikeButtton.tsx`, `ProductLikeButton.tsx`,
`setting/orders/index.tsx`, `setting/profile/index.tsx`, `PersonalInfoForm.tsx` (2), `VerifyUser.tsx`,
`WalletLinkCard.tsx`, `UploadProfilePhoto.tsx` (2). Plus every `setShouldAuthinticated(...)` caller.

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

---

## Stage 4 — profile / settings

**New:** `components/DemoApp1/screens/` ProfileScreen, ProfileMenuScreen, PhotoScreen, ClientIdScreen,
ClientInfoScreen, PersonalInfoScreen, BodyScreen, AddressListScreen, AddressFormScreen.
**Data today:** all from `DEMO_PROFILE` (`components/DemoApp/DemoData.tsx` lines 51-67), `demoPlaces.ts`,
a static map picture and a static QR picture.

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

## Stage 8 — regression, sign-off, merge

1. Run every suite: `pnpm lint`, `pnpm lint:i18n-parity`, typecheck, `pnpm test:run`, `pnpm e2e:health`, then
   the full browser suite (`gh workflow run E2E --ref ui-migrations`, one run at a time).
2. Check every old page that keeps the old UI: product, listing, filters, cart, checkout, orders, seller
   pages, seller dashboard, compare, flash deals, featured, about, terms, privacy, contact.
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
