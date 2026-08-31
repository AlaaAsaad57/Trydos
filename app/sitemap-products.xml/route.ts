import { NextRequest, NextResponse } from "next/server";
import {
  generateProductSitemapXML,
  getProductSitemapPageCount,
} from "services/elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";


export async function GET(request: NextRequest) {
  // return new NextResponse("Temporary stopped by developer", {
  //   status: 200,

  // });
  // ?page= used to be clamped at the bottom only, so any value was accepted.
  // The generator builds every url and slices afterwards, so ?page=999999 paid
  // for the full Elasticsearch scroll and then answered 200 with an empty
  // sitemap - which a shared cache then kept for an hour, under its own url.
  //
  // A page that does not exist is a 404 and must cost nothing. Page 0 always
  // exists, so the page count is only asked for when a higher page is requested.
  const rawPage = request.nextUrl.searchParams.get("page");
  const page = rawPage === null ? 0 : Number(rawPage);

  if (!Number.isInteger(page) || page < 0) {
    return sitemapPageNotFound();
  }

  try {
    if (page > 0 && page >= (await getProductSitemapPageCount())) {
      return sitemapPageNotFound();
    }

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

/** A products sitemap page that does not exist. Cached like the real pages, so a
 *  crawler asking for it repeatedly does not reach the origin every time. */
function sitemapPageNotFound() {
  return new NextResponse("Sitemap page not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
