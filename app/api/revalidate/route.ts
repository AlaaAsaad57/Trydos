import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { LogServerError } from "utils/serverErrorReporter";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const value = searchParams?.get("value") || "";

  try {
    if (value === "stories") {
      revalidateTag("stories", "max");
    } else {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidateTag("main-categories-Api", "max");
      revalidatePath("/products");
      revalidatePath("/categories");
      revalidatePath("/filters");
      revalidatePath("/featured");
      revalidatePath("/flashDeals");
      revalidateTag("flash-deals-Products-Api", "max");
      revalidateTag("featured-Products-Api", "max");
      revalidateTag("countries", "max");
      revalidateTag("boutiques", "max");
      revalidateTag("stories", "max");
      revalidateTag("listing", "max");
      revalidateTag("currency-api", "max");
      revalidateTag("product-details", "max");
      revalidateTag("home", "max");
      revalidateTag("product-meta", "max");
      revalidateTag("languages", "max");
    }

    return NextResponse.json(
      { revalidated: "true", error: null },
      {
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
      },
    );
  } catch (error) {
    await LogServerError(
      { error, scenario: "revalidate route failed", value },
      "/api/revalidate",
    );
    return NextResponse.json(
      {
        revalidated: "false",
        error: error instanceof Error ? error.message : String(error),
      },
      {
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
      },
    );
  }
}
