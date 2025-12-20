export function decodeValue(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseArrayParam(value: string | null): string[] {
  const decoded = decodeValue(value);
  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.replace(/(^"|"$)/g, "").trim())
    .filter(Boolean);
}
export function parseNumberArrayOfPrices(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .replaceAll('"', "")
    .split("-")
    .map((n) => Number(n.trim()));
}
export function parseNumberArray(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => !isNaN(n));
}

export function stripQuotes(value: string | null): string | undefined {
  const decoded = decodeValue(value);
  if (!decoded) return undefined;
  return decoded.replace(/^"|"$/g, "");
}

export function stripExtraQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, "");
}

export function NormalizeSearchParamsForSearchRequest({
  searchParams,
  isFeatured,
  isFlashDeal,
}) {
  let filters: any = {};
  if (searchParams.category_slugs) {
    filters.categories = parseArrayParam(searchParams.category_slugs);
  }
  if (searchParams.boutique_slugs) {
    filters.boutiques = parseArrayParam(searchParams.boutique_slugs);
  }
  if (searchParams.brand_slugs) {
    filters.brands = parseArrayParam(searchParams.brand_slugs);
  }
  if (searchParams.colors) {
    filters.colors = parseArrayParam(searchParams.colors);
  }
  if (searchParams.tags_names) {
    filters.tags_names = parseArrayParam(searchParams.tags_names);
  }
  if (searchParams.price) {
    filters.priceRange = parseNumberArrayOfPrices(searchParams.price);
    filters.prices = parseNumberArrayOfPrices(searchParams.price);
  }
  if (searchParams.flash_deal || isFlashDeal) {
    filters.flashdeal = searchParams.flash_deal === "true" || isFlashDeal;
  }
  if (searchParams.search_text) {
    filters.search_text = stripQuotes(searchParams.search_text);
  }
  if (searchParams.attributes) {
    const decoded = decodeValue(searchParams.attributes);

    const clean = stripExtraQuotes(decoded);

    filters.sizes = JSON.parse(clean)?.[0]?.options;
  }
  if (isFeatured) filters.featured = true;
  return filters;
}
