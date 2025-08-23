import { fetchProductDetails } from "Server Requests";
import { fetchServerData } from "Server Requests/ServerFetch";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
let client = elasticSearchClient;
export const GetProductData = async (params: {
  lang: string;
  productId: string;
}) => {
  try {
    let [country, language] = params.lang.split("-");
    let [productData] = await Promise.all([
      fetchProductDetails(params.productId, language, country),
    ]);
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
      client.search({
        index: "shared_products",
        size: 1, // just one document if you expect a single match
        query: {
          term: {
            product_id: productId, // exact match search
          },
        },
      }),
    ]);
    if (commentsRes.isError) {
      throw new Error(
        `Comments Requets Error:${commentsRes.status}:${commentsRes.error}`
      );
    }
    // if (sharesRes.isError) {
    //   throw new Error(
    //     `Shares Requets Error:${sharesRes.status}:${sharesRes.error}`
    //   );
    // }

    let commentsData = commentsRes.data.data;
    // @ts-ignore
    let sharesData = sharesRes.hits?.hits?.[0]?._source?.shared_count || 0;

    return {
      ...commentsData,
      shared_count: sharesData,
    };
  } catch (error) {
    console.error(`Social Data:` + error);
  }
};
