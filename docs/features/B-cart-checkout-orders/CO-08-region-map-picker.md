# CO-08 — Region / Map Picker

| | |
|---|---|
| **Feature ID** | CO-08 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟡 Partial — Need an API key for google map |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/SelectRegion.tsx`, `components/Cart/Map.tsx`, `components/Cart/MapElement.tsx`, `services/order.ts`, `serverRequests/product.tsx` |

---

## What it is

The **"where exactly"** part of adding a delivery address — a searchable **region picker** (province
/ district / town / street) plus an interactive **Google map** to drop a pin on the precise delivery
location. It feeds the address form (CO-07).

## Where it appears

Inside the **add/edit address form** at checkout: a "Change From List" row opens the region
bottom-sheet, and a "Locate Your Location On Map" control expands the map.

## Who uses it

Any shopper entering or refining a delivery address.

## How it works (verified behaviour)

- **Region picking is search-based, not a cascade.** The country is fixed from the store locale
  (flag + name, no selector). With the search empty, the sheet shows a **starter list of provinces**
  as tappable chips; typing (2+ chars, ~400 ms debounce) runs a location text-search. Picking a
  result fills the region details (city / province / town / street / building), builds the display
  string, and — if the result carries coordinates — recentres the map.
- **The map is Google Maps.** It starts collapsed and expands on tap. Initial centre is the selected
  country's coordinates (or a previously saved pin, else a Turkey-centroid default).
- **Dropping a pin.** Tapping the map (at zoom ≥ 10) captures latitude/longitude — but only if the
  point is **inside the country's boundary polygon** (fetched and drawn as a translucent overlay). A
  red marker renders at the chosen point.
- **Use my location.** A geolocation button pans to the device's current position, also validated
  against the country boundary.
- **No Google Places autocomplete** — the only text search is the platform's own location search.

## Data source

| Item | Value |
|------|-------|
| Location text-search | `POST /api/addresses/get-address-by-text` — `{ query }` → `results[]` |
| Province starter list | `GET /api/addresses/get-provinces-by-iso` |
| Country boundary polygon | `GET /api/addresses/CountryBoundaryByIso/{ISO}` |
| Country coordinates | `GET /countries` — `GetCountries` (Redis + `sessionStorage` cached) |
| Backend | Region/boundary calls → **Elasticsearch backend** (`NEXT_PUBLIC_ELASTIC_BACKEND_URL`); countries → core backend. (These `/api/addresses/*` are backend paths, not Next.js route handlers.) |

## Technical reference

| Item | Value |
|------|-------|
| Region sheet | `components/Cart/SelectRegion.tsx` (`SearchLocations`, `SearchResults`) |
| Map wrapper | `components/Cart/Map.tsx` (`ConfirmLocation`) |
| Google map | `components/Cart/MapElement.tsx` (`@react-google-maps/api`, dynamically imported, SSR off) |
| Boundary check | `google.maps.geometry.poly.containsLocation` |
| Service | `services/order.ts` — `GetProvinces`; `serverRequests/product.tsx` — `GetCountries` |
| Store | `store/Cart/reducer.ts` — `center`, `provinces`, `addressDetails.location` / `region` / `region_details`; `setMapCenter`, `setProvinces`, `setAddressDetails` |
| Request codes | `utils/Requests.ts` — `GET_ADDRESS_BY_TEXT`, `GET_PROVINCES`, `COUNTRY_MAP_BORDERS` |

## Current status & maturity

**Live and stable.** Region search, province chips, pin capture, boundary validation and geolocation
all work and populate the address form.

## Known gaps / notes

- ⚠️ **Expired Google Maps API key** right now the map-feature is off cause we need a paid api key for google map.
- **Boundary data Should be added for all supported country** — right now syria shows Homs Boundary and other countries has no boundries data. (it should been added before production)

## Related features

CO-07 (Shipping address — the form this feeds) · PF-04 (Multi-country storefront — supplies the
fixed country) · CO-19 (Change delivery address — reuses the picker).
