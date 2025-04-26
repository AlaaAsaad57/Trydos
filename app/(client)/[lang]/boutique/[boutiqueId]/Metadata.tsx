// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";

export async function getBoutiqueMetadata({ params, searchParams }) {
  let EditedSearchParams: any = {};
  if (searchParams?.search_text) {
    EditedSearchParams = {
      ...EditedSearchParams,
      search_text: searchParams?.search_text,
    };
  }
  if (searchParams?.categories) {
    EditedSearchParams = {
      ...EditedSearchParams,
      categories: searchParams?.categories,
    };
  }
  if (searchParams?.brands) {
    EditedSearchParams = {
      ...EditedSearchParams,
      brands: searchParams?.brands,
    };
  }
  if (searchParams?.colors) {
    EditedSearchParams = {
      ...EditedSearchParams,
      colors: searchParams?.colors,
    };
  }
  if (searchParams?.prices) {
    EditedSearchParams = {
      ...EditedSearchParams,
      prices: searchParams?.prices,
    };
  }
  if (searchParams?.sizes) {
    EditedSearchParams = {
      ...EditedSearchParams,
      sizes: searchParams?.sizes,
    };
  }
  if (searchParams?.boutiques) {
    EditedSearchParams = {
      ...EditedSearchParams,
      boutiques: searchParams?.boutiques,
    };
  }
  const GetProductsData = async () => {
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${
          params.lang
        }/search?${new URLSearchParams({
          boutiqueId:
            params.boutiqueId === "listing" ? null : params.boutiqueId,
          noProducts: "false",
          noFilters: "false",
          offset: "false",
          searchParams:
            Object.keys(EditedSearchParams).length > 0
              ? JSON.stringify(EditedSearchParams)
              : "{}",
        }).toString()}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          },
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
      let data = await response.json();
      return data.data;
    } catch (error) {
      console.log(error, "getProductsData", response);
      return {};
    }
  };
  const GetBoutiqueData = async () => {
    let response;
    try {
      if (params.boutiqueId === "listing") {
        return {
          name: "Search",
          banners: null,
          icon: null,
        };
      }
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${params.lang}/boutiques/${params.boutiqueId}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LISTING),
          },
        }
      );
      let data = await response.json();
      if (data.code === 404) {
        return "NOT_FOUND";
      }
      return data.data;
    } catch (error) {
      console.log(error, "getBoutiqueData", response);
      return "NOT_FOUND";
    }
  };
  const [filtersData, boutique] = await Promise.all([
    GetProductsData(),
    GetBoutiqueData(),
  ]);
  console.log(filtersData, boutique);
  let filters = {
    categories: filtersData?.categories,
    brands: filtersData?.brands,
    colors: filtersData?.colors,
    prices: filtersData?.prices?.priceRanges,
    sizes: filtersData?.attributes?.[0]?.options,
    boutiques: params.boutiqueId !== "listing" ? null : filtersData?.boutiques,
    search_text: EditedSearchParams?.search_text || null,
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
    boutique.name === "listing"
      ? filtersData?.products?.[0]?.images?.[0]?.file_path
      : boutique.banners?.[0]?.file_path || boutique.iconUrl || defaultOgImage;

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

  const canonicalUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/boutique/${boutique.slug}`;

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
      images: [
        {
          url: getConfiguredImage({
            src: ogImage,
            width: 100,
            height: 52,
            q: 80,
          }),
          width: 100,
          height: 52,
          alt: boutique.name,
        },
        {
          url: getConfiguredImage({
            src: ogImage,
            width: 200,
            height: 104,
            q: 80,
          }),
          width: 200,
          height: 104,
          alt: boutique.name,
        },
        {
          url: getConfiguredImage({
            src: ogImage,
            width: 400,
            height: 209,
            q: 80,
          }),
          width: 400,
          height: 209,
          alt: boutique.name,
        },
        {
          url: getConfiguredImage({
            src: ogImage,
            width: 800,
            height: 418,
            q: 80,
          }),
          width: 800,
          height: 418,
          alt: boutique.name,
        },
        {
          url: getConfiguredImage({
            src: ogImage,
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
        getConfiguredImage({ src: ogImage, width: 1200, height: 630, q: 80 }),
        getConfiguredImage({ src: ogImage, width: 800, height: 418, q: 80 }),
        getConfiguredImage({ src: ogImage, width: 400, height: 209, q: 80 }),
        getConfiguredImage({ src: ogImage, width: 200, height: 104, q: 80 }),
        getConfiguredImage({ src: ogImage, width: 100, height: 52, q: 80 }),
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
