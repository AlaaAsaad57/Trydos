import { NextRequest, NextResponse } from "next/server";
import { fetchProductWithoutRelated } from "Server Requests";

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
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const language = request.headers.get("lang") || "en";
  const country = request.headers.get("country") || "tr";
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return withCORS(
      NextResponse.json(
        {
          data: null,
          isSuccessful: false,
          status: 401,
          message: "UNAUTHORIZED",
        },
        { status: 401 }
      )
    );
  }

  try {
    const response = await fetchProductWithoutRelated(
      params.slug,
      language,
      country,
      authorization
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
        { isSuccessful: false, error, code: 50000 },
        { status: 500 }
      )
    );
  }
}
