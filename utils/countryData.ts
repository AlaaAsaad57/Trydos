import { allCountries } from "country-telephone-data";

// Map app language codes to Intl locales. Kurdish (ku) resolves to Sorani
// (ckb) per product requirement; everything else passes through unchanged.
const LOCALE_MAP: Record<string, string> = { ku: "ckb" };

const toLocale = (language?: string) => LOCALE_MAP[language] || language || "en";

// English-only lookup via country-telephone-data. Kept as the final fallback
// and for callers that have no language context.
export const getCountryNameByIso2 = (iso2: string): string => {
  const countries = allCountries;
  return countries.find((s) => s.iso2 === iso2)?.name || iso2;
};

// Localized country name from a 2-letter ISO code in the given app language.
// Falls back: target language → English → country-telephone-data → raw code.
// This is the single source of truth for displaying country names.
export const getLocalizedCountryName = (
  iso2?: string,
  language = "en",
): string => {
  if (!iso2) return "";
  const code = iso2.toUpperCase();
  try {
    const name =
      new Intl.DisplayNames([toLocale(language)], { type: "region" }).of(code) ||
      new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    if (name && name !== code) return name;
  } catch {
    // Intl unsupported for locale/code — fall through to package lookup.
  }
  return getCountryNameByIso2(iso2.toLowerCase());
};
