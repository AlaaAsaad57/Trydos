---
ticket: round-price-convert-then-round
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Verify — round-price-convert-then-round

> Final validation and impact review before the ticket is closed.

Branch `ticket/round-price-convert-then-round`, working tree as `implement.md`
left it (23 modified files + `tests/harness/expectedBagFigure.test.ts`). No
implementation file was edited here (VF-7) and no commit was made (VF-10). The
checks wrote no tracked file: git showed the same 24 changed paths before and
after every run.

## Checks performed

- Validation profile: `full` (`.claude/project-config.yaml`, pre-existing) —
  `lint`, `typecheck`, `unit-tests`, `build`.
- Declared tests (VF-11) ran as one command, with a JSON report written outside
  the repository:
  `npx vitest run tests/utils/functions.test.ts tests/utils/server/helpers.test.ts tests/harness/expectedBagFigure.test.ts tests/components/Cart/OrderButton.test.tsx tests/components/products/ProductCard/index.test.tsx --reporter=json`
  → **exit 0**; 5 files, 233 tests passed, 0 failed; all 23 declared cases
  `passed`.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | helpers.test.ts + functions.test.ts: "charged: 69.9998 at rate 100 with 2 decimals is 6999.98, as text and as a number (AC-1)" | declared-tests command above | 0 | both copies return 6999.98 (number and shown text) | met |
| AC-2  | both files: "charged: 0.1 at rate 0.2 with 1 decimal is 0.1, never more decimals than the currency (AC-2)" | declared-tests | 0 | 0.1 in both copies | met |
| AC-3  | both files: "charged: rounds up after the rate — 1.2345 at rate 3 is 3.71; 10.001 at rate 1 is 10.01 (AC-3)" | declared-tests | 0 | 3.71 and 10.01 in both copies | met |
| AC-4  | helpers.test.ts: "display rule is unchanged: 69.9998 at rate 100 is 7000, 1.2345 at rate 3 is 3.72 (AC-4)" + existing "multiplies without the usual decimal drift" (0.02); functions.test.ts: "display rule is unchanged: 7000, 3.72, 0.02 (AC-4)" | declared-tests | 0 | 7000 / 3.72 / 0.02 in both copies | met |
| AC-5  | both files: "8.3 at rate 1 with 2 decimals stays 8.3 in both rules (AC-5)" | declared-tests | 0 | 8.3 in both rules and copies (server copy was 8.31 before) | met |
| AC-6  | functions.test.ts: "the browser copy and the server copy give the same figure, rule by rule (AC-6)" | declared-tests | 0 | 11 inputs × rule agree, incl. 150000 → 150K | met |
| AC-7  | both files: "with rate 1 the charged rule gives the same figures as the display rule (AC-7)" + the existing rate-1 display cases in both `RoundPrice` blocks | declared-tests | 0 | 0, 99999, 100K, 1000K, 1M, 2.5M, أ/م, NaN → 0, 26, 1235 unchanged | met |
| AC-8  | functions.test.ts: "(a) nothing passed and nothing saved: both copies give 26 and 100K"; "(b) the server copy never reads the saved currency"; "(b) the browser copy on the server never reads the saved currency"; existing "multiplies without the usual decimal drift" (browser, saved rate 3 → 0.3) | declared-tests | 0 | 26 / 100K in both; server-side calls give 0.1 with a saved rate of 3 | met |
| AC-9  | functions.test.ts: "every RoundPrice call on a charged screen passes charged: true"; "no RoundPrice call on a display screen passes charged"; OrderButton.test.tsx: "at rate 100 shows 6999.98 for 69.9998, the amount the backend charges"; ProductCard/index.test.tsx: "at rate 100 shows 7000 for 69.9998, the display figure" | declared-tests | 0 | 16 charged files / 31 live calls carry the flag; 15 display files carry none; bag shows 6999.98, card shows 7000 | met |
| AC-10 | expectedBagFigure.test.ts: the three cases (6999.98, 0.1, 3.71) | declared-tests | 0 | the browser suite's helper follows the charged rule | met |

Profile checks:

| Check | Command (from `validation_checks`) | Exit | Output summary |
|-------|-----------------------------------|------|----------------|
| `lint` | `pnpm lint` | 0 | 0 errors, 78 warnings in 49 files — none of them a file this ticket changed |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no errors |
| `build` | `pnpm build` | 0 | production build completed; the new import from `utils/functions.tsx` into `utils/server/helpers.ts` did not break the server/client boundary |
| `unit-tests` (run 1) | `pnpm test:run` | **1** | 637 files; 7097 passed, 4 expected fail, **1 failed**: `tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx > BoutiqueEditor — loading > shows the boutique name, icon, Active pill and id once the edit form loads` ("the other language's banner was not warmed in the cache") |
| `unit-tests` (run 2) | `pnpm test:run` | **1** | 637 files; 7097 passed, 4 expected fail, **1 failed**: `tests/components/Notifications/NotificationsPanel.test.tsx > the notifications panel list > loads the first page on open, more on scroll, and says when there is no more` ("Unable to find an element with the text: notice 3") |

**Why the red `unit-tests` runs do not fail this ticket.** Every declared test
passed with exit 0. The three full-suite runs made with this change (one at
`implement`, two here) each had exactly one failure, a different test each time,
and all three live outside `plan.md > Files to change`:

| Test | Uses `RoundPrice`? | Alone with the change | Alone on the untouched `development` code |
|------|--------------------|-----------------------|--------------------------------------------|
| `tests/components/global/compare.test.tsx` (implement run) | display call site, not edited | 1 fail in 3 | **1 fail in 6** |
| `tests/components/Notifications/NotificationsPanel.test.tsx` (run 2) | no | 1 fail in 4 | **1 fail in 8** (same case) |
| `tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx` (run 1) | no | 0 fail in 4 | 0 fail in 8 — fails only under full-suite load |

Two of the three fail on the untouched code; the third has no path to the price
rule and fails only under load. The CI run on `development` this morning
(`Tests` 35968694257) was also red on an unrelated timing test. So these are
pre-existing flaky tests, recorded below as findings, not this ticket's failure.

## Commands run

- Declared tests: `npx vitest run <the 5 declared files> --reporter=json --outputFile=$TEMP/rp-verify/declared.json` → exit 0.
- `pnpm lint` → exit 0.
- `node_modules/.bin/tsc --noEmit --pretty false` → exit 0.
- `pnpm test:run` → exit 1 (run 1), exit 1 (run 2) — see above.
- `pnpm build` → exit 0.
- Flakiness checks: `npx vitest run tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx` ×4 (all pass);
  `npx vitest run tests/components/Notifications/NotificationsPanel.test.tsx` ×4 (1 fail);
  both files together ×8 with this change stashed (`git stash push … / git stash pop`, 23 files restored) → 1 fail (NotificationsPanel).

## Integration surface — did it hold?

- **Server/client boundary** — held: `build` exit 0 with `utils/functions.tsx`
  importing `utils/server/helpers.ts`.
- **Lockstep** — held: the app rule and `tests/e2e/actions/cart.ts >
  expectedFigureFor` changed in the same working tree; AC-10 proves the helper
  now follows the charged rule. The live suite itself was not run here (it does
  not gate this ticket).
- **Display screens** — held: the call-site check shows no display file passes
  `charged`; the listing card still shows 7000 at rate 100. The two intended
  display changes named in the plan (8.3 no longer lifted to 8.31 in the server
  copy; a server-side rate of 0 falls back to 1) are covered by AC-5 and AC-8.
- **Not verified here (review X-1):** the bag was not compared with a real
  staging charge. "Bag = charge" rests on the owner's OQ-1 answer.

## Findings — confirmed bugs, out of scope

`implement.md` recorded no `BUG-n`. This run found three pre-existing flaky
tests, all outside `plan.md > Files to change`. They are recorded as `FLAKY-n`,
not `BUG-n`: the evidence shows flaky tests, not wrong app behaviour.

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------------------|--------|
| FLAKY-1 | The compare page test sometimes finds an empty search box | `tests/components/global/compare.test.tsx::the compare page > loads both products named in the address and puts them side by side` (no marker — flaky, not a proven bug) | the test's timing (1 fail in 6 on untouched code) | "Shirt" vs "" | _(to open)_ |
| FLAKY-2 | The notifications panel test sometimes misses the third notice after a scroll | `tests/components/Notifications/NotificationsPanel.test.tsx::the notifications panel list > loads the first page on open, more on scroll, and says when there is no more` | the test's timing (1 fail in 8 on untouched code) | "notice 3" shown vs not found | _(to open)_ |
| FLAKY-3 | The boutique editor test sometimes sees no preloaded banner under full-suite load | `tests/components/SellerDashboard/boutiqueEdit/BoutiqueEditor.test.tsx::BoutiqueEditor — loading > shows the boutique name, icon, Active pill and id once the edit form loads` | the test's timing (passes alone 12 of 12) | `b2-ar.webp` preloaded vs `[]` | _(to open)_ |

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **no** (the
  project has no observability runtime files; no protected runtime path was
  touched).

## Sign-off

- Outcome: **verified** — every `AC-n` met by a declared test with exit 0; the
  verify comprehension gate passed 3/3 (`comprehension.md`, attempt 1).
- Final ticket state: completed
- Sign-off: developer (owner)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: open follow-ups for the owner — FLAKY-1..3; review finding S-3 (a file
  calling `RoundPrice` that is on neither list passes silently); review finding
  X-1 (compare the bag with a real staging charge at rate 100).
