"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export default async function Revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidatePath("/listing", "layout");
  revalidatePath("/listing", "page");
  revalidateTag("home-boutiques-en", "max");
  revalidateTag("home-categories-en", "max");
  revalidateTag("stories-en", "max");
  revalidateTag("listing-data-en", "max");
  revalidateTag("home-boutiques", "max");
  revalidateTag("home-boutiques-ar", "max");
  revalidateTag("home-categories-ar", "max");
  revalidateTag("stories-ar", "max");
  revalidateTag("listing-data-ar", "max");
  revalidateTag("currency-Api", "max");
  revalidateTag("boutique-Api", "max");
  revalidateTag("search-Api", "max");
  revalidateTag("products-Api", "max");
}
