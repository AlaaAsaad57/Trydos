---
ticket: shop-excel-import-template-mode
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Verify — shop-excel-import-template-mode

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `full` (from `.claude/project-config.yaml`: lint, typecheck,
  unit-tests, build). Plus the two checks the plan named outside the profile:
  `pnpm lint:i18n-parity` and SD-16 on staging.
- Branch: `ticket/shop-excel-import-template-mode` (base `development` `2dd40b8e`),
  uncommitted working tree. All runs on 2026-10-17.

### Profile and extra checks

| Check | Command (resolved) | Exit | Output summary |
|-------|--------------------|------|----------------|
| unit-tests | `pnpm test:run` | **0** | 651 files passed; 7527 tests passed, 3 expected fail (the existing `it.fails` BUG markers); 1236 s |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` (after `pnpm exec next typegen`) | **0** | no errors |
| build | `pnpm build` | **0** | production build finished; route table printed |
| lint | `pnpm lint` | **1** | 2 errors, 80 warnings. **Both errors are outside this ticket:** `local/translate-key-exists` for "Search a tag" (`components/Chat/components/TaggedMessages.tsx:142`) and "New tag" (`components/Chat/components/messages/MessageTagPicker.tsx:88`). Both keys are missing from ar/tr/ku on the base commit `2dd40b8e` too (they came in with commit `1163efd1`). No error in any file this ticket changed — see Findings F-LINT-1. |
| i18n-parity (extra) | `pnpm lint:i18n-parity` | **0** | "2578 keys present in all three files" |
| staging health (extra) | `pnpm e2e:health` | **0** | search 1039 ms, gateway 872 ms, core backend 1069 ms |
| SD-16 (extra, AC-30) | `pnpm test:e2e:live --skip-build --lane=account -g "SD-16"` | **0** | 2 passed (QA seed setup + SD-16, 24.8 s), 3.9 min total |

### Per acceptance criterion

"Tab" = `tests/components/SellerDashboard/ExcelUploadTab.test.tsx`;
"Service" = `tests/services/sellerDashboard/updateShopInfoBody.test.ts`;
"fetchData" = `tests/utils/fetchData.test.ts`. All three ran inside
`pnpm test:run` (exit 0 above); each declared case is in a passing file, and no
case in them failed.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Tab: `shows "(N Products)" after a category…` | `pnpm test:run` | 0 | passed | met |
| AC-2 | Tab: `indents sub categories one step…` | `pnpm test:run` | 0 | passed | met |
| AC-3 | Tab: `the search box keeps only categories whose path matches…` | `pnpm test:run` | 0 | passed | met |
| AC-4 | Tab: `"only categories that have my products" hides the empty ones…` | `pnpm test:run` | 0 | passed | met |
| AC-5 | Tab: `the products-only box cannot be ticked…` | `pnpm test:run` | 0 | passed | met |
| AC-6 | Tab: `ticking the products-only box clears a picked category…` | `pnpm test:run` | 0 | passed | met |
| AC-7 | Tab: `offers "Add new products" and "Update my products"…` | `pnpm test:run` | 0 | passed | met |
| AC-8 | Tab: `"Add new products" asks for the empty template…`; Service: `downloadExcelTemplate puts the mode in the address…` | `pnpm test:run` | 0 | passed | met |
| AC-9 | Tab: `"Update my products" asks for the seller's products…`; Service: same mode case | `pnpm test:run` | 0 | passed | met |
| AC-10 | Tab: `"Update my products" is off with no category…` | `pnpm test:run` | 0 | passed | met |
| AC-11 | Tab: `picking a category with no products moves the choice back…` | `pnpm test:run` | 0 | passed | met |
| AC-12 | Tab: `cannot be downloaded before a category is picked`; `the button says "Download empty template" or "Download N products"` | `pnpm test:run` | 0 | passed | met |
| AC-13 | Tab: `says why the template could not be prepared` | `pnpm test:run` | 0 | passed | met |
| AC-14 | Tab: `saves the downloaded file under an .xlsx name`; Service: `uses the default country and language, and the name it is given…` | `pnpm test:run` | 0 | passed | met |
| AC-15 | Tab: `remembers category, box and choice for this seller…`; `restores a choice that was stored before the tab opened` | `pnpm test:run` | 0 | passed | met |
| AC-16 | Tab: `does not restore a category that is gone…` | `pnpm test:run` | 0 | passed | met |
| AC-17 | Tab: `still works when the browser refuses to store or read…` | `pnpm test:run` | 0 | passed | met |
| AC-18 | Tab: `offers "Download N failed rows" only for a sheet with failed rows` | `pnpm test:run` | 0 | passed | met |
| AC-19 | Tab: `downloads the failed rows of the sheet that was clicked`; Service: `downloadFailedRows asks the proxy…`, `downloadFailedRows renews the session once on a 401…` | `pnpm test:run` | 0 | passed | met |
| AC-20 | Tab: `after the failed rows download, reminds the seller…` | `pnpm test:run` | 0 | passed | met |
| AC-21 | Tab: `shows the backend's words when the failed rows cannot be downloaded` | `pnpm test:run` | 0 | passed | met |
| AC-22 | Tab: `shows "Completed with errors" in its own colour` | `pnpm test:run` | 0 | passed | met |
| AC-23 | fetchData: `hands a category-mismatch 409 back without a toast or an error report`; Tab: `sends the picked category with the upload`, `sends no expected category when no category is picked`, `asks before importing a file made for another category…`; Service: `processExcel sends the expected category only when it is given` | `pnpm test:run` | 0 | passed | met |
| AC-24 | Tab: `"Yes" imports the file into its own category without uploading it again`; Service: `processExcel sends confirm_category when asked to` | `pnpm test:run` | 0 | passed | met |
| AC-25 | Tab: `"No" cancels the import and sends nothing more` | `pnpm test:run` | 0 | passed | met |
| AC-26 | Tab: `a 409 that is not about the category is shown as an error, as before` | `pnpm test:run` | 0 | passed | met |
| AC-27 | `pnpm lint:i18n-parity`; `pnpm lint` (`local/translate-key-exists`) | see table above | 0 / 1 | parity exit 0. Lint reports **no** missing key for any string this ticket added; its exit 1 comes only from the two chat keys outside this ticket (F-LINT-1) | met for this ticket's strings; repo-wide lint red on the base branch |
| AC-28 | `git status --short`; `ls shop-excel-template-mode.md` | — | — | `docs/shop-excel-template-mode.md` is present (new, joins git with the delivery commit). The repo root has no copy (`ls`: no such file). `grep -niE "laravel\|passport\|\.php"` on the moved file finds nothing | met |
| AC-29 | read `docs/features/H-seller-dashboard/SL-12-bulk-upload-excel.md` | — | — | describes the two choices, the counts and the products-only filter, the failed-rows download, the category question, and the "Completed with errors" status | met |
| AC-30 | SD-16 step `the download asked the core backend for the empty template (mode=template)` | `pnpm test:e2e:live --skip-build --lane=account -g "SD-16"` | 0 | passed. The request log shows `GET /shop/excel/downloadExcel/587?mode=template` → 200, and a real `.xlsx` was saved | met |
| AC-31 | Tab: the 28 cases that existed before | `pnpm test:run` | 0 | all present and passing | met |

### Non-functional requirements

- **NFR-1** — met. The tab makes one categories request; counts come from it.
  Staging answered `/shop/excel/categories` once per open in the SD-16 log, with
  `products_count` on all 20 categories.
- **NFR-2** — met by structure. The radios sit in a `fieldset` with a `legend`.
  Each radio is named by its title (`aria-labelledby`) and described by its
  explanation (`aria-describedby`). The search box has an `aria-label`. The
  dialog has `role="dialog"`, `aria-modal`, focus on Yes, and Escape = No. The
  tab tests find every control by role and name.
- **NFR-3** — **not checked by hand.** The plan asked for a look at the tab in
  `ar` at phone width. The e2e harness removes its saved seller session after the
  run, and a new sign-in needs a real OTP, so no signed-in seller page was
  available. The markup uses the tab's existing `dir` handling and logical
  classes (`text-start`, `gap`). This is an open gap, not a pass.
- **NFR-4** — met. Service case `downloadFailedRows renews the session once on a
  401 and asks again`; the existing template 401 cases still pass through the
  shared helper.

### Review follow-ups

- **F-1 (accepted)** — done. The helper clears the key before page scripts run.
  SD-16 passed on a jar from earlier runs.
- **F-2, F-3, F-4, F-5, F-6, F-7, F-10** — done in implement (see `implement.md`).
- **F-8** — **could not be measured.** On staging the QA seller has
  `products_count: 0` in all 20 categories. So "Update my products" is disabled
  for every category, and there is no large file to time. The risk stays as
  written in SL-12 ("Known gaps").
- **F-9** — backend check; no front-end action.
- **F-11** — out of scope.

### Integration surface — did it hold?

- **`fetchData`**: the new branch matches only `409` + `data.category_mismatch ===
  true`. The RDB cart-lock case and "still reports a 409 that is not a cart lock"
  pass. The whole unit suite (every `fetchData` caller's tests) passes.
- **Shared download helper**: the template download still renews the session on
  a 401 (existing service cases pass). SD-16 downloaded a real `.xlsx` through
  it on staging.
- **Translation files**: 22 keys added, none changed. Parity passes. The one
  lint error class in the repo predates this change (F-LINT-1).
- **localStorage key**: `bulk-import:shop:<sellerId>`. SD-16 clears it before
  load, and it passed.
- **SD-16 helper + `data-pw="seller-excel-mode-template"`**: landed together;
  SD-16 green.
- Held. Nothing outside the declared surface changed (`git status` lists only
  the planned files).

## Commands run

- `pnpm test:run`
  ```
  Test Files  651 passed (651)
       Tests  7527 passed | 3 expected fail (7530)
  unit exit 0
  ```
- `node_modules/.bin/tsc --noEmit --pretty false` → exit 0, no output.
- `pnpm build` → exit 0.
- `pnpm lint`
  ```
  142:42  error  i18n key "Search a tag" is missing from: ar, tr, ku …  (components/Chat/components/TaggedMessages.tsx)
  88:42   error  i18n key "New tag" is missing from: ar, tr, ku …      (components/Chat/components/messages/MessageTagPicker.tsx)
  ✖ 82 problems (2 errors, 80 warnings)
  lint exit 1
  ```
- `pnpm lint:i18n-parity` → `✓ i18n parity OK — 2578 keys present in all three files.`
- `pnpm e2e:health` → `staging health check passed (search 1039ms, gateway 872ms, core backend 1069ms)`
- `pnpm test:e2e:live --skip-build --lane=account -g "SD-16"`
  ```
  ✓ 1 [setup] › harness/qaSeed.ts › QA seed › builds or confirms this environment's QA shop (1.9m)
  ✓ 2 [live] › sellerDashboard.live.spec.ts:1044 › SD-16 the Excel section downloads a real .xlsx template for a category (24.8s)
  2 passed (3.9m)
  [req] srv=market-dashboard api=/shop/excel/downloadExcel/587 m=GET st=200   (url /shop/excel/downloadExcel/587?mode=template)
  ```

## Findings — confirmed bugs, out of scope

`implement.md` recorded no `BUG-n`. This run confirmed one problem outside the
ticket's files:

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------------------|--------|
| F-LINT-1 | `pnpm lint` fails on `development` itself: two chat strings have no ar/tr/ku translation | `pnpm lint` → `local/translate-key-exists` (lint rule, no expected-failure marker applies) | `components/Chat/components/TaggedMessages.tsx:142` ("Search a tag"), `components/Chat/components/messages/MessageTagPicker.tsx:88` ("New tag"); keys missing from `public/translations/translations.{ar,tr,ku}.js` since commit `1163efd1` | Expected: lint exit 0. Actual: 2 errors, exit 1, on base `2dd40b8e` and on this branch | _(to open)_ |

The translation files are in this ticket's Files to change, but the missing
keys belong to the chat feature, not to any string this ticket added. Adding
chat keys here would grow the change beyond the approved plan, so it is
recorded, not fixed (VF-7).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **no** (this
  repository owns none). No Sentry config, `instrumentation*`, `proxy.ts`,
  `next.config.ts` or workflow file changed.
- Runtime effect on error reporting: one fewer Sentry event per category-mismatch
  answer, on purpose (FR-20). Every other `409` is still reported.

## Sign-off

- Outcome: verified
- Final ticket state: completed
- Sign-off: developer (self sign-off by the owner, after the verify comprehension gate, 3/3)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - Two gaps are open, not passes: NFR-3 (no hand check in `ar` at phone width)
    and F-8 (no large file to measure on staging).
  - One finding to ticket: F-LINT-1 (repo-wide lint red from chat keys).
