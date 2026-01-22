import { NextRequest, NextResponse } from "next/server";
import { ElasticsearchReader } from "@/services/elastic/elasticsearch-reader.service";
import { LogServerError } from "utils/serverErrorReporter";

export async function GET(request: NextRequest) {
  try {
    // Get country and language from headers
    const country = request.headers.get("country")?.trim() || "sy";
    let language = request.headers.get("language")?.trim();
    const lang = request.headers.get("lang")?.trim();
    language = language ?? lang ?? "en";

    // Validate required headers
    if (!country || !language) {
      return NextResponse.json(
        {
          error: "Missing required headers",
          message: "Both 'country' and 'language' headers are required",
        },
        { status: 400 },
      );
    }

    // Initialize Elasticsearch reader
    const reader = new ElasticsearchReader();

    // Fetch categories from Elasticsearch
    const categoriesResponse = await reader.getCategories({
      country: country,
      size: 4000,
    });

    // Process categories similar to home page logic
    let mainCategories = categoriesResponse.hits.hits.map((hit: any) => {
      return hit._source?.custom_categories?.find(
        (cat: any) =>
          cat.language_code?.toLowerCase() === language?.toLowerCase(),
      );
    });
    mainCategories = mainCategories.filter((c) => c !== undefined);
    // Remove duplicates by ID
    mainCategories = Array.from(
      new Map(mainCategories.map((c: any) => [c.id, c])).values(),
    );

    // Filter out any undefined/null values
    mainCategories = mainCategories.filter(Boolean);

    // Format response according to the specified structure
    const response = {
      data: {
        mainCategories: mainCategories.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          flat_photo_path: category.flat_photo_path,
          outline_photo_path: category.outline_photo_path,
          fill_photo_path: category.fill_photo_path,
        })),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching main categories:", error);
    LogServerError(
      {
        error: error,
        type: "home main categories api route",
        url: request.url,
        headers: request.headers,
      },
      "/api/home/mainCategories",
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch main categories",
      },
      { status: 500 },
    );
  }
}
