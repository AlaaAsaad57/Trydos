# Seller Dashboard — Locations section — Implementation Plan

**Goal:** Add a `Locations` section to the seller dashboard: list (filter by status/country, paginated), create, edit, and activate/deactivate a shop's locations. No delete — the API has none.

**Architecture:** Six new methods on `SellerDashboardService` wrap `/shop/locations*`. A new `?tab=locations` tab in the dashboard page renders `components/SellerDashboard/locations/LocationsTab.tsx`, which owns the list/filters/pagination and hosts `LocationFormModal` (create + edit) — the modal embeds `LocationMapPicker` (Google Maps click-to-drop-pin) alongside editable lat/lng inputs.

**Design spec:** `docs/superpowers/specs/2026-07-24-seller-dashboard-locations-design.md`
**API contract:** `seller-dashboard-locations-api-contract.md`

## Global Constraints

- **No automated tests** — verify with `npx tsc --noEmit` and `pnpm lint`. Do NOT create test files.
- **Data-fetch path:** `utils/fetchData` with `{ url, method, server: "market-dashboard", reqTitle, sellerId }`. `sellerId` makes `fetchData` attach `X-Seller-ID` + `lang`. `BACKEND_URL` already ends in `/api/v1`, so URLs are written `/shop/locations` (no version prefix).
- **i18n is mandatory:** every user-visible string must exist in all three of `public/translations/translations.{ar,tr,ku}.js` **before** it is wrapped in `translateFunction`. Reuse existing keys verbatim; never invent a synonym for a key that exists.
- **Permission gating:** `READ_LOCATIONS` (view), `CREATE_LOCATION` (add + lookups), `UPDATE_LOCATION` (edit), `CHANGE_LOCATION_STATUS` (toggle); `SUPER_ADMIN` passes all via the page's `hasPermission`.
- **Lookups are `CREATE_LOCATION`-gated** — the country *filter* must derive its options from loaded locations, never from `/lookups`, or read-only users hit a 403.
- **Design tokens:** dashboard primary `#5d5d5d`, link `#388CFF`, danger `#f85555`, cards `rounded-[15px]`. Reuse `components/SellerDashboard/ui` primitives.
- **React Compiler is on** — no manual `useMemo`/`useCallback` without a profiled reason.
- `latitude`/`longitude` come back as **decimal strings**; `parseFloat` before use.

---

### Task 1: Translation keys

All new copy, added to the three translation files in one edit so they stay key-parallel.

**Files:** Modify `public/translations/translations.ar.js`, `.tr.js`, `.ku.js`

- [ ] **Step 1:** Add the new keys (already-present keys — `Location`, `Country`, `Active`, `Inactive`, `Name`, `Save Changes`, `Cancel`, `Search`, `Retry`, `Close`, `Edit` — are reused and must NOT be duplicated):
  `Locations`, `Add Location`, `Edit Location`, `Address`, `Latitude`, `Longitude`, `No locations found`, `Locations added to this shop will appear here.`, `Add your first location`, `Warehouses and pickup points for this shop`, `You don't have permission to view locations`, `Failed to load locations`, `Failed to save location`, `Failed to change location status`, `Location created successfully`, `Location updated successfully`, `Status changed successfully`, `Pick the position on the map`, `Use my current location`, `Location name`, `All statuses`, `All countries`, `Deactivate`, `Activate`, `Name is required`, `Country is required`, `Latitude must be between -90 and 90`, `Longitude must be between -180 and 180`, `Map is unavailable`, `Coordinates are optional`.

### Task 2: Service layer

**Files:** Modify `utils/Requests.ts`, `services/sellerDashboard/index.ts`

- [ ] **Step 1:** Append six `REQUESTS_DATA` entries with codes 207–212 (206 is the current max): `GET_SHOP_LOCATIONS`, `GET_SHOP_LOCATION_LOOKUPS`, `ADD_SHOP_LOCATION`, `GET_SHOP_LOCATION_FOR_EDIT`, `UPDATE_SHOP_LOCATION`, `CHANGE_SHOP_LOCATION_STATUS`.
- [ ] **Step 2:** Add a `---------- Shop Locations ----------` block to `SellerDashboardService` (after the boutique block, before `getLanguages`) with the six methods from the design's data-flow table. Mutations pass `noMessage: true` so the modal owns error presentation.

### Task 3: `location` icon

**Files:** Modify `components/SellerDashboard/ui/icons.tsx`

- [ ] **Step 1:** Add `"location"` to the `IconName` union and a map-pin path to `PATHS` (stroke-only, matching the set).

### Task 4: Maps key constant

**Files:** Create `utils/mapsConfig.ts`

- [ ] **Step 1:** Export `GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "<the key already hardcoded in components/Cart/MapElement.tsx>"`, with a comment flagging the pre-existing literal as something to rotate into env. Do not modify `MapElement.tsx`.

### Task 5: Map picker

**Files:** Create `components/SellerDashboard/locations/LocationMapPicker.tsx`

- [ ] **Step 1:** `useJsApiLoader({ id: "google-map-script", googleMapsApiKey: GOOGLE_MAPS_API_KEY, language })` — same loader id as the cart map (they never co-mount). Render `GoogleMap` + `Marker`; `onClick` reports `{lat, lng}` up. A floating button uses `navigator.geolocation`. Center: the current value → else a country-derived default → else a world view. Renders a bordered placeholder with `Map is unavailable` when the key is missing, so the form still works.

### Task 6: Create/edit modal

**Files:** Create `components/SellerDashboard/locations/LocationFormModal.tsx`

- [ ] **Step 1:** Modal shell copied from `productEdit/GalleryPickerModal` (fixed overlay + `rounded-[20px]` panel, Escape/backdrop close).
- [ ] **Step 2:** On open in `edit` mode, `getShopLocationForEdit` fills the form and supplies `lookups.countries`; in `create` mode, `getShopLocationLookups` supplies them.
- [ ] **Step 3:** Fields — name\*, country\* (select), address (textarea), map, latitude, longitude. Client validation per the design. Submit → `addShopLocation` / `updateShopLocation`; map `detailed_error[].code` onto per-field errors; on success call `onSaved()`.

### Task 7: Locations tab

**Files:** Create `components/SellerDashboard/locations/LocationsTab.tsx`

- [ ] **Step 1:** Load page 1 on mount; refetch when a filter or page changes. Status filter (`All statuses` / `Active` / `Inactive`) and country filter (options derived from loaded locations).
- [ ] **Step 2:** Card grid with name, address, country, status pill, Edit + Activate/Deactivate actions — each gated on its permission. `<Pagination>` driven by `meta`.
- [ ] **Step 3:** Empty / error / access-denied states via the `ui` primitives. Status toggle updates the row in place from the response; create/update refetch the current page.

### Task 8: Dashboard wiring

**Files:** Modify `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`

- [ ] **Step 1:** Add `"locations"` to `TabType` and `VALID_TABS`; add a `LOCATIONS` group to `PERMISSION_GROUPS`.
- [ ] **Step 2:** Add the `canViewLocations` / `canCreateLocation` / `canUpdateLocation` / `canChangeLocationStatus` flags.
- [ ] **Step 3:** Add the sidebar menu button, the home tile, and the `{activeTab === "locations" && ...}` render branch passing `sellerId` + the four flags.

### Task 9: Verify

- [ ] **Step 1:** `npx tsc --noEmit` clean.
- [ ] **Step 2:** `pnpm lint` clean (it enforces translation parity across ar/tr/ku).
