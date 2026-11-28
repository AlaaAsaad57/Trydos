---
ticket: ui-migrations-7e-start-flow
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Verify — ui-migrations-7e-start-flow

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `full` (lint, typecheck, unit-tests, build), `pre-existing` in
  `.claude/project-config.yaml`; plus `pnpm lint:i18n-parity` (plan: NFR-4, AC-20).
- `unit-tests` ran as the declared files, one run, locally (owner's rule of 2026-11-04: the full
  suite runs in CI). CI needs the branch pushed, so it is an open item (AC-20).
- The browser evidence is the final production build of this tree, recorded in `implement.md`
  (`xd-parity/perf/s7e2-real.cjs`, `s7e2-signin.cjs`, `s7e2-compare.cjs`, `s7e2-speed.cjs`). No
  source file changed after that build; verify's own `pnpm build` passed on the same tree.

Declared-files command (D): `npx vitest run tests/components/Home/Init.test.tsx
tests/components/DemoApp1/AppStartFlow.test.tsx tests/components/DemoApp1/AppSignInAsk.test.tsx
tests/components/DemoApp1/ShellStartCover.test.tsx tests/components/Home/NavbarClient.test.tsx
tests/components/DemoApp1/AppShell.test.tsx tests/store/homepageReducer.test.ts tests/app/layout.test.tsx
tests/components/DemoApp1/SignInRequestSheet.test.tsx tests/components/DemoApp1/SignInSlides.test.tsx
tests/components/NewLoginWidget.test.tsx tests/components/settings/PersonalInfoCountries.test.tsx`
→ **exit 1**: 12 files, 129 tests, 127 pass. The 2 failures are the old page-lock cases of
`homepageReducer.test.ts` (finding F-A below), not declared cases. Every declared case passed by
name (`--reporter=verbose`).

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Init: start flow on gb / changed-country / no-country; none on a country address with no flag | D | 1 (F-A only) | 4 cases ✓ | met |
| AC-2 | AppStartFlow: crawler gets no flow, Instagram is not a crawler; AppSignInAsk: crawler gets no request; browser: Googlebot on `/gb-en` | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 3 cases ✓; widget 0, cover 0, sheet 0, HTML ends `</html>` | met |
| AC-3 | white cover first (server render), ShellStartCover ×2, layout gb-only case; browser: cover before first paint | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 4 cases ✓; cover 6,640 ms ≤ first paint 7,032 ms (cold), earlier run 358 / 488 ms | met |
| AC-4 | rows = list, nothing chosen; standard flag; Syria in ar; browser rows tr, sy, iq, lb | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 3 cases ✓; browser ✓ | met |
| AC-5 | changed-country two rows, new one chosen; tap the other; map country outside takes no tap; browser same | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 3 cases ✓; browser ✓ (rows tr, sy; sy chosen; Iraq tap changed nothing) | met |
| AC-6 | pick saves cookies, no page load; browser: cookies sy/en/en, 0 loads; starter settings on the new address `x-country=sy` (the clarified check, review-approved) | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 1 case ✓; browser ✓ | met |
| AC-7 | end address same path, flags gone; never gb; stays on site; bad changed-country ignored; browser end on `/sy-en` with no flags, no flow again | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 4 cases ✓; browser ✓ | met |
| AC-8 | NewLoginWidget tests unchanged; real staging sign-in from the flow (wrong code answered, right code signs in) | D; `s7e2-signin.cjs` | 1 (F-A) / 0 | file ✓; sign-in ✓ (User-Data + MARKET-TOKEN, landed `/sy-en`) | met |
| AC-9 | failed list → retry reads again; empty list → skeleton rows; Init passes `loadFailed` | D | 1 (F-A) | 3 cases ✓ | met |
| AC-10 | `git grep PopupCountry` → only e2e files and 3 docs; PersonalInfoCountries tests pass | `git grep -n PopupCountry`; D | 0 / 1 (F-A) | popup and its test deleted; settings page tests ✓ | met |
| AC-11 | guest at 5 s once; signed-in never; not before the profile is known | D | 1 (F-A) | 3 cases ✓; browser: sheet 5.4–5.9 s after load | met |
| AC-12 | not on login / loginDemo / demo; on an old page and a product page; browser `/about` yes, `/login` no | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 2 cases ✓; browser ✓ | met |
| AC-13 | no second canvas (NavbarClient); waits for search/chat/sheet, field focus, session check; browser: waits while typing | D; `s7e2-real.cjs` | 1 (F-A) / 0 | 4 cases ✓; browser ✓ | met |
| AC-14 | sheet tests (Safari 26 gap, card line); `/demo` compare | D; `s7e2-compare.cjs` + `s7e2-diff.py` | 1 (F-A) / 0 | tests ✓; Chromium `en` 0.00–0.08 %, `ar` 0.2–0.6 % | **met in Chromium; WebKit open (O-1)** |
| AC-15 | login layer opens and closes with no route change, page colour back (red first); bar room kept (red first); real sign-in from the sheet | D; `s7e2-signin.cjs`; `s7e2-real.cjs` | 1 (F-A) / 0 | cases ✓; sign-in: same document, scroll 463 → 463, `<body>` = `<html>` colour, signed in | met |
| AC-16 | Later/backdrop close; More Info → onMoreInfo; not a button on `/demo`; "Soon available"; browser toast | D; `s7e2-real.cjs` | 1 (F-A) / 0 | cases ✓; toast "Soon Available" | met |
| AC-17 | local production builds: base `/gb-en` no end in 40 s; guard-only and final builds end in under 1 s; Vercel build | curl (`--noproxy "*"`, `MSYS_NO_PATHCONV=1`) | 0 | local ✓; `vercel deploy` failed at upload | **met locally; Vercel open (O-2)** |
| AC-18 | speed before/after on 3 pages | `s7e2-speed.cjs` (4x CPU, median of 5) | 0 | `/sy-en` +5,351 B, `/sy-en/about` +5,368 B (budget 1,024 B); `/gb-en` now loads | **not met — accepted by the owner** |
| AC-19 | layout intro words case; picker compare 3 sizes × 2 engines × en/ar; Safari 26 WebKit check | D; `s7e2-compare.cjs`; `s7e2-real.cjs` | 1 (F-A) / 0 | case ✓; `en` 1.1–2.1 % (pill moment, dev "Lab" pill); `ar` 2.3–5.0 % (RTL rows on purpose, Arabic pill); no fixed box at the bottom edge | met, differences written |
| AC-20 | lint, i18n parity, typecheck, build; CI unit run | `pnpm lint`; `pnpm lint:i18n-parity`; `node_modules/.bin/tsc --noEmit --pretty false`; `pnpm build` | 0 / 0 / 0 / 0 | 0 errors (69 warnings, none here); 3015 keys; no type errors; build ✓ | **met except CI (O-3)** |

**Integration surface held:**
- `/demo` keeps its look: the Chromium pickers in `en` differ only by the pill moment and the
  removed Lab pill. The 9 `Demo1Shell` reds are the same 9 as on the base.
- The session-expired widget waits while a layer is open (NavbarClient case).
- `CoverBox` still covers on the client (the page-cover tests pass).
- The proxy's `_bypass` contract works: the end lands on `/sy-en` with no flags, and the cookies are kept.

## Commands run

- `pnpm -s lint:i18n-parity`
  ```
  ✓ i18n parity OK — 3015 keys present in all three files.   (exit 0)
  ```
- `pnpm build`
  ```
  exit 0
  ```
- `pnpm -s lint`
  ```
  ✖ 69 problems (0 errors, 69 warnings)   (exit 0; none in this ticket's files)
  ```
- `node_modules/.bin/tsc --noEmit --pretty false`
  ```
  (no output)   (exit 0)
  ```
- Command D above
  ```
  Test Files 1 failed | 11 passed (12)   Tests 2 failed | 127 passed (129)   (exit 1)
  × setIsNavigating unlocks the page scroll when navigation ends
  × setLoginOpen locks the page when the login opens and unlocks it at the top when it closes
  ```

## Findings — confirmed bugs, out of scope

`implement.md` carried no `BUG-n`. This run confirms one stale-test finding outside this ticket's files:

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------------------|--------|
| F-A | The page lock sets `overflowY` since `2ac93ccae` (on purpose, so the inline `overflow-x` stays); two old cases still read the `overflow` shorthand | `tests/store/homepageReducer.test.ts` :: "setIsNavigating unlocks the page scroll when navigation ends", "setLoginOpen locks the page…" (no marker; red on `a4e31b857` too, seen by stashing this ticket's edits) | `utils/tinyUtils.tsx` `DisableScroll` / `EnableScroll` (not in `plan.md > Files to change`) vs the stale test | test expects `overflow` "hidden" / "initial"; the code sets `overflowY` | _(to open; likely Stage 8, with part 1's `tinyUtils` page-lock reds)_ |

### Open items the owner accepted (2026-11-28, "Pass with exceptions")

- **O-1 (AC-14).** Compare the sign-in request in WebKit on the PR preview (https). Locally WebKit
  drops the `Secure` guest cookies on `http://localhost`, so the profile never loads.
- **O-2 (AC-17).** curl `/gb-en`, `/gb-ar`, `/sy-en?no-country=true` on the PR preview: each must end
  with `</html>` within 10 s and show the start flow.
- **O-3 (AC-20).** `gh workflow run Tests --ref ticket/ui-migrations-7e-start-flow` after the push;
  allowed reds: the 9 `Demo1Shell`, the `tinyUtils` page-lock reds, F-A.
- **O-4 (AC-18).** Not met: +5.35 KB of first-load JS on pages with no flow; accepted as is.
- Also open, not an AC: a real iPhone run (Safari 26 bottom logo with the start cover); the e2e
  `country-popup` selectors (Stage 8).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? No.
- Protected runtime paths (`proxy.ts`, `next.config.ts`, instrumentation, Sentry, workflows): not changed.

## Sign-off

- Outcome: verified (with the owner's accepted exceptions O-1..O-4)
- Final ticket state: verified
- Sign-off: developer — 2026-11-28 (comprehension gate 5/5, `comprehension.md`)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery boundary's job,
  owned by `/publish-pr`)
- Notes: the owner allowed implement to touch files outside the plan to close review findings;
  every such file is listed in `implement.md > Deviations`.
