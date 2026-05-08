"use server";

import {
  generateCloudinaryUrl,
  getThumb,
  stripHtml,
  buildOgImageUrl,
  GetImageUrl,
} from "utils/server";
import { GetFromRedis, RedisGet, RedisSet } from "./radis";
import { fetchServerData } from "./ServerFetch";
import { Metadata } from "next";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import { BuyersCommentItem } from "components/Server/product/ProductBuyersComment/BuyerCommentItem";
import { cookies } from "next/headers";
import {
  COOKIE_NAMES,
  getCookieServer,
  UserData,
} from "utils/cookies/cookie-manager";
import FaqItemComponent from "components/Server/product/ProductFAQSection/FaqItemComponent";
import { LogServerError } from "utils/serverErrorReporter";
import { General_Site_Data } from "./meta/StructuredData/Constants";
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
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/countries",
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
}): Promise<ProdutGlobalData> {
  try {
    const slugKey = `product-slug:${String(slug)}:${String(language)}:${String(
      country,
    )}`;
    let start = process.hrtime.bigint();
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
    let freshGlobalData = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/globalDetails/${slug}`,
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
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}`,
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
    let cacheKey = `product-meta-${slug}-${language}-${country}`;
    let cachedMeta = await RedisGet(cacheKey);
    if (cachedMeta) {
      return { ...cachedMeta, metaFromRedis: true };
    }
    let freshMeta = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/product-meta/${slug}?lang=${language}`,
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
    const firstImagePath = product?.images?.[0]?.images ?? product?.images?.[0];
    const image = firstImagePath ? buildOgImageUrl(GetImageUrl(firstImagePath)) : null;
    const fallbackImageUrl = `${General_Site_Data.url}/opengraph-image.png`;
    const ogImages = image
      ? [{ url: image, width: 1200, height: 630, type: "image/jpeg" }]
      : [{ url: fallbackImageUrl, width: 1200, height: 630, type: "image/png" }];
    const description = stripHtml(product?.details);
    let data: Metadata = {
      title: title,
      description,
      alternates: {
        canonical: `${General_Site_Data.url}/${country}-${language}/products/${slug}`,
        languages: {
          en: `${General_Site_Data.url}/${country}-en/products/${slug}`,
          tr: `${General_Site_Data.url}/${country}-tr/products/${slug}`,
          ar: `${General_Site_Data.url}/${country}-ar/products/${slug}`,
        },
      },
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

export async function GetProductBuyersComment({
  language,
  productId,
  offset = null,
  filter = null,
  pageSize = 5,
  userId,
}) {
  let commentsData = [];
  let query: any = {
    index: comments_index,
    size: pageSize,
    sort: [
      { created_at: "desc" }, // newest first
      { comment_id: "desc" }, // tie-breaker for consistent pagination
    ],
    query: {
      bool: {
        must: [
          { term: { product_id: String(productId) } },
          { exists: { field: "rating" } },
          { exists: { field: "order_details_id" } },
        ],
        must_not: [{ term: { status: "deleted" } }],
      },
    },
    aggs: {
      unique_aspects: {
        terms: {
          field: `discussed_aspects_${language}`,
          size: 1000, // adjust if you have more aspects
        },
      },
    },
  };

  if (filter && typeof filter === "string" && filter.trim() !== "") {
    if (filter !== "recommend")
      query.query.bool.must.push({
        bool: {
          should: [
            { term: { discussed_aspects_en: filter } },
            { term: { discussed_aspects_ar: filter } },
            { term: { discussed_aspects_tr: filter } },
            { term: { discussed_aspects_ku: filter } },
          ],
          minimum_should_match: 1, // at least one should match
        },
      });
    else {
      query.query.bool.must.push({
        term: { recommendation: true },
      });
    }
  }

  if (offset) {
    query = {
      ...query,
      search_after: typeof offset === "string" ? JSON.parse(offset) : offset,
    };
  }
  const response = await client.search(query);

  let results = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const nextSearchAfter =
    results.length > 0 ? response.hits.hits[results.length - 1].sort : null;
  if (results?.length > 0)
    results = await GetFQACommentsForProductWithReactions({
      user_id: userId,
      commentsResult: results,
    });
  const filters_key = (
    (response.aggregations?.unique_aspects as any)?.buckets || []
  ).map((bucket: any, index) => {
    return bucket?.key;
  });

  commentsData = results?.map((s: any) => ({
    id: s.id,
    customer: {
      id: s.user_id,
      name: s.user_name,
      image: s.user_avatar,
    },
    product_id: s.product_id,
    comment: s.text,
    ownerId: s?.owner_id,
    ownerType: s?.owner_type,
    variant: s.variant,
    isOwner: userId && s?.user_id && String(s?.user_id) === String(userId),
    created_at: s.created_at,
    true_size: s.aspects?.size?.fit_analysis?.correct ?? false,
    good_quality_comment: s?.good_quality_comment ?? false,
    comments_images_customer: s?.comments_images_customer ?? [],
    star_rating: s.rating,
    order_details_id: s.order_details_id,
    recommendation: s?.recommendation,
    total_likes: s?.total_likes,
    is_liked: s?.is_liked,
  }));
  return {
    comments: commentsData?.map((comment, i) => {
      return (
        <BuyersCommentItem
          id={comment.id}
          key={comment.id}
          comment={comment}
          language={language}
        />
      );
    }),
    offset: nextSearchAfter,
    filters_key: filters_key,
  };
}

export async function GetFQACommentsForProductWithReactions({
  user_id,
  commentsResult,
}) {
  let commentIds = [];
  let temp = commentsResult.map((s) => s.id);

  if (temp.length === 0) return commentsResult;
  temp.map((s) => {
    commentIds.push(s);
    commentIds.push(`${s}-seller_reply`);
  });

  const reactionsQuery: any = {
    index: comments_interactions_index,
    size: 0,
    query: {
      bool: {
        must: [
          { terms: { target_id: commentIds } },
          { term: { status: "active" } },
          { terms: { target_type: ["comment", "seller_reply"] } },
        ],
      },
    },
    aggs: {
      reactions_by_type: {
        terms: {
          field: "target_type",
          size: 2,
        },
        aggs: {
          reactions_by_target: {
            terms: {
              field: "target_id",
              size: commentIds.length,
            },
            aggs: user_id
              ? {
                  user_like: {
                    filter: {
                      bool: {
                        must: [
                          { term: { user_id: user_id } },
                          { term: { status: "active" } },
                        ],
                      },
                    },
                  },
                }
              : {},
          },
        },
      },
    },
  };

  const reactionsRes = await client.search(reactionsQuery);
  const commentLikesMap: Record<
    string,
    { total_likes: number; is_liked: boolean }
  > = {};

  const replyLikesMap: Record<
    string,
    { total_likes: number; is_liked: boolean }
  > = {};

  const buckets =
    // @ts-ignore
    reactionsRes.aggregations.reactions_by_type.buckets;

  for (const typeBucket of buckets) {
    const isReply = typeBucket.key === "seller_reply";

    for (const bucket of typeBucket.reactions_by_target.buckets) {
      const map = isReply ? replyLikesMap : commentLikesMap;

      map[bucket.key] = {
        total_likes: bucket.doc_count,
        is_liked: bucket.user_like ? bucket.user_like.doc_count > 0 : false,
      };
    }
  }

  return commentsResult.map((comment) => ({
    ...comment,
    total_likes: commentLikesMap[comment.id]?.total_likes || 0,
    is_liked: commentLikesMap[comment.id]?.is_liked || false,
    reply_total_likes:
      comment.has_reply && comment.seller_reply
        ? replyLikesMap[`${comment.id}-seller_reply`]?.total_likes || 0
        : 0,
    reply_is_liked:
      comment.has_reply && comment.seller_reply
        ? replyLikesMap[`${comment.id}-seller_reply`]?.is_liked || false
        : false,
  }));
}

async function GetBuyerComment({ id }) {
  const userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
  let userId = userData?.id;
  let query: any = {
    index: comments_index,
    size: 1,
    sort: [
      { created_at: "desc" }, // newest first
      { comment_id: "desc" }, // tie-breaker for consistent pagination
    ],
    query: {
      bool: {
        must: [{ term: { comment_id: id } }],
      },
    },
  };

  const response = await client.search(query);

  let results: any = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));
  results = await GetFQACommentsForProductWithReactions({
    user_id: userId,
    commentsResult: results,
  });
  let comment = {
    id: results?.[0].id,
    customer: {
      id: results?.[0].user_id,
      name: results?.[0].user_name,
      image: results?.[0]?.user_avatar,
    },
    product_id: results?.[0].product_id,
    comment: results?.[0].text,
    ownerId: results?.[0]?.owner_id,
    ownerType: results?.[0]?.owner_type,
    variant: results?.[0].variant,
    isOwner:
      userId &&
      results?.[0]?.user_id &&
      String(results?.[0]?.user_id) === String(userId),
    created_at: results?.[0].created_at,
    true_size: results?.[0].aspects?.size?.fit_analysis?.correct ?? false,
    good_quality_comment: results?.[0]?.good_quality_comment ?? false,
    comments_images_customer: results?.[0]?.comments_images_customer ?? [],
    star_rating: results?.[0].rating,
    order_details_id: results?.[0].order_details_id,
    recommendation: results?.[0]?.recommendation,
    total_likes: results?.[0]?.total_likes,
    is_liked: results?.[0]?.is_liked,
  };
  return comment;
}
export async function UpdateBuyerComment({ language, id }) {
  let comment = await GetBuyerComment({ id: id });

  return {
    comment: (
      <BuyersCommentItem
        id={id}
        key={id}
        comment={comment}
        language={language}
      />
    ),
    success: true,
    status: 200,
  };
}

export async function GetProductStories({ page, productId }) {
  let cookiesStore = await cookies();
  let storiesToken = cookiesStore.get("USER-STORIES")?.value;
  let headers = {};
  if (storiesToken) {
    headers = { ...headers, Authorization: `Bearer ${storiesToken}` };
  }

  let response = await fetchServerData({
    url:
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
      `/api/v1/stories/product_stories/${productId}?page=${page}`,
    method: "GET",
    headers: headers,
  });
  const getStoryBorder = (story) => {
    // has new story
    if (story.stories.filter((s) => s.is_seen === false)?.length > 0) {
      return (
        <svg
          className="absolute top-0 left-0 z-40"
          xmlns="http://www.w3.org/2000/svg"
          width="111"
          height="160"
          viewBox="0 0 111 160"
        >
          <g
            id="Rectangle_6484"
            data-name="Rectangle 6484"
            fill="none"
            stroke="#513aaf"
            strokeWidth="0.5"
          >
            <rect width="111" height="160" rx="15" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="110.5"
              height="159.5"
              rx="14.75"
              fill="none"
            />
          </g>
        </svg>
      );
    } else {
      return (
        <svg
          className="absolute top-0 left-0 z-40"
          xmlns="http://www.w3.org/2000/svg"
          width="111"
          height="160"
          viewBox="0 0 111 160"
        >
          <g
            id="Rectangle_6484"
            data-name="Rectangle 6484"
            fill="none"
            stroke="#D3D3D3"
            strokeWidth="0.5"
          >
            <rect width="111" height="160" rx="15" stroke="none" />
            <rect
              x="0.25"
              y="0.25"
              width="110.5"
              height="159.5"
              rx="14.75"
              fill="none"
            />
          </g>
        </svg>
      );
    }
  };

  if (!response.data) {
    return {
      data: [],
      items: [],
    };
  }
  return {
    data: response.data.data.data,
    items: response.data.data?.data?.map((story, index) => (
      <div
        key={index}
        data-id={story.id}
        className="product-story relative"
        data-cy="Story"
        style={{
          boxShadow: "0 3px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {getStoryBorder(story)}
        <img
          width={111}
          height={160}
          src={getThumb(
            // @ts-ignore
            story.stories[0]?.full_video_path ||
              // @ts-ignore
              story.stories[0]?.photo_path,
            // @ts-ignore
            Boolean(story.stories[0]?.full_video_path),
          )}
        />
        <div className="inset-story-shadow absolute" />
      </div>
    )),
  };
}

export async function GetProductFaqQuestions({
  language,
  productId,
  offset = null,
  filter = null,
  pageSize = 5,
  userId,
  width = 90,
  isFromComments = false,
}) {
  let query: any = {
    index: comments_index,
    size: pageSize,
    sort: [
      { created_at: "desc" }, // newest first
      { comment_id: "desc" }, // tie-breaker for consistent pagination
    ],
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
    aggs: {
      unique_aspects: {
        terms: {
          field: `discussed_aspects_${language}`,
          size: 1000, // adjust if you have more aspects
        },
      },
    },
  };
  if (filter && typeof filter === "string" && filter?.trim() !== "") {
    query.query.bool.must.push({
      bool: {
        should: [
          { term: { discussed_aspects_en: filter } },
          { term: { discussed_aspects_ar: filter } },
          { term: { discussed_aspects_tr: filter } },
          { term: { discussed_aspects_ku: filter } },
        ],
        minimum_should_match: 1, // at least one should match
      },
    });
  }

  if (offset) {
    query = {
      ...query,
      search_after: typeof offset === "string" ? JSON.parse(offset) : offset,
    };
  }

  let response = await client.search(query);
  let results = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const nextSearchAfter =
    results.length > 0 ? response.hits.hits[results.length - 1].sort : null;
  if (results?.length > 0)
    results = await GetFQACommentsForProductWithReactions({
      user_id: userId,
      commentsResult: results,
    });
  const filters_key = (
    (response.aggregations?.unique_aspects as any)?.buckets || []
  ).map((bucket: any, index) => {
    return bucket?.key;
  });
  let comments = {
    fqa_comments: results?.map((s: any) => ({
      id: s.id,
      customer: {
        id: s.user_id,
        name: s.user_name,
        image: s.user_avatar,
      },
      product_id: s.product_id,
      comment: s.text,
      created_at: s.created_at,
      has_reply: s.has_reply,
      good_quality_comment: s?.good_quality_comment,
      seller_reply: s.seller_reply,
      seller_name: s.seller_name,
      reply_created_at: s.reply_created_at,
      total_likes: s?.total_likes,
      is_liked: s?.is_liked,
      reply_total_likes: s?.reply_total_likes,
      reply_is_liked: s?.reply_is_liked,
      isOwner: userId && s?.user_id && String(s?.user_id) === String(userId),
    })),
    total: (response.hits.total as any)?.value,
    filters_key: filters_key,
    searchAfter: nextSearchAfter,
  };

  return {
    comments: comments.fqa_comments.map((com) => (
      <FaqItemComponent
        isFromComments={isFromComments}
        key={com.id}
        comment={com}
        id={com.id}
        isRtl={language === "ar" || language === "ku"}
        language={language}
        seller_name={com.seller_name}
        width={width}
      />
    )),
    offset: comments.searchAfter,
    filters_key: filters_key,
    total: (response.hits.total as any)?.value,
  };
}
async function GetFaqItem({ id }) {
  let query: any = {
    index: comments_index,
    size: 1,
    query: {
      bool: {
        must: [{ term: { comment_id: String(id) } }],
        must_not: [{ term: { status: "deleted" } }],
      },
    },
  };

  let response = await client.search(query);
  let results: any = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
  let userId = userData?.id;

  if (results?.length > 0)
    results = await GetFQACommentsForProductWithReactions({
      user_id: userId,
      commentsResult: results,
    });
  let comment = {
    id: results?.[0]?.id,
    customer: {
      id: results?.[0]?.user_id,
      name: results?.[0]?.user_name,
      image: results?.[0]?.user_avatar,
    },
    product_id: results?.[0]?.product_id,
    comment: results?.[0]?.text,
    created_at: results?.[0]?.created_at,
    has_reply: results?.[0]?.has_reply,
    good_quality_comment: results?.[0]?.good_quality_comment,
    seller_reply: results?.[0]?.seller_reply,
    seller_name: results?.[0]?.seller_name,
    reply_created_at: results?.[0]?.reply_created_at,
    total_likes: results?.[0]?.total_likes,
    isOwner:
      userId &&
      results?.[0]?.user_id &&
      String(results?.[0]?.user_id) === String(userId),
    is_liked: results?.[0]?.is_liked,
    reply_total_likes: results?.[0]?.reply_total_likes,
    reply_is_liked: results?.[0]?.reply_is_liked,
  };
  return comment;
}

export async function GetFaqItemElement({ id, language, width = 90 }) {
  let comment = await GetFaqItem({ id: id });

  return {
    comment: (
      <FaqItemComponent
        key={comment.id}
        comment={comment}
        id={comment.id}
        isRtl={language === "ar" || language === "ku"}
        language={language}
        seller_name={comment.seller_name}
        width={width}
      />
    ),
    success: true,
    status: 200,
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
