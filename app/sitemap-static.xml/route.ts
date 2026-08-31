import { NextRequest, NextResponse } from "next/server";
import { generateStaticPagesSitemapXML } from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";


export async function GET(request: NextRequest) {
  try {
    // return new NextResponse("Temporary stopped by developer", {
    //   status: 200,

    // });
    const xml = await generateStaticPagesSitemapXML();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating static pages sitemap:", error);
    LogServerError({
      error,
      type: "get sitemap for static pages api route",
      source: "get sitemap for static pages",
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
