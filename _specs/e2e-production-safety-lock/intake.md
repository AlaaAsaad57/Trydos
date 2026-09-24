---
ticket: e2e-production-safety-lock
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-19
links:
  clickup:
  github:
---

# Intake — e2e-production-safety-lock

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-production-safety-lock`. No ClickUp task and no GitHub issue.

The request was designed in conversation before this work item was opened. The
design, every decision and every open question live in
**`E2E-PRODUCTION-SAFETY.md`** at the repository root. That file is the source
for the `research` and `spec` stages — it is not a plan, and nothing in it has
been built.

## Ticket Summary

The browser suite writes to data it does not own. Today it picks an arbitrary
real product from the storefront listing, puts it in a bag, and — in `BUY-01` —
places a real order against a real seller and then cancels it. This work item
makes the suite create and use its own QA seller, shop and product instead, and
makes that QA data invisible to real customers on every client.

## Ticket Metadata

- id / slug: `e2e-production-safety-lock`
- title: Run the e2e suite safely on any environment — mark, hide and seed QA data
- owner: developer
- created: 2026-09-19
- links: none

## User Story

> As a Trydos engineer, I want the browser tests to create and use their own
> seller, shop and product, so that a test run never touches a real seller's
> data and no real customer — on the web or in the mobile app — is ever shown
> something a test created.

## Acceptance Criteria Presence Check

- Present? **No** — and correctly so. Acceptance criteria are written at `spec`,
  not at intake.
- Notes: the material they will be written from is complete.
  `E2E-PRODUCTION-SAFETY.md` records eleven answered questions, two answered
  measurements, and a decision table covering the mark, the filter, QA mode, the
  seed, caching, run gates and the migration of the existing tests. Nothing in
  the request is waiting on another person.

## Test Cases Presence Check

- Present? **Partly.**
- Notes: the cases that must *change* are named — `BUY-01`, `BUY-02`, `BUY-03`
  and `BUY-04` in `tests/e2e/shopper.live.spec.ts`, all four of which call
  `addFirstBuyableProduct()` (`tests/e2e/actions/cart.ts:389`). The cases that
  must be *added* — the catalogue lock check, the story lock check, and the
  search case that proves QA mode — are described in the design but not yet
  written as cases. `plan.md` must map each to an `AC-n` before any is written
  (PL-13 / IM-4).

## Workflow Type Check

Confirm this is a Development work item and not another workflow type. This and
`hotfix` are the only types that cut a branch and edit source files, so a wrong
answer here costs the most:

- Is the goal to *understand* something that already exists? **No.** The
  understanding stage is finished; it produced `E2E-PRODUCTION-SAFETY.md`.
- Is the goal to *choose between options*? **No.** The options were compared and
  the decisions are recorded in that file's decision table.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **No.** Nothing is broken. The suite behaves exactly as it was built to; the
  request is to change what it was built to do. This is not a `hotfix`.
- Is the change to make already known, leaving only building it? **Yes** — with
  three named discovery items that belong to `research`, listed under Missing
  Information below.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

No disagreement: no ClickUp task was supplied.

## Missing Information

None of the following blocks this work item. All three are `research` work, and
they are recorded here so `research` does not have to rediscover that they are
open.

- **R-1 — the admin approve screen has never been read.** The seed must approve
  its own seller request, and there is no admin approval API in this repository
  (`docs/market-api-inventory.md:138-139` carries only the shopper's `GET` and
  `POST /shop/vendor-requests`). The decision is to drive the admin dashboard UI
  in a browser. Its path, its controls and its sign-in flow are all unknown.
  **This is the largest piece of unknown work in the ticket.**
- **R-3 — can a seller buy from their own shop?** The plan has shopper B sell and
  shopper A buy, so the answer does not change the design. It matters so that a
  `BUY` failure is never mistaken for a marketplace rule.
- **R-4 — what does a boutique need to activate?** The product's activation
  checks are documented (`docs/mobile-seller-dashboard-api-guide.md:99-101`);
  the boutique's are not. `changeBoutiqueStatus(.., 1)` "may 422 with
  `detailed_error` blockers" (`services/sellerDashboard/index.ts:979`). The
  product owner has confirmed one of them — a boutique needs an active product —
  which is why the product is enabled before the boutique.

## Scope note for the stages that follow

The owner chose a single work item covering all of it: the mark, the filter, QA
mode, the seed, and migrating `BUY-01` to `BUY-04`. This is large for one ticket
and was raised as such; the decision to keep it whole is recorded in
`E2E-PRODUCTION-SAFETY.md`. `spec` and `plan` should expect a wide `AC` set and
a long file list, not a small one.

Two decisions carry accepted risk and must not be quietly re-opened later:

- The seed uses the existing `ADMIN_DASHBOARD_*` account, **which is a
  super-admin**, so CI will hold full control of production.
- A test order reaches our own test seller's inbox, and finance and reporting
  still count it. Cancelling does not undo that.

## Readiness Status

`READY`

- Justification: the request is a change to build, not something to understand or
  choose between. The behaviour to change is identified down to the file and line
  (`tests/e2e/actions/cart.ts:389` and its four callers). The design is written,
  every question put to the owner has an answer, and the three items still open
  are discovery work that belongs to the `research` stage by definition. Nothing
  is waiting on another team.
