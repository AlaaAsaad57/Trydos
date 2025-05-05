import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  let searchParams = request.nextUrl.searchParams;
  let value = searchParams.get("value");
  if (value) {
    revalidateTag(value);
  } else {
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidateTag("home-boutiques");
    revalidateTag("stories");
    revalidateTag("listing-data");
    revalidatePath("/listing", "layout");
    revalidateTag("home-categories-en"); // Update cached posts
    revalidateTag("home-categories-ar"); // Update cached posts
    revalidateTag("search-Api");
    revalidatePath("/boutique/[boutiqueId]", "page");
    revalidatePath("/boutique/[boutiqueId]", "layout");
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
