"use server";

import { generateCloudinaryUrl, stripHtml } from "utils/server";
import { GetFromRedis, RedisGet, RedisSet } from "./radis";
import { fetchServerData } from "./ServerFetch";
import { Metadata } from "node_modules/next";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
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
}) {
  return {
    comments: [],
    offset: null,
  };
}
