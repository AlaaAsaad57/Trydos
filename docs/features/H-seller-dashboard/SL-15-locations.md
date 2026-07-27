# SL-15 — Locations (warehouses & pickup points)

| | |
|---|---|
| **Feature ID** | SL-15 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/locations/LocationsTab.tsx`, `…/LocationFormModal.tsx`, `…/LocationMapPicker.tsx`, `services/sellerDashboard/index.ts`, `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` |

---

## What it is

The **Locations** tab of the seller dashboard — where a shop records the physical places its stock
sits or is collected from (warehouses, pickup points). Each location has a name, a country, an
optional street address and an optional map pin. Locations can then be attached to a product, and to
each individual product variant, in the product form (SL-04).

## Where it appears

- Inside the seller dashboard → **Locations** tab (`…/sellerDashboard/<sellerId>?tab=locations`).
- As the **Location** dropdown in the product form's General section, and as a per-row **Location**
  in the product's variant matrix (SL-04).

## Who uses it

**Sellers / shop staff** whose role includes any location permission. Each action is gated
separately: view (`READ_LOCATIONS`), add (`CREATE_LOCATION`), edit (`UPDATE_LOCATION`), and
activate/deactivate (`CHANGE_LOCATION_STATUS`).

## How it works (verified behaviour)

- **List.** Locations load as a paginated grid of cards. Each card shows the location name, an
  **Active** / **Inactive** pill, the address (or a dash when none is recorded) and a country chip.
- **Filter.** A single status filter — All statuses / Active / Inactive — which resets to page 1 when
  changed. Paging is server-driven and the Prev/Next control only appears when there is more than one
  page.
- **Add / edit** open the same modal form: **Name** (required), **Country** (required, chosen from a
  lookup list), **Address** (optional free text), and **Latitude / Longitude** (optional).
- **Map pin.** The form embeds a Google map — clicking it drops a pin and fills the latitude and
  longitude fields (to 6 decimal places), and a "use my location" control can centre it on the
  browser's current position. The two coordinate fields stay hand-editable, and a location may be
  saved with no coordinates at all.
- **Validation:** name and country are required; latitude must be between −90 and 90 and longitude
  between −180 and 180. A duplicate-name rejection from the server clears as soon as either the name
  or the country is changed.
- **Activate / deactivate** flips the status straight from the card, and the row is updated in place
  from the server's response rather than reloading the page.
- **There is no delete.** The API exposes none — a location can only ever be **deactivated**, and
  deactivating it does **not** detach it from products that already reference it.
- **Permission-aware loading.** A user with only `UPDATE_LOCATION` never touches the lookups endpoint
  (which is create-gated) — the edit response carries its own country list.

## Data source

| Item | Value |
|------|-------|
| List | `getShopLocations(sellerId, {status, page})` → **GET `/shop/locations`** (`market-dashboard`), reads `data.locations` + `data.meta` |
| Create form lookups | `getShopLocationLookups(sellerId)` → **GET `/shop/locations/lookups`** (countries) |
| Create | `addShopLocation(sellerId, payload)` → **POST `/shop/locations`** |
| Load one for edit | `getShopLocationForEdit(sellerId, locationId)` → **GET `/shop/locations/{id}/edit`** |
| Update | `updateShopLocation(sellerId, locationId, payload)` → **POST `/shop/locations/{id}/update`** |
| Activate / deactivate | `changeShopLocationStatus(sellerId, locationId, status)` → **POST `/shop/locations/{id}/change-status`** |
| Delete | *none — no endpoint exists* |

## Technical reference

| Item | Value |
|------|-------|
| Tab | `page.tsx` → `activeTab === "locations"` → `<LocationsTab>` |
| Components | `components/SellerDashboard/locations/{LocationsTab,LocationFormModal,LocationMapPicker,types}.tsx` |
| Map | `@react-google-maps/api` via `utils/mapsConfig.ts` (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, shared loader id) |
| Permission group | `LOCATIONS` = `READ_LOCATIONS / CREATE_LOCATION / UPDATE_LOCATION / CHANGE_LOCATION_STATUS` (or `SUPER_ADMIN`) |
| State | Local `useState` in the tab (no store slice); page/status held in the component |

## Current status & maturity

Live and complete for what the API offers: list, filter, page, create, edit and activate/deactivate,
all permission-gated, with the location then selectable on a product and on each variant.

## Known gaps / notes

- **No delete, by design of the API.** Deactivating is the only removal, and a deactivated location
  stays attached to products that already point at it.
- ⚠️ The Google Maps browser key falls back to a **hardcoded literal** when
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset (the same key `components/Cart/MapElement.tsx` already
  ships in the client bundle). Maps JS keys are browser-visible by design, but this one should be
  rotated and locked to an HTTP-referrer restriction, and served only from the env var.
- Locations are not shown to shoppers anywhere — this is a back-office record only.

## Related features

SL-04 (Product editing — consumes locations on the product and per variant) · SL-03 (Product
management) · SL-07 (Orders & fulfillment) · SL-14 (Roles & permissions viewer).
