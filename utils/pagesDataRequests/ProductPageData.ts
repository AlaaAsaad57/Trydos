import { fetchProductDetails } from "serverRequests";
import { fetchServerData } from "serverRequests/ServerFetch";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
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
      }),
      GetFQACommentsForProduct({
        product_id: productId,
        pageSize: 10,
        searchAfter: null,
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
      recommendation_stats: recommendationStats,
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

    return {
      rating_details: buckets.map((b) => ({
        ratingGroup: b.key,
        count: b.doc_count,
      })),
    };
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

  const results = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const nextSearchAfter =
    results.length > 0 ? response.hits.hits[results.length - 1].sort : null;

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
                should: [
                  { term: { recommendation: true } },
                  {
                    range: {
                      rating: {
                        gte: 3,
                      },
                    },
                  },
                ],
              },
            },
            not_recommend: {
              bool: {
                should: [
                  { term: { recommendation: false } },
                  {
                    range: {
                      rating: {
                        lt: 3,
                      },
                    },
                  },
                ],
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

  return stats;
};
// comments with questions and replies
export async function GetFQACommentsForProduct({
  product_id,
  pageSize = 10,
  searchAfter = null,
  filter = null,
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
  const results = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...((hit?._source as {}) ?? {}),
  }));

  const nextSearchAfter =
    results.length > 0 ? response.hits.hits[results.length - 1].sort : null;

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
    })),
    total: (response.hits.total as any)?.value,

    searchAfter: nextSearchAfter,
  };
}
