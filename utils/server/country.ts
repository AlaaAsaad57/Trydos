import { getLocalizedCountryName } from "utils/countryData";

// Resolve a country ISO code (e.g. "TR") to its localized name in the given
// language. Delegates to the shared resolver so behaviour (incl. ku → Sorani)
// stays consistent everywhere. Kept out of utils/server/index.tsx so client
// components can import it without pulling the translation tables.
export function countryNameFromIso(iso?: string, language = "en"): string {
  if (!iso) return null;
  return getLocalizedCountryName(iso, language) || iso.toUpperCase();
}
