"use server";
import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

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
    const response = await fetchServerData({
      url: `${
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL
      }/api/home/mainCategories?${params.toString()}`,
      method: "GET",
      tags: ["main-categories-Api", "home"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CATEGORIES),
      local: `${country}-${language}`,
    });

    if (response.isError) {
      console.error(`Main Categories Error: ${response.status}`);
      reportError(
        new Error(
          `Main Categories Error: ${response.status}-${response.error}`
        ),
        {
          source: "categories",
          page: "main-categories",
          language: language,
          country: country,
          response: JSON.stringify(response),
        }
      );
      return {
        mainCategories: [],
      };
    }
    return response.data.data;
  } catch (error) {
    console.error("Error fetching main categories:", error);
    return {
      mainCategories: [],
    };
  }
}
