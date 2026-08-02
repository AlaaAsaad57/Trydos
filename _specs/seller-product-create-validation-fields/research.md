---
ticket: seller-product-create-validation-fields
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-07-18
links:
  clickup:
  github:
---

# Research — seller-product-create-validation-fields

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the seller product-create submit succeed by fixing the three fields the
backend rejects — `default_language_code` (derive as `en`), `brand_id` (validate
client-side like other required fields), and the boolean encoding of
`multiplyQTY` / `packed_after_ordering` — across both the create and update
paths, which share one payload builder.

## Relevant directories

- `components/SellerDashboard/productEdit/` — the entire editor. Four files:
  `ProductEditor.tsx` (state + save orchestration), `sections.tsx` (all form
  sections/UI), `helpers.ts` (types, validation, payload builder, diff),
  `GalleryPickerModal.tsx` (unrelated to this ticket).
- `services/sellerDashboard/` — `index.ts` holds `addProduct` / `updateProduct`
  and the lookups fetchers. Product endpoint URLs are inline string literals
  here, not in `utils/endpointConfig.tsx`.
- `docs/api-requirements/` — the negotiated backend contract and the open
  follow-ups list; the primary evidence for what the server accepts.
- `public/translations/` — `translations.{ar,tr,ku}.js`. Only relevant if a new
  user-visible string is introduced (see Risks — the current decisions suggest
  one new validation message will be needed).

## Relevant config files

- `.claude/project-config.yaml` — `validation_checks` / `validation_profiles`
  (used by `/plan` to name a profile) and `protected_paths`. **`protected_paths`
  contains only `observability: false`** — Trydos has no protected runtime paths,
  so this ticket cannot touch one. Read for understanding only; not modified.
- `package.json` — script definitions for the validation commands below.
- `components/SellerDashboard/productEdit/add-product-payload.txt` — the captured
  failing multipart request. Untracked scratch evidence, not source.
- `product-edit-json.json` (repo root) — a sample `/edit` response; useful as a
  fixture for `buildFormFromEdit`.

## Possibly affected services

- **`POST /shop/products` (create)** — the failing path. `addProduct`,
  `services/sellerDashboard/index.ts:873`.
- **`POST /shop/products/{id}/update` (update)** — in scope by the owner's
  decision, because both endpoints are fed by the single builder
  `buildUpdateFormData` (`helpers.ts:630`). Any encoding change reaches update
  whether or not it is intended to, so update is affected by construction, not by
  choice.
- **Go backend / seller dashboard DTOs** — consumer of the payload. Not modified
  by this ticket; its acceptance rules are the constraint being satisfied.
- No impact on storefront, cart, search, or auth: the editor is isolated behind
  the seller dashboard.

## Test / validation commands available

Listed, **not run** (no test suite exists by repo policy — CLAUDE.md).

- `pnpm exec tsc --noEmit` — type safety (`validation_checks > typecheck`).
- `pnpm lint` — ESLint, and per repo memory it errors on translate keys missing
  from `ar`/`tr`/`ku` (`validation_checks > lint`).
- `pnpm build` — production build (`validation_checks > build`).
- `pnpm lint:i18n-parity` — translation-file key parity.
- `pnpm knip` — unused files/exports/deps.
- Profiles available to name in `plan.md`: `standard-frontend` (typecheck +
  lint) and `full-build` (typecheck + lint + build).
- Manual: submit the create form in the seller dashboard and inspect the outgoing
  multipart payload — the only way to observe the three fields end-to-end.

## Risks and unknowns

- **HIGH — the `"false"` truthiness trap on update.**
  `docs/api-requirements/shop-product-create-backend-followups.md` §3 P2 item 4
  records a live backend precedence bug: sending `multiplyQTY="off"` *enables*
  the flag. The FE deliberately works around it by sending `"on"` only and
  omitting the key to disable (`helpers.ts:667-668`, and §4 of the same doc:
  `"on" when enabled, key omitted when disabled — never "off"`). If that bug is
  a plain truthiness check, the string `"false"` is just as truthy as `"off"`,
  so switching to always-send `true`/`false` could **silently enable both flags
  when the seller turns them off** — converting a create-only error into a
  data-correctness regression on update. The intake records that both endpoints
  now accept `true`/`false`; this must be confirmed against the actual create
  *and update* DTOs before the omit-workaround is removed, and it is the single
  highest-risk item in this ticket.
- **MEDIUM — `FormData` stringifies everything.** `set()` does `String(v)`
  (`helpers.ts:633`), so a JS boolean goes on the wire as `"true"` / `"false"`.
  Whether the backend accepts those strings, or wants `1`/`0`, is not pinned
  down by the error text "must be true or false".
- **MEDIUM — the create doc is known-unreliable.** Follow-ups item 9 states that
  `shop-seller-product.md` was wrong on endpoints, `sync_color_images`,
  colors/sizes representation, units, `images[]`, `discount_price`, and lookups
  nesting. Its `brand_id: 4` / `default_language_code: "en"` required-field rows
  are consistent with the observed errors, but the document should not be
  treated as authoritative on shape by itself.
- **MEDIUM — `brand_id` type.** The doc types it `integer`; the form holds it as
  a `string` (`helpers.ts:154`) and posts `""` when unselected
  (`helpers.ts:641`). Client-side validation stops the empty case, but whether
  the server wants a numeric or accepts a numeric string is unconfirmed.
- **LOW — a new user-visible string.** Adding a `brand_id` required check to
  `validate()` means a new error message, which per CLAUDE.md must be added to
  all three of `translations.{ar,tr,ku}.js` **before** it is used in code, and
  `pnpm lint` will fail if it is not. Existing messages in `validate()` use the
  `tx(...)` wrapper — an existing key may be reusable.
- **LOW — `default_language_code` has no form field.** It is absent from
  `ProductForm`, `emptyProductForm()`, and the builder, so deriving it as `en`
  means a builder-level constant rather than a state change. `validate()` already
  requires an `en` translation name (`helpers.ts:622`), which makes `en` a safe
  derivation, but the two rules are independent and could drift.
- **LOW — diff/`initial` coupling.** `startSave` refuses to submit when
  `buildDiff(initial, form)` is empty (`ProductEditor.tsx:420`). A field added to
  `ProductForm` may surface in the confirm-diff UI and would need a label;
  deriving `default_language_code` in the builder avoids this entirely.

## Open questions

- Does the create DTO accept `"true"` / `"false"` as strings, or does it require
  `1` / `0`? (Blocks the exact encoding.)
- Has the `multiplyQTY` `"off"`-enables-it precedence bug actually been fixed on
  **update**, or only on create? If unfixed on update, always-sending `false`
  regresses update and the omit-workaround must stay for that path.
- Should `default_language_code` be a hardcoded `"en"` in the builder, or derived
  from the first/`en` entry of `form.translations`? The owner chose "derived as
  `en`"; which of these two readings is intended affects behaviour only if a
  seller ever submits without an `en` translation, which `validate()` currently
  forbids.
- Is `brand_id` genuinely required on **update** too, or only on create? If only
  create, an unconditional client-side required check would newly block updates
  of legacy products that have no brand set.
- Does the same always-present boolean rule apply to any other flag not exercised
  by the captured payload?

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
