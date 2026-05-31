export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getRelatedProducts } from "services/elastic/elasticSearch";
import { LogServerError } from "utils/serverErrorReporter";

// Apply CORS headers to any response
function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");
  return res;
}

// Handle preflight (important for browsers)
export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 204 }));
}

function decodeValue(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let Params = await params;
  const productId = Number(Params.id);

  if (isNaN(productId)) {
    return withCORS(
      NextResponse.json(
        { isSuccessful: false, error: "Invalid product ID", code: 400 },
        { status: 400 }
      )
    );
  }

  const country = request.headers.get("country")?.trim() || "sy";
  let language = request.headers.get("language")?.trim();
  const lang = request.headers.get("lang")?.trim();
  language = language ?? lang ?? "en";

  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get("limit") || 10);
  const offset = searchParams.get("offset")
    ? parseNumberArray(searchParams.get("offset"))
    : [];

  try {
    const response = await getRelatedProducts({
      productId,
      limit,
      search_after: offset,
      language_code: language,
      country,
    });


    const productsData = response.products;

    return withCORS(
      NextResponse.json(
        {
          data: {
            products: productsData,
            offset: response.offset,
            total_size: response.total_size,
            
          },
          isSuccessful: true,
          code: 200,
        },
        { status: 200 }
      )
    );
  } catch (error: any) {
    console.error("Get Related Products api route error", error);
    LogServerError(
      {
        error: error,
        type: "related products api route",
        url: request.url,
        headers: request.headers,
      },
      `/api/related-products/${productId}`
    );
    return withCORS(
      NextResponse.json(
        { isSuccessful: false, error: error.message || error, code: 500 },
        { status: 500 }
      )
    );
  }
}
