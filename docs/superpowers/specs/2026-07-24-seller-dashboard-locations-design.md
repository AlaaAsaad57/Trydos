# Seller Dashboard — Locations section (design)

> Source contract: `seller-dashboard-locations-api-contract.md` (base path
> `/api/v1/shop/locations`, backend PR #384, merged to `develop` pending release).

## Problem

The product editor already **consumes** a shop's locations (`lookups.locations`,
`LocationLookup`, `locationLabel` — product-level and per-variant selects), but a
seller has no way to **manage** them. Locations can only be created by an admin
today, so the selects are frequently empty.

## Scope

Full CRUD-minus-delete for shop locations inside the seller dashboard:

- **List** the current shop's locations, paginated, filterable by status and country.
- **Create** a location (name, country, address, latitude, longitude).
- **Edit** an existing location (same fields; status is *not* editable here).
- **Activate / deactivate** a location.

**No delete** — the API exposes none; a location is only ever deactivated, and
deactivating does not detach it from products that reference it.

### Out of scope

- Attaching locations to products (already shipped in the product editor).
- Per-location stock/inventory.
- Address autocomplete / reverse geocoding.

## Placement

A new `?tab=locations` tab in the existing dashboard page
(`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`):
sidebar entry, home tile, and a render branch — mirroring Gallery / Stories /
Shop Info. The list and the create/edit form are small enough that a dedicated
route (the products/boutiques pattern) would add navigation plumbing for no gain.

## Permissions

| Capability | Permission | When missing |
|---|---|---|
| See the tab + list | `READ_LOCATIONS` | tab hidden unless another location permission is held |
| "+ Add Location" | `CREATE_LOCATION` | button hidden |
| "Edit" | `UPDATE_LOCATION` | modal opens read-only |
| Activate / deactivate | `CHANGE_LOCATION_STATUS` | toggle hidden |

`SUPER_ADMIN` satisfies all four through the page's existing `hasPermission`.
A `LOCATIONS` entry is added to `PERMISSION_GROUPS` so the Permissions tab groups
these four instead of dropping them into `OTHER`.

**Contract wrinkle:** `GET /shop/locations/lookups` requires `CREATE_LOCATION`, so
a read-only user would get a 403 from it. Therefore:

- the **country filter** derives its options from the `country` objects on the
  locations already loaded — never from the lookups endpoint;
- **lookups are fetched only when the create modal opens**;
- the **edit modal** uses the `lookups.countries` returned inside its own
  `/{id}/edit` response.

## Data flow

All calls go through `services/sellerDashboard/index.ts` → `fetchData` with
`server: "market-dashboard"` and `sellerId` (which becomes `X-Seller-ID`).
`BACKEND_URL` already ends in `/api/v1`, so service URLs are written `/shop/...`,
matching every sibling `/shop/*` call. `/shop/*` is not gateway-allow-listed, so
these are served by the core backend.

| Method | Endpoint | Permission |
|---|---|---|
| `getShopLocations(sellerId, {status, countryId, page})` | `GET /shop/locations` | `READ_LOCATIONS` |
| `getShopLocationLookups(sellerId)` | `GET /shop/locations/lookups` | `CREATE_LOCATION` |
| `addShopLocation(sellerId, payload)` | `POST /shop/locations` | `CREATE_LOCATION` |
| `getShopLocationForEdit(sellerId, id)` | `GET /shop/locations/{id}/edit` | `READ_LOCATIONS` \| `UPDATE_LOCATION` |
| `updateShopLocation(sellerId, id, payload)` | `POST /shop/locations/{id}/update` | `UPDATE_LOCATION` |
| `changeShopLocationStatus(sellerId, id, status)` | `POST /shop/locations/{id}/change-status` | `CHANGE_LOCATION_STATUS` |

After a successful create or update the list refetches. A status toggle updates
that row in place from the response (`data.status`) rather than refetching.

## Components

`components/SellerDashboard/locations/`

- **`LocationsTab.tsx`** — section header + count, status and country filters,
  the card grid, `<Pagination>`, and the modal host. Each card shows name,
  address, country, an Active/Inactive pill, and Edit + toggle actions.
- **`LocationFormModal.tsx`** — one modal serving create and edit. Fields: name\*,
  country\*, address, map, latitude, longitude. Follows the
  `productEdit/GalleryPickerModal` shell (fixed overlay + rounded white panel).
- **`LocationMapPicker.tsx`** — `GoogleMap` + marker. Clicking the map drops the
  pin; a "use my current location" button mirrors the cart's map; choosing a
  country recenters the view. Latitude/longitude remain editable number inputs
  beneath the map, so the map is an aid and never a requirement — the contract
  makes both coordinates optional and a location may be saved without them.
- **`utils/mapsConfig.ts`** — single source for the Maps JS key
  (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, falling back to the key already shipping in
  the client bundle via `components/Cart/MapElement.tsx`, which hardcodes it).
  Note: that hardcoded literal is pre-existing; it is flagged, not propagated.
- **`ui/icons.tsx`** — one new `location` pin glyph (no map-pin icon exists yet).

## Validation & error handling

Client-side, before submit: `name` required (max 255), `country_id` required,
`latitude` ∈ [−90, 90], `longitude` ∈ [−180, 180].

Server-side, the envelope's `detailed_error[].code` **is the field name**, so a
422 binds directly to the matching form field. The important case is
`"The name has already been taken."` — names are unique *per shop per country*,
so editing either `name` or `country_id` clears it.

- **403** → `<AccessDenied>` (list) or an inline alert (mutations).
- **404** on edit → the location was removed or belongs to another shop
  (indistinguishable by design): close the modal and refetch the list.
- Everything reports through `LogError` and renders `<ErrorState onRetry>`,
  matching the sibling tabs.

`latitude` / `longitude` arrive as **decimal strings** (DB decimal columns) and
are `parseFloat`'d before being handed to the map.

## Internationalisation

Every new user-visible string is added to all three of
`public/translations/translations.{ar,tr,ku}.js` **before** it is used in code,
per the repo's i18n lint rule. `"Location"`, `"Country"`, `"Active"`,
`"Inactive"`, `"Name"`, `"Save Changes"`, `"Cancel"`, `"Search"` already exist and
are reused verbatim; `"Locations"`, `"Address"`, `"Latitude"`, `"Longitude"` and
the section's own copy are new.

## Verification

No test suite in this repo (by policy). Verification is `pnpm lint` (which
enforces translation parity) plus a type-check, and a manual pass through the
tab: list → filter → create → edit → toggle, including the duplicate-name 422.
