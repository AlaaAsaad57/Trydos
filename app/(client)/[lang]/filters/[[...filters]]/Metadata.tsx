// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";
import { parseFiltersFromParams, filtersToSearchParams } from "utils/tinyUtils";
import { fetchFilteredProducts, fetchBoutiqueDetails } from "Server Requests";
import { GetFiltersData } from "utils/pagesDataRequests/FiltersPageData";

export async function getBoutiqueMetadata({ params, searchParams }) {
  // Parse filters from path parameters instead of search parameters
  const parsedFilters = parseFiltersFromParams(params.filters);

  // Convert to the format expected by the API
  const EditedSearchParams = filtersToSearchParams(parsedFilters);
  const [country, language] = params.lang.split("-");
  let boutiqueItem = parsedFilters?.boutiques?.[0] || null;
  let {
    products: filtersData,
    currency,
    boutique: boutique,
  } = await GetFiltersData(
    { lang: params.lang, filters: params.filters },
    boutiqueItem,
    false,
    false,
    true
  );
  let filters = {
    categories: filtersData?.categories,
    brands: filtersData?.brands,
    colors: filtersData?.colors,
    prices: filtersData?.prices?.priceRanges,
    sizes: filtersData?.attributes?.[0]?.options,
    boutiques: filtersData?.boutiques,
    search_text: parsedFilters?.search_text?.[0] || null,
  };
  const pageTitle = `${boutique.name} | Discover Boutique Products, Brands & More`;
  const pageDescription = `Shop exclusive products from ${
    boutique.name
  }. Categories: ${filters?.categories
    ?.map((s) => s.name)
    ?.join(", ")}. Top brands: ${filters?.brands
    ?.map((s) => s.name)
    ?.join(", ")}.`;
  const baseUrl =
    process.env.NEXT_PUBLIC_REMOTE_FRONT ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const primaryOgImage = `${baseUrl}/api/generate-og-images?title=${pageTitle}&description=${pageDescription}&images=${filtersData?.products
    ?.map((p) => p.images?.[0]?.file_path)
    .join(",")}&type=collection`;

  const keywords = [
    boutique.name,
    ...(filters?.categories?.map((s) => s.name) || []),
    ...(filters?.brands?.map((s) => s.name) || []),
    ...(filters?.colors?.map((s) => s) || []),
    ...(filters?.sizes?.map((s) => s.name) || []),
    ...(filtersData?.products?.map((s) => s.name) || []),
  ]
    .filter(Boolean)
    .join(", ");

  const filterPath = params.filters ? params.filters.join("/") : "";
  const canonicalUrl = filterPath
    ? `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/filters/${filterPath}`
    : `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/filters`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "TryDos",
      images: boutique?.banners
        ? boutique?.banners?.map((s) => ({
            url: getConfiguredImage({
              src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + s.file_path,
              width: 1200,
              height: 630,
              q: 80,
            }),
            width: 1200,
            height: 630,
            alt: boutique.name,
          }))
        : [
            {
              url: primaryOgImage,
              width: 1200,
              height: 630,
              alt: boutique.name,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [
        primaryOgImage,
        primaryOgImage,
        primaryOgImage,
        primaryOgImage,
        primaryOgImage,
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
