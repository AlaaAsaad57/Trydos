export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getProductFromCache, storeProduct } from "serverRequests/radis";
import {
  GetProductData,
  getProductDataFromElastic,
} from "utils/pagesDataRequests/ProductPageData";

// Apply CORS headers to any response
function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
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
    const response = await getProductFromCache(Params.slug, language, country);
    if (response.product?.id) {
      productDataVar = { ...response.product, redis: true };
    } else {
      let { product: productData, socialData } = await GetProductData({
        lang: `${country}-${language}`,
        productId: Params.slug,
      });

      if (productData?.id && productData?.images && socialData) {
        storeProduct(productData, socialData, Params.slug, language, country);
      }

      productDataVar = {
        ...productData,
        ...socialData,
        redis: false,
      };
    }
    const user_id = request.nextUrl.searchParams.get("user_id");
    let elasticData = await getProductDataFromElastic({
      productId: productDataVar.id,
      lang: language,
      slug: Params.slug,
      userId: user_id,
    });
    return withCORS(
      NextResponse.json(
        {
          data: { ...productDataVar, ...elasticData },
          isSuccessful: true,
          code: 200,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("***** fetch failed *****", error);

    return withCORS(
      NextResponse.json(
        { isSuccessful: false, error, code: 500 },
        { status: 500 }
      )
    );
  }
}
