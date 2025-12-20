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

    const result = await getProductsAndFiltersFromElastic(params);

    return NextResponse.json(
      { data: result, appliedFilters: filters },
      { headers }
    );
  } catch (error: any) {
    let errorDesc = JSON.stringify(filters);
    return NextResponse.json(
      {
        error: `${
          error.message || "error getting featured product data from elestic"
        }----${errorDesc}`,
        appliedFilters: filters,
      },
      { status: 500, headers }
    );
  }
}

// --- Helpers ---
