---
ticket: seller-product-approval-gating
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-07-25
links:
  clickup:
  github:
---

# Research — seller-product-approval-gating

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Make the seller product editor reflect the backend's approval state: a banner
when a submitted edit is awaiting approval, a banner when it was denied, and — on
the create path only, for a seller who is not approved to set retail prices —
lock every price input except Purchase Price.

## Relevant directories

- `components/SellerDashboard/productEdit/` — the entire change surface. Four
  files: `ProductEditor.tsx` (39 KB, the one component serving **both** create and
  edit, gated by `isCreate`), `sections.tsx` (61 KB, every form section incl. all
  price inputs), `helpers.ts` (48 KB, form model + validation + payload builders),
  `GalleryPickerModal.tsx` (not involved).
- `components/SellerDashboard/ui/` — shared dashboard primitives. `InlineAlert`
  (`index.tsx:360-378`) is the existing banner component; `StatusPill` and the
  inline pill markup at `ProductEditor.tsx:734-738` are the existing approval
  affordances.
- `components/SellerDashboard/` — `ShopInfoLoader.tsx`, the invisible
  dashboard-wide loader that already fetches `GET /shop/info` once per shop.
- `services/sellerDashboard/` — `index.ts:602` `getShopInfo(sellerId)`, the
  existing caller of the endpoint that carries `is_new_products_approval`.
- `store/` — `index.ts` holds the `dashboardShopInfo` slice shape
  (`:39-48`, `:65-67`). **This is a `protected_paths` file** — see Risks.
- `public/translations/` — the three `translations.{ar,tr,ku}.js` files; both new
  banners need keys added before the copy is written.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/` — route layer.
  `layout.tsx:34` mounts `<ShopInfoLoader sellerId={sellerId} />`, and it wraps
  `products/new`, so shop info is already in flight on the create route.
- `docs/api-requirements/` — the code-verified contract artifacts this ticket
  partially supersedes (`shop-product-body-contract.md`,
  `shop-product-body-payloads.txt`, `seller-product-body-alignment-roadmap.md`).
- `_specs/seller-product-editor-contract-alignment/` — the prior ticket that
  investigated and **deliberately descoped** `is_new_products_approval` because the
  backend did not expose it (`intake.md:206-208`). This ticket unblocks that work.

## Relevant config files

- `.claude/project-config.yaml` — `protected_paths` (read only, to understand it);
  `validation_checks` and `validation_profiles` supply the `/verify` profile.
- `package.json` — the runnable scripts (`lint`, `lint:i18n-parity`, `build`,
  `knip`); `eslint-plugin-i18next` is a devDependency, so hardcoded UI strings are
  lint-enforced.
- `tsconfig.json` — path aliases (`components/*`, `services/*`, `store`, bare
  `utils/...`) used by every file above.
- `public/translations/translations.{ar,tr,ku}.js` — configuration in practice:
  the English string is the key and all three files must stay key-parallel.
- `handoff-pending-update.md` (repo root, untracked) — the backend handoff and the
  source of truth for behaviours 1 and 3. **Not** for behaviour 2 (denied banner),
  which originates in `intake.md`.

## Possibly affected services

- **`SellerDashboardService.getShopInfo`** (`services/sellerDashboard/index.ts:602`)
  — already called; the response gains `is_new_products_approval`. The service
  returns the raw response, so no service change is implied, only consumption.
- **`ShopInfoLoader`** (`components/SellerDashboard/ShopInfoLoader.tsx`) — today it
  extracts **only** `currency` (`:22-28`) and **swallows failures silently**
  (`:30-35`, `LogError` then nothing). It must also carry the approval flag, and
  the owner's decision that the create page should "behave like the product API
  failed" means the loader can no longer treat failure as a no-op: today a failed
  fetch and a still-loading fetch are indistinguishable to consumers (both leave
  `dashboardShopInfo` null).
- **The combined Zustand store** (`store/index.ts:39-48`) — `dashboardShopInfo` is
  typed inline as `{ sellerId, currency } | null`. Carrying the flag widens that
  type. **`store/index.ts` is a protected path.**
- **`ProductEditor`** — reads `dashboardShopInfo` at `:94-98` (trusted only when
  `dashboardShopInfo.sellerId === sellerId`); holds `productMeta` at `:107-110`;
  populates it at `:215` from the edit response; renders the only existing
  `request_status` branch at `:734-738`; renders the transient `approvalNote`
  banner at `:836-844`; builds `sectionProps` at `:689`.
- **`sections.tsx`** — `PricingSection` (`:362-390`), the variants table
  `cell()` helper (`:1038-1054`), and the per-country repeater (`:663-700`).
- **`helpers.ts`** — `validate()` price rules (`:705-715`) and the payload builders
  (`:935-943`, `:1014`).
- **Not affected:** auth, cart, order, proxy/middleware, cookies, API routes. No
  network contract is authored here — both flags are read-only inputs.

## Test / validation commands available

*(listed, not run — `/research` never executes them)*

- `pnpm exec tsc --noEmit` — TypeScript compiles with no type errors
  (`validation_checks.typecheck`).
- `pnpm lint` — ESLint incl. the i18n rules: errors on a `translateFunction` key
  missing from ar/tr/ku, warns on hardcoded JSX text (`validation_checks.lint`).
- `pnpm lint:i18n-parity` — asserts the three translation files stay key-parallel.
- `pnpm build` — production build (`validation_checks.build`).
- `pnpm knip` — unused files/exports/deps.
- **Suggested profile for `/plan`:** `standard-frontend` (typecheck + lint) if the
  store type change stays trivial; **`full-build`** if `/plan` confirms
  `store/index.ts` is touched — that profile exists precisely for protected-path
  and build-affecting work. There is **no test suite** in this repo by policy, so
  every AC is verified manually at `/verify`.

## Risks and unknowns

- **`store/index.ts` is a `protected_paths` file** — impact: high / likelihood:
  high. Widening `dashboardShopInfo` to carry the approval flag edits it. Under
  GU-2 / IM-5 that is permitted **only** if the file is listed explicitly in the
  approved `plan.md` "Files to change", and `/verify` must carry a protected-path
  impact statement (VF-9 / TR-3). `/plan` must decide deliberately: extend the
  slice, or keep the flag out of the store entirely.
- **`sectionProps.disabled` is already taken.** `ProductEditor.tsx:689` sets
  `disabled: !editMode` — it means *view mode*, not *price lock*. Overloading it
  would disable the whole form. A separate, narrower prop is required; the
  per-field `disabled` plumbing in `sections.tsx` already exists to receive it.
- **Price fallbacks silently reintroduce `unit_price`.** `helpers.ts:422-424`
  defaults each variant's price/discount/luck to the **product-level** value when
  the variant cell is empty, and `helpers.ts:1014` sends
  `r.price || form.unit_price || "0"`. With unit price locked and empty these
  resolve to `"0"`, which matches the intended payload — but the coupling is
  implicit and must be verified rather than assumed.
- **The per-country block is a repeater.** Its *Add* button (`sections.tsx:666-670`)
  and per-row delete (`:693-697`) are gated `{!disabled && …}` — hidden, not
  disabled. Locking only the `extra_price` input would leave *Add* live and let a
  seller append rows they cannot fill. The owner already chose **hidden** for these
  two controls and **disabled** for the inputs.
- **A failed shop-info fetch currently looks like a slow one.** Impact: medium.
  The create page must hard-fail per the owner's decision, but `ShopInfoLoader`
  gives consumers no way to tell "failed" from "in flight" — unlike `currency`,
  which degrades silently to no overlay. The flag becomes a hard dependency of the
  create path; `/plan` must define the loading and failure states.
- **Name collision on "denied".** `ProductEditor.tsx:219` already uses
  `setDenied(true)` for **permission** denial (403). The new `request_status = 2`
  banner is a different concept; reusing the name would be actively misleading.
- **`InlineAlert` has no warning tone.** `ui/index.tsx:360-378` supports only
  `"error" | "success"`. Both new banners are warnings, and the existing
  post-save `approvalNote` uses `tone="success"` for an approval-pending message —
  arguably already the wrong colour.
- **No translation keys exist for either banner.** `"Pending Approval"` and the
  transient post-save sentence exist in all three files; nothing matching an
  awaiting-approval banner or a denied banner does. Keys must be added to all
  three files **before** the copy is used, or `pnpm lint` fails.
- **Two behaviours supersede a code-verified contract.**
  `shop-product-body-contract.md:201` documents the **opposite** create/update
  split, verified against backend source. Those artifacts outrank prose and must
  **not** be edited from the handoff — they need re-verification against the new
  backend code once it ships. Risk of a future reader trusting the stale contract.
- **The product-edit flag is unverified from here.** `is_new_products_approval` was
  confirmed present in the live `GET /shop/info` response by the owner;
  `is_product_updated_and_need_approval` rests on the handoff's claim (backend PR
  #385) and no captured payload exists in this repo. Low impact — a wrong
  assumption surfaces immediately at `/verify`.

## Open questions

- Does `dashboardShopInfo` carry the approval flag (touching the protected
  `store/index.ts`), or does the create path read it another way? A `/plan`
  decision, not a blocker — both routes are viable and the trade-off is
  protected-path blast radius versus a second fetch.
- What should the create page render while shop info is **in flight**, and what
  exactly on failure? "Behave like the product API failed" fixes the failure
  branch; the loading branch is undefined and `ShopInfoLoader` cannot currently
  distinguish the two.
- Can `is_product_updated_and_need_approval` and `request_status = 2` be true
  together? The handoff states the pending flag requires `request_status = 1`
  (approved) as one of its three conditions, which implies mutual exclusivity —
  worth stating in `spec.md` as an explicit assumption rather than leaving the
  banner precedence undefined.
- Should the denied banner be dismissible, and does it persist after the seller
  edits again? The pending banner is specified non-dismissible; the denied banner
  has no such guidance because it does not originate in the handoff.
- Which validation profile does `/plan` name — `standard-frontend` or
  `full-build`? Contingent on the `store/index.ts` decision above.

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
