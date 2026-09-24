---
ticket: home-stories-pagination-reset
workflow: hotfix
stage: intake
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
---

# Incident Intake — home-stories-pagination-reset

## Observed Symptoms

On the homepage the stories bar pages correctly on first load: scrolling to the
end of the bar fetches `?page=2` and the new people appear.

After the shopper opens a product and comes back to the homepage:

1. The people loaded from page 2 are **gone** from the bar. Only page 1 is left.
2. The next paged request is `?page=3`, not `?page=2`. Page 2 is never fetched
   again, so those people cannot be reached at all without a full page reload.
3. Repeating the trip skips one more page each time: `?page=4`, then `?page=5`.

## Affected Systems & Users

- Surface: the homepage stories bar — `components/Home/Stories/StoriesBarClient.tsx`,
  `components/clientWrapper/StoriesWrapper.tsx`,
  `components/Home/Stories/StoriesPaginationWrapper.tsx`.
- Backend: the stories service (`server: "stories"`,
  `/api/v1/stories/users_stories`). The backend answers correctly — it returns
  whatever page it is asked for. Nothing is wrong on that side.
- Users: every shopper who scrolls the stories bar past page 1 and then opens a
  product. That is the normal browsing path on the homepage, so the blast radius
  is all locales and all countries.
- Data loss is display-only. No write, no order, no cart is touched.

## First Observed

Reported by the owner on 2026-09-02 while testing branch
`ticket/homepage-cache-phase-2`.

The two writes that cause it were both added on **2026-05-03** in commit
`eda8e327` ("Add isProductPage state management and update related components for
product story handling"). See Reproduction Proof question 3.

The current branch (`homepage-cache-phase-2`) moved the bar's page-1 fetch from
the server to the browser (`StoriesBarClient`), but it did not introduce the
fault — it kept the same prop shape (`stories` = page 1 only).

## Reproduction Proof

**The entry condition for this workflow — three questions.** All three answers are
required, and answer 3 is not an answer without its source.

| # | Question | Answer |
|---|---|---|
| 1 | **Can we reproduce it?** | Open `http://localhost:3000/sy-en` with the network panel open. Scroll the stories bar to its end and wait for `GET /api/proxy?...users_stories%3Fpage%3D2` to return. Click a product card — it opens as an intercepted modal at `/sy-en/products/<id>`. Close the modal. Scroll the stories bar to its end again. |
| 2 | **What is wrong?** | After closing the modal the bar shows only the 10 page-1 people; the page-2 people are removed. The next paged request is `users_stories?page=3`. Repeating the trip gives `page=4`, then `page=5`. |
| 3 | **What should happen, and what proves it?** | The bar must keep the pages it already loaded when a product modal opens and closes, and the next paged request must be the page that follows the last one actually loaded (`page=3` only after page 2 is present). **Source: the known-good commit `eda8e327^` (2026-05-02).** Before `eda8e327`, `StoriesWrapper`'s effect ran on `[stories]` only and `ProductStories` did not call `setStoryData` at all, so opening and closing a product left `storiesData` untouched and the page counter stayed in step with the list. `eda8e327` added both writes and is the regression commit. |

> **Reproducible + known wrong behaviour + proof of correct behaviour → `hotfix`.**

| | |
|---|---|
| Artifact under test | `ticket/homepage-cache-phase-2@8d3b8ce8` (working tree dirty: `docs/testing/homepage-add-to-cart-tester-guide.md`, `docs/testing/stories-tester-guide.md` — both docs, neither on the fault path) — `derived` |

### Notes on how the reproduction was recorded

- The owner's words were "navigate to any page then back to homepage". Step 1
  names the **intercepted modal** routes specifically, because that is the only
  navigation that produces the `page=3` symptom: `@modal/(.)products/[productId]`
  and `@modal/(.)filters/[[...filters]]` keep the homepage mounted underneath, so
  the page counter in `StoriesPaginationWrapper` survives the trip. A full
  navigation (for example to `/sy-en/settings`) unmounts the bar and gives a
  different, milder symptom — page 1 refetched and `page=2` asked again. This is
  `derived` from the route layout, not stated by the owner.
- Question 2 is the owner's report, not a run by the workflow. It is precise and
  it matches the code path exactly; `verify` re-runs it as `AC-1`.

## Workflow Type Check

- Is the current behaviour **reproducible** by the command or step recorded above? **Yes.**
- Does it contradict a **defined expectation whose source is recorded above**? **Yes** — commit `eda8e327^`.
- Is the change expected to stay confined to the cause of that failure? **Yes, provisionally.** The suspected cause is that the list, the page-1 array and the page counter have three different owners. `diagnose` re-tests this after reading the code.
- Is the answer already in the repository, with nothing to change? **No** — source must change.
- Is a choice between options still open? **No** — the target behaviour is the pre-`eda8e327` behaviour.

**How the type was resolved:**

| | |
|---|---|
| Resolved type | `hotfix` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `hotfix` |

## Missing Information

- None that blocks diagnosis.

## Readiness Status

`READY`

- Justification: all three questions are answered. Question 3 carries a source
  that exists independently of this work item — commit `eda8e327^`, a previous
  known-good state of the same two files. The artifact under test was derived
  from the repository (`git rev-parse --short HEAD` on the current branch).
