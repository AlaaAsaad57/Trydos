"use server";
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
        ? `?category_slugs=["${categorySlug}"]&limit=${limit}&offset=${offset}`
        : `?category_slugs=[]&limit=${limit}&offset=${offset}`
    }`;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}${boutiqueUrl}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cache-Control": "no-cache",
          lang: language,
          country: country,
        },
        next: {
          tags: ["boutiques", "home"],
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BOUTIQUES),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Boutiques Error: ${response.status}`);
    }

    const { data } = await response.json();

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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/boutique/simpleDetails/${slug}?lang=${language}&country=${country}`,
      {
        method: "GET",
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: {
          tags: ["home", "boutiques"],
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_BOUTIQUES),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Boutique Details Error: ${response.status}`);
    }
    let { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching boutique details:", error);
    throw error;
  }
}
