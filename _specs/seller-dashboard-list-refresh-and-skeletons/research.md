---
ticket: seller-dashboard-list-refresh-and-skeletons
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-02
links:
  clickup:
  github:
---

# Research — seller-dashboard-list-refresh-and-skeletons

> Read-only phase. **No implementation is allowed in this command.**

No source file was changed. Nothing outside `_specs/<slug>/` was written.

## Goal

Make the seller dashboard lists show what the seller just changed, and replace the
blank state and the oversized spinner with skeletons that keep the page's shape.

## What the code actually does today

Everything in this section was read in the repository. Line numbers are from
`develop` at commit `78cc85ba`.

### The list state lives in a layout that never unmounts

`app/(client)/[lang]/sellerProfile/layout.tsx:31` mounts `SellerProfileProvider`.
The provider holds the lists as plain React state
(`SellerProfileContext.tsx:48-52`):

```tsx
const [loading, setLoading] = useState(false);
const [shopes, setShopes] = useState<any[]>([]);
const [sellerProducts, setSellerProducts] = useState<any[]>([]);
const [sellerBoutiques, setSellerBoutiques] = useState<any[]>([]);
const [sellerPermissions, setSellerPermissions] = useState<string[]>([]);
```

The route tree puts every detail route **under** that same layout:

```
app/(client)/[lang]/sellerProfile/layout.tsx          <- provider
  page.tsx                                            <- shop list
  sellerDashboard/[sellerId]/layout.tsx               <- per-shop guard + ShopInfoLoader
    page.tsx                                          <- the dashboard, all tabs
    products/new/page.tsx
    products/[productId]/page.tsx
    boutiques/new/page.tsx
    boutiques/[boutiqueId]/page.tsx
```

So opening a product unmounts the dashboard page but **not** the provider. The old
`sellerProducts` array survives the whole trip and is still there on the way back.

### The refetch is guarded on the list being empty

`sellerDashboard/[sellerId]/page.tsx:829-837`:

```tsx
useEffect(() => {
  if (activeTab === "products" && canViewProducts && sellerProducts.length === 0) {
    getSellerProducts();
  }
}, [activeTab, canViewProducts, sellerId]);
```

Boutiques repeat the same shape at `page.tsx:866-874`, permissions at `876-884`.
The dashboard remounts on back, the effect runs, the guard is false, nothing is
fetched.

### No editor writes back to the list

Grepped both editors for `setSellerProducts` / `setSellerBoutiques` /
`router.refresh`. Neither appears. The editors only navigate:

| File | Line | After |
|---|---|---|
| `productEdit/ProductEditor.tsx` | 600 | create → `router.replace(.../products/<newId>)` |
| `boutiqueEdit/BoutiqueEditor.tsx` | 426 | create → `router.replace(.../boutiques/<newId>)` |
| `boutiqueEdit/BoutiqueEditor.tsx` | 516 | delete → `router.replace(dashboardHref)` |

Product update (`ProductEditor.tsx:606`) and boutique update
(`BoutiqueEditor.tsx:434`) stay on the detail page.

`services/sellerDashboard/index.ts` has `addProduct` (908), `updateProduct` (825),
`addBoutique` (1021), `updateBoutique` (962), `deleteBoutique` (1037). There is
**no** `deleteProduct` — only `deleteProductImages` (512). So product delete is not
a journey this ticket has to cover.

**Net effect (P1).** After create with a non-empty list, after any update, and
after a boutique delete, the list is stale. When the list was empty before a
create, the guard is true and it reloads — which is why the bug looks intermittent.

### The back journey shows a bare spinner and collapses the page

`useDashboardDetailBack.ts:31` sets a **bare** `true`:

```tsx
setIsNavigating(true);
router.back();
```

`NavigationLoaderGate.tsx:57` then hides the real page with `display:none` and
renders `InFlowPageLoader`. A bare `true` carries none of the payload flags
(`is_home`, `is_product`, `is_settings`, …), so it falls to the last branch,
`InFlowPageLoader.tsx:29-35`:

```tsx
<div className="w-full flex justify-center p-5 min-h-[50vh]">
  <span className="scale-[5]"><Spinner /></span>
</div>
```

`components/global/Spinner.tsx:19-20` is a 15×15 svg, so `scale-[5]` draws it at
about 75px in an otherwise empty box.

Two separate things then move the page (P2):

1. **The document loses its height.** The real page is `display:none`, so the
   document drops to roughly `50vh`. `overlayScroll.ts:24-30` records this measured
   for the home page: 12525px → 902px, and the browser clamped the position to
   2px.
2. **`enterOverlay` scrolls to the top.** `NavigationLoaderGate.tsx:48` calls
   `enterOverlay(pathname)` for **every** loader, and `overlayScroll.ts:186` ends
   with `window.scrollTo(0, 0)`.

`enterOverlay` was written for intercepted overlay routes only.
`overlayScroll.ts:82-86` names this exact route as **not** one:

> A deeper route that merely contains a `products` segment — the seller
> dashboard's own `/{lang}/sellerProfile/sellerDashboard/{id}/products/{id}` edit
> page, say — is an ordinary page and must not be treated as an intercept.

The file already exports `isInterceptedPath` (`overlayScroll.ts:90`) for that test;
the gate does not use it. Because `markOverlayShown()` is never called on this
journey, `leaveOverlay` records no restore (`overlayScroll.ts:210-212`), so nothing
puts the scroll back either.

### `loading` starts `false`, and it is one flag shared by two pages

`SellerProfileContext.tsx:48` — `useState(false)`.

Opening a list tab paints in this order:

1. `changeTab` sets `?tab=products` (`page.tsx:253-262`).
2. React renders. `loading` is `false`, `sellerProducts.length` is `0`, so
   `renderProducts` falls past the `LoadingState` branch (`page.tsx:949`) to the
   empty state at `page.tsx:955` — **"No products found" + "Add your first
   product"**.
3. The effect runs, `setLoading(true)`, and `LoadingState` replaces it.
4. The real grid.

Step 2 tells the seller something false (P3).

**The flag is shared.** `useSellerProfile().loading` has two readers:

| Reader | Line | Renders while loading |
|---|---|---|
| `sellerProfile/page.tsx` (shop list) | 19, 116 | an inline `animate-pulse` skeleton, 3 cards |
| `sellerDashboard/[sellerId]/page.tsx` | 207 | `LoadingState` (spinner + label) in 8 places |

And it is **written** by at least six fetchers: `getInitialData`
(`sellerProfile/page.tsx:30`), `getSellerProducts` (399/422), `getSellerBoutiques`
(429/445), `getRoles` (454/483), `getRolesForChange` (492/521),
`getSellerPermissions` (695/730). `initializeData` (`page.tsx:886`) runs products
and boutiques together with `Promise.all`, so whichever finishes first clears the
flag for both. Changing its initial value touches every one of those readers.

### Loading states that exist today

`LoadingState` (`components/SellerDashboard/ui/index.tsx:279-288`) is a spinner
plus a label — not a skeleton. Call sites:

| File | Count |
|---|---|
| `sellerDashboard/[sellerId]/page.tsx` | 8 (permissions check, products, boutiques, permissions, users, …) |
| `CommentsTab.tsx` | 2 |
| `ExcelUploadTab.tsx` | 2 |
| `GalleryTab.tsx` | 2 |
| `StoriesTab.tsx` | 3 |
| `locations/LocationsTab.tsx` | 2 |

Total 19 `LoadingState` call sites, plus bare `<Spinner />` uses inside the users
and roles tab (`page.tsx:1345, 1452, 1459, 1570, 1689, 1699, 1749`).

### Two skeleton styles already exist in this repo

They are not the same, and the plan must pick one on purpose:

| Style | Where | How |
|---|---|---|
| `react-loading-skeleton` | `components/skeleton/loaders/*.tsx` (Settings, Home, Product, Boutique, Compare, Filter, FullHome) | `<Skeleton inline width height borderRadius />`, `aria-hidden="true"`, `data-pw="<name>-loader"`, mirrors the real page block for block |
| Tailwind `animate-pulse` | `sellerProfile/page.tsx:116-135`, and `components/Server/Skeleton.tsx` (a `skeleton-base` + shimmer primitive) | hand-written divs in `#f0f0f0` / `#f4f4f4` |

The seller shop-list page already uses the second style, and `#f0f0f0` is the
dashboard tint token. The dashboard's own skeletons have to agree with one of
these two, not invent a third.

## Relevant directories

- `app/(client)/[lang]/sellerProfile/` — the provider, the shop list, the
  dashboard, and the four detail routes.
- `components/SellerDashboard/` — the tabs, the `ui/` primitives
  (`LoadingState`, `EmptyState`, `ErrorState`), and `useDashboardDetailBack.ts`.
- `components/global/` — `NavigationLoaderGate.tsx`, `InFlowPageLoader.tsx`,
  `Spinner.tsx`.
- `components/skeleton/loaders/` — where a new in-flow skeleton would live, by
  the existing convention.
- `components/ModalRoute/` — `overlayScroll.ts` and its scroll rules.
- `services/sellerDashboard/` — the fetchers the dashboard calls.
- `tests/components/SellerDashboard/` — the existing tests for this area.

## Relevant config files

- `vitest.config.ts` — one project, `unit`. jsdom, `tests/setup.ts`, default
  `*.test.*` pattern, `tests/e2e/**` excluded. This is what CI gates on.
- `playwright.config.ts` — the browser suite; runs against staging, gates nothing.
- `next.config.ts` — **protected runtime path**. Nothing here needs it.
- `.github/workflows/` — **protected runtime path**. Nothing here needs it.
- `proxy.ts` — **protected runtime path**. Not on this journey; its matcher
  excludes prefetch and RSC requests anyway.

## Possibly affected services

- `services/sellerDashboard/index.ts` — a refresh on return means more calls to
  `getSellerProducts` and `getSellerBoutiques`. No signature change is needed.
- `sellerCommentsService.GetProductsSocial` (`page.tsx:842-864`) — keyed on
  product id and skipped for ids already loaded. A refreshed product list with the
  same ids costs nothing extra; a list with a **new** id triggers one more social
  call, which is correct.
- No backend contract changes. No new endpoint.

## Test / validation commands available

Not run in this stage.

- `pnpm test:run` — the unit suite (Vitest, `--project unit`). Gates pull
  requests.
- `pnpm test:coverage` — same, with the v8 coverage report.
- `pnpm lint` — ESLint, including the i18n rules (errors on a translate key
  missing from ar/tr/ku, warns on hardcoded JSX text).
- `pnpm lint:i18n-parity` — ar/tr/ku key parity.
- `npx next typegen && npx tsc --noEmit` — typecheck. `next typegen` must run
  first, because `next-env.d.ts` is gitignored.
- `pnpm build` — production build.
- `pnpm e2e:health` then `pnpm test:e2e:live` — the browser suite against staging.
  Gates nothing.

## Test layout and naming convention

- Tests live under `tests/`, **mirroring the source path**, not beside the code.
  `components/SellerDashboard/productEdit/helpers.ts` →
  `tests/components/SellerDashboard/productEdit/helpers.test.ts`.
- File name: `<unit>.test.ts` for plain logic, `<unit>.test.tsx` when it renders.
  A second file for the same unit is allowed only when it isolates one named
  scenario, and it is named for that scenario —
  `ProductEditor.readOnlyCategoryLookups.test.tsx`,
  `validate.luckPrice.test.ts`, `validate.weight.test.ts`.
- Runner: Vitest, jsdom, globals on.
- Mounting: `renderWithProviders` from `tests/render.tsx` — never bare `render()`.
  It seeds the store, sets the route, and waits for the language file.
- `next/navigation` is mocked in `tests/mocks/nextNavigation.ts`:
  `useRouter` → `routerSpies`, `usePathname`, `useParams`, and
  `useSearchParams` → `new URLSearchParams(route.search)`. `setRoute({ params,
  pathname, search })` drives all of them. So `?tab=products` is reachable in a
  test.
- Services are replaced with `vi.mock("services/sellerDashboard", …)` — the
  pattern in `tests/components/SellerDashboard/productEdit/ProductEditor.readOnlyCategoryLookups.test.tsx:35-41`.
  That same file mounts the component inside the real `SellerProfileProvider`, so
  the provider is usable in a test.
- **Expected-failure marker:** Vitest's is `it.fails` / `test.fails`. Grepped the
  whole of `tests/` — it is used **nowhere** today, and no `BUG-n` marker exists.
  If this ticket records a `BUG-n`, it would be the first to use it.

## Existing coverage for the code this ticket touches

`PL-14` asks what already covers each area before a new file is declared.

| Area | Existing test | Disposition it suggests |
|---|---|---|
| `components/ModalRoute/overlayScroll.ts` | `tests/components/ModalRoute/overlayScroll.test.ts` — 8 cases, including "never takes scroll restoration away for a navigation that shows no overlay" and "restores nothing when the loader showed but no overlay ever did" | `extend` — a case about a non-intercepted path belongs in this file, not a new one |
| `components/SellerDashboard/productEdit/*` | 6 files under `tests/components/SellerDashboard/productEdit/` | untouched by this ticket unless the editor is changed |
| The dashboard page, the provider, `useDashboardDetailBack`, `NavigationLoaderGate`, `InFlowPageLoader`, `components/SellerDashboard/ui/index.tsx` | **none** | `new` |

So there is no existing test for the list-refresh behaviour, the loading flag, or
the in-flow loader choice. `overlayScroll` is the one place with a file to extend.

## Risks and unknowns

- **A refresh on every mount costs requests.** The dashboard remounts on every
  back from a detail route and on every tab that is opened after the first.
  Refetching unconditionally is the simplest correct fix but adds one
  `/shop/products` call per return. Impact: more load on the core backend.
  Likelihood: certain, by design — so it must be an explicit decision, not a side
  effect.
- **The shared `loading` flag.** Six writers, two reader pages. Flipping the
  initial value to `true` also makes the shop-list page start in its skeleton.
  That is probably right, but it is a second page changing behaviour and must be
  named in the spec. Impact: medium. Likelihood: certain.
- **A stuck `true`.** If `loading` starts `true` and a tab is opened for which no
  fetcher ever runs — for example a tab the seller has no permission for, where
  `getSellerProducts` returns early at `page.tsx:397` (`if (!canViewProducts)
  return;`) — nothing ever sets it to `false`. The permission branches are checked
  before the loading branch in `renderProducts`, so today's order saves it; any
  change to that order would strand the flag. Impact: high if it happens.
  Likelihood: low, but it is a real trap the plan must avoid.
- **`initializeData` races.** `Promise.all([getSellerProducts(),
  getSellerBoutiques(), …])` (`page.tsx:888`) — both write the same flag, so the
  first to finish clears it while the second is still running. Adding a refresh
  path must not make this worse.
- **Skeleton height vs. the collapse.** A shape-matched skeleton keeps the
  document tall, which is most of the fix for P2. It is **not** all of it: the
  `enterOverlay` call at `NavigationLoaderGate.tsx:48` still scrolls to 0
  regardless of the skeleton's height. Fixing only one of the two leaves half the
  problem. Impact: the reported symptom stays. Likelihood: high if `OQ-3` is
  deferred.
- **Touching `NavigationLoaderGate` reaches the whole app.** It sits above both
  page slots for every route. A change there is not a seller-dashboard change.
  Impact: high blast radius. Likelihood: certain if `OQ-3` is taken in scope.
- **No new user-visible copy is expected.** Skeletons are shapes, and the
  existing loaders are `aria-hidden="true"` with no text. If any new string does
  appear, the repo rule stands: add the key to all three of
  `public/translations/translations.{ar,tr,ku}.js` before using it.
- **The confirming test must be seen red.** The repo rule is absolute: a fix needs
  a test that fails for the bug before the fix and passes after. For P1 that means
  a test that mounts the dashboard twice around a simulated detail trip. Whether
  that is practical is `OQ-5`.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | When does the list refresh — on every dashboard mount, or only after a create / update / delete? | Decides the request cost and the size of the change. "Every mount" is one line (drop the `.length === 0` guard); "only after a change" needs a signal the editors set and the dashboard reads. This must be an `AC-n`, not an implementation detail. |
| OQ-2 | Which loading states become skeletons — only Products and Boutiques, or all 19 `LoadingState` call sites across the six tab files? | Sets the size of the change. The owner said "skeletons by default in the seller dashboard", which could mean either. |
| OQ-3 | Is `NavigationLoaderGate.tsx:48` calling `enterOverlay` for non-intercepted paths in scope, or its own ticket? | It is half of P2, and it is an app-wide file. Taken in, the blast radius grows well past the dashboard. Left out, the page still jumps to the top on back. `spec` must answer one way — silently fixing it is not allowed. |
| OQ-4 | What does the back journey show — a new `is_seller_dashboard` payload branch in `InFlowPageLoader`, or should `useDashboardDetailBack` stop setting the full-screen `isNavigating` at all and let the dashboard's own skeleton cover it? | These are different changes in different files. The second is smaller and keeps `InFlowPageLoader` untouched, but changes the back journey's feel. |
| OQ-5 | Can P1 be confirmed by a red test in the unit suite (`tests/`), or does it need the browser suite? | The repo rule requires a red-first test, and prefers the unit suite because it gates pull requests. The pieces exist — `renderWithProviders`, the `next/navigation` mock with `search`, `vi.mock("services/sellerDashboard")`, and a precedent for mounting inside the real `SellerProfileProvider`. Mounting the 2398-line dashboard page in jsdom is the untested part. |
| OQ-6 | Does `loading` starting `true` apply to the whole shared context — meaning the shop-list page at `sellerProfile/page.tsx` changes too — or does the dashboard get its own flag? | One flag, six writers, two reader pages. Either answer is defensible; leaving it unstated means a second page changes behaviour with nobody having decided it. |
| OQ-7 | Which skeleton style do the new dashboard skeletons use — `react-loading-skeleton` (as `components/skeleton/loaders/*`) or Tailwind `animate-pulse` (as `sellerProfile/page.tsx`)? | Both exist in this repo. A third style would be a defect. The answer also decides where the files live. |
| OQ-8 | Do the create and delete redirects keep the seller's tab — `router.replace(dashboardHref)` at `BoutiqueEditor.tsx:516` drops the `?tab=` and lands on the dashboard home? | Small, and next to P1. It may belong to this ticket or be out of scope; either way it should not be fixed by accident. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No protected runtime path was read for modification: `next.config.ts`,
  `proxy.ts`, `instrumentation*.ts`, `sentry.*.config.ts` and
  `.github/workflows/**` are all untouched and, on current reading, not needed.
