import { NextRequest, NextResponse } from "next/server";
import { removeRedis } from "serverRequests/radis";

// Helper to add CORS + no-cache headers
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

// Preflight handler
export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 204 }));
}

// GET handler
export async function GET(request: NextRequest) {
  const product = request.nextUrl.searchParams.get("pid");

  try {
    // let data = await GetSocialDataForProduct({
    //   productId: product,
    //   slug: slug,
    //   lang: `${country}-${language}`,
    // });
    // await RedisSet(`product:${product}:social`, JSON.stringify(data));
    await removeRedis(`product:${product}:social`);
    return withCORS(NextResponse.json({ success: true }, { status: 200 }));
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
