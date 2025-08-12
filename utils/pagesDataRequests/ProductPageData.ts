import { fetchProductDetails } from "Server Requests";
import { fetchServerData } from "Server Requests/ServerFetch";

export const GetProductData = async (params: {
  lang: string;
  productId: string;
}) => {
  try {
    let [country, language] = params.lang.split("-");
    let [productData] = await Promise.all([
      fetchProductDetails(params.productId, language, country),
    ]);
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
    return error;
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
      fetchServerData({
        url:
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v2/elastic/shared_count/${productId}`,
        method: "GET",
        local: lang,
        revalidate: 0,
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
    let sharesData = sharesRes.data.data;
    return { ...commentsData, ...sharesData };
  } catch (error) {
    console.error(`Social Data:` + error);
  }
};
