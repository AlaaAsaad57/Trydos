---
ticket: unify-delivery-day-calculation
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Plan — plan for unify-delivery-day-calculation

> Decide the approach before changing code. Plan only — no implementation here.
>
> Written against `spec.md` revision 2, which removed `AC-11` and placed transient
> start-up behaviour out of scope. This plan is correspondingly narrowed: it contains no
> cache hydration and no render gating — the two mechanisms that produced every defect
> found across four earlier review rounds.

## Approach

**Normalise the starting-settings response once at each point where it enters the app,
rather than changing the ~15 places that read it.** Every surface already sums the product
value with the platform value correctly; the sum comes out short only because the settings
object is looked up under a key the core backend does not use. Repairing the three ingest
points fixes all four surfaces at once, with no call-site edits and no chance of missing one.

The resolver **accepts both envelope shapes**, preferring the accepted (core) one, so guests
— who are served by the gateway and are correct today — do not regress while the gateway is
still unaligned (AC-6). It has **one return value but two consumption shapes**: the server
fetcher returns the *inner* settings object, because a second consumer reads order statuses
off its result; the client store keeps the *outer* envelope, because every client reader
indexes the envelope key. These must not be collapsed.

The resolver also guarantees the shipping duration is **always a finite number**, which is
what keeps AC-8's "never non-numeric" property true without any gating, and makes AC-9's
"absent behaves as zero" a property of the data rather than a rule each call site
reimplements.

Two cart components additionally move from parsing the session cache themselves to reading
the store. That removes a real defect — their current accessor returns `undefined` when the
cache is cold, making the day count `NaN` and hiding the delivery row entirely — and removes
a full-bundle `JSON.parse` from the cart list's render path.

Alternatives rejected: refactoring every delivery calculation behind a shared helper (large
blast radius, no observable change); hydrating the store from the session cache at boot
(would paint a stale country's figure after a country switch, since that path does not clear
the cache, and would widen stale data to every reader of the slice); and waiting for the
gateway to align (makes shipping depend on work this ticket does not own).

## Steps

1. Add a small pure resolver that takes the starting-settings response payload and returns
   the **complete** settings object, looking under the accepted (core) envelope key first and
   falling back to the gateway's key. On the returned object `shipping_duration_days` is
   **always a finite number**: coerced only when present, with any absent, non-numeric or
   `NaN` result becoming `0`. It never returns a partial or shipping-only object. Pure and
   dependency free, so both the server fetcher and client code may import it. Branch names
   and identifiers refer to core / gateway by role, never by stack.
2. **Server ingest — unwrap.** In the server-side starting-settings fetcher, return the
   resolver's result directly, preserving that function's existing contract of returning the
   inner settings object, which its order-status consumer depends on.
3. **Client ingest — re-key in place, envelope preserved.** In the boot service, build a
   normalised payload that keeps the response envelope and replaces only the settings entry
   under the key existing readers use; pass that object to the store setter and write the
   same object to the session cache. The store must **not** receive the inner object.
4. Apply the same envelope-preserving normalisation in the country-change handler, the third
   writer of both the store and the session cache.
5. Change the cart line-item component to read the platform value from the store instead of
   parsing the session cache. Treat an absent or non-numeric value on **either** side of the
   sum — platform duration *and* product shipping days — as `0`, so the row always renders a
   number rather than `NaN`.
6. Change the previous-cart list component to read from the store on the same basis, with
   the same coercion on both operands.
7. No user-visible copy is added or reworded by this change. If any proves necessary, revise
   this plan first — **no translation file may be edited under this plan** (AC-12).
8. Run the validation profile and the manual checks below.

## Acceptance criteria coverage

Evaluated once the platform settings have loaded, per `spec.md`.

| AC | Covered by | Edit needed |
|----|------------|-------------|
| AC-1 product page | Server ingest (Step 2) | none — surface already sums correctly |
| AC-2 product footer | Server ingest (Step 2) | none — server value passed down as today |
| AC-3 add-to-cart sheet | Client ingest (Step 3) | none — reads the store |
| AC-4 cart line item | Steps 3 + 5 | `CartItem.tsx` |
| AC-5 cross-surface consistency | One normalised value feeds every surface | none beyond the above |
| AC-6 verified vs guest | Resolver accepts both envelope shapes (Step 1) | — |
| AC-7 cart-level MAX rule | Client ingest (Step 3); the existing longest-item-plus-platform-once logic already reads the store and needs no change | none |
| AC-8 row shown, never non-numeric | Steps 5–6 coerce both operands; Step 1's finite-number guarantee covers the platform side | `CartItem.tsx`, `OldCartContainer.tsx` |
| AC-9 graceful degradation | Resolver yields `0` for an absent platform duration; Steps 5–6 treat an absent or non-numeric product value as `0` likewise | `CartItem.tsx`, `OldCartContainer.tsx` |
| AC-10 nothing misleading | Existing guards retained; observed explicitly at `/verify` rather than assumed | none |
| AC-12 localisation | No new or reworded copy expected (Step 7) | — |
| AC-13 typecheck/lint/build | `full-build` profile | — |

## Files to change

- `utils/startingSettings.ts` — **new.** Pure resolver as specified in Step 1. No framework
  or server-only imports, so it is safe in both the server and client graphs.
- `serverRequests/index.tsx` — **`protected_paths` (`serverRequests/**`).** In
  `GetStarttingSetting`, replace the hard-coded envelope-key lookup with the resolver,
  returning the inner settings object exactly as today. The only protected-path file in this
  change, listed explicitly for review-gate approval (GU-2 / IM-5). No change to signature,
  routing, arguments, callers or surrounding comments.
- `services/home.ts` — in `getClientData`, normalise envelope-preserving before the store
  setter and the session-cache write. **No other change to the boot sequence**; in
  particular the commented-out cache-first branch stays commented out.
- `components/settings/PersonalInfoCountries.tsx` — identical envelope-preserving
  normalisation in the country-change handler.
- `components/Cart/CartItem.tsx` — read the platform value from the store instead of parsing
  the session cache; an unavailable value counts as `0`. Removes the current `undefined` →
  `NaN` comparison that hides the delivery row.
- `components/Cart/OldCartContainer.tsx` — same store-based read on the same basis.

No other file is to be modified. The product page, product footer, add-to-cart sheet,
delivery bottom sheet, product marquee and the cart-level expected delivery are **not**
edited — they are repaired by the normalisation upstream. The cart-level figure's
multi-seller calculation is already correct. The marquee's `||` fallback resolves to the
same normalised platform value on both of its mounts: the footer mount injects the
starting-settings value, and the prices mount passes nothing (the qty-price endpoint does
not return `country_shipping_days`), so it defaults to `0` and the store value applies.

## Validation strategy

- Validation profile: `full-build`
- Chosen over `standard-frontend` because a `protected_paths` file is in scope and the new
  module enters both the server and client graphs, so a production build is the check that
  would catch an import-boundary regression.
- Manual verification, following `tester guide/expected-delivery-date.md`, performed **twice
  — once signed in and once as a guest**, since the two audiences are served by different
  backends and AC-6 is precisely that comparison:
  - Product page, product footer, add-to-cart sheet and cart show the same day count for one
    product, including the platform duration (AC-1..AC-5).
  - Multi-seller cart: longest product time plus the platform duration once (AC-7).
  - A cart line item's delivery row is visible and numeric (AC-4, AC-8).
  - A product with zero shipping days, and a country with zero platform duration, each
    degrade to the remaining value — **including the product marquee on both its mounts**
    (product footer and prices row) in the zero-duration case (AC-9, AC-10).
  - A cart item with an absent or non-numeric product shipping time still renders a numeric
    row (AC-8, AC-9).
  - **AC-10 on the product page:** observe explicitly what renders when both values are
    zero, rather than marking it passed by inheritance.
  - Country change from the settings screen reflects the new platform duration after the
    reload (spec Edge Cases; AC-6/AC-9).
  - Checkout payment summary and cart shipping-address rendering are unaffected — the
    regression check for the envelope-shape decision, which would break roughly eight
    unlisted readers if the store were given the inner object.
  - **Observation, not a criterion:** order-history status tabs, currently empty for
    signed-in shoppers because the server fetcher resolves to `undefined`, begin rendering.
    Record whether any label appears untranslated in `ar`/`tr`/`ku` — see Out of scope.
  - **Observation, not a criterion:** order-history and order-details delivery dates change
    by gaining the platform duration. Confirm no double-count.
- Record each `AC-n` against its observed result at `/verify`. The profile covers AC-13; the
  lint check covers AC-12.

## Rollback

- The change is a single revertable commit; `git revert` of that commit restores current
  behaviour in full.
- The six file changes are independent and revertable individually: the new module is purely
  additive, and each of the other five is a localised edit that restores its previous lookup
  when reverted.
- The riskiest edit is the protected-path fetcher; reverting that file alone restores the
  previous server-side behaviour without touching the client fixes.
- The two cart edits are independent of the three ingest edits; if either proves wrong they
  revert separately, and the normalisation — the actual defect fix — stays in place.
- No data migration, configuration change or backend change is involved, so rollback carries
  no residual state.
- Once the gateway aligns to the accepted shape, the resolver's fallback branch can be
  removed in a separate one-line change; leaving it in place is harmless.

## Risks

- The resolver's `0` default makes a dropped or renamed duration field indistinguishable
  from a genuine zero, so this defect class could recur silently on a future backend contract
  change (NFR-1). No runtime guard is added; the signed-in-versus-guest comparison at
  `/verify` is the standing detector, which is why that check is specified to run twice.
- Making the order-status tabs render for signed-in shoppers exposes backend labels that may
  lack translation keys. This is a side effect of the fix, not a change to those surfaces —
  see Out of scope.
- `NFR-2` has no acceptance criterion mapped to it since `AC-11` was removed, so nothing in
  `verify.md` will record against it. Knowingly accepted: review established that this change
  improves the behaviour `NFR-2` describes — today a cold cache yields `NaN`, hides the
  delivery row, and the row pops in on a later re-render, whereas this change renders it from
  first paint.

## Out of scope

- **Transient start-up behaviour** — per `spec.md` revision 2. No cache hydration and no
  render gating. What a surface shows before the settings have loaded, or if they never load,
  is not constrained by this ticket.
- Refactoring the delivery-date arithmetic behind a shared helper.
- Editing the cart-level expected delivery, the add-to-cart card, the delivery bottom sheet
  or the product marquee — all repaired upstream by the normalisation.
- Correcting the pre-existing stack-naming comment in the protected fetcher (IM-4 scope
  creep; flagged for a separate change).
- Removing the session-cache write.
- Order-history and order-details delivery estimates, and the order-status tab labels. Both
  change behaviour as a side effect of the normalisation and carry `/verify` observations,
  but neither is edited. **Adding the missing order-status translation keys warrants its own
  ticket** — they are backend-supplied labels, not copy this change introduces, so they fall
  outside AC-12.
- The raw `order_status.out_for_return` label emitted by the core backend — a backend defect
  recorded in the contract-diff document.
- The checkout decimal-point setting.
- The gateway-side backend alignment.
- Business-day, holiday or cut-off-time handling for delivery dates.
- Any change to routing, authentication, or which backend serves a request.
- Adding automated tests, which repository policy excludes.
