---
ticket: product-editor-backend-field-errors
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-08-26
links:
  clickup:
  github:
---

# Research — product-editor-backend-field-errors

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make a rejected product save behave like the editor's own validation: a backend
validation error that names a field marks that field, shows the backend's own
message on it, and scrolls to it. A backend error that names something the form
has no input for shows its message as readable text and is bound to nothing.

## How to read the evidence in this file

Every claim below carries one of three labels. Nothing is stated without one.

| Label | Meaning |
|---|---|
| **CODE** | Read from a source file that runs. `file:line` given. This is the only kind of claim that stands on its own. |
| **DECISION** | Settled by the owner in `intake.md` (`D-1` … `D-8`). Not proven by this repository. A decision can be wrong; where one is load-bearing, this file says so. |
| **HISTORY** | Read from git (a commit, or a file deleted from the working tree). Verifiable with `git show`, but it describes the past, not the running code. |

**No claim in this file rests on a code comment or on a document.** Comments and
documents are quoted only where the *existence of the comment* is itself the
point — and each such place says that plainly. This matters because the document
the editor's comments cite (`shop-product-body-contract.md`) is excluded by
`.gitignore:117-119` **CODE** and is not on disk, so nothing in it can be checked.

## What happens today

One path handles every rejected save. It loses the useful data twice.

**Step 1 — the whole response reaches the form. CODE.**
`fetchData` throws on a non-OK response (`utils/fetchData.ts:651-657`), catches its
own throw, and returns the parsed body with two extra keys:
`return { ...(responseData || {}), success: false, httpStatus: status }`
(`utils/fetchData.ts:767`). So `detailed_error` **and** the HTTP status both arrive.

Two details on that path are load-bearing:

- **No retry on a save.** The retry branch is guarded by `!isMutatingMethod`
  (`utils/fetchData.ts:705-707`). Both saves are `POST`, so a rejection is final
  and arrives once.
- **No toast from the transport.** The catch shows `showErrorNotification` unless
  `noMessage` is set (`utils/fetchData.ts:718-720`). Both save methods pass
  `noMessage: true` (`services/sellerDashboard/index.ts:837`, `:916`), so the
  editor owns every message the seller sees. Removing that flag would put a second,
  raw toast on screen.

**Step 2 — the service layer is a pass-through. CODE.** `updateProduct`
(`services/sellerDashboard/index.ts:825-839`) and `addProduct` (`:908-918`) both
`return fetchData({...})` with no `success` check, no throw, and no reshaping.

**Step 3 — one function handles the rejection. CODE.** Both save paths call
`handleSaveRejection(res, fallback)` (`ProductEditor.tsx:550` create, `:569`
update). The function is `ProductEditor.tsx:523-539`: it maps, calls `setErrors`
once, closes the confirm dialog, calls `scrollToFirstError`, reports to Sentry, and
shows one toast. The shape is already right.

**Step 4 — the mapper discards what the ticket needs. CODE.**
`mapServerErrors`, `helpers.ts:1126-1156`:

- A fixed allowlist of 20 codes, `ERROR_CODE_FIELDS` (`helpers.ts:1096-1116`). The
  test is `if (code && ERROR_CODE_FIELDS.has(code))` at `:1137`, and there is **no
  `else`** — a code outside the list is dropped. `barcode` is not in the list.
- For a code that *is* in the list, the backend's message is replaced:
  `errors[code] = tx("Please check this field")` (`:1138`). `tx` is
  `translateFunction` (`helpers.ts:21`).
- A dotted code is cut at the first dot: `d.code.split(".")[0]` (`:1134`).
- Entries with no `code` are matched on a lower-cased message substring against
  four English phrases (`ASSERT_MESSAGE_FIELDS`, `helpers.ts:1089-1094`) and given
  our own text (`:1146-1150`).

So the seller sees "Failed to update product" (`ProductEditor.tsx:550`), nothing is
marked, and the backend's sentence is thrown away at `:1138`.

**Step 5 — the scroll already works. CODE.** `scrollToFirstError`
(`helpers.ts:1311-1334`) is written and is already called (`ProductEditor.tsx:528`).
It tries `[data-field="<key>"]`, then `#field_<key>`, then `#section_<key>`, then
`#<key>`, then falls back to the first `.border-[#f85555]` or `.text-[#f85555]` on
the page. **This ticket does not build scrolling.** It makes the anchors exist.

**Step 6 — one `errors` record feeds every section. CODE.** `errors` is a single
`Record<string, string>` (`ProductEditor.tsx:142`), passed down once as
`sectionProps.errors` (`ProductEditor.tsx:790-808`). Adding an error to a field is a
local change in `sections.tsx`.

## The three key shapes in the payload

The backend can only complain about a key the editor sent, and
`buildUpdateFormData` is the only thing that names one. Every `fd.append` call in
it was enumerated. There are **three** shapes, not two. **CODE**, all lines in
`helpers.ts`.

| Shape | Keys | Lines |
|---|---|---|
| **A — flat scalar** | `name`, `barcode`, `unit`, `seller_product_id`, `description`, `brand_id`, `boutique_id`, `location_id`, `label`, `model_number`, `report_ref_number`, `unit_price`, `discount_price`, `purchase_price`, `luck_price`, `weight`, `current_stock`, `count_of_pieces`, `shipping_cost`, `shipping_days`, `tax`, `tax_type`, `meta_title`, `meta_description`, `meta_image`, `origin_country_iso`, `packed_after_ordering`, `multiplyQTY`, `cloud_video`, `extra_price_for_country` (a JSON string), `sync_color_images` (a JSON string) | `:1190-1256` |
| **B — flat array** | `category_id[]`, `sub_category_id[]`, `sub_sub_category_id[]`, `labels[]`, `tags_ids[]`, `countries_iso[]`, `images[]`, `colors[]`, `sizes[]`, `remove_videos[]` | `:1228-1258`, `:1304` |
| **C — nested row** | `price_<k>`, `price_<k>_discount`, `price_<k>_luck`, `qty_<k>`, `sku_<k>`, `barcode_<k>`, `location_id_<k>`; `custom_data[i][language_code\|name\|description\|id]`, `custom_data[i][similar_words][]` | `:1262-1269`, `:1280-1298` |

`<k>` comes from `variantKey` (`helpers.ts:599-604`): the cleaned colour and size
joined with `-`, where `cleanKey` (`:596-597`) turns `.` into `_`. So a variant key
can hold both `_` and `-`, and `barcode_Black-M` cannot be told apart from the flat
`barcode` by a prefix test. **CODE.**

**Decision `D-3` covers A and C, and does not cover B.** A flat array is a field
the form owns *and* an indexed item at the same time. `category_id` and `images`
are shape B, and both are rendered and mapped today
(`sections.tsx:581`, `:1078`). If a shape-B error is treated as nested, both stop
marking their field — a regression. This is `OQ-7` below. It is the one real gap
this stage found, and it is not answered by anything in the repository.

**On the dotted reduction at `helpers.ts:1134`:** what is verified is that the code
cuts a code at the first dot. Whether the backend actually sends `category_id.0` is
**not** verified — the only statement to that effect is a comment on the line above,
and comments are not evidence here. `OQ-7` must be answered without relying on it.

## The render and anchor gap

`scrollToFirstError` reaches only a field that has an anchor, and `DashField` prints
only a message it is handed (`components/SellerDashboard/ui/index.tsx:431-458`).
`Txt` / `Num` / `Select` wrap their input in `<div data-field={fieldKey}>`
(`sections.tsx:130`, `:172`, `:249`) and add a red border when `error` is set
(`sections.tsx:139-141`). Both are opt-in per call site. **CODE.**

**The complete anchor list**, counted from source: 17 `fieldKey="…"` call sites in
`sections.tsx`, plus 5 literal `data-field` values. No anchor exists anywhere else —
`ProductEditor.tsx` and `ui/index.tsx` contain no `data-field`, no `id="field_…"`
and no `id="section_…"`. **CODE.**

| Field | Renders an error? | Has an anchor? | Evidence |
|---|---|---|---|
| `name`, `unit`, `brand_id`, `boutique_id`, `location_id`, `unit_price`, `discount_price`, `purchase_price`, `weight`, `tax`, `tax_type`, `current_stock`, `seller_product_id` | yes | yes | `sections.tsx:410-490` |
| `category_id`, `description`, `variations`, `translations` | yes | yes (literal `data-field`) | `sections.tsx:581`, `:423`, `:1279`, `:1577` |
| `barcode` | **no** | yes | `sections.tsx:412` — `fieldKey` set, `error` absent |
| `luck_price` | **no** | yes | `sections.tsx:452` |
| `model_number`, `report_ref_number` | **no** | yes | `sections.tsx:417`, `:418` |
| `count_of_pieces` | yes | **no** | `sections.tsx:465` — no `fieldKey` |
| `origin_country_iso` | yes | **no** | `sections.tsx:868` |
| `labels` | yes | **no** | `sections.tsx:796` |
| `images` | yes | **no** | `sections.tsx:1078` |
| `colorImages` | yes | **no** | `sections.tsx:1411` |
| `shipping_cost`, `shipping_days` | **no** | **no** | `sections.tsx:467`, `:469` |
| `meta_title`, `meta_description` | **no** | **no** | `sections.tsx:942`, `:943` |

**A live defect, before any change. CODE.** `shipping_cost` and `shipping_days` are
in `ERROR_CODE_FIELDS` (`helpers.ts:1106-1107`) and render nothing. When the backend
rejects on one, the toast says "Please fix the highlighted fields"
(`ProductEditor.tsx:537`) and nothing is highlighted.

**The `errors` record is already wider than the allowlist. CODE.** Client validation
sets `labels`, `origin_country_iso`, `current_stock`, `seller_product_id`,
`location_id` and `count_of_pieces` (`helpers.ts:868-998`), none of which is in
`ERROR_CODE_FIELDS`. So the record was never allowlist-bound; only the server-error
mapper is.

## Precedent in the same dashboard

`components/SellerDashboard/locations/LocationFormModal.tsx:204-217` already does
what this ticket asks. **CODE.**

```
detailed.forEach((entry) => {
  if (entry?.code && entry?.message) fieldErrors[entry.code] = entry.message;
});
```

No allowlist. The backend's own message. The envelope `message` kept separately as
the form-level summary (`:216`), rendered by `InlineAlert` (`:268`). The product
editor is the odd one out.

## What already exists, so nothing new is built

| Need | Already there | Evidence |
|---|---|---|
| Scroll to the first failing field | `scrollToFirstError`, already called | `helpers.ts:1311`; `ProductEditor.tsx:528` |
| Per-field message and red border | `DashField` + `Txt`/`Num`/`Select` | `ui/index.tsx:431-458`; `sections.tsx:130-144` |
| A form-level banner | `InlineAlert`, **already imported** into `ProductEditor.tsx` and used at `:950` | `ui/index.tsx:368-383`; `ProductEditor.tsx:20`, `:950` |
| A red box listing backend messages | The status-blockers list | `ProductEditor.tsx:1571-1584` |
| The HTTP status at the form | `httpStatus` on the rejection envelope | `utils/fetchData.ts:767` |
| One `errors` record reaching every section | `sectionProps.errors` | `ProductEditor.tsx:790-808` |

No new component, hook or shared helper is needed. **CODE.**

## Relevant directories

- `components/SellerDashboard/productEdit/` — the change lives here. `helpers.ts`
  (2,025 lines) holds the mapper, the builder and the scroller; `ProductEditor.tsx`
  (1,604) holds the save paths and the error state; `sections.tsx` (1,738) holds
  every input and every render site.
- `components/SellerDashboard/ui/` — `index.tsx` holds `DashField` and
  `InlineAlert`. Read, not changed.
- `components/SellerDashboard/locations/` — `LocationFormModal.tsx`, the reference.
  Read, not changed.
- `tests/components/SellerDashboard/productEdit/` — where the confirming test goes.
  Holds one file today.
- `public/translations/` — only if a new constant of ours is added. Backend messages
  are not translated by us (`D-5`), so most of this work adds no key.

## Relevant config files

- `.claude/project-config.yaml` — validation profiles. `ui-change` = lint +
  i18n-parity + typecheck. `logic-change` = lint + typecheck + unit-tests.
  `full` adds the build. `plan` names exactly one.
- `vitest.config.mts:75-95` — the `unit` project: `jsdom`, globals on,
  `tests/setup.ts` as setup, default include pattern, `tests/e2e/**` excluded.
- `.gitignore:117-119` — excludes `shop-product-body-contract.md`, its payload
  capture and the alignment roadmap. None is on disk. This is why no claim here
  rests on that document.
- `eslint.config.mjs` + `eslint-rules/` — a `translateFunction` key missing from
  `ar`/`tr`/`ku` is an **error**, not a warning.
- `tsconfig.json` — path aliases (`components/*`, `services/*`, bare `utils/...`).

## Possibly affected services

- **`SellerDashboardService`** (`services/sellerDashboard/index.ts`) — a
  pass-through for both saves (`:825-839`, `:908-918`). **No change needed:** it
  already returns the whole envelope. Its `noMessage: true` must stay
  (`:837`, `:916`), or the transport adds a second raw toast.
- **`utils/fetchData.ts`** — shared by the whole client app. Already returns
  `detailed_error` and `httpStatus` (`:767`). **Out of scope.**
- **The backend shop-product endpoints** — nothing here changes what is sent, so
  no request body and no backend behaviour changes.
- **Sentry** — `LogError` at `ProductEditor.tsx:530-535` already sends the raw
  response including `detailed_error`. Not widened.
- **Not affected:** the descriptor sync path (`ProductEditor.tsx:583-607`, its own
  endpoint and roll-back), change-status (`:708-735`), Excel bulk upload, the
  gallery tab.
- **Shares the defect, out of scope:**
  `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx:417`, `:439`, `:457`,
  `:509` still join `detailed_error` messages with `" • "` and discard every
  `code`. Its own ticket.

## Test / validation commands available

Listed, **not run** — this stage is read-only.

- `pnpm test:run` → `vitest run --project unit`. Gates every PR.
- `pnpm test:coverage` — same, with v8 coverage.
- `node_modules/.bin/tsc --noEmit --pretty false` — the `typecheck` check-id. No
  `package.json` script exists for it.
- `pnpm lint` — ESLint including the i18n rules.
- `pnpm lint:i18n-parity` — `ar`/`tr`/`ku` key parity.
- `pnpm build` — production build; catches server/client boundary faults `tsc`
  misses.
- `pnpm test:e2e:live` — browser suite against staging. **Not applicable:** it
  cannot make the backend refuse a barcode on demand, and it never gates a PR.

## Test layout and naming convention (`PL-14` input)

- **Location.** `tests/` mirrors the source path exactly. Code at
  `components/SellerDashboard/productEdit/helpers.ts` is tested under
  `tests/components/SellerDashboard/productEdit/`.
- **File name.** Either the module name (`index.test.tsx`, `route.test.ts`) or a
  named behaviour slice (`flashPrice.test.ts`, `returnedQty.test.ts`,
  `validate.weight.test.ts`). Both forms are in use.
- **Runner.** Vitest, `--project unit`, `jsdom`, globals on — `describe`/`it`/
  `expect` need no import, though existing files import them anyway.
- **Expected-failure marker.** Vitest's strict marker is `it.fails()` /
  `test.fails()`. **No file in the suite uses it.** A repo-wide search of `tests/`
  for `.fails` returned nothing. A `BUG-n` here would be the first.
- **Existing coverage for the code this ticket touches.** One file, out of 62 unit
  test files: `tests/components/SellerDashboard/productEdit/validate.weight.test.ts`.
  It imports `emptyProductForm`, `UNITS`, `validate` and `ProductForm` from
  `helpers.ts` (`:12-17`) and covers **only** the weight rule inside `validate()`.
  **`mapServerErrors` has no test.** `handleSaveRejection` is a closure inside
  `ProductEditor.tsx` and is not exported, so it is reachable only through a render.
- **Assertion style.** Every assertion carries a message (`CLAUDE.md`). The
  existing file is the model (`validate.weight.test.ts:30-34`).

## Risks and unknowns

- **R1 — a `helpers.ts`-only change would look done and still show nothing. CODE.**
  The mapper and the render sites are separate opt-ins. Removing the allowlist fixes
  `barcode` in the data and the seller still sees nothing, because `sections.tsx:412`
  passes no `error`. The render and anchor gaps are load-bearing, not extras.
  *Likelihood high. Impact: the ticket ships and the reported bug survives.*
- **R2 — the toast can point at nothing. CODE.** `ProductEditor.tsx:537` says
  "Please fix the highlighted fields" whenever anything was attributed, even to a
  field that cannot render it. Already true for `shipping_cost` / `shipping_days`.
  *Likelihood certain unless the render gaps close.*
- **R3 — shape B nearly had no rule. CODE + `D-9`.** `category_id` and `images` are
  flat fields *and* arrays. `D-3` alone does not say which side they fall on, and
  both render and map correctly today, so getting it wrong is a regression in
  working behaviour rather than a missing feature. `D-9` closes it: the part of a
  code before any `.` or `[` decides. Checked against every shape-C key —
  `barcode_Black-M`, `location_id_Black-M`, `custom_data[0][name]`,
  `custom_data.0.name` — none of their prefixes is a flat field the form owns, so
  none is wrongly bound. *Residual risk: a plan that implements `D-3` literally and
  forgets `D-9`.*
- **R4 — the codeless branch must survive. CODE + `D-8`.** `ASSERT_MESSAGE_FIELDS`
  (`helpers.ts:1089-1094`) attributes four codeless failures to `images` /
  `colorImages` and that works today. `D-8` keeps it. A rewrite of the mapper, as
  opposed to an extension, would drop it.
  *Likelihood high if the mapper is rewritten. Impact: working errors move off
  their field.*
- **R5 — the four phrases are English only. CODE, with one step that rests on
  `D-5`.** *Verified:* the four needles are English (`helpers.ts:1090-1093`) and are
  compared against a lower-cased backend message (`:1142`), while the request sends
  `x-language` (`utils/fetchData.ts:560`, `:581`). *Not verified, and resting on
  decision `D-5`:* that the backend therefore returns a translated message which
  cannot match. If `D-5` is right, these four never fire for an `ar`/`tr`/`ku`
  seller. This is pre-existing and **out of scope** — a `BUG-n` candidate for
  `plan` to name on purpose, not to fix here.
- **R6 — one builder feeds both endpoints. CODE.** `buildUpdateFormData` serves
  create and update (`ProductEditor.tsx:546`). Nothing in this ticket changes it;
  named so no plan drifts into it.
- **R7 — a shipped acceptance criterion is being reversed on purpose. HISTORY.**
  Commit `32c593b5` shipped `AC-11`: "no raw backend text is shown as the primary
  message". Its `_specs` folder was later deleted from the working tree, so this is
  git evidence (`git show 32c593b5:_specs/seller-product-editor-contract-alignment/spec.md`),
  not a live document. Decision `D-4` retires the reason behind it. `spec` must say
  the reversal is deliberate, so a later reader does not read it as an accident.
- **R8 — every open question is closed by a decision, not by evidence. DECISION.**
  All seven are closed by `D-3`, `D-5`, `D-6`, `D-7`, `D-8` and `D-9`; none by
  anything in this repository, because the one document that could have answered
  them is not on disk (`.gitignore:117-119`). The table below records which
  decision closed which question, and must stay recorded that way. If one turns
  out wrong, that table is where it shows. **Two of the seven are built to hold
  whichever way the unknown falls** — `D-3` makes `OQ-1` and `OQ-2` moot, and
  `D-9` makes `OQ-7` independent of the backend's spelling. The other four
  (`OQ-3` … `OQ-6`) rest on the owner being right.
- **R9 — no single test level sees the whole path. CODE.** `mapServerErrors` is
  exported and pure, so the mapping is unit-testable directly. `handleSaveRejection`
  and every render site are not exported, so proving "the message appears on the
  barcode input" needs a component render. `jsdom` is configured
  (`vitest.config.mts:84`) and the suite has component tests
  (`tests/components/Login/…`), but `productEdit` has none — its only test is
  pure-function. `plan` must pick a level and say what that level cannot see.

## Open questions

`OQ-1` to `OQ-6` came from intake and are answered there. Each answer is a **DECISION**,
not repository evidence — the table says which decision. `OQ-7` is new, found by
this stage, and is **not** answered.

| ID | Question | Why it matters | Answer |
|------|----------|----------------|--------|
| OQ-1 | Which spelling does the backend use for an indexed code — `custom_data.0.name` or `custom_data[0][name]`? | The mapper cuts at the first dot (`helpers.ts:1134`), which fits only the dotted form. | **Closed — `D-3`.** A shape-C code is never parsed and never bound, so the spelling changes nothing. Both forms reach the message-only path. |
| OQ-2 | Is a per-variant failure reported as `barcode_Black-M` or as one generic `variations`? | A prefix test would confuse `barcode_Black-M` with the flat `barcode` (`helpers.ts:596-604`). | **Closed — `D-3`.** No prefix test is run. `variations` is a flat field the form owns and renders (`sections.tsx:1279`, anchor present); a variant key is not, so it shows its message only. Both answers work. |
| OQ-3 | Is every `422` message localized, or only some? | An unlocalized message reaches an `ar`/`tr`/`ku` seller in English. | **Closed — `D-5`**, an owner assertion. Verified only that the language is *sent* (`utils/fetchData.ts:560`, `:581`). Limit accepted: worst case is wrong language, and `D-4` says the content is safe. No workaround is built. |
| OQ-4 | Can a field-level validation problem arrive under a status other than `422`? | `D-2` gates on `422`; anything else falls back to the general message. | **Closed — `D-6`**, an owner assertion: validation arrives under `422` and no other status. No repository evidence either way. |
| OQ-5 | When the seller edits a field carrying a backend error, does that error clear? | `R3` of the previous draft: `patch` never touches `errors` (`ProductEditor.tsx:142`, `:502`, `:525`, `:613`, `:630` are the only writers). A stale "This barcode already exists" would tell the seller a fixed problem is still broken. | **Closed — `D-7`: yes.** Editing a field clears the backend error on it. `spec` writes the `AC`. |
| OQ-6 | Do the four codeless attributions (`helpers.ts:1089-1094`) keep landing on their field? | `R4`. They carry no `code`, so a literal reading of `D-3` would move them off a field they mark correctly today. | **Closed — `D-8`: yes, unchanged.** `D-3` governs a `code`, not a message without one. The English-only limit (`R5`) is **not** fixed here. |
| **OQ-7** | A shape-B key is a flat field *and* an array — `category_id[]`, `labels[]`, `images[]`, `colors[]`, `sizes[]`, `tags_ids[]`, `countries_iso[]`, `sub_category_id[]`, `sub_sub_category_id[]`, `remove_videos[]`. If the backend names an item inside one (for example `category_id.0`), does it bind to the base field or go to the message list? | `category_id` and `images` both render an error, and `category_id` has an anchor (`sections.tsx:581`, `:1078`). Treating them as nested is a **regression**, not a missing feature. The existing `.split(".")[0]` at `helpers.ts:1134` shows the current code binds them to the base field — but whether the backend sends that form is unverified, because the only statement of it is a comment. | **Closed — `D-9`: bind to the field.** Take the part of the code before any `.` or `[`; if that is a flat field the form owns, mark it. This holds whichever spelling the backend uses, so the unverifiable comment never has to be trusted. Shape **C** is untouched: a variant key's prefix (`barcode_Black-M` → `barcode_Black-M`, `custom_data[0][name]` → `custom_data`) is not a flat field the form owns, so it still falls to message-only under `D-3`. |

## Notes

- No code was changed during research. Every file outside `_specs/` was read only.
- No observability runtime config was modified; `features.observability` is `false`
  for this project (`.claude/project-config.yaml`).
- No protected runtime path was touched — `proxy.ts`, `next.config.ts`,
  `instrumentation*.ts`, `sentry.*.config.ts`, `.github/workflows/**`.
- No validation command was run at this stage.
- **Two claims from this file's first draft were wrong and are corrected here.**
  (1) "Everything the builder sends besides the nested families is a flat key with a
  single value" — false; ten keys are arrays, which is shape B and `OQ-7`.
  (2) The `422`-only status claim was supported with a tracked document
  (`shop-seller-product-boutique-apis.md`); that citation is removed, and `OQ-4`
  now rests on decision `D-6` alone, which is what it always actually rested on.
