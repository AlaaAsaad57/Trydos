---
ticket: seller-product-editor-contract-alignment
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Implement — seller-product-editor-contract-alignment

> Record of what was actually built, following `plan.md`.

**All five units are complete.**

Two passes:
1. **Initial** (state `approved`) — branch created from clean `develop` (IM-3);
   units 2–5 done; unit 1 partially done and **blocked** on the four deletions.
2. **Resume** (state `implementation-in-progress`, IM-3a — no second branch) —
   owner directed "remove superseded docs". Orphan content migrated into the
   contract first, then the four documents deleted. Block cleared.

3. **Resume 2** (after `/verify` FAILED) — **no code changed.** Every entry in
   `plan.md`'s "Files to change" was already applied; the two blockers recorded by
   `/verify` were a specification decision and a manual test pass, neither of
   which is implementation work. The owner resolved the first (see D-6); the
   second was deferred by owner decision (see D-7).

Branch: `ticket/seller-product-editor-contract-alignment`. No commit, no push
(IM-9). The four deletions are staged by `git rm` but **not committed**.

## Changes made

### Unit 1 — Contract truth-base (PARTIAL)

- **Out-of-repo backup taken first** (plan step 1) — all three documents copied
  to the session scratchpad before any move. This is the only recovery path;
  git cannot restore untracked files.
- `Untitled-1.md` → `docs/api-requirements/shop-product-body-contract.md` (moved)
- `product-body-payloads.txt` → `docs/api-requirements/shop-product-body-payloads.txt` (moved)
- `seller-product-body-alignment-roadmap.md` → `docs/api-requirements/seller-product-body-alignment-roadmap.md` (moved)
- `.gitignore` — the three moved documents are **ignored, not tracked**. See
  deviation D-1: this reverses the plan's `git add -N` step and is the single
  most important change in this ticket.
- `docs/api-requirements/shop-product-create-backend-followups.md` — §1 tax
  blocker marked **RESOLVED 2026-07-20** against contract §1b, with the original
  text preserved in a collapsed block and marked stale. Q-A/Q-B need no reply.
- **Orphan audit (plan step 4, before the delete per review follow-up P-10).** All
  four documents read in full; every claim absent from the contract and the
  payloads file was identified.
- **Migration.** That content was appended to
  `docs/api-requirements/shop-product-body-contract.md` as **§5 "Migrated from
  superseded docs"** (275 → 438 lines), covering: transport/auth/permissions
  (including `X-Seller-ID` being mandatory and the `country` header driving
  currency conversion); the response envelope and 403/404 semantics; the lookups
  endpoints, their dataset shapes, the flat-vs-`data.lookups` nesting split and
  the `UPDATE_PRODUCT` gate that 403s a create-only role; the full
  `GET /products/{id}/edit` read side with its request↔response name mismatches;
  the media upload service (`/upload/bulk`, folders `product` and `product/meta`);
  the whole change-status endpoint including its five activation-blocker strings;
  the descriptor sync payload shape and delete-and-recreate semantics; and the
  standing policies (no delete-product endpoint, flat create payload, the two
  non-existent legacy routes). §5.9 records three items carried over as
  **unverified** — the `'liter'` weight-rule conflict, a possible create-side
  variant-price bound, and the never-delivered real payload captures.
- **Deleted** (`git rm`, staged not committed): `shop-seller-product.md`,
  `shop-seller-product-create-gaps-and-questions.md`,
  `shop-seller-product-create-answers.md`, `docs/product-edit.md`. No tombstones.
  All four remain recoverable from git history.
- `helpers.ts` header comment repointed — it referenced `docs/product-edit.md`,
  which no longer exists. It now says the contract is deliberately kept out of
  this repository and names who to ask.
- Backup refreshed after the migration, so the out-of-repo copy includes §5.

### Unit 2 — Body-builder correctness

`components/SellerDashboard/productEdit/helpers.ts`:

- `Translation` gains an optional `id`, documented as the update match key.
- `buildFormFromEdit` carries `t.id` through instead of discarding it.
- `buildUpdateFormData` emits `custom_data[i][id]` **only when the entry has
  one** — create invents nothing (E-2), and an entry missing an id does not
  affect its siblings (E-1).
- `luck_price` is now unconditional (`""` → `"0"`). `0` is the server's own
  default and the value forced for unapproved sellers (§1b), so it is the neutral
  "no luck price" rather than a real promotional price.
- `packed_after_ordering` sends the literal `'on'` when enabled and `''` when
  disabled; the key is always present. Comment records that this fixes **update
  only**.
- `tax` / `tax_type` restored, `tax_type` constrained to exactly `'flat'` or
  `'percent'`. The stale operator-precedence comment is deleted and replaced with
  the contract citation that disproves it.
- `multiplyQTY` **unchanged**; its risk note downgraded to a plain comment
  recording the contract's confirmation, keeping the warning against reinstating
  the omit-pattern.
- `SCALARS` regains `tax` / `tax_type` so payload and confirm dialog stay in step.

### Unit 3 — Error attribution

`helpers.ts`:

- New `mapServerErrors(res)` — maps `detailed_error[].code` onto form fields,
  reducing dotted array codes to their base field (`category_id.0` →
  `category_id`); matches the four codeless service-assert failures on a stable
  **substring** (the request carries a language header, so exact text is
  brittle). Returns the complete record plus an `attributed` flag.
  - **Allowlist-only**: codes outside `ERROR_CODE_FIELDS` are **dropped, not
    mapped**, and every value is one of our translated constants. No backend text
    is ever rendered — the proxy forwards backend bodies verbatim and a §3.4
    failure carries raw PHP "Undefined array key" text.
- `validate()` takes `isCreate` and adds three **create-only** checks —
  `boutique_id`, non-empty `category_id`, non-empty `description`. Description is
  rich text, so tags/entities are stripped before the blank test.

`ProductEditor.tsx`:

- New `handleSaveRejection(res, fallback)` — maps errors, sets state with a
  **single** `setErrors` call, closes the confirm dialog, logs the raw response to
  Sentry (diagnostics only, never the UI), and shows a translated constant:
  "please fix the highlighted fields" when anything was attributed, else the
  supplied fallback. Nothing is silently swallowed.
- Both save paths now call it instead of joining `detailed_error` messages into a
  thrown `Error`.
- `validate(form, isCreate)` at the call site.

`sections.tsx`:

- Error render sites added: `error` prop on the Boutique select, an error line in
  `CategoriesSection` (which previously did not even receive `errors`), and an
  error line under the description rich-text editor.

### Unit 4 — Descriptors

`sections.tsx`:

- `DescriptorsSection` renders exactly as before — same groups, empty state and
  busy overlay — but every control is permanently non-interactive: the numeric
  input is `disabled readOnly`, the choice chips are `disabled` with no handler,
  independent of edit mode. `patch`/`disabled` are no longer destructured.
- One translated line added explaining the section is a preview and nothing in it
  is saved (review follow-up P-11: silent dead controls read as a bug).
- `Chip.onClick` became optional, documented — a permanently non-interactive chip
  has no handler.

`helpers.ts`:

- Descriptor entry removed from `buildDiff`.
- The payload-omission comment rewritten to record the **product decision**
  (parked feature, endpoint deliberately unused, no read path to prefill from)
  rather than the stale "key/shape is not documented"; `TODO(backend-key)`
  retired.
- `descriptor_values` deliberately **left** on `ProductForm` and in the
  category-prune flow — dead but harmless, and removing it widens the diff for no
  user-visible gain (plan Out of scope).

### Unit 5 — i18n

Seven new keys added to **all three** files before use, per `CLAUDE.md`:
"Boutique is required", "Select at least one category", "Description is
required", "Please check this field", "Check the product images and their
order", "Every color needs at least one image, and every image must be assigned",
"Attributes are not editable yet. This section is a preview and nothing here is
saved." Four existing keys reused rather than duplicated ("Failed to create
product", "Failed to update product", "Please fix the highlighted fields before
saving.", plus the Percent/Flat labels). Parity 1,980 → 1,987.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `.gitignore` — ignore the three contract documents (D-1)
- **Deleted:** `shop-seller-product.md`,
  `shop-seller-product-create-gaps-and-questions.md`,
  `shop-seller-product-create-answers.md`, `docs/product-edit.md`
- `components/SellerDashboard/productEdit/helpers.ts` — units 2, 3, 4, and the
  repointed header comment
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — unit 3
- `components/SellerDashboard/productEdit/sections.tsx` — units 3, 4, and the tax
  inputs (D-3)
- `docs/api-requirements/shop-product-create-backend-followups.md` — §1 resolved
- `public/translations/translations.ar.js` — +7 keys
- `public/translations/translations.tr.js` — +7 keys
- `public/translations/translations.ku.js` — +7 keys

Moved but **untracked/ignored** (deliberately absent from any commit):
`docs/api-requirements/shop-product-body-contract.md`,
`shop-product-body-payloads.txt`, `seller-product-body-alignment-roadmap.md`.

Every file above is on `plan.md`'s "Files to change" list except `.gitignore`
(D-1). No unrelated file was touched (IM-4). `utils/fetchData.ts` was **not**
modified, as the revised plan requires.

## Deviations from plan

- **D-1 — The three contract documents are gitignored, not tracked. Owner-directed.**
  The plan said move + `git add -N`, so the single publishable commit at
  `/publish-pr` would track them. During Step 1 validation the repository was
  found to be **PUBLIC** (`gh repo view` → `isPrivate: false`,
  `github.com/AlaaAsaad57998/Trydos`), which falsifies the assumption recorded in
  `review.md` and made the review's binding follow-up 2 fail. The contract
  enumerates unpatched backend vulnerabilities — boutique IDOR, client-controllable
  `id` on create, no barcode uniqueness on update, approval-queue bypass — with
  exact backend `file:line` citations; committing it would publish a working
  exploitation guide for a live system. `/implement` was blocked and the owner
  directed gitignoring instead. Verified with `git check-ignore`: none of the
  three appears in `git status`. Note `git clean -fd` skips ignored files, but
  `-fdx` does not — the out-of-repo backup remains the real safety net.
  **Consequence: AC-1 is not met as written** (the documents are not under version
  control). The risk it targeted — loss by `git clean` — is reduced, not removed.
- **D-2 — The four superseded documents were deleted, but their surviving content
  now lives OUTSIDE version control.** The plan assumed orphans would migrate into
  a contract that would then be committed; after D-1 the contract is gitignored.
  The owner directed the deletion anyway on resume. **Consequence, stated plainly:
  this repository no longer contains any seller-product API documentation.** §5 of
  the ignored contract holds it, plus the out-of-repo backup and git history. A
  new engineer cloning this repo will find no product API docs and only the
  `helpers.ts` header comment telling them whom to ask. **AC-2 is met in substance
  (nothing was lost, nothing merged that the contract already covered); AC-1 is
  not** — the replacement is not under version control.
- **D-3 — The Tax inputs were re-enabled in `sections.tsx`.** Not spelled out in
  the plan, but `sections.tsx` is on the file list and this is required for AC-6
  to be observable: the inputs were hardcoded `disabled` with a "Temporarily
  read-only" hint, locked pending the very backend fix contract §1b disproves.
  Sending the keys while leaving the inputs frozen would have been pointless. The
  now-unused "Temporarily read-only" key was left in the translation files.
- **D-4 — `Chip.onClick` became optional** (`sections.tsx`), to type the
  permanently non-interactive Attributes chips. Required by typecheck; widens a
  shared prop type by one optional marker.
- **D-6 — `spec.md` FR-1/AC-1 amended, and a new constraint C-8 added, during
  this command.** Owner-directed after `/verify` FAILED on AC-1. FR-1 and AC-1
  previously required the contract documents to be **under version control**; they
  now require them to be **preserved, protected from loss, and deliberately
  excluded** from the repository — evidenced by the ignore rule, their absence
  from any stageable change, and the out-of-repo copy. C-8 records the governing
  fact: **this repository is public**, so nothing describing an unpatched backend
  defect and no backend source-line citation may be committed. Editing `spec.md`
  is outside `/implement`'s normal write boundary (GU-3 confines it to the planned
  files plus `implement.md`); it is recorded here rather than done silently. The
  amendment narrows what AC-1 claims — it does not assert anything untrue, and the
  residual risk is stated in FR-1 itself (`git clean -fd` skips ignored files,
  `-fdx` does not).
- **D-7 — The nine behavioural criteria are deferred, not executed.** Owner
  decision after `/verify` recorded them as NOT VERIFIED. They will be recorded at
  the next `/verify` as **verified by code inspection**, explicitly not as executed
  runtime observations. **Accepted risk, stated plainly:** no save round-trip, no
  422, and no descriptor interaction has been observed against a live backend.
  That includes **AC-3, the translation-identity fix — the data-corruption defect
  this ticket exists to fix.** If `custom_data[i][id]` is wrong in some way static
  reading cannot reveal, this ships unnoticed.
- **D-5 — `validate()` signature changed** to `validate(form, isCreate = false)`.
  Implied by the plan's create-only scoping but not stated as a signature change.
  Defaulted to `false` so no other caller changes behaviour.

## Blocking issue — RESOLVED on resume

The initial pass blocked here: deleting the four superseded documents would have
destroyed knowledge, because the plan assumed their orphaned content would migrate
into a contract that would then be committed — and after D-1 the contract is
gitignored.

**Resolved by owner direction ("resume, remove superseded docs").** The block is
cleared by ordering, not by dismissing the concern: the orphan content was
migrated into the contract's new §5 **before** any deletion, and the out-of-repo
backup was refreshed afterwards so it includes §5. Nothing identified by the audit
was lost.

What the audit found worth preserving, and where it now lives (contract §5.1–5.9):
the change-status endpoint with its five activation-blocker strings; the entire
`GET /edit` response shape including request↔response name mismatches; the media
upload service paths; the descriptor sync payload; the lookups endpoints and their
permission gates; and headers/permissions/envelope semantics.

**Residual risk, accepted and recorded (see D-2):** the repository itself now has
no seller-product API documentation. The knowledge is intact but lives in an
ignored file, an out-of-repo backup, and git history. If the ignored file is lost
from this machine, recovery is from git history for the four originals — the §5
consolidation exists nowhere in version control.

**Two items the audit flagged as unverified are carried into contract §5.9** and
must not be treated as fact: the `'liter'` weight-rule literal (the old doc and
the contract disagree about the same code) and a possible create-side
variant-price percentage bound.

**Plan revision required: no longer.** `/plan` is in any case unreachable from
`implementation-in-progress` — the state machine allows only `implemented` or
`closed` from here.

## Validation run during implementation

Profile `standard-frontend` (VP-1), plus the extra checks the review made binding.

- `pnpm exec tsc --noEmit` — **PASS** (exit 0). One error surfaced and was fixed
  during implementation (`Chip.onClick` required; see D-4).
- `pnpm lint` — **PASS** (exit 0). 34 warnings, all pre-existing
  `import/no-anonymous-default-export` and unused-eslint-disable directives on
  lines this ticket did not touch; 0 errors.
- `node scripts/i18n-parity.mjs` — **PASS**: "i18n parity OK — 1987 keys present
  in all three files" (1,980 baseline + 7).
- `pnpm build` — **PASS** (exit 0). Run per review follow-up 1, which requires a
  production build recorded against **AC-19** because `standard-frontend` does not
  include one.
- `git check-ignore -v` on the three moved documents — all three matched by
  `.gitignore`; `git status` confirms none is stageable (D-1 evidence).

**Re-run after the resume pass (deletions + migration + repointed comment):**

- `pnpm exec tsc --noEmit` — **PASS** (exit 0)
- `pnpm lint` — **PASS** (exit 0; same 34 pre-existing warnings, 0 errors)
- `node scripts/i18n-parity.mjs` — **PASS** ("1987 keys present in all three files")
- `pnpm build` — **PASS** (exit 0) — recorded against **AC-19**
- Dangling-reference sweep for the four deleted filenames across `*.md`, `*.ts`,
  `*.tsx`, `*.json`: one live hit in tracked source (`helpers.ts` header comment,
  now repointed). Remaining hits are in ignored files (the contract's own §5
  provenance note and the roadmap's retirement list) and one historical "Re:"
  provenance line in the backend follow-ups doc, left as-is — it records where
  those follow-ups came from rather than pointing somewhere to read.

**Not yet run — manual verification.** Every behavioural criterion (AC-3..AC-6,
AC-9..AC-14, AC-17) requires round-trips in the seller dashboard against a real
backend and is deferred to `/verify`. Nothing behavioural has been observed yet;
the checks above prove only that the code compiles, lints, builds and keeps
translation parity.
