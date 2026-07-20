---
ticket: seller-product-editor-contract-alignment
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-07-20
links:
  clickup:
  github:
---

# Research — seller-product-editor-contract-alignment

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Bring the seller-dashboard product add/edit flow (`ProductEditor` + `helpers.ts`)
into line with the code-verified backend body contract, covering roadmap phases
**P1–P4** in one ticket: track the contract and retire the superseded docs, fix
the body builder's data-loss defects, map 422s back to form fields, and make the
descriptors section honestly non-settable.

**P5 (approval-aware UX) is out of scope** — dropped by owner decision on
2026-07-20 (see Q-E). G6 therefore remains fully open.

## Relevant directories

- `components/SellerDashboard/productEdit/` — the entire editor. Four files,
  3,044 lines total: `helpers.ts` (930 — types, `buildFormFromEdit`, `validate`,
  `buildUpdateFormData`, `SCALARS`, `buildDiff`), `ProductEditor.tsx` (882 — the
  single orchestrator for **both** create and edit), `sections.tsx` (1,039 — the
  11 form sections plus the shared `Txt`/`Num`/`Area`/`Select`/`Chip`/`Toggle`
  inputs), `GalleryPickerModal.tsx` (193). Every phase of this ticket writes here.
- `services/sellerDashboard/` — `index.ts` (1,027 lines) holds the five product
  endpoints the editor calls. Read-only for this ticket unless the 422 decision
  below lands here.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/` — the
  two mount points: `[productId]/page.tsx` (mounts at :31, default `mode="edit"`)
  and `new/page.tsx` (mounts at :30, `mode="create"`). Both routes exercise the
  same component, which is why a single builder defect hits both flows.
- `public/translations/` — the three non-source-language files. Mandatory for
  every new user-visible string in P3/P4/P5.
- `utils/` — `functions.ts` supplies `translateFunction`; **`fetchData.ts` is the
  transport for every client call** and is directly implicated in G4 (see Risks).
- `_specs/seller-product-create-validation-fields/` — the immediately prior,
  closed ticket over the same files (PR #75). Its `implement.md`/`verify.md`
  record what is already shipped and must not be regressed.
- `docs/api-requirements/` — outbound backend follow-ups; a separate artifact
  from the contract, explicitly not retired by this ticket.

## Relevant config files

- `.claude/project-config.yaml` — read only to understand `protected_paths`,
  `validation_checks` and `validation_profiles`. **Not modified.** None of this
  ticket's target files are protected paths: the list is `proxy.ts`,
  `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`, `services/auth.ts`,
  `services/cart.ts`, `services/order.ts`, `services/orders.ts`,
  `store/index.ts`, `next.config.ts`. `components/SellerDashboard/**`,
  `services/sellerDashboard/**` and `utils/fetchData.ts` are all **unprotected**
  — so no GU-2/IM-5 approval is required, but see the blast-radius risk on
  `fetchData.ts`.
- `package.json` — script definitions. Note there is **no `typecheck` script**;
  typechecking is `pnpm exec tsc --noEmit` directly (the prior ticket did the
  same).
- `scripts/i18n-parity.mjs` — the parity checker behind `pnpm lint:i18n-parity`.
- `eslint.config.mjs` / repo ESLint config — carries the i18n rules that error on
  translate keys missing from `ar`/`tr`/`ku`.
- `tsconfig.json` — path aliases (`components/*`, `services/*`, `utils/...`).
- `CLAUDE.md` + `.github/copilot-instructions.md` — the mandatory i18n workflow
  and the no-test-suite policy that shape this ticket's verification.

### The contract itself (not code config, but the ticket's source of truth)

- `Untitled-1.md` (28,222 B, 275 lines) — **UNTRACKED**. The field-by-field body
  contract; §1 field tables, §2 create-vs-update differences, §3 the 422 error
  keys, §4 UNKNOWNs.
- `product-body-payloads.txt` (14,772 B, 256 lines) — **UNTRACKED**. Full dummy
  create and update bodies.
- `seller-product-body-alignment-roadmap.md` — **UNTRACKED**. The roadmap this
  ticket implements. *The roadmap flags the two contract files as at-risk but
  does not flag itself; it is equally destroyable.*
- Superseded and **tracked** (so deleting them is a real, reviewable diff):
  `shop-seller-product.md` (313 lines), `shop-seller-product-create-gaps-and-questions.md`
  (150), `shop-seller-product-create-answers.md` (369), `docs/product-edit.md` (271).
- Untouched: `product-edit-json.json` (1,063,760 B — a captured response for
  product 228, kept as evidence) and
  `docs/api-requirements/shop-product-create-backend-followups.md` (dated
  2026-07-16; its §1 BLOCKER is the `tax`/`tax_type` question that contract §1b
  now answers — worth reconciling, not deleting).

## Possibly affected services

- **`SellerDashboardService`** (`services/sellerDashboard/index.ts`) — the direct
  dependency. `addProduct` (:874) and `updateProduct` (:813) both post the
  FormData with `noMessage: true` and **return the raw `fetchData` promise with no
  `success` check and no throw** — they are pass-throughs, leaving the caller to
  interpret the envelope. `getProductForEdit` (:793), `getProductCreateForm`
  (:833) and `getCategoryLookups` (:851) all throw on `!res.success`.
  `getCategoryLookups` is the only one that does not return the envelope — it
  normalises to `{sub_categories, sub_sub_categories, descriptor_groups}` (:862-867).
  No descriptor **write** method exists anywhere in the file (the only two
  `/descriptor/i` hits are :849 and :866, both lookup plumbing) — consistent with
  G5 being parked.
- **`utils/fetchData.ts`** — shared by the whole client app. Implicated in G4;
  changing it is the highest-blast-radius option this ticket could take. See Risks.
- **The backend shop-product endpoints** — behaviourally affected by what we now
  start sending (`custom_data[i][id]`, `tax`/`tax_type`, `packed_after_ordering`,
  always-present `luck_price`). No backend change is in scope.
- **Not affected / explicitly out of scope:** `ExcelUploadTab.tsx` (bulk import),
  the gallery tab, and `changeProductStatus` (:890).
- **Sibling at risk of nothing, but sharing the defect:**
  `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` (:417, :439, :457,
  :509) uses the identical unreachable-`detailed_error` pattern. Out of scope
  here, but it means any transport-level fix would benefit it too.

## Test / validation commands available

Listed, **not run** (this command is read-only). There is no test suite and this
ticket adds none.

- `pnpm exec tsc --noEmit` — TypeScript compiles clean. The `typecheck` check-id
  in `project-config.yaml` maps to exactly this; there is no `package.json` script.
- `pnpm lint` (`eslint .`) — includes the i18n rules that **error** on a
  `translateFunction` key missing from `ar`/`tr`/`ku`.
- `pnpm lint:i18n-parity` (`node scripts/i18n-parity.mjs`) — key-parity across the
  three files. Baseline at research time: **1,980 keys present in all three**,
  exit 0.
- `pnpm build` (`next build`) — production build; the `full-build` profile's third
  check. Relevant because this repo has a history of build-only failures that
  typecheck does not catch.
- `pnpm knip` — unused files/exports; useful after P4 removes descriptor payload
  and diff code.
- **Manual verification** is the primary method and must be defined per `AC-n` at
  `/spec`: an edit round-trip preserving translations, saving with a cleared luck
  price, toggling packed-after-ordering on update, provoking each documented 422,
  and reading the save-confirmation diff.

## Risks and unknowns

- **R1 — RETRACTED (2026-07-20). This finding was wrong.** It claimed
  `detailed_error` never reaches `ProductEditor` on a real 422, because
  `utils/fetchData.ts:484-489` throws whenever `!res.ok`. That throw is real, but
  the analysis stopped there. **`fetchData` catches its own throw** at :536 and
  returns `{ ...(responseData || {}), success: false }` at :597 — so the parsed
  body, `detailed_error` included, **does** reach the caller, and the branches at
  `ProductEditor.tsx:446/468/511` are live, not dead.

  Caught by all three review-panel lenses independently and confirmed against
  source before the review decision was recorded. **Consequence:** G4 is a
  read-site defect exactly as the roadmap originally described — the editor
  collapses the array with `.map(d => d.message).join(" • ")` and discards each
  `code`. No transport change is needed and none is made; `utils/fetchData.ts` is
  not in scope. The lesson worth keeping: a `throw` is not an escape until you
  have checked who catches it.
- **R2 — one builder feeds both create and update, so every P2 change is
  double-exposure.** `buildUpdateFormData` (`helpers.ts:653-767`) is the single
  body builder used by both paths (`ProductEditor.tsx:441`). Update requires the
  *presence* of ~12 unvalidated keys (contract §2.2); stripping any key 422s with
  a raw "Undefined array key" message. Verified: every one of those keys is
  appended unconditionally today (`description` :666, `unit` :663, `current_stock`
  :682, `label`/`model_number`/`report_ref_number` :673-675, `barcode` :664,
  `shipping_days` :687, `meta_title` :706, `meta_description` :707,
  `shipping_cost` :686, `unit_price` :678, `discount_price` :679) — **`luck_price`
  (:681, guarded by `if (form.luck_price !== "")`) is the sole key-presence gap**,
  confirming G3 is correctly and completely scoped. Any refactor must not
  introduce a new conditional append.
- **R3 — DOWNGRADED to an implementation note by the standing precedence rule.**
  The code comment at `helpers.ts:688-692` asserts a server operator-precedence
  bug; contract §1b (`DTO:225-228,599-602`) contradicts it — only
  `tax_type == 'flat'` currency-converts. Under the standing rule the contract
  wins outright, so this is no longer a risk to weigh: the stale comment is
  deleted and the follow-up doc's §1 entry is corrected. The one thing that
  remains genuinely load-bearing is **coupling**: `tax`/`tax_type` are also
  absent from `SCALARS` (:791-792) with a comment tying that omission to the
  payload omission, so payload and diff must be changed **together** or the
  confirm dialog and the submission drift apart.
- **R4 — `packed_after_ordering` will be half-fixed by design.** Sending `'on'`
  fixes update only; create remains impossible to enable (contract §4 —
  `nullable|boolean` rejects `'on'` while the DTO requires it). The ticket must
  ship a knowingly asymmetric behaviour and record it in `implement.md` rather
  than present it as fixed. Risk is to honesty of reporting, not to data.
- **R5 — descriptors have no read path at all, which is stronger than the roadmap
  states.** `buildFormFromEdit` hardcodes `descriptor_values: {}` on edit
  (`helpers.ts:531-533`, with a comment saying the edit response returns none) and
  the create default is also `{}` (:287). So the section can only ever show what
  the seller typed in this session, and `buildDiff` (:857-861) reports a
  `"n set" → "m set"` count change — telling the seller a change is about to be
  saved that is never sent (:719-725). Disabling the section is therefore the
  honest option, and there is no prefill to preserve.
- **R6 — G7's three missing checks have no error sinks in the UI.** `validate()`
  (:562-649) writes keyed messages consumed as `errors.<key>` by the sections, but
  only some inputs render them. The Boutique `Select` (`sections.tsx:305`) has
  **no `error` prop**, `CategoriesSection` (:352-404) destructures no `errors` at
  all, and the description `RichTextEditor` (:310-312) has no error slot. Adding
  the three checks therefore also requires adding three render sites — the work is
  slightly larger than "cheap to close" implies.
- **R7 — WITHDRAWN.** Concerned P5's UI rework, which is no longer in scope
  (Q-E). Retained as a stub so the risk numbering stays stable. The finding that
  prompted it still holds if P5 is ever revived: `approvalNote`
  (`ProductEditor.tsx:125`, :479, :655-663) is set **from the save response,
  after the fact**, whereas predicting the split requires data **before** the
  save — the existing boolean is not a starting point.
- **R8 — G6 now stays broken in full, not in half.** The intake anticipated
  closing the queued-vs-applied half and accepting only the unapproved-seller
  half. With P5 dropped (Q-E), **neither half is addressed.** Verification must
  not claim any part of G6 is closed, and the accepted defect is larger than
  `intake.md` originally described.
- **R9 — i18n parity is currently clean and must stay that way.** Baseline 1,980
  keys in all three files. `pnpm lint` errors on a missing key, so any new string
  added to code before its three translations will break the build for everyone.
  Keys must land in all three files first. Note `helpers.ts` aliases the helper as
  `tx` (:14, :18 — because `t` is taken by a local) while `ProductEditor.tsx`
  aliases it as `t` (:6, :49); new copy must use the right alias per file.
- **R10 — deleting four tracked docs is irreversible in the working tree.** P1
  requires confirming nothing unique in `shop-seller-product-create-answers.md`
  (369 lines) is absent from the contract *before* deletion. This is a real
  reading task, not a formality, and the contract's own §4 shows its authors did
  park what they could not prove.
- **R11 — the contract is untracked while this ticket depends on it.** Until P1
  commits it, a `git clean -fd` destroys the source of truth for the other four
  phases *and* the roadmap. This is the single highest-urgency item and argues for
  doing the P1 tracking step first within the implementation.

## Open questions

The eight *intake* questions were already resolved (roadmap §5a/§5c). This
research raised six more; **all six were answered by the owner on 2026-07-20**
and are recorded below as decisions. **No question remains open — nothing blocks
`/spec`.**

### Resolved by owner decision (2026-07-20)

- **Q-A — VOID (2026-07-20). The question was based on a false premise (see the
  retraction at R1) and had no valid answer.** It asked how structured errors
  should be made to survive transport; they already do. The owner's original
  answer (attach the parsed body to the thrown `Error`) was recorded, then
  discarded at the review gate once the premise was disproven — implementing it
  would have modified app-wide transport to no effect. **No transport change is
  in scope.** `BoutiqueEditor.tsx` shares the same read-site defect and is
  likewise fixable without touching transport, but is not in scope here.
- **Q-B — `tax`/`tax_type` → RESOLVED: restore, with no runtime confirmation.**
  Send both keys per contract §1b (`tax_type` as exactly `'flat'` or `'percent'`),
  delete the stale precedence comment at `helpers.ts:688-692`, and restore both to
  `SCALARS` (:791-792) so the diff and the payload stay consistent (R3).
  **Settled by the standing precedence rule (owner, 2026-07-20): the contract is
  always authoritative.** Where it disagrees with any tracked document, code
  comment, or earlier artifact — here,
  `docs/api-requirements/shop-product-create-backend-followups.md` §1, which still
  calls tax handling a BLOCKER — the contract wins and the other side is stale. A
  conflict is never grounds to hedge, defer, or seek runtime confirmation; it is
  grounds to correct the stale source. That §1 entry is therefore **corrected as
  part of this ticket**, not merely noted. R3 below is downgraded accordingly.
- **Q-C / Q-D — descriptors → RESOLVED: render exactly as today, but
  non-settable.** `DescriptorsSection` keeps fetching and rendering its groups and
  descriptors as it does now (`sections.tsx:405-468`) — no collapse to a single
  line, no visual removal. The seller simply **cannot set or edit any value**: the
  numeric inputs (:439-447) and `string_choice` chips (:450-454) are permanently
  non-interactive regardless of `disabled`/`editMode`. `descriptor_values` is
  never sent (`helpers.ts:719-725` keeps omitting it, with the comment rewritten
  to cite the §5c product decision instead of the stale "key/shape is not
  documented" rationale) and must **not** appear in the save diff
  (`helpers.ts:857-861`). Because the value map can now never change from its
  `{}` initial state (:287, :531-533), the diff entry is unreachable dead code
  regardless — remove it. Whether `descriptor_values` also leaves `ProductForm`
  (:201) and the patch flow (`ProductEditor.tsx:339-341`) is left to `/plan` as a
  cleanliness-vs-diff-size judgement; keeping it is dead but harmless.
- **Q-E — approval-aware UX → RESOLVED: dropped. `request_status` and
  `is_new_products_approval` are both ignored.** **P5 is removed from this ticket
  in full.** With both signals out, no usable input remains to predict the
  applied-vs-queued split. **Consequence, recorded so it is not mistaken for
  closed:** G6 stays open *in its entirety* — not the partial state the intake
  described. A seller still edits a price, sees "saved", and nothing changes, with
  no indication of which edits applied, which were queued, and which were
  discarded. The existing `approvalNote` boolean (`ProductEditor.tsx:125`, :479,
  :655-663) and the `request_status === 0` pill (:585-589) are **left exactly as
  they are** — this ticket neither improves nor regresses them.
- **Q-F — superseded docs → RESOLVED: replace, migrating only genuine
  orphans.** The four docs are replaced by the new contract (`Untitled-1.md` +
  `product-body-payloads.txt`). Before deletion, each is read and **only content
  that appears nowhere in the two new files** is carried across into the contract
  doc; everything the contract already covers is dropped, not merged. No
  tombstone files. This makes the `shop-seller-product-create-answers.md` read
  (369 lines) a required, evidenced step of the work, not a formality — R10 stands.

### Consequently revised scope

This ticket is now **P1 + P2 + P3 + P4**. P5 is out. The `/spec` acceptance
criteria must cover those four only, and must **not** assert anything about G6.

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
