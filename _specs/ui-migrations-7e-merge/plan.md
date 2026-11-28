---
ticket: ui-migrations-7e-merge
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Plan — ui-migrations-7e-merge

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

One real merge commit of `development` (`9517cb02b`) into the ticket branch cut from `ui-migrations`
(`246536cea`), as Stage 7d did with `9b0807853`. In every conflict the `ui-migrations` side is the base,
because it holds the real flows, and `development`'s design and fix parts are carried into it by hand.
Then a few small follow-up commits on the same branch: the splash debug removal, the email port (test first),
the flags, the media preconnect, the word-list filter and the test updates. A merge keeps the history that
later merges of `development` need; a cherry-pick of 27 commits would make the next merge conflict again on
the same lines.

## Steps

1. **Measure before** (AC-15). Production build of `ui-migrations` at `246536cea`. Record, for
   `/sy-en/login` and `/sy-en` (home): the JavaScript bytes transferred and the time to first paint, with a
   4x CPU slow-down (scripts in `C:\Users\DELL\xd-parity\perf`). Write the numbers down.
2. **Branch.** From a clean `ui-migrations` at `246536cea`: `git switch -c ticket/ui-migrations-7e-merge`.
3. **Merge** `git merge --no-ff 9517cb02b` and solve each conflict (table under Files to change). Rules:
   - `NewLoginWidget.tsx`: keep the `ui-migrations` file whole. Add only: the `country-picker` step and the
     `countryPicker` prop; `opensWithColumn` and the `country-picker` badge slot; the `picker` prop passed to
     `QuickPreviewScreen`; `initialStep` / `exitTo` (used by `/loginDemo`; `exitTo` overrides `leave` only
     when given); the splash fix (Step 4). Drop: the control bar (`showControls`, `hideMenu`), the tuning
     state (`belowButtonMin` / `abovePill` stay fixed at 0, Stage 1), `DemoDeviceInfoModal`,
     `LogoAnimationModal`, `readStoredConfig` and its `localStorage` picks, the inline stage `<div>` (it
     lives in `AuthStage`).
   - `Demo1Shell.tsx`: keep the `ui-migrations` imports (`ScreenFrame`, `screenNav`, `MotionConfig`,
     `DemoKeyboard`, RTL `move`). Add `development`'s start flow (`signing`, `picking`, `barHeld`,
     `askSignIn`, `SIGN_IN_ASK_MS`, `IntroBlank`, `SignInRequestSheet`, the login layer). Do not bring back
     its own slide variants: the `through` fade goes into `ScreenFrame.tsx`. Do not bring back the "tab bar
     colour" picker.
   - `demoKeys.ts`: keep `SLIDE_KEYS`, `INTRO_KEYS`, `ORDER_KEYS`; drop the 4 demo-tool words.
   - `demoRoutes.ts`: keep both `settings/preferences` and `settings/orders`.
   - `AddressFormScreen.tsx`: keep the `ui-migrations` real country list (only the page's country, S4-7);
     draw the row with `CountryRow`; flag per Step 6.
   - `DeliveryMethodSheet.tsx`: keep `marginInlineEnd`; draw the flag per Step 6 (always a flag).
   - `PersonalInfoScreen.tsx`: take the `ui-migrations` side in all 3 hunks (it already has `efeb565ec`).
   - `ProfileScreen.tsx`: take the `ui-migrations` side (`card.open`; Orders opens the old page, FR-9).
   - `tests/app/smallRoutes.test.tsx`: keep both mocks' needs (one widget mock that reads `initialStep` /
     `exitTo`) and both cases.
   - `PersonalInfoForm.tsx` and its test: `git rm` (stay deleted).
   Commit the merge only when typecheck passes on it.
4. **Splash: keep the fix, remove the debug parts** (FR-6, OQ-1).
   - `SafariSplashGapLab.tsx`: delete `SafariSplashDebugMenu`, `RulerTicks`, `SafariRulerProbe`,
     `readDiagnostics`, the settings store (`SAFARI_SPLASH_STORAGE_KEY`, `readSafariSplashSettings`,
     `writeSafariSplashSettings`, `useSafariSplashLab`'s setter), `pauseSplash`, `showRuler`, the
     `?safariFix=` reads, and the modes `fixed-0w`, `body-layer`, `scroll-nudge`, `sticky-0w`, `lvh-canvas`
     with their branches in the CSS builder, the runtime hook and the badge renderer. Keep `in-flow` and
     `off`, `buildSafariSplashCss` (inside `@layer utilities`), the prepaint script (now: user agent only),
     `useSafariSplashRuntime`, `SafariSplashBadgeRenderer`, `DEFAULT_BAND_PX`, `DEFAULT_CLIP_DESIGN_Y`.
     The mode comes only from the user agent.
   - `NewLoginWidget.tsx`: the prepaint `<script>`, `data-splash-waiting` and `data-safari-splash-mode` on
     `<main>`, `useSafariSplashRuntime`, `SafariSplashBadgeRenderer`; no debug menu.
   - `AuthStage.tsx`: the stage box gets `data-pw="login-stage"` (research F-4: the fix CSS targets it), and
     `AuthLogoLayer` gets the `hidden` flag while the badge renderer draws the waiting mark. The verify
     overlays that also use `AuthStage` never set it, so they do not change.
   - `QuickPreviewScreen.tsx`: drop the `pauseAutoExpand` prop (debug); keep `safariBandPx`.
5. **Email code before save** (FR-5, OQ-2), test first:
   1. Rewrite the 2 old-behaviour cases and add the new cases in `profileScreens.test.tsx` (Tests table).
   2. Run that file on the merged `PersonalInfoScreen` (before the port). **See the new cases red.**
   3. Port `b48a3e999`'s logic into `PersonalInfoScreen.tsx`: a normalised `newEmailOf`, open the sheet
      before any save, never send the new email, `provedEmail` for a later save, the 400 kept as a second
      net, `onVerified(saved)` sets the proved email. No phone case (the screen has no phone field).
   4. Run the file again. **See it green.**
6. **Flags** (FR-8, OQ-5). New `components/DemoApp1/countryFlag.ts`: ISO code → the design's row flag
   (`tr` → `flagTr`, `sy` → `flagSyRow`, `iq` → `flagIq`, `lb` → `flagLb`), else the standard
   `/icons/flag/<iso>.svg`. `AddressFormScreen` (field, sheet row, list) and `DeliveryMethodSheet` draw
   from it. `checkoutData.ts` `deliveryPlace` passes the address's country code, so the real checkout's
   sheet shows the flag the design draws. `DeliveryPlace.flag` becomes that result type; the `/demo`
   checkout passes its XD flag as before. Not a demo data file (S7e-6).
7. **Media** (FR-7, OQ-4, OQ-8). `app/(client)/[lang]/layout.tsx`: preconnect to the origin of
   `utils/mediaUrl.ts` instead of `NEXT_PUBLIC_BASE_MEDIA_URL`. Update the 5 tests that set the old
   variable to set `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (as `bfae3eb6e` did on `development`).
8. **Word list for real pages** (NFR-2). The real `[lang]` layout sends every `DEMO_KEYS` word to every page
   (370 keys today). `ORDER_KEYS` and `INTRO_KEYS` serve only `/demo` until parts 2 and 3. Export them as one
   set `PREVIEW_ONLY_KEYS` from `demoKeys.ts`; the real layout skips that set; `/demo` keeps all. Parts 2 and
   3 take their keys out of the set when their screens become real.
9. **Tests and checks** (Tests table). Run each declared test file alone (`pnpm vitest run <file>`). Then
   `pnpm lint`, `pnpm lint:i18n-parity`, typecheck (`next typegen` first), `pnpm build`. Full unit suite in CI:
   `gh workflow run Tests --ref ticket/ui-migrations-7e-merge`, compared with a run on `ui-migrations` at
   `246536cea`.
10. **Browser checks** (AC-2, AC-4, AC-8, AC-10, NFR-1, NFR-3). One `next dev` at a time; URLs under
    `/sy-en/` and `/sy-ar/`:
    - `/demo` on the ticket branch vs `/demo` on `development` (a `development` worktree), 430 x 932,
      Chromium: every start step and the sign-in sheet; the Orders card.
    - `/login` in WebKit with an iPhone Safari 26 user agent: the waiting splash takes `in-flow`
      (`<main>` not fixed while waiting; the stage has `contain: none`). Chromium: as before.
    - Address form and checkout delivery sheet in `en` and `ar`: the flags and their side.
    - Real sign-in (phone → code → name) and the 3-wrong-codes lock: on the Vercel preview after the owner's
      OK to push (the dev machine cannot sign in reliably; owner's call at verify).
11. **Measure after** (AC-15): same pages, same method as Step 1.
12. **Plan note.** Add "Where Stage 7e part 1 stopped" to `UI-MIGRATION-PLAN.md`: the before/after numbers,
    every difference left from `/demo`, and anything not checked.

## Files to change

Merge conflicts (Step 3):

| File | Change |
|---|---|
| `NewLoginDesign/NewLoginWidget.tsx` | Solve 12 hunks; add the picker step, `initialStep`/`exitTo`, the splash fix; drop demo tools. |
| `components/DemoApp1/Demo1Shell.tsx` | Solve 9 hunks; add the start flow and the sign-in sheet for `/demo`. |
| `components/DemoApp/demoKeys.ts` | Solve 3 hunks; drop the 4 demo-tool words; export `PREVIEW_ONLY_KEYS` (Step 8). |
| `components/DemoApp/demoRoutes.ts` | Solve 1 hunk; keep both routes. |
| `components/DemoApp1/screens/AddressFormScreen.tsx` | Solve 3 hunks; `CountryRow` with the real country; flag from `countryFlag.ts`. |
| `components/DemoApp1/screens/DeliveryMethodSheet.tsx` | Solve 1 hunk; flag from `countryFlag.ts`, logical side. |
| `components/DemoApp1/screens/PersonalInfoScreen.tsx` | Solve 3 hunks (ui-migrations side); then the email port (Step 5). |
| `components/DemoApp1/screens/ProfileScreen.tsx` | Solve 1 hunk (ui-migrations side). |
| `tests/app/smallRoutes.test.tsx` | Solve 2 hunks; keep both cases. |
| `components/setting/profile/PersonalInfoForm.tsx` | Stays deleted (`git rm`). |
| `tests/components/setting/profile/PersonalInfoForm.test.tsx` | Stays deleted (`git rm`). |

Follow-up edits (Steps 4–8, 12):

| File | Change |
|---|---|
| `NewLoginDesign/SafariSplashGapLab.tsx` | Remove debug parts and 5 modes; mode from user agent only. |
| `NewLoginDesign/AuthStage.tsx` | `data-pw="login-stage"` on the stage box; pass `hidden` to `AuthLogoLayer`. |
| `NewLoginDesign/QuickPreviewScreen.tsx` | Remove the `pauseAutoExpand` prop. |
| `components/DemoApp1/ScreenFrame.tsx` | Add the `through` fade to `Slide` and the variants (for `/demo`'s start). |
| `components/DemoApp1/screenNav.ts` | Only if the start flow needs a new field on the nav context; otherwise untouched. |
| `components/DemoApp1/countryFlag.ts` | New: ISO code → design row flag or standard flag. |
| `components/DemoApp1/checkoutData.ts` | `deliveryPlace` passes the country flag. |
| `app/(client)/[lang]/layout.tsx` | Preconnect via `utils/mediaUrl.ts`; skip `PREVIEW_ONLY_KEYS`. |
| `UI-MIGRATION-PLAN.md` | "Where Stage 7e part 1 stopped" with the numbers. |

Tests (Tests table):

| File | Change |
|---|---|
| `tests/components/DemoApp1/profileScreens.test.tsx` | extend: email cases (new + 2 rewritten); flag cases; the Orders card case. |
| `tests/components/SafariSplashGapLab.test.tsx` | extend (file comes with the merge): drop cases for removed parts; add user-agent-only cases. |
| `tests/components/NewLoginWidget.test.tsx` | extend: the splash attributes on the real structure. |
| `tests/app/layout.test.tsx` | extend: the media preconnect; the preview-only words skipped. |
| `tests/components/DemoApp1/checkoutData.test.ts` | new: `deliveryPlace` flag. |
| `tests/components/DemoApp1/AppHomeView.test.tsx` | update the media variable. |
| `tests/components/DemoApp1/homeData.test.ts` | update the media variable. |
| `tests/components/DemoApp1/useHomeData.test.tsx` | update the media variable (2 places). |
| `tests/components/DemoApp1/useShellData.test.tsx` | update the media variable. |

All other files of the 27 commits arrive through the merge unchanged.

## Integration surface

- **Components / shared config touched:** the login stage `AuthStage` (also used by `VerifyPhoneFlow`: checkout
  verify, phone re-verify, session expired); `AppScaler` / `Page` (`inDocument`, default off; the one scaled
  page); `utils/fetchData.ts` (every market call); `public/firebase-messaging-sw.js` (every push click);
  `utils/mediaUrl.ts`, `GetImageUrl` in both copies (`utils/tinyUtils.tsx`, `utils/server/helpers.ts`)
  (every image); the env variable `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`; the `[lang]` root layout (every real
  page: preconnect, word list); the 3 translation files; `DEMO_KEYS` (both layouts); `DeliveryPlace` type
  (real and `/demo` checkout).
- **Who else depends on them:** parts 2 and 3 of Stage 7e (they build on this branch and on
  `PREVIEW_ONLY_KEYS`); every login opener (13) and verify overlay; the checkout; every page with images;
  the push service worker; the Docker / server deploy (`docs/server-deploy.md`).
- **Overlapping flows:** the real `/login` and `/loginDemo` share `NewLoginWidget`; `/demo` and the real app
  share `AddressFormScreen`, `DeliveryMethodSheet`, `ScreenFrame`, `demoKeys`; the session-expired prompt
  and the `fetchData` hold share the `shouldAuthinticated` marker.
- **Ordering / lockstep dependencies:** the merge commit first, then the follow-ups. The email tests must be
  written and seen red before the port. `PREVIEW_ONLY_KEYS` and the layout change go together. The media
  variable is set on Vercel already (OQ-3) before any preview deploy.
- **What breaks if this is wrong:** a lost line in `NewLoginWidget` breaks sign-in for every shopper (no
  code sent, no lock, wrong return page, missing GA events); a missed `data-pw="login-stage"` silently drops
  the iPhone Safari 26 fix (only visible on a real iPhone); a wrong `AuthStage` `hidden` default hides the
  logo in the verify overlays; a wrong media origin breaks every image; a bad word filter leaves real
  screens in English.

## Tests

| AC   | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | none — a git fact, searched `tests/` | existing (command) | — | Verified by `git merge-base --is-ancestor 9517cb02b HEAD` and `git merge-base --is-ancestor 246536cea HEAD`; no test file. |
| AC-2 | `tests/components/NewLoginWidget.test.tsx` (real flow, OTP lock, return path, events), `NewLoginScreensRtl.test.tsx`, `NewLoginWidgetReducedMotion.test.tsx` | existing | `tests/components/NewLoginWidget.test.tsx` | the existing cases, unchanged, must pass; plus the manual preview sign-in (Step 10). |
| AC-3 | none — searched `tests/` for the control bar / demo-tool words | existing (command) | — | Verified by `git grep` for `showControls`, `hideMenu`, `DemoDeviceInfoModal`, `LogoAnimationModal`, the 4 words, outside `/demo`-only code; no test file. |
| AC-4 | from `development`: `tests/components/DemoApp1/SignInRequestSheet.test.tsx`, `SignInSlides.test.tsx`, `tests/components/QuickPreviewScreen.test.tsx`, `tests/components/DemoApp1/Demo1Shell.test.tsx` | existing | those files | pass on the branch; plus the side-by-side `/demo` browser check (Step 10). |
| AC-5 | `tests/components/DemoApp1/profileScreens.test.tsx` line 250 (old behaviour) | extend | `tests/components/DemoApp1/profileScreens.test.tsx` | new: "a new e-mail opens the code sheet before any save, and the save never carries it"; rewritten: line 250 case. Seen red on the merged screen first. |
| AC-6 | same file, lines 268, 277, 297 | extend | `tests/components/DemoApp1/profileScreens.test.tsx` | new: "after a right code only the other fields are saved, and none when nothing else changed"; "a later save asks no second code"; "the same e-mail in other capitals opens no sheet"; "a cleared e-mail opens no sheet"; "the core backend's 'verify the new email' answer still opens the sheet"; "closing the sheet saves nothing"; rewritten: line 268 case. New ones seen red first. |
| AC-7 | from `development`: `tests/components/SafariSplashGapLab.test.tsx` (tests the lab, debug parts included) | extend | `tests/components/SafariSplashGapLab.test.tsx` | drop: "persists lab settings across reloads…", the per-mode loop for the 5 removed modes; add: "only in-flow and off exist"; "an iPhone Safari 26 user agent gets in-flow, any other gets off"; "a safariFix parameter and a saved setting do not change the mode"; "no debug menu is rendered". Keep: the `@layer utilities` case, the prepaint case, the in-flow activate/teardown case. |
| AC-8 | none for the real structure — searched `tests/components/NewLoginWidget.test.tsx`, `SafariSplashGapLab.test.tsx` | extend | `tests/components/NewLoginWidget.test.tsx` | new: "on iPhone Safari 26, while the splash waits, the widget is marked waiting with mode in-flow and the stage carries data-pw=login-stage"; plus the WebKit browser check (Step 10). |
| AC-9 | from `development`: `tests/utils/mediaUrl.test.ts`, `tests/utils/tinyUtils.test.ts`, `tests/utils/server/helpers.test.ts`; `tests/app/layout.test.tsx` has no preconnect case | extend + update | `tests/app/layout.test.tsx`; the 5 media-variable files | new: "opens an early connection to the single media origin"; update the variable in `AppHomeView.test.tsx`, `homeData.test.ts`, `useHomeData.test.tsx` (2), `useShellData.test.tsx`. |
| AC-10 | `profileScreens.test.tsx` "lists only the page's country (S4-7)" (no flag check); no `checkoutData` test | extend + new | `tests/components/DemoApp1/profileScreens.test.tsx`; `tests/components/DemoApp1/checkoutData.test.ts` | extend: "the page's country row shows the design's Syria flag"; "a country with no design flag shows its standard flag". new: "deliveryPlace gives the design flag for tr/sy/iq/lb and the standard flag otherwise". Plus the en/ar browser check. |
| AC-11 | none for the card's tap — searched `tests/components/DemoApp1/` (`profileScreens.test.tsx` checks only the orders count; `AppShell.screens.test.tsx` checks the bar on `/settings/orders`) | extend | `tests/components/DemoApp1/profileScreens.test.tsx` | new: "the Orders card opens the old orders page (D-17)". |
| AC-12 | from `development`: `tests/utils/fetchData.test.ts`, `tests/public/firebaseMessagingSwTags.test.ts` | existing | those files | pass on the branch. |
| AC-13 | from `development`: `tests/components/setting/orders/OrderDetailsWrapper.test.tsx`, `OrderItemOptions.test.tsx`, `confirmations/OrderItemReturnConfirmationWindow.test.tsx` | existing | those files | pass on the branch. |
| AC-14 | — | existing (commands) | — | `pnpm lint`, `pnpm lint:i18n-parity`, typecheck, `pnpm build`, CI unit run compared with the base run. |
| AC-15 | none — a measurement | existing (measurement) | — | before/after numbers (Steps 1, 11) written in `UI-MIGRATION-PLAN.md`; the word-list filter checked by the `tests/app/layout.test.tsx` case "the real layout skips the preview-only words". |

`tests/app/layout.test.tsx` gets that last case too (NFR-2, Step 8).

## Validation strategy

- Validation profile: `full` (lint, typecheck, unit-tests, build).
- Profile source: `pre-existing`.
- `pnpm lint:i18n-parity` runs in addition (AC-14, FR-13); it is not part of `full`.
- The `unit-tests` check (`pnpm test:run`) runs in CI, not on this laptop (owner's rule of 2026-11-04, low
  memory): `gh workflow run Tests --ref ticket/ui-migrations-7e-merge`; its exit code is the check's result.
  The declared test files also run one by one locally (`pnpm vitest run <file>`), which is how the red-first
  runs of Step 5 are seen.
- Browser checks and the speed numbers are recorded in `implement.md` and in the plan note.

## Rollback

- Before the PR is merged: delete `ticket/ui-migrations-7e-merge`; `ui-migrations` is untouched.
- After it is merged into `ui-migrations`: `git revert -m 1 <merge commit>` plus a revert of each follow-up
  commit. Note: after reverting a merge, the next merge of `development` will not bring those commits back
  by itself; the revert must be reverted first. So a partial problem is better fixed forward on the branch.
- Vercel: promote the previous `ui-migrations` preview.

## Out of scope

- Making the start flow, the country picker and the sign-in sheet real (part 2).
- Making the orders screens real (part 3); the Orders card keeps opening the old page.
- Renaming `SafariSplashGapLab.tsx`.
- The browser (e2e) suite (A-34).
- The uncommitted worktree files named in the spec.

## Plan ↔ requirement traceability

| Step | Requirements / AC |
|---|---|
| 1, 11 | NFR-2, AC-15 |
| 2, 3 | FR-1, FR-2, FR-3, FR-4, FR-9, FR-10..FR-14, AC-1..AC-4, AC-11..AC-14 |
| 4 | FR-6, NFR-2, AC-7, AC-8 |
| 5 | FR-5, AC-5, AC-6 |
| 6 | FR-8, NFR-1, NFR-3, AC-10 |
| 7 | FR-7, AC-9 |
| 8 | NFR-2, AC-15 |
| 9 | AC-14 and every Tests row |
| 10 | AC-2, AC-4, AC-8, AC-10, NFR-1, NFR-3 |
| 12 | AC-15, S7e-7 |
