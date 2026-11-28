---
ticket: ui-migrations-7e-merge
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-11-28
links:
  clickup:
  github:
---

# Research — ui-migrations-7e-merge

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Bring `development` (to `9517cb02b`) into `ui-migrations` with every conflict solved the way the plan's
Stage 7e asks; port `b48a3e999` into the new Personal Info screen; and remove the splash lab's debug parts
on `ui-migrations` while keeping the Safari 26 fix.

How this was checked: a test merge with `git merge-tree --write-tree origin/ui-migrations origin/development`
(tree `b6d1afa14`, read only, nothing written to any branch), `git show` / `git diff` on both branches, and
the files of `ui-migrations` (checked out in the main folder at `246536cea`).

## Relevant directories

- `NewLoginDesign/` — the login screens. `development` added the country-picker step, `previewSlides.tsx`,
  `SafariSplashGapLab.tsx` (1168 lines), and changed `NewLoginWidget`, `QuickPreviewScreen`, `NewLoginLogo`,
  `AuthLogoLayer`, `authLayout.ts`. On `ui-migrations`, Stage 2 moved the slide stage and the logo layer out
  of `NewLoginWidget` into `AuthStage.tsx`, and Stage 1 deleted the demo tools (`DemoDeviceInfoModal.tsx`,
  `LogoAnimationModal.tsx`, commit `142b6c24e`).
- `components/DemoApp1/` — the shell and screens. On `ui-migrations`, `Demo1Shell.tsx` gave its slide variants
  to `ScreenFrame.tsx` and its nav to `screenNav.ts`. The real app draws screens through `ScreenMount.tsx` →
  `AppScreenView.tsx`, where each screen is its own `next/dynamic` chunk, and only paths listed in
  `appScreenPaths.ts` (`APP_SCREENS`) are taken by the mount.
- `components/DemoApp/` — `demoKeys.ts`, `demoRoutes.ts`, `demoPlaces.ts`, `xdIcons.ts`, new `demoOrders.ts`.
- `components/setting/orders/` — the old orders pages, still the live orders UI on `ui-migrations`.
- `utils/` — `fetchData.ts` (session fixes), new `mediaUrl.ts`, `server/helpers.ts`, `tinyUtils.tsx`,
  new `server/httpObservability.mjs`.
- `scaling/` — `AppScaler.tsx`, `Page.tsx` (the splash fix adds an `inDocument` prop, default `false`).
- `tests/` — the unit suite. It follows the source path (`tests/<same path as the source>.test.ts(x)`).

## Relevant config files

- `.env.example`, `.env.server.example` — `bfae3eb6e` removes `NEXT_PUBLIC_BASE_MEDIA_URL` and
  `NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL`; only `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` stays.
- `package.json`, `pnpm-lock.yaml` — `cc6f0f605` adds one dependency (observability).
- `knip.json`, `vitest.config.mts` — small changes from `cc6f0f605` and `bfae3eb6e`.
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `server.mjs`,
  `observability/prometheus/targets/trydos-storefront.json` — new server setup files. Not protected paths.
- No protected runtime path (`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts`,
  `.github/workflows/**`) is changed by any of the 27 commits (checked with `git diff --name-only`).

## Findings

### F-1. Conflicts of the test merge (9 files, 35 hunks, plus 1 file deleted on one side)

| File | Hunks | What each side has |
|---|---|---|
| `NewLoginDesign/NewLoginWidget.tsx` | 12 | `ui-migrations`: the real flow (store, `AuthService`, GA events, OTP locks, `?next=`, `AuthStage`, names, `leave`). `development`: demo control bar (`showControls`, `hideMenu`, `belowButtonMin`/`abovePill` tuning, device info), the logo picks saved in `localStorage` (`readStoredConfig`), the `country-picker` step and `countryPicker` prop, the splash lab hooks, the prepaint `<script>`, `<main data-splash-waiting data-safari-splash-mode>`, the stage `<div data-pw="login-stage">` inline, `AuthLogoLayer hidden`. |
| `components/DemoApp1/Demo1Shell.tsx` | 9 | `ui-migrations`: imports from `ScreenFrame`/`screenNav`, `MotionConfig reducedMotion="user"`, `DemoKeyboard`, RTL `move`. `development`: the start flow (`signing`, `picking`, `barHeld`, `askSignIn`, `SIGN_IN_ASK_MS = 5000`, `IntroBlank`, `SignInRequestSheet`), the `THROUGH` fade (`through` in `Leave`), and its own copy of the slide variants. |
| `components/DemoApp/demoKeys.ts` | 3 | `development` adds `SLIDE_KEYS`, `INTRO_KEYS`, `ORDER_KEYS`, and also re-adds 4 demo-tool keys that Stage 1 removed: "Hide menu", "Device and browser info", "Tab bar colour", "Reset tab bar colour". |
| `components/DemoApp/demoRoutes.ts` | 1 | `ui-migrations`: `settings/preferences`. `development`: `settings/orders`. |
| `components/DemoApp1/screens/AddressFormScreen.tsx` | 3 | `ui-migrations`: only the URL's country (S4-7), flag from `/icons/flag/<iso>.svg`. `development`: `CountryRow` over the 4 demo countries, XD flag icons. |
| `components/DemoApp1/screens/DeliveryMethodSheet.tsx` | 1 | `ui-migrations`: `place.flag &&`, `marginInlineEnd` (RTL). `development`: always a flag, `marginRight`. |
| `components/DemoApp1/screens/PersonalInfoScreen.tsx` | 3 | `ui-migrations`: real store, `auth.SendEmailOtp`/`VerifyEmailOtp`, `useProfileData`. `development`: demo data and demo send/check. |
| `components/DemoApp1/screens/ProfileScreen.tsx` | 1 | `ui-migrations`: `onClick={card.open}` (real; Orders opens the old orders page). `development`: wallet / orders demo routes. |
| `tests/app/smallRoutes.test.tsx` | 2 | `ui-migrations`: the `/login` page case (A-24, Arabic title). `development`: the `/loginDemo?from=demo` case. |
| `components/setting/profile/PersonalInfoForm.tsx` + its test | modify/delete | Deleted on `ui-migrations` (Stage 4); `development` changed them in `b48a3e999`. |

All other files merge with no conflict, among them the 3 translation files (+55 keys each), `QuickPreviewScreen.tsx`
(not changed on `ui-migrations` since `ac30db094`), `ui.tsx`, `ListingParts.tsx`, `fetchData.ts`,
`firebase-messaging-sw.js`, `components/setting/orders/*`, `scaling/*`.

### F-2. A file that merges clean but is wrong after the merge: the media preconnect

`app/(client)/[lang]/layout.tsx` line 169 exists only on `ui-migrations`:
`const mediaBase = process.env.NEXT_PUBLIC_BASE_MEDIA_URL; if (mediaBase) preconnect(...)`. After
`bfae3eb6e` that variable is gone from the env files, so the preconnect to the image host silently stops. Its
comment says each late connection costs about 0.25 s, so this is a speed loss (rule S7e-9). The new helper is
`utils/mediaUrl.ts`.

### F-3. Tests on `ui-migrations` that set the removed media variable

`tests/components/DemoApp1/AppHomeView.test.tsx:44`, `homeData.test.ts:27`, `useHomeData.test.tsx:63` and
`:154`, `useShellData.test.tsx:26` set `process.env.NEXT_PUBLIC_BASE_MEDIA_URL`. After the merge,
`GetImageUrl` reads `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (through `utils/mediaUrl.ts`), so these tests will
most likely fail. `bfae3eb6e` made the same update to the tests on `development`.

### F-4. The splash lab: debug parts and fix parts

Source: `NewLoginDesign/SafariSplashGapLab.tsx` on `development`.

- **Mode choice.** `resolveSafariSplashMode`: a saved mode wins; else `in-flow` on iPhone Safari 26+
  (`isFloatingBarSafari`), `off` elsewhere. So the fix that shoppers get by default is **`in-flow`** only.
- **Fix parts** (used by the default path): `buildSafariSplashCss('in-flow')` with every rule inside
  `@layer utilities` (`9517cb02b`); `buildSafariSplashPrepaintScript` (frame-0 `<style>`, user-agent check);
  `useSafariSplashRuntime`; `SafariSplashBadgeRenderer` (the waiting badge, with the clip line
  `DEFAULT_CLIP_DESIGN_Y = 66` and the band `DEFAULT_BAND_PX`); `NewLoginLogo` `coverBottomY` (white
  half-disc); `AuthLogoLayer hidden`; `AppScaler`/`Page` `inDocument`; the `<main>` attributes
  `data-splash-waiting` and `data-safari-splash-mode`.
- **Debug parts:** `SafariSplashDebugMenu` (shown whenever mounted, except under `NODE_ENV === 'test'`, in
  every browser); `RulerTicks`, `SafariRulerProbe`, `readDiagnostics`; the settings in `localStorage`
  (`SAFARI_SPLASH_STORAGE_KEY`, `readSafariSplashSettings`/`writeSafariSplashSettings`); `?safariFix=` in
  both `readSafariSplashSettings` and the prepaint script; `pauseSplash`; `showRuler`; the other 5 modes
  (`fixed-0w`, `body-layer`, `scroll-nudge`, `sticky-0w`, `lvh-canvas`), which nothing selects once the hand
  switch is gone.
- **DOM names the fix CSS needs:** `[data-pw="new-login-widget"][data-splash-waiting]`, `#app-outer`,
  `#master-canvas`, `[data-pw="login-stage"]`. On `ui-migrations`, `NewLoginWidget.tsx:545` has
  `data-pw="new-login-widget"` and `AppScaler` has `#app-outer` / `#master-canvas`, but **no element has
  `data-pw="login-stage"`**: Stage 2 moved the stage into `AuthStage.tsx` without that name. The rule that
  sets `contain:none; overflow:visible` on the stage would then match nothing.
- Tests: `tests/components/SafariSplashGapLab.test.tsx` (210 + 21 lines) tests the lab, debug parts included.

### F-5. The email fix (`b48a3e999`) against the new screen

- `ui-migrations` `PersonalInfoScreen.tsx` lines 113–143: `changedFields()` sends `email` when
  `email !== profile.email` (a raw compare, so a change of capitals alone counts) and the sheet opens only on
  `EmailVerificationRequiredError` (the 400 of backend PR #699, not live).
- `b48a3e999` logic to port: `newEmailOf` (normalised compare), open the sheet before any save, never send
  the new email in the profile save, `provedEmail` so a later save asks no second code, the 400 as a second
  net. The new screen has **no phone field** (fields: name, email, gender), so the old form's "new phone and
  new email" case does not apply.
- `EmailCodeSheet.onVerified(email)` already passes the saved address (line 63, 168).
- Existing tests that describe the old behaviour, in `tests/components/DemoApp1/profileScreens.test.tsx`:
  line 250 "sends a new e-mail, and opens the code sheet when the core backend wants a code" (expects the
  email in `UpdateProfile`) and line 268 "does not open the code sheet when the core backend takes the save".
  Both become wrong after the port. Line 277 (the rest is sent without the email) stays true.

### F-6. Fixes that come with the merge (Step 2)

- `140b3aea9`, `60fd710af` (`utils/fetchData.ts`): they read `shouldAuthinticated` with the markers
  `"expired"`, `"expired-login"`, `"seller"`. `ui-migrations` uses the same markers
  (`store/auth/reducer.tsx:10`, `components/Login/SessionExpiredWidget.tsx:17`), so the fixes apply as they are.
- `c2a6720e0` (`public/firebase-messaging-sw.js`): opens `/settings/orders/<order_group_id>`. That route exists
  on `ui-migrations` (`app/(client)/[lang]/settings/orders/[id]/page.tsx`, the old page).
- `22de7f5e9` (`components/setting/orders/OrderDetailsWrapper.tsx`, `OrderItemOptions.tsx`,
  `confirmations/OrderItemReturnConfirmationWindow.tsx`): merges clean; these files are unchanged on
  `ui-migrations` since `ac30db094`.
- `bfae3eb6e`: see F-2 and F-3. Local `.env.preview` already has `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`; the
  Vercel project env cannot be read from this machine (no Vercel CLI).
- `0d93cd90a`, `490632f97`, `cc6f0f605`: new files plus one header line in `app/api/proxy/route.ts`, the
  request logger, `ServerFetch.tsx`. No UI.
- `38617d539`: adds `customer-email-otp-frontend-guide.md` and login code covered by F-1.

### F-7. Small shared changes (Step 7)

- `Sheet keepHeight` (`components/DemoApp1/ui.tsx`) and `ListingParts keepLinks`: merge clean; the only
  user of `keepHeight` is `SignInRequestSheet` (demo, made real in part 2). No real screen changes.
- Syria's row flag (`flagSyRow.svg`, `xdIcons.ts`): the XD flag set has `tr`, `sy` (`flagSyRow`), `iq`, `lb`
  only; `public/icons/flag/` has every ISO code. The real address form and delivery sheet use the real
  country, so they need both (F-1, OQ-5).
- The slide texts: `previewSlides.tsx` is new; the 6 texts and "Slide" are in the 3 translation files.

### F-8. Speed (S7e-9)

- The demo order screens and the sign-in sheet enter only `Demo1ScreenView` / `Demo1Shell` (the `/demo`
  route). The real mount loads screens by `next/dynamic` from `AppScreenView`, keyed by `APP_SCREENS`. So the
  merge adds nothing to the real pages' first load except what the login page imports.
- The login page (`/login`) will import `SafariSplashGapLab.tsx`. Its debug parts (menu, rulers, 5 modes) are
  most of its 1168 lines (F-4).
- F-2 removes an early connection unless the preconnect moves to the new helper.

### F-9. `/demo` on `ui-migrations`

`ui-migrations` keeps `/demo` as the design reference. To keep it the same as `/demo` on `development`
(S7e-1), the start flow of `Demo1Shell` and the `through` fade must go in. `through` is not in
`components/DemoApp1/ScreenFrame.tsx` (its `Slide` type has `fade` only, lines 53, 69, 97).

## Possibly affected services

- **core** backend — the email code (`send-otp`, `verify-otp`, `update-profile`) for Step 3.
- **media server** — every image URL changes source variable (`bfae3eb6e`).
- **market (core / gateway)** — the session-expired hold in `fetchData` changes when market calls go out.
- Firebase push — the "order placed" click target.
- No change to chat, stories, comments, wallet or search.

## Test / validation commands available

From `.claude/project-config.yaml` (not run here):

- `pnpm lint` — ESLint, with the i18n rules.
- `node_modules/.bin/tsc --noEmit --pretty false` — typecheck (CI runs `next typegen` first).
- `pnpm lint:i18n-parity` — the 3 translation files are key-parallel.
- `pnpm test:run` — Vitest unit suite. The plan's rule of 2026-11-04: no full local run (low memory); full suite in CI with `gh workflow run Tests --ref <branch>`.
- `pnpm build` — production build.
- Profiles: `ui-change`, `logic-change`, `full`.

**Test layout and naming:** `tests/` mirrors the source path; files are `*.test.ts` / `*.test.tsx`; runner
Vitest (`--project unit`); components render with Testing Library; every assertion carries a message
(`docs/claude/testing-rules.md`). Expected-failure marker in Vitest: `it.fails(...)`, with the `BUG-n` id in
the name. The browser suite is ignored in every stage (A-34).

## Risks and unknowns

- **`NewLoginWidget.tsx` merge** — high impact, high likelihood of a mistake: 12 hunks on two different
  structures (`AuthStage` vs inline stage). A lost line breaks the real login (GA events, OTP lock, `?next=`).
- **Splash fix lost in the move to `AuthStage`** — medium likelihood (F-4: no `data-pw="login-stage"`).
  It shows only on an iPhone with Safari 26, so a desktop check will not find it.
- **Demo tools coming back** — medium: `development` re-adds demo-only keys and the login control bar (F-1).
- **Media variable** — F-2 and F-3; if the Vercel preview lacks `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, every
  image on the preview breaks.
- **Hidden semantic breaks** — files that merge clean but call changed code (for example `services/auth.ts`,
  changed by both `efeb565ec` and `bfae3eb6e`). Typecheck and the CI unit suite are the net.
- **Tests that `development` brings** may assume `development`-only structure (for example
  `tests/components/QuickPreviewScreen.test.tsx`, `SignInRequestSheet.test.tsx`, `SafariSplashGapLab.test.tsx`).
  Unknown until CI runs on the merge.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | After the debug parts go, are the 5 unused splash modes (`fixed-0w`, `body-layer`, `scroll-nudge`, `sticky-0w`, `lvh-canvas`) deleted too, keeping only `in-flow` and `off`? | Nothing can select them once the hand switch is gone (F-4), so they are dead code; they are also most of the bytes the login page loads (F-8). |
| OQ-2 | Which test rule applies to the Step 3 port: the plan's rule of 2026-11-04 (no new unit tests), or the repo rule (a test seen red first)? And do the 2 existing tests that describe the old behaviour (F-5, lines 250 and 268) get rewritten in this ticket? | The 2 tests will fail after the port; the plan must declare every test change (PL-13). |
| OQ-3 | Does the Vercel project env of the `ui-migrations` preview have `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`? | Without it every image on the preview breaks after the merge (F-2, F-6). It cannot be read from this machine. |
| OQ-4 | Does the media preconnect in `app/(client)/[lang]/layout.tsx` move to `utils/mediaUrl.ts` in this ticket? | Without it the early connection to the image host stops (F-2), a speed loss against S7e-9. |
| OQ-5 | In the real address form and delivery sheet, which flag shows for the real country: the XD row flag when the set has one (`tr`, `sy`, `iq`, `lb`), else `/icons/flag/<iso>.svg`? | S7e-1 wants the design's flags; the real country can be one with no XD flag (F-7). |
| OQ-6 | Do the demo tools that `development` brings back stay out of `ui-migrations` (the 4 demo-tool keys, the login control bar, `DemoDeviceInfoModal`, `LogoAnimationModal`, the logo picks in `localStorage`)? | Stage 1 removed them on purpose (`142b6c24e`); a plain merge brings parts back (F-1). |
| OQ-7 | Does `/demo` on `ui-migrations` take the full start flow of `development` (country picker, login layer, sign-in sheet, the `through` fade in `ScreenFrame.tsx`)? | `/demo` is the design reference for parts 2 and 3; if it differs from `development`, S7e-1 has no single reference (F-9). |
| OQ-8 | Do the 5 tests that set the removed media variable (F-3) get updated in this ticket? | They will most likely fail in CI after the merge; a test change must be declared in the plan. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- The test merge used `git merge-tree`, which writes only objects to the git database and changes no branch,
  index or file.
