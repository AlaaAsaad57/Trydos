import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCALES = [
  "tr-en",
  "tr-ar",
  "tr-tr",
  "sy-en",
  "sy-ar",
  "sy-tr",
  "lb-en",
  "lb-ar",
  "lb-tr",
  "iq-en",
  "iq-ar",
  "iq-tr",
];

interface SitemapItem {
  name: string;
  slug: string;
  url: string;
  type: "category" | "boutique" | "product" | "brand";
}

interface SitemapData {
  categories: SitemapItem[];
  boutiques: SitemapItem[];
  products: SitemapItem[];
  brands: SitemapItem[];
}

async function fetchSitemapData(locale: string): Promise<SitemapData> {
  try {
    const response = await fetch(`${BASE_URL}/api/sitemap?lang=${locale}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap data for ${locale}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching sitemap data for ${locale}:`, error);
    return {
      categories: [],
      boutiques: [],
      products: [],
      brands: [],
    };
  }
}

function generateXmlUrl(
  url: string,
  lastMod: string,
  changeFreq: string,
  priority: number,
  alternates: string[] = []
): string {
  const alternateLinks = alternates
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${
          alt.split("/")[3]
        }" href="${alt}"/>`
    )
    .join("\n");

  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
${alternateLinks}
  </url>`;
}

export async function GET() {
  try {
    const now = new Date().toISOString().split("T")[0];
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Static pages
    const staticPages = [
      { path: "", priority: 1.0, changeFreq: "daily" },
      { path: "/featured", priority: 0.7, changeFreq: "daily" },
      { path: "/flashDeals", priority: 0.7, changeFreq: "daily" },
      { path: "/filters", priority: 0.6, changeFreq: "weekly" },
      { path: "/compare", priority: 0.5, changeFreq: "monthly" },
      { path: "/settings", priority: 0.4, changeFreq: "monthly" },
    ];

    // Add static pages with alternates
    for (const page of staticPages) {
      const alternates: string[] = [];

      for (const locale of LOCALES) {
        const url =
          page.path === ""
            ? `${BASE_URL}/${locale}`
            : `${BASE_URL}/${locale}${page.path}`;
        alternates.push(url);
      }

      // Add entry for each locale
      for (const locale of LOCALES) {
        const url =
          page.path === ""
            ? `${BASE_URL}/${locale}`
            : `${BASE_URL}/${locale}${page.path}`;
        xmlContent +=
          generateXmlUrl(url, now, page.changeFreq, page.priority, alternates) +
          "\n";
      }
    }

    // Fetch and add dynamic content for each locale
    for (const locale of LOCALES) {
      const data = await fetchSitemapData(locale);

      // Categories
      for (const category of data.categories) {
        const alternates = LOCALES.map(
          (loc) => `${BASE_URL}/${loc}/categories/${category.url}`
        );
        const url = `${BASE_URL}/${locale}${category.url}`;
        xmlContent +=
          generateXmlUrl(url, now, "weekly", 0.8, alternates) + "\n";
      }

      // Boutiques
      for (const boutique of data.boutiques) {
        const alternates = LOCALES.map(
          (loc) => `${BASE_URL}/${loc}/filters/boutiques/${boutique.url}`
        );
        const url = `${BASE_URL}/${locale}${boutique.url}`;
        xmlContent +=
          generateXmlUrl(url, now, "weekly", 0.7, alternates) + "\n";
      }

      // Products
      for (const product of data.products) {
        const alternates = LOCALES.map(
          (loc) => `${BASE_URL}/${loc}/products/${product.url}`
        );
        const url = `${BASE_URL}/${locale}${product.url}`;
        xmlContent += generateXmlUrl(url, now, "daily", 0.9, alternates) + "\n";
      }

      // Brands
      for (const brand of data.brands) {
        const alternates = LOCALES.map(
          (loc) => `${BASE_URL}/${loc}/filters/brands/${brand.url}`
        );
        const url = `${BASE_URL}/${locale}${brand.url}`;
        xmlContent +=
          generateXmlUrl(url, now, "weekly", 0.6, alternates) + "\n";
      }
    }

    xmlContent += "</urlset>";

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=864000",
      },
    });
  } catch (error) {
    // console.error("Sitemap generation error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
