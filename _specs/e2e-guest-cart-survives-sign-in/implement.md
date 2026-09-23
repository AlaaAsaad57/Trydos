---
ticket: e2e-guest-cart-survives-sign-in
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Implement — e2e-guest-cart-survives-sign-in

> Record of what was actually built, following `plan.md` revision 3 and the
> **Required Follow-up Actions** in `review.md` (the owner's "mitigate at
> implement" dispositions).

Branch: `ticket/e2e-guest-cart-survives-sign-in`, cut from a clean `development`
at `19945401` (equal to `origin/development`). The two commits that landed on
`development` after research (`3c3114ec`, `19945401`) touch none of the files
below.

## Changes made

- `tests/e2e/actions/cart.ts`
  - `watchCartAdd` reads `x-market-backend` before the body and exposes
    `backend()`. `said()` names the real backend (`backendInWords`), quotes only
    `success` / `message` (`quoteCartAnswer`), falls back to the first 400
    characters of a non-JSON body **redacted in full before the cut**, and the
    whole text goes through `redact()` (review C-1, C-2). "the core backend was
    never asked" → "the cart backend was never asked".
  - `addOpenProductToBag` returns `backend` (`""` on the not-addable path); its
    throw no longer says "the core backend said" — `said()` names the backend.
  - `addQaProductToBag` returns `{ bought, backend }`.
  - `CartMoneyAnswer` gains `success: boolean | null` (review S-1) and
    `backend: string`; `watchCartMoney` reads the label before the body and
    writes both into `said`.
  - New `bagLineNames` (one `allTextContents()` call), `bagLineQuantity`
    (checks `count()` before `inputValue()`, review P-3), `GoodRead` and
    `waitForGoodRead` (per-call timeout from the deadline; `after` moves on
    past every `401`, review S-2; `sentAtMark` baseline so "never asked" is
    told apart, review S-4).
- `tests/e2e/selectors.ts` — new `cart.orderBar` (`order-bottom-button`). Its
  comment says it means "the drawer's own read has finished", **not** "the read
  succeeded" (review S-1).
- `tests/e2e/shopper.live.spec.ts`
  - Header: case list with BUY-05; cost section for BUY-05 and the note that the
    teardowns empty the shared shopper's whole bag; the code section now says
    **four** codes per run (BUY-01, BUY-03, two by BUY-05).
  - New `openBagAndProveCoreRead` helper, `GOOD_READ_MS`, `ORDER_BAR_MS`,
    `backendNamed`.
  - New `test.describe("BUY-05 a guest's bag survives sign-in")` with its
    `afterEach` and the case, nine `test.step`s as the plan lists.
- `docs/testing/E2E_SCENARIOS.md` — case count 114 → 115; money-path summary row
  BUY-01 to BUY-05; the "Per run they cost" paragraph and the code paragraph
  (four codes; BUY-03 signs in for itself); a BUY-05 paragraph and table row.

## Rework after the failed verify (round 2)

`verify.md` round 1 failed AC-5 on a test fault: the S-1 check read a body
field `success` that neither backend sends. The wire carries `isSuccessful`
(`{"isSuccessful":true,"code":200,…}`, from the server's request log of that
run); the app's `success` is made in the browser by `fetchData` from the HTTP
status (`utils/fetchData.ts:784`). Fixed in the same files:

- `tests/e2e/actions/cart.ts` — `CartMoneyAnswer.success` renamed to
  `isSuccessful` and read from the body's `isSuccessful`; `said` writes
  `isSuccessful=`. `quoteCartAnswer` (the add's message) quotes `isSuccessful`
  instead of `success`. Comments say why.
- `tests/e2e/shopper.live.spec.ts` — `openBagAndProveCoreRead` checks
  `answer.isSuccessful`; its comment and message say `isSuccessful`.
- `docs/testing/E2E_SCENARIOS.md` — the BUY-05 row says `isSuccessful: true`.

Branch unchanged (`ticket/e2e-guest-cart-survives-sign-in`, resume path). After
the change: `tsc --noEmit` exit 0; `eslint` on the three test files exit 0; no
bare LF line endings.

## Changes prepared (uncommitted)

- `tests/e2e/actions/cart.ts` — backend label, redaction, `success`, three new
  readers.
- `tests/e2e/selectors.ts` — `cart.orderBar`.
- `tests/e2e/shopper.live.spec.ts` — BUY-05 and the header.
- `docs/testing/E2E_SCENARIOS.md` — the BUY-05 row and the cost text.
- `_specs/e2e-guest-cart-survives-sign-in/` — this ticket's artifacts.

## Deviations from plan

1. **Review follow-ups applied** (owner's disposition "mitigate at
   `/wf:implement`", `review.md > Required Follow-up Actions`), all inside the
   planned files:
   - **S-1 / S-3** — the good-read proof in steps 5.6 and 5.9 is: bounded
     `waitForGoodRead` → `cart.orderBar` visible → poll until
     `seen("shipping") >= sent("shipping")` → judge `last("shipping")`: status
     `200`, `success === true`, `backend === "core"`. It lives in one
     spec-local helper, `openBagAndProveCoreRead`, used by both steps, rather
     than in `cart.ts` — it is BUY-05's own rule and has no other caller.
   - **S-2, S-4, P-3, C-1, C-2** — in `cart.ts` as listed above.
   - **P-2** — the teardown's signed-in branch calls
     `testInfo.setTimeout(testInfo.timeout + 2 * 60 * 1000)` before
     `emptyTheBag`.
   - **P-1** — the "Time budget" table is in `plan.md`, which implement may not
     edit. The case carries the short form instead ("Fifteen minutes is a
     limit, not a sum of every worst-case wait"). The two missing rows
     (`waitForRenewalSettled`, the waits inside `emptyTheBag` /
     `removeLineNamed`) stay recorded in `review.md`.
   - **C-3, C-4** — process rules for `/verify` (probe grep on the working tree
     and `HEAD`; every re-run counts against the code budget). Nothing to write
     in code; carried to `/verify`.
2. **`waitForGoodRead`'s shape.** Plan step 3 named the return `{ answer, sent,
   seen401 }`. Built as `{ answer, sentSinceMark, refused }` with a
   `sentAtMark` option, because review S-4 showed a raw `sent` total cannot say
   "never asked". `refused` counts `401` answers as the loop sees them.
3. **Header section rewritten, not one sentence.** The section "One sign-in,
   three cases" said BUY-03 opens BUY-01's session. It does not: BUY-03 signs
   in for itself (`shopper.live.spec.ts:824`). Correcting only the code count
   would have left the section contradicting itself, so the section was
   rewritten as "Four one-time codes per run".
4. **`E2E_SCENARIOS.md` — two more text fixes than the plan named.** The case
   count at the top (the file's own rule: "keep the count above in step"), and
   the "Per run they cost" paragraph, which said one code.
5. **Left as is on purpose.** The string "the product read did not come back
   from the core backend" in `addOpenProductToBag` is about the product-details
   read, not a cart call, so the plan's two "core backend" strings did not
   include it.

## Tests written

| AC    | Test file | Test case | Disposition carried out |
|-------|-----------|-----------|-------------------------|
| AC-1  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the account's bag starts empty" | extend — added to the existing file |
| AC-2  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "signing out leaves a guest" | extend |
| AC-3  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest puts the QA product in the bag, and the gateway takes it" | extend |
| AC-4  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest signs in from the navigation" | extend |
| AC-5  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "core answers the bag after sign-in" | extend |
| AC-6  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the guest's line is still in the bag, with the same quantity" | extend |
| AC-7  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "the bag holds nothing else" | extend |
| AC-8  | `tests/e2e/shopper.live.spec.ts` | `BUY-05` step "removing the line takes it out, and it stays out after a reload" | extend |
| AC-9  | `tests/e2e/shopper.live.spec.ts` | `BUY-05`'s `test.afterEach` | extend |
| AC-10 | `tests/e2e/shopper.live.spec.ts` | every `BUY-05` step: own `test.step`, own message, no count assertion, no credential (ids compared, never printed) | extend |
| AC-11 | `docs/testing/E2E_SCENARIOS.md` | `BUY-05` row | extend (docs row) |

**Written, not yet run against staging.** The browser case spends real
one-time codes. Plan step 9 (the code budget check for the whole `/verify`
session, about nine codes) comes before the first run, and the runs, the AC-9
proof runs and the `AC9-PROBE` checks are `/verify`'s (plan step 10,
**How AC-9 is proven**, review C-3 / C-4).

## Findings — confirmed bugs, out of scope

No test has run yet, so no existing behaviour has been proven wrong: no
`BUG-n`.

Recorded, not fixed (plan > **Findings recorded, not fixed here**; not
ticketed — one active work item):

- **Unredacted cart bodies in other messages** — `tests/e2e/actions/cart.ts`
  address-form and quantity messages still quote raw answer text without
  `redact()` (the sites the plan listed as `:1450`, `:1817`, `:2062`; now
  shifted by this change).
- **`watchCartAdd` listener left on after a throw** — `addOpenProductToBag`
  still calls `stop()` only on its normal exits. Harmless, because the context
  closes.
- **`sendOtpWithRetry` has no upper limit on its sleep** —
  `tests/e2e/actions/auth.ts:594-608`.
- **New, found while editing: stale line numbers in `E2E_SCENARIOS.md`.** The
  BUY-01..BUY-04 rows point at `shopper.live.spec.ts:250`, `:515`, `:681`,
  `:1030`; the cases are now at `:308`, `:589`, `:800`, `:1303`. They were
  already wrong before this change. Not fixed — outside AC-11.

## Validation run during implementation

- `npx next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` —
  exit 0.
- `npx eslint tests/e2e/shopper.live.spec.ts tests/e2e/actions/cart.ts
  tests/e2e/selectors.ts` — exit 0, no warnings in these files.
- `pnpm lint` — exit 0 (0 errors, 73 warnings, none in the changed files).
- `pnpm test:run` — exit 0: 223 files, 3400 tests passed (includes the lane
  guard in `tests/harness/qaHarness.test.ts`).
- Line endings: the three changed `.ts` files are all CRLF, no bare LF.
- Browser case: **not run** — see **Tests written**.
