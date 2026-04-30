import { NextRequest, NextResponse } from "next/server";
import { generateProductSitemapXML } from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";

export const revalidate = 3600; // regenerate at most once per hour

export async function GET(request: NextRequest) {
  const page = Math.max(
    0,
    parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10) || 0,
  );

  try {
    const xml = await generateProductSitemapXML(page);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(`Error generating products sitemap (page ${page}):`, error);
    LogServerError({
      error,
      type: "get sitemap for products api route",
      source: "get sitemap for products",
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
