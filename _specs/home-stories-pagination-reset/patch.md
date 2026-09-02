---
ticket: home-stories-pagination-reset
workflow: hotfix
stage: patch
status: complete
owner: developer
updated: 2026-09-02
branch: hotfix/home-stories-pagination-reset
---

# Patch Record — home-stories-pagination-reset

## 1. Branch

| | |
|---|---|
| Branch | `hotfix/home-stories-pagination-reset` |
| Cut from | `ticket/homepage-cache-phase-2` — **not** `develop`, which `patch_plan.md > 5` declares. See §4. |

## 2. Files Changed

| File | Change | Declared in the plan? |
|---|---|---|
| `components/clientWrapper/StoriesWrapper.tsx` | Split one effect into two. Seeding the shared story list now runs on `[stories]` only; clearing `storiesRefreshing` keeps its old `[stories, pathname]` trigger. | yes |
| `components/products/ProductStories.tsx` | The mount effect that borrows `store.storiesData` now reads what was there first and restores it in its cleanup. | yes |
| `tests/components/Home/storiesWrapper.test.tsx` | New file. 5 cases — `AC-1` ×2, `AC-2`, `AC-4`, `AC-5`. | yes |
| `tests/components/products/ProductStories.test.tsx` | New file. 2 cases — the borrow itself, and `AC-3`. | yes |

No file outside the declared list was touched. `StoriesBarClient.tsx` and
`StoriesPaginationWrapper.tsx` were read but not changed.

## 3. Tests Written

| `AC-n` | Disposition carried out | File :: case | Before patch | After patch |
|---|---|---|---|---|
| `AC-1` | `new` | `storiesWrapper.test.tsx::keeps the pages it already loaded when the route changes and comes back` | **FAILED** — *"opening a product and closing it threw away the second page of stories the shopper had already loaded"* | PASSED |
| `AC-1` | `new` | `storiesWrapper.test.tsx::does not ask the stories service for page 3 while page 2 is missing from the bar` | **FAILED** — *"the bar lost page 2 after the route change, so the next page it asks for will skip those people entirely"* | PASSED |
| `AC-2` | `new` | `storiesWrapper.test.tsx::does not overwrite a watched ring when the route changes` | **FAILED** — *"opening a product and closing it put the watched ring back to unwatched"* | PASSED |
| `AC-3` | `new` | `ProductStories.test.tsx::puts the home stories back when the product modal closes` | **FAILED** — `expected [ 90 ] to deeply equal [ 1, 2, 3 ]` | PASSED |
| `AC-4` | `new` | `storiesWrapper.test.tsx::still clears the add-story refreshing flag on a route change` | PASSED | PASSED |
| `AC-5` | `new` | `storiesWrapper.test.tsx::asks the stories service for page 2 first, and stops paging when it sends no next page` | PASSED | PASSED |
| — | `new` | `ProductStories.test.tsx::takes the shared story list over while the product page is open` | PASSED | PASSED |
| `AC-2` (bar wiring) | `existing` | `tests/components/Home/storiesBarClient.test.tsx` — all 5 cases, unchanged | PASSED | PASSED |

`AC-4`, `AC-5` and the two "takes it over" / "existing" rows are **preservation**
guards. They are expected to pass on both sides; they exist so a later change
cannot quietly break the behaviour this patch had to keep.

**A note on how the red run was reached.** The `AC-2` case first failed on its own
guard assertion (*"watching a story did not mark it seen in the shared story list,
so this test cannot prove anything about keeping the mark"*) — the test called
`watchStory` with `id` and `pid` the wrong way round. That is a test defect, not
the bug, so the arguments were corrected against `store/homepage/reducer.ts:117`
and the case was re-run. It then failed on the assertion it was written for. Only
that second run counts as the red proof.

**`AC-2` turned out to be broken today, not just at risk.** The advisory lens
raised the watched-ring loss as a hazard the *first draft of the plan* would have
created. Running the test showed the current code already loses the mark on every
route change, for the same root cause. The patch fixes it; no separate work item
is needed, and it is not scope creep — it is the same defect seen from another
side.

### Wider runs

| Check | Result |
|---|---|
| `vitest run` (whole unit suite) | **130 files passed, 2149 passed / 7 skipped** |
| `tsc --noEmit` (after `next typegen`) | exit `0` |
| `eslint` on all four changed files | exit `0` |

## 4. Deviations from the Plan

| What differed | Why | Consequence |
|---|---|---|
| The branch was cut from `ticket/homepage-cache-phase-2`, not `develop` as `patch_plan.md > 5` declares. | The owner chose it when asked. Switching to a `develop`-based branch would have collided with 704 lines of uncommitted work in `docs/testing/homepage-add-to-cart-tester-guide.md` and `docs/testing/stories-tester-guide.md`, neither of which exists on `develop`. | The fix ships when `homepage-cache-phase-2` ships. Both changed source files are byte-identical on `develop`, so a cherry-pick onto `develop` is clean if the fix should go sooner. The rollback plan is unaffected — it is still one `git revert`. |
| The `IntersectionObserver` stub named in `patch_plan.md > 6` was carried out by mocking `react-intersection-observer`'s `InView` rather than the browser API. | Same purpose, fewer moving parts: it makes "the shopper scrolled to the end of the bar" an explicit step the test calls, so a red run can never be a jsdom timing accident. | None. The unit under test is the bar, not the observer library. |

## 5. Left Alone Deliberately

All four items in `patch_plan.md > 7` were seen again while patching and none was
touched:

- The shared `store.storiesData` key with seven writers. This patch makes the
  borrow safe; it does not split the key. That redesign needs a `spec.md`.
- `StoriesPaginationWrapper.tsx:23` destructuring the whole store, and its
  append at line 59 reading `storiesData` from a possibly stale closure. The file
  was read carefully during diagnosis and left exactly as found.
- The dead `additionalStories` state and its commented-out render block
  (`StoriesPaginationWrapper.tsx:26`, `76–83`).
- The `"node_modules/next/navigation"` import in `StoriesWrapper.tsx:5`. Proven
  harmless by a throwaway probe run during diagnosis, and the probe file was
  deleted.

One thing was noticed while patching and is **also** left alone: on this branch
`AddStoryWidget`'s `router.refresh()` no longer changes `StoriesBarClient`'s
`stories`, so `storiesRefreshing` clears later than it used to. It is recorded in
`patch_plan.md > 7`, and `AC-4` pins today's behaviour so this patch cannot have
made it worse.

Nothing was reformatted, renamed or tidied.

## 6. Re-entry after the failed gate (attempt 1)

`verify` returned the work item here because `comprehension.md` recorded `1/2`
against a threshold of `1.0`. **No acceptance criterion was unmet and no test
regressed** — `verify.md > 2` and `> 3` record every `AC-n` as PASSED and the
whole unit suite green.

So this re-entry changed **nothing**: no source file, no test file, no
declaration in `patch_plan.md`. The four files in §2 are exactly as they were.

The seven declared cases were re-run on re-entry anyway, to confirm the tree was
untouched between the two entries: `Test Files 2 passed (2) · Tests 7 passed (7)`.
The whole-suite run in §3 was not repeated, because no file changed.

The work this re-entry exists to allow is the gate re-run, which happens in
`verify` with new questions on the same axes.
