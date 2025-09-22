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
      boutique: {
        name: string;
        slug: string;
      };
      description: string;
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
        id: string;
      };
      category: {
        name: string;
        icon?: string;
        id: string;
      };
    }>;
  };
}
