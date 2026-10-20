/**
 * Single source for the Google Maps JS key used by the browser.
 *
 * The key comes from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only. There is no key
 * in the code: a literal cannot be rotated per environment and stays in git
 * history for ever. Maps JS keys are browser-visible by design, so the real
 * protection is the HTTP-referrer restriction on the key in Google Cloud.
 * With the setting empty, the map does not load and the address form still
 * saves (the pin is optional).
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/**
 * Shared loader id. `useJsApiLoader` keys its singleton on this id, so every
 * caller must pass the same one — two loaders with different ids on the same
 * page throw "Loader must not be called again with different options".
 */
export const GOOGLE_MAPS_LOADER_ID = "google-map-script";
