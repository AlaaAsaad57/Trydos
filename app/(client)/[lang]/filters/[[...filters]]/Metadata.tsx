// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";
import { parseFiltersFromParams, filtersToSearchParams } from "utils/tinyUtils";
import { fetchFilteredProducts, fetchBoutiqueDetails } from "Server Requests";

export async function getBoutiqueMetadata({ params, searchParams }) {
  // Parse filters from path parameters instead of search parameters
  const parsedFilters = parseFiltersFromParams(params.filters);

  // Convert to the format expected by the API
  const EditedSearchParams = filtersToSearchParams(parsedFilters);
  const [country, language] = params.lang.split("-");
  const GetProductsData = async () => {
    try {
      const result = await fetchFilteredProducts(
        language,
        country,
        params.filters || [],
        "false",
        "false",
        null
      );
      return result.data;
    } catch (error) {
      console.log(error, "getProductsData");
      return {
        categories: [],
        brands: [],
        colors: [],
        prices: {
          priceRanges: [],
        },
        attributes: [],
        boutiques: [],
        products: [],
        offset: 0,
        limit: 0,
        total_size: 0,
        search_time: null,
        search_text: null,
      };
    }
  };
  const GetBoutiqueData = async () => {
    // Get the first boutique from the boutiques filter parameters
    let selectedBoutique = parsedFilters?.boutiques?.[0] || null;

    try {
      if (!selectedBoutique) {
        return {
          name: "Search",
          banners: null,
          icon: null,
        };
      }

      const data = await fetchBoutiqueDetails(
        selectedBoutique,
        language,
        country
      );
      return data;
    } catch (error) {
      console.log(error, "getBoutiqueData");
      return {
        name: "Search",
        banners: null,
        icon: null,
        iconUrl: null,
      };
    }
  };
  const [filtersData, boutique] = await Promise.all([
    GetProductsData(),
    GetBoutiqueData(),
  ]);
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

  const defaultOgImage = "/default-og-image.jpg";

  const ogImage =
    boutique.name === "Search"
      ? filtersData?.products?.[0]?.images?.[0]?.file_path
      : boutique.banners?.[0]?.file_path ||
        boutique?.icon?.file_path ||
        defaultOgImage;

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
              url: getConfiguredImage({
                src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
                width: 1200,
                height: 630,
                q: 80,
              }),
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
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
          width: 1200,
          height: 630,
          q: 80,
        }),
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
          width: 800,
          height: 418,
          q: 80,
        }),
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
          width: 400,
          height: 209,
          q: 80,
        }),
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
          width: 200,
          height: 104,
          q: 80,
        }),
        getConfiguredImage({
          src: process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL + ogImage,
          width: 100,
          height: 52,
          q: 80,
        }),
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
