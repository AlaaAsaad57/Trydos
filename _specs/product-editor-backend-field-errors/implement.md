---
ticket: product-editor-backend-field-errors
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-08-27
links:
  clickup:
  github:
---

# Implement — product-editor-backend-field-errors

> Record of what was actually built, following `plan.md` revision 4.

Branch: `ticket/product-editor-backend-field-errors`, cut from a clean `develop`.
**This repository overrides `IM-3`'s `main`** — the project profile in `CLAUDE.md`
names `develop` as the base branch. No commit was created (`IM-9`).

## Changes made

- **`components/SellerDashboard/productEdit/helpers.ts`**
  - The 20-name guessed allowlist is replaced by `DISPLAYABLE_FIELDS`, the 31
    names this form can show a message under. All 20 old names are inside it.
  - `PRICE_LOCKED_FIELDS` names the six inputs `sections.tsx` renders only when
    prices are unlocked.
  - `mapServerErrors(res, pricesLocked)` now returns `{ fields, messages,
    withheld }`. It is gated on `httpStatus === 422`, cuts each `code` at the
    first `.` or `[` and never at `_`, confirms set membership **before** writing
    any key, and builds the field record on a null-prototype object. An entry
    carrying no `code` is either one of the four image asserts — which keep our
    own wording, exactly as before — or is counted as withheld.
  - The docblock that said "no backend text is ever surfaced" is replaced. The new
    one records that the reversal is deliberate, why it is safe, **and** which one
    class is still withheld, keeping the raw-server-text counter-example.
  - `chooseSaveErrorSummary` is new and pure: the "fix the highlighted fields"
    wording only when a field was marked, otherwise the first unplaceable message,
    otherwise the caller's fallback.
  - `clearServerFieldErrors` is new: drops the failures on the changed keys and
    returns the **same object** when it cleared nothing.
  - `pickTopmostErrorField` is new: one pass over `[data-field]` in document
    order, returning the **element**, so no backend code reaches a selector.
  - `scrollToFirstError` uses it and keeps its `.border-[#f85555]` /
    `.text-[#f85555]` fallback.
  - **`validate()` is untouched** (`C-1`).

- **`components/SellerDashboard/productEdit/ProductEditor.tsx`**
  - `serverErrors` and `serverMessages` are new state, held apart from `errors`.
  - `patch` clears the backend failure on every key it writes, through the
    functional updater, so an unchanged record costs no state change.
  - `startSave` clears both pieces of backend state at the top — the only door
    into a save, so it covers `confirmSave` too.
  - `handleSaveRejection` was rewritten: it reads the mapper's three outputs,
    **no longer calls `setErrors` at all**, scrolls when a field was marked, and
    takes its summary from `chooseSaveErrorSummary`. The `LogError` call is
    byte-for-byte unchanged (`SEC-8`).
  - The stale comment claiming no backend text is ever rendered is replaced.
  - A successful save and a cancelled edit both clear the backend state.
  - `mergedErrors` joins the three records **for display only**, in the order
    plan step 8 named, each spread conditional so that with nothing to merge the
    object handed to the sections is the very same one as today.
  - The banner renders above the sections, deduped by exact text and capped by
    `SERVER_MESSAGE_LIMIT` (five), with one counted line when more remain. It uses
    the `InlineAlert` already imported, at its default red `error` tone, so the
    shared UI file is untouched. Each line is its own `dir="auto"` element.

- **`components/SellerDashboard/productEdit/sections.tsx`** — the 14 inputs:
  - `error` added (anchor already present): `barcode`, `luck_price`,
    `model_number`, `report_ref_number`.
  - `error` and `fieldKey` added: `shipping_cost`, `shipping_days`,
    `max_allowed_qty`, `meta_title`, `meta_description`.
  - `fieldKey` added (message already shown): `count_of_pieces`,
    `origin_country_iso`.
  - anchor added to the bare paragraph blocks: `labels`, `images`, `colorImages`.
  - `SeoSection` now destructures `errors`, which it did not receive at all.

- **`public/translations/translations.{ar,tr,ku}.js`** — one key each,
  `"More problems were reported"`, rendered with the count interpolated after it.

- **`tests/components/SellerDashboard/productEdit/serverErrors.test.ts`** — new,
  76 cases.

## Changes prepared (uncommitted)

No commit was created (`IM-9`); publishing is the delivery action's job.

```
 M components/SellerDashboard/productEdit/ProductEditor.tsx   106 +-
 M components/SellerDashboard/productEdit/helpers.ts          229 +-
 M components/SellerDashboard/productEdit/sections.tsx         30 +-
 M public/translations/translations.ar.js                       1 +
 M public/translations/translations.ku.js                       1 +
 M public/translations/translations.tr.js                       1 +
 ?? tests/components/SellerDashboard/productEdit/serverErrors.test.ts
```

Every path is in `plan.md > Files to change`. Nothing outside it was edited
(`IM-4`).

## Deviations from plan

1. **The three bare paragraph blocks carry the anchor themselves.** The plan said
   each "needs a new wrapper element carrying the anchor". Putting `data-field` on
   the existing `<p>` does the same job with no new element, so that is what was
   done — smaller than planned, same behaviour. `sections.tsx:796`, `:1078`,
   `:1411`.
2. **The scroll's legacy id lookups are gone.** The old chain also tried
   `#field_<key>`, `#section_<key>` and `#<key>` after the `data-field` query. A
   repository-wide search found **no** element with an id in any of those shapes,
   so all three were dead and are not reproduced in the one-pass walk. The
   colour-class fallback, which is live, is kept.
3. **`SeoSection`'s signature changed, not just its two call sites.** It did not
   receive `errors` at all, so the two SEO inputs could not have shown a message
   from a prop alone. Predicted by `SEN-17`; same file, so `IM-4` is not at issue.
4. **Base branch.** Cut from `develop`, not `IM-3`'s `main`, per this
   repository's project profile.

## Tests written

All `new` rows are cases in the single declared file,
`tests/components/SellerDashboard/productEdit/serverErrors.test.ts`. No second
parallel file was created for any unit.

| AC | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `serverErrors.test.ts` | a barcode already in use marks the barcode field | new |
| AC-2 | `serverErrors.test.ts` | the field carries the backend's own sentence, character for character | new |
| AC-3 | `serverErrors.test.ts` | a barcode already in use marks the barcode field | new |
| AC-4 | `serverErrors.test.ts` | a field name nothing in the code has ever mentioned still reaches the seller | new |
| AC-5 | `serverErrors.test.ts` | a code naming an item inside a list marks that list's own field | new |
| AC-6 | `serverErrors.test.ts` | a colour/size row and a translation row are shown as text, and a variant key never reaches the flat field it starts with | new |
| AC-7 | `serverErrors.test.ts` | a code cannot become a key on its own, and the field record has no prototype | new |
| AC-8 | `serverErrors.test.ts` | a field problem and a non-field problem in one refusal both survive | new |
| AC-9 | `serverErrors.test.ts` | scrolls the failing field into view; does not scroll when nothing is failing | new |
| AC-10 | `serverErrors.test.ts` | binds a refusal naming %s to that field (31 cases); does not bind similar_words | new (mapper half) |
| AC-11 | `serverErrors.test.ts` | a refusal that is not a validation refusal marks nothing and says nothing | new |
| AC-12 | `serverErrors.test.ts` | every coded entry lands in exactly one output, and a codeless entry is counted rather than lost | new |
| AC-13 | `serverErrors.test.ts` | removes only the changed field and leaves the others in place; never touches the record the form's own validation writes | new |
| AC-14 | `serverErrors.test.ts` | the four codeless image failures still mark their own inputs, with our wording; a codeless entry matching none of the four phrases marks no field at all | new |
| AC-15 | `validate.weight.test.ts` | product editor weight validation (all cases) | existing — confirmed present and unedited; `validate()` is untouched |
| AC-16 | `serverErrors.test.ts` | the same refusal produces the same outputs for an add and for an edit | new — see Findings note |
| AC-17 | `serverErrors.test.ts` | two problems naming the same field leave one readable message | new |
| AC-18 | — | — | none — proved at `/verify` from the diff |
| AC-19 | — | — | none — `pnpm lint:i18n-parity` at `/verify` |
| AC-20 | — | — | none — the validation profile itself |
| AC-21 | — | — | none — read at `/verify` |
| AC-22 | `serverErrors.test.ts` | an entry naming a field with an empty message marks nothing | new |
| AC-23 | `serverErrors.test.ts` | a validation refusal carrying no detail at all yields empty outputs to fall back on | new |
| AC-24 | — | — | none — read at `/verify`; render-level check declined (`SEC-3`) |
| AC-25 | `serverErrors.test.ts` | claims highlighted fields only when a field was actually marked; says what happened instead; falls back to the caller's own wording | new |
| AC-26 | `serverErrors.test.ts` | picks the field highest in the document, not the first key in the record; ignores an anchor whose field is not failing | new |
| AC-27 | `serverErrors.test.ts` | a failure carrying no refusal body at all behaves as it does today | new |
| AC-28 | — | — | none — proved at `/verify` from the diff |
| AC-29 | `serverErrors.test.ts` | returns the very same object when nothing was cleared | new |
| AC-30 | `serverErrors.test.ts` | with prices locked, a refusal naming a hidden price input is shown as text, not marked | new |

**Result:** `76 passed (76)` across the two files in that folder
(`npx vitest run --project unit tests/components/SellerDashboard/productEdit/`).

**One test had to be fixed, and the reason is worth keeping.** The two `AC-9`
cases first failed with `The property "scrollIntoView" is not defined on the
object.` `jsdom` implements no layout, so `scrollIntoView` is not merely
unimplemented — it is **absent from the prototype**, which means `vi.spyOn` has
nothing to spy on. The stub now defines the property instead. This is exactly the
condition `SEN-7` predicted: without it the case throws, and without the fake
timers it would pass while never scrolling.

## Findings — confirmed bugs, out of scope

**No `BUG-n`.** No test written here proved existing behaviour wrong. The
behaviour this ticket changes was already recorded as the defect in `spec.md`, so
it is the work, not a finding.

Two notes carried to `/verify`, neither a bug:

- **`AC-16`'s case is weak, as `SEN-14` said it would be.** The mapper takes only
  the response and `pricesLocked`; it has no add/edit input, so the case can only
  assert that the same input maps the same way. The owner recorded **no action**
  on that minor at the review gate, so it was written as declared. `/verify` must
  record `AC-16` as covered by inspection — both save paths call the same
  `handleSaveRejection` (`ProductEditor.tsx:565`, `:588`) — and not treat the
  passing case as the proof.
- **The two accepted exposures in `review.md > Accepted exposures` stand
  unchanged.** The codeless image branch writes our own two constants, which
  `/verify` can confirm at `helpers.ts`; and a summary line containing
  "authorized" still reaches nobody, because `store/notifications/reducer.ts:89-91`
  drops it. The banner carries the same sentence, so the seller is not left with
  nothing.

## Left undone

Nothing. Every step of `plan.md` was applied and every Tests row was carried out.

## Checks run here (the profile itself runs at `/verify`)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (after `next typegen`) | clean, no output |
| `pnpm lint` | **0 errors**, 62 warnings — every warning is pre-existing and in a file this change does not touch |
| `pnpm lint:i18n-parity` | `✓ i18n parity OK — 2163 keys present in all three files.` |
| unit suite, the productEdit folder | 76 passed (76) |
