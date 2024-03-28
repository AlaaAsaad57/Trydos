"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateStories() {
  revalidatePath("/");
  revalidateTag("stories");
}
