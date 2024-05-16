import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, {}) {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidateTag("home-boutiques"); // Update cached posts
  revalidateTag("stories"); // Update cached posts
  revalidateTag("listing-data"); // Update cached posts
  revalidatePath("/listing", "layout"); // Update cached posts
  revalidatePath("/listing", "page");
  return NextResponse.json({ revalidated: "true" });
}
