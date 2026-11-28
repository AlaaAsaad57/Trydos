---
ticket: ui-migrations-7e-merge
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Verify — ui-migrations-7e-merge

> Final validation and impact review before the ticket is closed.

**Round 2** (after the implement rework). Round 1 failed on AC-14: 4 unit tests still expected the old
media URL; the owner allowed their update in implement (`implement.md`, Deviation 6). This round: every
`AC-n` checked again; the full unit suite has no failure the base does not have.

## Checks performed

- Validation profile: `full` (lint, typecheck, unit-tests, build), plus `pnpm lint:i18n-parity`.
- `unit-tests` ran locally (owner's choice, 2026-11-28): CI needs a pushed commit, which only
  `/wf:publish-pr` makes.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | merge contents | `git rev-parse MERGE_HEAD`; `git merge-base --is-ancestor 9517cb02b MERGE_HEAD`; `git merge-base --is-ancestor 246536cea HEAD` | 0, 0 | `MERGE_HEAD` = `9517cb02b`, `HEAD` = `246536cea`; the merge commit is made by `/wf:publish-pr` (IM-9 / VF-10) | met |
| AC-2 | `NewLoginWidget.test.tsx` (7 existing cases incl. "locks the boxes after three wrong codes…") + a real sign-in | full suite; `xd-parity/perf/s7e-signin.cjs` on a local production build against staging, test account `TEST_ACCOUNT_PHONE` / `TEST_ACCOUNT_OTP` (owner's choice) | file pass; script 0 | Real `/sy-en/login?next=/sy-en/settings`: Quick Preview → Get Started → sign in → number → SMS → code → landed on `/sy-en/settings` with `MARKET-TOKEN` and `User-Data`. The 3-wrong-codes lock was **not** tried on the shared staging account (it can lock the number for the e2e suite); the unit case covers it | met |
| AC-3 | demo tools absent | `git grep -E '<tools>\|<4 words>' -- components NewLoginDesign app` | 1 | no hit; 0 of the 4 words in `demoKeys.ts` | met |
| AC-4 | sign-in sheet / slides / Quick Preview / `Demo1Shell` tests + side by side | full suite; `s7e-demoflow.cjs` + `s7e-diff.py` against `development`'s preview of `9517cb02b` | files pass except 9 old `Demo1Shell` reds | same steps in the same order; diffs = removed "Lab" pill, animation frames, Home slider | met |
| AC-5 | `profileScreens.test.tsx` "a new e-mail opens the code sheet before any save…" | full suite | pass | seen red before the port (implement) | met |
| AC-6 | `profileScreens.test.tsx` 8 email cases | full suite | pass | 6 seen red before the port, 3 guards green before and after | met |
| AC-7 | `SafariSplashGapLab.test.tsx` | full suite | pass | 10/10 | met |
| AC-8 | `NewLoginWidget.test.tsx` AC-8 case + WebKit check | full suite; `s7e-splash.cjs` | pass | iPhone Safari 26 UA on real `/sy-en/login`: `in-flow`, `<main>` relative, stage `contain: none`, no bottom fixed box; Chromium unchanged | met |
| AC-9 | layout preconnect case; 4 media-variable files; + 3 media-shape files (rework) | full suite | pass | all pass | met |
| AC-10 | flag cases in `profileScreens.test.tsx`; `checkoutData.test.ts` | full suite | pass | design flag for tr/sy/iq/lb, standard flag otherwise; the rows use logical sides (`marginInlineStart` / `marginInlineEnd`, `text-start`). No browser run in `ar` | met (by tests and code) |
| AC-11 | "the Orders card opens the old orders page (D-17)" | full suite | pass | — | met |
| AC-12 | `fetchData.test.ts`, `firebaseMessagingSwTags.test.ts` | full suite | pass | — | met |
| AC-13 | the 3 order-details test files | full suite | pass | — | met |
| AC-14 | lint | `pnpm lint` | 0 | 0 errors, 69 warnings | pass |
| AC-14 | typecheck | `next typegen`; `tsc --noEmit --pretty false` | 0 | 0 errors | pass |
| AC-14 | i18n parity | `pnpm lint:i18n-parity` | 0 | 3015 keys in all three files | pass |
| AC-14 | build | `pnpm build` | 0 | from implement; since then only 3 test files and docs changed (no app code), so not re-run | pass |
| AC-14 | unit-tests | `pnpm test:run` (2nd run, after the rework) | 1 | 639 files: 622 pass, 17 fail; 8175 tests: 8121 pass, **53 fail**, 1 expected fail. The 53 are exactly the base's 53 old reds (same tests fail on `246536cea`); **0 new**, 0 fixed | met ("no failure the base did not have") |
| AC-15 | before/after numbers; layout word-filter case | `s7e-speed.cjs`, `s7e-attr.cjs`; full suite | pass | login JS +3,622 B (budget met). Home JS +1,838 B: measured, none of it is login or splash code; it is merged `development` code in shared files (the XD icon map's order icons, the demo order routes, the session hold, the media origin). **The owner accepted it (2026-11-28, "Accept, no trim")** after the estimate that a trim could win only about 0.3–0.5 KB | met by owner decision |

## Commands run

- `pnpm test:run --reporter=default --reporter=json` (2nd run)
  ```
  Test Files  17 failed | 622 passed (639)
  Tests  53 failed | 8121 passed | 1 expected fail (8175)
  compare with the base 53: not in base 0; base reds that pass now 0
  ```
- `pnpm lint:i18n-parity` → 0; `tsc --noEmit` → 0 (0 errors); `pnpm lint` → 0 (0 errors).
- `node s7e-signin.cjs http://localhost:3005` → landed on `/sy-en/settings`, `MARKET-TOKEN` true, `User-Data` true.
- `node s7e-attr.cjs http://localhost:3005 /sy-en` → load-time scripts with merged markers: the icon map
  (`flagSyRow`), the routes (`settings/orders`), the shared chunk (`/image/upload`, `expired-login`); no
  login, splash or slide code.

## Integration surface — did it hold?

- `AuthStage` (shared with `VerifyPhoneFlow`, `SessionExpiredWidget`): their tests pass. Held.
- `AppScaler` / `Page` `inDocument`: `AppShell*` tests pass; Chromium login unchanged. Held.
- `utils/fetchData.ts`, the push worker: tests pass. Held.
- `GetImageUrl` + the single media variable: held after the rework (3 more test files updated).
- `[lang]` root layout (preconnect, word list): tests pass. Held.
- `DEMO_KEYS`, translations: parity passes; P-2 words stay. Held.
- `DeliveryPlace`: typecheck and `checkoutData.test.ts` pass. Held.
- Outside the declared surface: the demo orders `[id]` page (build) and the shared icon map / routes
  (home JS size). Both recorded above.

## Findings — confirmed bugs, out of scope

none — `implement.md` has no `BUG-n`, and this run confirmed none.

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? Only by the approved merge:
  `observability/prometheus/targets/trydos-storefront.json` (new, `cc6f0f605`, FR-14).
- `server.mjs` `GET /metrics` is open in code and blocked only by an Nginx rule (review P-5); Vercel does not
  run `server.mjs`.

## Sign-off

- Outcome: verified, pending the comprehension gate (`comprehension.md`, stage `verify`)
- Final ticket state: completed on `passed`
- Sign-off: developer (owner)
- Commit: none created at verify (VF-10); `/wf:publish-pr` makes the merge commit and the PR to `ui-migrations`
- Notes: still open for the owner after publish — the splash on a real iPhone; the flags in a browser in `ar`.
