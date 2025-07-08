// components/BoutiqueHead.tsx

import { generateCloudinaryUrl, parseFiltersFromParams } from "utils/tinyUtils";

export async function getBoutiqueMetadata({ params, searchParams }) {
  // Parse filters from path parameters instead of search parameters
  const parsedFilters = parseFiltersFromParams(params.filters);
  const metaData = {
    title: "TryDos",
    description: "TryDos",
    images: [
      "/product/2025-06-10-6847bb8b44ea4",
      "/product/2025-06-10-6847bb8fce155",
      "/product/2025-06-10-6847bba79170d",
    ],
  };
  // Convert to the format expected by the API
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

  const filterPath = params.filters ? params.filters.join("/") : "";
  const canonicalUrl = `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/filters/${filterPath}`;

  return {
    title: metaData.title,
    description: metaData.description,
    keywords,
    openGraph: {
      type: "website",
      title: metaData.title,
      description: metaData.description,
      url: canonicalUrl,
      siteName: "TryDos",
      images: [
        {
          url: generateCloudinaryUrl({
            width: 1200,
            height: 630,
            publicIds: [
              "/product/2025-06-10-6847bb8b44ea4",
              "/product/2025-06-10-6847bb8fce155",
              "/product/2025-06-10-6847bba79170d",
            ],
            overlayText: "Test",
          }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaData.title,
      description: metaData.description,
      images: [
        generateCloudinaryUrl({
          width: 1200,
          height: 630,
          publicIds: [
            "/product/2025-06-10-6847bb8b44ea4",
            "/product/2025-06-10-6847bb8fce155",
            "/product/2025-06-10-6847bba79170d",
          ],
          overlayText: "Test",
        }),
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
