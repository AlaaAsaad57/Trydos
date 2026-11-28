---
ticket: ui-migrations-7e-start-flow
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Implement — ui-migrations-7e-start-flow

> Record of what was actually built, following `plan.md`.

Branch `ticket/ui-migrations-7e-start-flow`, cut from a clean `ui-migrations` at `a4e31b857`
(in step with `origin/ui-migrations`). No commit and no push (IM-9).

**Owner's scope rule for this stage (2026-11-28, `/wf:next` argument):** "implement should close
the finding cleanly even if its not in the plan". Every file below that `plan.md > Files to change`
does not list was changed under that rule, to close a review finding (F-1..F-3, P-1, S-4, S-5) or
a defect a check of this ticket found. Each one is listed under **Deviations**.

## Changes made

### Planned files

- `components/global/PageCover.tsx` — `CoverBox` returns `null` when there is no `document` (the
  hang fix, FR-17). Proven alone first: a build with only this line served `/gb-en` in 0.5–1 s.
- `components/Home/Init.tsx` — `AppStartFlow` (dynamic, `ssr: false`) replaces `PopupCountry`; its
  loader is `StartCover`, never `SheetSkeleton`; new `words` prop; renders `AppSignInAsk` on every page.
- `components/DemoApp1/AppStartFlow.tsx` — **new**. The real start flow: white cover first, crawler
  check in an effect, `NavCtx` with the layout's words, `NewLoginWidget` at `country-picker` with
  the real rows. `readChanged` (F-1) and `endAddress` (F-1, F-2) are exported pure helpers.
- `components/DemoApp1/AppSignInAsk.tsx` — **new**. Only the timer and the rules (guest by phone,
  pages, 5 s, every 1 s while busy, once per load, crawler); loads `SignInAskLayer` when due.
- `utils/botAgent.ts` — **new**. `isCrawlerAgent`: proxy.ts's words minus `instagram`.
- `components/DemoApp1/screens/CountryPickerBody.tsx` — `countries` (now required), `initial`,
  `only`, `failed`, `onRetry`; skeleton rows; message + "Try again" rows; map taps only for
  pickable countries; an `initial` country is drawn chosen with no fill motion. Imports
  `useDemoNav` from `../screenNav` (not `../Demo1Shell`) and no longer imports `demoPlaces.ts`.
- `components/DemoApp1/screens/CountryRow.tsx` — `RowCountry` type with optional `flagSrc` (a 30 px
  standard flag); `marginInlineStart` instead of `marginLeft` (see Deviations, D-7).
- `components/DemoApp1/screens/SignInRequestSheet.tsx` — optional `onMoreInfo`; the fixed English
  third line's "More Info" span is a button when it is given; `useDemoNav` from `../screenNav`;
  "Get Started" box uses `marginInlineStart` (D-7).
- `components/DemoApp1/screens/ListingParts.tsx` — `Rich` gets optional `onLink` (button-role `<a>` part).
- `store/homepage/reducer.ts` — `loginLayerOpen` + `setLoginLayerOpen`.
- `components/Home/NavbarClient.tsx` — no session-expired / phone-check widget while `loginLayerOpen`.
- `components/DemoApp1/AppShell.tsx` — the bar hides while `loginLayerOpen`; the page keeps its bar
  room under a login layer (D-8).
- `components/DemoApp/demoKeys.ts` — `INTRO_DICTIONARY_KEYS` exported; "The country list could not
  be loaded" and "Try again" added to the intro keys; the `PREVIEW_ONLY_KEYS` comment updated.
- `app/(client)/[lang]/layout.tsx` — builds `introWords` (as `screenWords`, `KEEP_CASE` in English)
  and passes it to `Init`; draws `ShellStartCover` on a `gb` address (D-3).
- `public/translations/translations.{ar,tr,ku}.js` — "Syria", "Iraq", "Lebanon" added after
  "Turkiye" (ar: سوريا / العراق / لبنان; tr: Suriye / Irak / Lübnan; ku: سووریا / عێراق / لوبنان).
- `utils/PopupCountry.tsx` — **deleted** (only `Init` rendered it).
- `tests/utils/PopupCountry.test.tsx` — **deleted** with it.
- `UI-MIGRATION-PLAN.md` — "Where Stage 7e part 2 stopped".
- Test files: see **Tests written**.

### Files outside the plan's list (owner's rule above)

- `components/DemoApp1/StartCover.tsx` — **new**. The server-safe white cover, `position: absolute`,
  never fixed (F-3 / S-1).
- `components/DemoApp1/ShellStartCover.tsx` — **new**. The cover in the first HTML on `gb` (S-5, AC-3).
- `components/DemoApp1/SignInAskLayer.tsx` — **new**. The sheet, toast and login layer, lazy (P-1, P-2).
- `components/DemoApp1/layerLocks.ts` — **new**. The layer count, out of `ui.tsx` (P-1).
- `components/DemoApp1/ui.tsx` — `useScrollLock` counts through `layerLocks.ts`; `anyLayerOpen` is
  re-exported from there.
- `components/DemoApp1/Demo1Shell.tsx` — passes `countries={COUNTRIES}` to the picker (S-4).
- `components/DemoApp1/screens/SignInSlides.tsx` — `useDemoNav` from `../screenNav`; the card uses
  `marginInlineStart` (D-7).
- `tests/components/DemoApp1/SignInSlides.test.tsx` — its mock follows the import to `screenNav`.
- `tests/components/DemoApp1/ShellStartCover.test.tsx` — **new**, for the new cover.

## Changes prepared (uncommitted)

All of the above sit on the working tree of `ticket/ui-migrations-7e-start-flow`. `git diff --stat`:
27 tracked files changed (548 insertions, 844 deletions, most of the deletions are `PopupCountry`),
plus 11 new files. `/wf:publish-pr` makes the one commit.

## Deviations from plan

- **D-1 (F-1 / S-3, owner: mitigate).** `AppStartFlow` uses a `changed-country` pair only when both
  are listed 2-letter codes and differ; otherwise the page counts as no-country. `endAddress` builds
  the address with `new URL(path, origin)` and returns null when the origin changes, the country is
  not listed, is `gb`, or the language is not two letters.
- **D-2 (F-2 / S-2, owner: mitigate).** The flow ends only after a pick; on changed-country the
  chosen new country counts as the pick. With no pick, `onFinish` does nothing (the picker has no
  way out). The planned test case "a close before a pick keeps the address's country" was dropped
  and replaced by "the end of the flow never opens a gb address".
- **D-3 (S-5 / AC-3).** The first measurement showed the page painting at 420 ms and `Init`'s cover
  at 650 ms, because `Init` sits in a Suspense. On a `gb` address the layout now draws
  `ShellStartCover` in the first HTML; it goes when `loginLayerOpen` turns on, or for a crawler. On
  `?no-country` / `?changed-country` of another country, `Init`'s cover is still the first.
- **D-4 (F-3 / S-1, owner: mitigate).** The cover is a separate `StartCover` file, `absolute` from
  the top with `100lvh`; the WebKit Safari 26 check found no fixed box at the bottom edge.
- **D-5 (P-1, P-2, NFR-1).** The first build put about 7 KB more JS on `/about`. The sign-in request
  was split: `AppSignInAsk` (timer) + lazy `SignInAskLayer` (sheet, toast, login). The layer count
  moved to `layerLocks.ts`. The login's code starts loading when the sheet opens (P-2).
- **D-6 (S-4).** `CountryPickerBody` no longer imports `demoPlaces.ts`; `/demo` passes its rows.
  The three `/demo` parts import `useDemoNav` from `screenNav`, so the real chunks do not pull
  `Demo1Shell`.
- **D-7 (found by the `/demo` compare, FR-15, NFR-3).** On an `ar` page the sign-in card, its
  "Get Started" box and the picker rows sat 20 px (rows 12 px) too far right: a physical
  `marginLeft` in a right-to-left column. Now `marginInlineStart`; left to right nothing moves.
  The Arabic sheet's difference from `/demo` went from about 2 % to about 0.5 %.
- **D-8 (found by the real sign-in, AC-15).** Two defects in the sign-in request's login layer, both
  inside this ticket's files, fixed and test-proven red then green:
  - `<body>` lost the page's colour: the restore ran in the close handler, before the login's page
    scaler cleaned up. It now runs in an effect after the layer is gone (`SignInAskLayer`).
  - A page scrolled to its end jumped up 64 px: `AppShell` removed `--app-bar-room` under the layer,
    and the scroll was clamped. The page now keeps its bar room under a login layer.
- **D-9 (AC-6, as approved in `plan.md > One clarification of AC-6`).** No starter-settings read at
  the pick; the read on the picked country's address carries `x-country=sy` (browser check).
- **D-10 (AC-17, Step 14).** The owner chose "vercel deploy now". The upload failed at 0 of 211 MB
  ("fetch failed"), and the CLI would have uploaded about 211 MB of git-ignored local files. A
  temporary `.vercelignore` kept the env files out and was deleted right after. AC-17's Vercel check
  moves to the PR preview; the local production build proves the fix.

## Tests written

The plan's test rule of 2026-11-04 applies (full suite in CI). The declared files and the
neighbours ran one by one locally (`npx vitest run <files>`): 327 tests, 316 pass; the 11 red are
the 9 old `Demo1Shell` reds of part 1 and 2 old `homepageReducer` page-lock reds (both red on
`a4e31b857` too, seen by stashing this ticket's two edits of that file).

| AC | Test file | Test case | Disposition carried out |
|----|-----------|-----------|-------------------------|
| AC-1 | `tests/components/Home/Init.test.tsx` | 3 cases now assert the start flow host; new "shows no start flow on a country address with no flag" | extend |
| AC-2 | `tests/components/DemoApp1/AppStartFlow.test.tsx`; `AppSignInAsk.test.tsx` | "a crawler user agent gets no start flow"; "Instagram's in-app browser is not a crawler"; "a crawler gets no sign-in request"; + Googlebot browser check | new |
| AC-3 | `tests/components/DemoApp1/AppStartFlow.test.tsx`; `ShellStartCover.test.tsx` (D-3); `tests/app/layout.test.tsx` | "the first render is the white cover and reads no browser value"; "covers the page until the flow's login layer is up"; "a crawler gets no cover"; "draws the start flow's white in the first HTML on a gb address only"; + timing check on the final build (cover 6,640 ms, first paint 7,032 ms; a cold first load; an earlier run: 358 / 488 ms) | new / extend |
| AC-4 | `AppStartFlow.test.tsx` | "the rows are the countries of the list, nothing chosen"; "a list country with no design flag gets its standard flag"; "Syria's name is the translated word in ar" | new |
| AC-5 | `AppStartFlow.test.tsx` | "changed-country shows only its two countries, the new one chosen"; "a tap on the other row picks it"; "a map country outside the two takes no tap" | new |
| AC-6 | `AppStartFlow.test.tsx` | "a pick saves the country and language cookies and moves on with no page load"; + browser: starter settings `x-country=sy` on the new address | new |
| AC-7 | `AppStartFlow.test.tsx` | "the end of the flow opens the same path in the picked country with the flags gone"; "the end of the flow never opens a gb address" (replaces the dropped case, D-2); F-1: "a changed-country value that is not a listed country is ignored", "the end address always stays on this site" | new |
| AC-8 | `tests/components/NewLoginWidget.test.tsx` | unchanged, passes; + real staging sign-in from the flow (wrong code answered, right code signs in) | existing |
| AC-9 | `AppStartFlow.test.tsx`; `Init.test.tsx` | "a failed list shows the retry, and the retry reads it again"; "an empty list shows skeleton rows"; Init's "logs a country list…" now also checks `loadFailed` and the retry | new / extend |
| AC-10 | `tests/utils/PopupCountry.test.tsx` | deleted with the popup; `git grep PopupCountry` finds only e2e files and 3 docs; `PersonalInfoCountries.test.tsx` passes | delete + existing |
| AC-11 | `AppSignInAsk.test.tsx` | "a guest sees the request 5 s after the page shows, once"; "a signed-in shopper never sees it"; "no request before the profile is known" | new |
| AC-12 | `AppSignInAsk.test.tsx` | "no request on the login page, loginDemo or demo"; "a request on an old page and on a product page" | new |
| AC-13 | `tests/components/Home/NavbarClient.test.tsx`; `AppSignInAsk.test.tsx` | "no session-expired or phone check widget while a login layer is open"; "waits while the search, a chat or a sheet is open…"; "waits while a field has focus"; "waits while the session check is open" | extend / new |
| AC-14 | `tests/components/DemoApp1/SignInRequestSheet.test.tsx` | unchanged cases pass (mock moved to `screenNav`); + Chromium compare | existing |
| AC-15 | `AppSignInAsk.test.tsx`; `AppShell.test.tsx` | "Get Started opens the login layer and its end closes it with no route change and puts the page colour back" (**red first**, then green, D-8); `AppShell`: "the bar hides while a login layer is open" with the bar-room assertion (**red first**, then green, D-8); + real staging sign-in from the sheet | new / extend |
| AC-16 | `SignInRequestSheet.test.tsx`; `AppSignInAsk.test.tsx` | "More Info calls onMoreInfo" (**red first**: the fixed English line had no tap, then green); "More Info is only drawn, not a button, when the host gives no onMoreInfo (/demo)"; "More Info shows Soon available" | extend / new |
| AC-17 | — | curl on local production builds (base: no end in 40 s; fix: ends in under 1 s); Vercel check moved to the PR preview (D-10) | existing (command) |
| AC-18 | — | Steps 1 and 13; numbers in `UI-MIGRATION-PLAN.md`; **budget not met** (+5,351 / +5,368 B) | existing (measurement) |
| AC-19 | `tests/app/layout.test.tsx` | "sends the intro words to Init and keeps them out of the screen words"; + compare | extend |
| AC-20 | — | lint, i18n parity, typecheck, build: pass (see below); CI unit run after publish | existing (commands) |

Support cases (OQ-6): `tests/store/homepageReducer.test.ts` "setLoginLayerOpen sets and clears the
flag" (new case).

## Findings — confirmed bugs, out of scope

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------|
| — | none found outside this ticket's files | — | — | — |

Notes, not new bugs:

- The 2 `homepageReducer` page-lock reds ("setIsNavigating unlocks…", "setLoginOpen locks…") are
  red on `a4e31b857` too. They were not found by this ticket's tests, and are like part 1's
  `tinyUtils` page-lock reds.
- `PersonalInfoCountries` with `hideTopBar` (the old popup's no-country path) only swaps a
  `/gb-<lang>` prefix. That path is gone with the popup; the settings page does not use `hideTopBar`.
- Staging answered `POST /api/auth/register-device` with 429 during the many browser runs of this
  stage (guest registrations from one IP). Chromium recovered through `/api/auth/expire`.

## Validation run during implementation

- `pnpm lint:i18n-parity` — "✓ i18n parity OK — 3015 keys present in all three files".
- `pnpm lint` — 0 errors, 69 warnings (none in this ticket's files; same count as before).
- `npx next typegen` + `node_modules/.bin/tsc --noEmit --pretty false` — no errors.
- `pnpm build` — exit 0 (final build with every change).
- Local `next start` of that build, curl (`--noproxy "*"`): `/sy-en`, `/gb-en`, `/gb-ar`,
  `/sy-en?no-country=true` all end with `</html>`; the three flagged pages carry the start cover in
  their HTML; the server log has no `window is not defined` and no "already flushed".
- `xd-parity/perf/s7e2-real.cjs` (14 checks) — all pass on the final build.
- `xd-parity/perf/s7e2-signin.cjs` — AC-8 and AC-15 pass with the test account from
  `.env.development` (no phone or code was printed or written).
- `xd-parity/perf/s7e2-compare.cjs` + `s7e2-diff.py` — numbers in `UI-MIGRATION-PLAN.md`.
- Not run here: the full unit suite in CI (`gh workflow run Tests --ref ticket/ui-migrations-7e-start-flow`
  after publish); the sign-in request in WebKit (needs https, PR preview); a real iPhone; AC-17 on Vercel.
