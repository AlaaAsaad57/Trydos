---
ticket: ui-migrations-7e-start-flow
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-11-28
links:
  clickup:
  github:
---

# Research — ui-migrations-7e-start-flow

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the `/demo` start flow (start animation → country picker → Quick Preview →
Get Started) and the guest sign-in request sheet work in the real app, with real
data and real actions. The new flow replaces `utils/PopupCountry.tsx` where that
popup shows now (plan Stage 7e, Steps 4 and 5). Base: `ui-migrations` at
`a4e31b857`.

## Relevant directories

### The old country popup (to be replaced)

- `components/Home/Init.tsx` (239 lines) — mounted once in `app/(client)/[lang]/layout.tsx:293`,
  inside `<Suspense fallback={null}>`. It owns:
  - `shouldShowBluredInfo()` (lines 80-123): true when the URL locale has `gb-`, or
    the query has `changed-country` or `no-country`. It also cleans `cart`, `_bypass`
    and `_t` from the URL with `history.replaceState`.
  - `getCountries()` (lines 61-78): `sessionStorage` key `countries-<country>-<lang>`,
    then the server action `GetCountries` (`serverRequests/product.ts:127`, core
    `GET /countries`, cached in Redis). A failure sets `countriesFailed` (A2-21).
  - The render (lines 213-224): `<PopupCountry forChanged noCountry loadFailed onRetry countries options />`,
    loaded with `next/dynamic` (`ssr: false`, loader `SheetSkeleton`).
  - `initPageLoad` (line 183) also calls `shouldShowBluredInfo()`: it skips
    `AllowNotifications` while the popup shows. That use must stay or move.
- `utils/PopupCountry.tsx` (531 lines) — the popup. Two cases:
  - **`changed-country`** (`?changed-country=<new>,<old>`): a message "You previously
    visited from X but now accessing from Y" and two buttons (new country, old
    country). A tap runs `UpdateUrl`: it sets `country`, `lang`, `language` cookies
    (3 ways, then `setLocaizationCookies`), waits 300 ms, then
    `window.location.replace(<same path with the new locale>?_bypass=popup-selection)`.
  - **`no-country`** (or a `gb-` URL): it renders `PersonalInfoCountries` with
    `hideTopBar`.
  - It sends **no analytics event** (no `GAevent`, no PostHog call). The plan's
    "keep its events" therefore keeps nothing.
- `components/settings/PersonalInfoCountries.tsx` (442 lines) — also the settings page
  `app/(client)/[lang]/settings/countries/page.tsx`, so it stays. With `hideTopBar`,
  a tap on a country runs `changeCountry` at once (no confirm modal):
  `setLocaizationCookies(iso, language)`, then `GET STARTER_SETTINGS` (market) →
  `normaliseStartingSettings` → `sessionStorage.starttingSetting` + `setSettings`, then
  `window.location.href = <path with /gb-<lang> replaced by /<iso>-<lang>>`.
  `BecomeSellerModal.tsx:464` only copies its list logic in a comment.
- `proxy.ts` (protected path; read only) decides where the popup shows:
  - A new visitor with no saved locale goes to the Geo-IP country when it is one
    of the supported countries (lines 629-652). **Only** a visitor from another
    country gets the fallback `/gb-<lang>?no-country=true` (lines 654-663). So a new
    visitor from Syria never sees the popup today.
  - A saved country that differs from the URL country gives
    `?changed-country=<url>,<cookie>` (lines 579-590).
  - `?_bypass=popup-selection` on a supported locale saves the locale cookies and
    removes the flags (lines 474-492). The popup's URL move depends on it.
  - Bots (`isBot`, lines 68-88) on a supported locale pass straight through
    (lines 371-374). `gb` is supported (`getAllSupportedCountries` adds it, line 96),
    so a bot can render `/gb-en/...`.

### The `/demo` start flow and sign-in sheet (the design source, S7e-1)

- `components/DemoApp1/Demo1Shell.tsx` (565 lines) — the order of the start
  (comment at lines 113-138) and its state:
  - `introRun = { done, asked }` (module level, line 155): once per page load.
  - `signing` starts at `"country-picker"` when `intro` is on (line 234); the login
    is a fixed layer over the page (`NewLoginWidget`, lines 547-552), and the
    screen of the URL waits under it as a white `IntroBlank` (lines 560-564).
  - `endLogin` / `endIntro` (lines 300-313): "Later" or the login's end; the app
    fades in (`THROUGH`) and `planAsk()` starts.
  - `planAsk` (lines 249-263): `SIGN_IN_ASK_MS = 5000`, then it checks every
    `SIGN_IN_RETRY_MS = 1000` and waits while `anyLayerOpen()` (a sheet lock count
    in `components/DemoApp1/ui.tsx:174`) or while an `input`, `textarea` or
    `[contenteditable]` has focus.
  - `SignInRequestSheet` "Get Started" sets `signing = "get-started"`: the same
    login layer, no route change (lines 534-541).
  - After a login layer closes, the shell puts back `<body>`'s colour and removes
    `--xd-unit` that `AppScaler` changed (lines 280-297). A real host needs the same.
- `NewLoginDesign/NewLoginWidget.tsx` (851 lines) — **already the real login** of
  Stage 2 (send code, verify, 3-wrong-codes lock, resend, name, events). It has the
  host props the real flow needs:
  - `initialStep` (`'country-picker'` is a step, line 50);
  - `onFinish` (line 154): called instead of leaving the page;
  - `countryPicker(onPicked)` (line 166): the host draws the picker and calls
    `onPicked` → `goTo('quick-preview')` (line 662).
  - `handleLater` and `handleClose` both call `leave()` → `onFinish` (lines 260-302).
  - After a code is accepted, `refreshAfterAuth` runs `router.refresh()` (line 325).
- `components/DemoApp1/screens/CountryPickerBody.tsx` (266 lines) — map + 4 rows.
  - The countries are **fixed**: `COUNTRIES` from `components/DemoApp/demoPlaces.ts:30`
    (`tr`, `sy`, `iq`, `lb`) and `MAP_ORDER` (line 63). The type is `DemoCountry`
    from `components/DemoApp/DemoData.tsx:18`.
  - The map is `public/assets/demo/xd/countryMap.svg`, with exactly 4 paths:
    `sy`, `lb`, `iq`, `tr`.
  - A pick: fill motion (0.7 s), then `onDone(id)` after `HOLD_MS = 1000`.
  - Words via `useDemoNav().t` (`"Select Your Region"`, each country name).
- `components/DemoApp1/screens/CountryRow.tsx` (61 lines) — no data import except
  the `Country` type from `demoPlaces.ts`. The real `AddressFormScreen` and
  `DeliveryMethodSheet` already use it.
- `components/DemoApp1/screens/SignInRequestSheet.tsx` (196 lines) and
  `SignInSlides.tsx` (244 lines) — props `open`, `onClose`, `onStart`. Words via
  `useDemoNav().t`. "More Info" is a `<a>` mark inside one translation key
  (`Rich ... keepLinks`) and has **no action** on `/demo`. No `/demo` data file is
  imported (S7e-6 is met for these two files).
- `NewLoginDesign/QuickPreviewScreen.tsx` (762 lines, `picker` prop) and
  `NewLoginDesign/previewSlides.tsx` (90 lines, translation keys only).

### The real app around it

- `components/DemoApp1/screenNav.ts` — `useDemoNav()` **throws** outside a screen
  shell. `NavCtx` is given only by `Demo1Shell` and `ScreenMount` (new-screen
  paths). The start flow and the sheet must also show on old pages and on the
  new pages (home, listing, product, search), where there is no `NavCtx`. The new
  pages pass their own `dictionary` prop from the server page instead.
- `components/DemoApp1/AppShell.tsx` (162 lines) — the real bottom bar, in the
  `[lang]` layout. It already knows: a guest by `isValidPhone(userProfile.phone)`
  (line 135, `utils/phone.ts:10`); when an old overlay covers the screen
  (`loginOpen`, `shouldAuthinticated`, a story, add story, a call, the pay frame,
  lines 60-80); and `shellStepsAside(pathname)` for `/demo`, `/loginDemo`, `/login`.
  Its words come from a small server dictionary (layout lines 302-311).
- `utils/loginPath.ts` — `loginHref(lang, next)` and `safeReturnPath` (D-11, A-20).
- `components/Home/AuthSections.tsx` — `setLoginOpen(true)` from any opener now
  goes to `/[lang]/login`.
- `components/Home/NavbarClient.tsx:56-70` — the one-scaled-canvas rule:
  `AppScaler` (`scaling/AppScaler.tsx`) can have only one instance. The session
  expired widget and `ConfirmMobilePhoneWidget` are gated there.
- `utils/cookies/cookie-manager.ts:265` — `setLocaizationCookies` (client, non-HttpOnly).

## Relevant config files

- `app/(client)/[lang]/layout.tsx` — mounts `Init`, `AppShell`, `NavbarClient`, `AppScreens`.
- `proxy.ts` — protected; this ticket must not change it (read only above).
- `public/translations/translations.{ar,tr,ku}.js` — words for the new strings.
- `components/DemoApp/demoKeys.ts` — the `/demo` dictionary keys.
- `next.config.ts` — protected; no need found to change it.

## Possibly affected services

- **core** backend — `GET /countries` (through `GetCountries`, Redis cache). Staging
  returned 4 countries on 2026-11-28 (one read with `country: sy`, `lang: en`):
  `IQ` (103), `LB` (119), `SY` (208), `TR` (219), fields `id, phonecode, iso, name,
  longitude, latitude, nicename`. These match the 4 map paths.
- **market** backend (gateway or core, read `x-market-backend`) — `STARTER_SETTINGS`
  after a pick.
- **auth** — the login steps of `NewLoginWidget` (unchanged).
- Analytics — `screen_view`, `later_take_look_clicked`, login / sign-up events are
  sent by `NewLoginWidget`; no event exists for the country pick.

## Test / validation commands available

Not run here (research is read-only).

- `pnpm lint` — ESLint, and the i18n rule: a key missing from `ar`/`tr`/`ku` is an error.
- `pnpm lint:i18n-parity` — the three translation files stay key-parallel.
- `pnpm next typegen && pnpm tsc --noEmit` — typecheck (`tsc` needs `typegen` first).
- `pnpm build` — production build (also the place for the speed numbers, S7e-9).
- `pnpm test:run` — unit suite. **Plan rule of 2026-11-04: no local Vitest runs;**
  run the full suite in CI with `gh workflow run Tests --ref <branch>`.
- `C:\Users\DELL\xd-parity\perf\s7e-speed.cjs` — part 1's speed script (JS bytes by
  the load event, first paint; 4x CPU; median of 5). `s7e-splash.cjs`,
  `s7e-demoflow.cjs`, `s7e-diff.py` — part 1's splash, flow and pixel tools.

### Test layout and naming

- Unit tests live in `tests/`, mirroring the source path: `tests/utils/PopupCountry.test.tsx`,
  `tests/components/Home/Init.test.tsx`, `tests/components/DemoApp1/SignInRequestSheet.test.tsx`.
  Name: `<Source>.test.ts(x)`. Runner: Vitest (`vitest.config.*`, jsdom). Render
  helper: `tests/render.tsx` (`renderWithProviders`). Expected-failure marker: `it.fails(...)`.
- Browser tests: `tests/e2e/*.live.spec.ts`, Playwright against staging. A-34: e2e is
  ignored in every stage; Stage 8 edits the suite once.

### Existing tests that cover the touched code

| Test | Covers | Likely effect of this ticket |
|---|---|---|
| `tests/utils/PopupCountry.test.tsx` | the old popup | goes when the popup goes (D-6) |
| `tests/components/Home/Init.test.tsx` | `Init` and when the popup shows | stale where it asserts on `PopupCountry` |
| `tests/components/NewLoginWidget.test.tsx`, `NewLoginWidgetReducedMotion.test.tsx` | the login widget | must stay green |
| `tests/components/QuickPreviewScreen.test.tsx` | the `picker` prop | must stay green |
| `tests/components/DemoApp1/SignInRequestSheet.test.tsx`, `SignInSlides.test.tsx` | the sheet | stale only if the sheet's word source changes |
| `tests/components/DemoApp1/Demo1Shell.test.tsx` | `/demo` start | 9 old reds (part 1); must not grow |
| `tests/components/settings/PersonalInfoCountries.test.tsx` | settings countries page | must stay green |
| `tests/app/smallRoutes.test.tsx` | `loginDemo` / login routes | must stay green |
| `tests/e2e/locale.live.spec.ts`, `selectors.ts`, `actions/nav.ts`, `actions/auth.ts` | `data-pw="country-popup"`, `country-retry`, `personal-info-countries-*` | stale in Stage 8 (A-34) |

## Risks and unknowns

- **A pick changes the URL locale, so the page reloads.** `PopupCountry` and
  `PersonalInfoCountries` both end with a full page load. On `/demo` a pick goes on
  to the Quick Preview with no reload. If the real pick reloads at once, the Quick
  Preview and Get Started never show. — high impact, certain. See OQ-1.
- **Bots see the popup today.** No client code checks for a bot; a crawler on
  `/gb-en/...` runs `Init` and gets the popup. The plan says bots never see the new
  flow. — medium impact. See OQ-3.
- **The fixed 4-country map.** The map file has 4 paths. If the backend list grows,
  a new country has a row but no shape on the map. — low now (staging = the same
  4), grows later. See OQ-4.
- **`useDemoNav` throws outside a screen shell.** The picker and the sheet read words
  from it. They show on old pages too, so they need another word source. Words sent
  from the layout cost bytes on every page (S7e-9). — medium. See OQ-5.
- **One scaled canvas only.** `NewLoginWidget` mounts `<Page variant="scaled">`. If it
  opens while the session-expired widget or `ConfirmMobilePhoneWidget` is open, two
  `AppScaler` instances fight (duplicate ids, `:root` vars). — medium. See OQ-6.
- **Bundle cost on every page (S7e-9).** `NewLoginWidget` + the splash fix + the map
  are large. They must load only when the flow or the sheet opens. The sheet must
  be planned on every guest page load, so its timer code is on every page; the sheet
  body itself can load late. — medium.
- **Home with the popup flag hung on the deployed `ui-migrations` build (2026-11-08).**
  `/gb-en`, `/gb-ar` and `/sy-en?no-country=true` never finished sending, so the popup
  never mounted. `CoverBox` (`components/global/PageCover.tsx:98`) threw `window is not
  defined` on the server; the link to the hang was not proven, and no guard is in the
  file now. The new flow shows on exactly these addresses. — high if still true. See OQ-7.
- **`changed-country` has no board.** The old popup offers two countries there; the
  design picker shows all four. — medium. See OQ-2.
- **`PersonalInfoCountries` with `hideTopBar` only replaces `/gb-<lang>`.** On
  `/sy-en?no-country=true` the path does not change, so the page reloads on the same
  address with the flag. The proxy then shows the popup again. This is a bug that
  already exists. — low; the new flow should not copy it. See OQ-8.
- **"More Info" has no action** in the sheet. — low. See OQ-9.
- **`initPageLoad` in `Init` skips `AllowNotifications` while the popup shows.**
  The replacement must keep the same rule. — low.

## Open questions

| ID | Question | Why it matters |
|----|----------|----------------|
| OQ-1 | When does a real pick change the URL? (a) at the pick: cookies + starter settings + full load, then the flow goes on after the load; (b) cookies + starter settings at the pick, the URL move at the flow's end ("Later" or the login's end); (c) a soft `router.replace` to the new locale at the pick. | (a) loses the Quick Preview unless the flow survives a reload; (c) remounts the `[lang]` layout and the layer with it. Only (b) keeps the `/demo` order with no reload in the middle. |
| OQ-2 | On `?changed-country=<new>,<old>`, what does the picker show? The 4 rows with no mark, or the new country marked? Is the old "You previously visited from X" line kept? | The board has no such state; S7e-1 forbids inventing one; S7e-3 forbids losing a real case. |
| OQ-3 | How does the client know a bot? Copy the proxy's `isBot` list into a shared helper and test `navigator.userAgent`, or have the server pass a flag? | The plan says bots never see the flow, and today they do. A shared helper must not change `proxy.ts` (protected) unless the plan lists it. |
| OQ-4 | The backend list and the map: show only the countries that are both in the list and on the map, or all countries of the list (rows) with the map painting only the 4? What if the list fails? | Real data vs a fixed design; the load error and retry (A2-21) need a place in the new design. |
| OQ-5 | Where do the picker's and the sheet's words come from on a page with no `NavCtx`? A small layout dictionary (like `AppShell`), or the client `translateFunction`? | `useDemoNav` throws there; bytes on every page (S7e-9). |
| OQ-6 | How is the one-scaled-canvas rule kept when the login layer opens from the flow or the sheet? | Two `AppScaler` instances break the page. |
| OQ-7 | Does home with the popup flag still hang on a deployed `ui-migrations` build? If yes, is it in scope here? | The new flow shows on exactly these addresses; a hang means it never shows. |
| OQ-8 | Which locale does a pick go to from `/sy-en?no-country=true` (a non-`gb` URL with the flag)? | The old code reloads the same address; the new flow must reach `/<picked>-<lang>/` with the flags removed. |
| OQ-9 | What does "More Info" do in the real sheet: "Soon available" (S7e-3), or nothing as on `/demo`? | S7e-3 says an action with no backend says "Soon available". |
| OQ-10 | On which pages does the sign-in sheet come up? Every page under `[lang]` except `/login`, `/loginDemo`, `/demo`? Also checkout and the payment frame? | 5 s after "the page shows"; the old overlays (cart, chat, search, stories, a call) are not counted by `anyLayerOpen()`. |
| OQ-11 | Before the profile is known (no `userProfile` yet), is the shopper a guest? | The sheet must never show to a signed-in shopper; `isValidPhone` needs the profile. |
| OQ-12 | After the login from the sheet ends, does the page reload its data (`router.refresh()` already runs in `refreshAfterAuth`), and does the screen mount need the `<body>` colour and `--xd-unit` restore that `Demo1Shell` does? | A layer closes without a remount; the page must show the signed-in state and its own colours. |
| OQ-13 | Can `PopupCountry` and its test be deleted (D-6: nothing else uses it)? Only `Init.tsx` renders it; e2e selectors name it. | D-6 and A-34. |
| OQ-14 | Which pages get "before" speed numbers (S7e-9)? Proposed: `/sy-en` (no flow), `/gb-en` (flow), `/sy-en/about` (an old page, sheet only). | The measure must exist before the change. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- One read-only GET to the staging core `/countries` was made to see the real list.
