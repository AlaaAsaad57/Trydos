/** Shapes returned by the shop-locations endpoints (see the Shop Locations
 *  contract). `latitude`/`longitude` are DB decimal columns and arrive as
 *  strings — parse them before doing arithmetic. */

export interface LocationCountry {
  id: number;
  name?: string;
  nicename?: string;
}

/** A country as offered by the create/edit lookups (the full country object,
 *  same source as the boutique lookups). */
export interface CountryOption {
  id: number;
  name?: string;
  nicename?: string;
  iso?: string;
}

export interface ShopLocation {
  id: number;
  name: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  status: 0 | 1;
  country: LocationCountry | null;
  created_at?: string;
}

export interface LocationsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more_pages: boolean;
}
