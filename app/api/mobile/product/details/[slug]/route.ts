import { NextRequest, NextResponse } from "next/server";
import { fetchProductDetailsForMobile } from "Server Requests";

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
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const language = request.headers.get("lang") || "en";
  const country = request.headers.get("country") || "tr";

  try {
    const response = await fetchProductDetailsForMobile(
      params.slug,
      language,
      country
    );

    return withCORS(
      NextResponse.json(
        { ...response },
        { status: response.code ?? response.status }
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
