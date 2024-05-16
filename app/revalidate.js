"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export default async function Revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidateTag("home-boutiques"); // Update cached posts
  revalidateTag("stories"); // Update cached posts
  revalidateTag("listing-data"); // Update cached posts
  revalidatePath("/listing"); // Update cached posts
}
