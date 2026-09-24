---
ticket: home-stories-pagination-reset
workflow: hotfix
stage: verify
status: complete
owner: developer
updated: 2026-09-02
outcome: passed
---

# Verification — home-stories-pagination-reset

> **Second run of this stage.** Attempt 1 recorded every `AC-n` as PASSED but
> missed the comprehension gate 1 of 2, which sent the work item back to `patch`.
> Nothing in the patch changed on re-entry (`patch.md > 6`). Attempt 2 re-ran the
> declared tests, re-checked scope and rollback, and put a fresh gate to the
> owner: `2/2`, threshold met. The retired attempt-1 gate record is kept at
> `comprehension-verify-1.md`.

## 1. Incident Closure (`AC-1`)

| | |
|---|---|
| Command run | `npx vitest run tests/components/Home/storiesWrapper.test.tsx` — the two `AC-1` cases encode the reproduction step for step: page 1 on screen, the sentinel scrolled into view, page 2 loaded, the pathname moved to `/gb-en/products/…` and back with the bar still mounted, exactly as the intercepted modal does it. |
| Run against | `hotfix/home-stories-pagination-reset` @ working tree (patched) |
| Output | `Test Files 1 passed (1) · Tests 5 passed (5)` |
| Result | **PASSED** |
| Before the patch | `Tests 3 failed \| 2 passed (5)` — *"opening a product and closing it threw away the second page of stories the shopper had already loaded"* and *"the bar lost page 2 after the route change, so the next page it asks for will skip those people entirely"*. |

**Honest limit on this row.** `intake.md` records the reproduction as a browser
step, and the browser step was **not** run by the workflow. What ran is the unit
pair that reproduces the same mechanism — route change with the bar mounted — and
that pair was seen red first. Staging answered `[e2e] staging health check
passed.`, so the manual check is available and cheap; it is carried as residual
risk in §6 rather than claimed as done.

## 2. Acceptance Criteria Results

| `AC-n` | What proves it | Result |
|---|---|---|
| `AC-1` | `storiesWrapper.test.tsx::keeps the pages it already loaded when the route changes and comes back` (red before, green after) | PASSED |
| `AC-1` | `storiesWrapper.test.tsx::does not ask the stories service for page 3 while page 2 is missing from the bar` (red before, green after) | PASSED |
| `AC-2` | `storiesWrapper.test.tsx::does not overwrite a watched ring when the route changes` (red before, green after) | PASSED |
| `AC-3` | `ProductStories.test.tsx::puts the home stories back when the product modal closes` (red before, green after) | PASSED |
| `AC-4` | `storiesWrapper.test.tsx::still clears the add-story refreshing flag on a route change` (green both sides — preservation guard) | PASSED |
| `AC-5` | `storiesWrapper.test.tsx::asks the stories service for page 2 first, and stops paging when it sends no next page` (green both sides — preservation guard) | PASSED |

`AC-2` is worth naming separately: the test showed the watched ring is **already**
lost on a route change in the shipped code, not merely at risk from the plan's
first draft. Same root cause, same fix, no separate work item needed.

## 3. Test Results

| Test | Result |
|---|---|
| `tests/components/Home/storiesWrapper.test.tsx` — 5 declared cases | 5 PASSED |
| `tests/components/products/ProductStories.test.tsx` — 2 declared cases | 2 PASSED |
| `tests/components/Home/storiesBarClient.test.tsx` — 5 existing cases | 5 PASSED |
| Surrounding suite (`vitest run`) | **130 files passed · 2149 passed, 7 skipped, 0 failed** |
| Declared cases re-run on the second entry to `verify` | `Test Files 2 passed (2) · Tests 7 passed (7)` |
| `tsc --noEmit` after `next typegen` | exit `0` |
| `eslint` on all four changed files | exit `0` |

## 4. Scope Confirmation

| | |
|---|---|
| Files changed | 4 — 2 source, 2 test |
| Files declared in the plan | 4 |
| Outside the declared list | `none` |

`docs/testing/homepage-add-to-cart-tester-guide.md` and
`docs/testing/stories-tester-guide.md` are also dirty in the tree. They were
already modified before this work item started, they are the owner's, and nothing
in this hotfix touched them.

## 5. Rollback Confirmation

| | |
|---|---|
| Plan still applies as written | **no** — one line of it is now wrong |
| If no — what changed | `patch_plan.md > 5` names `develop` as the branch. The owner chose `ticket/homepage-cache-phase-2` when asked, because switching branches would have collided with 704 lines of uncommitted work in two tester guides that do not exist on `develop`. Recorded in `patch.md > 4`. |
| Corrected plan | Revert is unchanged in shape: one `git revert` of the single patch commit on `hotfix/home-stories-pagination-reset`. Nothing has to be true first — the patch writes no cookie, no storage key and no backend record, and changes no request or response shape. What *is* different is reach: the fix now ships when `homepage-cache-phase-2` ships. Both changed source files are byte-identical on `develop`, so a cherry-pick onto `develop` is clean if it should go sooner, and reverting that cherry-pick would be a second, independent revert. |

## 6. Residual Risk Accepted at Delivery

- **The browser reproduction was not run by the workflow.** `AC-1` is proved at
  unit level, red first. The manual step in `intake.md` — homepage, scroll the
  stories bar, open a product, close it, scroll again — has not been walked
  through by anyone since the patch. Staging is healthy, so this is a minute of
  work and is the single most valuable check left.
- **The filters modal was not tested separately.** `@modal/(.)filters/[[...filters]]`
  reaches the same code by the same route change, and `AC-1`'s test drives that
  route change directly rather than a particular URL, so it is covered in
  mechanism but not by name.
- **The shared `store.storiesData` key still has seven writers.** This patch makes
  the product page's borrow safe; it does not split the key. Any new writer added
  to that key can reintroduce a version of this incident, and nothing in the code
  stops it. Parked in `patch_plan.md > 7`.
- **Nothing monitors a recurrence.** A skipped stories page produces no error, no
  Sentry event and no analytics signal — it just quietly shows fewer people. The
  two `AC-1` tests in the unit suite are the only guard, and the unit suite does
  gate every pull request.

## 7. Outcome

`passed` — every `AC-n` has a result and every result is PASSED, `AC-1` no longer
fails, every declared test ran, scope held at the four declared files, and the
gate record on disk meets its threshold (`comprehension.md`, attempt 2, `2/2`
against `1.0`).

The definition sets the terminal status `completed`; the stage stays at `verify`.
The work item is now deliverable by the publish action, which performs no
lifecycle transition of its own.

**Gate history, kept in the open.** Attempt 1 scored `1/2` on the `blast_radius`
question about how many components write to `store.storiesData`, and the work item
went back to `patch` as the definition requires. No source file changed there. The
retired record is `comprehension-verify-1.md` and is never edited. Attempt 2 was
administered short — 2 questions against a floor of 3 — because no question
survived two rounds of blind falsification; the reason is recorded in that
attempt's `degraded:` field and analysed at the end of `comprehension.md`.
