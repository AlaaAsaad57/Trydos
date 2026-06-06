import { General_Site_Data } from "./StructuredData/Constants";

/**
 * Build the `alternates` object (canonical + hreflang languages) for a page.
 *
 * Keeps the same country, swaps the language for each hreflang variant, and adds
 * an `x-default` pointing at the English variant. Extracted from the home metadata
 * builder so every route (static pages, listings, products) emits a consistent
 * hreflang cluster.
 *
 * @param locale     full `{country}-{language}` segment, e.g. "sy-en"
 * @param pathSuffix everything after the locale segment, e.g. "/about",
 *                   "/filters/categories/dresses" or "?mainCategory=shoes" ("" for the homepage)
 */
export function buildAlternates(locale: string, pathSuffix: string = "") {
  const [country, language = "en"] = locale.split("-");
  const baseUrl = General_Site_Data.url;
  const make = (lang: string) => `${baseUrl}/${country}-${lang}${pathSuffix}`;

  return {
    canonical: make(language),
    languages: {
      en: make("en"),
      ar: make("ar"),
      tr: make("tr"),
      ku: make("ku"),
      "x-default": make("en"),
    },
  };
}
