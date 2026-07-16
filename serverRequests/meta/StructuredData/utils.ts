import { trydosTranslations } from "../constants-meta";

const localeMap: Record<string, string> = {
  "sy-ar": "ar-SY",
  "sy-en": "en-SY",
  "sy-tr": "tr-SY",
  "sy-ku": "ku-SY",

  "tr-ar": "ar-TR",
  "tr-en": "en-TR",
  "tr-tr": "tr-TR",
  "tr-ku": "ku-TR",

  "iq-ar": "ar-IQ",
  "iq-en": "en-IQ",
  "iq-tr": "tr-IQ",
  "iq-ku": "ku-IQ",

  "lb-ar": "ar-LB",
  "lb-en": "en-LB",
  "lb-tr": "tr-LB",
  "lb-ku": "ku-LB",

  // gb is the default country (see proxy.ts) — map it so the fallback locale resolves
  // to a real BCP47 tag instead of warning and defaulting to en-US.
  "gb-ar": "ar-GB",
  "gb-en": "en-GB",
  "gb-tr": "tr-GB",
  "gb-ku": "ku-GB",
};

export function mapLocaleToBCP47(locale: string): string {
  const mapped = localeMap[locale.toLowerCase()];
  if (!mapped) {
    console.warn(`Locale "${locale}" not mapped. Defaulting to en-US.`);
    return "en-US";
  }
  return mapped;
}

export function mapCurrencyToSymbol(countryIso: string): string {
  // Mapping ISO 4217 codes to their respective symbols
  const currencyMap: Record<string, string> = {
    us: "USD", // US Dollar
    gb: "USD", // Mapped to USD per your instruction
    sy: "SYP", // Syrian Pound
    lb: "LBP", // Lebanese Pound
    tr: "TRY", // Turkish Lira
    iq: "IQD", // Iraqi Dinar
  };

  // Convert input to lowercase to ensure the lookup is case-insensitive
  const code = countryIso.toLowerCase();

  // schema.org priceCurrency requires an ISO 4217 code, never a symbol.
  // Fall back to USD (same as the gb default) for unmapped countries.
  return currencyMap[code] || "USD";
}

export const getTitleAndTargetofListing = ({
  filters,
  filtersData,
  language,
}) => {
  let translations = trydosTranslations?.[language] ?? trydosTranslations?.en;
  let title = [translations?.siteName];
  let path = `/filters`;
  if (filters?.boutiques) {
    title.push(
      filtersData?.boutiques?.find((b) => b.slug === filters.boutiques?.[0])
        ?.name,
    );
  }
  if (filters?.categories) {
    title.push(
      filtersData?.categories?.find((c) => c.slug === filters.categories?.[0])
        ?.name,
    );
  }
  if (filters?.brands) {
    title.push(
      filtersData?.brands?.find((b) => b.slug === filters.brands?.[0])?.name,
    );
  }
  let pagePath = buildParamsFromFilters({
    categories: filters?.categories,
    boutiques: filters?.boutiques,
    brands: filters?.brands,
  });
  if (pagePath?.length) path += `/${pagePath.join("/")}`;
  return {
    title,
    path,
  };
};

export const buildParamsFromFilters = (
  filters: Record<string, string[]>,
): string[] => {
  const params: string[] = [];
  const filterOrder = [
    "boutiques",
    "tags_names",
    "categories",
    "brands",
    "colors",
    "sizes",
    "prices",
  ];

  filterOrder.forEach((filterType) => {
    const values = filters[filterType];
    if (values && values.length > 0) {
      // Add filter type
      params.push(filterType);

      // Add values
      if (filterType === "colors") {
        // Colors should be hex without #
        const colorValues = values.map((color) =>
          color.startsWith("#") ? color.substring(1) : color,
        );
        params.push(colorValues.join(","));
      } else {
        // Other filters are comma-separated
        params.push(values.join(","));
      }
    }
  });

  return params;
};
