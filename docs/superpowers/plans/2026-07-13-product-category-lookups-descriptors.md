# Dynamic Category Lookups + Descriptors Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the seller-dashboard product editor, fetch category-branch lookups (sub-categories, sub-sub-categories, descriptor groups) on every category selection change, merge them across all selected categories, and add a new Descriptors section whose selections are saved.

**Architecture:** A new `getCategoryLookups` service method calls the cascading-lookup endpoint. `ProductEditor` holds a per-category-id lookup cache; a `syncCategoryLookups` routine (race-guarded) fetches on any category-id change, merges/dedupes the three cascading arrays over the base lookups, and prunes now-invalid selections. A new `DescriptorsSection` renders merged descriptor groups as multi-select chips bound to a new `form.descriptor_ids` array, sent as `descriptor_ids[]` (only when non-empty).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, TailwindCSS 4. Client-side fetches via `utils/fetchData`. Design spec: `docs/superpowers/specs/2026-07-13-product-category-lookups-descriptors-design.md`.

## Global Constraints

- **No automated tests** — this repo has no test suite. Verify with `npx tsc --noEmit` (types) and `pnpm lint` (ESLint). Do NOT create test files.
- **Data-fetch path:** client services use `utils/fetchData` with `{ url, method, server, reqTitle, sellerId }`; `server: "market-dashboard"` for shop endpoints. `sellerId` makes `fetchData` attach `X-Seller-ID` + `lang`.
- **Endpoint:** `GET /shop/products/categories/{categoryId}/lookups` → envelope `{ data: { sub_categories, sub_sub_categories, descriptor_groups } }`. Empty arrays are valid, not errors.
- **Save-safety rule:** append `descriptor_ids[]` to the payload ONLY when `form.descriptor_ids.length > 0` (edit response returns no pre-selected descriptors; always-sending would risk clearing them server-side).
- **Assumed payload key:** `descriptor_ids[]` (flat), mirroring `category_id[]` / `tags_ids[]`.
- **Design language:** reuse existing `Section` / `Chip` / `toggleId` primitives in `sections.tsx`; dashboard grey `#5d5d5d`, muted hint `#b8b8b8`. Wrap all UI strings in `t(...)`.
- **React Compiler is on** — no manual `useMemo`/`useCallback` without a profiled reason.

---

### Task 1: Category-lookups service method

Adds the request title and the service call to the cascading-lookup endpoint. Self-contained; nothing renders it yet.

**Files:**
- Modify: `utils/Requests.ts` (append to `REQUESTS_DATA`, after `ADD_PRODUCT` at line ~268)
- Modify: `services/sellerDashboard/index.ts` (add method after `getProductCreateForm`, ~line 842)

**Interfaces:**
- Produces: `SellerDashboardService.getCategoryLookups(sellerId: string, categoryId: string | number): Promise<{ sub_categories: any[]; sub_sub_categories: any[]; descriptor_groups: any[] }>` — returns the `data` object with the three arrays defaulted to `[]`.

- [ ] **Step 1: Add the request title**

In `utils/Requests.ts`, inside the `REQUESTS_DATA` object, immediately after the `ADD_PRODUCT` line, add:

```ts
  ADD_PRODUCT: { reqTitle: "ADD_PRODUCT", code: 189 },
  GET_CATEGORY_LOOKUPS: { reqTitle: "GET_CATEGORY_LOOKUPS", code: 190 },
};
```

(The `};` already exists — insert the new line above it.)

- [ ] **Step 2: Add the service method**

In `services/sellerDashboard/index.ts`, directly after the `getProductCreateForm` method (before `addProduct`), add:

```ts
  // GET /shop/products/categories/{categoryId}/lookups — UPDATE_PRODUCT | SUPER_ADMIN
  // Cascading lookups for a category branch: its sub_categories, the branch's
  // sub_sub_categories, and the branch's descriptor_groups (deduped server-side).
  // Empty arrays are a valid result (a leaf category with no children / groups).
  async getCategoryLookups(sellerId: string, categoryId: string | number) {
    const res = await fetchData({
      url: `/shop/products/categories/${categoryId}/lookups`,
      method: "GET",
      server: "market-dashboard",
      reqTitle: REQUESTS_DATA.GET_CATEGORY_LOOKUPS,
      sellerId,
    });
    if (!res?.success) {
      throw new Error(res?.message || "Failed to load category lookups");
    }
    const d = res.data || {};
    return {
      sub_categories: d.sub_categories || [],
      sub_sub_categories: d.sub_sub_categories || [],
      descriptor_groups: d.descriptor_groups || [],
    };
  }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `Requests.ts` or `services/sellerDashboard/index.ts`.

- [ ] **Step 4: Commit**

```bash
git add utils/Requests.ts services/sellerDashboard/index.ts
git commit -m "feat(seller-dashboard): add getCategoryLookups service method"
```

---

### Task 2: Form types, descriptor state, and payload

Adds the `descriptor_ids` field and the typed descriptor lookups, and wires descriptors through `emptyProductForm`, `buildFormFromEdit`, `buildUpdateFormData`, and `buildDiff`. Still no UI — this is the data layer.

**Files:**
- Modify: `components/SellerDashboard/productEdit/helpers.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `interface DescriptorLookup { id: number; name: string; descriptor_group_id: number }`
  - `interface DescriptorGroup { id: number; name: string; descriptors: DescriptorLookup[] }`
  - `Lookups.descriptor_groups: DescriptorGroup[]` (was `any[]`)
  - `ProductForm.descriptor_ids: number[]`
  - `buildUpdateFormData` emits `descriptor_ids[]` when non-empty.
  - `buildDiff` emits a `"Descriptors"` count row when `descriptor_ids` changed.

- [ ] **Step 1: Add descriptor lookup types**

In `helpers.ts`, after the `NamedLookup` interface (~line 44), add:

```ts
export interface DescriptorLookup {
  id: number;
  name: string;
  descriptor_group_id: number;
}
export interface DescriptorGroup {
  id: number;
  name: string;
  descriptors: DescriptorLookup[];
}
```

- [ ] **Step 2: Type the lookups field**

In the `Lookups` interface, change:

```ts
  descriptor_groups: any[];
```
to:
```ts
  descriptor_groups: DescriptorGroup[];
```

- [ ] **Step 3: Add the form field**

In the `ProductForm` interface, after `tags_ids: number[];` (~line 131), add:

```ts
  descriptor_ids: number[];
```

- [ ] **Step 4: Default it in `emptyProductForm`**

In `emptyProductForm()`, after `tags_ids: [],`, add:

```ts
    descriptor_ids: [],
```

- [ ] **Step 5: Default it in `buildFormFromEdit`**

In the object returned by `buildFormFromEdit`, after `tags_ids: [...(product.tags_ids || [])],`, add (the edit response carries no saved descriptors — start empty):

```ts
    descriptor_ids: [],
```

- [ ] **Step 6: Emit `descriptor_ids[]` in the payload (non-empty only)**

In `buildUpdateFormData`, directly after the `form.tags_ids.forEach(...)` line (~line 607), add:

```ts
  // Only send descriptors when the seller actually has selections. The edit
  // response returns no saved descriptors, so an always-sent empty array would
  // risk clearing existing server-side descriptor selections on unrelated saves.
  if (form.descriptor_ids.length > 0) {
    form.descriptor_ids.forEach((id) =>
      fd.append("descriptor_ids[]", String(id)),
    );
  }
```

- [ ] **Step 7: Show descriptors in the change-diff**

In `buildDiff`, after the `tags_ids` diff block (~line 737-738), add:

```ts
  if (!eqArr(initial.descriptor_ids, current.descriptor_ids))
    cnt("Descriptors", initial.descriptor_ids, current.descriptor_ids);
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (Consumers still compile — `descriptor_ids` is only read where added.)

- [ ] **Step 9: Commit**

```bash
git add components/SellerDashboard/productEdit/helpers.ts
git commit -m "feat(seller-dashboard): add descriptor_ids form state and payload"
```

---

### Task 3: DescriptorsSection UI + busy prop

Adds the new section component and a `busy` flag on `SectionProps` so the Categories and Descriptors cards can show a loading state.

**Files:**
- Modify: `components/SellerDashboard/productEdit/sections.tsx`

**Interfaces:**
- Consumes: `DescriptorGroup` (Task 2), `form.descriptor_ids` (Task 2), existing `Section`, `Chip`, `toggleId`, `SectionProps`.
- Produces:
  - `SectionProps.busy?: boolean`
  - `export function DescriptorsSection(props: SectionProps)` — renders `lookups.descriptor_groups` as multi-select chips bound to `form.descriptor_ids`.
  - `CategoriesSection` and `DescriptorsSection` both dim + disable their chips while `busy`.

- [ ] **Step 1: Add `busy` to SectionProps**

In `sections.tsx`, add to the `SectionProps` interface (after `canUseGallery?: boolean;`):

```ts
  busy?: boolean;
```

- [ ] **Step 2: Show busy state on CategoriesSection**

Replace the `CategoriesSection` signature and `Section` wrapper so it reads `busy` and dims while loading. Change the function signature line:

```ts
export function CategoriesSection({ form, patch, lookups, disabled, busy }: SectionProps) {
```

Inside `group(...)`, disable chips while busy by changing the `Chip`'s `disabled` prop from `disabled` to `disabled || busy`:

```ts
            <Chip key={c.id} active={selected.includes(c.id)} disabled={disabled || busy} onClick={() => patch({ [key]: toggleId(selected, c.id) } as any)}>
```

Wrap the returned `<Section ...>`'s inner `<div className="space-y-5">` with a relative container that shows a spinner overlay when busy. Replace:

```ts
      <div className="space-y-5">
        {group("Main Categories", lookups.parent_categories || [], form.category_id, "category_id")}
        {group("Sub Categories", lookups.sub_categories || [], form.sub_category_id, "sub_category_id")}
        {group("Sub-sub Categories", lookups.sub_sub_categories || [], form.sub_sub_category_id, "sub_sub_category_id")}
      </div>
```
with:
```ts
      <div className="relative">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-[12px]">
            <span className="text-[12px] medium text-[#5d5d5d]">{t("Loading…")}</span>
          </div>
        )}
        <div className={`space-y-5 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {group("Main Categories", lookups.parent_categories || [], form.category_id, "category_id")}
          {group("Sub Categories", lookups.sub_categories || [], form.sub_category_id, "sub_category_id")}
          {group("Sub-sub Categories", lookups.sub_sub_categories || [], form.sub_sub_category_id, "sub_sub_category_id")}
        </div>
      </div>
```

- [ ] **Step 3: Add DescriptorsSection**

In `sections.tsx`, immediately after `CategoriesSection` (after its closing `}`), add:

```ts
export function DescriptorsSection({ form, patch, lookups, disabled, busy }: SectionProps) {
  const groups = lookups.descriptor_groups || [];
  return (
    <Section icon="permissions" title="Attributes" desc="Attributes for the selected categories. All optional.">
      <div className="relative">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-[12px]">
            <span className="text-[12px] medium text-[#5d5d5d]">{t("Loading…")}</span>
          </div>
        )}
        <div className={`space-y-5 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {groups.length === 0 ? (
            <p className="text-[12px] text-[#b8b8b8]">{t("Select a category to see its attributes.")}</p>
          ) : (
            groups.map((g) => (
              <div key={g.id}>
                <p className="text-[13px] medium text-[#505050] mb-2">{g.name}</p>
                {(g.descriptors || []).length === 0 ? (
                  <p className="text-[12px] text-[#b8b8b8]">{t("No options available.")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {g.descriptors.map((d) => (
                      <Chip key={d.id} active={form.descriptor_ids.includes(d.id)} disabled={disabled || busy} onClick={() => patch({ descriptor_ids: toggleId(form.descriptor_ids, d.id) })}>
                        {d.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: no new errors. `DescriptorsSection` is exported but not yet rendered (that's Task 4) — that is fine.

- [ ] **Step 5: Commit**

```bash
git add components/SellerDashboard/productEdit/sections.tsx
git commit -m "feat(seller-dashboard): add Descriptors section and busy state"
```

---

### Task 4: Wire lookup cache + fetch-on-change in ProductEditor

The integration task: a per-category-id cache, the race-guarded `syncCategoryLookups` fetch/merge/prune routine, a `catLoading` flag, and rendering `DescriptorsSection` with `busy`.

**Files:**
- Modify: `components/SellerDashboard/productEdit/ProductEditor.tsx`

**Interfaces:**
- Consumes: `SellerDashboardService.getCategoryLookups` (Task 1); `DescriptorsSection` (Task 3); `CategoryLookup`, `DescriptorGroup`, `Lookups`, `ProductForm` (Task 2); `busy` prop (Task 3).
- Produces: nothing consumed downstream (final task).

- [ ] **Step 1: Import DescriptorsSection and the lookup types**

In `ProductEditor.tsx`, add `DescriptorsSection` to the import from `./sections` (the block ~line 32-44):

```ts
  CategoriesSection,
  DescriptorsSection,
  ClassificationSection,
```

And add `CategoryLookup` and `DescriptorGroup` to the import from `./helpers` (~line 20-31):

```ts
  buildDiff,
  buildFormFromEdit,
  buildUpdateFormData,
  CategoryLookup,
  DescriptorGroup,
  DiffEntry,
```

- [ ] **Step 2: Add cache ref + loading state**

Immediately after the existing `useRouter()` line (~line 79) and the other `useState` declarations, add near the other state (e.g. after the `uploading` state ~line 102):

```ts
  // Per-category-id cache of cascading lookups; merged over base lookups on
  // every category-selection change. Deselecting a category drops its entry.
  const catCache = useRef<
    Map<
      number,
      {
        sub_categories: CategoryLookup[];
        sub_sub_categories: CategoryLookup[];
        descriptor_groups: DescriptorGroup[];
      }
    >
  >(new Map());
  const catSeq = useRef(0); // race guard: only the latest sync applies
  const baseLookups = useRef<Lookups | null>(null); // lookups from /edit, pre-merge
  const [catLoading, setCatLoading] = useState(false);
```

Add `useRef` to the React import at the top (`import React, { useEffect, useMemo, useRef, useState } from "react";`).

- [ ] **Step 3: Capture base lookups on load**

In `load()`, right after each `setLookups(lk);` call (there are two — the create branch ~line 156 and the edit branch ~line 171), also reset the cache and remember the base lookups. Replace each `setLookups(lk);` with:

```ts
      baseLookups.current = lk;
      catCache.current = new Map();
      setLookups(lk);
```

- [ ] **Step 4: Add the sync routine**

After the `patch` definition (~line 191-192), add the merge/fetch/prune routine:

```ts
  // Merge every cached category-branch lookup over the base lookups, dedupe by
  // id (descriptor groups by group id, descriptors within a group by id), and
  // return the merged Lookups. Base parent_categories/boutiques/brands/etc. are
  // preserved; only the three cascading arrays are replaced by the union.
  //
  // Bucket each response by the queried id's LEVEL (we fire on every level):
  // the endpoint returns a category's DIRECT children under `sub_categories`.
  // So a MAIN id's `sub_categories` are true sub-categories and its
  // `sub_sub_categories` are grandchildren; a SUB id's `sub_categories` are
  // actually sub-sub categories. Bucketing by level keeps items from being
  // mislabeled. Descriptors are branch-wide and always merged.
  const mergeLookups = (
    mainIds: Set<number>,
    subIds: Set<number>,
  ): Lookups => {
    const base = baseLookups.current as Lookups;
    const subs = new Map<number, CategoryLookup>();
    const subSubs = new Map<number, CategoryLookup>();
    const groups = new Map<number, DescriptorGroup>();
    for (const [id, entry] of catCache.current.entries()) {
      if (mainIds.has(id)) {
        for (const s of entry.sub_categories) subs.set(s.id, s);
        for (const s of entry.sub_sub_categories) subSubs.set(s.id, s);
      } else if (subIds.has(id)) {
        for (const s of entry.sub_categories) subSubs.set(s.id, s);
      }
      // (sub-sub ids contribute descriptors only — they are leaves)
      for (const g of entry.descriptor_groups) {
        const existing = groups.get(g.id);
        if (!existing) {
          groups.set(g.id, { ...g, descriptors: [...(g.descriptors || [])] });
        } else {
          const seen = new Set(existing.descriptors.map((d) => d.id));
          for (const d of g.descriptors || [])
            if (!seen.has(d.id)) existing.descriptors.push(d);
        }
      }
    }
    return {
      ...base,
      sub_categories: [...subs.values()],
      sub_sub_categories: [...subSubs.values()],
      descriptor_groups: [...groups.values()],
    };
  };

  // Fetch lookups for every newly-selected category id (across all levels), drop
  // deselected ones, then merge and prune now-invalid sub / sub-sub / descriptor
  // selections.
  const syncCategoryLookups = async (
    mainArr: number[],
    subArr: number[],
    subSubArr: number[],
  ) => {
    if (!baseLookups.current) return;
    const selectedIds = [...mainArr, ...subArr, ...subSubArr];
    const wanted = new Set(selectedIds);
    // Drop cache entries for deselected categories.
    for (const id of [...catCache.current.keys()])
      if (!wanted.has(id)) catCache.current.delete(id);
    const missing = selectedIds.filter((id) => !catCache.current.has(id));

    const seq = ++catSeq.current;
    if (missing.length) setCatLoading(true);
    try {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            return { id, data: await SellerDashboardService.getCategoryLookups(sellerId, id) };
          } catch (e: any) {
            LogError({
              scenario: "ProductEditor.getCategoryLookups",
              error: e instanceof Error ? e.message : String(e),
              categoryId: id,
            });
            return { id, data: { sub_categories: [], sub_sub_categories: [], descriptor_groups: [] } };
          }
        }),
      );
      if (seq !== catSeq.current) return; // superseded by a newer selection
      for (const r of results) catCache.current.set(r.id, r.data as any);

      const merged = mergeLookups(new Set(mainArr), new Set(subArr));
      const subIds = new Set(merged.sub_categories.map((s) => s.id));
      const subSubIds = new Set(merged.sub_sub_categories.map((s) => s.id));
      const descIds = new Set(
        merged.descriptor_groups.flatMap((g) => (g.descriptors || []).map((d) => d.id)),
      );
      setLookups(merged);
      setForm((prev) =>
        prev
          ? {
              ...prev,
              sub_category_id: prev.sub_category_id.filter((id) => subIds.has(id)),
              sub_sub_category_id: prev.sub_sub_category_id.filter((id) => subSubIds.has(id)),
              descriptor_ids: prev.descriptor_ids.filter((id) => descIds.has(id)),
            }
          : prev,
      );
    } finally {
      if (seq === catSeq.current) setCatLoading(false);
    }
  };
```

- [ ] **Step 5: Trigger the sync on category-id changes**

After the existing `useEffect` that calls `load()` (~line 186-189), add a new effect keyed on the selected category ids across all three levels:

```ts
  const catKey = form
    ? [...form.category_id, ...form.sub_category_id, ...form.sub_sub_category_id].join(",")
    : "";
  useEffect(() => {
    if (!form || !baseLookups.current) return;
    syncCategoryLookups(
      form.category_id,
      form.sub_category_id,
      form.sub_sub_category_id,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey]);
```

- [ ] **Step 6: Pass `busy` and render DescriptorsSection**

In the `sectionProps` object (~line 385-397), add:

```ts
    busy: catLoading,
```

In the render block, add `<DescriptorsSection {...sectionProps} />` immediately after `<CategoriesSection {...sectionProps} />` (~line 518):

```tsx
      <CategoriesSection {...sectionProps} />
      <DescriptorsSection {...sectionProps} />
      <ClassificationSection {...sectionProps} />
```

- [ ] **Step 7: Typecheck + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: no new errors.

- [ ] **Step 8: Manual verification (dev server)**

Run: `pnpm dev`, open a seller product editor, enter edit mode.
Expected behavior:
- Toggling a main category shows the "Loading…" overlay on the Categories + Attributes cards, then populates Sub / Sub-sub chips and the Attributes (descriptor) groups.
- Selecting a second main category merges (does not replace) both branches' options.
- Deselecting a category removes only its contributed sub / sub-sub / attribute options, and any now-invalid selected chips clear.
- Picking attribute chips then Save shows a "Descriptors" row in the confirm dialog; saving succeeds. With no attributes picked, no `descriptor_ids[]` is sent.

- [ ] **Step 9: Commit**

```bash
git add components/SellerDashboard/productEdit/ProductEditor.tsx
git commit -m "feat(seller-dashboard): fetch and merge category lookups on selection, render descriptors"
```

---

## Notes for the implementer

- **Line numbers are approximate** — they reflect the files at plan time. Anchor edits on the quoted surrounding code, not the line number.
- **`server: "market-dashboard"`** is required on the fetch; without it the request won't hit the shop backend with the seller headers.
- **Do not** add `descriptor_ids[]` unconditionally — the non-empty guard is a deliberate data-safety measure (see spec §5 / §6).
- **Backend follow-ups (not this plan):** a `selected_descriptors` field on `/products/{id}/edit` for pre-selection + clearing, and confirmation of the `descriptor_ids[]` payload key.
