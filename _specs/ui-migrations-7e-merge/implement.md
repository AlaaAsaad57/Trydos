---
ticket: ui-migrations-7e-merge
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Implement — ui-migrations-7e-merge

> Record of what was actually built, following `plan.md`.

Branch: `ticket/ui-migrations-7e-merge`, cut from a clean `ui-migrations` at `246536cea` (S7e-5). The merge of
`9517cb02b` is in progress with `--no-commit` (`MERGE_HEAD` set), and every change is staged. No commit, no
push (IM-9): `/wf:publish-pr` makes the one merge commit.

## Changes made

Merge conflicts (Step 3):

- `NewLoginDesign/NewLoginWidget.tsx` — the `ui-migrations` file kept whole (real flow, GA events, OTP lock,
  `?next=`, `AuthStage`). Added from `development`: the `country-picker` step and its badge slot,
  `opensWithColumn`, the `countryPicker` and `exitTo` props (`exitTo` is used only when there is no
  `onFinish`, before `?next=`), the `picker` and `safariBandPx` props on `QuickPreviewScreen`, and the splash
  fix (prepaint `<script>` before `<main>`, `data-splash-waiting` / `data-safari-splash-mode`,
  `useSafariSplashMode` + `useSafariSplashRuntime`, `Page inDocument`, `SafariSplashBadgeRenderer` inside
  `<main>`). Not taken: the control bar, the tuning state, `DemoDeviceInfoModal`, `LogoAnimationModal`, the
  saved logo picks, the inline stage, the debug menu.
- `components/DemoApp1/Demo1Shell.tsx` — the `ui-migrations` file kept whole (`ScreenFrame`, `screenNav`,
  `MotionConfig`, RTL `move`). Added from `development`: `intro`, `SIGN_IN_ASK_MS`, `introRun`, the
  `signing` / `picking` / `barHeld` / `askSignIn` state, `planAsk`, the body colour restore after the login
  layer, `endLogin` / `endIntro`, `frameKey`, `IntroBlank`, `SignInRequestSheet`, the `NewLoginWidget` layer
  with `CountryPickerBody`. Not taken: its own slide variants (the `through` fade went to `ScreenFrame.tsx`)
  and the demo controls.
- `components/DemoApp/demoKeys.ts` — `SLIDE_KEYS`, `INTRO_KEYS`, `ORDER_KEYS` kept; the 4 demo-tool words
  dropped; `PREVIEW_ONLY_KEYS` added (Step 8).
- `components/DemoApp/demoRoutes.ts` — both `settings/preferences` and `settings/orders`.
- `components/DemoApp1/screens/AddressFormScreen.tsx` — the real country only (S4-7); the field, the sheet row
  and the place sheet draw the flag through a local `RowFlag` (from `countryFlag.ts`).
- `components/DemoApp1/screens/DeliveryMethodSheet.tsx` — always a flag when known (`flag` or the new
  `flagSrc`), `marginInlineEnd` kept; `DeliveryPlace` gets the optional `flagSrc`.
- `components/DemoApp1/screens/PersonalInfoScreen.tsx` — the `ui-migrations` side; then the Step 5 port.
- `components/DemoApp1/screens/ProfileScreen.tsx` — the `ui-migrations` side (Orders opens the old page).
- `tests/app/smallRoutes.test.tsx` — one widget mock that reads `initialStep` / `exitTo`, both cases kept.
- `components/setting/profile/PersonalInfoForm.tsx`, `tests/components/setting/profile/PersonalInfoForm.test.tsx`
  — stay deleted (`git rm`).

Follow-up edits:

- `NewLoginDesign/SafariSplashGapLab.tsx` (Step 4) — rewritten to the fix only: modes `in-flow` and `off`;
  `resolveSafariSplashMode(ua)`; `buildSafariSplashCss` (inside `@layer utilities`); the prepaint script reads
  the user agent only; `useSafariSplashMode`; `useSafariSplashRuntime`; `SafariSplashBadgeRenderer` (in-flow
  only, band and clip line default). Removed: the debug menu, rulers, diagnostics, saved settings,
  `?safariFix=`, `pauseSplash`, `showRuler`, the 5 other modes. 15.6 KB source (5.1 KB gzip), was 12.4 KB gzip.
- `NewLoginDesign/AuthStage.tsx` (Step 4) — `data-pw="login-stage"`; optional `stageRef`, `slideKey`,
  `logoHidden` (default `false`, so `VerifyPhoneFlow` and `SessionExpiredWidget` do not change).
- `NewLoginDesign/QuickPreviewScreen.tsx` (Step 4) — the `pauseAutoExpand` prop removed.
- `components/DemoApp1/ScreenFrame.tsx` (Step 3) — `through` in `Leave` and the variants; `THROUGH` exported.
- `components/DemoApp1/countryFlag.ts` (Step 6, new) — `tr`/`sy`/`iq`/`lb` → design row flag, else
  `/icons/flag/<iso>.svg`.
- `components/DemoApp1/checkoutData.ts` (Step 6) — `deliveryPlace` spreads `countryFlag(countryIso)`.
- `app/(client)/[lang]/layout.tsx` (Steps 7, 8) — preconnect to `getMediaServerBaseUrl()`; the screen words
  skip `PREVIEW_ONLY_KEYS`.
- `UI-MIGRATION-PLAN.md` (Step 12) — "Where Stage 7e part 1 stopped".
- `app/(client)/[lang]/demo/settings/orders/[id]/page.tsx` — **outside the plan, owner's OK** (see
  Deviations).

## Changes prepared (uncommitted)

- All of the above, plus every other file of the 27 `development` commits as the merge brought them, staged
  on the branch. 138 files differ from `246536cea`. Every one is either in the `development` merge set
  (`ac30db094..9517cb02b`) or in `plan.md > Files to change`, plus the one approved file above (checked by
  comparing `git diff --cached --name-only HEAD` with both lists).

## Deviations from plan

1. **No merge commit here (IM-9).** Plan Step 3 said "commit the merge"; implement creates no commit. The merge
   stays in progress and `/wf:publish-pr` commits it.
2. **`AddressFormScreen` does not use `CountryRow`.** `CountryRow` (from `development`) takes only design
   flags and uses physical sides (`marginLeft`, `text-left`), and it is not in the file list. The
   `ui-migrations` row (same box, same numbers, logical sides) is kept, with the flag from `countryFlag.ts`.
3. **`DeliveryPlace.flag` keeps its type; `flagSrc` is added.** Changing `flag`'s type would have broken
   `CheckoutScreen.tsx` (`/demo`), which is not in the file list.
4. **Two more old email cases rewritten** (lines 277 and 297 of `profileScreens.test.tsx`, besides 250 and
   268): they counted `UpdateProfile` calls of the refused save that the port removes. Same file, same
   AC rows.
5. **Build fix in `app/(client)/[lang]/demo/settings/orders/[id]/page.tsx` (owner's OK, 2026-11-28).** The
   build failed: "client rendering was requested outside a Suspense boundary" on the fallback shell of
   `/sy-en/demo/settings/orders/[id]`. `dynamicParams = false` is refused with `cacheComponents` (Next docs,
   `migrating-to-cache-components.md`). Fix: `generateStaticParams` (the 2 demo orders) and `await params`
   at the top, as the real `settings/orders/[id]/page.tsx` does.
6. **Rework after verify failed (owner's OK, 2026-11-28):** 3 test files outside the plan got their
   expected media URLs updated to the single origin of `bfae3eb6e` (`<origin>/image/upload/...`); no app code
   changed. `tests/components/Notifications/NotificationItem.test.tsx` (2 cases: the row picture starts with
   the media image path and ends with its file), `tests/components/SellerDashboard/ShopInfo.test.tsx` (the
   banner address), `tests/components/SellerDashboard/productEdit/sections.test.tsx` (the group icon). Run:
   88/88 pass; typecheck 0 errors.
7. **P-3 (push before verify) not done here:** IM-9 forbids a push in implement. The owner decides how the
   preview checks run (see the end of this file).

## Tests written

| AC   | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | — | `git merge-base --is-ancestor` (run at verify; `MERGE_HEAD` = `9517cb02b` now) | existing (command) |
| AC-2 | `tests/components/NewLoginWidget.test.tsx` | the 7 existing cases | existing — confirmed, 7/7 pass |
| AC-3 | — | `git grep` for the demo tools in `*.ts` / `*.tsx`: no hit in app code | existing (command) — run, clean |
| AC-4 | `SignInRequestSheet.test.tsx`, `SignInSlides.test.tsx`, `QuickPreviewScreen.test.tsx`, `Demo1Shell.test.tsx` | from `development` | existing — run; `Demo1Shell.test.tsx` has 9 old reds (same on the base) |
| AC-5 | `tests/components/DemoApp1/profileScreens.test.tsx` | "a new e-mail opens the code sheet before any save, and the save never carries it" (replaces the line 250 case) | extend — **seen red** on the merged screen, green after the port |
| AC-6 | `tests/components/DemoApp1/profileScreens.test.tsx` | "after a right code, only the other changed fields are saved"; "after a right code, nothing more is sent when only the e-mail changed"; "a later save asks no second code for the e-mail a right code proved"; "the same e-mail in other capitals opens no sheet and asks no code"; "a cleared e-mail opens no sheet and asks no code"; "the core backend's 'verify the new email' answer still opens the sheet"; "closing the sheet without a right code saves nothing and keeps what was typed"; "shows a wrong code with the tries left, and saves nothing" (rewritten) | extend — 6 **seen red** first, 3 guards green before and after |
| AC-7 | `tests/components/SafariSplashGapLab.test.tsx` | dropped the settings and per-mode cases; added "an iPhone Safari 26 user agent gets in-flow, any other gets off", "only in-flow and off exist…", "a safariFix parameter and a saved setting do not change the mode", "no debug menu, ruler or badge is rendered"; kept the clip, `@layer`, prepaint, activate/teardown, untouched-Chrome cases | extend — 10/10 pass |
| AC-8 | `tests/components/NewLoginWidget.test.tsx` | "on iPhone Safari 26, while the splash waits, the widget is marked waiting with mode in-flow and the stage carries data-pw=login-stage" | extend — pass; plus the WebKit check |
| AC-9 | `tests/app/layout.test.tsx`; `AppHomeView.test.tsx`, `homeData.test.ts`, `useHomeData.test.tsx` (2), `useShellData.test.tsx` | "opens an early connection to the single media origin"; the variable switched to `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (the `homeData` logo case now checks the `/image/upload/` path) | extend + update — pass |
| AC-10 | `tests/components/DemoApp1/profileScreens.test.tsx`; `tests/components/DemoApp1/checkoutData.test.ts` | "the page's country row shows the design's Syria flag"; "a country with no design flag shows its standard flag"; new file: "gives the design flag for tr/sy/iq/lb and the standard flag otherwise", "gives no flag when the address has no country code" | extend + new — pass |
| AC-11 | `tests/components/DemoApp1/profileScreens.test.tsx` | "the Orders card opens the old orders page (D-17)" | extend — pass |
| AC-12 | `tests/utils/fetchData.test.ts`, `tests/public/firebaseMessagingSwTags.test.ts` | from `development` | existing — pass |
| AC-13 | `OrderDetailsWrapper.test.tsx`, `OrderItemOptions.test.tsx`, `OrderItemReturnConfirmationWindow.test.tsx` | from `development` | existing — pass |
| AC-14 | — | lint, parity, typecheck, build | existing (commands) — see below |
| AC-15 | `tests/app/layout.test.tsx` | "the real layout skips the preview-only words" + the measurements | extend — pass; numbers below |

Shared-part files also run: `NewLoginScreensRtl`, `NewLoginWidgetReducedMotion`, `NewLoginLogo`,
`VerifyPhoneFlow`, `SessionExpiredWidget`, `AppShell`, `AppShell.screens`, `smallRoutes`, `mediaUrl`,
`tinyUtils`, `server/helpers` — all pass except the old reds below.

## Findings — confirmed bugs, out of scope

none

The 13 old red tests (`tests/utils/tinyUtils.test.ts` ×4, `tests/components/DemoApp1/Demo1Shell.test.tsx` ×9)
fail the same way on the base `246536cea` (run in a temporary worktree of `246536cea`, removed after). They
are stale tests already counted among the old reds the plan leaves to Stage 8, not bugs found by this
ticket's tests.

## Review follow-ups (binding, `review.md`)

- **P-1** — done. WebKit, iPhone Safari 26 user agent, real `/sy-en/login`, 6 s after load: no fixed or sticky
  box touches the bottom edge (`bottomFixed: []`). Real iPhone: not yet.
- **P-2** — done. 60 words of `ORDER_KEYS` + `INTRO_KEYS` checked against the code: `All`, `Recipient`,
  `+ Add`, `Medium 38`, `usd` are used by real screens and stay out of `PREVIEW_ONLY_KEYS`. The other hits
  are old pages that read the translation files (not the word list).
- **P-3** — not done in implement (IM-9). Owner's decision needed.
- **P-8** — budget written at Step 1. Login: met. Home: **not met, +1,838 B** (see below).

## Validation run during implementation

- `pnpm lint:i18n-parity` — pass (3015 keys in all three files).
- `node_modules/.bin/tsc --noEmit` (after `next typegen`) — 0 errors.
- `pnpm lint` — exit 0, 0 errors (69 warnings).
- `pnpm build` — exit 0 (third run; the first two failed on the demo orders `[id]` page, Deviation 5).
- `pnpm exec vitest run <file>` on every declared file and the shared-part files: all pass except the 13 old
  reds named above.
- Full unit suite: not run locally (owner's rule, low memory); CI run at verify.
- Speed (Step 1 → Step 11, production build, Chromium 430 x 932, 4x CPU, median of 5):
  - `/sy-en/login`: JS 396,623 → 400,245 B (+3,622); first paint 484 → 540 ms.
  - `/sy-en`: JS 370,974 → 372,812 B (+1,838); first paint 560 → 652 ms.
  - First paint runs vary 348–2,220 ms on this laptop; the medians are within that noise.
- WebKit splash check (`s7e-splash.cjs`): mode `in-flow`, `<main>` relative, stage `contain: none`, frame-0
  style and badge present, no debug menu, no bottom fixed box. Chromium unchanged.
- `/demo` side by side with `development`'s Vercel preview of `9517cb02b` (`s7e-demoflow.cjs`,
  `s7e-diff.py`): same steps; differences only the removed "Lab" pill, animation frames and the Home slider.
- Not done: the flags in a browser in `en` / `ar`; the real sign-in and 3-wrong-codes lock on the preview.
