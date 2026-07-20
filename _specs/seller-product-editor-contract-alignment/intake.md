---
ticket: seller-product-editor-contract-alignment
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Intake — seller-product-editor-contract-alignment

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`seller-product-editor-contract-alignment`. No ClickUp task and no GitHub issue —
this ticket originates from the working-tree roadmap
`seller-product-body-alignment-roadmap.md` (written 2026-07-20, verified against
commit `21071fe0` on `develop`).

**Source of truth for this ticket:** `seller-product-body-alignment-roadmap.md`
and the two contract files it cites (`Untitled-1.md`,
`product-body-payloads.txt`). Where any older document
(`shop-seller-product.md`, `shop-seller-product-create-gaps-and-questions.md`,
`shop-seller-product-create-answers.md`, `docs/product-edit.md`) conflicts with
these, the roadmap and contract win and the older document is treated as
superseded — it is not reconciled, it is retired.

## Ticket Summary

The seller-dashboard product add/edit flow (`ProductEditor.tsx` + `helpers.ts`)
sends a request body that diverges from the newly received, code-verified backend
contract for `POST /shop/products` and `POST /shop/products/{id}/update`. The
divergences cause silent data loss on every edit (translation rows written
against `id = null`), an inert toggle, a save-blocking 422 for some sellers, and
error responses that cannot be attributed to a field. This ticket brings the
whole editor into line with the contract in one pass: it covers **roadmap phases
P1–P4**, consolidated by owner decision into a single ticket. (Scope was
originally P1–P5; **P5 was removed after research** — see the P5 heading below
and `research.md` Q-E.)

## Ticket Metadata

- id / slug: `seller-product-editor-contract-alignment`
- title: Align the seller ProductEditor add/edit flow with the verified backend body contract
- owner: developer
- created: 2026-07-20
- links: (none — roadmap-originated)

## Scope — consolidated from roadmap phases P1–P5

Consolidation decision taken at intake (2026-07-20): the roadmap proposes five
separate tickets; the owner elected **one combined ticket covering all of them**,
with P1 folded in as the first unit of work rather than run as a preceding
ticket. The five phases survive as the internal work-breakdown below and must
each be traceable through `spec.md` and `verify.md`.

### P1 — Contract truth-base (docs only, no code)

- Track `Untitled-1.md` and `product-body-payloads.txt` as a single canonical
  contract doc. They are **untracked working-tree files today and destroyable by
  a `git clean`** — this is the most urgent item in the ticket.
- Retire the four superseded docs (roadmap §7), after confirming no unique
  backend Q&A in `shop-seller-product-create-answers.md` is missing from the new
  contract.
- Record the §5c deferrals (approval flag, `countries_iso`, descriptors) beside
  the contract so the accepted defects stay discoverable.

### P2 — Body-builder correctness (G1, G2, G3, C1, C2)

- **G1** — `custom_data[i][id]` is never sent, so every edit writes translation
  rows against `id = null`. Carry `id` through `Translation` →
  `buildFormFromEdit` → the builder. Frontend-only (Q5).
- **G2** — `packed_after_ordering` sends `"true"`/`"false"` but the DTO enables
  the flag only on the literal `'on'`. Send `'on'`; this fixes **update only**.
  The create path stays broken pending a backend fix and must be recorded as
  such, not disguised as fixed.
- **G3** — `luck_price` is conditionally omitted; it is key-required on update
  for sellers with `is_new_products_approval = 1`. Always send the key.
- **C1** — restore `tax` / `tax_type` (send `tax_type` as exactly `'flat'` or
  `'percent'`); delete the stale precedence comment.
- **C2** — **no change** to `multiplyQTY`; the contract confirms the current
  `"true"`/`"false"` encoding. Downgrade the risk note to a plain comment.

### P3 — 422 → field mapping (G4, G7)

- **G4** — map `detailed_error[].code` onto the existing `errors` form state,
  including dotted array indices; match the four codeless service-assert messages
  by text; stop showing raw backend text to the seller.
- **G7** — add the three missing client-side checks: `boutique_id`,
  `category_id[]`, `description`.

### P4 — Descriptors: disable the section (G5, parked)

- Render `DescriptorsSection` **disabled** with copy explaining the feature is
  not yet available. The write endpoint is deliberately **not** wired.
- Keep `descriptor_values` out of the payload, but **also remove it from the save
  diff** — it currently appears in the confirm dialog, telling the seller their
  descriptor edits are about to be saved when they never are.
- Retire the `TODO(backend-key)`; the key is known, the work is parked.

### P5 — Pending-changes UX (G6) — **REMOVED FROM SCOPE (2026-07-20)**

Dropped in full by owner decision after research (see `research.md` Q-E):
**`request_status` and `is_new_products_approval` are both ignored.** With no
usable signal left, there is nothing to predict, so the phase has no content.

**Consequence — a larger accepted defect than this intake first recorded:** G6
stays open *entirely*, not partially. A seller still edits a price, sees
"saved", and nothing changes, with no indication of which edits applied, which
were queued, and which were discarded. `approvalNote`
(`ProductEditor.tsx:125`, :479, :655-663) and the `request_status === 0` pill
(:585-589) are left exactly as they are — neither improved nor regressed.

**This ticket's scope is therefore P1 + P2 + P3 + P4.** Nothing in `spec.md` or
`verify.md` may assert that any part of G6 is closed.

### Cross-cutting — i18n (mandatory)

Every new user-visible string in P3, P4 and P5 must have its English key added to
all three of `public/translations/translations.{ar,tr,ku}.js` **before** it is
wrapped, per `CLAUDE.md`. `validate()` already routes through `tx(...)`.

## Explicitly out of scope

Carried from roadmap §8, plus the consolidation decision:

- Any backend change. Where the fix is backend-only (G2 on create), this ticket
  records it and stops.
- The Excel bulk-import path (`ExcelUploadTab.tsx`).
- The product image **gallery** tab — the editor's inline upload path is in
  scope only insofar as it feeds `images[]`.
- `POST /shop/products/{id}/change-status` — a separate endpoint.
- Wiring `POST /shop/products/{id}/descriptors` (G5 is parked, not fixed).
- Per-variant `location_id_<k>` / `odoo_id_<k>` (G8, closed WONTFIX — optional,
  and `odoo_id` matters only for odoo-synced products, which ours are not).
- Adding automated tests. Repo policy (`CLAUDE.md`): there is no test suite.
  Verification is manual and defined per acceptance criterion at `/spec`.

## Do NOT regress (roadmap §2 — verified already correct)

`colors[]` as codes / `sizes[]` as names; the variant-key construction; `images[]`
as stored filenames byte-identical to `sync_color_images`; never sending `id` on
create; omitting `custom_data[i][similar_words]`; never sending `status` /
`request_status` / `user_id`; the client-side `weight` requirement for `pc`/`l`
units; and key-presence discipline for `label`, `model_number`,
`report_ref_number`.

## Decisions Already Taken

Settled at intake — sourced, not to be relitigated downstream.

| # | Decision | Source |
|---|---|---|
| Q1 | No tax precedence bug. Only `tax_type == 'flat'` currency-converts; anything else is percent. Send both keys. | roadmap §5a, contract §1b |
| Q2 | `multiplyQTY` accepts `1/0/true/false/"1"/"0"` via `FILTER_VALIDATE_BOOL`. Current encoding is correct — **no change**. | roadmap §5a, contract §1c |
| Q3 | `packed_after_ordering` is fixable frontend-only on **update** (`'on'`). **Create is impossible to enable** and needs a BE fix. | roadmap §5a, contract §1c/§4 |
| Q5 | `custom_data[i][id]` **is** available in the edit response and must be echoed back. G1 is frontend-only. | roadmap §5a, contract §1h/§4 |
| Q8 | Per-variant `location_id_<k>` / `odoo_id_<k>` — **WONTFIX**, optional and odoo-only. | roadmap §5a, contract §1f |
| §5c | `is_new_products_approval` exposure **deferred** → the unapproved-seller half of P5 is descoped and remains an accepted UX defect. | roadmap §5c |
| §5c | `countries_iso[]` exists-rule — **closed, no action**; invalid ISOs are unreachable through our form. | roadmap §5c |
| §5c | Descriptors — **parked as an inert section**; the write endpoint stays unused. Supersedes any earlier plan to wire it. | roadmap §5c |
| intake | Older docs that conflict with the roadmap/contract are **superseded, not reconciled**. | this ticket's instruction |
| intake | All five phases run as **one ticket**, P1 folded in as the first unit of work. | owner, 2026-07-20 |
| Q-A | `detailed_error` is preserved by **attaching the parsed response body to the thrown `Error`** in `utils/fetchData.ts` — shared transport, so the throw/message/timing must stay identical for every other caller. | owner, post-research 2026-07-20 |
| Q-B | `tax`/`tax_type` are **restored with no runtime confirmation** — the contract is trusted outright. Superseded by the standing rule below: this is no longer an accepted risk but a settled requirement. | owner, post-research 2026-07-20 |
| **standing** | **The contract is always authoritative.** Where it disagrees with any tracked doc, code comment, or earlier artifact, the contract wins and the other side is stale — never a reason to hedge or defer, always a reason to correct the stale source. Conflicting entries in *retained* docs are fixed, not left. | owner, 2026-07-20 |
| Q-C/D | Descriptors **render exactly as today but are never settable and never sent**; removed from the save diff. | owner, post-research 2026-07-20 |
| Q-E | `request_status` and `is_new_products_approval` are **ignored** → **P5 dropped in full**; G6 stays entirely open. | owner, post-research 2026-07-20 |
| Q-F | The four superseded docs are **replaced** by the new contract; only content appearing nowhere in `Untitled-1.md` / `product-body-payloads.txt` is migrated first. No tombstones. | owner, post-research 2026-07-20 |

## User Story

> As a **seller using the dashboard product add/edit form**, I want **every field
> I fill in to be sent to the backend in the shape it actually expects, and every
> rejection to land on the input that caused it**, so that **my edits are saved
> as entered, I am never told something was saved when it was silently discarded
> or queued, and I can fix a rejected form without deciphering raw server text.**

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: The roadmap supplies a per-phase **Exit** condition for each of P1–P5,
  which is strong raw material, but they are prose outcomes rather than
  stable-ID acceptance criteria. Authoring `AC-n` (one set spanning all five
  phases, each mapping to a requirement per SP-3/TR-1) is `/spec`'s job. No
  acceptance criteria are written here.

## Test Cases Presence Check

- Present? **no**
- Notes: The repo has no test suite and this ticket adds none (`CLAUDE.md`
  policy, roadmap §8). Verification will be **manual** — round-trip an edit, save
  with a cleared luck price, trigger each documented 422, inspect the save diff —
  and each procedure is defined against its `AC-n` at `/spec`.

## Missing Information

Nothing blocking. All eight roadmap intake questions are resolved — five answered
from the contract (§5a), three closed by owner decision (§5c). Recorded as known
gaps rather than blockers:

- `is_new_products_approval` is not exposed to the frontend. Consequence is
  already absorbed: the unapproved-seller half of P5 is descoped and the UX
  defect is accepted.
- The create-path `packed_after_ordering` fix is not achievable from the
  frontend; it needs a backend change that is not part of this ticket.
- Whether any backend Q&A unique to `shop-seller-product-create-answers.md` is
  absent from the new contract must be confirmed during P1 **before** that file
  is deleted. This is a check inside the work, not a precondition on it.

## Readiness Status

`READY`

- Justification: the request is qualified, its source of truth is named and its
  precedence over older docs is settled, scope and out-of-scope are explicit, a
  user story exists, and every open question from the roadmap is answered or
  deliberately closed with its consequence recorded. Acceptance criteria and test
  cases are legitimately absent — they belong to `/spec`, not intake. No external
  answer is being waited on, so nothing prevents `/research` from starting.
