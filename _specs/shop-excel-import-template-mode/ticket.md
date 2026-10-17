---
ticket: shop-excel-import-template-mode
title: Seller dashboard Excel import — use the new Shop API features (template or products download, product counts, failed-rows download, category mismatch check)
workflow:
  type: development
  version: 2
  current_stage: verify
  capabilities: []
status: completed
owner: developer
created_at: 2026-10-17
updated_at: 2026-10-17
links:
  clickup: ""
  github: "https://github.com/AlaaAsaad57/Trydos/pull/140"
---

# Ticket Record — shop-excel-import-template-mode

## Summary

The backend (Shop API, ClickUp `z8n6b616ez`) added five changes to the Excel bulk
import endpoints under `/api/v1/shop/excel/*`. The contract is in
`shop-excel-template-mode.md` (repository root). The front end must use them in
the seller dashboard "Upload Excel File" tab
(`components/SellerDashboard/ExcelUploadTab.tsx`):

1. `GET /excel/categories` — every category now has `products_count`.
2. `GET /excel/downloadExcel/{category_id}?mode=template|products` — empty
   template or the seller's own products.
3. `GET /excel/getUploadedExcelFiles` — every file now has `failed_rows_count`.
4. `GET /excel/failedRows/{uploadedFileId}` — new: download the failed rows.
5. `POST /excel/processExcel` — new optional `expected_category_id` and
   `confirm_category`, and a new `409` answer when the file is for another
   category.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-10-17

- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-10-17

- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: ai_agent
  timestamp: 2026-10-17

- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-10-17

- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-10-17

- from_stage: review
  to_stage: implement
  event: review-approved
  result: passed
  by: developer
  timestamp: 2026-10-17
  note: >-
    Owner decision APPROVED. Comprehension gate 1/1, stage review, attempt 1,
    degraded: 1 of 3 administered (CG-8; the integration question was
    administered). Panel: 1 major (F-1, accepted by the owner), 7 minor, 4 info;
    follow-ups in review.md.

- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-10-17
  note: >-
    Branch ticket/shop-excel-import-template-mode from development 2dd40b8e; no
    commit. Every Tests row carried out; new unit cases seen red before the code
    and green after. Whole unit suite exit 0 (7527 passed, 3 expected fail).
    SD-16 (AC-30) written, not run; it needs staging and runs at verify.

- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-10-17
  note: >-
    All 31 acceptance criteria met. Profile full: unit-tests exit 0 (7527
    passed, 3 expected fail), typecheck 0, build 0, lint 1 from two chat keys
    missing on the base branch (F-LINT-1, outside this ticket). Parity 0. SD-16
    on staging 0, request /shop/excel/downloadExcel/587?mode=template. Open
    gaps recorded, not passed: NFR-3 hand check in ar, F-8 size check (QA seller
    has no products). Comprehension gate 3/3, stage verify, attempt 1, degraded:
    integration question excluded.
```
