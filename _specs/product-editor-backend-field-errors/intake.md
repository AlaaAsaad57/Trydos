---
ticket: product-editor-backend-field-errors
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Intake — product-editor-backend-field-errors

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`product-editor-backend-field-errors` — no ClickUp task, no GitHub issue. The
request came directly from the owner in conversation on 2026-08-26.

## Ticket Summary

The backend runs validation rules that the product editor does not know about and
cannot know about. When one of those rules rejects a product add or edit, the
seller is told only "Failed to update product". The rejected field is not marked
and the backend's own explanation is thrown away. This work makes a rejected save
behave like our own client-side validation: the failing field shows the backend's
message and the page scrolls to it.

The example the owner gave:

```json
"detailed_error": [
  { "code": "barcode", "message": "This barcode already exists" }
]
```

Today that produces nothing on the Barcode input.

## Ticket Metadata

- id / slug: `product-editor-backend-field-errors`
- title: Show backend validation errors on the product editor's own fields
- owner: developer
- created: 2026-08-26
- links: none

## User Story

> As a seller adding or editing a product, I want a rejected save to mark the
> field the backend refused and show me what the backend said, so that I can fix
> the real problem instead of guessing which of forty inputs is wrong.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: The request states the wanted behaviour clearly but writes no `AC-n`.
  The `spec` stage writes them. Three owner decisions and four open questions
  below are the material it must turn into criteria.

## Test Cases Presence Check

- Present? **no**
- Notes: No test was named in the request. A unit test is possible without a
  backend — `mapServerErrors` is exported and pure
  (`components/SellerDashboard/productEdit/helpers.ts:1128`), and a sibling test
  file already imports from that module
  (`tests/components/SellerDashboard/productEdit/validate.weight.test.ts:12-17`).
  `plan` declares the exact files and cases.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the reading
  is done; this intake records it.
- Is the goal to *choose between options*? **no** — the three open choices were
  put to the owner and answered before this stage (see Owner decisions).
- Is the change to make already known, leaving only building it? **yes** — the
  behaviour is described and the files that hold it are identified.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Owner decisions

Settled with the owner before this stage. `spec` treats these as given and does
not re-open them.

| id | Decision | Effect |
|---|---|---|
| **D-1** | Proceed without the backend body contract. | The contract file is missing from this machine (see Missing Information). Anything about the exact `code` spelling the backend emits is an **open question**, never a stated fact. |
| **D-2** | Show the backend message only when the response status is `422`. | `httpStatus` is already on the rejection envelope (`utils/fetchData.ts:767`). Any other status keeps today's translated general message. |
| **D-3** | **Flat** codes bind to their own input and behave like our own validation — the field is marked, the backend's message is shown on it, the page scrolls to it. A **nested** code is ignored as a field: it is bound to no input. Only its `message` is shown, as readable text. The `detailed_error` array is never rendered as JSON, and never as `[object Object]`. | Supersedes an earlier answer of "reduce a nested code to its base field". The owner replaced it in the same conversation; the later instruction wins. Both are recorded because a reader of the earlier answer would otherwise build the wrong thing. |
| **D-4** | **The backend sanitises its own responses.** No message it returns carries sensitive data or database statements. Information leaking through a shown message is **not a risk this ticket carries**, and no filter, content check or redaction is built. | Owner statement, 2026-08-26. It retires the stated reason behind the shipped `AC-11` (below), so the reversal is deliberate rather than an oversight. It also means `D-2`'s `422` gate rests on "422 means validation", not on preventing a leak. |
| **D-5** | The backend localizes its messages from the request language. Its text is shown to the seller as it arrives. | Owner assertion, given in the request. `V-10` proves the language is sent; it does not prove every message path honours it. Recorded as an assertion, not as a verified fact — see OQ-3. |
| **D-6** | Validation problems arrive under `422` and under no other status. | Owner assertion. Closes `OQ-4` and makes `D-2`'s gate complete: gating on `422` hides no validation problem. Recorded as an assertion — no repository evidence proves `422` is the only such status. |
| **D-7** | Editing a field clears the backend error sitting on it. | Answers `OQ-5` (research `R3`). Today `patch` never touches `errors`, so a backend error stays on screen after the seller fixes it. With a real message shown, a stale one would tell the seller a fixed problem is still broken. |
| **D-8** | The four codeless phrase matches keep working exactly as they do today. `D-3` applies to a `code`, not to a message that carries no code. | Answers `OQ-6` (research `R4`). `ASSERT_MESSAGE_FIELDS` (`helpers.ts:1089-1094`) keeps putting those four failures on the images and colour-image fields. Nothing that works today stops working. The known limit — the phrases are English and the backend message is localized (`R5`) — is **not** fixed here. |
| **D-9** | A code that names an item inside a flat list binds to that list's field. Take the part of the code before any `.` or `[`; if that is a flat field the form owns, mark it. | Answers `OQ-7` (research `R3`, shape **B**). Covers all ten list keys — `category_id`, `sub_category_id`, `sub_sub_category_id`, `labels`, `tags_ids`, `countries_iso`, `images`, `colors`, `sizes`, `remove_videos` — whichever spelling the backend uses, which cannot be checked from this repository. Keeps `category_id` and `images` marking their field as they do today. Shape **C** (variant rows, `custom_data`) is untouched by this rule: its prefix is not a flat field the form owns, so it still falls to message-only under `D-3`. |
| **D-10** | A backend message is shown as **text, never rendered as HTML**. | Owner confirmation, 2026-08-26. This is about how the text is displayed, not about what it contains — `D-4` already settles the content. Recorded so the display choice reads as decided, not as an extra guard someone added. Lands in `spec.md` as `FR-9` / `AC-24`. |

## Constraints I already know

**Product direction**

- Backend validation is the authority the seller must be able to read. Our
  client-side rules are not being replaced, reduced, or moved.
- The backend localizes its messages from the request language, so its text is
  shown to the seller as it arrives — no `t()` wrapper, no re-translation.

**Hard boundaries**

- **Do not change any client-side validation.** `validate()` in
  `components/SellerDashboard/productEdit/helpers.ts` is off limits — no rule
  added, removed, relaxed or reworded.
- No backend change is in scope. Nothing here asks the backend for a new field,
  a new code, or a new status.
- No change to shared transport. `utils/fetchData.ts` already returns everything
  needed; touching it would reach every client call in the app.
- The scroll behaviour already exists and is already wired. It must be reused,
  not rebuilt (see Verified vs assumed, V-3).
- No new abstraction, no shared error framework, no sweep through sibling
  editors. The standing rule is the smallest change that meets the criteria.

**Must revert as**

- One commit on `ticket/product-editor-backend-field-errors`, against `develop`.
  Reverting it restores today's generic-message behaviour and nothing else.

**Shared resources this spends**

- None. No staging account, no rate limit, no paid run. The confirming test runs
  in the unit suite with no backend.

**Output safety**

- Nothing in a log, a test message or a failure diff may carry a token, a phone
  number, a one-time code, or a seller's live barcode value. Existing Sentry
  reporting at `ProductEditor.tsx:530-535` already sends the raw response; that
  call is not being widened.

## Verified vs assumed

Every claim below was read from the file named. Nothing here is from memory.

| id | Claim | verified / assumed | Evidence |
|---|---|---|---|
| V-1 | `detailed_error` does reach the editor on a rejected save. `fetchData` throws on a non-OK response, catches its own throw, and returns the parsed body with `success: false`. | **verified** | `utils/fetchData.ts:651-657` (throw), `:767` (`return { ...(responseData \|\| {}), success: false, httpStatus: status }`) |
| V-2 | The rejection envelope also carries `httpStatus`, so the response status is readable at the form. | **verified** | `utils/fetchData.ts:747`, `:767` |
| V-3 | Scrolling to the first failing field already exists and is already called on every rejected save. | **verified** | `components/SellerDashboard/productEdit/helpers.ts:1311-1334` (`scrollToFirstError`); `components/SellerDashboard/productEdit/ProductEditor.tsx:523-539` (`handleSaveRejection` calls it) |
| V-4 | A backend `code` outside a fixed 20-entry allowlist is dropped and never shown. `barcode` is not in that allowlist. | **verified** | `helpers.ts:1096-1116` (`ERROR_CODE_FIELDS`), `:1137-1140` (`if (code && ERROR_CODE_FIELDS.has(code))`) |
| V-5 | Even for an allowed code, the backend's message is discarded and replaced by the constant "Please check this field". | **verified** | `helpers.ts:1138` |
| V-6 | The Barcode input has a scroll anchor but is never given an error to show. | **verified** | `components/SellerDashboard/productEdit/sections.tsx:412` — `fieldKey="barcode"` present, no `error` prop |
| V-7 | `shipping_cost` and `shipping_days` are in the allowlist but have neither an error prop nor a scroll anchor, so a backend rejection on them highlights nothing and scrolls nowhere. | **verified** | `sections.tsx:467`, `:469` versus `helpers.ts:1106-1107` |
| V-8 | `count_of_pieces` shows its error but has no scroll anchor. | **verified** | `sections.tsx:465` (no `fieldKey`) |
| V-9 | `images` and `colorImages` are mapped by the allowlist but have no scroll anchor. Only five `data-field` anchors exist in the whole editor: `category_id`, `description`, `similar_words`, `translations`, `variations`. | **verified** | repo-wide grep of `data-field="` under `components/SellerDashboard/productEdit/` |
| V-10 | The request carries the seller's language, so backend messages come back localized. | **verified** | `utils/fetchData.ts:560`, `:581` (`"x-language": language`), `:181-188` (language read from the URL then the `language` cookie) |
| V-11 | A sibling screen in the same dashboard already does exactly what this request asks — binds `detailed_error[].code` to the input and shows the backend's own message, with no allowlist. | **verified** | `components/SellerDashboard/locations/LocationFormModal.tsx:204-217` |
| V-12 | Raw backend text is already shown to sellers elsewhere in this same editor, so the "never show backend text" rule was never applied consistently. | **verified** | `ProductEditor.tsx:718-722` (status blockers), `:617-619` (save catch shows the raw error message) |
| V-13 | An earlier shipped ticket set `AC-11`: "no raw backend text is shown as the primary message". This work reverses it on purpose, under `D-4`. | **verified** | commit `32c593b5`, `_specs/seller-product-editor-contract-alignment/spec.md` FR-11 / AC-11; the reason survives as a code comment at `helpers.ts:1120-1123` |
| V-14 | The only dynamic (nested) key families the editor ever sends are the variant keys and the indexed translation keys. Nothing else in the payload is indexed. | **verified** | `helpers.ts:1262-1269` (`price_<k>`, `price_<k>_discount`, `price_<k>_luck`, `qty_<k>`, `sku_<k>`, `barcode_<k>`, `location_id_<k>`), `:1280-1298` (`custom_data[i][…]`) |
| V-15 | A variant key can contain both `_` and `-`, so a nested code such as `barcode_Black-M` and the flat field `barcode` cannot be told apart by a prefix test alone. | **verified** | `helpers.ts:596-604` (`cleanKey` turns `.` into `_`; `variantKey` joins colour and size with `-`) |
| V-16 | The editor's own client-side validation is a separate function from the server-error mapping, so this work does not have to touch it. | **verified** | `validate()` and `mapServerErrors()` are distinct exports in `helpers.ts` |
| A-1 | The exact spelling the backend uses for an indexed code — `custom_data.0.name` or `custom_data[0][name]` — is unknown. | **assumed / unknown** | The current code strips at the first `.` (`helpers.ts:1134`), which only fits the dotted form. No repo document states which form is sent. Open question OQ-1. |
| A-2 | Whether a per-variant failure is reported as `barcode_Black-M` or as a single generic `variations` code is unknown. | **assumed / unknown** | No repo document covers variant keys. Open question OQ-2. |
| A-3 | Whether *every* `422` message is localized, or only the framework's field-validation ones, is unknown. | **assumed / unknown** | `V-10` proves the language is sent, not that every message path honours it. Open question OQ-3. |
| A-4 | Whether a rejected save can return a field-level validation problem under a status other than `422` is unknown. | **assumed / unknown** | `shop-seller-product-boutique-apis.md:74-79` lists `422` as the validation status, but does not say it is the only one. Open question OQ-4. Bounds the risk in `D-2`. |

## Neighbouring work

| Piece | In or out | Why |
|---|---|---|
| Product add and edit save rejection (`ProductEditor.tsx`, `helpers.ts`, `sections.tsx`) | **in** | This is the request. |
| Missing error props and scroll anchors on product fields (V-6 to V-9) | **in** | These are the same defect. Showing a backend message on a field that cannot render one, or scrolling to a field with no anchor, would leave the feature broken for exactly the fields it is meant to fix. |
| `validate()` and every client-side rule | **out** | The owner's explicit boundary. |
| Descriptor sync rejection (`ProductEditor.tsx:591-607`) | **out** | A separate endpoint with its own message and its own roll-back behaviour. Not part of the product save. |
| Change-status blockers (`ProductEditor.tsx:708-735`) | **out** | Already lists backend messages and is not a form validation flow. |
| `BoutiqueEditor.tsx` (`:417`, `:439`, `:457`, `:509`) | **out** | Shares the same joined-message pattern, but it is a different screen with different fields. Fixing it here would double the change for no gain in this ticket. Worth its own ticket. |
| `LocationFormModal.tsx` | **out**, but it is the reference | Already correct (V-11). It is read, not changed. |
| `utils/fetchData.ts` | **out** | Already returns what is needed (V-1, V-2). Changing shared transport would reach every call in the app. |
| Any backend change | **out** | Nothing here needs one. |
| Excel bulk upload, gallery tab | **out** | Different save paths. |

## Done means

- A save rejected on a **flat** field marks that field, shows the backend's own
  message on it, and scrolls to it.
- The owner's example — `{ "code": "barcode", "message": "This barcode already
  exists" }` — marks the Barcode input with that exact sentence.
- A code the editor has never seen before is still handled. The fixed allowlist
  is not the gate any more; a field the backend names and the form owns is
  marked.
- A **nested** code is not attached to any input, and no attempt is made to work
  out which input it means. Only its `message` is shown, as readable text — never
  as a JSON blob, never as `[object Object]`.
- Nothing is silently swallowed. A rejection that names nothing the form owns
  still tells the seller something.
- Every field the editor can be rejected on can actually show an error and can
  actually be scrolled to.
- No client-side validation rule changed. Proved, not asserted.
- One unit test fails against today's code for the barcode case, and passes
  after. Seen red first.
- Typecheck, lint, i18n parity and the unit suite all pass.

## Missing Information

- **The backend body contract is not available on this machine.** `.gitignore`
  lines 117-119 exclude `docs/api-requirements/shop-product-body-contract.md`,
  `shop-product-body-payloads.txt` and `seller-product-body-alignment-roadmap.md`
  on purpose, and none of the three exists on disk. The code cites that document
  as "contract §3.1 / §3.2 / §3.4" for the very rules this ticket changes
  (`helpers.ts:1120-1123`, `:1135`, `:1141`). Per **D-1** the work goes ahead
  without it. The cost is recorded, not hidden: the four questions below cannot
  be answered from this repository.
### Open questions and how they stand

| id | Question | Status |
|---|---|---|
| **OQ-1** | Which spelling does the backend use for an indexed code: `custom_data.0.name` or `custom_data[0][name]`? (from A-1) | **CLOSED by D-3.** The spelling stops mattering. A nested code is never parsed and never bound to an input, so there is nothing to recognise. Either spelling lands in the message-only path and reads the same to the seller. |
| **OQ-2** | Is a per-variant failure reported with the variant key (`barcode_Black-M`) or with one generic `variations` code? (from A-2) | **CLOSED by D-3.** Both answers are handled by the same rule: the form binds the flat field codes it owns, and everything else shows its message only. The `barcode_Black-M` / `barcode` collision recorded in `V-15` also stops being a risk, because no prefix test is ever run. |
| **OQ-3** | Is every `422` message localized, or only the framework's field-validation ones? (from A-3) | **CLOSED by D-5**, as an owner assertion. Accepted, and its limit is stated: if some message path ignores the language, that message reaches the seller in English. `D-4` says the content is safe either way, so the worst case is wrong language, not a leak. Not a blocker. `research` records it as an assertion and does not build a workaround for it. |
| **OQ-4** | Can a field-level validation problem ever arrive under a status other than `422`? (from A-4) | **CLOSED by D-6.** The owner states validation problems arrive under `422` and under no other status. `D-2`'s gate therefore hides nothing. |

All four questions are closed. Each was closed by an owner decision, not by
evidence found in this repository — the row says which. Nothing here is answered
by guessing, and `research` must keep them written this way rather than promote an
owner decision into a verified fact.

## Readiness Status

`READY`

- Justification: The wanted behaviour is stated and confirmed by the owner. The
  files that hold it are identified with line evidence (V-1 to V-16). The three
  choices that could have been guessed were put to the owner and answered
  (D-1 to D-6). The one document that is missing is recorded as missing. All four
  things it would have answered are closed by owner decision, and each is marked
  as a decision rather than as evidence — none is assumed. The boundary the owner
  set — never touch our own validation — is recorded as a hard boundary. Nothing
  here needs a human answer before `research` can begin.
