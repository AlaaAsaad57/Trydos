---
ticket: shop-excel-import-template-mode
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Intake — shop-excel-import-template-mode

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- Slug: `shop-excel-import-template-mode`
- Source contract: `shop-excel-template-mode.md` (repository root, untracked).
- Backend ticket: ClickUp [`z8n6b616ez`](https://app.clickup.com/t/90182710436/z8n6b616ez)
  (Shop API). The contract asks for parity with the backend's own seller
  dashboard tickets `z8n6b60wv5`, `z8n6b616f0` and `z8n6b616f2`.
- No front-end ClickUp ticket was given for this work.

## Ticket Summary

The Shop API added product counts, a `mode` for the template download, a
failed-rows download and a category mismatch check to the Excel bulk import. The
seller dashboard's "Upload Excel File" tab must use all of them, as the contract
describes in its "Recommended UI" (UI-1 to UI-10).

## Ticket Metadata

- id / slug: `shop-excel-import-template-mode`
- title: Seller dashboard Excel import — use the new Shop API features (template
  or products download, product counts, failed-rows download, category mismatch
  check)
- owner: developer
- created: 2026-10-17
- links: backend ClickUp `z8n6b616ez`; no GitHub link yet

## User Story

> As a seller, I want to choose between an empty template and a file of my own
> products for a category, see how many products each category has, download the
> rows that failed to import, and be warned when I upload a file made for another
> category, so that I add or update products in bulk without mistakes and can fix
> failed rows without starting again.

## Acceptance Criteria Presence Check

- Present? **yes**
- Notes: the contract gives ten numbered UI behaviours (UI-1 to UI-10) in §5,
  §7.3 and §8.3, each with a precise rule (when a control is disabled, its label,
  what it sends). The `spec` stage turns them into `AC-n`. UI-6 ("remember the
  last choice") is marked optional in the contract; `spec` must decide whether
  it is in scope.

## Test Cases Presence Check

- Present? **yes**
- Notes: the contract's §9 "Front-end test checklist" has twelve checks. Some of
  them check the backend (for example "the file holds exactly those rows with a
  Reason column"); `spec` must split the front-end checks from the backend
  checks. A unit test file already exists for this tab
  (`tests/components/SellerDashboard/ExcelUploadTab.test.tsx`), and a browser
  helper exists (`tests/e2e/actions/sellerExcel.ts`).

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no**
- Is the goal to *choose between options*? **no** — the contract already fixes
  the API and the recommended UI.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **no** — today's tab works; the backend added new, backward-compatible
  features.
- Is the change to make already known, leaving only building it? **yes**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

None blocks `research`. Open points for later stages:

- **Where the contract lives.** `shop-excel-template-mode.md` sits untracked at
  the repository root. It should move under `docs/` (or be referenced from
  there) so later artifacts point at a tracked file.
- **Staging readiness.** It is not yet confirmed that staging already serves the
  new fields (`products_count`, `failed_rows_count`), the `mode` parameter, the
  `failedRows` endpoint and the `409` answer. `research` should check.
- **UI-6 scope** (optional `localStorage` memory) — decide at `spec`.
- **New user-visible copy** (labels, hints, tooltip, confirm dialog, toasts)
  needs keys in all three translation files (`ar`, `tr`, `ku`).

## Readiness Status

`READY`

- Justification: the request has a written backend contract with exact endpoints,
  fields, error answers and numbered UI behaviours, plus a test checklist. The
  existing tab and its service calls are known. Nothing needed to start
  `research` is missing.
