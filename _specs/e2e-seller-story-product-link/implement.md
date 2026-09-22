---
ticket: e2e-seller-story-product-link
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: ai_agent
updated: 2026-09-22
branch: ticket/e2e-seller-story-product-link
links:
  clickup:
  github:
---

# Implement — e2e-seller-story-product-link

> Branch `ticket/e2e-seller-story-product-link`, cut from a clean `development`
> (this repository's base branch overrides `IM-3`'s `main`).
> **Nothing is committed and nothing is pushed** (`IM-9`).

## Outcome

**Success.** The journey is written and **proven by running it**: 8 passed, 1
failed, and the one failure is `SST-08`, which holds the backend fault the owner
ruled on and is expected to stay red until the backend is fixed.

```
✓ QA seed                                    1.5m
✓ SST-01  seller may add and delete          5.3s
✓ SST-02  story saves with link + product    3.6s
✓ SST-03  story reaches the home feed        0.9s
✓ SST-04  a guest never sees it              4.7s
✓ SST-05  opened story offers the button     6.0s
✓ SST-06  product page lists the story       2.7s
✓ SST-07  deleted, proved on the backend     4.5s
✘ SST-08  product address is wrong          43ms   BACKEND FAULT
```

### `OQ-1` is answered: **yes**

**A story written from the seller dashboard does reach the home stories feed.**
`SST-03` finds it on page 1 of the unfiltered feed in under a second. This was
the ticket's largest risk, the reason the plan was staged, and the thing `C-4`
existed to handle had the answer been no. It is no longer a risk.

### `AC-11`: the budget holds, with room to spare

The eight cases total **~28 seconds**, seed excluded — the measurement boundary
`PF-7` required. `NFR-3` allows four minutes. Whole command including the seed:
2.0 minutes.

### The owner's decision, carried out

`BUG-3` is a **backend fault** (owner, 2026-09-22). `SST-08` stays red and names
it. Because the file is serial, the fault was moved into its own case placed
last, asserting on a value already read — so it needs no story and no session,
fails in 43 ms, and blocks none of the eight checks above. Its message quotes
both addresses and the href the button actually carried.

## What was changed, against the plan's declared list

Every file below is in `plan.md > Files to change`. Nothing outside that list
was touched (`IM-4`).

| File | Change | State |
|---|---|---|
| `components/SellerDashboard/StoriesTab.tsx` | 13 `data-pw` attributes, including `data-can-create` / `data-can-delete` on the section root | done, proven working |
| `components/SellerDashboard/ui/index.tsx` | optional `data-pw` prop on `EmptyState` and `ErrorState` | done |
| `components/Home/Stories/StoryViewer.tsx` | `story-actions` + `data-has-product`, and `story-product-link` | done, unexercised so far |
| `tests/e2e/selectors.ts` | new `sellerStories` and `storyActions` groups | done |
| `tests/e2e/actions/sellerStories.ts` | new — the section's actions | done |
| `tests/e2e/sellerStories.live.spec.ts` | new — `SST-01`, `SST-02`, `SST-03`, `SST-05`, `SST-06`, `SST-07`, `SST-08` and the sweep | `SST-01` and `SST-02` proven green; the rest written and never executed |
| `tests/e2e/laneConfig.ts` | the spec added to `ACCOUNT_LANE` | done |

Checks run: `tsc --noEmit` clean; `eslint` **0 errors** (4 warnings, all
pre-existing unused disable directives on lines this change does not touch);
`tests/harness/qaHarness.test.ts` **17/17**, so the lane guard is satisfied and
the PR gate is not red; the three seller-dashboard unit suites **43/43**, which
matters because one of them renders the component that changed.

## Tests written

| Plan row | Disposition | Carried out |
|---|---|---|
| `AC-1` | new | **yes — green.** `SST-01`. |
| `AC-2` | new | **yes — green.** `SST-02`: the story saves, and the seller's own list holds it with the right link and product id. |
| `AC-3` | new | **yes — green.** `SST-03`. Answers `OQ-1`. |
| `AC-4` | existing → **new** | **yes — green.** `SST-04`. Deviation `D-4`: `PF-2` proved the cited existing case cannot fail, and `review.md` dispositioned a replacement into this file. |
| `AC-5` | new | **yes — green.** `SST-05`. |
| `AC-6` | new | **red, and stays red.** `SST-08` — backend fault `BUG-3`. This is the repository's documented exception: a backend at fault means there is nothing here to fix, and the test names it. |
| `AC-7` | new | **yes — green.** `SST-06`. |
| `AC-9` | new | **yes — green.** `SST-07`, which proves the seller list held the story **before** proving it no longer does. |
| `AC-10` | new | **yes.** `SST-07` removes the story; the `afterAll` sweep then has nothing to do. No row was left behind on the final run. |
| `AC-11` | none | **measured: ~28 s**, seed excluded, against a 4-minute budget. |
| `AC-12` | none | holds by construction: the file opens the saved jar, signs nobody in, spends no one-time code, and needs no setting the harness does not derive. |

## Findings

### BUG-3 — a seller story's product button leads to a page that does not exist

**A confirmed fault, and the owner has ruled it a BACKEND fault** (2026-09-22).
`SST-08` therefore stays red and names the backend; it is not worked around.
It is customer-facing: it breaks the feature this ticket exists to prove.

**What happens.** The story upload form's product picker reads each row's
`slug` from the seller dashboard's own product list and saves it as the story's
`product_slug`. The shopper's story viewer then builds its product button as
`/<lang>/products/<product_slug>`. The dashboard's slug is not the product's
storefront address, so the button points nowhere.

**Measured, not inferred.** `SST-02` against staging:

```
product id   289                        — correct, the attachment landed
product_slug "Trydos-QA-product-289"    — what the dashboard's list gave
                                          the picker
the product's own slug
             "Trydos-QA-product-4899"   — what the storefront actually serves
```

**Why this is the application and not the test.** The repository already knows
these two slugs differ, and says so at `tests/e2e/harness/qaSeed.ts:1475`:

> `// What the live cases must use. The dashboard's own slug opens nothing.`
> `productSlug = storefrontSlug;`

The seed overrides the dashboard's slug with the storefront one, and it has to
**poll search for up to 600 seconds** to discover it. That is the decisive
detail: if the storefront slug were available on the dashboard's product row,
the seed would read it there instead of polling Elasticsearch for ten minutes.

**Where it lives.** `components/SellerDashboard/StoriesTab.tsx`, in the product
picker's `onSelect` — `slug: product.slug || ""` — carried into the save body as
`product_slug`. `components/Home/Stories/StoryViewer.tsx` is the consumer.

**Why it is not fixed in this repository.** *(The owner has since ruled it a
backend fault, which settles the question below. The reasoning is kept because
it is what led to that decision.)* `StoriesTab.tsx` is inside the plan's *Files to
change*, so `IM-12` would allow a fix — but there is nothing small to fix. The
value the picker needs is not available where the picker runs. Every real
remedy is a design decision the approved plan does not cover:

1. the dashboard's product list starts returning the storefront slug — backend
   work, outside this repository;
2. the app resolves the slug at save time through a second call — a new request,
   a new failure mode, and a new decision about what to do when it fails;
3. the story links by product **id** instead of slug — changes the story viewer
   and the product route's contract, and touches every story, not just sellers'.

Choosing between those is the owner's, not something to improvise mid-stage
(`IM-10`).

**What it means for this ticket's own criteria.** `AC-6` ("the button lands on
the seed's product") cannot pass while `BUG-3` stands. `AC-7` is also at risk:
the product page is reached by slug. So this is not a side finding that can be
noted and stepped around — it sits on the journey's critical path.

### BUG-4 — seen once, did not reproduce, now instrumented (**not a code fix**)

**Status: no application fault found.** Nothing in this repository was changed
for it, and nothing should be until it is seen again.

**What happened.** On one run, returning to the seller dashboard after browsing
the storefront drew the app's "your session has expired" screen. My first
response was to load a storefront page before re-entering the dashboard, which
made the case pass. That was a workaround over an unexplained failure, and it is
exactly the kind of line that hides a product bug for a year.

**What was done instead.**

1. **The workaround was removed**, so the fault could reproduce.
2. **The case now asks the app who it thinks the visitor is**, through
   `/api/auth/me`, *before* it touches the dashboard. That is the reading which
   separates the two explanations, and it was missing:
   - session dead → the credential was lost, and the message says so;
   - session alive but the dashboard refuses → the dashboard is at fault.
3. **The run was repeated.** `SST-07` **passed**, and the session read reported
   the visitor still signed in as the seller after the home page, the story
   viewer and the product page.

**What was ruled out by reading.** The server-side 401 path cannot downgrade a
signed-in seller to a guest — `serverRequests/HandleAuthedFetch.ts` guards it
explicitly:

> `// A verified shopper with no refresh cookie must NOT be re-registered as a`
> `// guest here — that would silently downgrade a logged-in account`
> `if (await isVerifiedMarketUser()) return response;`

**What this evidence does and does not support.** One clean run is not proof
that the earlier failure was impossible; it is proof that it is not systematic.
The likeliest reading is a token rotation race at that moment against a session
restored from a saved jar — the snapshot problem `handOnSession` documents —
rather than something a seller would meet in a browser.

**The real improvement is the instrumentation, not a fix.** If this happens
again, the case will now say whether the session was alive or dead instead of
leaving the next reader to guess, which is the position I was in.

### What the run already settled

Recorded because it is real progress and should not be re-measured:

- **`OQ-6` is answered: yes.** The QA seller holds `READ_STORY`, `CREATE_STORY`
  and `DELETE_STORY`. `SST-01` reads all three and passes in 4.7 s, so the
  "never write before you can delete" gate works as designed.
- **The upload path works end to end** — file, crop dialog, link, product
  picker, share, media server, stories backend — in under 4 seconds. The story
  is written and is readable back from the seller's own list by its link.
- **The lane command in the plan is correct.** `--lane=account --grep "SST-|QA seed"`
  ran the seed and only the three `SST` cases, leaving the other eleven files
  alone, exactly as plan step 5 says.
- **The QA seed is stable**, 1.4–1.5 minutes on every one of four runs.

## Deviations from the approved plan

| # | Deviation | Why |
|---|---|---|
| D-1 | Added `seller-stories-error`, which the plan's hook table omitted | The plan's own prose says dropping the error hook was a mistake and that `SST-01` must tell a refused list from an empty one. The table was the stale half of the same document. |
| D-2 | `QA_COUNTRY` declared locally rather than imported | The seed keeps its copy private, and `qaLock.live.spec.ts` already declares its own for the same reason. Importing a setup project's internals to share one string would couple them for nothing. |
| D-4 | `AC-4` moved from `existing` to a new case, `SST-04` | `PF-2` proved the cited case (`STORY-03b`) collects `<a>` hrefs, and no home page anchor carries a story link — so it passes whether the guest sees the ring or not. `review.md` dispositioned a real check into this file. `SST-04` reads the bar tiles by `data-pw` and `data-id`, from a fresh guest context, after proving the bar drew content. |
| D-5 | `SST-07` reads the session before it opens the dashboard | Replaces an earlier workaround (loading a storefront page first) that made a one-off failure disappear without explaining it. The reading is what tells a dead session from a dashboard refusing a live one — see `BUG-4`. With the workaround removed, the case passes. |
| D-3 | `beforeAll` opens a storefront page before the dashboard | Not optional: `gotoSellerDashboard` refuses without a country-and-language prefix in the address. `sellerDashboard.live.spec.ts:172` does the same thing. Found by the first run, which failed in 90 ms naming the cause. |

## Mistakes made and corrected during this stage

Recorded because the second one is a variant of a finding the review panel had
already raised, and repeating it is worth writing down.

- **The upload watcher matched the wrong thing.** It looked for the seller story
  path in the **response URL**. Every client call travels to `/api/proxy` and
  the real target rides in the `x-proxy-url` header, so the save was invisible
  and `SST-02` reported *"the browser never sent the story to the stories
  backend"* after a save that had worked. `actions/story.ts:204` states the rule
  in a comment three lines long. This is the same class of fault as `PF-3` — I
  wrote a new watcher expressly to avoid the shared one's hardcoded shopper
  path, then got the matching mechanism wrong a different way.
- **The attachment check could not prove what it claimed.** It read only
  `product_slug`, so "no product at all" and "product attached, slug wrong"
  produced the same message. Splitting it into two checks is what turned a vague
  failure into `BUG-3`.

## Left undone

- **Plan step 5's `OQ-1` measurement.** Nothing has reached `SST-03`.
- **A green run of the file.** `SST-03` … `SST-08` have never executed once.
- **`AC-4`'s guest check**, which `review.md` moved into this file after `PF-2`
  showed the existing case cannot carry it.
- Plan steps 8 and 9 — the README update and opening `BUG-1`.
- `review.md > Follow-up actions` `FU-1` and `FU-2` (`BUG-1`, `BUG-2`).
