export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GetProductPriceQtyDetails } from "serverRequests/product";
import { getProductFromCache, storeProduct } from "serverRequests/radis";
import {
  GetProductData,
  getProductDataFromElastic,
} from "utils/pagesDataRequests/ProductPageData";
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

// GET handler
export async function GET(request: NextRequest, { params }) {
  const Params = await params;
  const country = request.headers.get("country")?.trim() || "sy";
  let language = request.headers.get("language")?.trim();
  const lang = request.headers.get("lang")?.trim();
  language = language ?? lang ?? "en";
  let productDataVar;
  try {
    const response = await GetProductPriceQtyDetails({
      country: country,
      language: language,
      slug: Params.slug,
      noCache: true,
    });
    productDataVar = response;
    return withCORS(
      NextResponse.json(
        {
          data: { ...productDataVar },
          isSuccessful: true,
          code: 200,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("Get Product QTY api route", error);
    LogServerError(
      {
        error: error,
        type: "product QTY api route",
        url: request.url,
        headers: request.headers,
      },
      "/api/mobile/product/qty/[slug]",
    );
    return withCORS(
      NextResponse.json(
        { isSuccessful: false, error, code: 500 },
        { status: 500 },
      ),
    );
  }
}
