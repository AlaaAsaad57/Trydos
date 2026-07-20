"use server";

import {
  getThumb,
  stripHtml,
  buildOgImageUrl,
  GetImageUrl,
} from "utils/server";
import { GetFromRedis, RedisGet, RedisSet } from "./radis";
import { fetchServerData } from "./ServerFetch";
import { Metadata } from "next";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import { cookies } from "next/headers";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "./meta/StructuredData/Constants";
import { buildAlternates } from "./meta/buildAlternates";
import {
  comments_index,
  comments_interactions_index,
  product_interactions_index,
  share_index,
  user_interactions_index,
  views_index,
} from "services/elastic/INDEXES";

let client = elasticSearchClient;
interface ProdutGlobalData {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
  images: Array<string>;
  videos: Array<any>;
  categories: Array<{
    id: number;
    name: string;
    position: number;
    icon: string;
  }>;
  brand: {
    id: number;
    slug: string;
    name: string;
    icon: string;
  };
  label_names: any;
  flash_deal_end_date: any;
  colors: Array<{
    name: string;
    code: string;
    option: string;
  }>;
  sync_color_images: Array<{
    color_name: string;
    color_option: string;
    color_code: string;
    images: Array<string>;
    color_trend: boolean;
  }>;
  flash_deal_max_allowed_quantity: any;
  shipping_days: number;
  is_featured: boolean;
  origin_country_iso: string;
  globalFromRedis: boolean;
}

interface QtyProductData {
  id: number;
  description: any;
  model: any;
  variations: Array<{
    id: string;
    size: string;
    color: {
      name: string;
      code: string;
    };
    type: string;
    price: number;
    offer_price: number;
    luck_price: number;
    sku: string;
    qty: number;
  }>;
  sizes: Array<string>;
  max_allowed_qty: string;
  shipping_cost_multiply_with_quantity: boolean;
  shipping_cost: number;
  shipping_days: number;
  allow_return_in_days: number;
  price: number;
  is_luck: boolean;
  luck_price: number;
  offer_price: number;
  offer_type: string;
  unit_price: number;
  seller_id: number;
  seller: {
    name: any;
    f_name: string;
    l_name: string;
    email: string;
    gender: any;
    birthdate: string;
    review: number;
    image: string;
  };
  shop: {
    image: string;
    name: string;
  };
  owner_type: string;
  owner_id: number;
  has_whole_sale: boolean;
  whole_sale_link: any;
  views_count: number;
  descriptors: Array<any>;
  is_country_restricted: boolean;
  is_active: boolean;
  packed_after_ordering: number;
  available_quantity: number;
}
export async function GetCountries({ language, country }) {
  let cacheKey = `countries-${country}-${language}`;
  let cachedData = await RedisGet(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let response = await fetchServerData({
    url: process.env.BACKEND_URL + "/countries",
    headers: { lang: language, country: country },
    local: `${country}-${language}`,
    method: "GET",
  });

  if (response?.data?.data?.countries) {
    await RedisSet(cacheKey, response.data.data.countries);
    return response.data.data.countries;
  }
  return response?.data?.data?.countries || [];
}

export async function GetGlobalProduct({
  slug,
  country,
  language,
  noCache = false,
}): Promise<ProdutGlobalData> {
  try {
    const slugKey = `product-slug:${String(slug)}:${String(language)}:${String(
      country,
    )}`;
    let start = process.hrtime.bigint();
    // When noCache is set the Redis read is skipped and the data is fetched
    // fresh from the Go backend (the write-back below still keeps the cache warm
    // for other consumers such as the web product page).
    if (!noCache) {
      let productId = await GetFromRedis(slugKey);
      let cacheKey = `product-id-${productId}-${country}-${language}`;
      if (productId) {
        let cachedProductData = await RedisGet(`${cacheKey}-global`);
        if (cachedProductData) {
          let end = process.hrtime.bigint();
          return {
            ...cachedProductData,
            globalFromRedis: true,
            globalDataTime: Number(end - start) / 1_000_000,
          };
        }
      }
    }
    let freshGlobalData = await fetchServerData({
      url: `${process.env.GO_BACKEND_URL}/web/product/globalDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    });

    if (freshGlobalData.data?.data?.id) {
      RedisSet(slugKey, freshGlobalData.data.data?.id);
      RedisSet(
        `product-id-${freshGlobalData.data.data?.id}-${country}-${language}-global`,
        freshGlobalData.data.data,
      );
    }
    let end = process.hrtime.bigint();
    return {
      ...freshGlobalData.data?.data,
      globalFromRedis: false,
      globalDataTime: Number(end - start) / 1_000_000,
    };
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario: "Error In GetGlobalProduct in serverRequest/product",
    });
    throw new Error(
      error?.message ?? error ?? "Failed to Get Global Product Data",
    );
    // log error
  }
}
export async function GetProductPriceQtyDetails({
  slug,
  country,
  language,
  noCache = false,
}): Promise<QtyProductData> {
  try {
    let start = process.hrtime.bigint();
    const slugKey = `product-slug:${String(slug)}:${String(language)}:${String(
      country,
    )}`;
    if (!noCache) {
      let productId = await GetFromRedis(slugKey);
      let cacheKey = `product-id-${productId}-${country}-${language}`;
      if (productId) {
        let cachedProductData = await RedisGet(`${cacheKey}-qtyPrices`);
        if (cachedProductData) {
          let end = process.hrtime.bigint();
          return {
            ...cachedProductData,
            qtyPricesDataFromRedis: true,
            qtyPricesDataTime: Number(end - start) / 1_000_000,
          };
        }
      }
    }
    let freshQtyPricesData = await fetchServerData({
      url: `${process.env.GO_BACKEND_URL}/web/product/qtyPriceDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    });
    if (freshQtyPricesData.data?.data?.id) {
      RedisSet(slugKey, freshQtyPricesData.data.data?.id);
      RedisSet(
        `product-id-${freshQtyPricesData.data.data?.id}-${country}-${language}-qtyPrices`,
        freshQtyPricesData.data.data,
      );
    }
    let end = process.hrtime.bigint();
    return {
      ...freshQtyPricesData.data?.data,
      qtyPricesDataFromRedis: false,
      qtyPricesDataTime: Number(end - start) / 1_000_000,
    };
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario: "Error In GetProductPriceQtyDetails in serverRequest/product",
    });
    // log error
  }
}

export async function GetProductMeta({
  slug,
  language,
  country,
  searchParams,
}) {
  try {
    let cacheKey = `product-meta-v2-${slug}-${language}-${country}`;
    let cachedMeta = await RedisGet(cacheKey);
    if (cachedMeta) {
      return { ...cachedMeta, metaFromRedis: true };
    }
    let freshMeta = await fetchServerData({
      url: `${process.env.GO_BACKEND_URL}/web/product/product-meta/${slug}?lang=${language}`,
      method: "GET",
      local: `${country}-${language}`,
    });
    if (freshMeta?.error) {
      throw new Error(freshMeta?.error);
    }
    let product = freshMeta.data.data;

    let title = `${product?.name}`;
    if (searchParams.color) {
      title += ` |  ${searchParams.color}`;
    }
    if (searchParams.size) {
      title += ` |  ${searchParams.size}`;
    }
    // Some backend product names are a single word ("milk"), which makes a bare
    // SERP title that Google pads with the site name. Append brand/category for
    // context when they exist.
    const titleContext = [product?.brand, product?.category]
      .filter(Boolean)
      .join(" | ");
    if (titleContext) {
      title += ` | ${titleContext}`;
    }
    const firstImagePath = product?.images?.[0]?.images ?? product?.images?.[0];

    const image = firstImagePath ? buildOgImageUrl(GetImageUrl(firstImagePath)) : null;
    const fallbackImageUrl = `${General_Site_Data.url}/opengraph-image.png`;
    const ogImages = image
      ? [{ url: image, width: 1200, height: 630, type: "image/jpeg" }]
      : [{ url: fallbackImageUrl, width: 1200, height: 630, type: "image/png" }];
    // Several products store only the name in `details`, yielding a one-word meta
    // description. Google ignores those and scrapes on-page boilerplate (e.g. the
    // returns badge) instead. Fall back to a product-context sentence so the
    // snippet is always meaningful. Real descriptions (>= 60 chars) win.
    const rawDescription = stripHtml(product?.details);
    const description =
      rawDescription.length >= 60
        ? rawDescription
        : `Shop ${product?.name}` +
          `${product?.brand ? ` by ${product.brand}` : ""}` +
          `${product?.category ? ` in ${product.category}` : ""}` +
          ` on Trydos — secure checkout, fast delivery and easy returns.`;
    let data: Metadata = {
      title: title,
      description,
      alternates: buildAlternates(
        `${country}-${language}`,
        `/products/${slug}`,
      ),
      openGraph: {
        title: title,
        description,
        url: `${General_Site_Data.url}/${country}-${language}/products/${slug}`,
        siteName: "Trydos",
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description,
        images: [image ?? fallbackImageUrl],
      },
      keywords: [
        product?.name,
        product?.brand,
        product?.category,
        product?.boutique,
        ...(product?.similar_words || []),
      ],
    };
    RedisSet(cacheKey, data, 3600);
    return { ...data, metaFromRedis: false };
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario: "Error In GetProductMeta in serverRequest/product",
    });
    // log error
  }
}

export async function GetProductGeneralData({ id }) {
  const getProductGeneralQuery = async () => {
    try {
      let res = await client.get({
        _source: [
          "final_rating",
          "star_distribution",
          "size_analysis",
          "good_quality_product",
        ],
        index: product_interactions_index,
        id: id,
      });
      return res._source as any;
    } catch (error) {
      LogServerError({
        error: error,
        id: id,
        scenario: `Error In getProductGeneralQuery in serverRequest/product id=${id}`,
      });
      return {
        _source: {
          final_rating: 0,
          total_views: 0,
          star_distribution: {},
          size_analysis: null,
          good_quality_product: false,
        },
      };
    }
  };
  const getProductViewsQuery = async (productId) => {
    try {
      let res = await client.get({
        id: productId,
        _source: ["view_count"],
        index: views_index,
      });
      return (res._source as any)?.view_count ?? 0;
    } catch (error) {
      // A 404 just means this product has no view-count doc yet — not an error.
      const statusCode = (error as any)?.statusCode ?? (error as any)?.meta?.statusCode;
      if (statusCode !== 404) {
        LogServerError(
          { error, type: "getProductViewsQuery (elastic) failed", productId },
          "/",
        );
      }
      return 0;
    }
  };
  if (!id)
    return {
      product_id: id,
      final_rating: null,
      total_views: 0,
      ratingDetails: [],
      size_analysis: null,
      good_quality_product: false,
      recommendation_stats: { stats: [] },
      total_buyers: 0,
    };
  try {
    let [source, recommendation_stats, views] = await Promise.all([
      getProductGeneralQuery(),
      GetRecommendationCountForProduct({ product_id: id }),
      getProductViewsQuery(id),
    ]);

    const productInfo = {
      product_id: id,
      final_rating: source?.final_rating,
      total_views: views ?? 0,
      ratingDetails: source?.star_distribution
        ? Object.keys(source.star_distribution)?.map((s) => ({
            ratingGroup: s?.split("_")[1],
            count: source.star_distribution[s] ?? 0,
          }))
        : [],
      size_analysis: source.size_analysis,
      good_quality_product: source.good_quality_product,
      recommendation_stats: recommendation_stats.stats,
      total_buyers: recommendation_stats.total_buyers,
    };
    return productInfo;
  } catch (error) {
    LogServerError({
      id: id,
      error: error,
      scenario: "Error In GetProductGeneralData in serverRequest/product",
    });
  }
}

export const GetRecommendationCountForProduct = async ({ product_id }) => {
  const result = await client.search({
    index: comments_index,
    size: 0,
    query: {
      bool: {
        must: [
          { term: { product_id: String(product_id) } },
          { exists: { field: "rating" } },
          { exists: { field: "order_details_id" } },
        ],
        must_not: [{ term: { status: "deleted" } }],
      },
    },
    aggs: {
      recommendation_status: {
        filters: {
          filters: {
            recommend: {
              bool: {
                must: [
                  { term: { product_id: String(product_id) } },
                  { exists: { field: "rating" } },
                  { exists: { field: "order_details_id" } },
                  { term: { recommendation: true } },
                ],
                must_not: [{ term: { status: "deleted" } }],
              },
            },
            not_recommend: {
              bool: {
                must: [
                  { term: { product_id: String(product_id) } },
                  { exists: { field: "rating" } },
                  { term: { recommendation: false } },
                  { exists: { field: "order_details_id" } },
                ],
                must_not: [{ term: { status: "deleted" } }],
              },
            },
          },
        },
      },
    },
  });
  // @ts-ignore
  const buckets = result.aggregations.recommendation_status.buckets;
  const total = buckets.recommend.doc_count + buckets.not_recommend.doc_count;

  const stats = [
    {
      category: "recommend",
      count: buckets.recommend.doc_count,
      percentage:
        total > 0
          ? ((buckets.recommend.doc_count / total) * 100).toFixed(0)
          : "0",
    },
    {
      category: "not_recommend",
      count: buckets.not_recommend.doc_count,
      percentage:
        total > 0
          ? ((buckets.not_recommend.doc_count / total) * 100).toFixed(0)
          : "0",
    },
  ];

  return {
    stats,
    total_buyers: buckets.not_recommend.doc_count + buckets.recommend.doc_count,
  };
};

// Data-returning twin of GetProductStories: returns the raw story payload plus
// a normalized `stories` list (id, thumbnail, has_new) so the client renders
// the card/border itself instead of receiving server JSX.
export async function GetProductStoriesData({ page, productId }) {
  let cookiesStore = await cookies();
  let storiesToken = cookiesStore.get("USER-STORIES")?.value;
  let headers = {};
  if (storiesToken) {
    headers = { ...headers, Authorization: `Bearer ${storiesToken}` };
  }

  let response = await fetchServerData({
    url:
      process.env.STORIES_BACKEND_URL +
      `/api/v1/stories/product_stories/${productId}?page=${page}`,
    method: "GET",
    headers: headers,
  });

  if (!response.data) {
    return { data: [], stories: [] };
  }

  const rawStories = response.data.data.data;
  return {
    data: rawStories,
    stories: rawStories?.map((story) => ({
      id: story.id,
      has_new: story.stories?.filter((s) => s.is_seen === false)?.length > 0,
      thumb: getThumb(
        story.stories?.[0]?.full_video_path || story.stories?.[0]?.photo_path,
        Boolean(story.stories?.[0]?.full_video_path),
      ),
    })),
  };
}

export async function GetSocialInfoForProduct({ productId, userId }) {
  //  should return likes,isLiked,comments,shares count
  let [produtSocialInfo, productSharesCount, productComments] =
    await Promise.all([
      getProductInteractions(productId, userId),
      getProductSharedCountFromElasticsearch(productId),
      GetProductCommentsCount({ productId }),
    ]);

  return {
    total_likes: produtSocialInfo.total_likes,
    is_liked: produtSocialInfo.is_liked,
    total_comments: productComments.total,
    total_shares: productSharesCount,
  };
}

async function getProductSharedCountFromElasticsearch(productId) {
  try {
    let res = await client.search({
      index: share_index,
      _source: ["shared_count"],
      size: 1, // just one document if you expect a single match
      query: {
        term: {
          product_id: productId, // exact match search
        },
      },
    });

    let sharesData = (res as any)?.hits?.hits?.[0]?._source?.shared_count;

    return sharesData;
  } catch (error) {
    LogServerError({
      slug: productId,
      error: error,
      scenario:
        "Error In getProductSharedCountFromElasticsearch in serverRequest/product",
    });
    return null;
  }
}
async function getProductInteractions(productId: string, userId?: string) {
  try {
    // Run both queries in parallel
    const [productRes, likeRes] = await Promise.all([
      client.get({
        index: product_interactions_index,
        id: productId,
        _source: ["total_likes", "total_comments"],
      }),
      userId
        ? client.search({
            index: user_interactions_index,
            _source: ["status"],
            body: {
              query: {
                bool: {
                  must: [
                    { term: { product_id: productId } },
                    { term: { user_id: String(userId) } },
                    { term: { status: "active" } },
                  ],
                },
              },
              sort: [
                { interaction_date: { order: "desc" } }, // get latest interaction first
              ],
              size: 1, // only need the latest
            },
          })
        : Promise.resolve({ hits: { hits: [] } }),
    ]);

    const source: any = productRes._source;

    const productInfo = {
      total_comments: source?.total_comments,
      total_likes: source?.total_likes ?? 0,
    };

    // Determine if user liked the product based on latest interaction
    let isLiked = false;
    if (userId && likeRes.hits.hits.length > 0) {
      const latestInteraction = likeRes.hits.hits[0]._source as any;
      isLiked = latestInteraction.status?.toLowerCase() === "active";
    }

    return {
      ...productInfo,
      is_liked: isLiked,
    };
  } catch (err: any) {
    LogServerError({
      slug: productId,
      error: err,
      scenario: "Error In getProductInteractions in serverRequest/product",
    });
    return {
      is_liked: false,
      total_likes: 0,
      total_comments: 0,
    };
  }
}

export async function GetProductCommentsCount({ productId }) {
  let query: any = {
    index: comments_index,
    query: {
      bool: {
        must: [{ term: { product_id: String(productId) } }],
        must_not: [
          { term: { status: "deleted" } },
          {
            exists: {
              field: "order_details_id",
            },
          },
        ],
      },
    },
  };

  let response = await client.count(query);
  let results = response.count;

  return {
    total: results,
  };
}
