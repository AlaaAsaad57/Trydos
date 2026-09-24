---
ticket: product-editor-backend-field-errors
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-08-27
links:
  clickup:
  github:
---

# Plan — product-editor-backend-field-errors

> Decide the approach before changing code. Plan only — no implementation here.

> **Revision 4.** The plan has been rewritten three times since the review gate
> returned `changes_requested`. What each pass did is listed under **"Revisions
> since the reviewed plan"** near the end. **There is no longer any deviation from
> `spec.md`:** revision 2 of the specification adopted the withhold rule as
> `FR-20` and the hidden-input rule as `E-15` / `AC-30`, so every step below now
> traces to a criterion.

## Approach

Change the one function that already receives a refused save so it stops throwing
away the backend's message and stops dropping any problem whose field name it does
not recognise. It returns the problems it could put on a field, the messages it
could not, and a count of what it withheld under `FR-20`. Nothing in the request
path changes — the whole response, including the status, already reaches it.

Four decisions shape how that is done:

- **Backend failures live in their own record**, separate from the one the form's
  own validation writes. Clearing from the shared record would have wiped the
  form's own messages as the seller typed — a change to a flow `C-1` declares
  untouched (`SEN-2`).
- **Only an entry carrying a `code` produces text on screen** (`FR-20`, `E-4`). A
  codeless entry that matches none of the four known image phrases is counted, not
  shown.
- **Six price inputs are not on the page when prices are locked**, yet are still
  submitted, so a refusal naming one must not mark a field the seller cannot see
  (`E-15`, `AC-30`). See "The price-lock rule" below.
- **Two small functions are exported** — one that chooses the summary line, one
  that picks the topmost failing field. An earlier plan declared tests for both
  behaviours while leaving them inside a closure no test could reach (`SEN-3`).
- **The banner is deduped and capped** before it renders (`PERF-1`).

**Alternative rejected — bind by querying the page for the field's anchor.** An
anchor exists on inputs that cannot display a message. `similar_words` is one
today, and stays one after this change, so the query would answer "yes" for an
input that then shows nothing: the silent swallow `AC-12` forbids.

**Alternative rejected — copy the sibling location form exactly.** That form binds
every `code` with no set at all. It has five simple inputs; this one has forty, and
most of its controls hold a set of values with no single place to put a message.

## The price-lock rule

`sections.tsx` wraps six inputs in `{!pricesLocked && ( … )}` — `unit_price`
(`:444`), `discount_price` (`:447`), `luck_price` (`:451`), `shipping_cost`
(`:466`), `tax` (`:474`) and `tax_type` (`:485`). When `pricesLocked` is true those
inputs are **not in the page at all**: no anchor, no message slot.

They are still submitted. `buildUpdateFormData` sends every one of them on every
save, and says so in its own comment: "a restricted create leaves this input locked
and empty, and the key must still be sent (never stripped)"
(`helpers.ts:1185-1206`). So the backend can refuse a key whose input is not on
screen.

`E-15` states the case and `AC-30` is the criterion. **The rule:** the mapper takes
`pricesLocked`. When it is true, those six names are **not bindable**, and a refusal
naming one goes to the message list like any other unbindable code. `pricesLocked`
is already computed at `ProductEditor.tsx:124-125` and already passed to
`validate()` at `:501`, so nothing new is derived and no new data is read.

## Steps

1. **Replace the guessed allowlist with the set of fields this form can display a
   message under.** The current 20 names were guessed at backend codes and are
   narrower than the form. The new set is **31 names, listed in full below** — all
   20 old names are inside it, so nothing that maps today stops mapping.
2. **Rewrite the mapper to return three things**: the field failures, the messages
   that could not be put on a field, and the number of entries withheld under
   `FR-20`. For each entry, take the part of the `code` before the first `.` or
   `[`; if that part is non-empty and in the set, put the backend's message on that
   field; otherwise put the message in the list. **An entry with no `code` is never
   put in the list** (`FR-20`, `E-4`) — it either matches one of the four known
   image phrases and marks its own field, or it is counted as withheld. A `code`
   whose prefix comes out empty (a code starting with `.` or `[`) is treated as no
   code. The field record is built on a **null-prototype object**, and a key is
   written **only after** set membership is confirmed, so a code such as
   `__proto__`, or one carrying a quote, can never become a key or reach a selector
   (`SEC-5`).
3. **Take `pricesLocked` and honour it**, per "The price-lock rule" above: when it
   is true the six price names are not bindable and their messages go to the list
   (`E-15`, `AC-30`).
4. **Keep the validation-only gate in front of the whole mapper.** The gate reads
   `httpStatus`, which `utils/fetchData.ts` attaches to **every** response it
   returns, refusals included (`:702`, `:747`, `:767`). A `422` comes back as the
   parsed body plus `success: false` and `httpStatus: 422`, so `detailed_error` and
   the status arrive together and nothing new has to be plumbed. When the status is
   not `422`, all three outputs are empty. **Why `AC-14` cannot regress:** decision
   `D-6` states validation problems arrive under `422` and no other status, and a
   service assert that blocks a save is a validation problem in product terms.
   Under `D-6` the four image asserts therefore arrive as `422` and the gate never
   sees them. Exempting the codeless branch from the gate was the alternative and
   is **rejected**: it would let a non-validation refusal mark a field, which
   `AC-11` forbids (`SEN-1`, follow-up 6).
5. **Export a pure function that chooses the summary line** from the three outputs
   plus the caller's fallback: the "fix the highlighted fields" wording only when
   at least one field was marked, otherwise the first unbindable message, otherwise
   the fallback. Moving this out of the closure is what makes `AC-25` provable
   (`SEN-3`, follow-up 3).
6. **Export a function that picks the topmost failing field.** It takes the failure
   record, walks the page's `[data-field]` anchors **once** in document order, and
   returns the first key present in the record — replacing the four-selector chain
   repeated per key (`PERF-4`). It reads the document, so it is **not pure**; its
   test builds a small DOM with the anchors deliberately out of order, and needs
   **no** scroll stub and **no** timer. `scrollToFirstError` calls it and scrolls to
   the result. **Its existing red-element fallback stays**: when no anchor matches,
   the `.border-[#f85555]` / `.text-[#f85555]` lookup runs exactly as it does today,
   so the form's own validation path loses nothing.
7. **Give the 14 inputs their missing attributes.** Eleven are component call sites
   taking one or two extra attributes. **Three — labels, images and colour images —
   are bare paragraph blocks with no component to take a prop, and each needs a new
   wrapper element carrying the anchor** (`SEN-6`, follow-up 8).
8. **Hold backend field failures in their own state**, separate from the record the
   form's own validation writes. The two are merged **for display only**, in this
   order: the form's own record first, then the live seller-product-id check, then
   the backend record — so after a refused save the seller reads what the backend
   said (`AC-17`). **The rejection handler stops calling `setErrors` altogether**,
   so the form's own record is never written by this work at all, and `C-1` and
   `AC-15` hold exactly (`SEN-2`, follow-up 2).
9. **Show the unbindable messages** in a red inline banner above the form, using
   the alert component this file already imports (`:20`) and already renders four
   times (`:950`, `:961`, `:972`, `:977`). Its default tone is `error`, which is the
   red one, so **the shared UI file is not touched**. The list is **deduped by exact
   text and capped at five**; when more remain, one extra translated line says how
   many (`PERF-1`, follow-up 5).
10. **Clear the backend state at three points** — at the top of `startSave`
    (`ProductEditor.tsx:496`), on a successful save (`:613`), and on a cancelled
    edit (`:630`). `startSave` is the only way into a save: it is what opens the
    confirm dialog that later calls `confirmSave`, so clearing there covers both a
    save that fails the form's own validation and one that reaches the backend
    (`SEN-4`, follow-up 4).
11. **Clear a field's backend failure when it changes**, inside the single update
    function, using the **functional updater form** and returning the same object
    when nothing was cleared, so typing in a field with no failure causes no extra
    render (`PERF-2`, follow-up 10). Clearing is by patched key, and that is exact:
    **all 31 names in the set are keys of the form's own shape**
    (`helpers.ts:310-364`), including `images`, `labels`, `category_id`,
    `variations`, `colorImages` and `translations`. No name-to-name map is needed.
12. **Replace the comment that states the opposite of the new behaviour, keeping
    its counter-example.** `AC-21` sets what the new comment must say: that showing
    backend text is deliberate, which decision makes it safe (`D-4` / `C-3`), and
    **which one class is still withheld and why** (`FR-20`) — so the warning is
    preserved rather than deleted, and the exception is not removed by a later
    reader (`SEC-4`, follow-up 12).
13. **Write the declared tests**, and no others.

## The 31 names

Written out so `/implement` copies rather than re-derives, and so `/verify` can
check the set against the render sites by reading rather than guessing.

**The 17 that already show a message and already carry an anchor** — unchanged by
this work:

`name`, `seller_product_id`, `unit`, `brand_id`, `boutique_id`, `location_id`,
`description`, `unit_price`, `discount_price`, `purchase_price`, `current_stock`,
`weight`, `tax`, `tax_type`, `category_id`, `variations`, `translations`.

**The 14 that step 7 completes** — the same 14 as `spec.md > AC-10`:

- show a message, need an anchor: `count_of_pieces`, `labels`,
  `origin_country_iso`, `images`, `colorImages`.
- have an anchor, need a message: `barcode`, `luck_price`, `model_number`,
  `report_ref_number`.
- need both: `shipping_cost`, `shipping_days`, `max_allowed_qty`, `meta_title`,
  `meta_description`.

**All 20 old names are inside the 31.** The old list was `name`, `unit`,
`brand_id`, `boutique_id`, `unit_price`, `discount_price`, `purchase_price`,
`luck_price`, `weight`, `count_of_pieces`, `shipping_cost`, `shipping_days`, `tax`,
`tax_type`, `category_id`, `description`, `images`, `colorImages`, `variations`,
`translations` — every one appears above.

**`similar_words` is deliberately outside the set**, even though it carries an
anchor (`sections.tsx:1492`). It has no message slot, and it holds a list of words
rather than one value. A refusal naming it goes to the banner. This is the concrete
reason the "query the page for an anchor" alternative is wrong, and `/verify` must
not read it as the set drifting from the anchors.

**Three names can never match a wire key.** `colorImages`, `variations` and
`translations` are the form's own names; the payload sends those groups under other
keys (`SEN-10`). They stay in the set because the four codeless image asserts write
`colorImages` and `images` directly, and because a whole-table refusal may still
name `variations` or `translations` (`OQ-2`). They are not counted as "shown on the
field" at `/verify`.

## Files to change

- `components/SellerDashboard/productEdit/helpers.ts` — replace the 20-name
  allowlist with the 31-name set; rewrite `mapServerErrors` to take `pricesLocked`
  and return field failures, messages and a withheld count, gated on
  `httpStatus === 422`, built on a null-prototype object with the set check before
  any key write; add the summary-choosing function; add the clearing helper; add
  the topmost-field picker; rewrite `scrollToFirstError` to use it in one pass,
  keeping its red-element fallback. **`validate()` is not touched** (`C-1`).
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — add separate state
  for backend field failures and for the messages list; merge the three records for
  display only, in the order named in step 8; rewrite the rejection handler to use
  the mapper's outputs and the summary chooser, and to stop calling `setErrors`;
  pass `pricesLocked` to the mapper; clear the backend state at the top of
  `startSave`, on a successful save and on a cancelled edit; clear a field's backend
  failure inside the update function using the functional updater; render the
  deduped, capped banner; replace the stale comment at `:518-522`. **The error
  reporting call is left exactly as it is** (`SEC-8`).
- `components/SellerDashboard/productEdit/sections.tsx` — 14 call sites:
  - **add `fieldKey` only (already show a message):** `count_of_pieces` (`:465`),
    `origin_country_iso` (`:868`).
  - **add a wrapper element carrying the anchor** (bare paragraph blocks, no
    component to take a prop): `labels` (`:796`), `images` (`:1078`),
    `colorImages` (`:1411`).
  - **add `error` only (anchor already present):** `barcode` (`:412`),
    `luck_price` (`:452`), `model_number` (`:417`), `report_ref_number` (`:418`).
  - **add `error` and `fieldKey`:** `shipping_cost` (`:467`), `shipping_days`
    (`:469`), `max_allowed_qty` (`:464`), `meta_title` (`:942`),
    `meta_description` (`:943`).
- `public/translations/translations.ar.js`, `public/translations/translations.tr.js`,
  `public/translations/translations.ku.js` — **one** new key each, the line shown
  when the banner is capped. The English source string is
  **`"More problems were reported"`**, rendered with the number interpolated after
  it, never built by joining strings into a key. Checked: that string is in none of
  the three files today. Every other message is either the backend's own text or a
  key that already exists.
- `tests/components/SellerDashboard/productEdit/serverErrors.test.ts` — **new.**
  The refusal-surfacing slice: the mapper, the summary chooser, the clearing
  helper, the topmost-field picker and the scroll.

**On the new test file and `PL-14`.** The one existing file in that folder,
`validate.weight.test.ts`, covers the weight rule inside `validate()` — a unit this
ticket must not touch. This project names a test file after the behaviour slice,
not the module (`flashPrice.test.ts` sits beside `index.test.tsx`). A file named
after this slice is the convention, not a second parallel file for the same unit.

## Integration surface

- **Components / shared config touched:** none outside the files above. The shared
  dashboard primitives (`DashField`, `InlineAlert`, `Txt`, `Num`, `Select`) are
  **used, not changed** — each already accepts every attribute this plan passes, and
  `InlineAlert`'s red `error` tone is already its default
  (`components/SellerDashboard/ui/index.tsx:360-383`). No shared type, service,
  config file, environment variable or route is touched. `utils/fetchData.ts` and
  `services/sellerDashboard/index.ts` are read-only here — the status field the gate
  needs is already on every response they return. The three translation files gain
  **one** key each and nothing else.
- **Who else depends on the changed files.** `helpers.ts` has three importers:
  `ProductEditor.tsx`, `sections.tsx`, and **`GalleryPickerModal.tsx:6`, which
  imports `fileName`**. The existing test file imports `emptyProductForm`, `UNITS`,
  `validate` and the form type from it as well. Neither the gallery modal nor the
  test touches any function this plan changes — `fileName`, `emptyProductForm`,
  `UNITS` and `validate` are all left exactly as they are — so the conclusion rests
  on which exports change, not on a claim about who imports the file (`SEN-5`,
  follow-up 7). `sections.tsx` is imported only by `ProductEditor.tsx`.
  `ProductEditor` is used by two page routes: add-product and edit-product.
- **The two changed functions have no other caller.** A repository-wide search finds
  `mapServerErrors` only at its definition and at `ProductEditor.tsx:39, :524`, and
  `scrollToFirstError` only at its definition and at `ProductEditor.tsx:43, :508,
  :528`. Changing the mapper's signature therefore breaks nothing outside this
  change.
- **Overlapping flows — the one real overlap.** `scrollToFirstError` is called from
  **two** places: the form's own validation path (`:508`) and the refusal path
  (`:528`). Step 6 changes it, so **the form's own validation also starts moving to
  the topmost failing field**. Accepted knowingly (`SEN-8`): it changes no rule,
  message, field or moment of the form's own validation, only which of several
  already-failing fields the page moves to, and its red-element fallback is kept, so
  `C-1` holds. Two scroll functions doing one job would be worse.
- **An overlap an earlier revision got wrong, now removed.** Clearing on change used
  to run against the single shared record, which also holds the form's own
  validation messages — so typing would have cleared those too, on all forty inputs.
  Backend failures now live in their own record, the clearing helper only ever
  touches that one, and the rejection handler no longer writes the shared record at
  all (`SEN-2`).
- **A remaining, smaller overlap.** The update function is the single entry point
  for every input, so step 11 runs on every keystroke and every toggle. The
  functional updater returning the same object when nothing was cleared is what
  keeps that free (`PERF-2`).
- **A conditional-render overlap.** Six price inputs are absent from the page when
  `pricesLocked` is true, yet always submitted. Step 3 keeps the mapper from marking
  a field the seller cannot see. `pricesLocked` itself is read-only here — computed
  at `ProductEditor.tsx:124-125` from shop info, and already passed to `validate()`
  and to every section.
- **Ordering / lockstep dependencies:** steps 1-2 and step 7 must land together —
  the mapper alone maps a barcode failure the input cannot display, and the
  attributes alone have nothing to fill them. Step 9 and step 10 must land together,
  or the banner never clears. No dependency exists outside this change: no backend
  change, no configuration change, no migration.
- **What breaks if this is wrong:**
  - *The mapper drops a coded entry* — a seller is refused and told nothing.
    Covered by the "every coded entry lands in exactly one output" case.
  - *The set drifts from the render sites* — a field is marked and shows nothing,
    and the summary claims highlights that do not exist. Covered by `AC-10`'s
    set-membership case and by `AC-25`'s case. The residual risk is accepted
    (`SEN-9`): the set is hand-written, and only a test pinning today's content
    guards it.
  - *A price refusal arrives while prices are locked* — handled by step 3, with its
    own case under `AC-30`.
  - *A code is bound to the wrong field* — the prefix cuts only at `.` and `[`,
    never at `_`, so a variant key such as `barcode_Black-M` cannot reach the flat
    `barcode` field it starts with. Declared as a case.
  - *Backend state is not cleared* — a stale message sits under a corrected value,
    or survives a successful save. Three clearing points, each with a case.
  - *The banner floods* — deduped and capped, with a case.

## Tests

**Search performed.** `tests/components/SellerDashboard/productEdit/` holds one
file, `validate.weight.test.ts`, covering only the weight rule inside `validate()`.
A repository-wide search for `mapServerErrors` and `scrollToFirstError` found no
reference outside the source files. Nothing covers any behaviour this ticket
changes, except as noted at `AC-15`.

Test file for every `new` row: `tests/components/SellerDashboard/productEdit/serverErrors.test.ts`.

**Test conditions this file must set up (`SEN-7`, follow-up 9).** `jsdom` provides
no `scrollIntoView`, and the scroll runs inside a 100 ms timer. The `AC-9` scroll
case therefore **stubs `scrollIntoView` on the element prototype and drives the
timer with fake timers**, and asserts the stub was called on the expected element.
Without both, that case would throw, or pass without ever scrolling — the silent
pass this repository's testing rule forbids. The topmost-field picker is exported
separately, so `AC-26` needs only a small DOM fragment: no stub, no timer.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `none — searched the productEdit test folder and repo-wide for mapServerErrors` | new | `serverErrors.test.ts` | binds a named field to the backend's own message |
| AC-2 | `none — same search` | new | `serverErrors.test.ts` | returns the backend sentence unchanged, character for character |
| AC-3 | `none — same search` | new | `serverErrors.test.ts` | a barcode already in use marks the barcode field with the backend's sentence |
| AC-4 | `none — same search` | new | `serverErrors.test.ts` | a coded field name that appears nowhere in the code is still shown, not dropped |
| AC-5 | `none — same search` | new | `serverErrors.test.ts` | a code naming an item inside a list marks that list's field |
| AC-6 | `none — same search` | new | `serverErrors.test.ts` | a colour/size row code and a translation row code go to the message list, and a variant key never reaches the flat field it starts with |
| AC-7 | `none — same search` | new | `serverErrors.test.ts` | no entry ever produces object text, and the field record has a null prototype |
| AC-8 | `none — same search` | new | `serverErrors.test.ts` | a field problem and a non-field problem in one refusal both survive |
| AC-9 | `none — searched repo-wide for scrollToFirstError` | new | `serverErrors.test.ts` | scrolls the failing field into view, with the stub called and the timer driven |
| AC-10 | `none — no component test exists for this form` | **new** (mapper half) **+ `/verify`** (render half) | `serverErrors.test.ts` | each of the 31 names binds to its own field, and all 14 names step 7 completes are in the set. **The render half — that each of the 14 inputs actually shows the message and can be reached — is proved at `/verify` by walking the 14 one at a time against a refusal naming each, named per input in `verify.md`.** |
| AC-11 | `none — same search` | new | `serverErrors.test.ts` | a refusal that is not a validation refusal yields no field marks, no messages and no withheld count |
| AC-12 | `none — same search` | new | `serverErrors.test.ts` | every coded entry lands in exactly one output, and a codeless entry withheld under `FR-20` is counted rather than lost |
| AC-13 | `none — the update function is not exported` | new | `serverErrors.test.ts` | clearing removes only the changed fields, and never touches the form's own validation record |
| AC-14 | `none — same search` | new | `serverErrors.test.ts` | the four codeless image failures still land on their own fields, and are the only codeless entries that do |
| AC-15 | `validate.weight.test.ts::product editor weight validation` (all cases) | **existing** — proved three ways, none needing new code: `validate()` is not in Files to change; the `AC-13` case pins that the clearing helper never writes the form's own record; and the rejection handler stops calling `setErrors`, which `/verify` confirms from the diff. Write nothing. | `validate.weight.test.ts` *(not edited)* | — |
| AC-16 | `none — same search` | new | `serverErrors.test.ts` | the same refusal produces the same outputs whether the save was an add or an edit |
| AC-17 | `none — same search` | new | `serverErrors.test.ts` | two entries naming the same field leave one readable message |
| AC-18 | `none` | **none** — nothing is added to the request and no shared file is edited. Proved at `/verify` by the diff: the transport file, the service file and the shared dashboard UI file are absent from it. | — | — |
| AC-19 | `none` | **none** — one new key. Proved at `/verify` by running `pnpm lint:i18n-parity` and recording its exit code, in addition to the profile's lint check, which errors on a key missing from any of the three files. | — | — |
| AC-20 | `none` | **none** — this is the validation profile itself, run at `/verify`. | — | — |
| AC-21 | `none` | **none** — a comment cannot be unit-tested. Proved at `/verify` by reading the replaced block and confirming it names the reversal as deliberate, the decision that makes it safe, and the one class still withheld with its reason. | — | — |
| AC-22 | `none — same search` | new | `serverErrors.test.ts` | an entry naming a field with an empty message marks nothing |
| AC-23 | `none — same search` | new | `serverErrors.test.ts` | a validation refusal carrying no detail still produces a failure summary |
| AC-24 | `none` | **none** — proved at `/verify` by inspection that no message reaches a markup renderer; every message is a text child. A render-level check is **declined** (`SEC-3`): this form has no component test today, and building one exceeds `C-6`. The unit case at `AC-2` guards the adjacent risk by pinning that the message string is returned unaltered. | — | — |
| AC-25 | `none — the summary line had no exported chooser before this work` | new | `serverErrors.test.ts` | the summary claims highlighted fields only when a field was marked, and falls back correctly when none was |
| AC-26 | `none — searched repo-wide for scrollToFirstError` | new | `serverErrors.test.ts` | picks the field highest in the document, not the first key, in a single pass |
| AC-27 | `none — same search` | new | `serverErrors.test.ts` | a failure carrying no refusal body produces empty outputs and leaves the existing path untouched |
| AC-28 | `none` | **none** — revertability is a property of the commit. Proved at `/verify` by the diff being one commit over the files listed above. | — | — |
| AC-29 | `none — same search` | new | `serverErrors.test.ts` | clearing returns the same object when nothing changed |
| AC-30 | `none — same search` | new | `serverErrors.test.ts` | with prices locked, a refusal naming a hidden price input goes to the message list and marks no field; with prices unlocked the same refusal marks that input |

**Six rows are `none`, each with its reason.** `AC-10` is not one of them: its
mapper half is a written case, and only the render half — whether an input paints
the message on screen — is walked by hand at `/verify`, per input, named one at a
time.

**`AC-29` proves referential identity, not render count (`PERF-3`, follow-up 12).**
The case shows the clearing helper returns the same object when nothing changed,
which is the mechanism `NFR-6` relies on; it cannot see React's output. `verify.md`
must say exactly that, and record `NFR-6` as proved by inspection of the updater
plus the identity case — not as measured.

**Every assertion carries a message** naming the step that failed, and saying when
a value came from the backend.

## Validation strategy

- Validation profile: **`full`** (`lint`, `typecheck`, `unit-tests`, `build` —
  defined in `.claude/project-config.yaml > validation_profiles`).
- **Why `full`.** The change edits two client components and adds a translation
  key, and this repository has a history of failures only a production build
  catches. `full` includes `unit-tests`, which is what runs the table above
  (`VF-11`).
- **One extra command, run at `/verify` as evidence for `AC-19`, not as a profile
  check:** `pnpm lint:i18n-parity`. It is a defined check in the project config but
  is not part of `full`, and this change adds a key, so its exit code is recorded
  against that row. `pnpm lint` already errors on a key missing from any of the
  three files.
- All checks are read-only and deterministic; the unit runner is pinned to its
  non-writing mode by the project config.
- The six `none` rows are proved at `/verify` by the named reading or command, and
  each is recorded there with its result.

## Rollback

One commit on `ticket/product-editor-backend-field-errors`, against `develop`.
Reverting it restores today's behaviour completely: the guessed allowlist, the
generic per-field text, the first-key scroll, the single shared error record, and
the 14 inputs without their attributes. The only state outside code is the one
translation key, which the same revert removes from all three files. Nothing else —
no configuration, schema, feature flag or backend state — has to be undone
alongside it, and no other branch or ticket depends on it.

## Out of scope

- `validate()` and every rule inside it (`C-1`).
- Any filter or check on **what a backend message contains** (`C-3`). `FR-20` is
  not that filter: it turns on whether an entry names a field, never on the words
  in it.
- **Truncating a message to a maximum length** (`SEC-6`, follow-up 12) —
  **declined**. It would contradict `AC-2`, which requires the backend's message to
  be shown exactly as received. The count cap and the dedupe address the flooding
  half of that finding; the spoofing half is not addressable without breaking
  `AC-2`, and the banner is never linkified or made interactive.
- **A render-level markup test** (`SEC-3`) — declined, with the reason at `AC-24`.
- **Rendering the six price inputs when prices are locked.** Step 3 stops a hidden
  field being marked; it does not unlock the inputs. Unlocking is a different rule
  with its own reason, written at `sections.tsx:434-440`.
- Marking the controls that hold a set of values — colours, sizes, tags, restricted
  countries, per-country extra prices, category sub-lists, similar words and video.
  A coded refusal naming one of those is shown as text, never dropped.
- The English-only recognition of the four codeless image failures
  (`research.md > R5`).
- The sibling boutique editor; the separate attribute-saving step; the
  enable-for-purchase step; Excel bulk upload; the media gallery.
- `utils/fetchData.ts` and `services/sellerDashboard/index.ts`. **Both error
  reporting calls keep sending exactly what they send today**, and the messages list
  and the withheld count are **not** added to any log payload (`SEC-8`). This is
  also what satisfies `FR-20`'s "recorded off-screen": `ProductEditor.tsx:530-535`
  already sends `detailed: res?.detailed_error` — the whole array, codeless entries
  included — and `utils/fetchData.ts:749-762` logs the same body again as
  `lastJson`. Nothing has to be added for it.
- Any backend change. The uniqueness-disclosure point (`SEC-7`) is a backend item to
  raise separately; `C-3` forbids building a filter for it here.

## Follow-up → change map

Every item in `review.md > Required Follow-up Actions` and where this plan answers
it.

| # | Finding | Where it is addressed |
|---|---|---|
| 1 | `SEC-1` mitigate | Step 2. The specification adopted the rule as `FR-20` in its revision 2, so there is no deviation left to record. |
| 2 | `SEN-2` mitigate | Step 8; Integration surface, "an overlap an earlier revision got wrong" |
| 3 | `SEN-3` mitigate | Step 5; Tests row `AC-25`, now `new` |
| 4 | `SEN-4` mitigate | Step 10; Files to change |
| 5 | `PERF-1` mitigate | Step 9; the one new translation key |
| 6 | `SEN-1` / `SEC-2` | Step 4, with the written reason `AC-14` cannot regress |
| 7 | `SEN-5` correct | Integration surface, "who else depends on the changed files" |
| 8 | `SEN-6` correct | Step 7; Files to change, `sections.tsx` bullets |
| 9 | `SEN-7` name conditions | Tests, "test conditions this file must set up" |
| 10 | `PERF-2` updater form | Step 11 |
| 11 | `SEC-5` safe key write | Step 2; Tests row `AC-7` |
| 12 | `SEC-3`, `SEC-4`, `SEC-6`, `PERF-3`, `PERF-4` weighed | `SEC-3` declined at `AC-24`; `SEC-4` adopted at step 12; `SEC-6` declined in Out of scope; `PERF-3` adopted under the Tests table; `PERF-4` adopted at step 6 |
| — | `SEN-8` accept | Integration surface, "the one real overlap" |
| — | `SEN-9` accept | Integration surface, "what breaks if this is wrong" |
| — | `SEN-10` | "The 31 names", last paragraph |
| — | `SEC-7`, `SEC-8`, `SEC-9`, `PERF-5`, `PERF-6` | Out of scope, or no action per the recorded disposition |

## Revisions since the reviewed plan

The gate reviewed revision 1. Three passes followed.

**Revision 2 — the twelve follow-ups.** Answered in the map above.

**Revision 3 — nine corrections found by re-reading the source.** The 31 names were
written out instead of only counted. The price-lock case was found and handled. The
gate's status field was named (`httpStatus`). "Uses the alert component twice" was
wrong — four times, and its default tone is already red, so the shared UI file stays
out. The topmost-field picker stopped being called "pure"; it reads the document.
The scroll's red-element fallback was stated as kept. "When a save starts" was pinned
to `startSave`. The display merge order was pinned, and the rejection handler was
stated to stop calling `setErrors`. `AC-10` moved from `none` to a written case for
its mapper half.

**Revision 4 — the deviation is gone.** The owner sent the work item back to
`/wf:spec` rather than accept it. `spec.md` revision 2 added `FR-20` for the
withhold rule and `E-15` / `AC-30` for the hidden price inputs. So this plan drops
its "Deviation from `spec.md`" section, cites `FR-20` where it used to cite an owner
disposition, and gives `AC-30` its own Tests row instead of carrying that case
inside `AC-12`'s.

## Plan ↔ REQ / AC traceability

| Step | Requirements | Acceptance criteria |
|---|---|---|
| 1 — the 31-name displayable set replaces the allowlist | FR-1, FR-4 | AC-1, AC-4, AC-10 |
| 2 — mapper returns field failures, messages and a withheld count | FR-2, FR-3, FR-5, FR-6, FR-7, FR-8, FR-15, FR-17, FR-20 | AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-12, AC-14, AC-17, AC-22 |
| 3 — the price-lock rule | FR-13, FR-15 | AC-30, AC-25 |
| 4 — validation-only gate in front of the mapper | FR-14 | AC-11, AC-23 |
| 5 — exported summary chooser | FR-13 | AC-25 |
| 6 — topmost-field picker, one pass, fallback kept | FR-10, FR-11 | AC-9, AC-26 |
| 7 — 14 inputs gain their attributes or a wrapper | FR-12 | AC-10 |
| 8 — separate state, merge order, no `setErrors` | FR-18, NFR-1 | AC-15, AC-17 |
| 9 — deduped, capped banner | FR-6, FR-9 | AC-6, AC-19, AC-24 |
| 10 — three clearing points | FR-15, FR-16 | AC-13 |
| 11 — clear on change, functional updater | FR-16, NFR-6 | AC-13, AC-29 |
| 12 — replaced comment keeping the counter-example | C-4, C-3, FR-20 | AC-21 |
| 13 — write the declared tests | NFR-4 | AC-20 |
| *(no step — nothing changed)* | FR-19, NFR-2, NFR-5 | AC-16, AC-18, AC-27, AC-28 |

Every `AC-1` … `AC-30` appears above. Every `OQ-n` was answered in `spec.md`; none
was deferred to this stage, and none is left open here (`PL-12`).
