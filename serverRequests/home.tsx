"use server";

import { getRedeemedIds } from "utils/cookies/getRedeemedIds";
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
  const redeemed_ids = await getRedeemedIds();
  let productsData = response.products.map((product) =>
    normalizeListingProduct(product, redeemed_ids),
  );
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

export async function GetMainCategories({ country, language }) {
  let Reader = new ElasticsearchReader();
  // Fast path: a nested aggregation returns one representative doc per unique
  // category instead of transferring thousands of product docs. If it yields
  // nothing (e.g. an index-mapping difference), fall back to the original
  // doc-scan so the navbar never renders empty.
  let a = await Reader.getCategories({ country: country, size: 4000 });
  // @ts-ignore

  let mainCategories = a.hits.hits.map((s) => {
    // @ts-ignore
    return s._source?.custom_categories?.find(
      (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase(),
    );
  });
  mainCategories = mainCategories.filter((c) => c !== undefined);
  mainCategories = Array.from(
    new Map(mainCategories.map((c: any) => [c.id, c])).values(),
  );
  return {
    data: {
      mainCategories: mainCategories.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        flat_photo_path: category.flat_photo_path,
        outline_photo_path: category.outline_photo_path,
        fill_photo_path: category.fill_photo_path,
      })),
    },
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
  const redeemed_ids = await getRedeemedIds();
  let productsData = response.products.map((product) =>
    normalizeListingProduct(product, redeemed_ids),
  );
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
