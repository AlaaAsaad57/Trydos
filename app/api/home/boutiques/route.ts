import { NextRequest, NextResponse } from "next/server";
import { ElasticsearchReader } from "@/services/elastic/elasticsearch-reader.service";

export async function GET(request: NextRequest) {
  try {
    // Get country and language from headers
    const country = request.headers.get("country")?.trim() || "sy";
    const language = request.headers.get("language")?.trim() || "en";

    // Validate required headers
    if (!country || !language) {
      return NextResponse.json(
        { 
          error: "Missing required headers", 
          message: "Both 'country' and 'language' headers are required" 
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category_slug = searchParams.get("category_slug") || undefined;

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          error: "Invalid limit parameter", 
          message: "Limit must be between 1 and 100" 
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
      category: category_slug
    });

    // Check if response exists
    if (!boutiquesResponse) {
      return NextResponse.json(
        { 
          error: "No boutiques found", 
          message: "Failed to fetch boutiques data" 
        },
        { status: 404 }
      );
    }
    const response = {
      data: {
        total: boutiquesResponse.boutiques?.length || 0,
        limit,
        offset: boutiquesResponse.searchAfter || 0, // Use searchAfter as offset, like home page
        boutiques: boutiquesResponse.boutiques || []
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error fetching boutiques:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: "Failed to fetch boutiques" 
      },
      { status: 500 }
    );
  }
}