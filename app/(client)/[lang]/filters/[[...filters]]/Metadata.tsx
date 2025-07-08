// components/BoutiqueHead.tsx

import { getConfiguredImage } from "utils/functions";
import {
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
export async function getBoutiqueMetadata({ params, searchParams }) {
  let {
    categories,
    brands,
    colors,
    sizes,
    products,
    boutiques,
    tags_names,
    search_query,
  } = {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    products: [],
    boutiques: [],
    tags_names: [],
    search_query: "",
  };
  const keywords = [
    "TryDos",
    ...(categories?.map((s) => s.name) || []),
    ...(brands?.map((s) => s.name) || []),
    ...(colors?.map((s) => s) || []),
    ...(sizes?.map((s) => s.name) || []),
    ...(products?.map((s) => s.name) || []),
    ...(tags_names?.map((s) => s) || []),
    ...(search_query?.split(" ") || []),
  ]
    .filter(Boolean)
    .join(", ");
  const [country, language] = params.lang.split("-");
  let parsedFilters = parseFiltersFromParams(params.filters);
  let image;
  if (parsedFilters.boutiques) {
    image = getConfiguredImage({
      src: GetImageUrl("/product/2025-06-10-6847bb8b44ea4"),
      width: 1200,
      height: 630,
    });
  } else {
    image = generateCloudinaryUrl({
      width: 1200,
      height: 630,
      publicIds: [
        "/product/2025-06-10-6847bb8b44ea4",
        "/product/2025-06-10-6847bb8fce155",
        "/product/2025-06-10-6847bba79170d",
      ],
      overlayText: "Test",
    });
  }
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${
    params.lang
  }/filters/${params.filters.join("/")}`;
  let data = {
    title: GenerateTitleBasedOnFilters(params.filters).title,
    description: GenerateTitleBasedOnFilters(params.filters).description,
    canonical: canonicalUrl,
    keywords: keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${
        params.lang
      }/filters/${params.filters.join("/")}`,
      languages: {
        en: `${
          process.env.NEXT_PUBLIC_REMOTE_FRONT
        }/${country}-en/filters/${params.filters.join("/")}`,
        tr: `${
          process.env.NEXT_PUBLIC_REMOTE_FRONT
        }/${country}-tr/filters/${params.filters.join("/")}`,
        ar: `${
          process.env.NEXT_PUBLIC_REMOTE_FRONT
        }/${country}-ar/filters/${params.filters.join("/")}`,
      },
    },
    openGraph: {
      title: GenerateTitleBasedOnFilters(params.filters).title,
      description: GenerateTitleBasedOnFilters(params.filters).description,
      url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${
        params.lang
      }/filters/${params.filters.join("/")}`,
      siteName: "Trydos",
      images: [{ url: image }],
      locale: params.lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: GenerateTitleBasedOnFilters(params.filters).title,
      description: GenerateTitleBasedOnFilters(params.filters).description,
      images: [image],
      creator: "@trydos",
    },
  };

  return data;
}
export const GetStructuredData = ({ params, prodcts, boutique }) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: GenerateTitleBasedOnFilters(params.filters).title,
    url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${
      params.lang
    }/filters/${params.filters.join("/")}`,
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
