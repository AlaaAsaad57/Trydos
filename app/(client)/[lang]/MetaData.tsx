import { getConfiguredImage, translateFunction } from "utils/functions";
import type { Metadata } from "next";
import {
  fetchBoutiques,
  fetchCurrency,
  fetchFilteredProducts,
  fetchMainCategories,
} from "Server Requests";
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
export const getHomeMetadata = cache(async ({ params }) => {
  const [country, language] = params.lang.split("-");

  // Get language for translations

  // Fetch featured products, flash deals, and boutiques data
  let {
    boutiqueData: boutiquesData,
    categoriesData,
    featuredData,
    flashDealsData,
    currencyData,
  } = await GetHomeData(params);

  // Combine all products
  const allProducts = [
    ...(featuredData?.data.products || []),
    ...(flashDealsData?.data.products || []),
  ];
  currencyData = {
    ...currencyData,
    code: generateCodeCurrency(currencyData.code.toUpperCase()),
  };
  // Extract unique categories and brands
  const categories = categoriesData.mainCategories || [];
  const brands = featuredData?.data?.brands || [];
  const boutiques = boutiquesData.boutiques || [];

  // Generate comprehensive metadata with translations
  const pageTitle = translateFunction(
    "TryDos - Premium Shopping Experience",
    language
  );

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

  const baseDescription = translateFunction(
    "Discover premium products on TryDos",
    language
  );
  const pageDescription = `${baseDescription}. ${translateFunction(
    "Your ultimate shopping destination",
    language
  )}. ${translateFunction("Featured Products", language)}: ${
    featuredData?.data?.products?.length || 0
  }, ${translateFunction("Flash Deals", language)}: ${
    flashDealsData?.data?.products?.length || 0
  } ${categories.length > 0 ? `across ${categories.length} categories` : ""}. ${
    topBrands ? `Top brands: ${topBrands}. ` : ""
  }${featuredCategories ? `Featured categories: ${featuredCategories}. ` : ""}${
    topBoutiques ? `Explore boutiques: ${topBoutiques}. ` : ""
  }Find the best deals and latest trends in fashion, electronics, home & garden, and more.`;

  // Generate comprehensive keywords
  const keywords = [
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
    .join(", ");

  // Use the dynamic Open Graph image from API route as primary
  const baseUrl =
    process.env.NEXT_PUBLIC_REMOTE_FRONT ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const primaryOgImage = `${baseUrl}/api/opengraph-image`;

  // Fallback images for additional social media images and structured data
  const featuredImage =
    featuredData?.data?.products?.[0]?.images?.[0]?.file_path;
  const flashDealImage =
    flashDealsData?.data?.products?.[0]?.images?.[0]?.file_path;
  const boutiqueImage =
    boutiques?.[0]?.banners?.[0]?.file_path || boutiques?.[0]?.icon;

  const fallbackImage =
    featuredImage ||
    flashDealImage ||
    boutiqueImage ||
    "/images/trydos-og-image.jpg";

  // Ensure absolute URLs for Open Graph images
  const absolutePrimaryOgImage = primaryOgImage;

  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`;

  // Generate structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TryDos",
    alternateName: "TryDos Shopping Platform",
    url: canonicalUrl,
    description: pageDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "Store",
      "@id": `${canonicalUrl}#store`,
      name: "TryDos",
      image: fallbackImage?.startsWith("http")
        ? fallbackImage
        : getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + fallbackImage,
            width: 1200,
            height: 630,
            q: 80,
          }),
      description:
        "Premium online shopping platform with featured products, flash deals, and boutique collections",
      url: canonicalUrl,
      telephone: "+1-800-TRYDOS",
      address: {
        "@type": "PostalAddress",
        addressCountry: country.toUpperCase(),
      },
      hasOfferCatalog: [
        // Featured Products Catalog
        {
          "@type": "OfferCatalog",
          "@id": `${canonicalUrl}#featured-products`,
          name: "Featured Products",
          description: "Curated selection of premium featured products",
          itemListElement:
            featuredData?.data?.products
              ?.slice(0, 20)
              .map((product, index) => ({
                "@type": "Product",
                "@id": `${canonicalUrl}/products/${product.slug}`,
                name: product.name,
                description:
                  product.details || `Premium ${product.name} from TryDos`,
                image: product.images?.[0]?.file_path
                  ? getConfiguredImage({
                      src:
                        process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                        product.images[0].file_path,
                      width: 800,
                      height: 800,
                      q: 80,
                    })
                  : undefined,
                offers: {
                  "@type": "Offer",
                  "@id": `${canonicalUrl}/products/${product.slug}#offer`,
                  url: `${canonicalUrl}/products/${product.slug}`,
                  priceCurrency: generateCodeCurrency(currencyData.code),
                  price:
                    (product.offer_price || product.price || 0) *
                    (currencyData.exchange_rate || 1),
                  priceValidUntil:
                    product.flash_deal_end_date ||
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                  availability: "https://schema.org/InStock",
                  seller: {
                    "@type": "Organization",
                    name: "TryDos",
                  },
                },
                brand: product.category?.name
                  ? {
                      "@type": "Brand",
                      name: product.category.name,
                    }
                  : undefined,
                category: product.category?.name,
                color: product.colors?.map((c) => c.name).filter(Boolean),
              })) || [],
        },
        // Flash Deals Catalog
        {
          "@type": "OfferCatalog",
          "@id": `${canonicalUrl}#flash-deals`,
          name: "Flash Deals",
          description: "Limited time offers with special discounts",
          itemListElement:
            flashDealsData?.data?.products
              ?.slice(0, 15)
              .map((product, index) => ({
                "@type": "Product",
                "@id": `${canonicalUrl}/products/${product.slug}`,
                name: product.name,
                description:
                  product.details ||
                  `Flash deal: ${product.name} - Limited time offer`,
                image: product.images?.[0]?.file_path
                  ? getConfiguredImage({
                      src:
                        process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                        product.images[0].file_path,
                      width: 800,
                      height: 800,
                      q: 80,
                    })
                  : undefined,
                offers: {
                  "@type": "Offer",
                  "@id": `${canonicalUrl}/products/${product.slug}#flash-offer`,
                  url: `${canonicalUrl}/products/${product.slug}`,
                  priceCurrency: generateCodeCurrency(currencyData.code),
                  price:
                    (product.offer_price || product.price || 0) *
                    (currencyData.exchange_rate || 1),
                  priceValidUntil:
                    product.flash_deal_end_date ||
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                  availability: "https://schema.org/LimitedAvailability",
                  validFrom: new Date().toISOString().split("T")[0],
                  seller: {
                    "@type": "Organization",
                    name: "TryDos",
                  },
                },
                brand: product.category?.name
                  ? {
                      "@type": "Brand",
                      name: product.category.name,
                    }
                  : undefined,
                category: product.category?.name,
                color: product.colors?.map((c) => c.name).filter(Boolean),
              })) || [],
        },
      ],
      // Store departments/categories
      department: categories.slice(0, 15).map((category) => ({
        "@type": "Store",
        "@id": `${canonicalUrl}/categories/${category.slug}`,
        name: category.name,
        url: `${canonicalUrl}/filters/categories/${category.slug}`,
        image: category.flat_photo_path
          ? getConfiguredImage({
              src:
                process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                category.flat_photo_path.file_path,
              width: 400,
              height: 400,
              q: 80,
            })
          : undefined,
        address: {
          "@type": "PostalAddress",
          addressCountry: country.toUpperCase(),
        },
        parentOrganization: {
          "@type": "Store",
          name: "TryDos",
          address: {
            "@type": "PostalAddress",
            addressCountry: country.toUpperCase(),
          },
        },
      })),
    },
    // Boutiques as additional organizations
    mentions: boutiques.slice(0, 10).map((boutique) => ({
      "@type": "Store",
      "@id": `${canonicalUrl}/boutiques/${boutique.slug}`,
      name: boutique.name,
      description:
        boutique.description || `${boutique.name} boutique on TryDos`,
      url: `${canonicalUrl}/filters/boutiques/${boutique.slug}`,
      image: boutique.icon
        ? getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + boutique.icon,
            width: 400,
            height: 400,
            q: 80,
          })
        : undefined,
      address: {
        "@type": "PostalAddress",
        addressCountry: country.toUpperCase(),
      },
      parentOrganization: {
        "@type": "Store",
        name: "TryDos",
        address: {
          "@type": "PostalAddress",
          addressCountry: country.toUpperCase(),
        },
      },
    })),
  };

  // Return comprehensive metadata
  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        // Additional featured product images
        ...(featuredData?.data?.products?.slice(0, 5).map((product) => ({
          url: getConfiguredImage({
            src:
              process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
              (product.images?.[0]?.file_path || fallbackImage),
            width: 1200,
            height: 630,
            q: 80,
          }),
          width: 1200,
          height: 630,
          alt: `${product.name} - Featured on TryDos`,
        })) || []),
        {
          url: absolutePrimaryOgImage,
          width: 1200,
          height: 630,
          alt: "TryDos - Premium Shopping Experience",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      site: "@TryDos",
      creator: "@TryDos",
      images: [absolutePrimaryOgImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
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
    // Add structured data as a separate property for the page to render
    structuredData: jsonLd,
  };
});

export async function getFeaturedMetadata({ params }) {
  const [country, language] = params.lang.split("-");

  // Get language for translations

  // Fetch featured products data

  let {
    products: featuredData,
    currency: currencyData,
    boutique: boutique,
  } = await GetFiltersData(
    { lang: params.lang, filters: params.filters },
    null,
    true,
    false,
    false
  );
  const categories = featuredData?.categories || [];
  const brands = featuredData?.brands || [];
  const products = featuredData?.products || [];

  // Generate metadata with translations
  const pageTitle = translateFunction("Featured Products - TryDos", language);
  const featuredCategories = categories
    .slice(0, 8)
    .map((c) => c.name)
    .join(", ");
  const topBrands = brands
    .slice(0, 10)
    .map((b) => b.name)
    .join(", ");

  const pageDescription = `${translateFunction(
    "Curated selection of premium featured products",
    language
  )} on TryDos. ${products.length > 0 ? `${products.length} products` : ""} ${
    categories.length > 0 ? `across ${categories.length} categories` : ""
  }${featuredCategories ? ` including ${featuredCategories}` : ""}. ${
    topBrands ? `Top brands: ${topBrands}. ` : ""
  }Find the best featured deals and latest trends.`;

  const keywords = [
    "featured products",
    "premium collection",
    "curated products",
    "TryDos featured",
    "best products",
    ...categories.map((c) => c.name),
    ...brands.map((b) => b.name),
    ...products.slice(0, 15).map((p) => p.name),
  ]
    .filter(Boolean)
    .join(", ");

  const primaryImage =
    products?.[0]?.images?.[0]?.file_path || "/images/featured-og.jpg";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/featured`;

  // Generate structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    name: "Featured Products",
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "OfferCatalog",
      "@id": `${canonicalUrl}#featured-catalog`,
      name: "Featured Products Catalog",
      description: "Premium curated collection of featured products",
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "Product",
        "@id": `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
        name: product.name,
        description: product.details || `Featured product: ${product.name}`,
        image: product.images?.[0]?.file_path
          ? getConfiguredImage({
              src:
                process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                product.images[0].file_path,
              width: 800,
              height: 800,
              q: 80,
            })
          : undefined,
        offers: {
          "@type": "Offer",
          "@id": `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}#offer`,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
          priceCurrency: generateCodeCurrency(currencyData.code),
          price:
            (product.offer_price || product.price || 0) *
            (currencyData.exchange_rate || 1),
          priceValidUntil:
            product.flash_deal_end_date ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "TryDos",
          },
        },
        brand: product.category?.name
          ? {
              "@type": "Brand",
              name: product.category.name,
            }
          : undefined,
        category: product.category?.name,
        color: product.colors?.map((c) => c.name).filter(Boolean),
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Featured Products",
          item: canonicalUrl,
        },
      ],
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        {
          url: getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + primaryImage,
            width: 1200,
            height: 630,
            q: 80,
          }),
          width: 1200,
          height: 630,
          alt: "Featured Products - TryDos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + primaryImage,
          width: 1200,
          height: 630,
          q: 80,
        }),
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return {
    ...metadata,
    structuredData: jsonLd,
  };
}

export async function getFlashDealsMetadata({ params }) {
  const [country, language] = params.lang.split("-");

  let { products: flashDealsData, currency: currencyData } =
    await GetFiltersData(
      { lang: params.lang, filters: params.filters },
      null,
      false,
      true,
      false
    );
  const products = flashDealsData?.products || [];

  // Generate metadata with translations
  const pageTitle = translateFunction("Flash Deals - TryDos", language);

  const pageDescription = `${translateFunction(
    "Limited-time offers with great discounts",
    language
  )} on TryDos! ${
    products.length > 0 ? `${products.length} exclusive deals` : ""
  }. Don't miss out on these amazing deals - shop now before they expire. Best prices guaranteed on premium products.`;

  const keywords = [
    "flash deals",
    "limited time offers",
    "special discounts",
    "flash sales",
    "TryDos deals",
    "best deals",
    "discount shopping",
    "sale products",
    ...products.slice(0, 15).map((p) => p.name),
  ]
    .filter(Boolean)
    .join(", ");

  const primaryImage =
    products?.[0]?.images?.[0]?.file_path || "/images/flash-deals-og.jpg";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/flashDeals`;

  // Generate structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    name: "Flash Deals",
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "OfferCatalog",
      "@id": `${canonicalUrl}#flash-catalog`,
      name: "Flash Deals Catalog",
      description: "Limited time offers with special discounts",
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "Product",
        "@id": `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
        name: product.name,
        description:
          product.details || `Flash deal: ${product.name} - Limited time offer`,
        image: product.images?.[0]?.file_path
          ? getConfiguredImage({
              src:
                process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                product.images[0].file_path,
              width: 800,
              height: 800,
              q: 80,
            })
          : undefined,
        offers: {
          "@type": "Offer",
          "@id": `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}#flash-offer`,
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
          priceCurrency: generateCodeCurrency(currencyData.code),
          price:
            (product.offer_price || product.price || 0) *
            (currencyData.exchange_rate || 1),
          priceValidUntil:
            product.flash_deal_end_date ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          availability: "https://schema.org/LimitedAvailability",
          validFrom: new Date().toISOString().split("T")[0],
          seller: {
            "@type": "Organization",
            name: "TryDos",
          },
        },
        brand: product.category?.name
          ? {
              "@type": "Brand",
              name: product.category.name,
            }
          : undefined,
        category: product.category?.name,
        color: product.colors?.map((c) => c.name).filter(Boolean),
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Flash Deals",
          item: canonicalUrl,
        },
      ],
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        {
          url: getConfiguredImage({
            src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + primaryImage,
            width: 1200,
            height: 630,
            q: 80,
          }),
          width: 1200,
          height: 630,
          alt: "Flash Deals - TryDos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + primaryImage,
          width: 1200,
          height: 630,
          q: 80,
        }),
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return {
    ...metadata,
    structuredData: jsonLd,
  };
}

export async function getCompareMetadata({ params }) {
  const [country, lang] = params.lang.split("-");

  // Get language for translations
  const language = lang || "en";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/compare`;

  const pageTitle = translateFunction("Compare Products - TryDos", language);
  const pageDescription =
    translateFunction("Find and compare your favorite products", language) +
    " side by side on TryDos. Make informed purchasing decisions by comparing features, prices, specifications, and reviews. Find the perfect product that meets your needs.";

  const keywords = [
    "compare products",
    "product comparison",
    "compare prices",
    "product features",
    "buying guide",
    "TryDos compare",
    "product review",
    "specifications",
  ]
    .filter(Boolean)
    .join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    name: "Product Comparison",
    description: pageDescription,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "TryDos",
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Compare Products",
          item: canonicalUrl,
        },
      ],
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      "@id": `${canonicalUrl}#app`,
      name: "Product Comparison Tool",
      description: "Interactive tool to compare products side by side",
      applicationCategory: "Shopping",
      operatingSystem: "Web",
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/images/compare-og.jpg`,
          width: 1200,
          height: 630,
          alt: "Compare Products - TryDos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return {
    ...metadata,
    structuredData: jsonLd,
  };
}

export async function getCategoriesMetadata({ params }) {
  const [country, lang] = params.lang.split("-");
  const mainCategory = params.mainCategory;

  // Get language for translations
  const language = lang || "en";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/categories/${mainCategory}`;

  // Fetch categories data
  const {
    boutiqueData: boutiquesData,
    categoriesData,
    featuredData,
    flashDealsData,
    currencyData,
  } = await GetHomeData(params);
  const categories = categoriesData.mainCategories || [];
  const brands = featuredData?.data?.brands || [];
  const boutiques = boutiquesData.boutiques || [];
  const allProducts = [
    ...(featuredData?.data.products || []),
    ...(flashDealsData?.data.products || []),
  ];
  const currentCategory = categoriesData.mainCategories.find(
    (cat) => cat.slug === mainCategory
  );

  const pageTitle = currentCategory
    ? `${currentCategory.name} - TryDos | Shop ${currentCategory.name} Products`
    : translateFunction("Categories - TryDos", language);

  const pageDescription = currentCategory
    ? `Discover premium ${currentCategory.name.toLowerCase()} products on TryDos. Browse our extensive collection of ${currentCategory.name.toLowerCase()} items from top brands. Find the best ${currentCategory.name.toLowerCase()} deals and latest trends.`
    : `${translateFunction(
        "Browse products by categories",
        language
      )} on TryDos. Find products across multiple categories including fashion, electronics, home & garden, and more. Shop by category to discover exactly what you're looking for.`;

  const keywords = [
    "categories",
    "shop by category",
    "product categories",
    "TryDos categories",
    ...(currentCategory
      ? [
          currentCategory.name,
          `${currentCategory.name} products`,
          `shop ${currentCategory.name}`,
        ]
      : []),
    ...categoriesData.mainCategories.slice(0, 10).map((cat) => cat.name),
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
    .join(", ");

  const primaryImage =
    currentCategory?.flat_photo_path.file_path || "/api/opengraph-image";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": currentCategory ? "CollectionPage" : "CategoryCodeSet",
    "@id": `${canonicalUrl}#page`,
    name: currentCategory ? currentCategory.name : "Product Categories",
    description: pageDescription,
    url: canonicalUrl,
    ...(currentCategory && {
      mainEntity: {
        "@type": "ProductGroup",
        "@id": `${canonicalUrl}#category`,
        name: currentCategory.name,
        description: `${currentCategory.name} products collection`,
        image: currentCategory.flat_photo_path.file_path
          ? getConfiguredImage({
              src:
                process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL +
                currentCategory.flat_photo_path.file_path,
              width: 800,
              height: 800,
              q: 80,
            })
          : undefined,
      },
    }),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Categories",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/categories`,
        },
        ...(currentCategory
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: currentCategory.name,
                item: canonicalUrl,
              },
            ]
          : []),
      ],
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        {
          url: primaryImage.startsWith("http")
            ? primaryImage
            : getConfiguredImage({
                src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + primaryImage,
                width: 1200,
                height: 630,
                q: 80,
              }),
          width: 1200,
          height: 630,
          alt: currentCategory
            ? `${currentCategory.name} - TryDos`
            : "Categories - TryDos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return {
    ...metadata,
    structuredData: jsonLd,
  };
}

export async function getSettingsMetadata({ params }) {
  const [country, lang] = params.lang.split("-");

  // Get language for translations
  const language = lang || "en";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/settings`;

  const pageTitle = translateFunction("Settings - TryDos", language);
  const pageDescription =
    translateFunction("Manage your account preferences", language) +
    ". Update your personal details, language preferences, notification settings, and more on TryDos.";

  const keywords = [
    "settings",
    "account settings",
    "user preferences",
    "profile settings",
    "TryDos account",
    "user profile",
    "account management",
  ]
    .filter(Boolean)
    .join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    name: "Account Settings",
    description: pageDescription,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "TryDos",
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Settings",
          item: canonicalUrl,
        },
      ],
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      locale: params.lang,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/api/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Settings - TryDos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false, // Settings pages should not be indexed
      follow: false,
    },
  };

  return {
    ...metadata,
    structuredData: jsonLd,
  };
}
