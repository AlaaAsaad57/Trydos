"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export default async function Revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidatePath("/listing", "layout");
  revalidatePath("/listing", "page");
  revalidateTag("home-boutiques-en");
  revalidateTag("home-categories-en");
  revalidateTag("stories-en");
  revalidateTag("listing-data-en");
  revalidateTag("home-boutiques");
  revalidateTag("home-boutiques-ar");
  revalidateTag("home-categories-ar");
  revalidateTag("stories-ar");
  revalidateTag("listing-data-ar");
}
