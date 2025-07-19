import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  let searchParams = request.nextUrl.searchParams;
  let value = searchParams?.get("value") || "";
  try {
    if (value === "stories") {
      revalidateTag("stories");
    }
    if (value === "home") {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidateTag("main-categories-Api");
      revalidatePath("/");
      revalidateTag("featured-Products-Api");
      revalidateTag("countries");
      revalidateTag("flash-deals-Products-Api");
      revalidatePath("/categories");
      revalidateTag("boutiques");
      revalidateTag("stories");
    } else if (value === "listing") {
      revalidateTag("listing");
      revalidatePath("/filters");
      revalidatePath("/featured");
      revalidatePath("/flashDeals");
      revalidateTag("currency-api");
    } else if (value === "products") {
      revalidateTag("product-details");
      revalidatePath("/products");
      revalidateTag("currency-api");
    } else {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidateTag("main-categories-Api");
      revalidatePath("/");
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/categories");
      revalidatePath("/filters");
      revalidatePath("/featured");
      revalidatePath("/flashDeals");
      revalidateTag("main-categories-Api");
      revalidateTag("flash-deals-Products-Api");
      revalidateTag("featured-Products-Api");
      revalidateTag("countries");
      revalidateTag("boutiques");
      revalidateTag("stories");
      revalidateTag("listing");
      revalidateTag("currency-api");
      revalidateTag("product-details");
    }
    console.log(
      "*************************************revalidated successfully*********************************"
    );
    return NextResponse.json(
      { revalidated: "true", error: null },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.log(
      "***************************revalidated failed***********************************",
      error
    );
    return NextResponse.json(
      { revalidated: "false", error: error },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
