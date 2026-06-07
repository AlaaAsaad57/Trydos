"use server";

import AnalyzeSearchText from "services/elastic/analyzeSearchText";

import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  buildBaseConditions,
  extractFilters,
  normalizeCustomProducts,
  buildAggregations,
  getChildrenAndGrandchildren,
  processBoutiquesAggregation,
  processBrandsAggregation,
  processCategoriesAggregation,
  processRelatedCategories,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
  GroupAgeEnum,
  GenderEnum,
  PopulateCategories,
  logSearchTerm,
} from "services/elastic/helpers";
import { catalog_index } from "services/elastic/INDEXES";
import { LogServerError } from "utils/serverErrorReporter";
let client = elasticSearchClient;

// ------------------------------------------------------------------
// Inline autocomplete (ghost text) suggestion.
// Mirrors GetSearchData's visibility rules: reuses buildBaseConditions
// (status / seller / country / not-deleted) so suggestions respect the
// exact same conditions as the main search query, then layers a
// name prefix match to find the best "starts-with" completion.
// ------------------------------------------------------------------
export async function GetSearchSuggestion({
  language,
  country,
  search_text,
  filters,
}: {
  language: string;
  country: string;
  search_text: string;
  filters?: any;
}) {
  try {
    const text = (search_text || "").trim();
    if (!text) return { suggestion: "" };

    // Respect the applied filters (category / brand / boutique / color / size /
    // price) so the completion is scoped to what the user is actually browsing.
    // Strip search_text out of the filter scope: buildBaseConditions would add
    // a fuzzy text match for it, but we want a clean prefix completion instead
    // (the match_phrase_prefix below), not fuzzy noise.
    const { search_text: _omitSearchText, ...filterScope } = filters || {};
    const { must, must_not } = buildBaseConditions(filterScope, country);

    // "Starts-with" completion on the product name (case-insensitive via
    // the standard/arabic analyzers used by GetSearchData).
    const prefixCondition = {
      nested: {
        path: "custom_products",
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  "custom_products.name.exact": { query: text },
                },
              },
              {
                match_phrase_prefix: {
                  "custom_products.name.arabic": { query: text },
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
        inner_hits: {
          size: 5,
          _source: ["custom_products.name", "custom_products.language_code"],
        },
      },
    };

    const response = await client.search({
      index: catalog_index,
      _source: false,
      track_total_hits: false,
      size: 8,
      query: {
        bool: { must: [...must, prefixCondition], must_not },
      },
      sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
    });

    const lowerText = text.toLowerCase();

    // Flatten matched nested custom_products across the top product hits.
    const candidates: { name: string; language_code: string }[] = [];
    (response.hits.hits as any[])?.forEach((hit) => {
      const inner = hit.inner_hits?.custom_products?.hits?.hits || [];
      inner.forEach((nestedHit: any) => {
        const src = nestedHit._source || {};
        if (src.name) {
          candidates.push({
            name: src.name,
            language_code: src.language_code,
          });
        }
      });
    });

    // Keep only true "starts-with" completions (ES phrase_prefix can match
    // the phrase mid-string; ghost text must begin with what the user typed).
    const startsWith = candidates.filter((c) =>
      c.name.toLowerCase().startsWith(lowerText),
    );

    // Language preference: requested language, then English, then anything
    // (custom_* entries may exist in a single language only — see memory).
    const pick =
      startsWith.find((c) => c.language_code === language) ||
      startsWith.find((c) => c.language_code === "en") ||
      startsWith[0];

    return { suggestion: pick?.name || "" };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      error_text: `Search suggestion ${error}`,
      filters: JSON.stringify({ search_text }),
      scenario: "Error In GetSearchSuggestion in serverRequest/Search",
    });
    // Suggestions are best-effort; never break typing.
    return { suggestion: "" };
  }
}

export async function GetSearchData({
  language,
  country,
  filters,
  noProducts,
  filters_offset,
  userId,
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

    const relatedBaseConditions = buildBaseConditions(
      { ...filters, categories: [], related_categories: [] },
      country,
    );

    // Build the main search query

    const searchQuery = {
      index: catalog_index,
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
        // "flash_deal_discount",
        "offered_price",
        "unit_price",
        "country_offer_prices",
        "extra_price_for_country",
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
        "categories.gender",
        "categories.group_age",
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
        relatedBaseConditions.must,
        relatedBaseConditions.must_not,
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
      country,
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
    const aggregations = response.aggregations?.filtered_results || {};
    const relatedAggregations =
      response.aggregations?.global_related_scope?.related_filtered_results ||
      {};
    // Process filters
    let CategoriesIds = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.map(
      (s) => s?.category_details.hits.hits[0]._source.category_id,
    );
    let categories_childs = await getChildrenAndGrandchildren(
      client,
      catalog_index,
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

    const categoriesResult = processCategoriesAggregation(
      categiresCombo,
      by_id_categories_comb,
      filters_offset,
    );
    categoriesFilter = categoriesResult.categories;
    const relatedCategoriesFilter = processRelatedCategories(
      relatedAggregations,
      categoriesResult.genderAgePairs,
      filters_offset,
    );

    const selectedCategorySlugs = new Set(
      (filters?.categories || []).map((slug: any) => String(slug)),
    );
    const filteredRelatedCategories = relatedCategoriesFilter.filter(
      (category: any) =>
        category?.slug && !selectedCategorySlugs.has(category.slug),
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
    console.log(
      filters.search_text,
      "search term",
      total_size,
      "products count",
    );
    if (
      filters?.search_text &&
      filters.search_text.trim().length > 0 &&
      total_size !== undefined &&
      total_size > 0
    ) {
      logSearchTerm({
        searchText: filters.search_text,
        userData: {
          id: userId,
        },
        productsCount: total_size,
        client,
      });
    }
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
      related_categories: filteredRelatedCategories.map((s: any) => ({
        ...s,
        group_age: GroupAgeEnum[s.group_age]
          ? GroupAgeEnum[s.group_age].label
          : s.group_age,
        gender: GenderEnum[s.gender] ? GenderEnum[s.gender].label : s.gender,
        realted: PopulateCategories({ categories: categoriesFilter })
          .filter(
            (category: any) =>
              category.group_age === s.group_age &&
              category.gender === s.gender,
          )
          .map((category: any) => category.slug),
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
