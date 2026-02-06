import { cookies } from "next/headers";
import { fetchProductDetails } from "serverRequests";
import { GetRecommendationCountForProduct } from "serverRequests/product";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import {
  comments_index,
  comments_interactions_index,
  product_interactions_index,
  share_index,
  user_interactions_index,
} from "services/elastic/INDEXES";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

let client = elasticSearchClient;
export const GetProductData = async (params: {
  lang: string;
  productId: string;
}) => {
  try {
    let [country, language] = params.lang.split("-");
    let productData = await fetchProductDetails(
      params.productId,
      language,
      country,
    );
    if (!productData?.id) {
      throw { message: "Couldnt Fetch Product" };
    }
    return {
      product: productData,
    };
  } catch (error) {
    LogServerError({
      scenario: "GetProductData in ProductPageData",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const getProductDataFromElastic = async ({
  productId,
  slug,
  lang,
  userId = null,
}) => {
  let user_id;

  if (!userId) {
    const cookiesStore = await cookies();
    let user_data = cookiesStore.get(COOKIE_NAMES.USER_DATA)?.value;
    user_id = typeof user_data === "string" ? JSON.parse(user_data)?.id : null;
  } else {
    user_id = userId;
  }

  try {
    let [
      sharesRes,
      ratingComment,
      FQAComments,
      recommendationStats,
      likeDetails,
    ] = await Promise.all([
      getProductSharedCountFromElasticsearch(productId, slug, lang),
      GetRatingCommentsForProduct({
        product_id: productId,
        user_id,
        language: lang,
      }),
      GetFQACommentsForProduct({
        product_id: productId,
        pageSize: 10,
        searchAfter: null,
        user_id: user_id,
        language: lang,
      }),
      GetRecommendationCountForProduct({
        product_id: productId,
      }),

      getProductInteractions(productId, user_id),
    ]);

    let sharesData =
      (sharesRes as any)?.hits?.hits?.[0]?._source?.shared_count || 0;

    return {
      shared_count: sharesData,
      buyers_comment: {
        comments: ratingComment.buyers_comments,
        offset: ratingComment.searchAfter,
        total: ratingComment.total,
        filters_key: ratingComment.filters_key,
      },
      fqa_questions: {
        comments: FQAComments.fqa_comments,
        offset: FQAComments.searchAfter,
        total: FQAComments.total,
        filters_key: FQAComments.filters_key,
      },
      ratingDetails: likeDetails?.ratingDetails ?? [],
      recommendation_stats: recommendationStats.stats,
      count_of_likes: likeDetails?.total_likes,
      is_liked: likeDetails?.is_liked,
      total_views: likeDetails?.total_views,
      total_rating: Number(likeDetails?.final_rating) ?? 0,
      size_analysis: likeDetails?.size_analysis,
      good_quality_product: likeDetails?.good_quality_product,
    };
  } catch (error) {
    LogServerError({
      scenario: "getProductDataFromElastic in ProductPageData",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
async function getProductSharedCountFromElasticsearch(productId, slug, lang) {
  try {
    let res = await client.search({
      index: share_index,
      size: 1, // just one document if you expect a single match
      query: {
        term: {
          product_id: productId, // exact match search
        },
      },
    });
    return { ...res, isError: false, error: null };
  } catch (error) {
    LogServerError({
      scenario: "getProductSharedCountFromElasticsearch in ProductPageData",
      error: error instanceof Error ? error.message : String(error),
    });
    return { isError: true, error: error };
  }
}
// getting asked comments (no rating,noreply)

export async function GetRatingCommentsFromElastic({
  user_id,
  pageSize = 10,
  searchAfter = null,
  order_ids,
}: {
  user_id?: any;
  pageSize: number;
  searchAfter?: any;
  order_ids: any;
}) {
  let query: any = {
    index: comments_index,
    size: order_ids.length,
    sort: [
      { created_at: "desc" }, // newest first
      { comment_id: "desc" }, // tie-breaker for consistent pagination
    ],
    collapse: {
      field: "order_details_id",
    },
    query: {
      bool: {
        must: [
          { terms: { order_details_id: order_ids?.map((s) => String(s)) } },
          { term: { user_id: String(user_id) } },
        ],
        must_not: [{ term: { status: "deleted" } }],
      },
    },
  };

  if (searchAfter) {
    query = {
      ...query,
      search_after:
        typeof searchAfter === "string" ? JSON.parse(searchAfter) : [],
    };
  }

  const response = await client.search(query);

  const results = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const nextSearchAfter =
    results.length > 0 ? response.hits.hits[results.length - 1].sort : null;

  return {
    comments: results?.map((s: any) => ({
      id: s?.id,
      customer: {
        id: s?.user_id,
        name: s?.user_name,
        image: s?.user_avatar,
      },
      comments_images_customer: s?.comments_images_customer,
      product_id: s?.product_id,
      comment: s?.text,
      created_at: s?.created_at,
      good_quality_comment: s?.good_quality_comment,
      star_rating: s?.rating,
      order_details_id: s?.order_details_id,
    })),
    total: (response.hits.total as any)?.value,
    searchAfter: nextSearchAfter,
  };
}

export async function GetRatingCommentsForProduct({
  product_id,
  pageSize = 10,
  searchAfter = null,
  filter = null,
  user_id = null,
  language = "en",
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
        must: [
          { term: { product_id: String(product_id) } },
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

  if (searchAfter) {
    query = {
      ...query,
      search_after:
        typeof searchAfter === "string" ? JSON.parse(searchAfter) : [],
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
      user_id: user_id,
      commentsResult: results,
    });
  const filters_key = (
    (response.aggregations?.unique_aspects as any)?.buckets || []
  ).map((bucket: any, index) => {
    return bucket?.key;
  });

  return {
    buyers_comments: results?.map((s: any) => ({
      id: s.id,
      customer: {
        id: s.user_id,
        name: s.user_name,
        image: s.user_avatar,
      },
      product_id: s.product_id,
      comment: s.text,
      variant: s.variant,
      created_at: s.created_at,
      true_size: s.aspects?.size?.fit_analysis?.correct ?? false,
      good_quality_comment: s?.good_quality_comment ?? false,
      comments_images_customer: s?.comments_images_customer ?? [],
      star_rating: s.rating,
      order_details_id: s.order_details_id,
      recommendation: s?.recommendation,
      total_likes: s?.total_likes,
      is_liked: s?.is_liked,
    })),
    total: (response.hits.total as any)?.value,
    filters_key: filters_key,
    searchAfter: nextSearchAfter,
  };
}

// comments with questions and replies
export async function GetFQACommentsForProduct({
  product_id,
  pageSize = 10,
  searchAfter = null,
  filter = null,
  user_id = null,
  language = "en",
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
        must: [{ term: { product_id: String(product_id) } }],
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

  if (searchAfter) {
    query = {
      ...query,
      search_after:
        typeof searchAfter === "string" ? JSON.parse(searchAfter) : [],
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
      user_id: user_id,
      commentsResult: results,
    });
  const filters_key = (
    (response.aggregations?.unique_aspects as any)?.buckets || []
  ).map((bucket: any, index) => {
    return bucket?.key;
  });
  return {
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
    })),
    total: (response.hits.total as any)?.value,
    filters_key: filters_key,
    searchAfter: nextSearchAfter,
  };
}

async function GetFQACommentsForProductWithReactions({
  user_id,
  commentsResult,
}) {
  const commentIds = commentsResult.map((s) => s.id);
  if (commentIds.length === 0) return commentsResult;

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
        ? replyLikesMap[comment.id]?.total_likes || 0
        : 0,
    reply_is_liked:
      comment.has_reply && comment.seller_reply
        ? replyLikesMap[comment.id]?.is_liked || false
        : false,
  }));
}

async function getProductInteractions(productId: string, userId?: string) {
  try {
    // Run both queries in parallel
    const [productRes, likeRes] = await Promise.all([
      client.get({
        index: product_interactions_index,
        id: productId,
      }),
      userId
        ? client.search({
            index: user_interactions_index,
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
      product_id: source?.product_id,
      final_rating: source?.final_rating,
      total_comments: source?.total_comments,
      total_likes: source?.total_likes ?? 0,
      total_views: source?.total_views ?? 0,
      ratingDetails: source?.star_distribution
        ? Object.keys(source.star_distribution)?.map((s) => ({
            ratingGroup: s?.split("_")[1],
            count: source.star_distribution[s] ?? 0,
          }))
        : [],
      size_analysis: source.size_analysis,
      good_quality_product: source.good_quality_product,
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
      scenario: "getProductInteractions in ProductPageData",
      error: err instanceof Error ? err.message : String(err),
    });
    if (err.meta?.statusCode === 404) {
      return {
        is_liked: false,
        good_quality_product: null,
        total_likes: 0,
        final_rating: 0,
        ratingDetails: [],
        total_views: 0,
        size_analysis: {
          small_percentage: 0,
          large_percentage: 0,
          // big_percentage: 0,
          true_percentage: 0,
        },
      };
    }
    throw err;
  }
}
