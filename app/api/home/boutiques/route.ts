import { NextRequest, NextResponse } from "next/server";
import { ElasticsearchReader } from "@/services/elastic/elasticsearch-reader.service";

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
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = searchParams.get("offset") || null;
    let category_slug = searchParams.get("category_slugs") || undefined;
    let sellerId = searchParams.get("sellerId") || undefined;
    if (typeof category_slug === "string") {
      let categorySlg = JSON.parse(category_slug);
      if (Array.isArray(categorySlg) && categorySlg.length > 0) {
        category_slug = categorySlg?.[0];
      }
    }
    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: "Invalid limit parameter",
          message: "Limit must be between 1 and 100",
        },
        { status: 400 }
      );
    }

    // Initialize Elasticsearch reader
    const reader = new ElasticsearchReader();

    // Fetch boutiques from Elasticsearch - exactly like home page
    const boutiquesResponse = await reader.getBoutiques({
      country,
      language,
      limit,
      category: category_slug as any,
      searchAfter: offset ? JSON.parse(offset.toString()) : null,
      sellerId: sellerId,
    });

    // Check if response exists
    if (!boutiquesResponse) {
      return NextResponse.json(
        {
          error: "No boutiques found",
          message: "Failed to fetch boutiques data",
        },
        { status: 404 }
      );
    }
    const response = {
      data: {
        total: boutiquesResponse.boutiques?.length || 0,
        limit,
        offset: boutiquesResponse.searchAfter, // Use searchAfter as offset, like home page
        boutiques: boutiquesResponse.boutiques || [],
        category_slug,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching boutiques:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch boutiques",
      },
      { status: 500 }
    );
  }
}
