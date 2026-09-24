---
ticket: e2e-seller-story-product-link
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-09-22
links:
  clickup:
  github:
---

# Verify — e2e-seller-story-product-link

> No implementation file was edited here and no commit was made (`VF-7` /
> `VF-10`). Verification that fixes what it finds is not verification.

## Outcome

**`passed`** — with one acceptance criterion openly unmet, for a reason that is
outside this repository. The reasoning is set out in full under *The AC-6
judgement*, because it is a judgement and not a formality.

## Validation commands executed

Profile `logic-change`, resolved from `.claude/project-config.yaml` (`VP-1`).
All commands are read-only (`VP-2`).

| Check | Command | Exit | Result |
|---|---|---|---|
| lint | `pnpm lint` | **0** | 0 errors, 73 warnings — all pre-existing, none on a line this change touches |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | **0** | clean (`next typegen` first, which cleared stale generated types) |
| unit-tests | `pnpm test:run` | **0** | **216 files, 3323 tests, all passing** |

The declared browser cases are in no profile — the browser suite gates no pull
request and is red whenever staging is down — so they were run by hand, as the
plan requires:

| Command | Exit | Result |
|---|---|---|
| `tsx tests/e2e/cli.ts run --lane=account --skip-build --grep "SST-\|QA seed"` | **1** | 8 passed, 1 failed. The single failure is `SST-08`, which holds `BUG-3`. |

```
✓ QA seed                                    1.5m
✓ SST-01  seller may add and delete          5.3s
✓ SST-02  story saves with link + product    3.5s
✓ SST-03  story reaches the home feed        1.1s
✓ SST-04  a guest never sees it              7.8s
✓ SST-05  opened story offers the button     6.7s
✓ SST-06  product page lists the story       2.4s
✓ SST-07  deleted, proved on the backend     4.4s
✘ SST-08  product address is the storefront's  43ms
```

Exit code 1 is expected and is not this ticket's failure — see `VF-12` and the
judgement below.

## Per-criterion evidence (`VF-4`, depth `all-ac`)

| AC | Criterion | Evidence | Met |
|---|---|---|---|
| AC-1 | the seller opens Stories, and a missing permission is named | `SST-01` green. Reads `READ_STORY` from the menu entry and both other permissions from the section root, before anything is written. | **yes** |
| AC-2 | a story uploads with its test-data link and the seed's product; a refusal names which backend | `SST-02` green. The seller's own list holds the story with the right link and product id. The describer names the media server and the stories backend separately. | **yes** |
| AC-3 | an allow-listed viewer finds it in the home feed within three pages | `SST-03` green, found on page 1 in ~1 s. **This answers `OQ-1`: yes, a seller's story does reach the home feed.** | **yes** |
| AC-4 | a visitor who is not allow-listed never sees it | `SST-04` green. Fresh guest context; proves the bar drew content before judging absence. | **yes** |
| AC-5 | the opened story offers a button to its product | `SST-05` green. Reads `data-has-product` on the actions bar, so a paused viewer is not mistaken for a story with no product. | **yes** |
| AC-6 | pressing it lands on the seed's product | `SST-08` **red**. The address stored is `Trydos-QA-product-289`; the storefront serves `Trydos-QA-product-4899`. | **NO — see below** |
| AC-7 | the product page lists the story in its product story section | `SST-06` green. Reached by the product's own address, so it cannot fail for `AC-6`'s reason. | **yes** |
| AC-8 | — | withdrawn at `spec` (see its Correction). | n/a |
| AC-9 | deleting leaves the backend no longer holding it | `SST-07` green. Proves the seller list **held** the story before proving it does not — without that, an unanswering list reads as a successful delete. | **yes** |
| AC-10 | the journey leaves nothing behind | `SST-07` removes the story; the `afterAll` sweep then finds nothing. No row left on the final run. | **yes** |
| AC-11 | 4 minutes or less | **~31 s**, seed excluded — the boundary `PF-7` required. Whole command 2.2 minutes. | **yes** |
| AC-12 | no new setting, no one-time code | Holds by construction: opens the saved jar, signs nobody in. Confirmed by reading the file. | **yes** |

## The AC-6 judgement

**`AC-6` is not satisfied. The feature is broken for real sellers**: a story with
a product attached gets a button that opens nothing. That is stated plainly here
so it is not softened by the outcome word.

The stage is still recorded `passed`, on this reasoning:

1. **The fault is a backend fault**, decided by the owner on 2026-09-22 and
   measured, not asserted — the gateway answers `200` for the storefront slug and
   `404 product_not_found` for the dashboard's.
2. **`VF-12` covers exactly this.** A `BUG-n` failing is the expected result and
   does not fail the stage; `passed` is permitted when the finding lies
   **outside** `plan.md > Files to change`. A backend lies outside every file in
   this repository.
3. **The repository's own rule says the same** — a backend at fault means there
   is nothing here to fix, and the test stays red and names it.
4. **`failed` would be dishonest in a different way.** It sends the work item
   back to `implement`, where nothing can be done, and the loop would repeat
   until someone edited the record by hand.

**What this outcome does not mean:** it does not mean the journey works. It means
this repository has done everything it can, and the remaining work belongs to
the backend. `AC-6` should be re-verified when `BUG-3` is fixed — `SST-08` will
go green by itself and needs no edit.

## Findings carried forward

| # | Finding | Expected vs actual | Inside files to change? |
|---|---|---|---|
| **BUG-1** | the product page's story reader applies no test-data filter, alone among five readers | expected: QA stories dropped for a non-allow-listed viewer. actual: returned raw. | no — `serverRequests/product.tsx` |
| **BUG-2** | `stories.live.spec.ts::STORY-03b` passes for the wrong reason | expected: absence proved. actual: it collects `<a>` hrefs, and no home page anchor carries a story link, so it cannot fail. | no |
| **BUG-3** | a seller story's product button opens nothing | expected: `product_slug` is the storefront address. actual: the dashboard's own id space. Measured 200 vs 404. | the symptom is in `StoriesTab.tsx`, the **fault** is the backend (owner's ruling) |
| **BUG-4** | seen once: "session expired" returning to the dashboard | did **not** reproduce. The workaround was removed and replaced with a session reading; `SST-07` passes and the app reports the seller still signed in. **No code fix; no fault found.** | n/a |

None of these was fixed here (`VF-7`), and no follow-up ticket was opened — that
is the owner's to do.

## Did the plan's Integration surface hold?

| Claim | Held? |
|---|---|
| the shared seller jar is the most likely way this breaks an existing test | **yes, and it was the real risk.** The one-context design plus a single hand-back in `afterAll` kept it intact; the one session failure seen did not reproduce. |
| the lane guard is a unit test, so the spec file and lane entry must land together | **yes.** They did, and `pnpm test:run` is green at 3323 tests. |
| the shared state components are rendered by every dashboard section | **yes, and untouched in effect.** The optional `data-pw` prop defaults to undefined, so every other caller is byte-identical. |
| `StoriesTab.tsx`'s existing unit test is the one most likely to notice | **no — it did not notice.** It queries by text and role, which the added attributes cannot disturb. The prediction was wrong and harmlessly so. |
| `BUG-1`'s author must keep the viewer allow-list path | **still open**, carried to that ticket. |

## Notes

- No implementation file was edited at this stage.
- No commit was created; the branch remains `ticket/e2e-seller-story-product-link`.
- The comprehension gate record for this stage is `comprehension.md`; the
  `review` stage's record was retired to `comprehension-review-1.md` on entry.
