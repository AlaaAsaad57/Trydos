import { NextRequest, NextResponse } from "next/server";
import { generateBoutiqueSitemapXML } from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";

export const revalidate = 3600; // regenerate at most once per hour

export async function GET(request: NextRequest) {
  return new NextResponse("Temporary stopped by developer", {
    status: 200,

  });
  const page = Math.max(
    0,
    parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10) || 0,
  );

  try {
    const xml = await generateBoutiqueSitemapXML(page);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(`Error generating boutiques sitemap (page ${page}):`, error);
    LogServerError({
      error,
      type: "get sitemap for boutiques api route",
      source: "get sitemap for boutiques",
      url: request.url,
      method: "get",
    });
    return new NextResponse("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
