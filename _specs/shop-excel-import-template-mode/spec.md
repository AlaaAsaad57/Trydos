---
ticket: shop-excel-import-template-mode
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-10-17
links:
  clickup:
  github:
---

# Spec — shop-excel-import-template-mode

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Seller dashboard Excel import — template or products download, product counts,
failed-rows download, category mismatch check.

## Business Goal

Today a seller who downloads a "template" for a category where they already have
products gets a file full of those products. The backend treats a missing `mode`
as "products". If the seller fills that file as "new products", they may change
existing products by mistake. After an import with errors, the seller has no way
to get only the failed rows back. And nothing stops the seller from uploading a
file made for another category.

The Shop API now offers all of this (contract: "Shop API — Excel Bulk Import:
Template Mode, Failed Rows, Category Check", backend ticket `z8n6b616ez`). This
work brings the seller dashboard's "Upload Excel File" tab to the same behaviour
as the backend's own dashboard. Sellers add or update products in bulk with fewer
mistakes, and they fix failed rows without starting again.

## User Story

> As a seller, I want to choose between an empty template and a file of my own
> products for a category, see how many products each category has, download the
> rows that failed to import, and be warned when I upload a file made for another
> category, so that I add or update products in bulk without mistakes and can fix
> failed rows without starting again.

## Functional Requirements

**Category choice**

- **FR-1** The category list shows each category by its full path
  (`Parent -> Sub -> SubSub`). It adds ` (N Products)` when the seller has
  products in that category (`products_count > 0`), and nothing when the count is
  0.
- **FR-2** The list is indented by the category's level (0, 1, 2).
- **FR-3** The seller can type to filter the list by full path. Matching ignores
  letter case. Clearing the text shows the whole list again.
- **FR-4** A checkbox "Show only categories that have my products" limits the list
  to categories with products. The number of such categories shows next to it.
  The checkbox is disabled when that number is 0. When the selected category is
  filtered out, the selection is cleared.

**What to download**

- **FR-5** Two choices, with a short explanation under each:
  - "Add new products" — the default. Downloads an empty template.
  - "Update my products" — downloads the seller's products of that category.
- **FR-6** "Add new products" always asks the backend for the empty template
  (`mode=template`), also for a category that has products. "Update my products"
  asks for the products (`mode=products`). Every download names a mode; none
  leaves it out.
- **FR-7** "Update my products" is disabled when no category is selected or the
  selected category has 0 products. A hint then says: "You have no products in
  this category yet. Use Add new products." When the choice was "Update my
  products" and it becomes disabled, the choice goes back to "Add new products".
- **FR-8** The download button is disabled until a category is selected. Its text
  is "Download empty template" for "Add new products", and "Download N products"
  for "Update my products" (N = the category's count).
- **FR-9** A refused download (for example `403` no permission, `422` bad mode)
  shows the backend's own message. No file is saved.
- **FR-10** A downloaded file is saved as an `.xlsx` file.

**Remember the last choice**

- **FR-11** The tab remembers the seller's last category, filter (checkbox) and
  choice, separately for each seller. It restores them on the next visit to that
  seller's tab.
- **FR-12** On restore:
  - a category that no longer exists is not restored;
  - "Update my products" is restored only when that category still has products,
    otherwise the choice is "Add new products".
- **FR-13** When the browser refuses to store or read the remembered choice, the
  tab still works with its defaults.

**Failed rows**

- **FR-14** Each uploaded file with failed rows (`failed_rows_count > 0`) has a
  "Download N failed rows" button. Its tooltip says "Fix these rows and upload the
  file again". Files with no failed rows show no such button.
- **FR-15** The button downloads the failed rows of **that** upload as an `.xlsx`
  file.
- **FR-16** After a successful failed-rows download, the tab reminds the seller:
  "Fix the rows, keep the Id column, and upload this file again. The Reason column
  is ignored."
- **FR-17** A refused failed-rows download (`403`, `404`, `422`, `500`) shows the
  backend's own message. No file is saved.

**Upload status**

- **FR-18** The files table shows the status `completed_with_errors` with its own
  badge colour, different from "completed" and "failed". Its label is the readable
  text "Completed with errors", translated. The other statuses look as they do
  today.

**Category check on upload**

- **FR-19** When a category is selected, the upload sends it to the backend as the
  expected category. When none is selected, the upload sends no expected
  category.
- **FR-20** When the backend answers that the file is for another category
  (`409` with `category_mismatch`), the tab asks the seller to confirm. The
  question names both categories, for example: *This file is for "Shirts", but
  "Shoes" is selected. Import it into "Shirts"?* This answer is a question, not
  an error. The seller sees no error toast or red error box, and the error
  monitoring records no fault.
- **FR-21** **Yes** → the same upload is sent again with the confirmation. The file
  is not uploaded to the media server a second time. The result is then handled
  as a normal upload: the success message, and the table reloads.
- **FR-22** **No** → the tab says "Upload cancelled. Nothing was imported." and
  sends nothing more.
- **FR-23** Any other refusal of the upload — including a `409` without
  `category_mismatch` — behaves as it does today.

**Copy, docs and existing behaviour**

- **FR-24** Every new word or sentence the seller can see is available in all four
  languages (`en` source, `ar`, `tr`, `ku`).
- **FR-25** The backend contract is kept as a tracked project document, so this
  work's criteria cite a file that is in the repository.
- **FR-26** The bulk-upload feature document (SL-12) describes the new flow: the
  two choices, the counts and the filter, the failed-rows download, the category
  question, and the new status.
- **FR-27** Everything else in the tab works as it does today: choosing and
  dropping a file, the media-server upload, the files table with Notes, Refresh
  and Download, and each error naming the backend that refused.

## Non-Functional Requirements

- **NFR-1** The counts come from the one categories request the tab already
  makes. No extra request per category.
- **NFR-2** The new controls are reachable and usable by keyboard and screen
  reader. The search box, the checkbox and both choices have accessible names.
  The confirm question can be answered by keyboard.
- **NFR-3** The tab still lays out correctly in right-to-left languages (`ar`,
  `ku`) and on a phone-width screen.
- **NFR-4** A session renewal (a `401` on the first try) on any of the new or
  changed requests is handled like every other dashboard request: one exchange,
  then the same request again.

## Constraints

- The backend contract is fixed. The front end uses its endpoints, fields and
  answers as written, and invents none.
- The remembered choice holds no token and no personal data — only category id,
  filter state and choice.
- The live browser suite runs against staging, which serves the new API (owner
  confirmed 2026-10-17, OQ-1). The live case must not create or change products
  in the QA shop. So it does not upload a file.
- Copy follows the project's translation rules: an existing key is reused, a new
  key is added to all three translation files before use.

## Edge Cases

- A seller with **no products anywhere**: no category shows a count, the checkbox
  is disabled, and "Update my products" is disabled for every category.
- **Switching seller** (another shop's dashboard): the counts are that seller's,
  and the remembered choice is that seller's (or none).
- The seller types a search that **matches nothing**: the list is empty and says
  so; the selection is not lost by typing alone.
- The **selected category disappears** from the list because of the checkbox:
  the selection clears, and the download button goes back to disabled.
- A file that is **still processing** has `failed_rows_count: 0`, so no
  failed-rows button.
- The backend answers the failed-rows download with **`422` "This file has no
  failed rows."** (the list was stale): the message shows; no file.
- The upload **mismatch question is answered Yes, and the second answer is an
  error**: that error shows as any upload error does today.
- The remembered category **still exists but now has 0 products**, and the saved
  choice was "Update my products": the category is restored and the choice is
  "Add new products".
- The category list **failed to load**: the existing error and Retry stay; the
  new controls do not appear without a list.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Answered.** Staging already serves all five changes (owner, 2026-10-17). The live check may rely on them. | Constraints; AC-30 |
| OQ-2 | **Partly answered, partly deferred.** Scope (answered by the owner): the list **is** searchable, as UI-1 asks. *How* it is built (shared or local component) and how the live case and unit tests then pick a category is the approach, so `/plan` answers that. | FR-3, AC-3; Open Questions (OQ-2) |
| OQ-3 | **Partly answered, partly deferred.** The required behaviour is answered: the mismatch answer shows no error toast, no red error box, and records no fault in error monitoring. *How* the answer reaches the tab without that is the approach, so `/plan` answers it. | FR-20, AC-23; Open Questions (OQ-3) |
| OQ-4 | **Deferred.** The spec needs only an `.xlsx` file (FR-10, FR-15). Whether the backend's own file name is kept, or the client builds one, is the approach. | Open Questions (OQ-4) |
| OQ-5 | **Answered — in scope** (owner). Remember category, filter and choice per seller. | FR-11..FR-13; AC-15..AC-17 |
| OQ-6 | **Answered — in scope** (owner). Own badge colour and translated label for `completed_with_errors`. | FR-18; AC-22 |
| OQ-7 | **Answered — in scope** (owner). The contract moves into the project's tracked documentation. | FR-25; AC-28 |
| OQ-8 | **Answered — in scope** (owner). The SL-12 feature document is updated. | FR-26; AC-29 |
| OQ-9 | **Answered.** The front end checks what the browser can see and what the requests carry. Properties of the file the **backend** builds are backend checks and are out of scope here: "the template has no product rows", "exactly N rows, only this seller's", "the failed-rows file holds exactly those rows with a Reason column", "the fixed file imports". | Out of Scope |

## Open Questions

- **OQ-2** (deferred from research) — how the searchable list is built, and how
  the live case and unit tests pick a category from it.
- **OQ-3** (deferred from research) — how the `409` mismatch answer reaches the
  tab with no error toast and no fault report.
- **OQ-4** (deferred from research) — the downloaded file's name: the backend's
  own name, or one the client builds.

## Acceptance Criteria Mapping

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A category with `products_count: 5` reads "<full path> (5 Products)"; a category with `products_count: 0` reads "<full path>" with no count. | FR-1 |
| AC-2 | Categories of level 1 and level 2 are indented more than level 0, and level 2 more than level 1. | FR-2 |
| AC-3 | Typing "men" leaves only categories whose full path contains "men" in any letter case. Clearing the text shows them all again. | FR-3 |
| AC-4 | Ticking "Show only categories that have my products" leaves only categories with a count above 0. Unticking brings all back. The number of categories with products shows next to the checkbox. | FR-4 |
| AC-5 | When no category has products, the checkbox is disabled. | FR-4 |
| AC-6 | When the selected category has 0 products and the checkbox is ticked, the selection is cleared and the download button is disabled. | FR-4, FR-8 |
| AC-7 | The tab shows "Add new products" and "Update my products", each with its explanation. "Add new products" is chosen when the tab opens with nothing remembered. | FR-5 |
| AC-8 | With "Add new products" and a category that has products, the download asks the backend for that category with `mode=template`. | FR-6 |
| AC-9 | With "Update my products", the download asks the backend for that category with `mode=products`. | FR-6 |
| AC-10 | "Update my products" is disabled when no category is selected, and when the selected category has 0 products. The hint "You have no products in this category yet. Use Add new products." shows in the second case. | FR-7 |
| AC-11 | With "Update my products" chosen, picking a category with 0 products switches the choice back to "Add new products". | FR-7 |
| AC-12 | The download button is disabled with no category. With a category, it reads "Download empty template" for "Add new products", and "Download 5 products" for "Update my products" on a category with 5. | FR-8 |
| AC-13 | A download the backend refuses shows the backend's own `message`, and no file is saved. | FR-9 |
| AC-14 | A successful download saves one file whose name ends in `.xlsx`. | FR-10 |
| AC-15 | After choosing a category, ticking the checkbox and choosing "Update my products", a new visit to the same seller's tab restores all three. A visit to another seller's tab does not get them. | FR-11 |
| AC-16 | On restore, a remembered category that is no longer in the list is not selected. A remembered "Update my products" on a category that now has 0 products is restored as "Add new products". | FR-12 |
| AC-17 | When storing or reading the remembered choice throws, the tab still opens and works with its defaults. | FR-13 |
| AC-18 | A file with `failed_rows_count: 2` shows "Download 2 failed rows", with the tooltip "Fix these rows and upload the file again". A file with `failed_rows_count: 0`, or without the field, shows no such button. | FR-14 |
| AC-19 | Pressing the button asks the backend for the failed rows of that file's id, and saves one `.xlsx` file. | FR-15 |
| AC-20 | After a successful failed-rows download, the reminder "Fix the rows, keep the Id column, and upload this file again. The Reason column is ignored." shows. | FR-16 |
| AC-21 | A failed-rows download the backend refuses (for example `422` "This file has no failed rows.") shows the backend's own message, and no file is saved. | FR-17 |
| AC-22 | A file with status `completed_with_errors` shows the label "Completed with errors" in a badge whose colour differs from "completed" and from "failed". The other four statuses keep their current badges. | FR-18 |
| AC-23 | With a category selected, the upload sends that category as the expected category. With none selected, it sends no expected category. When the backend answers `409` with `category_mismatch`, a confirm question names the file's category and the selected category. No error toast, no red error box and no error-monitoring fault appear. | FR-19, FR-20 |
| AC-24 | Answering **Yes** sends the upload again with the confirmation and the same file address. The media server gets no second upload. On success, the normal success message shows and the files table reloads. | FR-21 |
| AC-25 | Answering **No** shows "Upload cancelled. Nothing was imported." and sends no further request. | FR-22 |
| AC-26 | A `409` without `category_mismatch`, and any other refused upload, shows the same error as today. | FR-23 |
| AC-27 | Every new seller-visible string exists in `ar`, `tr` and `ku`. The translation parity check and lint pass. | FR-24 |
| AC-28 | The backend contract is a tracked document in the project's documentation, and the root-level untracked copy is gone. | FR-25 |
| AC-29 | The SL-12 feature document describes the two choices, the counts and the filter, the failed-rows download, the category question and the "Completed with errors" status. | FR-26 |
| AC-30 | On staging, the live seller-dashboard case (SD-16) picks a category in the new control and, with "Add new products", downloads a real `.xlsx` file. The request it sends carries `mode=template`. | FR-3, FR-6, FR-10 |
| AC-31 | Every behaviour the tab's existing unit tests cover still holds: file choice, the media-server upload then the shop-backend processing, each refusal naming its backend, the files table, Notes, Refresh and Download. | FR-27 |

## Out of Scope

- Properties of the files the backend builds (OQ-9): that the template has no
  product rows, that "Update my products" returns exactly N rows of this seller
  only, that the failed-rows file holds exactly the failed rows with a Reason
  column, and that the fixed file imports. Those are backend checks.
- Uploading a file in the live browser suite. An upload would create real
  products in the QA shop.
- Translating the other upload statuses (`uploaded`, `processing`, `completed`,
  `failed`). They keep their current raw labels; only the new status gets a
  translated label.
- The template's own content (frozen header row, red required headers, notes).
  It comes with the file and needs no front-end work (contract §6).
- Any change to the media-server upload or to the "Download" link of the original
  file.
- The request-title copy-paste in the uploaded-files request (it reuses the
  "process Excel" title). Noted in research; harmless, not part of this work.
