import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const value = searchParams?.get("value") || "";

  try {
    if (value === "stories") {
      revalidateTag("stories");
    } else {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidateTag("main-categories-Api");
      revalidatePath("/products");
      revalidatePath("/categories");
      revalidatePath("/filters");
      revalidatePath("/featured");
      revalidatePath("/flashDeals");
      revalidateTag("flash-deals-Products-Api");
      revalidateTag("featured-Products-Api");
      revalidateTag("countries");
      revalidateTag("boutiques");
      revalidateTag("stories");
      revalidateTag("listing");
      revalidateTag("currency-api");
      revalidateTag("product-details");
      revalidateTag("home");
      revalidateTag("product-meta");
      revalidateTag("languages");
    }

    console.log("***** revalidated successfully *****");

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
      }
    );
  } catch (error) {
    console.log("***** revalidated failed *****");
    return NextResponse.json(
      { revalidated: "false", error },
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
      }
    );
  }
}
