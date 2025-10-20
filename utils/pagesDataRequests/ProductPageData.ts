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
    let [likeRes, sharesRes, commentsRes] = await Promise.all([
      fetchServerData({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/CommentsSharesDetails/${slug}`,
        method: "GET",
        revalidate: 0,
        local: lang,
      }),
      getProductSharedCountFromElasticsearch(productId, slug, lang),
      GetCommentsFromElastic({
        user_id: null,
        pageSize: 10,
        product_id: productId,
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
    if (sharesRes.isError || sharesRes.error) {
      LogServerError(
        {
          request: `get shared_products from elasticsearch for product_id: ${productId} slug: ${slug}`,
          message: JSON.stringify(sharesRes),
          language: lang.split("-")[1],
          country: lang.split("-")[0],
        },
        `/web/product/CommentsSharesDetails/${slug}`
      );
      throw new Error(`Shares Requets Error:${sharesRes.error}`);
    }

    let commentsData = likeRes.data.data;
    // @ts-ignore
    let sharesData = sharesRes.hits?.hits?.[0]?._source?.shared_count || 0;

    return {
      count_of_likes: commentsData.count_of_likes,
      shared_count: sharesData,
      comments: commentsRes.comments,
      comment_offset: commentsRes.searchAfter,
      comments_count: commentsRes.total,
    };
  } catch (error) {}
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
export async function GetCommentsFromElastic({
  user_id,
  pageSize = 10,
  searchAfter,
  product_id,
}: {
  user_id?: any;
  pageSize: number;
  searchAfter?: any;
  product_id: string;
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
          { term: { status: "active" } },
          { term: { product_id: product_id } },
          { term: { has_reply: false } },
        ],
        must_not: [
          { exists: { field: "rating" } },
          { exists: { field: "order_detail_id" } },
        ],
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
      id: s.id,
      customer: {
        id: s.user_id,
        name: s.user_name,
        image: s.user_avatar,
      },
      product_id: product_id,
      comment: s.text,
      created_at: s.created_at,
    })),
    total: (response.hits.total as any)?.value,
    searchAfter: nextSearchAfter,
  };
}
export async function GetRatingCommentsFromElastic({
  user_id,
  pageSize = 10,
  searchAfter,
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
          { term: { status: "active" } },
          { terms: { order_details_id: order_ids?.map((s) => String(s)) } },
          { term: { user_id: String(user_id) } },
        ],
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
      id: s.id,
      customer: {
        id: s.user_id,
        name: s.user_name,
        image: s.user_avatar,
      },
      product_id: s.product_id,
      comment: s.text,
      created_at: s.created_at,
      star_rating: s.rating,
      order_details_id: s.order_details_id,
    })),
    total: (response.hits.total as any)?.value,
    searchAfter: nextSearchAfter,
  };
}
