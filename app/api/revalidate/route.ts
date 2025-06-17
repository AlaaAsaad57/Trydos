import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  let searchParams = request.nextUrl.searchParams;
  let value = searchParams?.get("value") || "";
  if (value === "stories") {
    revalidateTag("stories");
  }
  if (value === "home") {
    revalidateTag("main-categories-Api");
    revalidateTag("featured-Products-Api");
    revalidateTag("countries");
    revalidateTag("boutiques");
    revalidateTag("stories");
  } else if (value === "listing") {
    revalidateTag("listing");
    revalidateTag("currency-api");
  } else if (value === "products") {
    revalidateTag("product-details");
    revalidateTag("currency-api");
  } else {
    revalidateTag("main-categories-Api");
    revalidateTag("featured-Products-Api");
    revalidateTag("countries");
    revalidateTag("boutiques");
    revalidateTag("stories");
    revalidateTag("listing");
    revalidateTag("currency-api");
    revalidateTag("product-details");
  }
  return NextResponse.json(
    { revalidated: "true" },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
