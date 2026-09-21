---
ticket: e2e-product-comments-and-reactions
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-21
links:
  clickup:
  github:
---

# Intake — e2e-product-comments-and-reactions

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-product-comments-and-reactions` — no ClickUp task and no GitHub issue yet.
The request was given directly by the Workflow Owner in the session of
2026-09-21.

## Ticket Summary

Add a browser (Playwright) journey that covers the product comment and reaction
section end to end, across two real accounts: a shopper who writes and reacts,
and the seller who answers from the dashboard. The journey must also prove that
every action survives a page reload, and that every undo (unlike, delete) also
survives a reload.

## Ticket Metadata

- id / slug: `e2e-product-comments-and-reactions`
- title: Browser journey for product comments, replies and reactions
- owner: developer
- created: 2026-09-21
- links: none yet

## User Story

> As the team that ships the storefront, I want a browser journey that plays the
> whole comment and reaction flow with two real accounts, so that a break in
> liking, commenting, editing, replying or deleting is caught before a shopper
> finds it.

## The requested flow

The request describes one long journey. Recorded here in the order it was given,
as the raw request — the spec stage turns it into `AC-n`.

**Order in the suite.** The journey runs **after** the QA live work that is
already in the suite, so it reuses that seeded data and its production safety
rules.

**User 1 — the shopper**

1. Sign in.
2. Open the product.
3. Like the product.
4. Write a question/answer (FAQ) comment from **both** places the page offers:
   the section inside the page, and the extended area in the footer.
5. Try to edit the comment from **both** places.
6. Like both comments.
7. Use translate on a comment — only check that the API call succeeds.

**User 2 — the seller**

8. Go to the seller dashboard.
9. Find the product card and check the like is shown there. The product may not
   be on the first page, so the journey must page through the list to find it —
   never assume the first page holds it. This is for later, when more products
   exist.
10. Reply to both comments.
11. **First read the code:** can a seller like a comment? If the code says yes,
    test it. If the code says no, skip it — do not build it.

**User 1 again — the shopper returns**

12. Check both replies are there.
13. Like both replies.
14. Reload the page — comments, replies and reactions must all still be there.
15. Unlike both comments and both replies.
16. Reload again — the unlike must have stuck.
17. Delete both comments.
18. Unlike the product.
19. Reload — the delete and the unlike must both have stuck.

**Ground rule from the Workflow Owner:** the code is the source of truth. Any
question about what the feature does is answered by reading the app, never by
guessing from the request text.

## Acceptance Criteria Presence Check

- Present? **Partly.** The request lists the steps in order and says what must be
  true after each reload. It does not yet list them as numbered, testable `AC-n`.
- Notes: The spec stage will turn each step, and each "must survive a reload"
  check, into its own `AC-n`. Two points are conditional on what the code says —
  whether a seller can like a comment (step 11), and what the translate call
  looks like (step 7) — so research answers those first.

## Test Cases Presence Check

- Present? **Yes, in substance.** The request *is* a test case list: one long
  browser journey with named steps.
- Notes: The repository rule that a failure must name the step and the backend
  applies in full. Each step that can break on its own gets its own check and its
  own message, and the journey uses `test.step()` so the report names the step.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The end
  product is a new test file in the repository, not a document.
- Is the goal to *choose between options*? **No.** Nothing is being compared.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **No.** No bug is reported. If the new journey finds one, it is recorded as a
  finding and gets its own ticket.
- Is the change to make already known, leaving only building it? **Yes.** The
  flow is given step by step; only the code details are still to be read.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Nothing blocks the next stage. These are open points for `research` to answer
from the code, not from the request:

- Where the two comment entry points live on the product page, and whether both
  post the same kind of comment.
- Whether edit is offered in both places, and what it allows.
- What the translate action calls, and what a successful answer looks like.
- Whether a seller account may like a comment at all.
- How the seller dashboard product list pages, so the journey can walk it.
- Which accounts and which seeded product the journey uses, given the QA live
  safety rules already in the suite.

## Readiness Status

`READY`

- Justification: The requested flow is complete and ordered, the two accounts and
  their roles are named, and the reload checks are stated. The open points above
  are all questions about existing code, which is exactly what the `research`
  stage reads. No outside party has to answer anything first.
