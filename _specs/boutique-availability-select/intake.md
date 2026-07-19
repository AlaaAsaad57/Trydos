---
ticket: boutique-availability-select
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Intake — boutique-availability-select

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

boutique-availability-select (no ClickUp task / GitHub issue linked)

## Ticket Summary

Add an availability select field to the boutique form. The availability options
are lookup-driven: on edit they arrive in the `GET /edit` response, and on
create they are fetched via the lookup API. The lookup response shape is:

```json
[
  { "value": 1, "label": "Web" },
  { "value": 2, "label": "Mobile" },
  { "value": 3, "label": "WebMobile" }
]
```

Context from the requester: an availability field was added before and later
hardened to a fixed web/mobile choice; this ticket moves it to the
backend-provided lookup options instead.

## Ticket Metadata

- id / slug: boutique-availability-select
- title: Add availability select to the boutique form (lookup-driven Web/Mobile/WebMobile options)
- owner: developer
- created: 2026-07-19
- links: none

## User Story

> As a seller editing or creating my boutique, I want to choose the boutique's
> availability (Web / Mobile / WebMobile) from a select populated by the
> backend lookup, so that the available options always match what the platform
> supports.

## Acceptance Criteria Presence Check

- Present? no
- Notes: Requester described behavior (select in boutique form; options from
  `GET /edit` on edit, lookup API on create; the three value/label pairs) but
  no formal AC-n list yet — to be derived in `/spec`.

## Test Cases Presence Check

- Present? no
- Notes: No test cases supplied (repo policy: no automated tests; manual
  validation to be defined in `/spec` / `/plan`).

## Missing Information

None — all initial open points were answered by the requester (2026-07-19):

- **Options source (edit):** `GET /boutiques/{id}/edit` — availability options
  are in the response's `lookups` field.
- **Options source (create):** `GET /boutiques/lookups` — availability options
  are in the response's `data` field.
- **Submit payload key:** `availability` (already exists in the payload).
- **Previous hardened web/mobile field:** replaced — submit the real value
  picked by the user from the lookup options.
- **Option label translation:** handled locally (ar/tr/ku translation files),
  not backend-provided labels.

## Readiness Status

`READY`

- Justification: Confirmed by the owner (2026-07-19). Goal, target form, both
  option endpoints and their response fields, the submit payload key, the
  replacement of the old hardened field, and the translation approach are all
  known. Nothing blocks `/research`.
