---
ticket: seller-product-editor-contract-alignment
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Plan — seller-product-editor-contract-alignment

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 2** (2026-07-20) — rewritten to address the `CHANGES_REQUESTED`
follow-ups in `review.md`. What changed and why is summarised at the end under
*Revision log*.

## Approach

Five units in dependency order: preserve and commit the contract, correct the
body builder, attribute rejections to fields, freeze descriptors, add
translations. Each unit is small and separately observable. Nothing is refactored
that the contract does not require.

The one significant correction from revision 1: **there is no transport problem.**
`fetchData` catches its own `!res.ok` throw and returns
`{ ...(responseData || {}), success: false }`, so `detailed_error` already
reaches the editor — the existing branches read it today. The defect is purely at
the read site, which collapses the array to `.map(d => d.message).join(" • ")` and
throws away every `code`. Unit 3 is therefore confined to the product form.
`utils/fetchData.ts` is **not** touched, and the ticket has no app-wide blast
radius.

Two remaining decisions:

1. **Attribution is allowlist-only.** Field errors come from
   `detailed_error[].code`; the four known service-assert failures are matched by
   a stable substring of their message. Nothing else from the response is
   rendered. Backend `message` text is never shown in a field or as the general
   fallback — the proxy forwards backend bodies verbatim at any status, so that
   text can carry stack frames or hostnames. The fallback is a translated
   constant.
2. **Descriptors are frozen at the input with a visible affordance.** The section
   keeps its current structure; the controls stop accepting input *and* say so in
   one translated line. A control that silently ignores clicks reads as a bug
   (`spec.md` NFR-6).

The contract is authoritative wherever a code comment or tracked doc disagrees
(`spec.md` C-7); stale sources are corrected in the same pass.

## Steps

**Unit 1 — Contract truth-base (AC-1, AC-2, AC-2b)**

1. **Before anything else,** copy `Untitled-1.md`,
   `product-body-payloads.txt` and `seller-product-body-alignment-roadmap.md` to
   a location outside the repository. They are untracked; until they are staged,
   no git operation can recover them (see Rollback).
2. Move them to `docs/api-requirements/shop-product-body-contract.md`,
   `docs/api-requirements/shop-product-body-payloads.txt` and
   `docs/api-requirements/seller-product-body-alignment-roadmap.md`. Add a short
   header to the contract naming its companion file and recording the §5c
   deferrals (approval flag, `countries_iso`, descriptors).
3. `git add -N` (intent-to-add) all three so they appear in `git status` as
   tracked-pending and cannot be silently lost to `git clean`. **They are not
   committed here:** `/implement` creates no commit (IM-9); the commit happens at
   `/publish-pr` (PB-8). AC-1's evidence is that staged state, not the move.
4. Read all four superseded docs in full. Record a **per-document orphan list**
   in `implement.md` — every claim appearing nowhere in the contract or payloads
   file — and append those claims to the contract under "Migrated from superseded
   docs". Skim for credentials while reading; none are expected, but the content
   is being carried forward. **Record the list before step 5.**
5. Delete `shop-seller-product.md`,
   `shop-seller-product-create-gaps-and-questions.md`,
   `shop-seller-product-create-answers.md`, `docs/product-edit.md`. No tombstones.
   These are tracked, so they remain recoverable from history.
6. Mark the §1 tax blocker in
   `docs/api-requirements/shop-product-create-backend-followups.md` resolved,
   citing contract §1b (only `tax_type == 'flat'` currency-converts).

**Unit 2 — Body-builder correctness (AC-3..AC-7, AC-17)**

7. Add an optional `id` to the `Translation` type and carry `t.id` through
   `buildFormFromEdit`'s translation mapping, which currently discards it.
8. In `buildUpdateFormData`, append `custom_data[i][id]` **only when the entry has
   one** — create has none and must not invent one (E-2); an edit response missing
   an id for one entry must not affect the others (E-1).
9. Make `luck_price` unconditional, sending `"0"` when empty, matching the
   adjacent price fields.
10. Send `packed_after_ordering` as the literal `'on'` when enabled and the empty
    string `''` when disabled — **the key is always appended** (NFR-2). Contract
    §1c: the update DTO tests `isset` + `=== 'on'`, so any non-`'on'` value stores
    `0`, and the key must still be present. Comment that this fixes update only;
    create is impossible to enable server-side (AC-16).
11. Restore `tax` and `tax_type`, constraining `tax_type` to exactly `'flat'` or
    `'percent'`. Delete the stale precedence comment. **In the same edit**, add
    both keys to `SCALARS` — they were removed together with cross-referencing
    comments and must return together, or the confirm dialog and the payload
    diverge.
12. Leave `multiplyQTY` untouched; downgrade its risk note to a plain comment
    recording the contract's confirmation, keeping the warning against
    reinstating the omit-pattern.

**Unit 3 — Error attribution (AC-8..AC-12)**

13. Add a pure helper in `helpers.ts` mapping a response body to the editor's
    `Record<string, string>` error shape: each `detailed_error[].code` to its
    field key, reducing dotted array codes to their base field
    (`category_id.0` → `category_id`, `labels.1` → `labels`); the four
    service-assert failures matched by a stable substring onto `images` /
    `colorImages`. It returns a **complete record** plus a flag for whether
    anything was attributed. No backend `message` text is ever placed in the
    record.
14. In `ProductEditor`'s save handler, feed the already-available response body
    through that helper and call `setErrors` **exactly once** with the complete
    record, matching the existing single-call pattern. When nothing was
    attributed, show a translated constant failure message so no rejection is
    silently swallowed (E-4, E-6). Apply to both the create and update paths.
15. Add the three missing checks to `validate()` — `boutique_id`, non-empty
    `category_id`, non-empty `description` — **on the create path only.** The
    backend requires them only at create, and `validate()` is shared with edit
    (C-3), where an existing product may legitimately hold an empty description.
16. Add the missing error render sites: an `error` prop on the Boutique select,
    an error line for categories, and an error line under the description editor.

**Unit 4 — Descriptors (AC-13, AC-14)**

17. Make the descriptor numeric input and choice chips permanently
    non-interactive, independent of `disabled`/`editMode`, and add one translated
    line in the section stating the feature is not yet available. Grouping, empty
    state and busy overlay are unchanged.
18. Remove the descriptor entry from `buildDiff`. Rewrite the payload-omission
    comment to cite the product decision (descriptors are parked; the write
    endpoint exists but is deliberately unused) and retire the
    `TODO(backend-key)`. Leave `descriptor_values` on the form type and its
    category-prune logic in place — dead but harmless, and removing it widens the
    diff for no user-visible gain.

**Unit 5 — i18n (AC-15)**

19. Collect every new English string from steps 14–17: the general failure
    message, the three new validation messages, and the descriptor unavailability
    line. Add each to all three of
    `public/translations/translations.{ar,tr,ku}.js` **before** wrapping it in
    code. Reuse an existing key where the exact English string already exists;
    never invent a synonym. The helper is aliased `tx` in `helpers.ts` and `t` in
    `ProductEditor.tsx`/`sections.tsx`.

## Files to change

- `Untitled-1.md` → **moved** to `docs/api-requirements/shop-product-body-contract.md`
  — gains a companion/deferrals header and the migrated-content section.
- `product-body-payloads.txt` → **moved** to
  `docs/api-requirements/shop-product-body-payloads.txt` — content unchanged.
- `seller-product-body-alignment-roadmap.md` → **moved** to
  `docs/api-requirements/seller-product-body-alignment-roadmap.md` — content unchanged.
- `shop-seller-product.md` — **deleted** (superseded).
- `shop-seller-product-create-gaps-and-questions.md` — **deleted** (superseded).
- `shop-seller-product-create-answers.md` — **deleted** (superseded).
- `docs/product-edit.md` — **deleted** (superseded).
- `docs/api-requirements/shop-product-create-backend-followups.md` — §1 tax
  blocker marked resolved against contract §1b.
- `components/SellerDashboard/productEdit/helpers.ts` — `Translation.id`;
  `buildFormFromEdit` carries the translation id; `buildUpdateFormData` gains
  `custom_data[i][id]`, unconditional `luck_price`, `'on'`/`''` for
  `packed_after_ordering`, `tax`/`tax_type`; stale tax comment deleted;
  `multiplyQTY` note downgraded; `SCALARS` regains `tax`/`tax_type`; `buildDiff`
  loses its descriptor entry; descriptor-omission comment rewritten and TODO
  retired; `validate()` gains three create-only checks; new response-body →
  error-map helper.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — save handler maps
  the response body into `errors` via one `setErrors` call, with a translated
  constant fallback; both create and update paths.
- `components/SellerDashboard/productEdit/sections.tsx` — error props/lines for
  boutique, categories and description; descriptor input and chips made
  permanently non-interactive plus one translated unavailability line.
- `public/translations/translations.ar.js` — new keys.
- `public/translations/translations.tr.js` — new keys.
- `public/translations/translations.ku.js` — new keys.

No file outside this list is modified. **`utils/fetchData.ts` is explicitly not
changed** (revision 2). None of these is a `protected_paths` entry, so no
protected-path exception applies.

## Validation strategy

- Validation profile: `standard-frontend`

Revision 1 used `full-build`, justified solely by the shared-transport change.
That change is gone, no dependency or config is touched, and the remaining edits
are three component files plus translations — so type-safety and lint are the
proportionate gate. A malformed translation file is caught by lint.

Additional checks, run manually and recorded in `verify.md` against their AC:

- `pnpm lint:i18n-parity` for AC-15 (baseline: 1,980 keys in all three files).
- AC-19 — covered by the `standard-frontend` profile's checks.
- Manual round-trips in the seller dashboard, each mapped to its criterion: edit
  a multi-language product and confirm translations stay on their own languages
  (AC-3); toggle packed-after-ordering on an existing product and reload (AC-4);
  clear the luck price and save (AC-5); change tax and read the confirm dialog
  (AC-6); provoke a field-level rejection, a codeless image-assignment rejection,
  and an unattributable one (AC-9, AC-10, AC-11); confirm the general fallback
  still fires when a service-assert substring fails to match (AC-11); submit a
  create form missing boutique / category / description, then confirm an **edit**
  of a product with an empty description still saves (AC-12, E-9); attempt to set
  a descriptor and inspect the confirm dialog (AC-13, AC-14).
- Payload inspection of one create and one update submission for AC-7 and AC-17 —
  compare emitted keys against the contract's key-presence list and against the
  pre-change payload for the already-correct behaviours.
- AC-1 is evidenced by the staged state of the three documents, AC-2 by the
  per-document orphan list recorded in `implement.md`.

## Rollback

**Tracked source changes** (`helpers.ts`, `ProductEditor.tsx`, `sections.tsx`,
the three translation files, the follow-ups doc) and the **four deletions** are
uncommitted working-tree edits on `ticket/seller-product-editor-contract-alignment`
until `/publish-pr`. `git restore` reverts them; the deleted docs are tracked and
recoverable from history regardless.

**The three moved documents are NOT covered by that.** They are untracked, so
`git restore` will not restore them and `git clean -fd` would delete them at
their new path. This is why step 1 takes an out-of-repo copy before anything
else, and step 3 marks them intent-to-add. Recovery is from that copy, not from git.

Per unit after merge: units 2, 3 and 4 all edit `helpers.ts`, so they are
revertable **per hunk**, not per file — the hunks are disjoint and independently
revertable, but they are not separate files. Unit 1 is documentation only and
reverts independently.

## Out of scope

- Any backend change, including the create-path `packed_after_ordering` defect
  (AC-16 records it) and the client-controllable `id` the contract flags.
- **The backend security defects the contract documents** — boutique IDOR,
  client-controllable `id`, barcode uniqueness bypass on update, approval-queue
  bypass via `seller_product_id`. Raised separately per `review.md` follow-up 8;
  C-1 keeps them out of this ticket.
- All approval-aware behaviour: `request_status`, `is_new_products_approval`, the
  applied-now vs queued distinction. `approvalNote` and the pending pill are
  untouched.
- Any change to `utils/fetchData.ts` or shared transport.
- Wiring the descriptor write endpoint or any descriptor read/prefill path.
- Per-variant `location_id_<k>` / `odoo_id_<k>`.
- The Excel bulk-import path, the gallery tab, and the status-change endpoint.
- The same read-site defect in `BoutiqueEditor.tsx` — not touched here.
- Removing `descriptor_values` from the form type or its prune logic.
- Automated tests.

## Revision log

Addressing `review.md` → Required Follow-up Actions:

| # | Follow-up | How this revision addresses it |
|---|---|---|
| 1 | Drop step 11 / `utils/fetchData.ts` | Removed from Steps, Files to change and Approach; added to Out of scope. Unit 3 is now form-local. (P-1) |
| 2 | Correct the upstream artifacts carrying the false premise | **Not addressed here — outside this command's write boundary.** `/plan` may write only `plan.md` + `ticket.md` (GU-3). `research.md` R1/Q-A and `spec.md` FR-8/NFR-3/AC-8/AC-18 still encode the disproven premise and **must be corrected before re-review**, or `spec.md` will hold criteria policing a change this plan no longer makes. Flagged to the owner. |
| 3 | Reconsider the validation profile | Dropped `full-build` → `standard-frontend`, with the reasoning stated. (P-1, P-13) |
| 4 | Restate Unit 1 honestly | Steps 2-3 now say the documents are staged intent-to-add and committed at `/publish-pr`, not `/implement`; AC-1's evidence restated. (P-2) |
| 5 | Fix the rollback section | Rewritten: untracked moves are explicitly excluded from `git restore`; step 1 takes an out-of-repo copy first. (P-3) |
| 6 | Scope the three checks to create | Step 15 is create-only, with the reason; validation adds an edit-path regression check. (P-4) |
| 7 | Fold in the minors | Off-value named as `''` with citation (P-7); substring matching (P-8); "five units" and per-hunk revert wording (P-9); orphan list recorded before deletion (P-10); descriptor affordance + translated line (P-11); allowlist-only attribution, translated constant fallback (P-6); single `setErrors` (P-16); credential skim (P-14); AC-19 named (P-13). |
| 8 | Backend security defects raised separately | Added to Out of scope with the pointer; not absorbed into AC-16. (P-5) |
| 9 | Confirm the repo is private | Owner action, recorded in `review.md` Assumptions; no plan step. (P-5) |
