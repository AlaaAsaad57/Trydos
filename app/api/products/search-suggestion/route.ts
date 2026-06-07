import { NextRequest, NextResponse } from "next/server";
import { GetSearchSuggestion } from "serverRequests/Search";
import { LogServerError } from "utils/serverErrorReporter";

// Inline autocomplete (ghost text) suggestion endpoint for the mobile app.
// Mirrors what the web does by calling GetSearchSuggestion directly as a
// server action — mobile can't invoke server actions, so it goes through
// this HTTP route. Same header contract as /api/products/searchInCatalog
// (country + language/lang), returns { suggestion: string }.
export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const search_text = stripQuotes(
    req.nextUrl.searchParams.get("search_text"),
  );

  try {
    const country = req.headers.get("country")?.trim() || "sy";
    let language = req.headers.get("language")?.trim();
    const lang = req.headers.get("lang")?.trim();
    language = language ?? lang ?? "en";

    const { suggestion } = await GetSearchSuggestion({
      language,
      country,
      search_text,
    });

    return NextResponse.json({ suggestion }, { headers });
  } catch (error: any) {
    LogServerError({
      error,
      type: "search suggestion api route",
      source: "search suggestion",
      filters: JSON.stringify({ search_text }),
      url: req.url,
      method: "get",
    });
    // Suggestions are best-effort; never surface an error to the typing UX.
    return NextResponse.json({ suggestion: "" }, { headers });
  }
}

function stripQuotes(value: string | null): string {
  if (!value) return "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  return decoded.replace(/^"|"$/g, "");
}
