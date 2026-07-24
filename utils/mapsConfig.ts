/**
 * Single source for the Google Maps JS key used by the browser.
 *
 * SECURITY NOTE: `components/Cart/MapElement.tsx` hardcodes this key as a
 * literal, so it already ships in the client bundle today. It is repeated here
 * only as a fallback so that adding a map never *silently* breaks when the env
 * var is unset — the key should be rotated and served exclusively from
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS keys are browser-visible by design
 * and must be locked down with an HTTP-referrer restriction, not hidden).
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyCq5Gi3oBlQv5qbaX2w_piuYmXpGHVwxnM";

/**
 * Shared loader id. `useJsApiLoader` keys its singleton on this id, so every
 * caller must pass the same one — two loaders with different ids on the same
 * page throw "Loader must not be called again with different options".
 */
export const GOOGLE_MAPS_LOADER_ID = "google-map-script";
