import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidateTag("home-boutiques");
  revalidateTag("stories");
  revalidateTag("listing-data");
  revalidatePath("/listing", "layout");
  revalidateTag("home-categories"); // Update cached posts

  revalidatePath("/products/[productCategory]", "page");
  revalidatePath("/products/[productCategory]", "layout");
  return NextResponse.json({ revalidated: "true" });
}
