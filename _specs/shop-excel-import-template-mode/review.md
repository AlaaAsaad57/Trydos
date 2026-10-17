---
ticket: shop-excel-import-template-mode
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Review — shop-excel-import-template-mode

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (27 FR, 4 NFR, 31 AC) and `plan.md` (8 steps, Tests table for AC-1..AC-31,
validation profile `full`), with `research.md` as context. The three advisory
lenses read `spec.md` + `plan.md` and checked their claims against the repository.

## Plan Summary

Keep the native category `<select>` and filter it with a search box and a
"products only" checkbox. Send `mode` on every template download. Add a
failed-rows download through a shared private download helper in the service.
Send the expected category on upload, and handle the mismatch `409` through a
field-matched early return in `fetchData`. Remember the last choice per seller
in `localStorage`. Move the contract into `docs/`, and update SL-12.

## Risks

- The `fetchData` change reaches every client call (Integration surface).
- The 401 renewal moves into a shared helper. A mistake breaks every template
  download.
- The remembered choice lives in `localStorage`, and the live suite saves
  `localStorage` into its session jar (panel finding, senior).

## Assumptions

- Staging serves the new API (owner, 2026-10-17).
- The backend checks that a failed-rows upload id belongs to the `X-Seller-ID`
  shop (contract §7.2: `404` "Uploaded file not found.").

## Open Questions

- none beyond the panel findings below.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).** The gate
> examines the owner on these findings, so they have to be readable first; the
> **Decision** and **Approvals** sections below are filled in afterwards.
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| F-1 | senior | **major** | The remember key will break SD-16 on any run that reuses the session jar. `saveSession` calls `context.storageState({ path })` (`tests/e2e/harness/liveSession.ts:192`), which saves `localStorage` as well as cookies. After one SD-16 run, the jar holds `bulk-import:shop:<sellerId>` with a category id. The next SD-16 on that jar (a retry or a later run) gets the category restored, and its first step — "Download Template can be pressed before any category is chosen" (`sellerDashboard.live.spec.ts:1062-1065`) — goes red. The plan resets only the mode. Fix: clear the key (or the selection and the checkbox) in the helper before the first step, and add the jar to the Integration surface. Verified by the gate: `liveSession.ts:192` does call `storageState`. | plan step 7, Integration surface, AC-30, FR-11 | accept (owner) |
| F-2 | senior | minor | The existing service block `describe("seller-dashboard service — downloadExcelTemplate")` (`tests/services/sellerDashboard/updateShopInfoBody.test.ts:556-676`, 8 calls) calls `downloadExcelTemplate("9", 4)` with no `mode`. A required `mode` makes that a tsc error. The block also asserts the target `/shop/excel/downloadExcel/4` and the fallback name `template-4.xlsx`, which both change. The Tests table does not name these adjustments (`research.md` missed the block too). The shared helper would also keep the text "Failed to download template (502)" for a failed-rows download. Fix: list the adjustments, pass the fallback error text into the helper, and test the private helper through its public callers. | plan step 4, Tests AC-14 / AC-19 / AC-31 | |
| F-3 | senior | minor | The order of the remember effects can lose the saved choice. A write effect that runs at mount writes the defaults before the restore reads them. The FR-7 reset can also move a restored "Update my products" back to template if the category is not set first. Fix: write nothing until the restore has run; set category, checkbox and mode in one update; AC-15 must mount a fresh tab over a key that is already stored. | plan step 5 (Remember, Choice block), AC-15, AC-16 | |
| F-4 | senior | minor | Two rules in step 5 disagree. "The selected option is always kept in the list" (category block) against "the selection clears when the checkbox hides it" (checkbox rule). Fix: say that "always kept" applies to the search box only. | plan step 5, AC-6, spec edge cases | |
| F-5 | security | minor | Step 1 misses stack names in the contract it moves into docs. Line 38 says "Passport token". Line 15 also lists backend `tests/Feature/Shop/*.php` paths, while the plan drops only the controller path. No real secret is in the file (all tokens are `<token>` placeholders). Fix: grep the moved file for `Laravel|Passport|\.php` and replace every hit. | plan step 1, AC-28; `shop-excel-template-mode.md:13,15,38` | |
| F-6 | security | minor | The restored `mode` from `localStorage` goes into the backend URL as `?mode=<mode>`. The restore rules check the category and its count, but not that `mode` is one of the two known values. Low risk (only the same user writes `localStorage`). Fix: accept only `"template"` / `"products"`, use `"template"` otherwise, and add an AC-16 case for a bad value. | plan steps 4–5, FR-12, AC-16 | |
| F-7 | security | minor | The `fetchData` early return is global. A `409` carrying `data.category_mismatch` from any endpoint would skip the toast and Sentry. Fix: also match the request (`/shop/excel/processExcel` on `market-dashboard`), or keep the field match and add a test that another endpoint's `409` with the same field still reports. | plan step 3, Approach (OQ-3); `utils/fetchData.ts:708` | |
| F-8 | performance | minor | "Update my products" on a level-0 category can return a seller's whole catalogue in one file. `/api/proxy` reads the whole binary answer into memory (`app/api/proxy/route.ts:442`) and does not stream it, so a large file could meet the Vercel response size limit (about 4.5 MB) or function memory. Fix: at `/verify`, download the biggest level-0 category for the QA seller and record size and time; name the limit as a known risk, or ask the backend for a row limit. A streamed proxy is a separate ticket. | AC-9, plan step 4, Approach | |
| F-9 | security | info | The failed-rows download sends a file id and a client-chosen `x-seller-id`. Only the backend can check ownership. Confirm with backend ticket `z8n6b616ez` that another shop's id answers `403`/`404`. | plan step 4, AC-19 | |
| F-10 | security | info | The 401 renewal moves into the shared helper. Keep the planned 401 case for `downloadFailedRows` and add the same for `downloadExcelTemplate`, so both callers are covered. | plan step 4, Integration surface | |
| F-11 | senior | info | `docs/market-api-inventory.md:174-179` has no row for `/shop/excel/failedRows/{id}`, and `docs/mobile-seller-dashboard-api-guide.md:305` shows the `processExcel` body as `{ file_url }` only. Optional: update them, or list them as out of scope. | plan step 8 | |
| F-12 | security, senior, performance | info | No protected path, no Sentry config, no `/api/proxy` change. Backend text is shown through React text. File names are cleaned. The `409` check costs nothing on normal requests. Counts come from the one categories request (NFR-1). | plan Files to change, step 3, NFR-1 | |

## Decision

`APPROVED`

- Rationale: the owner chose `approved` after the comprehension gate passed
  (1/1, short gate — see `comprehension.md > degraded`). The plan stands as
  written. The owner gave an explicit disposition for the one `major` finding
  (F-1: accept). The minor and info findings got no disposition from the owner.
  They are carried below as follow-ups for `implement`, inside the files the plan
  already declares.

### Major finding dispositions

| Finding | Disposition | Reason |
|---------|-------------|--------|
| F-1 | **accept** (owner) | Fix in `implement`: the SD-16 helper (`tests/e2e/actions/sellerExcel.ts`, already under Files to change) clears the remembered key, or the selection and the checkbox, before the first SD-16 step. |

Minor / info findings F-2..F-12: no owner disposition recorded. Each one is
listed under Required Follow-up Actions.

## Approvals

- Approver (owner): developer (self-approval), 2026-10-17.

## ADR reference

- ADR: none

## Required Follow-up Actions

These follow-ups are for `implement`. Each one stays inside a file that `plan.md >
Files to change` already lists. A follow-up that needs a file or a test case
the plan does not declare is a plan revision (hard stop), not something
`implement` adds on its own.

1. **F-1 (accepted).** In `tests/e2e/actions/sellerExcel.ts`, clear
   `bulk-import:shop:<sellerId>`, or reset the selection and the checkbox,
   before SD-16's first step.
2. **F-2.** Adjust the existing `downloadExcelTemplate` block in
   `tests/services/sellerDashboard/updateShopInfoBody.test.ts` (lines 556–676)
   to the new required `mode`, the `?mode=` target and the new fallback name.
   Do not weaken its assertions. Give the helper the error text for each caller,
   so a failed-rows refusal does not say "template". Record these adjustments in
   `implement.md`.
3. **F-3.** Write the remembered choice only after the restore has run. Restore
   category, checkbox and mode in one update, so the FR-7 reset cannot undo a
   valid restore. The AC-15 case mounts a fresh tab over a key that is already
   stored.
4. **F-4.** "The selected option is always kept in the list" applies to the
   search box only. The checkbox still clears a hidden selection (AC-6).
5. **F-5.** When moving the contract, replace every hit of
   `Laravel|Passport|\.php` (lines 13, 15, 38), including the backend test
   paths.
6. **F-6.** On restore, accept only `"template"` / `"products"` for `mode`, and
   use `"template"` for anything else.
7. **F-7.** Keep the field match (plan OQ-3). The existing case "still reports a
   409 that is not a cart lock" keeps guarding the other 409s.
8. **F-8.** At `/verify`, download "Update my products" on the QA seller's
   biggest level-0 category, and record the file size and the time.
9. **F-9.** No front-end action. Backend ownership check per contract §7.2
   (`404` "Uploaded file not found.").
10. **F-10.** The planned 401 case for `downloadFailedRows` stays. The existing
    `downloadExcelTemplate` 401 case in the same block (F-2) keeps covering the
    other caller.
11. **F-11.** Out of scope for this ticket. `docs/market-api-inventory.md` and
    `docs/mobile-seller-dashboard-api-guide.md` are not in Files to change.
