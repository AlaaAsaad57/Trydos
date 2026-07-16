// types/listing.ts
export interface ListingBrand {
  id?: number | string;
  name?: string;
  icon?: any; // { file_path?: string } | string — kept loose to match current ES shape
  is_verified?: number;
}

export interface ListingCategoryRef {
  name?: string;
  id?: number | string;
}

/** The single serializable shape every listing fetch returns per product. */
export interface ListingProduct {
  name?: string;
  slug?: string;
  label_names?: any[];
  category_tree?: any[];
  videos?: any[];
  colors?: any[];
  sync_color_images?: any[];
  images?: any[];
  price?: number;
  offer_price?: number;
  luck_price?: number;
  categories?: ListingCategoryRef[];
  brand?: ListingBrand;
  flash_deal_end_date?: string | null;
  flash_deal_price?: number | null;
  product_id: number | string;
  is_luck?: boolean;
}

export interface GAProductListItem {
  item_id: any;
  item_name: any;
  category?: any;
  category_id?: any;
  brand?: any;
  brand_id?: any;
}

export interface GetProductsResult {
  products: ListingProduct[];
  offset: any;
  recomended_offset?: any;
  pit_id: string | null;
  productIds: string[];
  GA_PRODUCTS_LIST: GAProductListItem[];
  // ES analysis of the free-text query (detected color/size/brand + analyzed
  // `name`). Forwarded so a client-side search can page subsequent requests by
  // the analyzed name (parity with the server's ProductListConainer).
  isAnalyzed?: any;
}

export interface GetRelatedProductsResult {
  products: ListingProduct[];
  offset: any;
  total_size: number;
  pit_id: string | null;
  productIds: string[];
}

/** A single facet chip's serializable data (category/brand/color/size/price). */
export type FilterTerm = "categories" | "brands" | "colors" | "sizes" | "prices";
export interface FilterOption {
  term: FilterTerm;
  item: any; // category/brand object, color/size string, or price-range object
}

export interface GetFiltersResult {
  categories: any[];
  brands: any[];
  colors: any[];
  sizes: any[];
  prices: any;
  total_size: number;
}
