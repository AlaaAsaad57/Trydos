---
ticket: unit-tests-product-detail-data
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-03
result: PASSED
links:
  clickup:
  github:
---

# Verify — unit-tests-product-detail-data

Branch `ticket/unit-tests-product-detail-data`. **No implementation file was
edited and no commit was created at this stage** (VF-7 / VF-10).

## Validation profile — `logic-change`, run at verify time

Commands resolved from `.claude/project-config.yaml > validation_checks`. All
read-only.

| Check | Resolved command | Exit | Summary |
|---|---|---|---|
| lint | `pnpm lint` | **0** | 0 errors, 76 warnings — all pre-existing; the gate does not use `--max-warnings 0` |
| typecheck | `pnpm exec next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` | **0** | no output |
| unit tests | `pnpm test:run` | **0** | **146 files passed, 2343 passed, 7 skipped** |

The declared tests all ran through this profile. `pnpm test:run` is
`vitest run --project unit` — the non-writing mode.

### A red run that was investigated, not waved through

The **first** `pnpm test:run` at this stage exited 1 with one failure:
`tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx › what a running
cooldown is telling the shopper › reads as 'we would not send it' after a send
that was refused`.

It was confirmed **not caused by this change**, three ways, before being set
aside:

1. That file imports **none** of the three files this ticket touches — checked
   by grep, not assumed.
2. Run alone it passes **23/23, twice**.
3. A second full run is green — exit 0, 2343 passed.

Cause: a timer/cooldown case (1185ms) flaking under contention. The contention
was real and observable — a second session was writing into this shared working
tree while the suite ran, and the total test count rose from 2341 to 2350
mid-run. Nothing was skipped, loosened or retried to make it green.

## Acceptance criteria — all 38, depth `all-ac`

Every criterion below is proved by a named case in
`tests/serverRequests/product.test.ts` unless stated otherwise. All 37 cases in
that file pass.

| AC | Evidence | Result |
|---|---|---|
| AC-1 | `GetCountries` › serves a cached list — asserts the fetch stand-in was never called | PASSED |
| AC-2 | `GetCountries` › asks on a miss and keeps the answer — asserts `RedisSet("countries-sy-en", …)` | PASSED |
| AC-3 | `GetCountries` › empty list **and** the `/countries` address was asked | PASSED |
| AC-4 | `GetGlobalProduct` › cached record, `globalFromRedis: true`, no backend call | PASSED |
| AC-5 | `GetGlobalProduct` › fresh read, `globalFromRedis: false` | PASSED |
| AC-6 | `GetGlobalProduct` › both the slug key and the record key written | PASSED |
| AC-7 | `GetGlobalProduct` › `noCache` skips the read, still writes back | PASSED |
| AC-8 | Two cases — guest reaches `gateway.invalid`, verified shopper reaches `core.invalid`, decided from the seeded profile through the **real** chooser | PASSED |
| AC-9 | `GetGlobalProduct` › a raising cache is reported and re-raised | PASSED |
| AC-10 | `GetProductPriceQtyDetails` › cached payload, `qtyPricesDataFromRedis: true` | PASSED |
| AC-11 | `GetProductPriceQtyDetails` › price 100, offer 80, quantity 5 and the variant list all survive | PASSED |
| AC-12 | `GetProductPriceQtyDetails` › a raising cache is reported and nothing returned — the difference from AC-9 pinned | PASSED |
| AC-13 | `GetProductMeta` › a 404 gives `productNotFound: true` | PASSED |
| AC-14 | `GetProductMeta` › a refused request is reported, not called "not found" | PASSED |
| AC-15 | `GetProductMeta` › colour and size appear in the title | PASSED |
| AC-16 | `GetProductMeta` › brand and category appended | PASSED |
| AC-17 | Two cases — a one-word description replaced, a real one kept exactly | PASSED |
| AC-18 | `GetProductMeta` › falls back to `https://site.invalid/opengraph-image.png` | PASSED |
| AC-19 | `GetProductMeta` › cached copy served, no backend call | PASSED |
| AC-20 | `GetProductGeneralData` › no id returns the empty shape, search server never asked | PASSED |
| AC-21 | `GetProductGeneralData` › star spread becomes rating groups with counts | PASSED |
| AC-22 | `GetProductGeneralData` › a 404-shaped rejection gives zero views and is **not** reported | PASSED |
| AC-23 | **BUG-1** confirmed — see Findings. Strictness proved both ways | PASSED (as a confirmed defect, VF-12) |
| AC-24 | `GetRecommendationCountForProduct` › 75% / 25% from the two totals | PASSED |
| AC-25 | `GetRecommendationCountForProduct` › "0" and zero buyers, no division by zero | PASSED |
| AC-26 | `GetSocialInfoForProduct` › likes 12, shares 6, comments 4 from three sources | PASSED |
| AC-27 | `GetSocialInfoForProduct` › two interactions supplied, and the `interaction_date: desc` sort asserted — a single hit would prove only "reads a hit" | PASSED |
| AC-28 | `GetProductCommentsCount` › the `must_not` clauses in the query asserted, not the count | PASSED |
| AC-29 | Two cases — credential sent for a signed-in shopper, absent for a guest | PASSED |
| AC-30 | `GetProductStoriesData` › a refused request gives empty lists | PASSED |
| AC-31 | Two cases — a group with an unseen story marked new, an all-seen group not | PASSED |
| AC-32 | No real I/O. `onUnhandledRequest: "error"` never fired; the cache cut held (the probe proved it reaches this module). No socket opened | PASSED |
| AC-33 | Read: every host is a `.invalid` name; the profile is seeded with the marker `"verified-shopper"`; the stories credential is an invented literal; index names come from the imported constants. No credential, phone number or real host appears | PASSED |
| AC-34 | Read: all 37 cases carry a message, and every backend-crossing message names the backend by role. No message names the stack | PASSED |
| AC-35 | Read: no case reads a clock, a timezone or a duration; four environment values pinned (three stubbed, one hoisted) | PASSED |
| AC-36 | Profile exits zero, and the file is cheap — see the measurement below. One half of its wording is not readable as stated; recorded as `OBS-1` | PASSED, with a recorded defect in the criterion's wording |
| AC-37 | **BUG-2** confirmed on the main record read — see Findings | PASSED (as a confirmed defect, VF-12) |
| AC-38 | **BUG-2** confirmed on the price payload — see Findings | PASSED (as a confirmed defect, VF-12) |

**All 38 criteria met.** No criterion is unproven and none was skipped.

## The timing measurement, and a correction to `implement.md`

`implement.md > OBS-1` reported the file's `tests` figure as 370–640ms and
called the budget exceeded. **That was based on two samples, one of them taken
under load. Five clean runs give a different picture:**

| Run | 1 | 2 | 3 | 4 | 5 | median |
|---|---|---|---|---|---|---|
| `tests` | 422ms | 403ms | 352ms | 352ms | 365ms | **365ms** |

Total `Duration` 1.68s–1.91s; `transform` 444–534ms; `import` 107–187ms. The
640ms figure was an outlier while the other session was writing to the tree.

Against the plan's `tests ≤ ~400ms`: the median is inside it and the worst of
five is 5% over a figure written with a tilde. **The budget holds.** The
correction is recorded here rather than by editing `implement.md`, which belongs
to a closed stage (VF-7).

**`OBS-1` survives in a narrower form.** The other half of the budget,
`collect ≤ ~1.5s`, names a figure vitest does not report for a single-file run —
it reports `import` instead. The *intent* is met and then some (`import` +
`transform` ≈ 550–720ms, well under 1.5s), but the criterion cannot be read
literally. A wording fix for a later ticket, not a failure here.

## Findings

Both defects were confirmed by tests **before** any fix, and neither is fixed
here: the wrong behaviour lives in `serverRequests/product.tsx`, which is not
under `plan.md > Files to change`. Under IM-12 / VF-12 that makes each a finding
plus a follow-up ticket, and a `BUG-n` confirmed this way does not fail this
stage.

### BUG-1 — the ratings fallback can never reach the caller

**Scenario.** `GetProductGeneralData`'s inner ratings query returns `res._source`
on success but `{ _source: { final_rating: 0, … } }` on failure, while the caller
reads the unwrapped shape. When the search server refuses, `undefined` reaches
the page instead of the zeros the fallback was written to supply.

**Where.** `serverRequests/product.tsx:377-405` against `:441-456`.

**Expected vs actual.** Expected `final_rating: 0`, `size_analysis: null`;
actual `undefined` for both.

**Confirming test.** `AC-23 BUG-1: a failed ratings query leaves the fallback
figures unreachable`.

**Shown strict, both ways.** Flipping the assertion to the fixed expectation
fails with `AssertionError: BUG-1 appears fixed: the ratings fallback now
reaches the caller as a rating: expected undefined to be +0` — one test, the
right one. Breaking a stand-in instead fails on a **different** assertion:
`the views query should be unaffected by a failed ratings query: expected +0 to
be 9`. So the case tells "the defect is still here" apart from "my stand-in is
broken" — which is exactly what `it.fails()` could not do, and why the plan
stopped using it.

### BUG-2 — a refused request returns a hollow product with no signal

**Scenario.** The fetch layer never raises; on a refusal it returns an envelope
carrying `error` and a status. `GetGlobalProduct` and
`GetProductPriceQtyDetails` never inspect it, spread its empty data, and return
an object shaped like a product with no id and nothing the caller can read.
`GetProductMeta`, in the same file, checks the envelope correctly — so the three
readers disagree.

**Where.** `serverRequests/product.tsx:143-208` and `:210-266`, against
`:270-290`.

**Confirming tests.** `AC-37` and `AC-38`. `AC-38` originally had the very
silent-pass defect these reviews were hunting — all three of its assertions
checked for `undefined`, so every one would also have passed had the reader
returned nothing. A positive assertion (`qtyPricesDataFromRedis === false`) was
added at implement so the case proves an object came back before checking what
it lacks.

### OBS-1 — one half of AC-36's budget names a figure the runner does not emit

Narrowed above. No action here.

## Integration surface — did it hold?

The plan named the shared fixture and its guard as the only shared things
touched. It held:

- `tests/fixtures/product.ts` gained two builders and two local interfaces, and
  **imports nothing from `serverRequests/product`** — so `C-6` holds and the four
  unrelated test files that use this fixture load no server-only module. All four
  still pass in the full run.
- `tests/fixtures/fixtures.test.ts` gained the two names on its `./product`
  import and two `BUILDERS` rows, so the new builders get the same three checks
  as every other builder — including the independence check. `C-7` holds.
- `tests/utils/server/tokenManager.test.ts` still proves the backend chooser in
  isolation; this file proves the same decision through the reader. Both pass.

## Work by another session in the same tree

Recorded because it affects delivery, not this verification. The shared working
tree carries uncommitted edits that are **not part of this ticket**:
`NewLoginDesign/NewLoginWidget.tsx`, `NewLoginDesign/logoScreenConfig.ts`,
`NewLoginDesign/useLogoSequence.tsx` and `tests/components/logoSequence.test.tsx`.
The owner has said to ignore them. They were not touched here.

**`/wf:publish-pr` must stage by path** — the three files listed in
`implement.md > Files changed` — and never `git add -A`.

## Result

**PASSED.** All 38 acceptance criteria met, the validation profile exits zero on
all three checks, and the comprehension gate passed 3/3 (administered short
under CG-8 — see `comprehension.md > degraded`).

Two confirmed defects, `BUG-1` and `BUG-2`, are open findings outside this
plan's files and each needs its own ticket. Neither fails this stage (VF-12).

## Follow-up actions

1. Open `BUG-1` and `BUG-2` fix tickets. Each must update its confirming case in
   the same change as the fix, or the suite goes red on a passing test.
2. Open the queued items: `FIND-2`, `FIND-3`, `FIND-4`, `FIND-5`, and
   `unit-tests-product-comments-data`.
3. `OBS-1` — correct `AC-36`'s wording in a later ticket so both halves name
   figures the runner actually reports for a single-file run.
