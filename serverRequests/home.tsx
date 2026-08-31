"use server";

import BoutiqueWrapper from "components/ServerWrapper/BoutiqueWrapper";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import {
  getProductsAndFiltersFromElastic,
  GetRecomendationsForUser,
} from "services/elastic/elasticSearch";
import {
  NormalizeSearchParamsForSearchRequest,
  parseNumberArray,
} from "utils/server";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
export async function GetNextRecommendations({
  language,
  country,
  offset,
  userId,
  limit,
}) {
  let response: any = await GetRecomendationsForUser({
    country: country,
    language: language,
    limit: limit,
    userId: userId,
    search_after: parseNumberArray(offset),
  });
  let productsData = response.products.map(normalizeListingProduct);
  let newOffset = response?.offset;
  return {
    items: productsData,
    offset: newOffset,
  };
}

export async function GetNextBoutiques({
  language,
  country,
  category,
  offset,
}) {
  let response = await GetHomeBoutiques({
    language,
    category: category,
    country,
    offset: offset,
  });
  let newOffset = response.data.offset;
  let items = response.data.boutiques.map((boutique) => (
    <BoutiqueWrapper
      key={boutique?.slug}
      lang={`${country}-${language}`}
      boutique={boutique}
    />
  ));
  return {
    boutiques: items,
    offset: newOffset,
  };
}

export async function GetHomeBoutiques({
  language,
  country,
  category,
  limit = 10,
  offset = null,
}) {
  let Reader = new ElasticsearchReader();
  let boutiquesResponse: any = { boutiques: [], searchAfter: null };
  if (typeof category === "string") {
    try {
      category = JSON.parse(category);
      if (Array.isArray(category) && category.length > 0) {
        category = category?.[0];
      }
    } catch (e) {
      category = category;
    }
  }
  boutiquesResponse = await Reader.getBoutiques({
    country,
    language,
    limit,
    category: category ?? null,
    searchAfter: offset ? JSON.parse(offset.toString()) : null,
  });
  return {
    data: {
      total: boutiquesResponse.boutiques?.length || 0,
      limit,
      searchAfter: boutiquesResponse.searchAfter,
      offset: boutiquesResponse.searchAfter, // Use searchAfter as offset, like home page
      boutiques: boutiquesResponse.boutiques || [],
      category,
    },
  };
}

export async function GetRecommedndedProducts({
  country,
  language,
  limit,
  offset = null,
  userId,
}) {
  let response: any = await GetRecomendationsForUser({
    country: country,
    language: language,
    limit: limit,
    userId: userId,
    search_after: parseNumberArray(offset),
  });
  let productsData = response.products.map(normalizeListingProduct);
  let newOffset = response?.offset;
  return {
    items: productsData,
    offset: newOffset,
  };
}

export async function GetFeaturedProducts({
  country,
  language,
  category,
  limit = 10,
  offset = null,
}) {
  let filters = NormalizeSearchParamsForSearchRequest({
    searchParams: { limit, offset, category_slugs: category },
    isFeatured: true,
    isFlashDeal: false,
  });
  const params = {
    limit: Number(limit),
    search_after: parseNumberArray(offset),
    filters,
    filters_offset: 1,
    country,
    language_code: language,
    noFilters: true,
  };
  let result = await getProductsAndFiltersFromElastic(params);
  return {
    data: result,
  };
}

export async function GetFlashDealProducts({
  country,
  language,
  category,
  limit = 10,
  offset = null,
}) {
  let filters = NormalizeSearchParamsForSearchRequest({
    searchParams: { limit, offset, category_slugs: category },
    isFeatured: false,
    isFlashDeal: true,
  });
  const params = {
    limit: Number(limit),
    search_after: parseNumberArray(offset),
    filters,
    filters_offset: 1,
    country,
    language_code: language,
    noFilters: true,
  };
  let result = await getProductsAndFiltersFromElastic(params);
  return {
    data: result,
  };
}
