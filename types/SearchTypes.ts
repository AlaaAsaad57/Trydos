export interface SearchFilters {
  categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];

  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

export interface SearchParams {
  limit?: number;
  search_after?: any[];
  filters?: SearchFilters;
  language_code?: string;
  country?: string;
  is_from_browser?: boolean;
  filters_offset?: number;
  noProducts?: boolean;
  noFilters?: boolean;
}
