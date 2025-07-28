import { NextRequest, NextResponse } from "next/server";
import { fetchProductDetailsForMobile } from "Server Requests";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let language = request.headers.get("lang") || "en";
  let country = request.headers.get("country") || "tr";
  try {
    let response = await fetchProductDetailsForMobile(
      params.slug,
      language,
      country
    );

    return NextResponse.json(
      { ...response },
      {
        status: response.code ?? response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",

          // 🚫 No cache headers:
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { isSuccessful: false, error, code: 500 },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",

          // 🚫 No cache headers on error too:
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}
