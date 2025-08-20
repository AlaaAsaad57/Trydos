import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import type { Metadata } from "next";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
export const generateCodeCurrency = (code: string) => {
  if (code?.toLowerCase() === "sp") {
    return "SYP";
  } else {
    return code.toUpperCase();
  }
};

// Home Page Meta Data
export const getHomeMetadata = async ({ params }): Promise<Metadata> => {
  const [country, language] = params.lang.split("-");
  let Reader = new ElasticsearchReader();
  let [mainCategories, boutiquesData, featuredData, flashDealsData] =
    await Promise.all([
      Reader.getCategories({ country: country, size: 4000 }),
      Reader.getBoutiques({
        language,
        country,
        limit: 10,
        category: params.mainCategory,
      }),
      getProductsAndFiltersFromElastic({
        country: country,
        language_code: language,
        filters: {
          featured: true,
        },
        limit: 10,
      }),
      getProductsAndFiltersFromElastic({
        country: country,
        language_code: language,
        filters: {
          flashdeal: true,
        },
        limit: 10,
      }),
    ]);
  // Get language for translations

  // Fetch featured products, flash deals, and boutiques data

  // Combine all products
  const allProducts = [
    ...(featuredData.products || []),
    ...(flashDealsData.products || []),
  ];
  let categoriesData = mainCategories.hits.hits.map((s) => {
    // @ts-ignore
    return s._source?.custom_categories?.find(
      (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase()
    );
  });
  categoriesData = Array.from(
    new Map(categoriesData.map((c: any) => [c.id, c])).values()
  );
  // Extract unique categories and brands
  const categories = categoriesData || [];

  const boutiques = boutiquesData.boutiques || [];

  // Generate comprehensive metadata with translations
  // app/layout.tsx or app/page.tsx
  const data = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_REMOTE_FRONT),
    title: {
      default: "Trydos — Flash Deals, Boutique Finds & Featured Products",
      template: "%s | Trydos",
    },
    description:
      "Shop flash deals, trending bar essentials, and handpicked boutique products. Discover the latest featured items only on Trydos.",
    keywords: [
      "Trydos",
      "Flash Deals",
      "Bar",
      "Boutiques",
      "Featured Products",
      "Online Shopping",
      "TryDos",
      "online shopping",
      "premium products",
      "featured products",
      "flash deals",
      "best deals",
      "shopping mall",
      "boutiques",
      "brands",
      "fashion",
      "electronics",
      "home garden",
      ...categories.map((c) => c.name),
      ...boutiques.map((b) => b.name),
      ...allProducts.slice(0, 20).map((p) => p.name),
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: "Trydos — Flash Deals & Featured Boutique Picks",
      description:
        "Your destination for exclusive bar items, boutique fashion, and daily flash deals.",
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}`,
      siteName: "Trydos",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: "Trydos storefront preview",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Trydos — Shop Boutique Products & Flash Deals",
      description:
        "Explore Trydos for curated categories like Bar, Boutiques, and limited-time Flash Deals.",
      images: [`${process.env.NEXT_PUBLIC_REMOTE_FRONT}/opengraph-image.png`],
      creator: "@trydos",
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    manifest: "/manifest.json",
    authors: [{ name: "Ramaaz Team", url: "https://ramaaz.com" }],
    creator: "Trydos",
    publisher: "Trydos",
    category: "ecommerce",
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
      languages: {
        tr: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en`,
        ar: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-ar`,
        en: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en`,
      },
    },
  };

  // Generate structured data for SEO

  // Return comprehensive metadata
  const metadata: Metadata = {
    ...data,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "iANrHdX9P3YTSLpnXZYxSv3Zlk9s0Vy9Oiympeu25oE",
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    category: "shopping",
    classification: "Business",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_REMOTE_FRONT),
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "TryDos",
      "application-name": "TryDos",
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#000000",
      "msapplication-config": "/browserconfig.xml",
      "theme-color": "#000000",
    },
  };

  return {
    ...metadata,
  };
};
export const GetStructuredData = async ({ params }) => {
  const [country, language] = params.lang.split("-");
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Trydos",
    url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
    description:
      "Discover Trydos: your online store for bar items, boutique products, and flash deals.",
    image: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/opengraph-image.png`,
    logo: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/assets/logo.png`,
    sameAs: [
      "https://facebook.com/trydos",
      "https://instagram.com/trydos",
      "https://twitter.com/trydos",
    ],
  };
};
