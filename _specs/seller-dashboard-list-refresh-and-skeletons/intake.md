---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: intake
mode: standard
status: in_progress
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Intake — seller-dashboard-list-refresh-and-skeletons

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`seller-dashboard-list-refresh-and-skeletons` — reported directly by the owner in
conversation. No ClickUp task and no GitHub issue.

## Ticket Summary

A seller who adds or edits a product or a boutique and then presses back sees the
old list. The same journey also collapses the page while it loads, and every list
tab shows a wrong "nothing here" state for a moment before it starts loading. Fix
the stale list, and replace the blank and spinner loading states with skeletons.

## Ticket Metadata

- id / slug: `seller-dashboard-list-refresh-and-skeletons`
- title: Seller dashboard — refresh the product/boutique list on return, and replace the blank/spinner loading states with skeletons
- owner: developer
- created: 2026-09-02
- links: none

## User Story

> As a seller managing my shop, I want the dashboard lists to show my newest
> changes and to load without flashing wrong states, so that I can trust what the
> dashboard tells me about my own products and boutiques.

## Reported Problems

Three problems, reported together because they share one surface.

### P1 — The list does not refresh after add / update / delete

Create, update or delete a product or a boutique, then go back to the dashboard
list. The list still shows what it showed before.

Seller-visible effect:

| Action | What the seller sees on back |
|---|---|
| Create a product while the list already had products | The new product is missing |
| Create a product while the list was empty | Correct — the list happens to reload |
| Update a product | The old name / price / image |
| Delete a boutique | The deleted boutique is still listed |

The "list was empty" case works, which is why the problem can look intermittent.

### P2 — The page collapses when pressing back from a detail route

Pressing back from a product or boutique detail route replaces the whole page with
a large spinner in a short box. The document loses its height and the scroll
position is lost. The owner described it as the page shrinking and ending at the
bottom.

### P3 — A tab shows the wrong state before it loads

Opening a list tab paints in this order:

1. the empty state — "No products found" / "No boutiques found"
2. the loading spinner
3. the real list

Step 1 is wrong information. It tells the seller they have no products at the
moment their products are being fetched.

## Requested Outcome

- The list reflects what the seller just did.
- Loading is shown with skeletons that match the shape of the content, not with a
  blank state, and not with an oversized spinner.
- The loading flag starts in the loading position, so the empty state can never
  paint first.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: The request describes three observed problems and the direction of the
  fix. It carries no numbered, testable criteria. `spec` must write them, and must
  decide what "refreshed" means precisely — in particular whether the refresh is
  on every dashboard mount or only after a change, since the two differ in how
  many requests they cost.

## Test Cases Presence Check

- Present? **no**
- Notes: None given. `plan` must map each `AC-n` to a test file and case, or to
  `none — <reason>`. Note the repo rule that a bug is confirmed by a test that is
  seen red before the fix. Whether the stale-list bug can be reproduced in the
  unit suite (`tests/`, Vitest) without a backend is an open question for
  `research` — the list state lives in a React context, which is reachable in a
  component test, but the fetch is not.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the code
  was already read and the three causes are located.
- Is the goal to *choose between options*? **no** — no decision between competing
  directions is being asked for.
- Is the change to make already known, leaving only building it? **yes** — three
  known defects with a known direction of fix.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` (fixed by the `/wf:start-ticket` alias) |

No disagreement: no ClickUp task was supplied.

## Missing Information

Nothing blocks `research`. These are open, and `research` / `spec` must settle
them:

- **Scope of the skeletons.** The request says skeletons "by default" in the
  seller dashboard. It is not yet decided whether that means only the products and
  boutiques tabs, or every tab that currently shows `LoadingState` (permissions,
  users, roles, orders, gallery, stories, comments, locations, shop info).
- **Refresh trigger.** Refetch on every dashboard mount, or only after a save or a
  delete. This decides the request cost and must be an explicit `AC-n`.
- **The overlay-scroll call for non-intercepted routes.** The in-flow loader gate
  calls the overlay scroll helper for every navigation, including ordinary pages
  such as the dashboard. The owner named this as a possible fourth, separate fix.
  `spec` must either take it in as its own `AC-n` or state that it is out of scope
  and needs its own ticket. It must not be fixed silently along the way.

## Readiness Status

`READY`

- Justification: The three problems are reported with clear seller-visible
  effects, the surface is one area of the app, and the direction of the fix is
  agreed. The open points above are scope questions for `research` and `spec` to
  close, not missing information that stops investigation from starting.
