import { NextRequest, NextResponse } from "next/server";

const SITEMAP_URL =
  "https://recomende_elasticsearch_engin.trydos.dev/sitemap.xml";
const CACHE_REVALIDATE_TIME = 360000; // 100 hour

export async function GET(request: NextRequest) {
  try {
    // Add cache headers for better performance
    const response = await fetch(SITEMAP_URL, {
      next: {
        revalidate: CACHE_REVALIDATE_TIME,
        tags: ["sitemap"],
      },
      headers: {
        "User-Agent": "TryDos-NextJS-Bot/1.0",
        Accept: "application/xml, text/xml, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch sitemap: ${response.status} ${response.statusText}`
      );

      // Return a basic sitemap as fallback
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_BASE_URL || "https://trydos.com"}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

      return new NextResponse(fallbackSitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "CDN-Cache-Control": "max-age=300",
          "Vercel-CDN-Cache-Control": "max-age=300",
        },
      });
    }

    const sitemapContent = await response.text();

    // Validate that the content is actually XML sitemap
    if (
      !sitemapContent.includes("<urlset") &&
      !sitemapContent.includes("<sitemapindex")
    ) {
      throw new Error("Invalid sitemap format received");
    }

    // Return the sitemap with proper headers
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
        "CDN-Cache-Control": "max-age=3600",
        "Vercel-CDN-Cache-Control": "max-age=3600",
        "X-Robots-Tag": "noindex",
        "Last-Modified": new Date().toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching sitemap:", error);

    // Return a basic sitemap as fallback
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_BASE_URL || "https://trydos.com"}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "max-age=300",
        "Vercel-CDN-Cache-Control": "max-age=300",
      },
    });
  }
}

// Optional: Add revalidation webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Add basic security check
    if (token !== process.env.SITEMAP_REVALIDATION_TOKEN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Revalidate the sitemap cache
    const { revalidateTag } = await import("next/cache");
    revalidateTag("sitemap");

    return new NextResponse("Sitemap revalidated", { status: 200 });
  } catch (error) {
    console.error("Error revalidating sitemap:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
