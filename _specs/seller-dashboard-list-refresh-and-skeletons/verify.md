---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Verify — seller-dashboard-list-refresh-and-skeletons

> Read-only. No implementation file was edited here and no commit was created
> (VF-7 / VF-10).

Verifying plan **revision 4** against `spec.md`, at depth `all-ac`: every one of
the eighteen criteria, not a sample.

**Standing caveat, carried forward.** Plan revision 4 was never reviewed — no
panel, no comprehension gate — and reached `implement` by an owner override.
`review.md`'s `APPROVED` belongs to revision 2. That does not change what this
stage checks, but it is the context in which a reader should read it.

## Validation commands executed

Profile `full`, from `.claude/project-config.yaml`. Every command is read-only and
non-writing; `vitest run` and `tsc --noEmit` are pinned to their non-writing modes.

| Check | Resolved command | Exit code | Output summary |
|---|---|---|---|
| `lint` | `pnpm lint` | **0** | 0 errors, 76 warnings — all pre-existing. The only warning in a changed file is `page.tsx:713` (`window.location.href` in `leaveShop`), untouched by this change. |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | **0** | no output |
| `unit-tests` | `pnpm test:run` (`vitest run --project unit`) | **0** | 138 files, 2235 passed, 7 skipped |
| `build` | `pnpm build` | **0** | production build completed |
| `i18n-parity` (extra) | `pnpm lint:i18n-parity` | **0** | 2171 keys present in all three files |

Each declared test file was also run on its own, so the evidence below is per
file and not only in aggregate:

| Test file | Exit code | Result |
|---|---|---|
| `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | **0** | 14 passed |
| `tests/app/sellerProfile/shopListFirstPaint.test.tsx` | **0** | 3 passed |
| `tests/components/global/NavigationLoaderGate.test.tsx` | **0** | 3 passed |
| `tests/components/global/InFlowPageLoader.test.tsx` | **0** | 4 passed |
| `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx` | **0** | 19 passed |
| `tests/components/ModalRoute/overlayScroll.test.ts` | **0** | 8 passed (the `existing` coverage for `AC-12`) |

## Acceptance criteria

All eighteen. "Command" is the per-file run above; every one exited **0**.

| AC | Criterion | Evidence | Verdict |
|---|---|---|---|
| AC-1 | New product appears after returning | `listRefresh.test.tsx::shows a product created while the list already had products` — exit 0 | **met** |
| AC-2 | Edited product shows new values | `listRefresh.test.tsx::shows an edited product's new values after returning` — exit 0 | **met** |
| AC-3 | New boutique appears after returning | `listRefresh.test.tsx::shows a boutique created while the list already had boutiques` — exit 0 | **met** |
| AC-4 | Edited boutique shows new values | `listRefresh.test.tsx::shows an edited boutique's new values after returning` — exit 0 | **met** |
| AC-5 | Deleted boutique is gone | `listRefresh.test.tsx::drops a deleted boutique after returning` — exit 0 | **met** |
| AC-6 | Requests on arrival even when the list is non-empty | `listRefresh.test.tsx::asks the core backend once per arrival, not once per tab switch` — exit 0. Asserts 1 call on the first arrival and 2 after the second, so it catches both "never refetches" and "refetches too often". | **met** |
| AC-7 | Never renders the empty message before the request returns | `listRefresh.test.tsx::never says the shop has no products before the request comes back` — exit 0 | **met** |
| AC-8 | Every loading state is a shape-matched placeholder | `SellerDashboardLoader.test.tsx::draws placeholder blocks and no spinner` across all six shapes, plus `the whole-dashboard shape keeps the page tall` — exit 0. All 15 `LoadingState` render sites were replaced and the component deleted; `build` (exit 0) is what proves no import was left behind. | **met** |
| AC-9 | Shop list paints its placeholder first | `shopListFirstPaint.test.tsx::paints its placeholder, not an empty state, before any effect runs` — exit 0 | **met** |
| AC-10 | Back journey shows the dashboard shape, not the spinner | `InFlowPageLoader.test.tsx::shows the dashboard shape for a seller-dashboard back navigation` + `does not show it for the forward click into an editor` — exit 0 | **met** |
| AC-11 | Arriving at the dashboard does not reset the scroll | `NavigationLoaderGate.test.tsx::leaves the scroll alone when the navigation says it is not an overlay` — exit 0 | **met** (see the limit recorded below) |
| AC-12 | Overlay routes keep today's scroll behaviour exactly | `overlayScroll.test.ts` — 8 cases, exit 0. `components/ModalRoute/overlayScroll.ts` is unchanged in revision 4, so there is nothing that could have altered it; the gate's third case (`still runs the overlay scroll handling when the navigation says nothing`) additionally pins that an unmarked navigation is untouched. | **met** |
| AC-13 | Permission message, never a placeholder that waits forever | `listRefresh.test.tsx` — three cases: waits while permissions are on the way; refuses when the seller really may not see it; shows an error, not a refusal, when the permission fetch failed. Exit 0. | **met** |
| AC-14 | Failed request shows the error, retry replaces it | `listRefresh.test.tsx::shows the error and lets a retry replace it with the list` + `retries a failed arrival fetch on the next arrival` — exit 0 | **met** |
| AC-15 | Empty message after the request returns | `listRefresh.test.tsx::shows the empty message once the request has answered` — exit 0 | **met** |
| AC-16 | Two sections loading at once do not clear each other | `listRefresh.test.tsx::does not let the roles list finishing make the change-role list say it is empty` — exit 0 | **met** |
| AC-17 | Placeholders not exposed to assistive technology | `SellerDashboardLoader.test.tsx::is hidden from assistive technology, inside a region that reports busy` across all six shapes — exit 0 | **met** |
| AC-18 | One placeholder style, built from one block | `SellerDashboardLoader.test.tsx::is built from the one shared placeholder block` across all six shapes — exit 0 | **met** |

**Eighteen of eighteen met.**

## Did the plan's Integration surface hold?

| Claim | Held? | How it was checked |
|---|---|---|
| The gate's change is one added condition; a navigation without the flag is untouched | **yes** | `NavigationLoaderGate.test.tsx` case 2 asserts an unmarked navigation is still scrolled to the top |
| `InFlowPageLoader`'s branch is additive; other routes keep their loader | **yes** | `InFlowPageLoader.test.tsx::leaves every other navigation on the loader it already had` |
| The eight non-`NextLink` `isNavigating` setters are unchanged | **yes** | only `useDashboardDetailBack.ts` carries `no_overlay_scroll`; the other seven were not edited |
| Every `NextLink` journey is unchanged | **yes** | `overlayScroll.ts` untouched; its 8 cases green |
| The dashboard no longer reads or writes the shared `loading` | **yes** | `setLoading(` count in the dashboard page: 0 |
| Removing `LoadingState` breaks no import | **yes** | `build` exit 0 — the check the plan named for exactly this |
| The side-menu badges keep their counts | **by inspection only** | `initializeData` still calls both list fetchers, now through `fetchOnce`. **No `AC-n` covers the badges**, so no test asserts it. Recorded as a gap below rather than claimed as verified. |

## Findings

No `BUG-n` was carried forward from `implement.md`, and this run confirmed none.

Three limits of this verification, recorded rather than left implied:

1. **The side-menu badge counts are not covered by any test.** They were the
   subject of a round 3 `major`, and revision 4 answers it by keeping
   `initializeData`'s fetches. That answer is verified by reading the code, not by
   a test, because no `AC-n` describes the badges. A future change to
   `initializeData` would not be caught.
2. **`AC-11` is proved only in half.** The declared cases prove the gate does not
   move the window scroll. That the seller *lands back* where they were then rests
   on the browser's own history restoration, which the unit suite cannot exercise.
   `plan.md` states this; repeating it here so the criterion is not read as
   fully proved.
3. **`FR-7` is met only for the dashboard.** An ordinary settings or cart page
   still gets the overlay scroll handling. This is a deliberate, recorded
   narrowing in revision 4 — `plan.md > Not fixed — recorded` — and `AC-11` is
   scoped to the opt-in flag accordingly. It is a gap against the spec's wider
   wording, not against any `AC-n`.

Six further items sit under `plan.md > Not fixed — recorded`, including the
cross-shop stale list and the untyped `isNavigating` payload. None blocks a
criterion.

## Outcome

`passed` — every `AC-n` is met, every declared test ran with exit code 0, and the
whole unit suite is green with no regression.

The three limits above are recorded, not waived: they are gaps in *coverage* and
in `FR-7`'s breadth, and none of them is an unmet `AC-n`.
