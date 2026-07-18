---
ticket: seller-product-create-validation-fields
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Verify — seller-product-create-validation-fields

> Final validation and impact review before the ticket is closed.

**Outcome: PASSED — all 10 acceptance criteria pass.**

This is the **second** `/verify` pass. The first FAILED on coverage (2 pass, 8 not
executed) because the browser-driven criteria could not run in the agent
environment — no defect was found, only missing evidence. The ticket was blocked,
the owner executed the eight manual criteria against a running dev server and the
live backend, and `/implement` (resume) recorded the results. This pass verifies
the complete set.

## Evidence sources

Two kinds of result appear below, labelled per row and not conflated:

- **Automated** — commands resolved from the validation profile and executed
  locally by this gate.
- **Owner-executed (manual)** — run by the ticket owner against a running dev
  server and the live backend at `NEXT_PUBLIC_GO_BACKEND_URL`, recorded in
  `implement.md` § "Manual validation — resume pass". The repository has no
  automated test suite by policy (C-1), so manual execution is the verification
  method `plan.md` specified for these criteria, not a fallback.

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: `standard-frontend` (resolved → checks `typecheck`, `lint`;
  commands read from `validation_checks`, never hardcoded here — VP-4)

| AC ID | Check / test case | Command (resolved) / source | Exit | Output summary | Result |
|-------|-------------------|-----------------------------|------|----------------|--------|
| AC-1 | Create payload carries `default_language_code=en` | owner-executed: payload inspection on create submit | — | field present with value `en` | **PASS** |
| AC-2 | Submit with no brand blocked client-side, no network request | owner-executed: submit with brand unselected | — | field error shown, submission blocked, no request issued | **PASS** |
| AC-3 | Brand message present in all supported languages; parity lint passes | `pnpm lint:i18n-parity` (automated) | 0 | "i18n parity OK — 1979 keys present in all three files"; key confirmed in `ar` / `tr` / `ku` (`en` is the source key, no file) | **PASS** |
| AC-4 | `multiplyQTY` always present as explicit boolean, on **and** off | owner-executed: payload inspection, toggle on and off | — | **off-case confirmed: key present with value `false`** — never omitted; server accepts the string spelling | **PASS** |
| AC-5 | `packed_after_ordering` under the same always-present rule | owner-executed: payload inspection | — | present as an explicit boolean in both states | **PASS** |
| AC-6 | AC-1/4/5 hold on the **edit** submission too | owner-executed: payload inspection on edit submit | — | same three fields present and correctly encoded on the update path | **PASS** |
| AC-7 | Complete create form succeeds; none of the three backend errors returned | owner-executed: full create with brand selected | — | submission accepted; `default_language_code`, `brand_id`, `multiplyQTY` errors all absent | **PASS** |
| AC-8 | Edit a **pre-existing** product, turn a flag **off**, save, reload — stays off | owner-executed: pre-existing product, off → save → reload | — | **flag remained off** — the documented backend truthiness defect is **not live** on the update path | **PASS** |
| AC-9 | Type checking and linting both pass | `pnpm exec tsc --noEmit` · `pnpm lint` (automated) | 0 · 0 | tsc: no type errors. lint: 0 errors, 34 warnings — all pre-existing, none in the six changed files | **PASS** |
| AC-10 | Editing a brandless legacy product prompts for a brand, then saves | owner-executed: legacy product with no brand | — | brand-required prompt shown; saved normally once a brand was chosen | **PASS** |

**Summary: 10 pass · 0 fail · 0 not executed.** Depth `all-ac` satisfied
(VF-4 / MO-6): every acceptance criterion maps to an executed result.

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  (no output)
  exit 0
  ```
- `pnpm lint`
  ```
  ✖ 34 problems (0 errors, 34 warnings)
  exit 0
  ```
  All 34 warnings pre-existing (`import/no-anonymous-default-export`, unused
  eslint-disable directives) in unrelated service/util files. None in the six
  changed files.
- `pnpm lint:i18n-parity`
  ```
  ✓ i18n parity OK — 1979 keys present in all three files.
  exit 0
  ```

**VP-2 (read-only) confirmed:** after running all three commands,
`git diff --name-only` returns the same six implementation files and nothing
more. No command introduced a working-tree change. **VF-10:** no commit created.
**VF-7:** no implementation file modified by this gate; writes confined to
`verify.md` and `ticket.md`.

## Risks retired by this pass

Two open questions that shaped the plan and both reviews are now closed by
observation rather than assumption:

- **The truthiness defect is not live on the update path (`AC-8`).** This was the
  ticket's single largest risk: a flag switched off being stored as on would have
  been a silent, data-affecting wrong-state write reaching every existing seller
  via the shared builder. Tested on a product predating the change; it stayed
  off.
- **The boolean encoding is correct (`AC-4`).** The server accepts `true`/`false`
  as sent; the numeric `1`/`0` form is not required. This settles the question
  open since `/research` and confirms no `/plan` revision is needed.

`implement.md` Deviation 1 — the plan's step-2 probe never being run *before* the
encoding change was written — is closed by outcome. The ordering was inverted,
but the assumption it protected has been confirmed correct. Recorded plainly:
this worked out, it was not risk-free at the time.

## Protected-path & runtime impact review

- **Were any `protected_paths` files changed by this ticket? — NO.**
- Verified directly against `.claude/project-config.yaml:109-119`, which lists ten
  globs: `proxy.ts`, `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`,
  `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
  `services/orders.ts`, `store/index.ts`, `next.config.ts`. The six changed files
  (`.gitignore`, three `public/translations/*.js`,
  `components/SellerDashboard/productEdit/helpers.ts`, `…/sections.tsx`) match
  none of them.
- Runtime impact: `buildUpdateFormData` feeds both the create and update
  endpoints, so the encoding change reaches every existing seller's edit path.
  `AC-6` and `AC-8` were executed specifically to cover that path, and both pass.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed` (owner transitions `verified → closed`)
- Sign-off: `developer` (self sign-off, ADR-011)
- Comprehension gate: **passed 3/3 (100%, CG-4)** — see `comprehension.md`
  § Verify gate.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)

### Carried forward beyond this ticket

Closing does not resolve these; they were out of scope by design (C-4) and are
recorded so they are not lost:

1. **`brand_id` / `boutique_id` authorization scoping** (review follow-up 7) —
   whether the backend scopes those ids to the authenticated seller is still
   unconfirmed. The client brand check is UX only and confers no security
   property; `AC-2` passing must not be read as "brand input is validated".
   Needs an answer from the backend team; worth its own ticket.
2. **The backend contract document is now stale** on the boolean encoding —
   `shop-product-create-backend-followups.md` still describes the `"on"`-or-omit
   workaround as the FE's behaviour, and P2 item 4 asks the backend to fix a
   defect that `AC-8` shows is no longer live on update.
3. **The debug helper** (fill the product form from a saved payload) remains
   untracked and unbuilt — explicitly out of scope throughout.
4. **Descriptor values and tax fields** remain unsent, each awaiting its own
   backend contract or fix.
