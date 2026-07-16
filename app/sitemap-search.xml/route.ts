import { NextRequest, NextResponse } from "next/server";
import { generateSearchTermsSitemapXML } from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";

export const revalidate = 3600; // regenerate at most once per hour

export async function GET(request: NextRequest) {
  try {
    // return new NextResponse("Temporary stopped by developer", {
    //   status: 200,

    // });
    const xml = await generateSearchTermsSitemapXML();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating search terms sitemap:", error);
    LogServerError({
      error,
      type: "get sitemap for search api route",
      source: "get sitemap for search",
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
