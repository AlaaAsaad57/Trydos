"use server";

import { generateCloudinaryUrl, getThumb, stripHtml } from "utils/server";
import { GetFromRedis, RedisGet, RedisSet } from "./radis";
import { fetchServerData } from "./ServerFetch";
import { Metadata } from "next";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import { BuyersCommentItem } from "components/Server/product/ProductBuyersComment/BuyerCommentItem";
import { cookies } from "next/headers";
let client = elasticSearchClient;
export async function GetGlobalProduct({ slug, country, language }) {
  try {
    const slugKey = `product-slug:${String(slug)}:${String(language)}:${String(
      country
    )}`;

    let productId = await GetFromRedis(slugKey);
    let cacheKey = `product-id-${productId}-${country}-${language}`;
    if (productId) {
      let cachedProductData = await RedisGet(`${cacheKey}-global`);
      if (cachedProductData) {
        return {
          ...cachedProductData,
          globalFromRedis: true,
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
        freshGlobalData.data.data
      );
    }
    return { ...freshGlobalData.data?.data, globalFromRedis: false };
  } catch (error) {
    // log error
  }
}
export async function GetProductPriceQtyDetails({ slug, country, language }) {
  try {
    const slugKey = `product-slug:${String(slug)}:${String(language)}:${String(
      country
    )}`;
    let productId = await GetFromRedis(slugKey);
    let cacheKey = `product-id-${productId}-${country}-${language}`;
    if (productId) {
      let cachedProductData = await RedisGet(`${cacheKey}-qtyPrices`);
      if (cachedProductData) {
        return {
          ...cachedProductData,
          qtyPricesDataFromRedis: true,
        };
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
        freshQtyPricesData.data.data
      );
    }
    return { ...freshQtyPricesData.data?.data, qtyPricesDataFromRedis: false };
  } catch (error) {
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
    let product = freshMeta.data.data;

    let title = `${product?.name}`;
    if (searchParams.color) {
      title += ` |  ${searchParams.color}`;
    }
    if (searchParams.size) {
      title += ` |  ${searchParams.size}`;
    }
    let image = product?.images
      ? generateCloudinaryUrl({
          publicIds: product?.images.map((s) => `${s.images}`),
          width: 1200,
          height: 630,
        })
      : null;
    let data: Metadata = {
      title: title,
      description: stripHtml(product?.details),
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-${language}/products/${slug}`,
        languages: {
          en: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-en/products/${slug}`,
          tr: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-tr/products/${slug}`,
          ar: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-ar/products/${slug}`,
        },
      },
      openGraph: {
        title: title,
        description: stripHtml(product?.details),
        url: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${country}-${language}/products/${slug}`,
        siteName: "Trydos",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: "",
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: stripHtml(product?.details),
        images: [image],
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
    // log error
  }
}

export async function GetProductGeneralData({ id }) {
  let [productData, recommendation_stats] = await Promise.all([
    client.get({
      _source: [
        "final_rating",
        "total_views",
        "star_distribution",
        "size_analysis",
        "good_quality_product",
      ],
      index: "product_interactions",
      id: id,
    }),
    GetRecommendationCountForProduct({ product_id: id }),
  ]);
  const source: any = productData._source;

  const productInfo = {
    product_id: id,
    final_rating: source?.final_rating,
    total_views: source?.total_views ?? 0,
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
    index: "comments",
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

async function GetBuyerComment({ id }) {
  const cookieStore = await cookies();
  let userCookies = cookieStore.get("User-Data")?.value;
  let userId = JSON.parse(userCookies)?.id;
  let query: any = {
    index: "comments",
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
export async function UpdateBuyerComment({ payload, language, id }) {
  let cookieStore = await cookies();
  let commentToken = cookieStore.get(
    "x7k9m2p4q8r1s5t3u6v2w9y4z7a1b5c8d2e6f9g3h7j1k4l8m2n5p9q3r6s1t4u7v2w5x8y1z4a7b2c5d8e1f4g7h2j5k8l1m4n7o2p5q8r1s4t7u2v5w8x1y4z7"
  )?.value;
  if (!commentToken)
    return {
      status: 401,
      message: "UnAuth-401",
      success: false,
    };
  let res = await fetchServerData({
    url:
      process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL +
      `/public_comment/comments/${id}/update`,
    headers: {
      Authorization: `Bearer ${commentToken}`,
    },
    method: "PUT",
    body: payload,
  });
  console.log(res, payload);
  if (res.error) {
    return { status: res.status, message: res.error, success: false };
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
  let comment = await GetBuyerComment({ id: id });
  console.log(comment);
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

export async function DeleteComment({ id, language }) {
  let cookieStore = await cookies();
  let commentToken = cookieStore.get(
    "x7k9m2p4q8r1s5t3u6v2w9y4z7a1b5c8d2e6f9g3h7j1k4l8m2n5p9q3r6s1t4u7v2w5x8y1z4a7b2c5d8e1f4g7h2j5k8l1m4n7o2p5q8r1s4t7u2v5w8x1y4z7"
  )?.value;
  if (!commentToken)
    return {
      status: 401,
      message: "UnAuth-401",
      success: false,
    };
  let res = await fetchServerData({
    url:
      process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL +
      "/public_comment/comments/${id}/delete",
    method: "DELETE",
  });
  if (res.error) {
    return { status: res.status, message: res.error, success: false };
  }
  return { status: 200, success: true };
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
  console.log(response);
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
            Boolean(story.stories[0]?.full_video_path)
          )}
        />
        <div className="inset-story-shadow absolute" />
      </div>
    )),
  };
}
