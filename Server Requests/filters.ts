"use server";
import { reportError } from "utils/error-reporter";
import {
  configureSearchParams,
  parseFiltersFromParams,
  filtersToSearchParams,
} from "utils/tinyUtils";
import { fetchServerData } from "./ServerFetch";

interface FilteredProductsResponse {
  data: {
    url?: string;
    isError?: boolean;
    featured?: any;
    flashDeals?: any;
    offset: number;
    limit: number;
    total_size: number;
    categories: Array<{
      name: string;
      icon?: string;
      most_viewed_product_thumbnail?: string;
      slug: string;
      childes: Array<{
        name: string;
        slug: string;
        most_viewed_product_thumbnail?: string;
        childes?: Array<{
          name: string;
          slug: string;
          most_viewed_product_thumbnail?: string;
        }>;
      }>;
    }>;
    brands: Array<{
      name: string;
      icon?: string;
      slug: string;
    }>;
    prices: any;
    colors: any;
    attributes: any;
    boutiques: any;
    products: Array<{
      name: string;
      id?: string;
      slug: string;
      flash_deal_end_date: string;
      details: string;
      colors: any[];
      images: Array<{ file_path: string }>;
      sync_color_images: Array<{
        color_name: string;
        images: Array<{ file_path: string }>;
      }>;
      price: number;
      offer_price?: number;
      brand: {
        name: string;
        icon?: string;
      };
      category: {
        name: string;
        icon?: string;
      };
    }>;
  };
}

export async function fetchFilteredProducts(
  language: string,
  country: string,
  filters: string[] = [],
  noProducts: string = "false",
  noFilters: string = "false",
  offset: string | null = null,
  filters_offset?: string,
  isFeatured?: boolean,
  isFlashDeals?: boolean
): Promise<FilteredProductsResponse> {
  try {
    // Parse filters from path parameters
    const parsedFilters =
      filters.length > 0 ? parseFiltersFromParams(filters) : {};

    // Convert path-based filters to search params format for backend API
    const searchParamsVar = filtersToSearchParams(parsedFilters);

    const configuredParams = configureSearchParams({
      searchParams: searchParamsVar,
      noProducts,
      noFilters,
      lang: language,
      offset,
      boutiqueId: "listing", // Always listing for filters route
      filters_offset,
    });
    let configuredUrl;
    if (isFeatured) {
      configuredUrl = `/api/products/featured?${configuredParams.toString()}`;
    } else {
      if (isFlashDeals) {
        configuredParams.set("flash-deal", "true");
      }
      configuredUrl = `/api/products/searchInCatalog?${configuredParams.toString()}`;
    }

    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}${configuredUrl}`,
      method: "GET",
      tags: ["listing"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LISTING),
      local: `${country}-${language}`,
    });

    if (response.isError) {
      reportError(new Error(`Filtered Products Error: ${response.status}`), {
        source: "filters",
        page: "filtered-products",
        language: language,
        country: country,
        response: JSON.stringify(response),
      });
      return {
        data: {
          isError: true,
          offset: 0,
          limit: 0,
          total_size: 0,
          categories: [],
          brands: [],
          prices: [],
          colors: [],
          attributes: [],
          boutiques: [],
          products: [],
        },
      };
    }

    const data = response.data;

    return {
      data: {
        url: `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}${configuredUrl}`,
        offset: data?.data?.offset,
        limit: data?.data?.limit,
        total_size: data?.data?.total_size,
        categories: data?.data?.categories?.map((c: any) => ({
          name: c.name,
          icon: c?.flat_photo_path?.file_path,
          most_viewed_product_thumbnail:
            c?.most_viewed_product_thumbnail?.file_path,
          slug: c.slug,
          childes: c?.childes?.map((child: any) => ({
            name: child.name,
            slug: child.slug,
            most_viewed_product_thumbnail:
              child?.most_viewed_product_thumbnail?.file_path,
            childes: child?.childes?.map((c_child: any) => ({
              name: c_child.name,
              slug: c_child.slug,
              most_viewed_product_thumbnail:
                c_child?.most_viewed_product_thumbnail?.file_path,
            })),
          })),
        })),
        brands: data?.data?.brands?.map((s: any) => ({
          name: s.name,
          icon: s.icon?.file_path,
          slug: s.slug,
        })),
        prices: data?.data?.prices,
        colors: data?.data?.colors,
        attributes: data?.data?.attributes,
        boutiques: data.data?.boutiques,
        products: data?.data?.products?.map((s: any) => ({
          name: s?.name,
          featured: s?.featured,
          flash_deal_end_date: s?.flash_deal_end_date,
          label_names: s.label_names ?? [],
          slug: s?.slug,
          id: s?.id,
          product_id: s?.product_id,
          redeem_price: s?.redeem_price,
          is_redeem: s?.has_redeem_discount,
          details: s?.details,
          colors: s?.colors,
          images: s?.images?.map((im: any) => ({ file_path: im.file_path })),
          sync_color_images: s?.sync_color_images?.map((sync_im: any) => ({
            color_name: sync_im?.color_name,
            images: sync_im?.images?.map((im: any) => ({
              file_path: im.file_path,
            })),
          })),
          price: s?.price,
          offer_price: s?.offer_price,
          category: {
            name: s?.category?.name,
            icon: s?.category.flat_photo_path?.file_path,
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    return {
      data: {
        offset: 0,
        limit: 0,
        total_size: 0,
        categories: [],
        brands: [],
        prices: [],
        colors: [],
        attributes: [],
        boutiques: [],
        products: [],
      },
    };
    throw error;
  }
}
