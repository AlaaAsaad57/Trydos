---
ticket: ui-migrations-7e-start-flow
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Plan — ui-migrations-7e-start-flow

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

`Init` keeps deciding when the old popup showed (`shouldShowBluredInfo`, the URL
clean-up, the country list read). It renders a new host, `AppStartFlow`, in place of
`PopupCountry`. The host wraps the real `NewLoginWidget` (already the Stage 2 login,
with `initialStep`, `onFinish` and `countryPicker` props) and feeds the `/demo`
`CountryPickerBody` real data. A pick saves the locale cookies and the flow goes on
with no reload. The flow's end does one full load to the picked country's address
(OQ-1 (b)). A second small host, `AppSignInAsk`, runs the `/demo` sheet timer on every
page with the real guest test and the real overlay states. It loads the sheet and the
login widget only when they are needed. The hang is a proven one-line server bug in
`CoverBox`; it is fixed at its source.

Why this and not a new route or a rewrite: the login widget and the picker already
exist and are approved. Only their data source and their host change (S7e-1), and
`Init` already owns every "when" rule of the old popup, so those rules move unchanged.

## Answers to the deferred questions (PL-12)

- **OQ-15 — the hang (proven 2026-11-28 on a local production build of the base).**
  `next start` of the part 1 build served `/sy-en` in 9 s with `</html>`, but
  `/gb-en` and `/sy-en?no-country=true` stopped at about 192 KB after 40 s with no
  `</html>`. The server log shows, for each flagged request,
  `ReferenceError: window is not defined` and then React's
  `Error: Aborted, errored or already flushed boundaries should not be flushed again`.
  The throwing function in `.next/server/chunks/ssr/_0aphjrzfp9qb2._.js` is
  `CoverBox` (`components/global/PageCover.tsx:98`). It reads `window.scrollY`,
  `window.innerHeight` and `document.body` during render. The chain is:
  1. `Init` renders `next/dynamic(PopupCountry, { ssr: false })`.
  2. That dynamic's `loading` is `SheetSkeleton`, and a `loading` part renders on the
     server as the Suspense fallback.
  3. `SheetSkeleton` renders `CoverBox`, which throws on the server.
  4. The throw inside a fallback hits the React streaming bug above, and the
     response never ends.
  The fix:
  - `CoverBox` returns `null` when there is no `document` (the server).
  - The new host's loader reads no browser value.
  No protected path is touched.
- **OQ-3 — bots.** New `utils/botAgent.ts`, `isCrawlerAgent(userAgent)`. It uses the
  proxy's crawler words minus `instagram`: the Instagram in-app browser is a real
  shopper, and it would never see the flow. `proxy.ts` is **not** changed; its own
  list stays for its locale rules. The check runs in an effect, in the browser, so
  the server HTML and the first client render are the same (no hydration mismatch).
  A crawler then gets no flow and no sheet. The page HTML under the flow is the
  normal server render.
- **OQ-5 — words.** The `[lang]` layout builds a small `introWords` dictionary on the
  server. It holds the intro keys of `demoKeys.ts`, "Soon available", the 4 design
  country names, and the retry words. English keeps `KEEP_CASE`, exactly as
  `screenWords` is built. Only `Init` gets it as a prop. The hosts give it to the
  `/demo` parts through `NavCtx` (`t` real; `navigate` / `back` are no-ops, and these
  parts never call them). The intro keys stay out of `screenWords` (no screen uses
  them), so nothing is sent twice. "Syria", "Iraq" and "Lebanon" are missing from
  all three translation files today (checked with `grep -F`). They are added to
  `ar`, `tr` and `ku`, which also fixes `/demo` in `ar`. A list country outside the
  design's 4 is named with `countryNameFromIso(iso, lang)`, as the old popup does.
- **OQ-6 — one scaled canvas.** A new store flag `loginLayerOpen`, next to
  `loginOpen` in the homepage slice. Each host sets it while its login layer is up.
  - `NavbarClient` does not mount the session-expired or phone-check widget while it
    is true.
  - `AppShell` counts it as "covered".
  - `AppSignInAsk` waits while `shouldAuthinticated` is set.
  - `loginOpen` itself is not used: `AuthSections` turns it into a move to
    `/[lang]/login`.
- **OQ-12 — after the sheet's login.** `NewLoginWidget` already runs
  `router.refresh()` and reloads the stories after a right code
  (`refreshAfterAuth`). On `onFinish`, `AppSignInAsk` closes the layer and puts the
  page back as `Demo1Shell` does: it removes `--xd-unit` from `<html>` and gives
  `<body>` the inline colour of `<html>` again. No route change happens, so the
  scroll stays where it was.

**One clarification of AC-6 for the review.** `fetchData` sends the country from the
address first (`utils/fetchData.ts:187-193`). A starter-settings read at the pick
would carry `gb`, not the picked country, and that is what the old popup does. The
app's start (`services/home.ts:63`) always reads the starter settings fresh; its
cached copy is never read. So this plan reads them **once**, on the picked country's
address after the flow's end. AC-6's "the starter settings request ran" is then
checked there, with `x-country` = the picked country. The pick itself saves only the
cookies. If the review wants the read at the pick anyway, it is one call.

## Steps

1. **Before numbers (S7e-9, NFR-1).** Make a production build of the base
   (`a4e31b857`) and run `C:\Users\DELL\xd-parity\perf\s7e-speed.cjs` on `/sy-en`,
   `/sy-en/about` and `/gb-en` (`/gb-en` hangs on the base, so write "no load
   event"). Keep the results for the plan note.
2. **Hang fix.** Add the server guard in `CoverBox`. Rebuild, then check with curl
   (`MSYS_NO_PATHCONV=1`, `--noproxy "*"`, 15 s limit) that `/gb-en`, `/gb-ar` and
   `/sy-en?no-country=true` end with `</html>`.
3. **Store flag.** Add `loginLayerOpen` / `setLoginLayerOpen` to the homepage slice.
   Gate `NavbarClient`'s two widgets on it, and add it to `AppShell`'s `covered`.
4. **Words.** Export the intro keys from `demoKeys.ts` (`INTRO_DICTIONARY_KEYS`: the
   intro keys, "Soon available", "Turkiye", "Syria", "Iraq", "Lebanon", "The country
   list could not be loaded", "Try again"). Build `introWords` in the `[lang]`
   layout and pass it to `<Init words={introWords} />`. Add "Syria", "Iraq" and
   "Lebanon" to `ar`, `tr` and `ku` (check each with `grep -F` first).
5. **Picker data.** `CountryPickerBody` gets three optional props, and with none of
   them `/demo` stays exactly as now:
   - `countries`: the rows, each with id, name, and design flag or `flagSrc`;
   - `initial`: the id chosen at first;
   - `only`: the ids a tap may pick.
   The map draws its 4 shapes. A shape that is not in `only` takes no tap, and the
   `initial` id is drawn chosen with no fill motion. `CountryRow` gets an optional
   `flagSrc` (a 30 px image), for a list country with no design flag
   (`countryFlag.ts`). While `countries` is an empty list, the rows' place shows
   skeleton rows (`components/Server/Skeleton`). The retry is drawn in the same
   place, with the row style: one row reading "The country list could not be
   loaded", one "Try again".
6. **`AppStartFlow`.** A new client file.
   - **Props:** `words`, the country list, `changed` (`[new, old]` or null),
     `loadFailed`, `onRetry`.
   - **First render** (server and client): a white full-screen cover that reads no
     browser value.
   - **After mount:**
     - a crawler gets `null`;
     - anyone else gets `NavCtx.Provider` → `NewLoginWidget` with
       `initialStep="country-picker"` and a `countryPicker` that draws
       `CountryPickerBody` with the real rows.
   - **Rows:** on `changed`, only the two countries, `initial` = the new one, and
     `only` = the two. Otherwise every list country, nothing chosen. Each row has its
     design name in English, else `t(name)`, else `countryNameFromIso`.
   - **On the pick:** `setLocaizationCookies(iso, lang)`, plus the `language` cookie
     the old popup also sets. The widget then goes on to the Quick Preview.
   - **On `onFinish`:** `window.location.replace` to `/<picked>-<lang><rest of the
     path>`. The query keeps every value except `no-country`, `changed-country`,
     `cart`, `_t` and `_bypass`, and gets `_bypass=popup-selection` added (the proxy
     saves the cookies again and strips it; `Init` removes it from the address). The
     picked country falls back to the address's country when nothing was picked: a
     close before a pick.
   - **Store:** `loginLayerOpen` is true while the host is open.
7. **`Init`.**
   - Replace the `PopupCountry` dynamic with the `AppStartFlow` dynamic (`ssr:
     false`). Its loader is the same white cover, never `SheetSkeleton`.
   - Pass `changed` from `?changed-country`, the list, `loadFailed` and `onRetry`.
   - Render `<AppSignInAsk words={words} />` on every page.
   - Keep `initPageLoad`'s "no `AllowNotifications` while the flow shows".
8. **`AppSignInAsk`.** A new client file, small, on every page.
   - **Off** on `/login`, `/loginDemo`, `/demo` and for a crawler. It uses its own
     check of the first path part: `shellStepsAside` also covers `products`, the
     product page, where the sheet must show (AC-12).
   - **Once per page load:** a module flag, as `introRun` on `/demo`.
   - **Timer:** 5 s after mount, it checks every 1 s. It shows the sheet when all of
     these hold:
     - the profile is known (`userProfile` set) and `isValidPhone(phone)` is false;
     - no layer is open: `anyLayerOpen()`, `loginLayerOpen`, `loginOpen`,
       `shouldAuthinticated`, a story, add story, a call, the pay frame, `chatVar`,
       `enable_search`, `isNotificationModal`, `selected_product_for_add_to_cart`;
     - no `input`, `textarea` or `[contenteditable]` has focus.
     A signed-in profile stops the timer for good.
   - **Lazy parts:** the sheet loads with `next/dynamic` and the `SheetSkeleton`
     loader (client only, so `CoverBox` never runs on the server). "Get Started"
     closes the sheet, sets `loginLayerOpen` and loads `NewLoginWidget`
     (`initialStep="get-started"`, `onFinish` = close and restore, as in OQ-12).
   - **Actions:** "Later", the backdrop and a drag down close the sheet (the sheet's
     own `onClose`). "More Info" calls `showToast(t("Soon available"))`.
9. **"More Info" hook.** `Rich` gets an optional `onLink` (the `<a>` part becomes a
   button-role span with that click). `SignInRequestSheet` gets an optional
   `onMoreInfo` and passes it on. `/demo` passes neither, so it stays the same.
10. **Delete the old popup.** Delete `utils/PopupCountry.tsx` and
    `tests/utils/PopupCountry.test.tsx` once `git grep PopupCountry` shows only e2e
    files (left for Stage 8, A-34).
11. **Checks.** Run `pnpm lint`, `pnpm lint:i18n-parity`, `next typegen` + `tsc`, and
    `pnpm build`. Run the changed test files one by one (`pnpm vitest run <file>`).
    Run the full suite in CI: `gh workflow run Tests --ref ticket/ui-migrations-7e-start-flow`
    after publish, or on the pushed branch.
12. **Browser proof** (`xd-parity` tools, production build). Check AC-1..AC-7, AC-9,
    AC-11..AC-16 and AC-19:
    - Compare with `/demo` on the `development` preview at the 3 sizes × 2 engines ×
      `en`/`ar`.
    - Check the flow's frames at 4x CPU.
    - Check a Googlebot user agent.
    - Run a guest and a signed-in session.
    - Sign in with a real staging phone for AC-8 and AC-15. The phone and the codes
      never go into a file.
13. **After numbers and the plan note.** Run the same speed script on the new build.
    Write "Where Stage 7e part 2 stopped" in `UI-MIGRATION-PLAN.md`: numbers, the
    differences left from `/demo` and why, and what is not checked yet (for example a
    real iPhone).
14. **Deployed check (AC-17).** A Vercel build of the working tree is needed. Ask the
    owner before `vercel deploy` (preview, no commit); if they say no, AC-17 is
    checked on the PR preview after `/wf:publish-pr`, and `verify.md` says so.

## Files to change

- `components/global/PageCover.tsx` — `CoverBox` returns `null` with no `document` (hang fix, FR-17).
- `components/Home/Init.tsx` — `AppStartFlow` replaces `PopupCountry`; server-safe loader; `words` prop; renders `AppSignInAsk`.
- `components/DemoApp1/AppStartFlow.tsx` — **new**: the real start flow host (FR-1..FR-9).
- `components/DemoApp1/AppSignInAsk.tsx` — **new**: the real sign-in request host (FR-12..FR-16).
- `utils/botAgent.ts` — **new**: `isCrawlerAgent` (FR-1, FR-13).
- `components/DemoApp1/screens/CountryPickerBody.tsx` — optional `countries` / `initial` / `only`; skeleton and retry rows (FR-4, FR-5, FR-9).
- `components/DemoApp1/screens/CountryRow.tsx` — optional `flagSrc` (Edge Cases).
- `components/DemoApp1/screens/SignInRequestSheet.tsx` — optional `onMoreInfo` (FR-16).
- `components/DemoApp1/screens/ListingParts.tsx` — `Rich` optional `onLink` (FR-16).
- `store/homepage/reducer.ts` — `loginLayerOpen` + `setLoginLayerOpen` (OQ-6).
- `components/Home/NavbarClient.tsx` — no session-expired / phone-check widget while `loginLayerOpen` (OQ-6).
- `components/DemoApp1/AppShell.tsx` — `loginLayerOpen` counts as covered (OQ-6).
- `components/DemoApp/demoKeys.ts` — export `INTRO_DICTIONARY_KEYS`; comment on `PREVIEW_ONLY_KEYS` updated (OQ-5).
- `app/(client)/[lang]/layout.tsx` — build `introWords`, pass to `Init` (OQ-5).
- `public/translations/translations.ar.js`, `translations.tr.js`, `translations.ku.js` — "Syria", "Iraq", "Lebanon" (NFR-4).
- `utils/PopupCountry.tsx` — **delete** (FR-10).
- `tests/utils/PopupCountry.test.tsx` — **delete** (FR-10).
- `tests/components/Home/Init.test.tsx` — extend / update (see Tests).
- `tests/components/Home/NavbarClient.test.tsx` — extend.
- `tests/components/DemoApp1/AppShell.test.tsx` — extend.
- `tests/store/homepageReducer.test.ts` — extend.
- `tests/app/layout.test.tsx` — extend.
- `tests/components/DemoApp1/SignInRequestSheet.test.tsx` — extend.
- `tests/components/DemoApp1/AppStartFlow.test.tsx` — **new**.
- `tests/components/DemoApp1/AppSignInAsk.test.tsx` — **new**.
- `UI-MIGRATION-PLAN.md` — "Where Stage 7e part 2 stopped" (S7e-7, S7e-9).

No protected runtime path is changed (`proxy.ts`, `next.config.ts`, instrumentation,
Sentry config and workflows stay as they are).

## Integration surface

- **Components / shared config touched:**
  - `Init` (every page);
  - the `[lang]` layout (every page's RSC payload gets `introWords`, about 20 keys);
  - the homepage store slice;
  - `NavbarClient`'s re-auth widgets;
  - `AppShell`'s bar;
  - `CoverBox` (every page skeleton and sheet loader);
  - `Rich` (every new-design screen);
  - the `/demo` parts `CountryPickerBody`, `CountryRow`, `SignInRequestSheet`;
  - the `country` / `lang` / `language` cookies;
  - the proxy's `_bypass=popup-selection` contract.
- **Who else depends on them:**
  - `/demo` (`Demo1Shell`) renders the same picker and sheet.
  - The address form and the delivery sheet render `CountryRow`.
  - Every skeleton uses `CoverBox`, through the page cover and the sheet loaders.
  - The session-expired flow (`140b3aea9`, `60fd710af`) depends on
    `SessionExpiredWidget` mounting.
  - `proxy.ts` reads the cookies and `_bypass`.
  - The e2e suite selects `data-pw="country-popup"` (Stage 8).
- **Overlapping flows:**
  - The real `/login` page and both new hosts use the same `NewLoginWidget` and the
    same `AppScaler`.
  - The session-expired prompt and the phone check use `AppScaler` too.
  - The settings countries page shares the cookie writer `setLocaizationCookies`.
- **Ordering / lockstep dependencies:**
  - The store flag must exist before the hosts use it.
  - `introWords` (layout) and `Init`'s `words` prop change together.
  - `PopupCountry` is deleted only after `Init` no longer imports it.
  - The 3 new translation keys must land in all three files in the same edit (the
    i18n lint).
- **What breaks if this is wrong:**
  - **Two `AppScaler`s** (the layer and the session widget): duplicate
    `#app-outer` / `#master-canvas`, and a broken page scale.
  - **A `CoverBox` guard that returns `null` on the client:** skeletons vanish (a
    blank tap). The guard checks `document`, which the client always has.
  - **`/demo` changes look** if a new optional prop is wrong. That shows in the
    `/demo` vs `development` pixel compare.
  - **The `_bypass` move goes wrong:** the proxy shows `changed-country` again, and
    the shopper is stuck in the flow.
  - **The sheet shows to a signed-in shopper** if the guest test reads `UserID()`
    instead of the phone.
  - **The page HTML stops ending again** if any server-rendered loader reads
    `window`. AC-17's curl shows it.

## Tests

The plan's test rule of 2026-11-04 says no new unit tests in the migration. Part 1
used `extend` and one `new` file with the owner's OK at review. This plan does the
same: it **extends** six existing files and asks for **two new files** for the two new
hosts. Their timing, guest and URL rules are the riskiest logic here, and no file
covers them. The review accepts or refuses these two.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|----|-------------------------|-------------|-----------|------------------|
| AC-1 | `Init.test.tsx` "offers the country picker on the gb placeholder…", "…after a country change…", "…for no-country…" (assert on `PopupCountry`) | extend | `tests/components/Home/Init.test.tsx` | update the three cases to assert the start flow host; new: "shows no start flow on a country address with no flag" |
| AC-2 | none — searched `tests/` for `isBot` outside `proxy.test.ts` | new | `tests/components/DemoApp1/AppStartFlow.test.tsx`; `tests/components/DemoApp1/AppSignInAsk.test.tsx` | "a crawler user agent gets no start flow"; "Instagram's in-app browser is not a crawler"; "a crawler gets no sign-in request". Plus the Googlebot browser check (Step 12). |
| AC-3 | none — a visual sequence | existing (browser check) | — | frame capture at 4x CPU (Step 12); `AppStartFlow.test.tsx` "the first render is the white cover and reads no browser value" |
| AC-4 | none for real rows — searched `tests/components/` for `CountryPickerBody` | new | `tests/components/DemoApp1/AppStartFlow.test.tsx` | "the rows are the countries of the list, nothing chosen"; "a list country with no design flag gets its standard flag"; "Syria's name is the translated word in ar" |
| AC-5 | none | new | `tests/components/DemoApp1/AppStartFlow.test.tsx` | "changed-country shows only its two countries, the new one chosen"; "a tap on the other row picks it"; "a map country outside the two takes no tap" |
| AC-6 | `Init.test.tsx` covers the list read only | new | `tests/components/DemoApp1/AppStartFlow.test.tsx` | "a pick saves the country and language cookies and moves on with no page load" (plus the clarified starter-settings check after the move, Step 12) |
| AC-7 | none | new | `tests/components/DemoApp1/AppStartFlow.test.tsx` | "the end of the flow opens the same path in the picked country with the flags gone"; "a close before a pick keeps the address's country" |
| AC-8 | `tests/components/NewLoginWidget.test.tsx` (real flow, 3-wrong-codes lock) | existing | `tests/components/NewLoginWidget.test.tsx` | unchanged cases pass; plus the staging sign-in (Step 12) |
| AC-9 | `Init.test.tsx` "logs a country list that cannot be read" | extend | `tests/components/DemoApp1/AppStartFlow.test.tsx`; `tests/components/Home/Init.test.tsx` | new: "a failed list shows the retry, and the retry reads it again"; "an empty list shows skeleton rows"; Init case updated to pass `loadFailed` to the host |
| AC-10 | `tests/utils/PopupCountry.test.tsx` | delete + existing (command) | `tests/utils/PopupCountry.test.tsx` (deleted) | `git grep PopupCountry` finds only e2e files; `tests/components/settings/PersonalInfoCountries.test.tsx` unchanged and green |
| AC-11 | none | new | `tests/components/DemoApp1/AppSignInAsk.test.tsx` | "a guest sees the request 5 s after the page shows, once"; "a signed-in shopper never sees it"; "no request before the profile is known" |
| AC-12 | none | new | `tests/components/DemoApp1/AppSignInAsk.test.tsx` | "no request on the login page, loginDemo or demo"; "a request on an old page" |
| AC-13 | `NavbarClient.test.tsx` (widget gating on `loginOpen`) | extend + new | `tests/components/Home/NavbarClient.test.tsx`; `tests/components/DemoApp1/AppSignInAsk.test.tsx` | Navbar new: "no session-expired or phone check widget while a login layer is open"; Ask new: "waits while the search, a chat or a sheet is open and comes up within a second after"; "waits while a field has focus"; "waits while the session check is open" |
| AC-14 | `SignInRequestSheet.test.tsx` (look, Safari 26 gap, card line) | existing | `tests/components/DemoApp1/SignInRequestSheet.test.tsx` | unchanged cases pass; plus the `/demo` compare (Step 12) |
| AC-15 | none | new | `tests/components/DemoApp1/AppSignInAsk.test.tsx` | "Get Started opens the login layer and its end closes it with no route change and puts the page colour back"; plus the staging sign-in (Step 12) |
| AC-16 | `SignInRequestSheet.test.tsx` (Later / backdrop close) | extend | `tests/components/DemoApp1/SignInRequestSheet.test.tsx` | new: "More Info calls onMoreInfo"; Ask new: "More Info shows Soon available" |
| AC-17 | none — a deployed-build fact | existing (command) | — | curl on a production build (Step 2) and on the Vercel build (Step 14), body ends with `</html>` within 10 s |
| AC-18 | none — a measurement | existing (measurement) | — | Steps 1 and 13; numbers in `UI-MIGRATION-PLAN.md` |
| AC-19 | none — a visual compare | existing (browser check) | — | Step 12, `s7e-diff.py`; `tests/app/layout.test.tsx` new: "sends the intro words to Init and keeps them out of the screen words" |
| AC-20 | — | existing (commands) | — | lint, i18n parity, typecheck, build, CI unit run |

Store and shell support cases (no AC of their own, guard OQ-6):
- `tests/store/homepageReducer.test.ts` new: "setLoginLayerOpen sets and clears the flag".
- `tests/components/DemoApp1/AppShell.test.tsx` new: "the bar hides while a login layer is open".

## Validation strategy

- Validation profile: `full` (lint, typecheck, unit-tests, build).
- Profile source: `pre-existing`.
- `pnpm lint:i18n-parity` runs in addition (NFR-4, AC-20); it is not part of `full`.
- `unit-tests` (`pnpm test:run`) runs in CI, not on this laptop (owner's rule of
  2026-11-04, low memory): `gh workflow run Tests --ref <branch>`. Its result is
  compared with the base run: the 13 old reds of part 1 (`tinyUtils` ×4,
  `Demo1Shell` ×9) may stay, nothing new may join. The declared files also run one
  by one locally (`pnpm vitest run <file>`).
- Browser checks, the curl checks and the speed numbers go in `implement.md` and in
  the plan note.

## Rollback

- All changes are on `ticket/ui-migrations-7e-start-flow` → one PR to
  `ui-migrations`. Revert that merge commit to go back.
- The `CoverBox` guard is independent. If the review splits it out, it can ship
  alone, and it is safe to keep on a rollback of the rest.
- No backend, proxy, env or config change. The cookies written are the same names
  and values the old popup wrote.

## Out of scope

- Step 6 (orders) — part 3.
- Any `proxy.ts` change; its own bot list stays as it is (`instagram` included).
- Showing the start flow on every load.
- The settings countries page (`PersonalInfoCountries`) and its starter-settings
  read at a pick.
- New analytics events.
- The e2e suite and its `country-popup` selectors (Stage 8, A-34).
- React's streaming bug itself. This plan removes the server throw that triggers
  it; it does not patch React.
