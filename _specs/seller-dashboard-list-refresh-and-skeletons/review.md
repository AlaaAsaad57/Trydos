---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-02
links:
  clickup:
  github:
---

# Review — seller-dashboard-list-refresh-and-skeletons

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.
>
> **Round 2.** Round 1 recorded `CHANGES_REQUESTED` against plan revision 1 with
> nine accepted `major` findings; its gate record is retired at
> `comprehension-review-1.md`, and the transition is in `ticket.md > State
> History`. This round reviews plan **revision 2**.

## Review Scope

`spec.md` and plan **revision 2**, with round 1's findings as the checklist. Each
lens was told **not** to repeat its earlier findings, but to test whether the six
claims the rewrite makes actually hold against the code, and to find what the
rewrite introduced.

No source file was changed. No branch was created.

## Plan Summary

Unchanged in direction from revision 1. What changed: fetch once per **mount**
(a `useRef` set) instead of per tab, so `NFR-1` is met without a spec change;
delete the duplicate fetches from `initializeData` instead of guarding them; a
full eight-row table of shared-`loading` read sites plus a new `permissionsReady`
flag; the dashboard shape moved to `components/skeleton/loaders/`; the navigation
payload set only on the back journey.

## Risks

- The scroll predicate does not do what the plan claims, and no existing test can
  see the gap.
- Two of the rewrite's own repairs are wired into fewer places than the criteria
  they are meant to satisfy.

## Assumptions

- The dashboard page can be mounted under jsdom with the heavy tabs mocked.
- Client permission flags are UX only; server actions re-enforce them.

## What the rewrite got right

Recorded because it is evidence, not decoration — three claims round 1 could not
confirm are now confirmed against the code:

- **The per-mount ref works.** The detail routes are ordinary nested pages; only
  `@modal/(.)products` and `(.)filters` exist at `[lang]`. So back really does
  unmount and remount the dashboard while `SellerProfileProvider` keeps the list.
  `changeTab` uses `router.replace`, so a tab switch does not remount. Both lenses
  verified this independently.
- **Paging is unaffected.** `Pagination` calls `getSellerProducts` directly and
  never touches the ref. The ref also removes round 1's "a tab switch loses page
  3" minor.
- **The `canViewProducts` flip costs exactly one call**, and step 4b has no side
  effect on the shop-list page — the two pages are never mounted together, and the
  shop list sets the flag on its own mount.
- **The counts are right**: 15 `LoadingState` render sites across 8 files, and the
  eight shared-`loading` read sites in the plan's table are exactly the eight that
  exist.

## Panel Findings (advisory)

> Advisory only (RP-2). Written before the comprehension gate ran (RP-4).

**Totals: 4 `major` (each found by two lenses where marked), 14 `minor`, 2 `nit`,
4 `info`.**

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| performance + senior | major | **Step 7 is wrong.** The claim "`initializeData` never reads either result" is true of the *variables* `productsRes` / `BoutiqueRes` and false of the *side effects*: both fetches write the shared context lists, and the side-menu badges render `sellerProducts?.length` and `sellerBoutiques?.length`. Deleting the calls makes both badges read `0` until the seller opens that tab. | `page.tsx:2036`, `:2060` vs plan step 7 | |
| security + senior | major | **`permissionsReady` is wired to one read site.** The plan's table maps it to `page.tsx:1917` (`renderHome`) only. `renderBoutiques` (`:1151`) returns `AccessDenied` with **no** loading guard at all, and `renderProducts` (`:935`) / `renderUsers` (`:1376`) guard on `permissionsLoading`, which starts `false` and is never set on the from-shop-list path. A deep link to `?tab=boutiques` still paints "You don't have permission" before permissions arrive — so `AC-13`'s declared red-first half has no step that turns it green. | plan step 4 vs `page.tsx:935`, `:1151`, `:1376`, `:218`, `:748` | |
| security + senior | major | **Table row 1325 picks a flag that is `false` at first paint.** `renderPermissions` reads the shared `loading` today, which step 3 makes start `true`. Swapping it to `permissionsLoading` (starts `false`, skipped entirely when `currentShop.permissions` exists) drops through to "No permissions assigned" on the first paint — a **new** `AC-7` breach, at the one site step 3 would otherwise have covered. | plan step 4 table row `1325`; `page.tsx:218`, `:1324-1339` | |
| security | major | **The step 9/10 predicate is built on the wrong signal.** `remembered` is written only by `rememberBaseScroll`, called only from `NextLink`. Several real journeys set `isNavigating` directly — `SearchIcon.tsx:404` (`is_boutique`), `NotificationsContainer.tsx:47`, `PlaceOrderButtons.tsx:317`. For those the gate skips `enterOverlay`, `remembered` is `null` when `ModalSlot` calls it, and `baseScrollY` falls back to `window.scrollY`, measured at ~2px once the page is hidden. Back-out then lands at the top — the `NFR-5` regression the plan itself names as the worst case. All 8 existing cases and the new `AC-12` case go through `rememberBaseScroll`, so **none of them can see it**. | `overlayScroll.ts:26-29`, `:179-191`; `NextLink.tsx:90,163`; plan steps 9-10 | |
| senior | minor | The predicate is a module-level latch with no expiry: `remembered` is cleared only by `enterOverlay` / `leaveOverlay`, so a click toward an overlay that never shows a loader leaves "destination is an overlay" true for that path, and a later ordinary navigation from it is scrolled to the top again. | `overlayScroll.ts:101`, `:161-165`, `:189`, `:210` | |
| performance | minor | The per-mount ref is keyed by section name only, but the lists live in the provider **above** `[sellerId]`. Shop A's products paint on shop B's dashboard until B's fetch lands, linked as `/sellerDashboard/<B>/products/<A-id>`. | `SellerProfileContext.tsx:53-54`; `page.tsx:949`, `:1160` | |
| security | minor | Same defect from the data lens: keeping `&& length === 0` plus context-held lists shows the previous shop's items under the new shop. Same seller, so no cross-tenant exposure — but wrong data under the wrong shop. | `SellerProfileContext.tsx`; plan follow-up 8 | |
| performance | minor | Step 8's requested-ids ref is never released when `GetProductsSocial` rejects, so one failed batch leaves those products at zero counts for the whole mount. Today a later identity change retries them. | `page.tsx:849-861`, plan step 8 | |
| performance | minor | Step 8 bounds the count but not the ordering: the effect still fires against the **stale** cached list before the refetch lands, so an arrival where a product was added still costs two Elasticsearch batches. | `page.tsx:842-864` | |
| performance | minor | If the ref key is added at request time, a **failed** arrival fetch is marked "fetched", so switching tab and back never retries — only the retry button does. | plan step 5, `page.tsx:415-423`, `AC-14` | |
| security | minor | Step 5's ordering is correct but not binding: if the key is added before the permission check, a later `canViewProducts` `false → true` flip finds the key present and the section never fetches for the whole visit. | plan step 5, `page.tsx:837` | |
| performance + senior | minor | "Two list fetches can never be in flight together" is overstated — only *starting* is exclusive. A tab switch leaves a products fetch open while boutiques starts, and two `getSellerProducts` can overlap from `Pagination`. They write different lists, so the stale-list overwrite is genuinely gone, but all four clear and set the one shared `error`. | plan Approach; `page.tsx:835`, `:872`, `:1142-1143` | |
| security | minor | Step 4 does not say **where inside** the sync effect `permissionsReady` is set. `page.tsx:735-739` runs on every `currentShop` change including the first, when `shopes` is empty and `currentShop` is `undefined`. Setting it outside the existing `if` makes it true with `sellerPermissions === []`. | `page.tsx:735-739` | |
| security | minor | `permissionsReady` has no path that ends the wait when nothing fetches: the mount effect is bodied on `if (sellerId)`. And on a fetch failure the `finally` sets ready `true` with permissions empty, so the home shows a one-tile grid and **no error** — `FR-8` asks a section that cannot load to say so. | `page.tsx:741-752`; `spec.md > FR-8`, `E-8` | |
| security | minor | Step 4b makes the dashboard write a context flag it otherwise disowns, and weakens `AC-9` on the back journey: returning to the shop list paints with `loading === false` until `getInitialData` sets it true. | plan step 4b; `sellerProfile/page.tsx:19,116,30` | |
| senior | minor | Claim 6 holds only for a mount already on `?tab=users`: inside one mount `getRolesForChange` is never called by an effect, so the pair is not concurrent on the tab-switch path. | `page.tsx:762-780`, `:1652-1653` | |
| senior | minor | The plan names the eight read sites but never says the **eleven `setLoading` writer lines** go, so "the dashboard neither reads nor writes the shared flag" is not an instruction anyone can follow without improvising. | `page.tsx:399,422,429,445,454,483,492,521,695,701,730` | |
| senior | nit | `overlayScroll.ts` already exports `isInterceptedPath`, shared with `ModalSlot` so the rule has one copy. The new predicate must reuse it, not carry a second regex. | `overlayScroll.ts:86-91` | |
| security | nit | The permission-check state would get a content-shaped placeholder — the shape of content the seller may be refused a moment later. Use the plain inline shape at `:935` and `:1376`. | `page.tsx:935`, `:1376` | |
| security | info | No secrets, no new endpoint, no protected runtime path. Deleting `LoadingState` touches no `AccessDenied` or `ErrorState` branch — all 15 sites are pure loading states, and the editors use their own local `loading`. `aria-busy` answers round 1's announcement gap. | `plan.md > Files to change` | |
| performance | info | Claim 1 (remount on back) and claim 4 (paging) hold — see **What the rewrite got right**. | `useDashboardDetailBack.ts:30-37`, `page.tsx:1141-1146` | |
| senior | info | Claims 2 and 4 verified; step 4b has no side effect on the shop list. | `sellerProfile/page.tsx:28-30,78-80` | |
| senior | info | Counts confirmed: 15 render sites across 8 files; the eight read sites are exactly the eight that exist. | `page.tsx` | |

**Round-over-round.** Round 1's nine majors: seven are closed by the rewrite. Two
were closed by an argument that does not hold — step 7's "unused result" (now
major 1) and `permissionsReady`'s coverage (now major 2). Two further majors are
new: the wrong flag at row 1325, and the predicate signal.

## Decision

`APPROVED`

- Rationale: The owner's decision, recorded as given. The comprehension gate
  passed 5/5 beforehand, and every question was drawn from the four `major`
  findings, so the findings were understood before they were dispositioned
  (RP-2 / CG-6: a finding may be dismissed, but only after it is understood).
- **What this decision means in practice, recorded plainly.** `/implement` may
  apply only what `plan.md` declares (IM-4). Plan revision 2 does not address the
  four `major` findings, so approving it ships them. The consequences are known
  and listed under **Dispositions** below. This note is a record, not a
  re-argument — the decision stands as the owner made it.
- If the owner later prefers these fixed before code, the route is `/wf:plan` for
  a revision 3, which is the only stage allowed to rewrite the plan.

## Approvals

- Approver (owner): developer — self-review (ADR-009), round 2.

## ADR reference

- ADR: none

## Major finding dispositions

| # | Finding | Disposition | Consequence carried |
|---|---------|-------------|---------------------|
| 1 | Step 7 deletes fetches that feed the side-menu badges | **Dismissed** — plan unchanged | The side-menu product and boutique count badges read `0` until the seller opens that tab (`page.tsx:2036`, `:2060`). |
| 2 | `permissionsReady` wired to `renderHome` only | **Dismissed** — plan unchanged | A deep link to `?tab=boutiques` still paints "You don't have permission to view boutiques" before permissions arrive (`page.tsx:1151`). `AC-13`'s declared red-first case has no step that turns it green, so that row is expected to fail at `/verify`. |
| 3 | Read-site row `1325` picks `permissionsLoading`, false at first paint | **Dismissed** — plan unchanged | The permissions tab paints "No permissions assigned" on first paint — a new `AC-7` breach at that one site. `AC-7`'s case covers the products section, so it will not catch this. |
| 4 | The scroll predicate is built on `remembered`, which only `NextLink` writes | **Dismissed** — plan unchanged | Journeys that set `isNavigating` directly (`SearchIcon.tsx:404`, `NotificationsContainer.tsx:47`, `PlaceOrderButtons.tsx:317`) lose their base-scroll capture, so backing out of those overlays lands at the top. This is the `NFR-5` regression, and no declared test can see it. |

All four are dismissed by the owner's approval of the plan as written. None was
mitigated in the plan.

## Required Follow-up Actions

None blocking — the plan is approved as written and `/implement` proceeds against
it.

Two things `/implement` must do because they follow from the decision, not from
new scope:

1. **Do not fix the four findings while implementing.** They are not in
   `plan.md`, so acting on them is scope creep (IM-4). If one turns out to be
   unavoidable, that is a blocker to record, not a licence to widen the change.
2. **Expect `AC-13` to fail at `/verify`.** Its declared case tests behaviour no
   approved step produces. A failing declared test is a failed verification, and
   `/verify` records it as such rather than passing it (VF-11).

Carried forward for a later ticket, from this round's minors and nits: the
cross-shop stale list (the per-mount ref is keyed by section, not by `sellerId`),
the released-on-error social ids, the shared `error` under overlapping fetches,
the module-level latch with no expiry in `overlayScroll`, and the eleven
`setLoading` writer lines the plan never names.
