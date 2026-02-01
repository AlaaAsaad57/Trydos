"use server";

import AnalyzeSearchText from "services/elastic/analyzeSearchText";
import { DEFAULT_INDEX } from "services/elastic/elasticsearch-reader.service";

import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  buildBaseConditions,
  extractFilters,
  getSourceFields,
  normalizeCustomProducts,
  buildAggregations,
  getChildrenAndGrandchildren,
  processBoutiquesAggregation,
  processBrandsAggregation,
  processCategoriesAggregation,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
} from "services/elastic/helpers";
import { LogServerError } from "utils/serverErrorReporter";
let client = elasticSearchClient;
export async function GetSearchData({
  language,
  country,
  filters,
  noProducts,
  filters_offset,
}) {
  let isAnalyzed: any = false;
  try {
    if (filters.search_text && filters.search_text?.split(" ")?.length > 1) {
      let CleanSearchText = await AnalyzeSearchText(filters.search_text);
      if (CleanSearchText?.error) {
        console.error(
          `##################${
            CleanSearchText?.error || CleanSearchText?.message
          }#######################`,
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
    LogServerError({
      language,
      country,
      error: error,
      error_text: `Gemini Search Analyze ${error}`,
      filters: JSON.stringify(filters),
      scenario: "Error In GetSearchData in serverRequest/Search",
    });
    isAnalyzed?.length > 4 ? isAnalyzed : "failed to Analyze";
    console.error(error);
  }

  try {
    const filtersSize = filters_offset * 10;
    let categoriesFilter = [],
      brandsFilter = [],
      boutiquesFilter = [];
    const baseConditions = buildBaseConditions(filters, country);
    const { must: mustConditions, must_not: mustNotConditions } =
      baseConditions;

    // Build the main search query

    const searchQuery = {
      index: DEFAULT_INDEX,
      _source: [
        "id",
        "status",
        "seller_status",
        "added_by",
        "countries_iso",
        "images",
        "videos",
        "thumbnail",
        "flash_deal_status",
        "flash_deal_discount",
        "offered_price",
        "unit_price",
        "colors",
        "text_colors",
        "sync_color_images",
        "discount",
        "discount_type",
        "redeem_discount_rate",
        "current_stock",
        "boutique_id",
        // "available_size",
        "category_ids",
        "end_date",
        "start_date",
        "boutique.status",
        "brand.status",
        "brand.is_verified",
        "categories.num_available_product",
        "categories.status",
        "categories.position",
        "categories.id",
        "categories.parent_id",
        "custom_brands.id",
        "custom_brands.name",
        "custom_brands.slug",
        "custom_brands.icon",
        "custom_brands.language_code",
        "custom_boutiques.id",
        "custom_boutiques.name",
        "custom_boutiques.slug",
        "custom_boutiques.banners",
        "custom_boutiques.language_code",
        "custom_categories.id",
        "custom_categories.category_id",
        "custom_categories.name",
        "custom_categories.slug",
        // "custom_categories.description",
        // "custom_categories.bio",
        "custom_categories.language_code",
        "custom_categories.flat_photo_path",
        "custom_categories.outline_photo_path",
        "custom_categories.png_photo_path",
        "custom_categories.fill_photo_path",
        "custom_categories.banner_photo_path",
        "custom_products.id",
        "custom_products.product_id",
        "custom_products.name",
        "custom_products.slug",
        "custom_products.status",
        "custom_products.details",
        "custom_products.language_code",
        "custom_products.label_names",
      ],
      track_scores: true,
      track_total_hits: true,
      size: 20,
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
        language,
        filtersSize,
      ),
    };

    // Execute search with pagination
    const customProducts: any[] = [];

    let response;

    response = await client.search(searchQuery);
    const hits = response.hits.hits as any[];
    let total_size = response.hits?.total?.value;
    hits?.forEach((hit: any) => {
      customProducts.push(hit._source);
    });

    // Process aggregations

    const productsWithFilters: any = extractFilters(
      customProducts,
      language,
      false,
    );

    if (filters.colors?.length) {
      productsWithFilters.custom_products = sortSyncColorImagesByFilteredColor(
        productsWithFilters.custom_products,
        filters,
      );
      sortColorsByFilteredColor(productsWithFilters.custom_products, filters);
    }
    // Normalize products
    const normalizedProducts = normalizeCustomProducts(productsWithFilters);
    const aggregations = response.aggregations?.filtered_results || {}; // Process filters
    let CategoriesIds = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.map(
      (s) => s?.category_details.hits.hits[0]._source.category_id,
    );
    let categories_childs = await getChildrenAndGrandchildren(
      client,
      DEFAULT_INDEX,
      CategoriesIds,
      language,
      country,
      filters,
    );
    let categiresCombo = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.concat(
      categories_childs.top_categories?.filtered_categories?.categories_by_id
        ?.buckets || [],
    );
    let by_id_categories_comb = (
      (aggregations as any).top_orig_categories?.orig_categories_by_id
        ?.buckets || []
    ).concat(
      categories_childs.top_orig_categories?.orig_categories_by_id?.buckets ||
        [],
    );

    categoriesFilter = processCategoriesAggregation(
      categiresCombo,
      by_id_categories_comb,
      filters_offset,
    );

    brandsFilter = processBrandsAggregation(
      (aggregations as any).top_brands?.filtered_brands?.brands_by_id
        ?.buckets || [],
      filters_offset,
    );
    boutiquesFilter = processBoutiquesAggregation(
      (aggregations as any).top_boutiques?.filtered_boutiques?.boutiques_by_id
        ?.buckets || [],
      filters_offset,
    );

    return {
      total_size: total_size,
      products: normalizedProducts?.custom_products?.map((s) => ({
        categroy: s.category,
        name: s.name,
        slug: s.slug,
        images: [s.sync_color_images?.[0]?.images?.[0] ?? s.images?.[0]],
        color: s.sync_color_images?.[0]?.color_name,
        price: s.price,
        offer_price: s.offer_price,
        brand: s.brand,
      })),
      brands: brandsFilter,
      boutiques: boutiquesFilter,
      categories: categoriesFilter,
      isAnalyzed: isAnalyzed,
      applied: filters,
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      error_text: `Gemini Search Analyze ${error}`,
      filters: JSON.stringify(filters),
      scenario: "Error In GetSearchData in serverRequest/Search",
    });
    throw new Error(
      `Search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
