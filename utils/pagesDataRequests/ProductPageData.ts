import { cookies } from "next/headers";
import { fetchProductDetails } from "serverRequests";
import { fetchServerData } from "serverRequests/ServerFetch";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
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
      country
    );
    if (!productData?.id) {
      throw { message: "Couldnt Fetch Product" };
    }
    let socialData = await GetSocialDataForProduct({
      productId: productData.id,
      lang: params.lang,
      slug: params.productId,
    });
    return {
      product: productData,
      socialData: socialData,
    };
  } catch (error) {
    throw error;
  }
};
export const GetSocialDataForProduct = async ({ productId, slug, lang }) => {
  try {
    let [likeRes] = await Promise.all([
      fetchServerData({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/CommentsSharesDetails/${slug}`,
        method: "GET",
        revalidate: 0,
        local: lang,
      }),
    ]);
    if (likeRes.isError) {
      LogServerError(
        {
          request: `/web/product/CommentsSharesDetails/${slug} || ${likeRes.status}`,
          message: JSON.stringify(likeRes),
          language: lang.split("-")[1],
          country: lang.split("-")[0],
        },
        `/web/product/CommentsSharesDetails/${slug}`
      );
      throw new Error(
        `Comments Requets Error:${likeRes.status}:${likeRes.error}`
      );
    }

    let likesData = likeRes.data.data;
    return {
      count_of_likes: likesData.count_of_likes,
    };
  } catch (error) {
    console.error(error);
  }
};

export const getProductDataFromElastic = async ({ productId, slug, lang }) => {
  const cookiesStore = await cookies();
  let user_data = cookiesStore.get(COOKIE_NAMES.USER_DATA)?.value;
  let user_id =
    typeof user_data === "string" ? JSON.parse(user_data)?.id : null;
  try {
    let [
      sharesRes,
      ratingComment,
      FQAComments,
      recommendationStats,
      ratingDetails,
    ] = await Promise.all([
      getProductSharedCountFromElasticsearch(productId, slug, lang),
      GetRatingCommentsForProduct({
        product_id: productId,
        user_id,
      }),
      GetFQACommentsForProduct({
        product_id: productId,
        pageSize: 10,
        searchAfter: null,
        user_id: user_id,
      }),
      GetRecommendationCountForProduct({ product_id: productId }),
      getProductRatingDetails({ p_id: productId }),
    ]);

    let sharesData =
      (sharesRes as any)?.hits?.hits?.[0]?._source?.shared_count || 0;

    return {
      shared_count: sharesData,
      buyers_comment: {
        comments: ratingComment.buyers_comments,
        offset: ratingComment.searchAfter,
        total: ratingComment.total,
      },
      fqa_questions: {
        comments: FQAComments.fqa_comments,
        offset: FQAComments.searchAfter,
        total: FQAComments.total,
      },
      ratingDetails,
      recommendation_stats: recommendationStats.stats,
      total_rating: recommendationStats.total_rating,
    };
  } catch (error) {
    console.error(error);
  }
};
async function getProductSharedCountFromElasticsearch(productId, slug, lang) {
  try {
    let res = await client.search({
      index: "shared_products",
      size: 1, // just one document if you expect a single match
      query: {
        term: {
          product_id: productId, // exact match search
        },
      },
    });
    return { ...res, isError: false, error: null };
  } catch (error) {
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
    index: "comments",
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
      product_id: s?.product_id,
      comment: s?.text,
      created_at: s?.created_at,
      star_rating: s?.rating,
      order_details_id: s?.order_details_id,
    })),
    total: (response.hits.total as any)?.value,
    searchAfter: nextSearchAfter,
  };
}
export const getProductRatingDetails = async ({ p_id }) => {
  try {
    const result = await client.search({
      index: "comments",
      size: 0, // only want aggregation results
      query: {
        bool: {
          must: [
            { term: { product_id: String(p_id) } },
            { exists: { field: "rating" } },
            { exists: { field: "order_details_id" } },
          ],
          must_not: [{ term: { status: "deleted" } }],
        },
      },
      aggs: {
        rating_buckets: {
          terms: {
            script: {
              source: `
        if (doc['rating'].size() == 0) return 0;
  def r = doc['rating'].value;
              if (r >= 4.5) return 5;
              if (r >= 3.5) return 4;
              if (r >= 2.5) return 3;
              if (r >= 1.5) return 2;
              if (r >= 0.5) return 1;
              return 0;
              `,
            },
            size: 6,
            order: { _key: "desc" }, // ensures keys come 5 → 0
          },
        },
      },
    });

    const buckets = (result.aggregations?.rating_buckets as any)?.buckets ?? [];
    let rating_details = [1, 2, 3, 4, 5].map((i) => ({
      ratingGroup: i,
      count: buckets?.find((s) => String(s.key) === String(i))?.doc_count ?? 0,
    }));
    return rating_details;
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    return { rating_details: [] };
  }
};
export async function GetRatingCommentsForProduct({
  product_id,
  pageSize = 10,
  searchAfter = null,
  filter = null,
  user_id = null,
}) {
  let query: any = {
    index: "comments",
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
  };

  if (filter && typeof filter === "string" && filter.trim() !== "") {
    if (filter !== "recommend")
      query.query.bool.must.push({
        term: { discussed_aspects: filter },
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
      star_rating: s.rating,
      order_details_id: s.order_details_id,
      recommendation: s?.recommendation,
      total_likes: s?.total_likes,
      is_liked: s?.is_liked,
    })),
    total: (response.hits.total as any)?.value,
    searchAfter: nextSearchAfter,
  };
}
export const GetRecommendationCountForProduct = async ({ product_id }) => {
  const result = await client.search({
    index: "comments",
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
      total_rating: {
        avg: { field: "rating" },
      },
    },
  });
  // @ts-ignore
  const buckets = result.aggregations.recommendation_status.buckets;
  const total = buckets.recommend.doc_count + buckets.not_recommend.doc_count;
  const avgRating = (result.aggregations.total_rating as any).value || 0;
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

  return { stats, total_rating: avgRating };
};
// comments with questions and replies
export async function GetFQACommentsForProduct({
  product_id,
  pageSize = 10,
  searchAfter = null,
  filter = null,
  user_id = null,
}) {
  let query: any = {
    index: "comments",
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
  };
  if (filter && typeof filter === "string" && filter?.trim() !== "") {
    query.query.bool.must.push({
      term: { discussed_aspects: filter },
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
      seller_reply: s.seller_reply,
      seller_name: s.seller_name,
      reply_created_at: s.reply_created_at,
      total_likes: s?.total_likes,
      is_liked: s?.is_liked,
      reply_total_likes: s?.reply_total_likes,
      reply_is_liked: s?.reply_is_liked,
    })),
    total: (response.hits.total as any)?.value,

    searchAfter: nextSearchAfter,
  };
}

export async function GetFQACommentsForProductWithReactions({
  user_id,
  commentsResult,
}) {
  const commentIds = commentsResult.map((s) => s.id);
  if (commentIds.length === 0) return commentsResult;

  const reactionsQuery: any = {
    index: "comments_reactions",
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
        terms: { field: "target_type.keyword", size: 2 },
        aggs: {
          reactions_by_target: {
            terms: { field: "target_id.keyword", size: commentIds.length },
            aggs: user_id
              ? {
                  total_likes: { value_count: { field: "interaction_id" } },
                  user_like: { filter: { term: { user_id } } },
                }
              : {
                  total_likes: { value_count: { field: "interaction_id" } },
                },
          },
        },
      },
    },
  };

  const reactionsRes = await client.search(reactionsQuery);

  // Step 2: Build lookup maps for comments and replies
  const commentLikesMap: Record<
    string,
    { total_likes: number; is_liked: boolean }
  > = {};
  const replyLikesMap: Record<
    string,
    { total_likes: number; is_liked: boolean }
  > = {};

  for (const typeBucket of (reactionsRes.aggregations.reactions_by_type as any)
    .buckets) {
    const isReply = typeBucket.key === "seller_reply";

    for (const bucket of typeBucket.reactions_by_target.buckets) {
      const map = isReply ? replyLikesMap : commentLikesMap;
      map[bucket.key] = {
        total_likes: bucket.total_likes.value,
        is_liked: bucket.user_like ? bucket.user_like.doc_count > 0 : false,
      };
    }
  }

  // Step 3: Merge back into comment list
  const enrichedComments = commentsResult.map((comment) => ({
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

  return enrichedComments;
}
