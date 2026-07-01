# Listing Pages Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the listing feature (`/featured`, `/flashDeals`, `/filters` + home strips + PDP related) return plain serializable data from every server action/fetch, render it through one shared client `ProductCard`, remove duplication, split the oversized filter files, and land Tier A+B performance/correctness wins — without breaking behavior.

**Architecture:** One normalized `ListingProduct` contract + `normalizeListingProduct()` replaces 3 duplicated map literals. Server actions (`GetProducts`, `GetRelatedProducts`, `GetNextPageFilters`, `GetFilters`) return data arrays instead of JSX. A single client `ProductCard` (converted from the current server `ProductWrapper`) renders both the SSR first page and client-paginated pages. Filters mirror the pattern with a `FilterOption` shape.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), React 19 (React Compiler ON), TypeScript, Zustand 5 (`store/index.ts`), TailwindCSS 4, Elasticsearch (`services/elastic`).

## Global Constraints

- **No test suite / no test files** — CLAUDE.md forbids adding tests unless explicitly asked. Verification is `pnpm build` + `pnpm lint` + `pnpm exec tsc --noEmit` + targeted manual smoke. (This overrides the writing-plans TDD default.)
- **Package manager: pnpm.** Run `pnpm build`, `pnpm lint`.
- **React Compiler is ON** (`reactCompiler: true`) — do NOT add manual `useMemo`/`useCallback` without a profiled reason.
- **Keep first page server-rendered** for SEO — a client component still SSRs; do not move first-page rendering to a client-only fetch.
- **Zustand:** use slice selectors (`useAppStore(s => s.x)`); for pure actions use `useAppStore.getState().x`. Never call the hook in a Server Component. Devtools only in dev (unchanged).
- **No JSX returned from server actions/fetches** — the whole point; return serializable data.
- **Analytics parity is a hard requirement** — GA `VIEW_ITEMS_LIST` and any PostHog events must keep identical names + payloads. Document any new PostHog event in `docs/posthog-events.md`.
- **Breakpoints are inverted custom Tailwind** (`xs`/`sm` = max 480px, `md` = max 768px, `lg` = min 769px) — reuse existing classes; do not introduce raw px breakpoints.
- **i18n/RTL:** `en/ar/tr/ku`; `ar`/`ku` are RTL. Preserve `isRtl` handling.
- **Commit frequently**, one task per commit. Branch: work on a `ticket/listing-refactor` branch off `develop` (never touch `main` directly). End commit messages with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- **Do not sweep the pre-existing uncommitted `PriceSliderComponent.tsx` change into these commits** unless the owner confirms.

---

## File map (created / modified)

**Created:**
- `types/listing.ts` — `ListingProduct`, `FilterOption`, action return types.
- `utils/listing/normalizeListingProduct.ts` — the single ES-hit → `ListingProduct` mapper.
- `components/products/ProductCard/index.tsx` — the one client card (from `ProductWrapper`).
- `components/products/ProductCard/derivedProps.ts` — pure `ListingProduct` → card-render props (collapses the 3 duplicated prop blocks).
- `utils/listing/priceCardHelpers.ts` (only if FilterItem URL helpers need a shared home) — see Task 8.

**Modified:**
- `serverRequests/listing/index.tsx` — actions return data (Tasks 3, 7).
- `components/ListingPage/ProductInfiniteScroll.tsx` — hold data, map to `ProductCard` (Task 4).
- `components/Product/RelatedProductsInfiniteScroll.tsx` — same (Task 6).
- `components/Server/ProductList.tsx` — render `ProductCard` (Task 5).
- `components/Server/ProductListConainer.tsx` — use `normalizeListingProduct` (Task 2).
- `components/ListingPage/filterComponents/InfiniteScrollFilters.tsx` — hold data, map to `FilterItem` (Task 9).
- `components/ListingPage/FilterItem.tsx` — split + compute-once (Task 8).
- `components/Server/FilterList.tsx` — `getItemData` Map flatten (Task 10).
- `components/ListingPage/filterComponents/FiltersWindow/index.tsx` — selectors + state split (Task 11).
- `components/Server/FlashDealsProducts.tsx`, `FeatureProducts.tsx`, `components/ServerWrapper/FeaturedProduct.tsx`, `FlashDealsProduct.tsx` — point at `ProductCard` (Task 6).
- `components/Listing/FiltersPageContent.tsx` — stream via Suspense (Task 7).
- `services/elastic/elasticSearch.ts`, `services/elastic/helpers.ts` — `noProducts` size=0, `_source` trim, `track_total_hits` (Task 7).
- `next.config.ts` — image `qualities` (Task 2).
- `store/listing/reducer.ts`, `store/index.ts` — remove legacy `getProducts`/`getNextProducts` (Task 12).

---

## Task 0: Branch + baseline

**Files:** none (git only)

- [ ] **Step 1:** Create the working branch from clean `develop` (do not stage the pre-existing `PriceSliderComponent.tsx` change).

```bash
git stash push -- components/ListingPage/filterComponents/FiltersWindow/PriceSliderComponent.tsx
git checkout develop && git pull --ff-only
git checkout -b ticket/listing-refactor
git stash pop
```

- [ ] **Step 2:** Capture a green baseline so later diffs are attributable.

Run: `pnpm install && pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: build succeeds (record any pre-existing warnings/errors so you don't blame them on this work).

---

## Task 1: `ListingProduct` + `FilterOption` types

**Files:**
- Create: `types/listing.ts`

**Interfaces:**
- Produces: `ListingProduct`, `ListingBrand`, `ListingCategoryRef`, `FilterOption`, `GetProductsResult`, `GetRelatedProductsResult`, `GetFiltersResult` types consumed by Tasks 2–9.

- [ ] **Step 1: Create the type file**

```ts
// types/listing.ts
export interface ListingBrand {
  id?: number | string;
  name?: string;
  icon?: any; // { file_path?: string } | string — kept loose to match current ES shape
  is_verified?: number;
}

export interface ListingCategoryRef {
  name?: string;
  id?: number | string;
}

/** The single serializable shape every listing fetch returns per product. */
export interface ListingProduct {
  name?: string;
  slug?: string;
  label_names?: any[];
  category_tree?: any[];
  videos?: any[];
  colors?: any[];
  sync_color_images?: any[];
  images?: any[];
  price?: number;
  offer_price?: number;
  luck_price?: number;
  categories?: ListingCategoryRef[];
  brand?: ListingBrand;
  flash_deal_end_date?: string | null;
  flash_deal_price?: number | null;
  product_id: number | string;
  is_luck?: boolean;
}

export interface GAProductListItem {
  item_id: any;
  item_name: any;
  category?: any;
  category_id?: any;
  brand?: any;
  brand_id?: any;
}

export interface GetProductsResult {
  products: ListingProduct[];
  offset: any;
  recomended_offset?: any;
  pit_id: string | null;
  productIds: string[];
  GA_PRODUCTS_LIST: GAProductListItem[];
}

export interface GetRelatedProductsResult {
  products: ListingProduct[];
  offset: any;
  total_size: number;
  pit_id: string | null;
  productIds: string[];
}

/** A single facet chip's serializable data (category/brand/color/size/price). */
export type FilterTerm = "categories" | "brands" | "colors" | "sizes" | "prices";
export interface FilterOption {
  term: FilterTerm;
  item: any; // category/brand object, color/size string, or price-range object
}

export interface GetFiltersResult {
  categories: any[];
  brands: any[];
  colors: any[];
  sizes: any[];
  prices: any;
  total_size: number;
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (new file, no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add types/listing.ts
git commit -m "feat(listing): add ListingProduct/FilterOption data contract types"
```

---

## Task 2: `normalizeListingProduct()` + adopt in the initial container + fix image config

**Files:**
- Create: `utils/listing/normalizeListingProduct.ts`
- Modify: `components/Server/ProductListConainer.tsx:24-87`
- Modify: `next.config.ts` (image `qualities`)

**Interfaces:**
- Consumes: `ListingProduct` (Task 1).
- Produces: `normalizeListingProduct(product: any, redeemedIds?: any[]): ListingProduct`.

**Note on parity:** the current 3 literals differ only in the `is_luck` computation. `GetProducts` uses `!redeemedIds.find(s => s.id === product_id)`; `ProductListConainer` additionally gates on `product.luck_price`. The normalizer preserves BOTH by only setting `is_luck` when `product.is_luck` is truthy AND `luck_price` is present — matching the container's stricter rule, which is the safe superset (a non-luck product stays non-luck everywhere).

- [ ] **Step 1: Create the normalizer**

```ts
// utils/listing/normalizeListingProduct.ts
import type { ListingProduct } from "types/listing";

export function normalizeListingProduct(
  product: any,
  redeemedIds: any[] = [],
): ListingProduct {
  const hasSyncImages =
    Array.isArray(product?.sync_color_images) &&
    product.sync_color_images.length > 0;

  const base: ListingProduct = {
    name: product?.name,
    slug: product?.slug,
    label_names: product?.label_names,
    category_tree: product?.category_tree,
    videos: product?.videos,
    colors: product?.colors,
    sync_color_images: product?.sync_color_images,
    ...(hasSyncImages ? {} : { images: product?.images }),
    price: product?.price,
    offer_price: product?.offer_price,
    luck_price: product?.luck_price,
    categories: product?.categories?.map((s: any) => ({
      name: s?.name,
      id: s?.id,
    })),
    brand: {
      id: product?.brand?.id,
      icon: product?.brand?.icon,
      is_verified: product?.brand?.is_verified,
    },
    flash_deal_end_date: product?.flash_deal_end_date,
    flash_deal_price: product?.flash_deal_price,
    product_id: product?.product_id,
  };

  if (product?.is_luck && product?.luck_price) {
    base.is_luck = !redeemedIds.find((s) => s.id === product.product_id);
  }

  return base;
}
```

- [ ] **Step 2: Use it in the initial container**

In `components/Server/ProductListConainer.tsx`, replace the whole `let productsData = filtersData.products.map((product) => { ... });` block (lines 25-87) with:

```tsx
let productsData = filtersData.products.map((product) =>
  normalizeListingProduct(product, redeemed_ids),
);
```

Add the import at the top:

```tsx
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
```

- [ ] **Step 3: Fix the rejected image quality**

In `next.config.ts`, find `images.qualities` (currently `[70, 65]`) and either (a) add the value the cards use, or (b) we lower the card quality in Task 5. Choose (a) now to avoid a broken state between tasks:

```ts
qualities: [100, 70, 65],
```

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS. Manually load `/en-gb/filters` — the initial product grid renders identically (same cards, prices, images) as before.

- [ ] **Step 5: Commit**

```bash
git add utils/listing/normalizeListingProduct.ts components/Server/ProductListConainer.tsx next.config.ts
git commit -m "feat(listing): single normalizeListingProduct; allow q100 images"
```

---

## Task 3: `GetProducts` / `GetRelatedProducts` return data, not JSX

**Files:**
- Modify: `serverRequests/listing/index.tsx` (GetProducts 121-272; GetRelatedProducts 403-542)

**Interfaces:**
- Consumes: `normalizeListingProduct` (Task 2), `GetProductsResult`/`GetRelatedProductsResult` (Task 1).
- Produces: `GetProducts(...) : Promise<GetProductsResult>` returning `products: ListingProduct[]` (no `items` JSX); `GetRelatedProducts(...) : Promise<GetRelatedProductsResult>`.

**Important:** These functions currently `import ProductWrapper`. After this task, `GetProducts`/`GetRelatedProducts` no longer render it. Leave the `ProductWrapper` import only if `GetFilters`/`GetNextPageFilters` still need their filter imports; remove the now-unused `ProductWrapper` import at the end of Task 9 when nothing in the file renders it.

- [ ] **Step 1: Replace GetProducts body’s data + return**

In `serverRequests/listing/index.tsx`, replace the `productsData` map (lines 147-207) with the normalizer, delete the `items` JSX map (lines 209-239), and change the return (240-257) to return `products`:

```tsx
const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
const products = response.products.map((product) =>
  normalizeListingProduct(product, redeemed_ids),
);
const newOffset = response?.offset;
return {
  products,
  offset: newOffset,
  recomended_offset: response?.recommended_offset,
  pit_id: response?.pit_id ?? null,
  productIds: products?.map((p) => String(p?.product_id)) ?? [],
  GA_PRODUCTS_LIST: response?.products?.map((s) => ({
    item_id: s?.product_id,
    item_name: s?.name,
    category: s?.category?.name,
    category_id: s?.category?.id,
    brand: s?.brand?.name,
    brand_id: s?.brand?.id,
  })),
};
```

Change the catch return (263-270) `items: []` → `products: []`:

```tsx
return {
  products: [],
  offset: undefined,
  recomended_offset: undefined,
  pit_id: null,
  productIds: [],
  GA_PRODUCTS_LIST: [],
};
```

- [ ] **Step 2: Same for GetRelatedProducts**

Replace `productsData` (425-485) with `const products = response.products.map((p) => normalizeListingProduct(p, redeemed_ids));`, delete the `items` map (488-518), and set the return (520-526) + catch (534-540):

```tsx
return {
  products,
  offset: response?.offset,
  total_size: response.total_size,
  pit_id: response?.pit_id ?? null,
  productIds: products?.map((p) => String(p?.product_id)) || [],
};
// catch:
return { products: [], offset: [], total_size: 0, pit_id: null, productIds: [] };
```

- [ ] **Step 3: Add the import**

```tsx
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
```

- [ ] **Step 4: Type the signatures**

Annotate `export async function GetProducts(...): Promise<GetProductsResult>` and `GetRelatedProducts(...): Promise<GetRelatedProductsResult>` and import those types. (Consumers break here — expected; Task 4/6 fix them.)

- [ ] **Step 5: Verify (compile only — consumers updated next task)**

Run: `pnpm exec tsc --noEmit`
Expected: errors ONLY in `ProductInfiniteScroll.tsx` / `RelatedProductsInfiniteScroll.tsx` (they still read `response.items`). No errors inside `serverRequests/listing/index.tsx`.

- [ ] **Step 6: Commit**

```bash
git add serverRequests/listing/index.tsx utils/listing/normalizeListingProduct.ts
git commit -m "refactor(listing): GetProducts/GetRelatedProducts return data not JSX"
```

---

## Task 4: `ProductCard` client component (from `ProductWrapper`)

**Files:**
- Create: `components/products/ProductCard/index.tsx`
- Create: `components/products/ProductCard/derivedProps.ts`

**Interfaces:**
- Consumes: `ListingProduct` (Task 1).
- Produces: `ProductCard` (`"use client"`) with props `{ product: ListingProduct; currency: any; country: string; language: string; sliders?: boolean; sizesFilters?: string[] | null; fromRecomended?: any }`, and `deriveCardProps(product, ctx)` mapping a `ListingProduct` + context → the render props (collapses the 3 duplicated prop-building blocks).

**Client-safety pre-check (do this first):** `ProductWrapper` imports from `utils/server` (`getConfiguredImage`, `GetImageUrl`, `getBrandIconImageUrl`, `RoundPrice`, `getVideoUrl`, `getUrlofProduct`). Confirm `utils/server` (and these functions) are NOT guarded by `import "server-only"` and use no server-only APIs (cookies/headers/fs). If any are server-only, move the pure ones into a client-safe module (e.g. `utils/media.ts`) and import from there in `ProductCard`. Record the outcome in the commit message.

- [ ] **Step 1: Verify client-safety**

Run: `pnpm exec grep -rn "server-only" utils/server*` (or Grep tool for `server-only` in `utils/server`).
Expected: the 6 helpers above are pure (no `server-only`, no `next/headers`). If not, extract them per the pre-check before Step 2.

- [ ] **Step 2: Create `deriveCardProps`**

```ts
// components/products/ProductCard/derivedProps.ts
import type { ListingProduct } from "types/listing";

export interface CardContext {
  currency: any;
  country: string;
  language: string;
  sliders?: boolean;
  sizesFilters?: string[] | null;
  fromRecomended?: any;
}

/** ListingProduct + context → the exact props ProductWrapper used to receive.
 *  This is the single source of truth that replaces the 3 duplicated blocks in
 *  GetProducts, GetRelatedProducts, and ProductListServer. */
export function deriveCardProps(product: ListingProduct, ctx: CardContext) {
  return {
    id: product?.product_id ?? (product as any)?.id,
    slug: product.slug,
    name: product.name,
    language: ctx.language,
    country: ctx.country,
    currency: ctx.currency,
    Sliders: ctx.sliders ?? false,
    color: product?.sync_color_images?.[0]?.color_name ?? null,
    category_tree: product?.categories?.map((s) => s?.name),
    labels: product?.label_names,
    images: product?.sync_color_images?.[0]?.images ?? product?.images,
    videos: product?.videos,
    brand: {
      name: product?.brand?.name,
      icon: (product?.brand?.icon as any)?.file_path ?? product?.brand,
      is_verified: product?.brand?.is_verified,
    },
    luck_price: product.luck_price,
    endDate: product.flash_deal_end_date,
    flash_deal_price: product.flash_deal_price,
    is_flashDeal: product.flash_deal_end_date,
    is_luck: product.is_luck,
    offer_price: product.offer_price,
    price: product.price,
    InitialProductData: { ...product, id: product?.product_id },
    fromRecomended: ctx.fromRecomended ?? null,
    sizes_filters:
      ctx.sizesFilters && ctx.sizesFilters.length > 0 ? ctx.sizesFilters : null,
  };
}
```

- [ ] **Step 3: Create `ProductCard`**

Copy the ENTIRE body of `components/ServerWrapper/ProductWrapper/index.tsx` into `components/products/ProductCard/index.tsx`, then:
1. Add `"use client";` as line 1.
2. Change the component to accept `{ product, currency, country, language, sliders, sizesFilters, fromRecomended }`, call `const p = deriveCardProps(product, { currency, country, language, sliders, sizesFilters, fromRecomended });`, and read every field from `p` (i.e. replace the destructured params with `p.*`). Keep all markup identical.
3. Apply the **Tier A image fixes** in the two `<Image>` blocks and the brand `<img>`:
   - `quality={100}` → `quality={70}` (an allowed value; still add 100 to config in Task 2 as a safety net).
   - `loading="eager"` → `loading="lazy"` on all three.
   - Add `sizes="200px"` to both `<Image>` uses.
   - Leave `priority` off here (first-row priority is handled by the SSR grid in Task 5 via a `priority` prop; add an optional `priority?: boolean` to `CardContext`/props and pass to the first `<Image>` when true).
4. Keep `shouldShowOrangeBorder` but pass the computed boolean to `ProductColorsCards` (fix the server→client function prop): change `shouldShowOrangeBorder={() => shouldShowOrangeBorder()}` → `shouldShowOrangeBorder={shouldShowOrangeBorder()}`. (Verify `ProductColorsCards` reads it as a value; if it calls it, adjust there.)

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: `ProductCard` compiles. (Not yet used — no runtime check here.)

- [ ] **Step 5: Commit**

```bash
git add components/products/ProductCard/
git commit -m "feat(listing): shared client ProductCard + deriveCardProps"
```

---

## Task 5: Render `ProductCard` in the SSR first-page grid (prove parity here)

**Files:**
- Modify: `components/Server/ProductList.tsx:30-91`

**Interfaces:**
- Consumes: `ProductCard`, `deriveCardProps` context shape (Task 4).

- [ ] **Step 1: Swap the map to `ProductCard`**

Replace the `products.map(...)` block (lines 30-66) with:

```tsx
{products.map((product, key) => (
  <ProductCard
    key={product.slug}
    product={product}
    currency={currency}
    country={country}
    language={language}
    sliders={true}
    priority={key < 4}
    sizesFilters={
      parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
    }
  />
))}
```

Replace the import `import ProductWrapper from "components/ServerWrapper/ProductWrapper";` with `import ProductCard from "components/products/ProductCard";`. (`priority` requires the optional prop added in Task 4 Step 3.4.)

- [ ] **Step 2: Verify parity (the key checkpoint)**

Run: `pnpm build && pnpm start` (or `pnpm dev`).
Manual checks on `/en-gb/filters`, `/en-gb/featured`, `/en-gb/flashDeals` AND `/ar-iq/filters` (RTL):
- First-page grid looks identical (layout, images, prices, flash badge, redeem border, brand icon, RTL direction).
- View page source: product markup is present in server HTML (SEO preserved).
- Click a card → PDP navigates correctly.
- Flash-deal countdown + lucky-draw timer still tick.

- [ ] **Step 3: Commit**

```bash
git add components/Server/ProductList.tsx
git commit -m "refactor(listing): render shared ProductCard in SSR grid"
```

---

## Task 6: Point pagination + home strips + related at `ProductCard`

**Files:**
- Modify: `components/ListingPage/ProductInfiniteScroll.tsx`
- Modify: `components/Product/RelatedProductsInfiniteScroll.tsx`
- Modify: `components/Server/FeatureProducts.tsx`, `components/Server/FlashDealsProducts.tsx`, `components/ServerWrapper/FeaturedProduct.tsx`, `components/ServerWrapper/FlashDealsProduct.tsx`
- Modify: `components/products/FlashDealBanner.tsx` (visibility-gate the per-card timer)

**Interfaces:**
- Consumes: `GetProductsResult.products` (Task 3), `ProductCard` (Task 4).

- [ ] **Step 1: Product infinite scroll holds data, renders cards**

In `ProductInfiniteScroll.tsx`:
- `const [products, setProducts] = useState<any[]>([]);` stays, but now holds `ListingProduct[]`.
- Replace every `response.items` read with `response.products` (dedup at line 170 becomes `response.products[index]`; end-detection at 144/146 uses `response.products.length`).
- Fix the store subscription (Tier A): change `const { resetBoutique } = useAppStore();` (line 38) → `const resetBoutique = useAppStore((s) => s.resetBoutique);`.
- Remove the initial `setTimeout(getProductsReq, 1000)` artificial delay (lines 251-253): call `getProductsReq()` directly (the `InView` sentinel already guards duplicate fetches). Keep the rest of the mount effect.
- Change the render (line 270) from `{products}` to:

```tsx
{products.map((product) => (
  <ProductCard
    key={product?.product_id ?? product?.slug}
    product={product}
    currency={currency}
    country={country}
    language={languageVariable}
    sliders={true}
    sizesFilters={sizes_filters}
  />
))}
```

Add `import ProductCard from "components/products/ProductCard";`.

- [ ] **Step 2: Related products infinite scroll**

In `components/Product/RelatedProductsInfiniteScroll.tsx`, apply the same change: read `response.products`, store data, render `<ProductCard ... sliders={false} />` (related used `Sliders={false}`). Fix any bare `useAppStore()` to a selector.

- [ ] **Step 3: Home strips**

In `FeaturedProduct.tsx` / `FlashDealsProduct.tsx` (the wrappers) and `FeatureProducts.tsx` / `FlashDealsProducts.tsx` (the strips), replace the duplicated `ProductWrapper` prop blocks with `normalizeListingProduct` + `<ProductCard product={...} sliders={...} .../>`. Keep each strip's header text/icon/href unchanged.

- [ ] **Step 4: Visibility-gate the flash-deal timer (Tier A)**

In `components/products/FlashDealBanner.tsx`, the `setInterval(..., 1000)` (~line 53) ticks for every card even off-screen. Mirror the pattern `LuckyDrawer` already uses: wrap the component in an `IntersectionObserver` (or `react-intersection-observer`'s `useInView`) and only run the interval while the card is in view; clear it when it scrolls out. Keep the displayed countdown identical when visible. This caps live intervals to roughly the on-screen cards.

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc --noEmit && pnpm build && pnpm start`
Manual: scroll all three listing pages → pagination appends non-duplicate cards, spinner shows, "Reach End" shows at the end; home Featured/Flash strips render; PDP related-products render + paginate. Flash-deal countdowns tick when visible and stop when scrolled away (verify via a `console.count` in dev or React DevTools profiler that off-screen cards stop updating). Watch the network tab: no burst beyond the bounded auto-advance. Confirm GA `VIEW_ITEMS_LIST` fires with the same payload shape (DevTools → GA debug / network).

- [ ] **Step 6: Commit**

```bash
git add components/ListingPage/ProductInfiniteScroll.tsx components/Product/RelatedProductsInfiniteScroll.tsx components/Server/FeatureProducts.tsx components/Server/FlashDealsProducts.tsx components/ServerWrapper/FeaturedProduct.tsx components/ServerWrapper/FlashDealsProduct.tsx components/products/FlashDealBanner.tsx
git commit -m "refactor(listing): render ProductCard everywhere; visibility-gate flash timer"
```

---

## Task 7: Network + streaming fixes (Tier A/B)

**Files:**
- Modify: `components/Listing/FiltersPageContent.tsx:122-141`
- Modify: `services/elastic/elasticSearch.ts` (`noProducts` size, `track_total_hits` ~306)
- Modify: `services/elastic/helpers.ts` (`getSourceFields` 15-86)

- [ ] **Step 1: Stream `/filters` like `/featured`**

In `FiltersPageContent.tsx`, stop `await Promise.all([...])` at the top. Instead build the un-awaited promises and pass them into the same `<Suspense>`-wrapped containers `/featured/page.tsx` uses (`FilterWidgetServer`, `FilterListContainer`, `ProductListConainer` accept `filtersDataPromise`). Mirror `featured/page.tsx:75-89` exactly. Verify the boutique/currency promises are also passed un-awaited where the containers expect promises.

- [ ] **Step 2: `noProducts` → size 0**

In `services/elastic/elasticSearch.ts`, where `noProducts` is handled, set `searchQuery.size = 0` whenever `noProducts` is true (independent of `LISTING_PRICE_AGG_ENABLED`). Confirm the facet aggregations do not depend on `hits` being present.

- [ ] **Step 3: Bound `track_total_hits` on pagination**

At `elasticSearch.ts:306`, change `track_total_hits: true` to be conditional: `track_total_hits: noFilters ? false : 10000` (facet/initial loads still get an exact-enough count for display; pure product pagination skips the full count).

- [ ] **Step 4: Trim `_source` (careful)**

In `helpers.ts` `getSourceFields()`, remove fields no card reads. Cross-check against `normalizeListingProduct` + `deriveCardProps` + `ProductCard` markup before removing each. Safe removals per audit: `custom_products.details`, `custom_boutiques.banners`, and the unused category photo variants (`flat_photo_path`, `outline_photo_path`, `png_photo_path`, `fill_photo_path`, `banner_photo_path`) — but KEEP `most_viewed_product_thumbnail` (used by category filter chips) and `country_offer_prices` (price override invariant — see the `price-agg-index-invariants` memory). Remove one field, rebuild, verify a card + a filter chip still render, then remove the next.

- [ ] **Step 5: Verify**

Run: `pnpm build && pnpm start`
Manual: `/en-gb/filters` streams (shell paints before ES fully resolves — compare TTFB feel vs before); filter panel open still shows facets; product prices/images unchanged after the `_source` trim; pagination still works.

- [ ] **Step 6: Commit**

```bash
git add components/Listing/FiltersPageContent.tsx services/elastic/elasticSearch.ts services/elastic/helpers.ts
git commit -m "perf(listing): stream /filters, noProducts size=0, bound track_total_hits, trim _source"
```

---

## Task 8: `FilterItem` — compute-once + split

**Files:**
- Modify: `components/ListingPage/FilterItem.tsx`
- (Optional) Create: `utils/server` addition or `utils/listing/filterItemState.ts` for the hoisted pure helpers.

- [ ] **Step 1: Hoist repeated computations**

In `FilterItem.tsx`:
- Compute `const showSub = shouldShowSubCategories();` once at the top of the categories branch; replace all ~10 call sites (lines 149, 152, 156, 180, 183, 185, 246, 259, 264, 345) with `showSub`.
- Per child in the map: `const sub = getSubCategoryUrl(s.slug);` once; replace the 3 uses (176, 191, 219) with `sub.href` / `sub.isFiltered` accordingly.
- Per grandchild: `const gsub = getSubCategoryUrl(sub_s.slug, s.slug);` once; replace 273, 279, 308.
- In `getFilterStateForItemLegacy`, parse `JSON.parse(decodeURIComponent(...))` once per list, not per call.

- [ ] **Step 2: Extract pure helpers**

Move the already-pure module-level helpers `getFilterStateForItem` / `getFilterStateForItemLegacy` (lines ~611-778) into `utils/listing/filterItemState.ts` and import them, shrinking `FilterItem.tsx` to markup + thin wiring.

- [ ] **Step 3: Verify**

Run: `pnpm build && pnpm start`
Manual: `/en-gb/filters` filter bar chips render, active/highlight state correct, clicking a category/brand/color/size/price chip navigates to the right filtered URL; sub-category expansion still shows/hides correctly; RTL intact.

- [ ] **Step 4: Commit**

```bash
git add components/ListingPage/FilterItem.tsx utils/listing/filterItemState.ts
git commit -m "perf(listing): FilterItem compute-once + extract pure url-state helpers"
```

---

## Task 9: Filter actions return data; `InfiniteScrollFilters` renders `FilterItem`

**Files:**
- Modify: `serverRequests/listing/index.tsx` (`GetNextPageFilters` 321-392; `GetFilters` 53-110)
- Modify: `components/ListingPage/filterComponents/InfiniteScrollFilters.tsx`

**Interfaces:**
- Consumes: `FilterItem` (Task 8), `FilterOption`/`GetFiltersResult` (Task 1).

- [ ] **Step 1: `GetNextPageFilters` returns raw arrays**

Replace the 5 `.map(... => <FilterItem/>)` blocks (322-390) with the raw arrays already computed in `new_filters` + `response.prices.priceRanges`:

```tsx
return {
  categories: new_filters?.categories ?? [],
  brands: new_filters?.brands ?? [],
  colors: new_filters?.colors ?? [],
  sizes: new_filters?.sizes ?? [],
  prices: response?.prices?.priceRanges ?? [],
  total_size: response?.total_size,
};
```

- [ ] **Step 2: `GetFilters` returns raw arrays**

Similarly replace the `<CategoryImageCircel/>` / `<ImageCircel/>` maps (53-107) with `new_filters.categories/brands/colors/sizes` raw arrays; keep `prices`/`total_size`. (Confirm `GetFilters`’ consumer — trace before changing; if it currently expects JSX, update that consumer too. If `GetFilters` has no live consumer, still return data for consistency and note it.)

- [ ] **Step 3: `InfiniteScrollFilters` maps to `<FilterItem>`**

In `InfiniteScrollFilters.tsx`:
- Change `filterItems` state to hold `any[]` data objects (init `[]`, not `[<Fragment/>]`).
- In `getNextFilters`, the `switch(term)` selects `response[term]` (now a data array); append with `setFilterItems((prev) => [...prev, ...filter_response])`.
- Render by mapping to `FilterItem` with the constants known client-side (`term`, `params`, `filterParams`, `currency`, `isRtl`, `baseUrlOfFiltersPage`, `isUsingParsedFilters`) that were previously baked server-side:

```tsx
{filterItems.map((item) => (
  <FilterItem
    key={item?.id ?? item?.slug ?? `${item?.min_price}-${item?.max_price}` ?? item}
    term={term}
    item={item}
    isRtl={isRtl}
    params={params}
    filterParams={filters}
    isUsingParsedFilters={true}
    baseUrlOfFiltersPage={baseUrlOfFiltersPage}
    currency={currency}
  />
))}
```

Pass the missing constants (`isRtl`, `baseUrlOfFiltersPage`, `isUsingParsedFilters`) as props from `FilterList` where `<InfiniteScrollFilters>` is mounted (FilterList.tsx ~730-740).

- [ ] **Step 4: Remove the now-unused `ProductWrapper` import** from `serverRequests/listing/index.tsx` (and any other import no longer rendered there).

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc --noEmit && pnpm build && pnpm start`
Manual: on `/en-gb/filters`, click "More From {category/brand}" → additional chips load and are clickable with correct URLs; end state stops loading; RTL intact.

- [ ] **Step 6: Commit**

```bash
git add serverRequests/listing/index.tsx components/ListingPage/filterComponents/InfiniteScrollFilters.tsx components/Server/FilterList.tsx
git commit -m "refactor(listing): filter actions return data; InfiniteScrollFilters renders FilterItem"
```

---

## Task 10: `FilterList.getItemData` — flatten tree once

**Files:**
- Modify: `components/Server/FilterList.tsx:155-174` (+ ActiveFiltersBar)

- [ ] **Step 1: Build a slug→node Map once**

At the top of `ActiveFiltersBar`, flatten `sourceCategories` (self + children + grandchildren) into `const categoryBySlug = new Map<string, any>()` once. Rewrite `getItemData({isCategory:true})` to look up by slug from the Map instead of re-flattening on each call. Also drop the redundant inner `if` that re-checks the `.filter(...)` predicate (67-82), and mutate the `reduce` accumulator instead of spreading (`acc[key]=…; return acc`) at 133-153.

- [ ] **Step 2: Verify**

Run: `pnpm build && pnpm start`
Manual: `/en-gb/filters` with several active filters → the active-filters bar shows the correct chips with correct labels + remove links; behavior unchanged.

- [ ] **Step 3: Commit**

```bash
git add components/Server/FilterList.tsx
git commit -m "perf(listing): FilterList flatten category tree once via Map"
```

---

## Task 11: `FiltersWindow` — selectors + split price state (Tier B)

**Files:**
- Modify: `components/ListingPage/filterComponents/FiltersWindow/index.tsx`

- [ ] **Step 1: Store selectors**

Replace bare `useAppStore()` (lines 23, 51) with selectors: `const filterEnabled = useAppStore((s) => s.filterEnabled);` and `const setFilterEnabled = useAppStore((s) => s.setFilterEnabled);` (and any other slice members individually).

- [ ] **Step 2: Split price state from chip state**

Separate the monolithic `filters` object (line 66) so a chip toggle doesn't re-render the price slider/chart: keep `selectedChips` and `priceRange` as distinct `useState`, and derive the combined object only when building the apply URL. Stabilize `InitialFiltersObject` (54-65) with `useRef`/`useMemo` keyed on `initialFilters`, and remove the double `JSON.stringify` compare (line 407) in favor of a single stable comparison.

- [ ] **Step 3: Verify**

Run: `pnpm build && pnpm start`
Manual: open the filter modal, toggle chips (categories/brands/colors/sizes), drag the price slider, Apply and Reset → all behave as before; only the changed section visibly updates; applied URL is correct; RTL intact.

- [ ] **Step 4: Commit**

```bash
git add components/ListingPage/filterComponents/FiltersWindow/index.tsx
git commit -m "perf(listing): FiltersWindow store selectors + split price/chip state"
```

---

## Task 12: Remove legacy store actions + `ProductWrapper` retirement check

**Files:**
- Modify: `store/listing/reducer.ts`, `store/index.ts`
- (Delete) `components/ServerWrapper/ProductWrapper/index.tsx` — ONLY if nothing imports it.

- [ ] **Step 1: Remove unused product store actions**

Delete `getProducts` / `getNextProducts` from `store/listing/reducer.ts` (and their state members if unused: confirm `products` slice member has no remaining consumers). Update `ListingState` type. Confirm via search that nothing references them (the audit found only the reducer + a spec doc).

- [ ] **Step 2: Retire `ProductWrapper` if orphaned**

Run a search for `ProductWrapper` imports. If ONLY `ProductButtonWrapper`/`ProductColorsBottomSheet`/`ProductPhotosWrapper` (the child files) remain and nothing imports `components/ServerWrapper/ProductWrapper` index, delete it. If any consumer remains (e.g. a boutique page not in this refactor's scope), leave it and note the remaining consumer.

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: clean. `pnpm knip` to confirm no new unused exports were introduced (informational).

- [ ] **Step 4: Commit**

```bash
git add store/listing/reducer.ts store/index.ts
git commit -m "chore(listing): remove legacy getProducts/getNextProducts store actions"
```

---

## Task 13: Full regression smoke + docs

**Files:**
- Modify: `docs/posthog-events.md` (only if any PostHog event changed — it should not)

- [ ] **Step 1: Cross-page manual regression**

On `pnpm start`, walk every surface in en (LTR) + ar (RTL), mobile (≤480px) + desktop:
- `/featured`, `/flashDeals`, `/filters`: initial grid, infinite scroll, filter bar, filter modal (toggle + price + apply + reset), "more from" chip pagination.
- Home Featured + Flash strips.
- PDP related-products scroll.
- Verify: no console errors, no hydration warnings, GA `VIEW_ITEMS_LIST` payloads unchanged, images lazy-load below the fold, flash/redeem timers tick and pause off-screen.

- [ ] **Step 2: Confirm analytics parity**

Diff GA event payloads (network tab) against `develop` for the same actions. If identical, no doc change. If a PostHog event was touched, update `docs/posthog-events.md`.

- [ ] **Step 3: Final gate**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all clean.

- [ ] **Step 4: Open PR (when the owner asks)**

Do not push/open a PR until the owner confirms. Then push `ticket/listing-refactor` and open a PR into `develop` summarizing: data-not-JSX refactor, one ProductCard, filter splits, Tier A+B perf. Link `docs/superpowers/specs/2026-07-01-listing-pages-refactor-design.md` and `docs/listing-perf-tier-c-followups.md`.

---

## Deferred (NOT in this plan)
Tier C — grid virtualization, ES-waterfall collapse (Gemini/children/price phase-2), caching layer, mobile-API over-fetch. See `docs/listing-perf-tier-c-followups.md`.
