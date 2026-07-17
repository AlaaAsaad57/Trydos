// Map app language codes to Intl locales. Kurdish (ku) resolves to Sorani
// (ckb) per product requirement; everything else passes through unchanged.
const LOCALE_MAP: Record<string, string> = { ku: "ckb" };

const toLocale = (language?: string) => LOCALE_MAP[language] || language || "en";

// Localized country name from a 2-letter ISO code in the given app language.
// Falls back: target language → English → raw code. Deliberately avoids the
// country-telephone-data package — this module is imported by the Zustand store
// and would drag the full country dataset into every page's client bundle.
// Intl.DisplayNames is available in Node (full ICU) and all evergreen browsers.
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
    // Intl unsupported for locale/code — fall through to the raw code.
  }
  return code;
};
