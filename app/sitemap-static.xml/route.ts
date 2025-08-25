import { NextRequest, NextResponse } from "next/server";
import { generateStaticPagesSitemapXML } from "services/elastic/sitemap.service";

export async function GET(request: NextRequest) {
  try {
    const xml = await generateStaticPagesSitemapXML();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
        "Content-Encoding": "identity", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating static pages sitemap:", error);

    return new NextResponse("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
