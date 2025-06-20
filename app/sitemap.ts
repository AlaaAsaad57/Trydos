import { MetadataRoute } from "next";

const BASE_URL =
  "https://www.trydos-front-git-alaa-dev-trydos-front-team.vercel.app";
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
    const response = await fetch(`${BASE_URL}/api/sitemap?lang=${locale}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

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

function generateAlternateLinks(path: string): { [key: string]: string } {
  const alternates: { [key: string]: string } = {};

  LOCALES.forEach((locale) => {
    alternates[locale] = `${BASE_URL}/${locale}${path}`;
  });

  return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages with alternatives
  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "daily" as const },
    { path: "/categories", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/featured", priority: 0.7, changeFreq: "daily" as const },
    { path: "/flashDeals", priority: 0.7, changeFreq: "daily" as const },
    { path: "/filters", priority: 0.6, changeFreq: "weekly" as const },
    { path: "/compare", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/settings", priority: 0.4, changeFreq: "monthly" as const },
  ];

  // Add static pages for each locale
  for (const page of staticPages) {
    for (const locale of LOCALES) {
      const url =
        page.path === ""
          ? `${BASE_URL}/${locale}`
          : `${BASE_URL}/${locale}${page.path}`;
      const alternates = generateAlternateLinks(page.path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: page.priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  // Fetch dynamic data for each locale
  for (const locale of LOCALES) {
    const data = await fetchSitemapData(locale);

    // Add categories
    for (const category of data.categories) {
      const path = category.url;
      const url = `${BASE_URL}/${locale}${path}`;
      const alternates = generateAlternateLinks(path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: alternates,
        },
      });
    }

    // Add boutiques
    for (const boutique of data.boutiques) {
      const path = boutique.url;
      const url = `${BASE_URL}/${locale}${path}`;
      const alternates = generateAlternateLinks(path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: alternates,
        },
      });
    }

    // Add products
    for (const product of data.products) {
      const path = product.url;
      const url = `${BASE_URL}/${locale}${path}`;
      const alternates = generateAlternateLinks(path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
        alternates: {
          languages: alternates,
        },
      });
    }

    // Add brands
    for (const brand of data.brands) {
      const path = brand.url;
      const url = `${BASE_URL}/${locale}${path}`;
      const alternates = generateAlternateLinks(path);

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  // Remove duplicates based on URL
  const uniqueEntries = sitemapEntries.filter(
    (entry, index, self) => index === self.findIndex((e) => e.url === entry.url)
  );

  return uniqueEntries;
}
