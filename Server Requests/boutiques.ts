"use server";

import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

interface Boutique {
  name: string;
  slug: string;
  description: string;
  icon: {
    file_path: string;
  };
  banners?: Array<{
    file_path: string;
  }>;
  mainCategoriesForProductIds?: Array<{
    flat_photo_path: {
      file_path: string;
    };
    slug: string;
  }>;
  childCategoriesForProductIds?: Array<{
    most_viewed_product_thumbnail: {
      file_path: string;
    };
    name: string;
    most_viewed_product_name: string;
    slug: string;
  }>;
}

interface BoutiquesResponse {
  total: number;
  limit: number;
  offset: number;
  boutiques: Array<{
    name: string;
    icon: string;
    slug: string;
    description: string;
    banners?: Array<{
      file_path: string;
    }>;
    mainCategoriesForProductIds?: Array<{
      icon: string;
      slug: string;
    }>;
    childCategoriesForProductIds?: Array<{
      photo: string;
      name: string;
      most_viewed_product_name: string;
      slug: string;
    }>;
  }>;
}

interface BoutiqueDetailsResponse {
  name: string;
  banners: any;
  icon: any;
  slug: string;
}

export async function fetchBoutiques(
  language: string,
  country: string,
  categorySlug?: string,
  offset: number = 0,
  limit: number = 10
): Promise<BoutiquesResponse> {
  try {
    const boutiqueUrl = `/api/home/boutiques${
      categorySlug?.length > 0
        ? `?category_slugs=["${categorySlug}"]&limit=${limit}&offset=${offset}&lang=${language}&country=${country}`
        : `?category_slugs=[]&limit=${limit}&offset=${offset}&lang=${language}&country=${country}`
    }`;
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}${boutiqueUrl}`,
      method: "GET",
      tags: ["boutiques", "home"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BOUTIQUES),
      local: `${country}-${language}`,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    if (response.isError) {
      console.error(`Boutiques Error: ${response.status}`);
      reportError(
        new Error(`Boutiques Error: ${response.status}-${response.error}`),
        {
          source: "boutiques",
          page: "boutiques",
          language: language,
          response: JSON.stringify(response),
          country: country,
          categorySlug: categorySlug,
          offset: offset,
          limit: limit,
        }
      );
      return {
        total: 0,
        limit: 0,
        offset: 0,
        boutiques: [],
      };
    }

    const { data } = response.data;

    return {
      total: data.total,
      limit: data.limit,
      offset: data.offset,
      boutiques:
        data?.boutiques?.map((boutique: Boutique) => ({
          name: boutique.name,
          icon: boutique.icon.file_path,
          slug: boutique.slug,
          description: boutique.description,
          banners: boutique?.banners?.map((banner) => ({
            file_path: banner?.file_path,
          })),
          mainCategoriesForProductIds:
            boutique?.mainCategoriesForProductIds?.map((main) => ({
              icon: main.flat_photo_path.file_path,
              slug: main.slug,
            })),
          childCategoriesForProductIds:
            boutique?.childCategoriesForProductIds?.map((main) => ({
              photo: main.most_viewed_product_thumbnail.file_path,
              name: main.name,
              most_viewed_product_name: main.most_viewed_product_name,
              slug: main.slug,
            })),
        })) || [],
    };
  } catch (error) {
    console.error("Error fetching boutiques:", error);

    throw error;
  }
}

export async function fetchBoutiqueDetails(
  slug: string,
  language: string,
  country: string
): Promise<BoutiqueDetailsResponse> {
  try {
    if (slug === "listing" || !slug) {
      return {
        name: "listing",
        banners: null,
        icon: null,
        slug: "listing",
      };
    }
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/boutique/simpleDetails/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["home", "boutiques"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BOUTIQUES),
      local: `${country}-${language}`,
    });

    if (response.isError) {
      console.error(`Boutique Details Error: ${response.status}`);
      reportError(
        new Error(
          `Boutique Details Error: ${response.status}-${response.error}`
        ),
        {
          source: "boutiques",
          page: "boutique-details",
          language: language,
          country: country,
          slug: slug,
          response: JSON.stringify(response),
        }
      );
      return {
        name: "NOT_FOUND",
        banners: null,
        icon: null,
        slug: "listing",
      };
    }
    return response.data.data;
  } catch (error) {
    console.error("Error fetching boutique details:", error);
    return {
      name: "NOT_FOUND",
      banners: null,
      icon: null,
      slug: null,
    };
  }
}
