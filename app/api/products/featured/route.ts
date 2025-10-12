import { NextRequest, NextResponse } from "next/server";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";

export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const filters: any = {};
  try {
    const country = req.headers.get("country")?.trim() || "sy";
    let language = req.headers.get("language")?.trim();
    const lang = req.headers.get("lang")?.trim();
    language = language ?? lang ?? "en";

    const searchParams = req.nextUrl.searchParams;

    if (searchParams.get("category_slugs")) {
      filters.categories = parseArrayParam(searchParams.get("category_slugs"));
    }
    if (searchParams.get("boutique_slugs")) {
      filters.boutiques = parseArrayParam(searchParams.get("boutique_slugs"));
    }
    if (searchParams.get("brand_slugs")) {
      filters.brands = parseArrayParam(searchParams.get("brand_slugs"));
    }
    if (searchParams.get("colors")) {
      filters.colors = parseArrayParam(searchParams.get("colors"));
    }
    if (searchParams.get("tags_names")) {
      filters.tags_names = parseArrayParam(searchParams.get("tags_names"));
    }
    if (searchParams.get("price")) {
      filters.priceRange = parseNumberArrayOfPrices(searchParams.get("price"));
      filters.prices = parseNumberArrayOfPrices(searchParams.get("price"));
    }
    if (searchParams.get("flash-deal")) {
      filters.flashdeal = searchParams.get("flash-deal") === "true";
    }
    if (searchParams.get("search_text")) {
      filters.search_text = stripQuotes(searchParams.get("search_text"));
    }
    if (searchParams.get("attributes")) {
      const decoded = decodeValue(searchParams.get("attributes"));

      const clean = stripExtraQuotes(decoded);

      filters.sizes = JSON.parse(clean)?.[0]?.options;
    }

    filters.featured = true;

    const params = {
      limit: Number(searchParams.get("limit") || 20),
      search_after: searchParams.get("offset")
        ? parseNumberArray(searchParams.get("offset"))
        : [],
      filters,
      filters_offset: Number(searchParams.get("filters_offset") || 1),
      country,
      language_code: language,
    };
    const result = await getProductsAndFiltersFromElastic(params);

    return NextResponse.json(
      { data: result, appliedFilters: filters },
      { headers }
    );
  } catch (error: any) {
    let errorDesc = JSON.stringify(filters);
    return NextResponse.json(
      {
        error:
          `${error.message || "Unknown error"}----${errorDesc}` ||
          "Unknown error",
        appliedFilters: filters,
      },
      { status: 500, headers }
    );
  }
}

// --- Helpers ---
function decodeValue(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseArrayParam(value: string | null): string[] {
  const decoded = decodeValue(value);
  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.replace(/(^"|"$)/g, "").trim())
    .filter(Boolean);
}
function parseNumberArrayOfPrices(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .replaceAll('"', "")
    .split("-")
    .map((n) => Number(n.trim()));
}
function parseNumberArray(value: string | null): number[] {
  const decoded = decodeValue(value);

  if (!decoded) return [];
  return decoded
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => !isNaN(n));
}

function stripQuotes(value: string | null): string | undefined {
  const decoded = decodeValue(value);
  if (!decoded) return undefined;
  return decoded.replace(/^"|"$/g, "");
}

function stripExtraQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, "");
}
