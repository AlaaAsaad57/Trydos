import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  let searchParams = request.nextUrl.searchParams;
  let value = searchParams.get("value");
  if (value) {
    revalidateTag(value);
  } else {
    revalidateTag("listing");
    revalidateTag("search-api");
    revalidateTag("currency-api");
    // products
    revalidateTag("product-details");
    // home req
    revalidateTag("main-categories-Api");
    revalidateTag("featured-Products-Api");
    revalidateTag("home");
    revalidateTag("boutiques");
    revalidateTag("home-stories");
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
