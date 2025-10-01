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
    let [commentsRes, sharesRes] = await Promise.all([
      fetchServerData({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/product/CommentsSharesDetails/${slug}`,
        method: "GET",
        revalidate: 0,
        local: lang,
      }),
      getProductSharedCountFromElasticsearch(productId, slug, lang),
    ]);
    if (commentsRes.isError) {
      LogServerError(
        {
          request: `/web/product/CommentsSharesDetails/${slug} || ${commentsRes.status}`,
          message: JSON.stringify(commentsRes),
          language: lang.split("-")[1],
          country: lang.split("-")[0],
        },
        `/web/product/CommentsSharesDetails/${slug}`
      );
      throw new Error(
        `Comments Requets Error:${commentsRes.status}:${commentsRes.error}`
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

    let commentsData = commentsRes.data.data;
    // @ts-ignore
    let sharesData = sharesRes.hits?.hits?.[0]?._source?.shared_count || 0;

    return {
      ...commentsData,
      shared_count: sharesData,
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
