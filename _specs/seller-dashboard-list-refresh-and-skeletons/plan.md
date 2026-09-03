---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Plan — seller-dashboard-list-refresh-and-skeletons

> Decide the approach before changing code. Plan only — no implementation here.
>
> **Revision 4.** Closes the six `major` findings the round 3 panel raised against
> revision 3. Written at the owner's instruction **without** a review record and
> **without** a comprehension gate, and the work item's stage was left at `review`
> unchanged. So no gate record exists for revision 4, and the `APPROVED` in
> `review.md` still belongs to revision 2.

## Approach

Three changes in three layers. Revision 4 changes five things.

**Success is a value, not an exception.** Revision 3's error paths could never
run. `getSellerProducts` and `getSellerBoutiques` catch their own errors and
**resolve** (`page.tsx:415-423`, `:438-446`), and `getSellerProductsSocial`
returns `{ success: false }` rather than rejecting
(`services/elastic/sellerComments.ts:758-770`) — the repo's `fetchData`
convention. So "release the key on throw" and "release the ids in `.catch`" were
both dead code. Every release now keys on the **returned value**.

**`fetchOnce` holds a promise, not a marker.** The per-mount ref becomes a
`Map<string, Promise<boolean>>`. A caller that finds a key in flight **awaits the
same promise** instead of resolving immediately, and the entry is deleted when the
promise answers `false`. That closes the dead-code major and the badge flicker in
one change: `initializeData`'s `Promise.all` now waits for the arrival fetch it
skipped.

**Nothing enters `fetchOnce` unpermitted.** Revision 3 routed `initializeData`
through the helper without the permission check, so opening the side menu before
permissions arrived added the key while the fetcher returned early — and the
section then waited forever. Both callers now check permission first, and each
fetcher's own permission early-return clears its flag and answers `false`.

**The scroll rule drops its second source.** Revision 3 allowed "positive
knowledge" from either the payload **or** `remembered`. `remembered` is not tied
to the navigation in flight — a `NextLink` click with no payload sets it and the
gate never runs to clear it — so the hole survived in a narrower shape. Revision 4
skips `enterOverlay` **only** when the navigation payload says so. `overlayScroll.ts`
is no longer changed at all, and `AC-12` is proved by the eight cases that already
exist.

The cost, stated plainly: `FR-7`'s general claim — that *any* ordinary page is
exempt — is **not met**. Only the seller dashboard's back journey opts out.
Recorded under **Not fixed** below.

**A refusal must not stand in for an error.** On a failed permissions fetch,
`permissionsReady` goes true with no permissions, and the three `AccessDenied`
branches would tell a permitted seller they have no permission. The existing
`ErrorState` at `page.tsx:952` sits *after* `AccessDenied`, so it is unreachable.
Each of the three now checks the error first.

**Step 4b is deleted.** Once the dashboard stops reading the shared flag, that
line had no reader to serve, and its only remaining effect was to make the shop
list paint with `loading === false` on the back journey — weakening this ticket's
own `AC-9`.

## Steps

1. Add `components/skeleton/loaders/SellerDashboardLoader.tsx`: one shared pulse
   block, the section shapes, and the whole-dashboard shape. It imports **nothing**
   from `components/SellerDashboard/**`. Shapes are `aria-hidden="true"`; the
   container carries `aria-busy="true"`. The permission-check sites use the plain
   inline shape.
2. Replace all 15 `<LoadingState …>` render sites with the matching shape, then
   delete `LoadingState` from `components/SellerDashboard/ui/index.tsx`.
3. In `SellerProfileContext.tsx`, start `loading` at `true`.
4. **Flags in the dashboard page.** Add `productsLoading`, `boutiquesLoading`,
   `rolesLoading`, `rolesForChangeLoading` — each starting `true` — and
   `permissionsReady`, **seeded at first paint** so the from-shop-list path never
   shows an extra placeholder frame:

   ```
   useState(() => (currentShop?.permissions?.length ?? 0) > 0)
   ```

   It is then set `true` in exactly two places: **inside the non-empty branch** of
   the `currentShop` sync effect (`page.tsx:735-739`), and in
   `getSellerPermissions`'s `finally` (`:729-730`).

   `permissionsLoading` is **removed** — after this table it has no reader left,
   and the repo forbids dead code. Its four writes (`:218`, `:694`, `:700`,
   `:729`) go with it.

   | Line | Renderer | Reads today | Becomes |
   |---|---|---|---|
   | 935 | `renderProducts` permission check | `permissionsLoading` | `!permissionsReady` |
   | 949 | `renderProducts` list | `loading && sellerProducts.length === 0` | `productsLoading && sellerProducts.length === 0` |
   | 1141 | products `Pagination` | `disabled={loading}` | `disabled={productsLoading}` |
   | 1151 | `renderBoutiques` permission check | **no guard at all** | `!permissionsReady`, added **before** `AccessDenied` |
   | 1160 | `renderBoutiques` list | `loading && !sellerBoutiques…` | `boutiquesLoading && !sellerBoutiques…` |
   | 1325 | `renderPermissions` | `loading && sellerPermissions.length === 0` | `!permissionsReady` |
   | 1376 | `renderUsers` permission check | `permissionsLoading` | `!permissionsReady` |
   | 1457 | roles, add-user panel | `loading && roles.length === 0` | `rolesLoading && roles.length === 0` |
   | 1568 | roles, add-user panel | `loading && roles.length === 0` | `rolesLoading && roles.length === 0` |
   | 1696 | change-role dropdown | `loading && rolesForChange…` | `rolesForChangeLoading && …` |
   | 1917 | `renderHome` | `permissionsLoading \|\| (loading && …)` | `!permissionsReady` |

   The **eleven `setLoading` writer lines** that go: `page.tsx:399, 422, 429, 445,
   454, 483, 492, 521, 695, 701, 730`. After this the dashboard neither reads nor
   writes the shared flag at all.
4b. **A failed permissions fetch must read as an error, not a refusal.**
   `renderHome`, `renderProducts` (`:940`), `renderBoutiques` (`:1151`) and
   `renderUsers` (`:1381`) each get, **before** their `AccessDenied` branch:
   when `error` is set and `sellerPermissions` is empty, show `ErrorState` with
   `getSellerPermissions` as its retry. `getSellerPermissions` also sets `error`
   when the response succeeds but carries **no entry for this `sellerId`**
   (`page.tsx:706-715`) — today that path sets empty permissions and no error.
5. **`fetchOnce(key, fn)` — one helper, holding promises.**
   `useRef<Map<string, Promise<boolean>>>`. On call: if the key is present,
   **return the stored promise**; otherwise store the promise, run `fn`, and
   `delete` the key when it answers `false` (or throws). Keys are
   `${sellerId}:products`, `${sellerId}:boutiques`, `${sellerId}:shopes` — the
   `sellerId` prefix matters because the page component is reused when only that
   param changes.

   `getSellerProducts` and `getSellerBoutiques` **return `boolean`**: `true` from
   the success path, `false` from their `catch`, and `false` from their permission
   early-return (`:397`, `:427`) — which also clears that section's flag, so a
   section the seller may not see can never sit in a placeholder.

   Callers check permission **before** calling `fetchOnce`, so an unpermitted call
   never reaches the map. Render branches **keep** their `&& length === 0`
   condition. `Pagination` keeps calling `getSellerProducts(page)` directly — paging
   must always fetch, and it never touches the map.
6. **Keep the permissions guard** — `sellerPermissions.length === 0` stays on the
   permissions effect.
7. **`initializeData` keeps its three fetches, all through `fetchOnce`**, each list
   call guarded by the same `canViewProducts` / `canViewBoutiques` check the
   arrival effects use. `getShopes(true)` joins them under `${sellerId}:shopes`,
   so opening the side menu five times costs one call, not five. The badges at
   `page.tsx:2036` / `:2060` keep their counts, and `Promise.all` now waits for an
   in-flight arrival fetch rather than resolving past it.
8. **Bound the social-counts call.** A `useRef<Set<string>>` of ids already
   requested; the effect asks only for ids in neither `productsSocial` nor that
   ref, and **releases the ids inside `.then` when `!res?.success`** as well as in
   `.catch`.
9. *(removed — `overlayScroll.ts` is no longer changed.)*
10. In `NavigationLoaderGate.tsx`, skip `enterOverlay` **only** when the navigation
    payload carries `no_overlay_scroll: true`. Every other navigation in the app
    keeps today's behaviour exactly, including all eight non-`NextLink` setters.
11. In `useDashboardDetailBack.ts` **only**, set the payload to
    `{ no_overlay_scroll: true, is_seller_dashboard: true }`. The forward click
    (`page.tsx:267-270`) is left **completely unchanged**: going to an editor
    should land at the top, which is what `enterOverlay` already does.
12. In `InFlowPageLoader.tsx`, add one branch for `is_seller_dashboard` returning
    the whole-dashboard shape, before the generic spinner fallback.
13. Correct the two comments this change makes false — `page.tsx:264-266` and
    `useDashboardDetailBack.ts:15-17`.
14. Write the tests declared below, each seen failing first where the table says
    so, then run the validation profile.

## Files to change

**Source** (14)

- `app/(client)/[lang]/sellerProfile/SellerProfileContext.tsx` — step 3.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` — steps
  2, 4, 4b, 5, 6, 7, 8, 13.
- `components/skeleton/loaders/SellerDashboardLoader.tsx` — **new**, step 1.
- `components/SellerDashboard/ui/index.tsx` — step 2.
- `components/SellerDashboard/CommentsTab.tsx` — 1 placeholder site.
- `components/SellerDashboard/ExcelUploadTab.tsx` — 1 placeholder site.
- `components/SellerDashboard/GalleryTab.tsx` — 1 placeholder site.
- `components/SellerDashboard/StoriesTab.tsx` — 2 placeholder sites.
- `components/SellerDashboard/locations/LocationsTab.tsx` — 1 placeholder site.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — 1 placeholder site.
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` — 1 placeholder
  site.
- `components/SellerDashboard/useDashboardDetailBack.ts` — steps 11, 13.
- `components/global/InFlowPageLoader.tsx` — step 12.
- `components/global/NavigationLoaderGate.tsx` — step 10.

`components/ModalRoute/overlayScroll.ts` is **no longer in scope** — revision 3
changed it; revision 4 does not.

**Tests** (5, all new)

- `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`
- `tests/app/sellerProfile/shopListFirstPaint.test.tsx`
- `tests/components/global/NavigationLoaderGate.test.tsx`
- `tests/components/global/InFlowPageLoader.test.tsx`
- `tests/components/skeleton/loaders/SellerDashboardLoader.test.tsx`

`tests/components/ModalRoute/overlayScroll.test.ts` is **not** changed —
`AC-12`'s disposition is now `existing`.

## Integration surface

- **Components / shared config touched:**
  - `components/global/NavigationLoaderGate.tsx` — app-wide; renders above both
    page slots for every route. Its change is now one added condition on the
    payload, so a navigation that does not carry the flag is untouched.
  - `components/global/InFlowPageLoader.tsx` — app-wide; one added branch.
  - `SellerProfileContext.tsx` — shared by the shop-list page and the dashboard.
  - `components/SellerDashboard/ui/index.tsx` — imported by six tab files and both
    editors.
- **Who else depends on them:**
  - **Eight places set `isNavigating` without `NextLink`** —
    `PlaceOrderButtons.tsx:317`, `NotificationsContainer.tsx:47`,
    `SearchIcon.tsx:404`, `ProductBackButton.tsx:41` and `:43`,
    `ProductDetailsSlider.tsx:24`, `useDashboardDetailBack.ts:32`,
    `page.tsx:269`. Only `useDashboardDetailBack` opts in; the other seven are
    unchanged.
  - **Every `NextLink` journey is unchanged** — revision 3's `remembered` branch
    is gone, so the `is_home` / `is_full_home` / `is_settings` / `is_compare`
    payloads keep their scroll-to-top.
  - **The side-menu badges** read `sellerProducts?.length` and
    `sellerBoutiques?.length` (`page.tsx:2036`, `:2060`) — which is why step 7
    keeps `initializeData`'s fetches.
  - The shop-list page reads the shared `loading`; the dashboard no longer writes
    it, and the shop list sets it on its own mount.
  - Eight files import `LoadingState`; `build` catches any import left behind.
- **Overlapping flows:** `fetchOnce` is shared by the arrival effects and
  `initializeData`, which is what makes them mutually exclusive and what makes the
  badge wait for the list.
- **Ordering / lockstep:** step 1 before step 2; step 2 complete across all eight
  files before `LoadingState` is deleted; step 5 before step 7; steps 10-11 one
  unit for `no_overlay_scroll`; steps 11-12 one unit for `is_seller_dashboard`;
  step 4 and 4b one unit.
- **What breaks if this is wrong:**
  - **The scroll change can no longer regress another route.** Skipping needs an
    explicit flag that only one call site sets. If the flag is missed, the
    dashboard keeps today's scroll-to-top and `AC-11` catches it.
  - **`fetchOnce`.** A key never released after a failure leaves a section unable
    to retry until the next arrival; a key added unpermitted leaves it waiting.
    `AC-13` and `AC-14` are the guards.
  - **`permissionsReady`.** Set outside the sync effect's non-empty branch, every
    gated section renders from empty permissions. `AC-13` is the guard.

## Tests

| AC | Existing coverage found | Disposition | Test file | Test case / name | Red first |
|------|-------------------------|-------------|-----------|------------------|-----------|
| AC-1 | `none — searched tests/app/**, tests/components/SellerDashboard/**` | new | `listRefresh.test.tsx` | `a product created while the list already had products is in the list after returning` | yes |
| AC-2 | `none` | new | `listRefresh.test.tsx` | `an edited product shows its new values after returning` | yes |
| AC-3 | `none` | new | `listRefresh.test.tsx` | `a boutique created while the list already had boutiques is in the list after returning` | yes |
| AC-4 | `none` | new | `listRefresh.test.tsx` | `an edited boutique shows its new values after returning` | yes |
| AC-5 | `none` | new | `listRefresh.test.tsx` | `a deleted boutique is gone from the list after returning` | yes |
| AC-6 | `none` | new | `listRefresh.test.tsx` | four cases: `one arrival with a non-empty list asks once`; `switching tab and back adds no second call`; `opening the side menu during the arrival fetch adds no second call and waits for it`; `a second arrival does re-request` (pins the remount assumption) | yes |
| AC-7 | `none` | new | `listRefresh.test.tsx` | two cases: the products section and the permissions tab never show their empty message before the request returns | yes |
| AC-8 | `none — searched tests/components/skeleton/**` | new | `SellerDashboardLoader.test.tsx` | `every section shape renders placeholder blocks and no spinner` | yes |
| AC-9 | `none` | new | `shopListFirstPaint.test.tsx` | `the shop list shows its placeholder on the first paint, before any request settles` | yes |
| AC-10 | `none — searched tests/components/global/**` | new | `InFlowPageLoader.test.tsx` | two cases: `a dashboard back navigation shows the dashboard shape`; `a forward dashboard click does not` | yes |
| AC-11 | `none — searched tests/components/global/**` | new | `NavigationLoaderGate.test.tsx` | two cases: `a navigation marked no_overlay_scroll does not move the window scroll`; `a navigation without the flag is left exactly as today` | yes |
| AC-12 | `tests/components/ModalRoute/overlayScroll.test.ts` — 8 cases, incl. `lands the overlay itself at the top` and `puts the page back where it was…` | **existing** | — | write nothing; `overlayScroll.ts` is unchanged in revision 4 | n/a |
| AC-13 | `none` | new | `listRefresh.test.tsx` | three cases: `a refused section shows the permission message`; `a section whose permissions have not arrived shows a placeholder, not a refusal` (boutiques tab); `a failed permissions fetch shows an error, not a refusal` | yes |
| AC-14 | `none` | new | `listRefresh.test.tsx` | two cases: `a failed products request shows the error and a retry replaces it`; `a failed arrival fetch is retried on the next arrival` | the second is red first; the first is a guard |
| AC-15 | `none` | new | `listRefresh.test.tsx` | `a shop with no products shows the empty message once the request has returned` | no — guard |
| AC-16 | `none` | new | `listRefresh.test.tsx` | `mounted at ?tab=users with the dropdown open, the roles list finishing first does not make the change-role list say it is empty` | yes |
| AC-17 | `none` | new | `SellerDashboardLoader.test.tsx` | `shapes are hidden from assistive technology and their container reports busy` | yes |
| AC-18 | `none` | new | `SellerDashboardLoader.test.tsx` | `every shape is built from the one shared placeholder block` | yes |

**Fifteen rows red first, two guards, one `existing`.**

**`AC-11` covers half of its criterion.** The declared cases prove the gate does
not move the scroll. That the seller *lands back* at their position then rests on
the browser's own history restoration, which the unit suite cannot exercise.
Stated rather than implied.

**Feasibility risk.** The dashboard page is 2398 lines and imports six tab
components at module level; the tests mock the tabs they do not exercise. If
mounting proves impossible rather than awkward, that is a blocker at `/implement`.

## Validation strategy

- **Validation profile:** `full` — `lint`, `typecheck`, `unit-tests`, `build`.
  `build` catches a `LoadingState` import left behind. `unit-tests` is
  `pnpm test:run` (`vitest run`, non-writing, deterministic).

Three checks beyond the profile:
1. `SellerDashboardLoader.tsx` imports nothing from `components/SellerDashboard/**`.
2. No `setLoading` call remains in the dashboard page.
3. No `permissionsLoading` reference remains.

Each red-first row is run against the unfixed code and seen failing before its
fix, per `C-4`.

## Rollback

One pull request into `develop`; reverting the merge restores all three
behaviours. The scroll change is now two files (`NavigationLoaderGate.tsx` and
`useDashboardDetailBack.ts`) and reverts on its own.

## Round 3 major findings closed

| # | Finding | How revision 4 closes it |
|---|---------|--------------------------|
| 1 | `fetchOnce`'s release-on-throw is dead code — the fetchers resolve | The fetchers **return `boolean`**; `fetchOnce` deletes the key when the promise answers `false` (step 5). `AC-14` case 2 now has a step that turns it green. |
| 2 | Step 8's release-on-`.catch` is dead code — the service returns `{success:false}` | Ids are released **inside `.then` when `!res?.success`**, as well as in `.catch` (step 8). |
| 3 | `initializeData` entered `fetchOnce` unpermitted, adding a key with no fetch and leaving the section waiting forever | Both callers check permission **before** calling `fetchOnce`, and each fetcher's permission early-return clears its flag and answers `false` (steps 5, 7). |
| 4 | The `remembered` half of "positive knowledge" is not tied to the navigation in flight | The `remembered` source is **dropped**. Skipping needs the `no_overlay_scroll` payload flag, set at one call site. `overlayScroll.ts` leaves scope; `AC-12` becomes `existing` (steps 9-11). |
| 5 | A failed permissions fetch reads as a refusal; the `ErrorState` at `:952` is unreachable behind `AccessDenied` | All four permission-gated renderers get an error branch **before** `AccessDenied`, and `getSellerPermissions` sets `error` when the response carries no entry for this `sellerId` (step 4b). |
| 6 | Step 4b had no reader left and only weakened `AC-9` | **Deleted.** The shop list sets the flag on its own mount, so `AC-9` holds without it. |

Round 3 `minor`s and `nit`s also closed inside those changes: the promise-holding
map (badge flicker), `getShopes` under `fetchOnce` (unbounded menu opens), the
seeded `permissionsReady` (extra placeholder frame), and removing the now-dead
`permissionsLoading`.

## Not fixed — recorded

- **`FR-7`'s general claim.** Only the dashboard's back journey is exempt from
  overlay scroll handling; an ordinary settings or cart page still gets
  `enterOverlay`. Closing it needs a signal every navigation carries, which is a
  larger change than this ticket. `AC-11` is scoped to the flag accordingly.
- **A permissions request that never settles** leaves the five gated sections in a
  placeholder. Today two of them resolve through. A hanging request is a broken
  backend, and no `AC-n` covers it.
- **`?tab=gallery|stories|comments|excel|shopInfo`** render nothing while
  permissions are missing (`page.tsx:2358-2392`). They show no loading state
  today, so `AC-8` does not reach them.
- **The back journey's flag rests on `lastPathname`**, a store value any
  `NextLink` click overwrites. It is the same condition that already decides
  whether to call `router.back()`, so it adds no new assumption.
- **Cross-shop stale list** — shop A's items can paint briefly under shop B.
  `fetchOnce`'s `${sellerId}:` key means B now fetches, where today it never
  would, so this change improves the case without closing it.
- **The badge shows the current page's length, not the shop total.** A behaviour
  change that follows from paging no longer being reset; nobody declared it.
- **`isNavigating` is typed `any`**, so a typo in either payload key fails
  silently. One shared type would fix it; out of scope here.
