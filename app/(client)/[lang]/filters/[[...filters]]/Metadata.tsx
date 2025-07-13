// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";
import {
  filtersToSearchParams,
  generateCloudinaryUrl,
  GetImageUrl,
  parseFiltersFromParams,
} from "utils/tinyUtils";
const GenerateTitleBasedOnFilters = (filters: string[]) => {
  let parsedFilters = parseFiltersFromParams(filters);
  let { categories, brands, colors, boutiques, sizes, tags_names } =
    parsedFilters;
  let title = "Trydos - ";
  let description = "Discover New ";
  if (tags_names.length > 0) {
    title += " Tags: ";
    description += " Tags: ";
    tags_names.forEach((tag) => {
      title += `${tag}`;
      description += ` ${tag},`;
    });
  }
  if (boutiques.length > 0) {
    title += " Boutiques: ";
    description += " Boutiques: ";
    boutiques.forEach((boutique) => {
      title += `${boutique}`;
      description += ` ${boutique},`;
    });
  }
  if (categories.length > 0) {
    title += " Categories: ";
    description += " Categories: ";
    categories.forEach((category) => {
      title += `${category}`;
      description += ` ${category},`;
    });
  }
  if (brands.length > 0) {
    title += " Brands: ";
    description += " Brands: ";
    brands.forEach((brand) => {
      title += ` ${brand}`;
      description += ` ${brand},`;
    });
  }
  if (colors.length > 0) {
    title += " Colors: ";
    description += " Colors: ";
    colors.forEach((color) => {
      title += ` ${color}`;
      description += ` ${color},`;
    });
  }
  if (sizes.length > 0) {
    title += " Sizes: ";
    description += " Sizes: ";
    sizes.forEach((size) => {
      title += ` ${size}`;
      description += ` ${size},`;
    });
  }
  description += " Products on Trydos";
  return {
    title,
    description,
  };
};
export async function getBoutiqueMetadata({
  params,
  options = { is_fearured: false, is_flashDeals: false },
}) {
  const [country, language] = params.lang.split("-");
  let UrlSearchParams = getUrlSearchForMeta(params, options);
  UrlSearchParams.set("lang", language);
  UrlSearchParams.set("country", country);
  let response = await fetch(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      `/api/products/simplified-meta-filters?${UrlSearchParams.toString()}`,
    {
      headers: {
        lang: language,
        country,
      },
      next: {
        revalidate: 36000,
        tags: ["listing"],
      },
    }
  );
  let responseData = await response.json();

  let images_array = responseData?.data?.products?.map(
    (product) => product.image[0]
  );

  let og_image =
    images_array.length > 0
      ? generateCloudinaryUrl({
          width: 1200,
          height: 630,
          publicIds: images_array,
        })
      : `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/opengraph-image.png`;
  let configuredMetaData = generateMetaData(responseData);
  let filtersUrl =
    params?.filters?.length > 0 ? `/${params.filters?.join("/")}` : "/";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters${filtersUrl}`;
  let data = {
    title: configuredMetaData.title,
    description: configuredMetaData.description,
    canonical: canonicalUrl,
    keywords: configuredMetaData.keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters${filtersUrl}`,
      languages: {
        en: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en/filters${filtersUrl}`,
        tr: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-tr/filters${filtersUrl}`,
        ar: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-ar/filters${filtersUrl}`,
      },
    },
    openGraph: {
      title: configuredMetaData.title,
      description: configuredMetaData.description,
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters${filtersUrl}`,
      siteName: "Trydos",
      images: [{ url: og_image }],
      locale: params.lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: configuredMetaData.title,
      description: configuredMetaData.description,
      images: [og_image],
      creator: "@trydos",
    },
  };

  return data;
}
export const GetStructuredData = ({ params, prodcts, boutique }) => {
  let filtersUrl =
    params?.filters?.length > 0 ? `/${params.filters?.join("/")}` : "/";
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: GenerateTitleBasedOnFilters(params.filters).title,
    url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters${filtersUrl}`,
    description: GenerateTitleBasedOnFilters(params.filters).description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: prodcts.map((product, index) => {
        return {
          "@type": "Product",
          position: index + 1,
          name: product.name,
          image: product.images?.[0]?.file_path ?? product.images?.[0],
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
          category: product.category.name,
          brand: {
            "@type": "Brand",
            name: product.brand.name,
          },
          manufacturer: {
            "@type": "Organization",
            name: product.boutique.name,
            url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/boutiques/${product.boutique.slug}`,
          },
          sku: product.slug,
          description: product.description,
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.price,
            availability: "https://schema.org/InStock",
            url: product.url,
          },
        };
      }),
    },
  };
};
function generateMetaData(data) {
  try {
    if (!data || !data.data) return {};

    const {
      categories = [],
      brands = [],
      colors = [],
      sizes = [],
      products = [],
      boutiques = [],
      prices = {},
      search_query = "",
    } = data.data;

    const siteName = "Trydos";

    const normalized = (arr) => [
      ...new Set(arr.filter(Boolean).map((item) => item.trim())),
    ];

    const normalizedCategories = normalized(categories);
    const normalizedBrands = normalized(brands);
    const normalizedBoutiques = normalized(boutiques);
    const normalizedSizes = normalized(sizes);

    const categoryPhrase = normalizedCategories?.length
      ? normalizedCategories?.slice(0, 3)?.join(", ")
      : "our top categories";

    const brandPhrase = normalizedBrands?.length
      ? normalizedBrands?.slice(0, 3)?.join(", ")
      : "trusted brands";

    const sizePhrase = normalizedSizes?.length
      ? normalizedSizes?.slice(0, 4)?.join(", ")
      : "all standard sizes";

    const priceMin =
      prices.min_price != null ? prices.min_price.toFixed(2) : "0.00";
    const priceMax =
      prices.max_price != null ? prices.max_price.toFixed(2) : "9999.99";

    const productCount = products?.length || 0;

    const title = search_query
      ? `Search results for "${search_query}" - ${productCount} products | ${siteName}`
      : `Shop ${categoryPhrase} from ${brandPhrase} | ${siteName}`;

    const description = `Discover a curated selection of ${categoryPhrase.toLowerCase()} on ${siteName}. Featuring ${brandPhrase}, ${sizePhrase}, and prices from $${priceMin} to $${priceMax}.`;

    const keywordPool = [
      siteName,
      ...normalizedCategories,
      ...normalizedBrands,
      ...normalizedBoutiques,
      ...normalizedSizes,
    ];
    if (search_query?.length > 0) {
      keywordPool.push(search_query);
    }

    const keywords = keywordPool?.join(", ");
    return {
      title,
      description,
      keywords,
      og_title: title,
      og_description: description,
      twitter_title: title,
      twitter_description: description,
    };
  } catch (e) {
    console.log("e", e);
    throw e;
  }
}
export const getUrlSearchForMeta = (params, options) => {
  const parsedFilters =
    params?.filters?.length > 0 ? parseFiltersFromParams(params?.filters) : {};
  let parsedFiltersSearch = filtersToSearchParams(parsedFilters);
  let UrlSearchParams = new URLSearchParams();
  if (parsedFiltersSearch?.search_text) {
    UrlSearchParams.set("search_text", parsedFiltersSearch?.search_text);
  }
  if (parsedFiltersSearch?.categories) {
    UrlSearchParams.set(
      "category_slugs",
      decodeURIComponent(parsedFiltersSearch?.categories)
    );
  }
  if (parsedFiltersSearch?.prices) {
    UrlSearchParams.set(
      "price",
      decodeURIComponent(parsedFiltersSearch?.prices)
    );
  }
  if (parsedFiltersSearch?.sizes) {
    UrlSearchParams.set(
      "attributes",
      JSON.stringify([
        {
          id: 1,
          options: JSON.parse(decodeURIComponent(parsedFiltersSearch?.sizes)),
          name: "Size",
        },
      ])
    );
  }
  if (parsedFiltersSearch?.colors) {
    UrlSearchParams.set(
      "colors",
      decodeURIComponent(parsedFiltersSearch?.colors)
    );
  }
  if (parsedFiltersSearch?.brands) {
    UrlSearchParams.set("brand_slugs", decodeURI(parsedFiltersSearch?.brands));
  }
  if (
    parsedFiltersSearch?.boutiques &&
    parsedFiltersSearch?.boutiques !== "null"
  ) {
    UrlSearchParams.set(
      "boutique_slugs",
      decodeURIComponent(parsedFiltersSearch?.boutiques)
    );
  }

  if (
    parsedFiltersSearch?.tags_names &&
    parsedFiltersSearch?.tags_names !== "null"
  ) {
    UrlSearchParams.set(
      "tags_names",
      decodeURIComponent(parsedFiltersSearch?.tags_names)
    );
  }
  if (options.is_fearured) {
    UrlSearchParams.set("is_featured", "true");
  }
  if (options.is_flashDeals) {
    UrlSearchParams.set("flash-deal", "true");
  }
  return UrlSearchParams;
};
