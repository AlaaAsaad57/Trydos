---
ticket: seller-product-editor-contract-alignment
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-20
links:
  clickup:
  github:
---

# Verify — seller-product-editor-contract-alignment

> Final validation and impact review before the ticket is closed.

**Outcome: PASSED.** Attempt 2. Attempt 1 (same day) recorded FAILED on AC-1 and
nine unverified criteria; both were resolved by owner decision — AC-1 amended to
match the gitignore decision, and the behavioural checks deferred to
**inspection-only evidence**.

> ### Read this before trusting the table
>
> Nine criteria (**AC-3, AC-4, AC-5, AC-6, AC-9, AC-10, AC-11, AC-12, AC-13**) are
> marked **PASS (inspection)**. That means the code was read and found to do what
> the criterion requires. **It does not mean the behaviour was observed.** No save
> round-trip, no 422, and no descriptor interaction has been exercised against a
> live backend by anyone.
>
> This is a deliberate, recorded owner decision (`implement.md` D-7), not an
> oversight — but it means this document is *not* evidence that the feature works
> at runtime, and should not be cited as such. The residual risk is concentrated
> in **AC-3**, the translation-identity fix that is the reason this ticket exists.

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: `standard-frontend` (resolved → `typecheck`, `lint`; both
  at depth `all-ac`)

Result vocabulary: **PASS (executed)** = a command was run or an artifact
inspected directly · **PASS (inspection)** = code read, runtime behaviour **not**
observed · **n/a** = criterion withdrawn in `spec.md`.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Contract docs excluded by ignore rule, absent from stageable changes, copy held outside the repo *(amended 2026-07-20)* | `git check-ignore -v`; `git status --porcelain`; `ls` on the backup dir | 0 | All three matched at `.gitignore:103-105`; zero occurrences in `git status`; backup dir holds all three plus the pre-migration original | **PASS (executed)** |
| AC-2 | Four superseded docs gone; unique content demonstrably carried across | `git status`; full-read orphan audit; contract §5 | 0 | All four staged `D`. Per-document orphan lists produced from a full read; content appended as contract §5.1–5.9 (275→438 lines) **before** deletion | **PASS (executed)** |
| AC-2b | No retained tracked doc still contradicts the contract | Manual read of `shop-product-create-backend-followups.md` | — | §1 tax blocker marked RESOLVED against contract §1b; original preserved collapsed and marked stale | **PASS (executed)** |
| AC-3 | Translations stay on their own rows after an edit round-trip | *not executed* | — | `Translation.id` added; carried in `buildFormFromEdit`; emitted at `helpers.ts:875` guarded on presence so create invents none | **PASS (inspection)** |
| AC-4 | Packed-after-ordering persists on update and after reload | *not executed* | — | `helpers.ts:816` — `'on'` when enabled, `''` when disabled, key always appended | **PASS (inspection)** |
| AC-5 | Clearing the luck price saves cleanly | *not executed* | — | `helpers.ts:785` unconditional, `""`→`"0"`; `0` is the server default per §1b | **PASS (inspection)** |
| AC-6 | Tax + tax type sent; a changed tax appears in the confirm dialog | *not executed* | — | `helpers.ts:797-798` send both, `tax_type` constrained to `flat`/`percent`; `SCALARS:911-912` restore both to the diff; inputs un-disabled in `sections.tsx` | **PASS (inspection)** |
| AC-7 | multiplyQTY value byte-identical to before | `git diff develop -- helpers.ts \| grep multiplyQTY` | 0 | Only a comment line differs; the emitted value is unchanged | **PASS (executed)** |
| AC-8 | Structured errors used rather than joined into one string | Code inspection of both save paths | — | `.map(d => d.message).join(" • ")` removed from both paths; `mapServerErrors` returns a keyed record | **PASS (executed)** |
| AC-9 | Field-attributed errors land on their own inputs, incl. dotted indices | *not executed* | — | `code.split(".")[0]` reduction + `ERROR_CODE_FIELDS` allowlist; render sites added for boutique, categories, description | **PASS (inspection)** |
| AC-10 | The four codeless assert failures land on images / colorImages | *not executed* | — | Four stable substrings matched onto `images` / `colorImages` | **PASS (inspection)** |
| AC-11 | Unattributable rejection still shows a translated message; no raw backend text | *not executed* | — | Every mapped value is a `tx(...)` constant; fallback is a translated constant; backend `message` is logged to Sentry but never rendered | **PASS (inspection)** |
| AC-12 | Create blocked without boutique/category/description; edit with an empty description still saves | *not executed* | — | `validate(form, isCreate)`; the three checks sit behind `if (isCreate)`, so the edit path is untouched | **PASS (inspection)** |
| AC-13 | Descriptors render as before but no value can be set, in both modes | *not executed* | — | Numeric input `disabled readOnly`; chips `disabled` with no handler; `patch` no longer destructured, so no write path exists | **PASS (inspection)** |
| AC-14 | No descriptor value in a submission or in the save diff | `grep descriptor_values`; `grep tx("Descriptors")` | 0 | No append in `buildUpdateFormData`; no diff entry (zero hits) | **PASS (executed)** |
| AC-15 | New strings resolve via the helper and exist in all three files; parity passes | `node scripts/i18n-parity.mjs` | 0 | "i18n parity OK — 1987 keys present in all three files" (1,980 + 7) | **PASS (executed)** |
| AC-16 | Create-path limitation recorded, not reported fixed | Inspection of `helpers.ts` + `implement.md` | — | `helpers.ts:809-812` states update-only; `implement.md` records it as a backend defect | **PASS (executed)** |
| AC-17 | Already-correct behaviours unchanged; no previously-unconditional key became conditional | `git diff develop`; conditional-append audit | 0 | Four conditional appends remain (`location_id`, `weight`, `meta_image`, `cloud_video`) — **none is in the contract §2.2 key-required set**, and all four were conditional before this ticket. `luck_price` moved the other way. Colors/sizes/images/variant-key logic untouched | **PASS (executed)** |
| AC-18 | *(WITHDRAWN in `spec.md`, 2026-07-20)* | n/a | — | Moot: no shared transport was touched | n/a |
| AC-19 | Typecheck, lint and production build all succeed | `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` | 0 / 0 / 0 | Typecheck clean; lint 0 errors, 34 pre-existing warnings; build succeeded | **PASS (executed)** |

**Summary: 20 criteria — 10 PASS (executed) · 9 PASS (inspection) · 1 n/a.**
No failures. Depth = `all-ac` (VF-4): every criterion is mapped to a result.

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  (no output) — exit 0
  ```
- `pnpm lint`
  ```
  ✖ 34 problems (0 errors, 34 warnings) — exit 0
  All warnings pre-existing (import/no-anonymous-default-export; unused
  eslint-disable directives) on lines this ticket did not touch.
  ```
- `node scripts/i18n-parity.mjs`
  ```
  ✓ i18n parity OK — 1987 keys present in all three files. — exit 0
  ```
- `pnpm build`
  ```
  Compiled successfully; route table emitted; Proxy (Middleware) built — exit 0
  ```
- `git check-ignore -v` (AC-1)
  ```
  .gitignore:103  docs/api-requirements/shop-product-body-contract.md
  .gitignore:104  docs/api-requirements/shop-product-body-payloads.txt
  .gitignore:105  docs/api-requirements/seller-product-body-alignment-roadmap.md
  ```
- `git status --porcelain | grep -c "shop-product-body\|seller-product-body-alignment"` (AC-1)
  ```
  0  — none of the three is stageable
  ```

**VP-2 confirmed:** all commands are read-only w.r.t. implementation files.
`git status` after validation is identical to before it — the same eight modified
files and four staged deletions. No working-tree change was introduced by
verifying.

## Protected-path & runtime impact review

- **Were any `protected_paths` files changed by this ticket? — NO.**
- Every changed file was checked against `project-config.yaml > protected_paths`
  (`proxy.ts`, `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`,
  `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
  `services/orders.ts`, `store/index.ts`, `next.config.ts`). None matches. The
  nearest call was `utils/fetchData.ts` — not protected, and **not modified**:
  the revised plan removed it from scope once its premise was disproven.
- Runtime impact is confined to the seller-dashboard product add/edit screens. No
  change to shared transport, auth, routing, state or build configuration.
  `docs/` is not served at runtime, and the three ignored documents ship nowhere.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed` (owner transitions `verified → closed`)
- Sign-off: developer (owner self sign-off; comprehension gate passed 3/3 at
  attempt 2, on fresh questions covering the amendment and the deferral)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:

### What closing this ticket does and does not assert

**Asserts:** the payload now matches the code-verified contract on every point the
ticket set out to fix; the code compiles, lints and builds; translation parity
holds; no protected path was touched; the superseded documentation was retired
without losing its unique content.

**Does not assert:** that any of it was observed working against a live backend.
Nine criteria rest on code reading alone.

### Carried forward — outstanding after closure

1. **Run the deferred manual checks before this reaches production.** In priority
   order: **AC-3** (edit a multi-language product, save, reload — confirm each
   translation stayed on its own language, nothing duplicated or blanked); **AC-12**
   second half (edit a legacy product with an empty description and confirm it
   still saves — the regression guard on the create-only scoping); then AC-4,
   AC-5, AC-6, AC-9, AC-10, AC-11, AC-13.
2. **This repository contains no seller-product API documentation.** The knowledge
   lives in contract §5 (gitignored), an out-of-repo backup, and git history. A
   tracked, sanitised replacement is buildable from §5, which holds no
   vulnerability material. Separate ticket.
3. **Raise the backend defects the contract documents** — boutique IDOR,
   client-controllable `id` on create, no barcode uniqueness on update,
   approval-queue bypass via `seller_product_id`. `spec.md` C-1 kept them out of
   scope and AC-16 does not discharge them.
4. **`packed_after_ordering` remains impossible to enable at create** (AC-16) —
   backend fix required.
5. **Rotate the GitHub PAT embedded in the `origin` remote URL.** Visible in
   `git remote -v`; unrelated to this ticket but found during it.
