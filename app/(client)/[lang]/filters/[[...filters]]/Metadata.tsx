// components/BoutiqueHead.tsx
"use server";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { translateFunction } from "utils/functions";
import { generateCloudinaryUrl, parseFiltersFromParams } from "utils/tinyUtils";
const GenerateTitleBasedOnFilters = ({ filters, language }) => {
  let parsedFilters = parseFiltersFromParams(filters);
  let { categories, brands, colors, boutiques, sizes, tags_names } =
    parsedFilters;
  let title = translateFunction("Trydos - ", language);
  let description = translateFunction("Discover New ", language);
  if (tags_names?.length > 0) {
    title += translateFunction(" Tags: ", language);
    description += " Tags: ";
    tags_names.forEach((tag) => {
      title += `${tag}`;
      description += ` ${tag},`;
    });
  }
  if (boutiques?.length > 0) {
    title += translateFunction(" Boutiques: ", language);
    description += " Boutiques: ";
    boutiques.forEach((boutique) => {
      title += `${boutique}`;
      description += ` ${boutique},`;
    });
  }
  if (categories?.length > 0) {
    title += translateFunction(" Categories: ", language);
    description += translateFunction(" Categories: ", language);
    categories.forEach((category) => {
      title += `${category}`;
      description += ` ${category},`;
    });
  }
  if (brands?.length > 0) {
    title += translateFunction(" Brands: ", language);
    description += translateFunction(" Brands: ", language);
    brands.forEach((brand) => {
      title += ` ${brand}`;
      description += ` ${brand},`;
    });
  }
  if (colors?.length > 0) {
    title += translateFunction(" Colors: ", language);
    description += translateFunction(" Colors: ", language);
    colors.forEach((color) => {
      title += ` ${color}`;
      description += ` ${color},`;
    });
  }
  if (sizes?.length > 0) {
    title += translateFunction(" Sizes: ", language);
    description += translateFunction(" Sizes: ", language);
    sizes.forEach((size) => {
      title += ` ${size}`;
      description += ` ${size},`;
    });
  }
  description += translateFunction(" Products on Trydos", language);
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
  let parsedFilters = parseFiltersFromParams(params.filters || []);
  if (parsedFilters.prices) {
    parsedFilters = {
      ...parsedFilters,
      prices: parsedFilters.prices?.map((s) =>
        s.split("-").map((d) => Number(d))
      )?.[0],
    };
  }
  let responseData = await getProductsAndFiltersFromElastic({
    country,
    language_code: language,
    filters: {
      ...parsedFilters,
      featured: options.is_fearured,
      flashdeal: options.is_flashDeals,
      search_text: parsedFilters?.search_text?.[0],
    },
    limit: 10,
  });

  if (!responseData.products) {
    throw new Error(`Elastic FIlters Page Meta Error`);
  }
  let images_array = responseData?.products?.map(
    (product) => product?.images?.[0].file_path
  );

  let og_image =
    images_array.length > 0
      ? generateCloudinaryUrl({
          width: 1200,
          height: 630,
          publicIds: images_array.slice(0, 3),
        })
      : `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/opengraph-image.png`;
  let configuredMetaData = generateMetaData({ data: responseData, language });
  let filtersUrl =
    params?.filters?.length > 0 ? `/${params.filters?.join("/")}` : "";
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
export const GetStructuredData = async ({
  params,
  is_flashDeals,
  is_fearured,
  response,
}) => {
  let filtersUrl =
    params?.filters?.length > 0 ? `/${params.filters?.join("/")}` : "/";
  let [country, language] = params.lang.split("-");

  const parsedFilters = parseFiltersFromParams(params.filters || []);
  // UrlSearchParams.set("lang", language);
  // UrlSearchParams.set("country", country);
  // let response = await fetchServerData({
  //   url:
  //     process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
  //     `/api/products/simplified-meta-filters?${UrlSearchParams.toString()}`,
  //   local: `${country}-${language}`,
  //   method: "GET",
  //   revalidate: 36000,
  //   tags: ["listing"],
  // });

  let jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: GenerateTitleBasedOnFilters({ filters: params.filters, language })
      .title,
    url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/filters${filtersUrl}`,
    description: GenerateTitleBasedOnFilters({
      filters: params.filters,
      language,
    }).description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: response.products.map((product, index) => {
        return {
          "@type": "Product",
          position: index + 1,
          name: product?.name,
          image: product?.images?.[0]?.file_path ?? product.images?.[0],
          url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/products/${product.slug}`,
          category: product?.category?.name,
          brand: {
            "@type": "Brand",
            name: product?.brand?.name,
          },
          manufacturer: {
            "@type": "Organization",
            name: product?.boutique?.name,
            url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/boutiques/${product?.boutique?.slug}`,
          },
          sku: product.slug,
          description: product?.description,
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product?.price,
            availability: "https://schema.org/InStock",
            url:
              process.env.NEXT_PUBLIC_REMOTE_FRONT +
              `/products/${product?.slug}`,
          },
        };
      }),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
function generateMetaData({ data, language }) {
  try {
    if (!data) return {};

    const {
      categories = [],
      brands = [],
      colors = [],
      sizes = [],
      products = [],
      boutiques = [],
      prices = {},
      search_query = "",
    } = data;

    const siteName = translateFunction("Trydos", language);

    const normalized = (arr) => [
      ...new Set(
        arr.filter(Boolean).map((item) => {
          if (typeof item === "string") return item.trim();
          else if (item?.name) return item.name.trim();
        })
      ),
    ];

    const normalizedCategories = normalized(categories);
    const normalizedBrands = normalized(brands);
    const normalizedBoutiques = normalized(boutiques);
    const normalizedSizes = normalized(sizes);
    const normalizedColors = normalized(colors);

    const categoryPhrase = normalizedCategories?.length
      ? normalizedCategories?.slice(0, 3)?.join(", ")
      : translateFunction("our top categories", language);

    const brandPhrase = normalizedBrands?.length
      ? normalizedBrands?.slice(0, 3)?.join(", ")
      : translateFunction("trusted brands", language);

    const sizePhrase = normalizedSizes?.length
      ? normalizedSizes?.slice(0, 4)?.join(", ")
      : translateFunction("all standard sizes", language);
    const colorPhrase = normalizedColors?.length
      ? normalizedColors?.slice(0, 4)?.join(", ")
      : translateFunction("all colors", language);
    const priceMin =
      prices?.min_price != null ? prices?.min_price.toFixed(2) : "0.00";
    const priceMax =
      prices?.max_price != null ? prices?.max_price.toFixed(2) : "9999.99";

    const title = search_query
      ? `${translateFunction(
          "Search results for",
          language
        )} "${search_query}" - ${siteName}`
      : `${translateFunction(
          "Shop",
          language
        )} ${categoryPhrase} ${translateFunction(
          "from",
          language
        )} ${brandPhrase} | ${siteName}`;

    const description = `${translateFunction(
      "Discover a curated selection of",
      language
    )} ${categoryPhrase.toLowerCase()} ${translateFunction(
      "on",
      language
    )} ${siteName}. ${translateFunction(
      "Featuring",
      language
    )} ${brandPhrase}, ${colorPhrase}, ${sizePhrase}, ${translateFunction(
      "and prices from",
      language
    )} $${priceMin} ${translateFunction("to", language)} $${priceMax}.`;

    const keywordPool = [
      siteName,
      ...normalizedCategories,
      ...normalizedBrands,
      ...normalizedBoutiques,
      ...normalizedSizes,
      ...normalizedColors,
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
    console.error("filters generatemetadata error", e);
    throw e;
  }
}
