---
ticket: unit-tests-product-detail-data
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-03
links:
  clickup:
  github:
---

# Implement — unit-tests-product-detail-data

Branch `ticket/unit-tests-product-detail-data`, cut from `develop` at
`4ba72c69` (this repository overrides the plugin's `main` default). Edits are
**uncommitted** — publishing belongs to `/wf:publish-pr` (IM-9).

## Baseline, re-recorded at branch time

`review.md` carried this as a condition, and it mattered: the intake figure was
already wrong.

| | Files | Tests | Commit |
|---|---|---|---|
| Recorded at intake | 140 | 2245 passed, 7 skipped | `f300600e` |
| **Re-recorded at branch time** | **145** | **2300 passed, 7 skipped** | **`4ba72c69`** |
| After this change | 146 | 2341 passed, 7 skipped | working tree |

The second session added 5 files and 55 tests while this ticket was in review.
Comparing `/verify` against the intake figure would have credited this ticket
with their work.

**Recorded here rather than by editing `intake.md`.** That artifact belongs to a
closed stage; rewriting it would leave a completed record disagreeing with what
it originally said. `/verify` should read this table.

## Harness probe — follow-up action 1, carried out first

Before any of the real cases, a throwaway probe exercised the five mechanisms
the plan rests on **together**, then was deleted. Six cases, all passing, 2.30s:

1. `vi.hoisted()` set `NEXT_PUBLIC_SITE_URL` before `Constants.ts` froze it —
   `General_Site_Data.url` read back as the stub, not the real staging host.
2. The module loaded through `await import()` with no TDZ `ReferenceError`.
3. `headers.__reset()` genuinely turned a seeded verified shopper back into a
   guest between two cases — proved by the routing flipping core → gateway.
4. The `mockReset()` sweep drained a queued `mockResolvedValueOnce`.
5. The search stand-in answered by `index`, not call order.

Every one of these was a mechanism claim that a review round had already
corrected once. None failed here, so the plan's harness design was sound as
approved.

## Files changed

| File | Disposition | What changed |
|---|---|---|
| `tests/serverRequests/product.test.ts` | new | 37 cases across nine `describe` blocks |
| `tests/fixtures/product.ts` | extend | `buildGlobalProduct`, `buildQtyPriceProduct` and their two local interfaces |
| `tests/fixtures/fixtures.test.ts` | extend | two names on the `./product` import, two rows in `BUILDERS` |

No application file was edited. `serverRequests/product.tsx` was read only, so
`C-1` holds by construction. **No protected runtime path was touched** — none of
`proxy.ts`, `next.config.ts`, `instrumentation*.ts`, `sentry.*.config.ts` or
`.github/workflows/**` appears above.

## Tests written

Every row of `plan.md > Tests` was carried out. `AC-1`–`AC-31`, `AC-37` and
`AC-38` are `new` in `tests/serverRequests/product.test.ts`; `AC-32` was
`existing` and nothing was written for it; `AC-33`–`AC-36` were `none` with a
stated reason and remain so.

The two builders carry no `AC-n` of their own and are covered by the shared
guard, which now runs its three checks over them like every other builder.

## Deviations from the plan

1. **37 cases, not the 33 the plan estimated.** Four rows each covered two
   things that can fail independently, so each got its own case rather than two
   assertions in one: `AC-8` (guest → gateway, verified → core backend),
   `AC-17` (a short description replaced, a real one kept), `AC-29` (credential
   sent, credential absent) and `AC-31` (a group with an unseen story, a group
   without one). Same acceptance criteria, same single file, no new file — finer
   granularity, so a failure names the half that broke. Not scope creep under
   `IM-4`, but recorded because the plan named a number.
2. **The baseline was written here, not into `intake.md`** — see above.
3. **The timing budget is exceeded.** See Findings, `OBS-1`.

## Findings

### BUG-1 — confirmed, not fixed

**Scenario.** When the ratings query fails, `GetProductGeneralData` falls back to
a set of zero values built as `{ _source: { final_rating: 0, … } }`, while the
caller reads the unwrapped shape (`source?.final_rating`). None of the fallback
values is reachable, so `undefined` reaches the page instead of the zeros the
fallback was written to supply.

**Where it lives.** `serverRequests/product.tsx:377-405` (the wrapped return)
against `:441-456` (the unwrapped reads).

**Expected vs actual.** Expected `final_rating: 0` and `size_analysis: null`;
actual `undefined` for both.

**Confirming test.** `tests/serverRequests/product.test.ts` ›
`GetProductGeneralData` › `AC-23 BUG-1: a failed ratings query leaves the
fallback figures unreachable`.

**Shown to be strict, both ways** — the plan required this, because a case that
reports "pass" for a state it cannot see is the failure mode this whole ticket
was reviewed against:

- Flipping the assertion to the fixed expectation (`.toBe(0)`) fails with
  `AssertionError: BUG-1 appears fixed: the ratings fallback now reaches the
  caller as a rating: expected undefined to be +0` — one test failed, the right
  one.
- Breaking a stand-in instead (removing the views answer) fails on a
  **different** assertion — `the views query should be unaffected by a failed
  ratings query: expected +0 to be 9`. So the case distinguishes "the defect is
  still here" from "my stand-in is broken", which is precisely what
  `it.fails()` could not do.

**Out of scope to fix.** `serverRequests/product.tsx` is not under
`plan.md > Files to change`, so `IM-12` makes this a finding. The owner opens
the follow-up ticket, which must update this case in the same change.

### BUG-2 — confirmed, not fixed

**Scenario.** The fetch layer never raises; on a refused request it returns an
envelope carrying `error` and a status. `GetGlobalProduct` and
`GetProductPriceQtyDetails` never inspect it — they spread its empty data and
return an object shaped like a product with no id and **no signal the caller can
read**. The fault is reported to error tracking, but nothing reaches the caller,
so a dead backend is indistinguishable from a product that does not exist.
`GetProductMeta`, in the same file, checks the envelope correctly.

**Where it lives.** `serverRequests/product.tsx:143-208` and `:210-266`, against
`:270-290` which gets it right.

**Confirming tests.** `AC-37 BUG-2: a refused request returns a record with no id
and no signal the caller can read`, and `AC-38 BUG-2: a refused request returns
the price payload hollow, with no signal`.

**Out of scope to fix** — same reason as BUG-1.

### OBS-1 — the timing budget as written is exceeded

`plan.md > Validation strategy` set `tests ≤ ~400ms` and `collect ≤ ~1.5s`. The
file measures **370ms on one run and 640ms on another**, same file, same
machine — so the budget is exceeded and the figure is noisy at this scale.

Cause: in this file the module load happens inside the first case (`await
import()`), so it lands in the `tests` figure. In
`tests/utils/server/tokenManager.test.ts`, the file the 400ms was derived from,
vitest reported that cost separately under `import` (621ms). The two numbers
were never comparable, and the budget inherited that mistake.

Full-file measurement for the record: **Duration 2.28s — transform 703ms, setup
1.14s, import 158ms, tests 640ms.** No `collect` figure is reported for a
single-file run, so that half of the budget cannot be read as written either.

Not fixed here: changing the budget means changing the approved plan. `/verify`
should either reset it from this measurement or record the criterion as not
provable as worded.

## Validation

Profile `logic-change`, all three checks run, all exit zero.

| Check | Command | Result |
|---|---|---|
| lint | `pnpm lint` | exit 0 — 0 errors, 76 warnings (pre-existing; the gate does not use `--max-warnings 0`) |
| typecheck | `next typegen` then `tsc --noEmit --pretty false` | exit 0 |
| unit tests | `pnpm test:run` | exit 0 — **146 files, 2341 passed, 7 skipped** |

`i18n-parity` is not in the profile and could not fail here: no translation file
is touched and the i18n lint rules are off for `*.test.*`.

## Notes

- Nothing is committed and nothing is pushed (`IM-9`).
- The `[MarketRouting]` lines printed by the real backend chooser are expected —
  roughly one per routing case, naming backends by role. Noise, not a fault.
- No credential, phone number or real host appears in any assertion, fixture or
  seeded value. Every host is a `.invalid` name; the verified profile is seeded
  with the marker `"verified-shopper"`, since the app's check accepts any
  non-empty value.
