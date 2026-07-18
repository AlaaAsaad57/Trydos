---
ticket: seller-product-create-validation-fields
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Plan — seller-product-create-validation-fields

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 2** — rewritten to address the ten `Required Follow-up Actions` in
`review.md` (`CHANGES_REQUESTED`, 2026-07-18). The approach is unchanged; the
panel raised no design objection to it. What changed is accuracy: two false
claims removed, the constant named and narrowed, evidence supplied where it was
previously asserted, and blast radius stated plainly. A follow-up map is at the
end.

## Approach

Fix all three fields at their source rather than special-casing the create path:
`buildUpdateFormData` gains an always-present `default_language_code` and switches
the two boolean flags from the enable-token/omit encoding to explicit `true` /
`false`, and `validate()` gains a `brand_id` required check. Because one builder
feeds both endpoints, this satisfies create and update together (AC-6) with no
branching between them — which is also the only honest option, since a per-path
divergence would have to be justified and none is wanted.

**Blast radius (follow-up 8).** That shared builder is the whole point and the
whole risk. `buildUpdateFormData` serves both `POST /shop/products` and
`POST /shop/products/{id}/update`, so the encoding change reaches **every
existing seller's edit path**, not only the currently broken create path. The
create fix cannot be shipped without also shipping the edit change. This is why
`AC-8` (a flag turned off stays off after save + reload) is the single most
important criterion in the ticket, and why it must be exercised against a real
backend rather than reasoned about.

Two deliberate choices over the alternatives:

- **A shared, narrowly-typed `en` constant rather than a bare literal
  (follow-up 3).** `default_language_code` is derived, not user-chosen, so it
  belongs in the payload builder and not in `ProductForm` — adding a form field
  would surface it in the confirm-diff UI and invent a seller-facing concept for
  no reason (NFR-4). Introduce `DEFAULT_LANGUAGE_CODE`, exported from the editor
  helpers and typed as the **literal `"en"`**, not `string`, so it cannot later
  be widened into caller-supplied data that would be echoed into a backend
  payload. Use it both for the emitted value and for the existing
  English-translation check, so the two rules read one source.

  *Why local to the product-editor helpers, not the i18n default:* the repo
  already has a default locale in `proxy.ts`, but that is the **storefront UI
  language** — request-scoped, user-facing, and legitimately variable per
  visitor. `default_language_code` is a **product-content contract value** sent
  to the backend, describing which `custom_data` row is the base row. Deriving
  one from the other would couple a payload contract to a presentation
  concern, so that a future locale change would silently alter stored product
  data. They are deliberately kept separate.

- **No component changes.** `Select` already accepts `required` and `error`,
  already renders a placeholder `"Select"` option, and `errors.brand_id` already
  flows into `CoreSection` through the existing `errors` prop. Brand validation
  is therefore a `validate()` addition plus two existing props on one call site —
  the smallest change that satisfies AC-2, and it makes the brand field behave
  identically to the unit field beside it.

Translation keys are added to all three non-English files **before** the string is
used in code, because lint fails otherwise (C-3).

## Steps

1. Move the captured multipart evidence out of the component source tree into
   `_specs/seller-product-create-validation-fields/`, and add the filename to
   `.gitignore` so a broad `git add` cannot commit seller data (follow-up 4).
2. Confirm the boolean encoding against the real endpoint with one throwaway
   submit, and record the observed result before writing the encoding change
   (follow-up 6 — see Validation strategy for its current status).
3. Add the brand-required message key to all three translation files, so the key
   exists before any code references it.
4. Introduce `DEFAULT_LANGUAGE_CODE` in the editor helpers, typed as the literal
   `"en"`, and use it in the existing English-translation validation check so both
   rules share one source.
5. Emit `default_language_code` unconditionally from the payload builder using
   that constant.
6. Change `multiplyQTY` and `packed_after_ordering` in the payload builder to
   always emit an explicit boolean instead of the enable-token/omit pattern, and
   replace the now-stale comment describing the old workaround with one recording
   the new contract and the residual server-side risk.
7. Add a `brand_id` required check to `validate()`, wrapped in the existing
   translation helper and worded consistently with the other required-field
   messages.
8. Pass `required` and `error={errors.brand_id}` to the existing Brand `Select` so
   the message renders and the field is marked required.
9. Run the validation profile's checks and manually exercise create and edit,
   inspecting the outgoing payload for the three fields.

## Files to change

- `.gitignore` — add the captured-payload filename so live seller data cannot be
  committed by a broad `git add` (follow-up 4).
- `public/translations/translations.ar.js` — add the brand-required key with an
  Arabic translation.
- `public/translations/translations.tr.js` — add the same key, Turkish.
- `public/translations/translations.ku.js` — add the same key, Kurdish.
- `components/SellerDashboard/productEdit/helpers.ts` — add the exported
  `DEFAULT_LANGUAGE_CODE` constant typed as `"en"`; use it in the existing
  English-translation check; add the `brand_id` required check in `validate()`;
  in `buildUpdateFormData` emit `default_language_code` and switch `multiplyQTY` /
  `packed_after_ordering` to always-present booleans, updating the accompanying
  comment.
- `components/SellerDashboard/productEdit/sections.tsx` — add `required` and
  `error={errors.brand_id}` to the existing Brand `Select` in `CoreSection`.

Also moved (not edited): the captured payload file relocates from
`components/SellerDashboard/productEdit/` into this ticket's `_specs` folder. It
is untracked, so the move produces no diff to tracked source.

**Protected-path impact: none — evidenced, not assumed (follow-up 7).**
`.claude/project-config.yaml > protected_paths` contains exactly one entry,
`observability: false`, and Trydos declares no path globs beyond it, so no file
in this plan can match a protected path. Separately worth stating: the three
`public/translations/*.js` files are **publicly served static assets**, so the
new translation values must contain no internal identifiers, seller data, or
debug text — only the user-facing message.

**Working tree (follow-up 5) — resolved.** The previously uncommitted
`ProductEditor.tsx` / `sections.tsx` edits were committed and pushed
(`5d0899e3`); `develop` is clean and in sync with `origin/develop`. The only
untracked paths are this ticket's `_specs` folder and the captured payload file,
which step 1 relocates and gitignores. Implementation can branch from a clean
`develop` (IM-3).

## Validation strategy

- Validation profile: `standard-frontend`
- The profile's checks cover AC-9 (type safety and lint, including the
  translation-parity rule that guards AC-3).
- Everything else is manual, because the repo has no automated test suite (C-1).
  With the dev server running, in the seller dashboard:
  - Submit create with **no brand selected** → expect a brand-required error on
    the field and **no** network request (AC-2).
  - Select a brand and submit a fully completed create form → expect success and
    none of the three backend errors (AC-7).
  - Inspect the outgoing create payload in the browser network tab → confirm
    `default_language_code=en` (AC-1), and `multiplyQTY` / `packed_after_ordering`
    present as `true` or `false` with the toggles both on and off (AC-4, AC-5).
  - Repeat the payload inspection on an **edit** submission (AC-6).
  - Edit a **pre-existing** product, turn a boolean flag **off**, save, reload,
    and confirm it is stored as off (AC-8). Given the blast radius above, this
    must be done against a real backend on a product that existed before the
    change — not only on a product created during testing.
  - Edit a product that has no brand stored → expect the same brand-required
    prompt, and a normal save once a brand is chosen (AC-10).
- **AC-2 discoverability (follow-up 9).** A failed submit sets the `errors` object
  and fires a generic toast; it does **not** scroll to or expand the offending
  section. `CoreSection` is the first section of the form, so a brand error is
  normally on screen, but this is not guaranteed if the seller has scrolled down
  to submit. The toast is therefore the discoverability mechanism of record, and
  the field-level error is the specific explanation. Verification should confirm
  the seller can actually tell *which* field failed, not merely that something
  did.
- Captured evidence for comparison: the relocated multipart capture in this
  ticket's `_specs` folder. It contains live seller data (boutique id, prices,
  purchase-price margin, barcode) — it must never be re-captured with request
  headers, which would include `MARKET-TOKEN`.

**Boolean encoding — status of follow-up 6.** Still **unverified**. The owner has
fixed the decision (`true` / `false`; never `on`/`off`, never `1`/`0`), and this
plan implements exactly that. What has not happened is the throwaway submit that
would confirm the server *accepts* that spelling. Step 2 exists to do it before
step 6 is written. Until it is done, `AC-7` rests on an assumption rather than an
observation, and this plan does not claim otherwise.

**Residual risk carried into verification.** A previously documented backend
defect treats a truthy string sent for `multiplyQTY` as "enable". If that defect
is still live on the update path, the string `false` is also truthy and a flag the
seller switches off would be stored as on — a silent, data-affecting wrong-state
write on the path every existing seller uses. The plan does not work around it,
because the owner has fixed the encoding decision and a workaround would
contradict it; `AC-8` is the criterion that detects it. If `AC-8` fails, this is a
backend fix, not a client one, and the ticket should block rather than reinstate
the omit pattern.

**Authorization is out of this ticket's reach (follow-up 10).** The `brand_id`
check added here is **UX only** — it stops the empty case client-side and nothing
more. It confers no security property: a client-supplied `brand_id` (and
`boutique_id`) still crosses the trust boundary unvalidated by us, and C-4 rules
out a backend change. Whether the backend scopes those ids to the authenticated
seller must be confirmed with the backend team and recorded at `/verify`. AC-2
passing must not be read as "brand input is now validated".

## Rollback

- All changes are additive edits to six files on the ticket branch with no commit
  created at implementation, so reverting is discarding the working-tree changes,
  or reverting the single published commit if it has already shipped.
- No migration, no persisted state, and no schema change — nothing to unwind
  server-side.
- The translation keys are inert if the code referencing them is reverted; they
  can be left in place or removed with the rest.
- **Correction (follow-up 1): step 6 is not independently revertable while
  creation depends on it.** The previous revision claimed the boolean encoding
  could be reverted on its own as a partial rollback. That is false:
  `multiplyQTY` was one of the three errors blocking product creation, so
  reverting it re-breaks create entirely and returns the ticket to its starting
  problem. If `AC-8` fails, the fallback is a **backend fix** to the truthiness
  defect, not a client revert — and the correct action is to block the ticket
  (VF-6) rather than ship a known wrong-state write to every seller's edit path.
  The genuinely independent parts are the brand validation (steps 3, 7, 8) and
  the base-language field (steps 4, 5); either can be reverted without affecting
  the others.

## Out of scope

- The debug helper that fills the product form from a saved payload — tracked
  separately.
- Descriptor values, still awaiting a backend contract.
- Tax fields, still withheld pending a separate backend defect.
- Any backend or DTO change, including the truthiness defect and any
  authorization scoping of `brand_id` / `boutique_id`.
- Validation for fields not named in the reported errors.
- Correcting the published backend contract document, though it will be stale on
  the boolean encoding once this ships.
- The pre-existing whole-object `errors` replacement that re-renders every section
  on a failed submit — noted by the performance lens, unchanged by this plan.

## Follow-up map (review.md → this revision)

| # | Follow-up | Where addressed |
|---|-----------|-----------------|
| 1 | Correct the false partial-rollback claim | Rollback, final bullet |
| 2 | Soften the E-3 "closed" claim | Approach, first bullet ("read one source", not "closes E-3") |
| 3 | Name the constant, type it `"en"`, justify locality | Approach, first bullet; step 4 |
| 4 | Relocate captured evidence + gitignore | Step 1; Files to change (`.gitignore`); Validation strategy |
| 5 | Resolve dirty working tree | Files to change → "Working tree — resolved" |
| 6 | Settle boolean encoding by submit | Step 2; "Status of follow-up 6" — **still open** |
| 7 | Evidence the protected-paths claim | Files to change → "Protected-path impact" |
| 8 | State blast radius explicitly | Approach → "Blast radius" |
| 9 | Address AC-2 discoverability | Validation strategy → "AC-2 discoverability" |
| 10 | Carry authorization question forward | Validation strategy → "Authorization is out of this ticket's reach" |
