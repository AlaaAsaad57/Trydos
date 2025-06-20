"use server";

interface MainCategory {
  name: string;
  slug: string;
  flat_photo_path?: {
    file_path: string;
  };
}

interface CategoriesResponse {
  mainCategories: MainCategory[];
}

export async function fetchMainCategories(
  language: string,
  country: string
): Promise<CategoriesResponse> {
  try {
    const params = new URLSearchParams();
    params.set("lang", language);

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL
      }/api/home/mainCategories?${params.toString()}`,
      {
        method: "GET",
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: { tags: ["main-categories-Api", "home"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Main Categories Error: ${response.status}`);
    }

    const { data } = await response.json();

    return {
      mainCategories: data.mainCategories,
    };
  } catch (error) {
    console.error("Error fetching main categories:", error);
    throw error;
  }
}
