import { NextRequest, NextResponse } from "next/server";
import { fetchProductWithoutRelated } from "Server Requests";
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let language = request.headers.get("lang") || "en";
  let country = request.headers.get("country") || "tr";
  let Authorization = request.headers.get("authorization");
  if (!Authorization) {
    return NextResponse.json(
      { data: null, isSuccessful: false, status: 401, message: "UNAUTHIRIZED" },
      {
        status: 401,
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
  }
  try {
    let response = await fetchProductWithoutRelated(
      params.slug,
      language,
      country,
      Authorization
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
    console.log("***** revalidated failed *****");
    return NextResponse.json(
      { isSuccessful: false, error, code: 50000 },
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
