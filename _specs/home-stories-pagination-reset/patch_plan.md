---
ticket: home-stories-pagination-reset
workflow: hotfix
stage: diagnose
status: complete
owner: developer
updated: 2026-09-02
---

# Patch Plan — home-stories-pagination-reset

## 1. Root Cause

**Defect: `StoriesWrapper` re-seeds the shared story list from a page-1 snapshot
on every route change, while the page counter that walks the list lives in a
component that the route change does not unmount.**

Who holds what:

| Where | Holds | Lives as long as |
|---|---|---|
| `store.storiesData` (`store/homepage/reducer.ts:145`) | **the accumulator** — every page loaded, plus seen marks and deletes | the whole browser session |
| `components/Home/Stories/StoriesBarClient.tsx:47` — `stories` state | **page 1 only**, as fetched | the home page tree |
| `components/Home/Stories/StoriesPaginationWrapper.tsx:25` — `next_page` | the page counter | the home page tree |

The chain:

1. `StoriesBarClient` fetches page 1 into `stories`. `StoriesWrapper`'s effect
   (`components/clientWrapper/StoriesWrapper.tsx:19-21`) writes it to the store.
2. The shopper scrolls. `StoriesPaginationWrapper` fetches `?page=2` and appends
   onto the **store** (`StoriesPaginationWrapper.tsx:59`). Its `next_page`
   becomes `3`. The store holds pages 1+2; `stories` still holds page 1.
3. The shopper opens a product. `/products/[productId]` is an **intercepted
   modal** (`app/(client)/[lang]/@modal/(.)products/[productId]/page.tsx`), so
   the homepage stays mounted underneath — and so does `next_page = 3`.
   `usePathname()` changes, so `StoriesWrapper`'s effect re-runs and writes
   `stories` — page 1 — over the accumulator. Pages 2..n are lost.
   `components/products/ProductStories.tsx:61-63` borrows the same store key for
   the product's own stories and never gives it back.
4. Closing the modal changes the pathname again; the effect runs again; the
   store is page 1 again.
5. The bar is short now, the `InView` sentinel returns to view, and `next_page`
   — never reset, because its component never unmounted — asks for `?page=3`.
   Page 2 is skipped for good.
6. Each further trip skips one more page.

**Evidence it is the cause, not a symptom:**

- `StoriesPaginationWrapper.tsx:59` appends to the store and nothing appends to
  `stories`, so `stories` is page 1 by construction and re-seeding from it can
  only shrink the list.
- `StoriesPaginationWrapper` renders none of its own pages — the block that
  would have is commented out (lines 76–83). It relies on the store, so a store
  reset erases its pages from the screen.
- The `page=3` half proves the component did **not** unmount. A remount resets
  `next_page` to `2` (line 25). Only the intercepted routes keep the homepage
  mounted, which is why the symptom needs a product or a filters modal.
- Verified: while the overlay shows, the base page is hidden by React state
  (`components/ModalRoute/ModalSlot.tsx` → `OverlayVisibility`), so nothing the
  store holds during the modal is on screen.

**Introduced:** commit `eda8e327` (2026-05-03). It added both writes at once —
`pathname` to `StoriesWrapper`'s effect deps, and `setStoryData(InitialStoriesData)`
to `ProductStories`. Before it the effect ran on `[stories]` only and
`ProductStories` never touched `storiesData`.

**The `pathname` dep is not gratuitous.** It exists to repair what
`ProductStories` borrows. Removing it alone would leave the home bar showing the
product's stories after the modal closes. The two writes are one fault and are
repaired together.

## 2. Acceptance Criteria

- **`AC-1`**: the reproduction step in `intake.md` no longer fails. After a route
  change away from the homepage and back, the bar still shows the people from
  every page it had loaded, and the next paged request is the page after the last
  one loaded (`?page=3` only once page 2 is present). The same holds for the
  filters modal (`@modal/(.)filters/[[...filters]]`), which is the same code path.
- **`AC-2`** *(preserve)*: the store stays the accumulator. A watched ring
  (`watchStory`, `store/homepage/reducer.ts:119`), an optimistic delete
  (`removeStory`, line 191) and a story the shopper just posted
  (`AddStoryWidget.tsx:267,314` writes a fresh page 1) all survive scrolling the
  bar to the next page.
- **`AC-3`** *(preserve)*: after the product modal closes, the home bar shows
  **home** stories, not the product's.
- **`AC-4`** *(preserve)*: `storiesRefreshing` still clears on the same triggers
  as today, so the add-story button cannot stay stuck as a spinner
  (`components/Home/AddStory.tsx:63`).
- **`AC-5`** *(preserve)*: the first paged request after page 1 is still `?page=2`,
  and paging still stops when the backend sends no `next_page_url`.

## 3. Minimal Files to Change

| File | Why it must change |
|---|---|
| `components/clientWrapper/StoriesWrapper.tsx` | Holds the defect. The effect is split: seeding the store goes back to `[stories]` (its state before `eda8e327`), and clearing `storiesRefreshing` keeps today's `[stories, pathname]` trigger so `AC-4` is unchanged. |
| `components/products/ProductStories.tsx` | The borrower of the shared store key. Its mount effect gains a cleanup that puts back what it found, so the home bar no longer needs a route-change repair. |
| `tests/components/Home/storiesWrapper.test.tsx` | **New.** `StoriesWrapper` has no test file today; this is the unit the defect lives in. Covers `AC-1`, `AC-4`, `AC-5`. |
| `tests/components/products/ProductStories.test.tsx` | **New.** `ProductStories` has no test file today. Covers `AC-3` and the `AC-2` case that the borrow does not eat the accumulator. |

`StoriesBarClient.tsx` and `StoriesPaginationWrapper.tsx` are **not** on this
list. An earlier draft moved the accumulator into `StoriesBarClient`; the
advisory lens showed that would overwrite seen marks, deletes and a just-posted
story on every scroll (§8, findings 1 and 2). Leaving the accumulator in the
store is both smaller and safer.

## 4. Integration Surface

- **`store.storiesData` has five writers, not one.** `StoriesWrapper.tsx:19`,
  `StoriesPaginationWrapper.tsx:59`, `ProductStories.tsx:63`,
  `AddStoryWidget.tsx:267` and `:314`, `Chat/pages/StoriesList.tsx:41,45`, and
  `Login/Enhanced/FullEnhancedLoginWidget.tsx:233`. Two more mutate it in place:
  `watchStory` and `removeStory` (`store/homepage/reducer.ts:119,191`).
  **The patch adds no writer and removes none.** It only stops one existing
  writer firing on a trigger that destroys the others' work, and makes a second
  put back what it borrowed. That is why the preserved behaviours in `AC-2` are
  safe: the accumulator never moves.
- **Readers.** `StoriesWrapper` (the bar), `components/Home/Stories/NewStories.tsx`
  (the full-screen viewer, via `storiesCache`), and the `store/homepage` helpers
  `SelectStory` / next / previous. If the restore in `ProductStories` is wrong,
  the viewer opened from the home bar would not find its story and would sit on
  its spinner (`NewStories.tsx:97`).
- **`/api/proxy` and the stories service are untouched.** No request shape, no
  header, no token path changes.
- **Mount sites.** `StoriesWrapper` has exactly one caller (`StoriesBarClient`,
  reached from `CategoryHomeView.tsx:104`, used by `app/(client)/[lang]/page.tsx`
  and `app/(client)/[lang]/categories/[slug]/page.tsx`). `ProductStories` has one
  (`components/Server/product/ProductStoriesWrapper.tsx:64`), reached from both
  the intercepted modal and the full product page.
- **Both changed files are identical on `develop` and on the current branch**
  (`git diff origin/develop` is empty for each), so the patch is branch-neutral.

## 5. Rollback Plan

| | |
|---|---|
| Branch | `hotfix/home-stories-pagination-reset`, cut from **`develop`** — the project base branch, and the defect has been live since 2026-05-03, so it must not wait for `ticket/homepage-cache-phase-2` to ship. Both changed files are byte-identical on `develop`. |
| How it is reverted | `git revert` the single patch commit. Two component files and two test files, no other moving part. |
| How long that takes | Minutes — one revert plus a redeploy. |
| What must be true for a revert to be safe | Nothing. The patch touches only browser-side component state. It writes no cookie, no storage key and no backend record, and changes no request or response shape, so a revert cannot leave data behind in a new shape. |
| What a revert does NOT undo | Nothing. Reverting restores the current (faulty) paging behaviour exactly. |

## 6. Tests

| `AC-n` | Existing coverage | Disposition | File :: case |
|---|---|---|---|
| `AC-1` | `none` — searched `tests/components/`, `tests/store/`, `tests/e2e/`. `tests/components/Home/storiesBarClient.test.tsx` covers a **different unit** (the fetch wiring: page-1 render, backend refusal, no token, names the service, `noMessage`) and never loads a second page or changes the route. `StoriesWrapper` has no test file. | `new` | `tests/components/Home/storiesWrapper.test.tsx::keeps the pages it already loaded when the route changes and comes back` |
| `AC-1` | as above | `new` | `tests/components/Home/storiesWrapper.test.tsx::asks the stories service for the page after the last one it loaded, not the one after that` |
| `AC-2` | `none` — same search | `new` | `tests/components/Home/storiesWrapper.test.tsx::does not overwrite a watched ring when the route changes` |
| `AC-3` | `none` — `ProductStories` has no test file | `new` | `tests/components/products/ProductStories.test.tsx::puts the home stories back when the product modal closes` |
| `AC-4` | `none` — same search | `new` | `tests/components/Home/storiesWrapper.test.tsx::still clears the add-story refreshing flag on a route change` |
| `AC-5` | `none` — same search | `new` | `tests/components/Home/storiesWrapper.test.tsx::asks for page 2 first, and stops paging when the service sends no next page` |
| `AC-2` (bar wiring) | `tests/components/Home/storiesBarClient.test.tsx` — all five cases | `existing` | must stay green; the patch does not touch that unit |

`AC-1`'s two cases must be **seen red** against the current code and green after.
Every assertion carries a message naming the step, and the stories service where
a request crosses it.

**Setup the cases need** (advisory finding 4, confirmed): jsdom has no
`IntersectionObserver`, and `react-intersection-observer` needs one before
`StoriesPaginationWrapper` can fire. The test installs a **controllable** stub so
"the sentinel came into view" is an explicit step, not a timing accident — a red
run must fail on the missing page-2 people, never on a missing observer. The
mocked page-1 response must also carry `next_page_url`, and `loginOpen` must be
false, or the pagination wrapper never renders (`StoriesWrapper.tsx:38`).

**Verified, so not a risk:** `StoriesWrapper.tsx:5` imports `usePathname` from
`"node_modules/next/navigation"` while `tests/setup.ts:33` mocks
`"next/navigation"`. A throwaway probe run confirmed both specifiers resolve to
the same module and the global mock reaches the component. Advisory finding 3 does
not hold; that import line stays as it is.

## 7. Deferred Improvements

| What | Why it is not in this patch | Follow-up |
|---|---|---|
| The home bar and the product page share one global `store.storiesData`, with seven writers between them. Two lists should not share one key. | Redesigning who owns story state across two pages is not a repair of the page skip, and it would touch the story viewer too. Deciding the new ownership belongs in a `spec.md`. | `development` work item |
| `StoriesPaginationWrapper.tsx:23` destructures the whole store (`useAppStore()`), so the bar re-renders on every unrelated store write, and the append at line 59 reads a possibly stale `storiesData` from a closure. | Real, but it is not what breaks the paging, and the file stays out of this patch. | `development` work item |
| `StoriesWrapper.tsx:5` and `components/setting/orders/index.tsx:7` import `usePathname` from `"node_modules/next/navigation"`, bypassing the package's exports map. | Proven harmless today (§6). A tidy-up, not a repair. | `development` work item |
| `StoriesPaginationWrapper` keeps a dead `additionalStories` state whose render block is commented out (lines 76–83). | Removing dead state is not what broke. | `development` work item |
| On this branch `AddStoryWidget`'s `router.refresh()` no longer changes `StoriesBarClient`'s `stories`, so `storiesRefreshing` clears only on a later route change. | Pre-existing on `ticket/homepage-cache-phase-2`, unrelated to the page skip. `AC-4` pins today's behaviour so this patch cannot make it worse. | `development` work item |

## 8. Advisory Findings (`hotfix-reviewer`)

| Severity | Finding | Disposition |
|---|---|---|
| `major` | The first draft moved the accumulator into `StoriesBarClient.stories`. Because `watchStory` and `removeStory` write only into the store, every scroll append would have written the raw fetched list back over it — watched rings returning to unwatched, deleted stories reappearing. | **Addressed, and it changed the fix.** Verified in `services/story.ts:50-59` and `store/homepage/reducer.ts:119,191`. The accumulator now stays in the store; §3 dropped two files as a result. `AC-2` pins it. |
| `major` | §4 claimed one writer of `store.storiesData`. There are seven. `AddStoryWidget.tsx:267,314` writes a fresh page 1 containing a just-posted story, which the first draft would have discarded on the next scroll. | **Addressed.** Verified in the source. §4 now lists every writer; `AC-2` covers the just-posted story. |
| `minor` | `AC-1`'s test cannot drive a route change, because `StoriesWrapper` imports `usePathname` from a specifier the global mock does not cover. | **Not upheld.** A throwaway probe run showed both specifiers resolve to the same module and the mock does reach the component. Recorded in §6 so nobody re-checks it. |
| `minor` | The cases need `next_page_url` on the mocked response, `loginOpen: false`, and an `IntersectionObserver` stub, none of which the existing file exercises. | **Addressed.** Confirmed there is no global stub. §6 records the setup and requires a controllable observer, so a red run fails on the missing people and not on a missing observer. |
| `observation` | The rollback is sound but the delivery branch was not stated, and patching on a feature branch ties the fix to that branch's release. | **Addressed.** §5 now names `hotfix/home-stories-pagination-reset` cut from `develop`, and records that both changed files are byte-identical on `develop`. |
| `observation` | `AC-1` named only the product modal; `intake.md` names the filters modal too. | **Addressed.** `AC-1` now names both and states they are the same code path. |

## 9. Re-test of the Bound (diagnose step 7)

- Does the fix stay at the cause? **Yes.** Two edits: one effect split, one effect
  cleanup. No new component, no new store key, no changed request.
- Does it require a decision the expectation's source does not settle? **No.** The
  target is the behaviour before `eda8e327`, and the patch reaches it while keeping
  the product-viewer seeding that commit added for a reason.
- Would a correct fix mean designing rather than repairing? **No** — the redesign
  that *is* tempting (splitting the shared store key) is parked in §7.

Still a hotfix. Proceed to `patch`.
