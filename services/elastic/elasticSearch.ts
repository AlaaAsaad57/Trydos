"use server";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import AnalyzeSearchText from "./analyzeSearchText";
import {
  buildAggregations,
  buildBaseConditions,
  calculateDiscountedPrice,
  calculatePriceRange,
  CustomProduct,
  getChildrenAndGrandchildren,
  getSourceFields,
  normalizeCustomProducts,
  paginateFilters,
  processBoutiquesAggregation,
  processBrandsAggregation,
  processCategoriesAggregation,
  processCustomProduct,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
  SyncColorImage,
} from "./helpers";
import { LogServerError } from "utils/serverErrorReporter";

// Types and Interfaces
interface SearchFilters {
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

interface SearchParams {
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

interface FilterResult {
  id: string | number;
  name?: string;
  slug?: string;
  icon?: string;
  banner?: any;
  doc_count?: number;
}

interface CategoryFilter extends FilterResult {
  category_id?: string | number;
  bio?: string;
  description?: string;
  flat_photo_path?: string;
  png_photo_path?: string;
  fill_photo_path?: string;
  banner_photo_path?: string;
  num_available_product?: number;
  parent_id?: string | number | null;
  most_viewed_product_thumbnail?: string;
  childes: CategoryFilter[];
}

interface SearchResult {
  offset: any[];
  limit: number;
  total_size: number;
  products?: CustomProduct[];
  brands?: FilterResult[];
  boutiques?: FilterResult[];
  categories?: CategoryFilter[];
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  colors?: string[];
  prices?: {
    min_price: number;
    max_price: number;
    priceRanges?: any[];
  };
  isAnalyzed?: any;
  applied?: any;
}

interface ElasticsearchHit {
  _source: any;
  sort: any[];
}
interface SearchFilters {
  categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];
  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  prices?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

// Initialize Elasticsearch client

interface ProductImage {
  id?: string | number;
  path?: string;
  url?: string;
  alt?: string;
  title?: string;
  [key: string]: any;
}

interface ExtractFiltersResult {
  custom_products: CustomProduct[];
  prices: any;
}
let client = elasticSearchClient;
/**
 * Main function to search products and get filters from Elasticsearch
 */
export async function getProductsAndFiltersFromElastic(
  params: SearchParams
): Promise<SearchResult> {
  let {
    limit = 10,
    search_after = [],
    filters = {},
    language_code = "en",
    country = "",
    is_from_browser = false,
    filters_offset = 1,
    noFilters = false,
    noProducts = false,
  } = params;
  if (filters?.prices) {
    filters = { ...filters, priceRange: filters.prices };
  }
  let isAnalyzed: any = false;
  try {
    if (filters.search_text && filters.search_text?.split(" ")?.length > 1) {
      let CleanSearchText = await AnalyzeSearchText(filters.search_text);
      if (CleanSearchText?.error) {
        console.error(
          `##################${
            CleanSearchText?.error || CleanSearchText?.message
          }#######################`
        );
        isAnalyzed = CleanSearchText?.error || CleanSearchText?.message;
        throw new Error(CleanSearchText?.error || CleanSearchText?.message);
      }
      if (CleanSearchText?.name) {
        filters = { ...filters, search_text: CleanSearchText?.name };
      }
      if (CleanSearchText?.color) {
        let new_colors;
        if (Array.isArray(CleanSearchText.color))
          new_colors = CleanSearchText.color;
        else {
          new_colors = [CleanSearchText.color];
        }
        filters = {
          ...filters,
          colors: [...new Set([...(filters.colors || []), ...new_colors])],
        };
      }
      if (CleanSearchText?.size) {
        let new_sizes;
        if (Array.isArray(CleanSearchText.size)) {
          new_sizes = CleanSearchText.size;
        } else {
          new_sizes = [CleanSearchText.size];
        }
        filters = {
          ...filters,
          sizes: [...new Set([...(filters.sizes || []), ...new_sizes])],
        };
      }
      isAnalyzed = CleanSearchText;
    }
  } catch (error) {
    LogServerError(`Gemini Search Analyze ${error}`, JSON.stringify(filters));
    isAnalyzed?.length > 4 ? isAnalyzed : "failed to Analyze";
    console.error(error);
  }

  try {
    const filtersSize = filters_offset * 10;
    let categoriesFilter = [],
      colorsFilter = [],
      sizesFilter = [],
      prices = null,
      brandsFilter = [],
      boutiquesFilter = [];
    const baseConditions = buildBaseConditions(filters, country);
    const { must: mustConditions, must_not: mustNotConditions } =
      baseConditions;

    // Build the main search query

    const searchQuery = {
      index: "products_catalog",
      _source: getSourceFields(),
      track_scores: true,
      track_total_hits: true,
      size: limit,
      query: {
        bool: {
          must: mustConditions,
          must_not: mustNotConditions,
        },
      },
      sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
      aggs: buildAggregations(
        mustConditions,
        mustNotConditions,
        language_code,
        filtersSize
      ),
    };

    if (noFilters) delete searchQuery.aggs;
    // Add search_after for pagination
    if (search_after?.length > 0) {
      // @ts-ignore
      searchQuery.search_after = search_after;
    }
    // Execute search with pagination
    const customProducts: any[] = [];
    let lastSortValue: any[] = search_after;
    let response;

    response = await client.search(searchQuery);
    const hits = response.hits.hits as ElasticsearchHit[];
    let total_size = response.hits?.total?.value;
    hits.forEach((hit: ElasticsearchHit) => {
      customProducts.push(hit._source);
    });
    lastSortValue = hits.length > 0 ? hits[hits.length - 1].sort : [];
    // Process aggregations

    const productsWithFilters: any = extractFilters(
      customProducts,
      language_code,
      is_from_browser
    );
    prices = productsWithFilters.prices;
    if (filters.colors?.length) {
      productsWithFilters.custom_products = sortSyncColorImagesByFilteredColor(
        productsWithFilters.custom_products,
        filters
      );
      sortColorsByFilteredColor(productsWithFilters.custom_products, filters);
    }
    // Normalize products
    const normalizedProducts = normalizeCustomProducts(productsWithFilters);
    if (noFilters) {
      return {
        colors: colorsFilter,
        offset: lastSortValue,
        prices: prices,
        isAnalyzed: isAnalyzed,
        applied: filters,
        total_size: total_size,
        products: normalizedProducts.custom_products?.map((s) => ({
          ...s,
          is_redeem: s.has_redeem_discount,
          seller_status: s?.seller_status,
        })),
        limit: limit,
      };
    }

    const aggregations = response.aggregations?.filtered_results || {}; // Process filters
    let CategoriesIds = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.map(
      (s) => s?.category_details.hits.hits[0]._source.category_id
    );
    let categories_childs = await getChildrenAndGrandchildren(
      client,
      "products_catalog",
      CategoriesIds,
      language_code,
      country,
      filters
    );
    let categiresCombo = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.concat(
      categories_childs.top_categories?.filtered_categories?.categories_by_id
        ?.buckets || []
    );
    let by_id_categories_comb = (
      (aggregations as any).top_orig_categories?.orig_categories_by_id
        ?.buckets || []
    ).concat(
      categories_childs.top_orig_categories?.orig_categories_by_id?.buckets ||
        []
    );

    categoriesFilter = processCategoriesAggregation(
      categiresCombo,
      by_id_categories_comb,
      filters_offset
    );

    colorsFilter = processColorsAggregation(
      (aggregations as any).top_colors?.colors_by_color?.buckets || [],
      filters_offset
    );

    sizesFilter = processSizesAggregation(
      (aggregations as any).top_sizes?.available_size_as_json_by_size
        ?.buckets || [],
      filters_offset
    );

    brandsFilter = processBrandsAggregation(
      (aggregations as any).top_brands?.filtered_brands?.brands_by_id
        ?.buckets || [],
      filters_offset
    );
    boutiquesFilter = processBoutiquesAggregation(
      (aggregations as any).top_boutiques?.filtered_boutiques?.boutiques_by_id
        ?.buckets || [],
      filters_offset
    );

    return {
      offset: lastSortValue,
      limit: limit,
      total_size: total_size,
      products: normalizedProducts?.custom_products?.map((s) => ({
        ...s,
        is_redeem: s.has_redeem_discount,
        seller_status: s?.seller_status,
      })),
      brands: brandsFilter,
      boutiques: boutiquesFilter,
      categories: categoriesFilter,
      attributes:
        sizesFilter.length > 0
          ? [
              {
                id: 1,
                name: "Size",
                options: sizesFilter,
              },
            ]
          : [],
      colors: colorsFilter,
      prices: prices,
      isAnalyzed: isAnalyzed,
      applied: filters,
    };
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    throw new Error(
      `Search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
export async function GetRecomendationsForUser({
  userId,
  language,
  country,
  search_after = [],
  page = 1,
  limit = 50,
}) {
  try {
    let rec;
    let start = process.hrtime.bigint();
    // @ts-ignore
    if (!userId) {
      rec = await client.search({
        index: "cold_start_recommendations",
        sort: [{ _score: { order: "desc" } }],
      });
    } else {
      rec = await client.search({
        index: "recommended_system",
        query: {
          term: { user_id: Number(userId) },
        },
        sort: [{ _score: { order: "desc" } }],
      });

      if (rec.hits.hits?.length === 0)
        rec = await client.search({
          index: "cold_start_recommendations",
          sort: [{ _score: { order: "desc" } }],
        });
    }
    if (
      (rec.hits.hits?.[0]?._source as any)?.recommended_products?.length ===
        0 ||
      rec.hits.hits?.length === 0
    ) {
      return { products: [], search_after: [] };
    }
    const recommendedIds: string[] =
      // @ts-ignore
      (rec.hits.hits?.[0]?._source as any)?.recommended_products?.map(
        (s) => s?.product_id ?? s?.item_id
      ) || [];
    if (!recommendedIds.length) {
      return { products: [], offset: [], limit };
    }
    const numericIds = recommendedIds.filter((id) => /^\d+$/.test(id));

    if (numericIds.length === 0)
      return {
        products: [],
        limit,
        offset: [],
      };
    const baseConditions = buildBaseConditions({}, country);
    const { must: mustConditions, must_not: mustNotConditions } =
      baseConditions;
    mustConditions.push({ terms: { id: numericIds } });
    // // 3. Query products_catalog by IDs
    const searchQuery = {
      index: "products_catalog",
      _source: getSourceFields(),
      size: limit,
      query: {
        bool: {
          must: mustConditions,
          must_not: mustNotConditions,
        },
      },
      sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
    };

    if (search_after?.length > 0) {
      // @ts-ignore
      searchQuery.search_after = search_after;
    }

    // // 4. Run query
    const response = await client.search(searchQuery);
    const hits = response.hits.hits;
    // @ts-ignore
    let total_size = response.hits?.total?.value;
    // // 5. Extract products
    const products = hits.map((hit) => ({
      // @ts-ignore
      ...hit._source,
      // @ts-ignore
      is_redeem: hit._source?.has_redeem_discount,
    }));
    const productsWithFilters = extractFilters(products, language, true);
    const normalizedProducts = normalizeCustomProducts(productsWithFilters);
    // // 6. Get new search_after value
    const newSearchAfter = hits.length > 0 ? hits[hits.length - 1].sort : [];
    let end = process.hrtime.bigint();

    return {
      products: normalizedProducts.custom_products?.map((s) => ({
        ...s,
        is_redeem: s.has_redeem_discount,
      })),

      limit,
      total_size,
      offset: newSearchAfter,
      time: Number(end - start) / 1_000_000,
    };
    // return { products: [], search_after: [] };
  } catch (error) {
    console.error(
      "************************RECOMENDED************************",
      error
    );
    return { products: [], limit };
  }
}
/**
 * Build base conditions for the search query
 */

/**
 * Build search text conditions
 */

// Helper Functions (These need to be implemented separately)

/**
 * Process colors aggregation
 */
function processColorsAggregation(
  buckets: any[],
  filtersOffset: number
): string[] {
  const colorsFilter = buckets.map((bucket) => bucket.key);
  return paginateFilters(colorsFilter, filtersOffset);
}

/**
 * Process sizes aggregation
 */
function processSizesAggregation(
  buckets: any[],
  filtersOffset: number
): string[] {
  const sizesFilter = buckets.map((bucket) => bucket.key);
  return paginateFilters(sizesFilter, filtersOffset);
}

/**
 * Extract filters from products
 */
function extractFilters(
  products: any[],
  languageCode: string,
  isFromBrowser: boolean
): ExtractFiltersResult {
  const customProducts: CustomProduct[] = [];

  products?.forEach((product) => {
    if (product.custom_products && Array.isArray(product.custom_products)) {
      product.custom_products.forEach((customProduct: any) => {
        if (customProduct.language_code === languageCode) {
          const processed = processCustomProduct(
            product,
            customProduct,
            languageCode,
            isFromBrowser
          );
          customProducts.push(processed);
        }
      });
    }
  });

  let prices = products.length > 0 ? calculatePriceRange(products) : null;
  // Calculate price range

  return {
    custom_products: customProducts,
    prices: prices,
  };
}

/**
 * Sort sync color images by filtered color
 */

// Helper utility functions

/**
 * Paginate filters array
 */

/**
 * Process individual custom product
 */

/**
 * Calculate price range from products
 */

/**
 * Calculate discounted price
 */

/**
 * Parse JSON field with error handling
 */

/**
 * Get custom category from highest position category
 */

/**
 * Get all custom categories
 */

/**
 * Extract category hierarchy
 */

/**
 * Remove extra fields from category for browser response
 */

// Remaining helper functions to complete the Elasticsearch implementation

/**
 * Normalize custom products - filters colors and sync color images for consistency
 */

/**
 * Filter sync color images to only include colors that exist in the colors array
 */

/**
 * Get product images with additional details and processing
 */
function getProductImagesWithDetails(images: any): ProductImage[] {
  if (!images) {
    return [];
  }

  // If images is already an array, return it
  if (Array.isArray(images)) {
    return images.map(processImageItem);
  }

  // If images is a string (JSON), try to parse it
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.map(processImageItem);
      }
    } catch (error) {
      console.warn("Failed to parse images JSON:", error);
      return [];
    }
  }

  // If images is an object, try to convert it to array format
  if (typeof images === "object" && images !== null) {
    // Handle case where images might be an object with numeric keys
    const keys = Object.keys(images);
    if (keys.every((key) => !isNaN(Number(key)))) {
      return keys.map((key) => processImageItem(images[key]));
    }

    // Handle single image object
    return [processImageItem(images)];
  }

  return [];
}

/**
 * Process individual image item to ensure consistent structure
 */
function processImageItem(image: any): ProductImage {
  if (!image || typeof image !== "object") {
    return {
      id: null,
      path: "",
      url: "",
      alt: "",
      title: "",
    };
  }

  return {
    id: image.id || null,
    path: image.path || image.url || "",
    url: image.url || image.path || "",
    alt: image.alt || image.title || "",
    title: image.title || image.alt || "",
    ...image, // Preserve any additional properties
  };
}

/**
 * Get sync color images with additional details and processing
 */
function getSyncColorImagesProductWithDetails(
  syncColorImages: any
): SyncColorImage[] {
  if (!syncColorImages) {
    return [];
  }

  // If already an array, process each item
  if (Array.isArray(syncColorImages)) {
    return syncColorImages.map(processSyncColorImageItem);
  }

  // If it's a string (JSON), try to parse it
  if (typeof syncColorImages === "string") {
    try {
      const parsed = JSON.parse(syncColorImages);
      if (Array.isArray(parsed)) {
        return parsed.map(processSyncColorImageItem);
      }
    } catch (error) {
      console.warn("Failed to parse sync color images JSON:", error);
      return [];
    }
  }

  // If it's an object, try to convert to array
  if (typeof syncColorImages === "object" && syncColorImages !== null) {
    const keys = Object.keys(syncColorImages);
    if (keys.every((key) => !isNaN(Number(key)))) {
      return keys.map((key) => processSyncColorImageItem(syncColorImages[key]));
    }

    // Handle single sync color image object
    return [processSyncColorImageItem(syncColorImages)];
  }

  return [];
}

/**
 * Process individual sync color image item
 */
function processSyncColorImageItem(item: any): SyncColorImage {
  if (!item || typeof item !== "object") {
    return {
      color_name: "",
      images: [],
    };
  }

  // Process images within the sync color item
  let processedImages: ProductImage[] = [];
  if (item.images) {
    processedImages = getProductImagesWithDetails(item.images);
  }

  return {
    color_name: item.color_name || "",
    images: processedImages,
    ...item, // Preserve any additional properties
  };
}

/**
 * Advanced price catalog filter - replicates PHP PriceCatalogFilter::execute functionality
 */
function executePriceCatalogFilter(products: any[]): {
  min_price: number;
  max_price: number;
} {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  if (!products || products.length === 0) {
    return {
      min_price: 0,
      max_price: 0,
    };
  }

  products?.forEach((product) => {
    // Check multiple price fields to find the effective price
    const prices: number[] = [];

    // Add offered price (primary price)
    if (product.offered_price) {
      const offeredPrice = parseFloat(product.offered_price);
      if (!isNaN(offeredPrice) && offeredPrice > 0) {
        prices.push(offeredPrice);
      }
    }

    // Add unit price as fallback
    if (product.unit_price) {
      const unitPrice = parseFloat(product.unit_price);
      if (!isNaN(unitPrice) && unitPrice > 0) {
        prices.push(unitPrice);
      }
    }

    // Check flash deal price if active
    if (
      String(product.flash_deal_status) === "1" &&
      product.flash_deal_discount
    ) {
      const basePrice = parseFloat(
        product.unit_price || product.offered_price || "0"
      );
      if (basePrice > 0) {
        const flashDealPrice = calculateDiscountedPrice(
          basePrice,
          parseFloat(product.flash_deal_discount),
          "percent"
        );
        if (flashDealPrice > 0) {
          prices.push(flashDealPrice);
        }
      }
    }

    // Check redeem discount price
    if (product.redeem_discount_rate) {
      const redeemRate = parseFloat(product.redeem_discount_rate);
      if (!isNaN(redeemRate) && redeemRate > 0 && redeemRate < 100) {
        const basePrice = parseFloat(
          product.unit_price || product.offered_price || "0"
        );
        if (basePrice > 0) {
          const redeemPrice = calculateDiscountedPrice(
            basePrice,
            redeemRate,
            "percent"
          );
          if (redeemPrice > 0) {
            prices.push(redeemPrice);
          }
        }
      }
    }

    // Find min and max from all available prices for this product
    if (prices.length > 0) {
      const productMin = Math.min(...prices);
      const productMax = Math.max(...prices);

      minPrice = Math.min(minPrice, productMin);
      maxPrice = Math.max(maxPrice, productMax);
    }
  });

  // Handle case where no valid prices were found
  if (minPrice === Infinity || maxPrice === -Infinity) {
    return {
      min_price: 0,
      max_price: 0,
    };
  }

  return {
    min_price: Math.floor(minPrice), // Round down for min
    max_price: Math.ceil(maxPrice), // Round up for max
  };
}

/**
 * Calculate discounted price (reused from previous helpers but included here for completeness)
 */

/**
 * Enhanced JSON field parser with better error handling
 */
function parseJsonFieldAdvanced(jsonData: any, defaultValue: any = []): any {
  if (jsonData === null || jsonData === undefined) {
    return defaultValue;
  }

  // If already parsed/proper type, return as is
  if (typeof jsonData === "object" && !Array.isArray(jsonData)) {
    return jsonData;
  }

  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  // If it's a string, try to parse it
  if (typeof jsonData === "string") {
    // Handle empty strings
    if (jsonData.trim() === "") {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(jsonData);
      return parsed !== null ? parsed : defaultValue;
    } catch (error) {
      console.warn("JSON parsing failed:", error, "Data:", jsonData);
      return defaultValue;
    }
  }

  return defaultValue;
}

/**
 * Utility function to safely get nested object properties
 */
function getNestedProperty(
  obj: any,
  path: string,
  defaultValue: any = null
): any {
  if (!obj || typeof obj !== "object") {
    return defaultValue;
  }

  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Utility function to ensure array format
 */
function ensureArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  // If it's a string that might be JSON
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }

  // For objects, convert to array
  if (typeof value === "object") {
    return Object.values(value);
  }

  return [value];
}

/**
 * Clean and validate product data
 */
function validateAndCleanProduct(product: any): any {
  if (!product || typeof product !== "object") {
    return null;
  }

  // Ensure required fields exist
  const requiredFields = ["id", "name", "slug"];
  for (const field of requiredFields) {
    if (!product[field]) {
      console.warn(`Product missing required field: ${field}`, product);
      return null;
    }
  }

  // Clean and validate numeric fields
  const numericFields = ["price", "offer_price", "unit_price", "offered_price"];
  numericFields.forEach((field) => {
    if (product[field] !== undefined) {
      const numValue = parseFloat(product[field]);
      product[field] = isNaN(numValue) ? 0 : numValue;
    }
  });

  // Ensure arrays are properly formatted
  product.colors = ensureArray(product.colors);
  product.sync_color_images = ensureArray(product.sync_color_images);
  product.images = ensureArray(product.images);
  product.videos = ensureArray(product.videos);

  return product;
}
