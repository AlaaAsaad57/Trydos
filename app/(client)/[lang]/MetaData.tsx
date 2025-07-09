import { getConfiguredImage, translateFunction } from "utils/functions";
import type { Metadata } from "next";
import { GetHomeData } from "utils/pagesDataRequests/HomePageData";
import { cache } from "react";
import { GetFiltersData } from "utils/pagesDataRequests/FiltersPageData";
export const generateCodeCurrency = (code: string) => {
  if (code?.toLowerCase() === "sp") {
    return "SYP";
  } else {
    return code.toUpperCase();
  }
};
let {
  boutiqueData: boutiquesData,
  categoriesData,
  featuredData,
  flashDealsData,
  currencyData,
  brandsData,
} = {
  boutiqueData: [
    { name: "Techno", slug: "techno" },
    { name: "Boutique", slug: "boutique" },
  ],
  categoriesData: [
    {
      name: "Electronics",
      slug: "electronics",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Fashion",
      slug: "fashion",
      image: "https://via.placeholder.com/150",
    },
  ],
  featuredData: [
    {
      name: "Product 1",
      slug: "product-1",
      image: "https://via.placeholder.com/150",
      price: 100,
    },
    {
      name: "Product 2",
      slug: "product-2",
      image: "https://via.placeholder.com/150",
      price: 200,
    },
  ],
  flashDealsData: [
    {
      name: "Deal 1",
      slug: "deal-1",
      image: "https://via.placeholder.com/150",
      price: 100,
    },
    {
      name: "Deal 2",
      slug: "deal-2",
      image: "https://via.placeholder.com/150",
      price: 200,
    },
  ],
  currencyData: {
    exchange_rate: 1,
    code: "USD",
    name: "USD",
    currency_symbol: "$",
  },
  brandsData: [
    {
      name: "Brand 1",
      slug: "brand-1",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Brand 2",
      slug: "brand-2",
      image: "https://via.placeholder.com/150",
    },
  ],
};
// Home Page Meta Data
export const getHomeMetadata = cache(async ({ params }): Promise<Metadata> => {
  const [country, language] = params.lang.split("-");

  // Get language for translations

  // Fetch featured products, flash deals, and boutiques data

  // Combine all products
  const allProducts = [...(featuredData || []), ...(flashDealsData || [])];
  currencyData = {
    ...currencyData,
    code: generateCodeCurrency(currencyData.code.toUpperCase()),
  };
  // Extract unique categories and brands
  const categories = categoriesData || [];
  const brands = brandsData || [];
  const boutiques = boutiquesData || [];

  // Generate comprehensive metadata with translations

  const featuredCategories = categories
    .slice(0, 8)
    .map((c) => c.name)
    .join(", ");
  const topBrands = brands
    .slice(0, 10)
    .map((b) => b.name)
    .join(", ");
  const topBoutiques = boutiques
    .slice(0, 8)
    .map((b) => b.name)
    .join(", ");
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
      ...brands.map((b) => b.name),
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
      google: process.env.GOOGLE_VERIFICATION,
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
});
export const GetStructuredData = cache(async ({ params }) => {
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
    "@graph": [
      {
        "@type": "ItemList",
        name: "Categories",
        itemListElement: categoriesData.map((c, index) => ({
          "@type": "SiteNavigationElement",
          position: index + 1,
          name: c.name,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/categories/${c.slug}`,
        })),
      },
      {
        "@type": "ItemList",
        name: "Boutiques",
        itemListElement: boutiquesData.map((b, index) => ({
          "@type": "SiteNavigationElement",
          position: index + 1,
          name: b.name,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters/boutiques/${b.slug}`,
        })),
      },
      {
        "@type": "ItemList",
        name: "Flash Deals",
        itemListElement: flashDealsData.map((fd, index) => ({
          "@type": "Product",
          position: index + 1,
          name: fd.name,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${fd.slug}`,
        })),
      },
      {
        "@type": "ItemList",
        name: "Featured Products",
        itemListElement: featuredData.map((f, index) => ({
          "@type": "Product",
          position: index + 1,
          name: f.name,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${f.slug}`,
        })),
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Flash Deals",
      itemListElement: [...flashDealsData, ...featuredData].map(
        (fd, index) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: fd.name,
            url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${fd.slug}`,
          },
          price: fd.price,
          priceCurrency: currencyData.code,
          availability: "https://schema.org/InStock",
        })
      ),
    },
  };
});
