---
ticket: seller-product-create-validation-fields
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Implement — seller-product-create-validation-fields

> Record of what was actually built, following `plan.md`.

Entry path: **initial** (from `state: approved`). Branch
`ticket/seller-product-create-validation-fields` created from clean `develop`
at `5d0899e3` (IM-3). No commit created, nothing pushed (IM-9).

## Changes made

- **`.gitignore`** — added an ignore rule for captured request payloads, with a
  comment explaining why (live seller data; auth headers if re-captured with
  them). Placed beside the existing `security-check/*.har` rule, which sets the
  same precedent.
- **`public/translations/translations.ar.js`** — added
  `"Brand is required": "العلامة التجارية مطلوبة"`.
- **`public/translations/translations.tr.js`** — added
  `"Brand is required": "Marka gereklidir"`.
- **`public/translations/translations.ku.js`** — added
  `"Brand is required": "مارکە پێویستە"`.
  All three added **before** the string was referenced in code (C-3), each next
  to the existing `"Product name is required"` key to match local ordering.
- **`components/SellerDashboard/productEdit/helpers.ts`** — four changes:
  1. Added `export const DEFAULT_LANGUAGE_CODE: "en" = "en"` beside `UNITS`,
     typed as the **literal** `"en"` so it cannot be widened into caller-supplied
     data, with a comment recording why it is not derived from the `proxy.ts`
     storefront locale.
  2. `validate()` — added `if (!form.brand_id) e.brand_id = tx("Brand is required")`,
     with a comment stating the check is **UX only** and confers no security
     property (spec E-5).
  3. `validate()` — the English-translation check now compares against
     `DEFAULT_LANGUAGE_CODE` instead of a bare `"en"` literal, so the declared
     base language and the row this rule requires read one source.
  4. `buildUpdateFormData()` — emits `default_language_code` from the constant,
     and `multiplyQTY` / `packed_after_ordering` are now **always present** as
     explicit booleans (`set(k, form.flag)`) instead of `"on"`-or-omitted. The
     stale comment describing the old workaround was replaced with one recording
     the new contract and the residual server-side risk.
- **`components/SellerDashboard/productEdit/sections.tsx`** — added `required`
  and `error={errors.brand_id}` to the existing Brand `Select` in `CoreSection`.
  No component change was needed: `Select` already accepted both props and
  already rendered a `"Select"` placeholder option.

Also performed (plan step 1, no repo diff): the captured multipart payload was
moved out of `components/SellerDashboard/productEdit/` — see Deviation 2.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `.gitignore`
- `public/translations/translations.ar.js`
- `public/translations/translations.tr.js`
- `public/translations/translations.ku.js`
- `components/SellerDashboard/productEdit/helpers.ts`
- `components/SellerDashboard/productEdit/sections.tsx`

Confirmed via `git diff --name-only`: exactly these six files, all from
`plan.md` "Files to change". No unrelated file was touched (IM-4). The only
untracked path is this ticket's own `_specs/` folder.

**Protected-path impact: none.** Verified directly rather than assumed:
`.claude/project-config.yaml:109-119` lists ten globs — `proxy.ts`,
`serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`, `services/auth.ts`,
`services/cart.ts`, `services/order.ts`, `services/orders.ts`, `store/index.ts`,
`next.config.ts`. None of the six changed files matches any of them (IM-5/GU-2).

## Deviations from plan

1. **Plan step 2 (the encoding probe) was NOT executed — the most important
   deviation on this page.** The plan required confirming, against the real
   endpoint, that the server accepts `"true"` / `"false"` *before* the encoding
   change was written. That probe needs a running dev server, a real seller
   account, and a live backend, none of which are available here — so the
   encoding change was written **without** it, inverting the plan's ordering.
   **Consequence:** `AC-7` and `AC-8` remain unverified assumptions, and if the
   server in fact wants `1` / `0`, the code in `buildUpdateFormData` is wrong and
   creation stays broken. This does not fail type-checking or lint, so the green
   checks below must **not** be read as evidence the encoding is correct.
   `/verify` must execute it. Review follow-up 6 is therefore still open.
2. **The captured payload went to the session scratchpad, not `_specs/`.**
   `plan.md` step 1 said to relocate it into `_specs/<slug>/`, but the review
   panel established that `/publish-pr` stages that directory wholesale (PB-9),
   which would carry live seller data into a public PR. It was moved to the
   scratchpad, outside the repository entirely, per review follow-up 3. The file
   is no longer under any tracked path.
3. **The `.gitignore` rule is a general pattern, not a ticket-specific
   filename.** Used `*-payload.txt` with an explanatory comment rather than the
   single capture's name, per the senior lens's note that a ticket-specific entry
   is permanent churn for a temporary artifact.
4. **`plan.md` was not edited to fix its own defects.** Review follow-ups 1 (the
   false protected-paths citation) and 5 (the inaccurate "additive edits"
   wording) concern the approved plan document itself. Rewriting an approved
   artifact post-approval would break the review record, so both are corrected
   **here** instead: the protected-paths facts are restated accurately above, and
   for the record, step 6 is a **behaviour-modifying** rewrite of existing
   payload logic on the shared edit path — not an "additive" edit as `plan.md`
   claims.
5. **Review follow-ups 4 and 7 carry forward to `/verify`** — the probe teardown
   (delete any throwaway product; prefer a non-prod target) and confirmation of
   `brand_id` / `boutique_id` authorization scoping with the backend team.

## Validation run during implementation

Profile `standard-frontend` (VP-1):

- `pnpm exec tsc --noEmit` — **exit 0**, no type errors. Confirms the literal
  `"en"` type and the `errors.brand_id` prop wiring compile.
- `pnpm lint` — **exit 0**; 0 errors, 34 warnings, all pre-existing and none in
  the six changed files (they are `import/no-anonymous-default-export` and unused
  eslint-disable directives in unrelated service/util files).
- `pnpm lint:i18n-parity` — **exit 0**, "i18n parity OK — 1979 keys present in
  all three files". Confirms `AC-3`: the new key exists in `ar`, `tr`, and `ku`.

**Not runnable in the agent environment:** every manual check in the plan's
Validation strategy (`AC-1`, `AC-2`, `AC-4`, `AC-5`, `AC-6`, `AC-7`, `AC-8`,
`AC-10`). All require a running dev server against a live backend with a seller
account. `AC-9` is the only acceptance criterion the commands above satisfy.

## Manual validation — resume pass (2026-07-18)

Entry path: **resume** (`state: implementation-in-progress`, `status: blocked`
after the first `/verify` FAILED on coverage). No second branch created (IM-3a);
work continued on `ticket/seller-product-create-validation-fields`. No source
file changed during the resume — the block was missing evidence, not missing
code.

The eight manual criteria were executed by the **ticket owner** against a running
dev server and the live backend, and are recorded here as owner-attested results.
In a repository with no automated test suite (C-1), manual execution is the
verification method the plan specified, not a substitute for one.

**Owner's report: all manual criteria pass.** Two were confirmed in specific
detail because they carried the ticket's material risk:

- **`AC-4` — the off-case.** With the multiply-quantity toggle switched **off**,
  the outgoing payload carried `multiplyQTY` **present with value `false`**. This
  confirms both halves of the change: the key is no longer omitted to mean
  "disabled", and the server accepts the string spelling of the boolean. It also
  retroactively settles the encoding question left open since `/research` — the
  numeric `1`/`0` form is not required, so no `/plan` revision is needed.
- **`AC-8` — the truthiness defect is NOT live.** On a product that existed
  **before** this change, a boolean flag was turned off, saved, and confirmed
  still off after reload. The documented backend defect (any truthy string read
  as "enable", under which `"false"` would also enable) does **not** affect the
  update path. This retires the single largest risk in the ticket — the silent,
  data-affecting wrong-state write that would have hit every existing seller's
  edit path, and the reason the rollback section was written as it was.

Deviation 1 (the plan's step-2 probe never being run before the encoding change
was written) is therefore **closed by outcome**: the ordering was inverted, but
the assumption it protected has now been confirmed correct by direct observation
rather than left standing. Had `AC-4` come back showing `1`/`0`, this would have
returned to `/plan`.

Still **not** covered by the manual pass, and carried to `/verify` as an open
item: whether `brand_id` / `boutique_id` are authorization-scoped server-side to
the authenticated seller (review follow-up 7). Client validation is UX only and
cannot establish this; it needs an answer from the backend team.
