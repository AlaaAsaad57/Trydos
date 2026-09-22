---
ticket: e2e-seller-story-product-link
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-09-22
links:
  clickup:
  github:
---

# Intake — e2e-seller-story-product-link

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-seller-story-product-link` — no ClickUp task and no GitHub issue. The
request came directly from the owner in conversation on 2026-09-22.

## Ticket Summary

Add a browser (e2e) journey that follows one story from end to end: a seller
uploads a story from the seller dashboard with a product attached and a QA link,
the story is then found on the home page stories bar, opened, and its product
button followed to the product page, where the same story appears in the
"Product Story" section — and finally the seller deletes it again from the
dashboard.

## Ticket Metadata

- id / slug: `e2e-seller-story-product-link`
- title: A seller's story with a linked product reaches the feed and the product page, then is deleted
- owner: developer
- created: 2026-09-22
- links: none

## User Story

> As a seller, I want the story I upload with a product attached to appear on the
> home page and to carry a working link to that product's page — and I want the
> product's own page to show my story — so that a story is a real way for a
> shopper to reach what I am selling.

For the suite itself:

> As the owner of this repository, I want one browser journey that proves that
> whole path in a single run, so that a break anywhere along it names the step
> and the backend that broke rather than "stories do not work".

## The requested journey, as given

The owner described the journey step by step. It is copied here as the source of
the acceptance criteria the `spec` stage will write. No step has been added,
removed or reordered.

1. Sign in as the account that has seller access.
2. Go to the seller dashboard, then to the Stories section.
3. Upload a story with a product attached and a **QA link** — the link that the
   app already agrees must not be shown to real customers.
4. Check the story appears on the home page. It may not be on the first page of
   the user stories list; it may be on page 2 or 3.
5. Once it is confirmed to exist, open it and press the product button.
6. Confirm it lands on the product page.
7. Confirm the product page shows the story in its "Product Story" section.
8. Go back to the seller dashboard Stories tab and delete the story.

Two constraints the owner stated with the journey:

- **The new spec must run after the QA seed**, and it takes the product to
  attach from what the seed has already built.
- **Stable, fast and correct.** All three, in that order of insistence.

## Acceptance Criteria Presence Check

- Present? **no — not in acceptance-criteria form.**
- Notes: the request is a precise, ordered journey, which is more than most
  intakes arrive with, but it is written as steps and not as criteria. Several
  steps hide more than one thing that can fail on its own — "upload a story with
  a product" is at least the upload, the product attachment and the QA link.
  Writing them as `AC-n`, one per independently failing step, is the `spec`
  stage's job.

## Test Cases Presence Check

- Present? **no, and this ticket is unusual: the deliverable *is* the test.**
- Notes: there is no application change being asked for. The product of this
  ticket is a browser spec. That does not remove the need for the `plan > Tests`
  table — the repository's rule is that each `AC-n` names the file and case that
  proves it, and here those cases are the deliverable itself. Care is needed so
  the table does not become a restatement of the spec.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The parts
  are known; this adds a test that does not exist.
- Is the goal to *choose between options*? **No.** There is one journey, and the
  owner has described it.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **Not yet, and this needs watching.** One open question below (the product
  page and the QA filter) could turn into exactly that. If `research` confirms
  it, it is a finding and gets its own ticket — it does not change this one into
  a hotfix, because nothing here reproduces it today.
- Is the change to make already known, leaving only building it? **Yes.**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` (through the `/wf:start-ticket` alias, which fixes the type) |

The two did not disagree, because only one of them spoke.

## What already exists, and what it means for this ticket

Recorded here as qualification, not as planning: these are the facts that make
the request buildable rather than a wish. The `research` stage owns the detail.

- **The QA link rule is built and tested.** `utils/qaStoryFilter.ts` marks a
  story as test data by its link **host** (`qa-test.trydos.tech`, overridable by
  `NEXT_PUBLIC_QA_STORY_LINK_HOST`), and `dropQaStories` removes such a story
  from a feed. So "the link we agreed does not show for real customers" is a
  real, named mechanism and not something to invent.
- **A test account can still see its own QA story.** The same file carries a
  viewer allow-list by phone number, and `tests/e2e/harness/server.ts:87`
  fills `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` from the two configured test phones
  by itself. **So this journey needs no new configuration** to be able to find
  its own story on the home page. This was the one setting that could have
  blocked the ticket, and it is already handled.
- **The seller Stories tab does all three actions.**
  `components/SellerDashboard/StoriesTab.tsx` holds the link field, a product
  picker that sends `product_id`, and a delete confirmation.
- **The product page has the section.** `components/Product/ProductPageContent.tsx`
  renders `ProductStoriesWrapper`, which reads `GetProductStoriesData` and draws
  a "Product Story" heading.
- **The seed already builds a product to attach.** The QA seed creates a QA
  boutique and a QA product, which is exactly what step 3 needs, and it is the
  reason the owner asked for this spec to run after the seed.
- **An earlier stories ticket is closed:** `_specs/e2e-stories-upload-report-delete/`,
  which produced `tests/e2e/stories.live.spec.ts` (STORY-00a … STORY-05) and
  `tests/e2e/actions/story.ts`. This ticket is the **seller** side and the
  **product link**, which that one does not cover.

## Missing Information

Nothing here blocks the move to `research`. Each line is a question `research`
must answer, written down now so none of them is discovered late.

1. **The product page may not filter QA stories.** Four readers call
   `dropQaStories` — `StoriesBarClient`, `StoriesPaginationWrapper`,
   `serverRequests/stories.ts` and `services/story.ts`. `GetProductStoriesData`
   appears not to be one of them. If that is right, a QA story is visible on a
   real customer's product page, which is the exact thing the QA lock exists to
   prevent. It also touches step 7 of the journey: the test would be asserting a
   leak. `research` must settle it, and if it is confirmed it is a `BUG-n`
   finding with its own ticket.
2. **`StoriesTab.tsx` carries no `data-pw` attribute at all.** Every other
   dashboard spec drives the screen through those hooks. Whether this ticket adds
   them, and how many, is a `plan` decision; `research` should say what the tab
   offers today.
3. **"User 1 which has seller signin"** is read as the QA seed's own seller —
   the account whose signed-in session the seed saves to `.auth/qa-seller.json`,
   and the only identity in this suite that has a seller dashboard. `research`
   confirms it, and confirms that account may upload a story.
4. **How far to walk the home stories bar.** The owner said the story may sit on
   page 2 or 3. A bound is needed, and "keep paging until found" is not one.
5. **Which lane, and what it costs.** The journey signs in, writes real rows and
   depends on the seed, so it belongs in the `account` lane. That lane is already
   the one that sets the suite's wall time — measured at 30.3 minutes of tests in
   CI run 35664329326 — so "fast" is a real constraint here and not a wish.
   `spec` should record a time budget for the new file.

## Owner decisions recorded after the intake outcome

Appended, never rewritten, so the order in which things were known stays visible.

- **2026-09-22 — application code is in scope.** The owner said "feel free to
  edit app code if needed". That answers open points 1 and 2 in *Missing
  Information*: adding `data-pw` hooks to `StoriesTab.tsx`, and correcting the
  product page's story reader if it really does skip the QA filter, are both
  allowed to be part of this ticket rather than being pushed to a second one.

  **Two repository rules still apply and are not waived by this permission**, so
  the grant is written down with them attached:

  - *A red test is not a bug report* (`CLAUDE.md`). Application code may be
    changed only after the fault is confirmed in the application, said out loud,
    and proved by a test that was **seen red** before the fix and green after.
  - *Files to change must be listed in the approved plan* (IM-4). Wrong
    behaviour found in a file the plan does not change is a `BUG-n` finding and
    a separate ticket, however small the fix looks.

  So the permission widens what `plan` may propose. It does not let `implement`
  fix whatever it happens to walk past.

## Readiness Status

`READY`

- Justification: the journey is described step by step by the owner, every
  mechanism it depends on already exists in the repository and is named above,
  and the one setting that could have blocked it — letting a test account see its
  own hidden story — is already derived by the harness. The five open points are
  investigation questions for `research`, not missing requirements. None of them
  can change what the ticket is for.
