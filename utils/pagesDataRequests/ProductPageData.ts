import { fetchCurrency, fetchProductDetails } from "Server Requests";
import { fetchServerData } from "Server Requests/ServerFetch";

export const GetProductData = async (params: {
  lang: string;
  productId: string;
}) => {
  let [country, language] = params.lang.split("-");
  let [productData, currencyData] = await Promise.all([
    fetchProductDetails(params.productId, language, country),
    fetchCurrency(language, country),
  ]);
  // let socialData = await GetSocialDataForProduct({
  //   productId: productData.id,
  //   lang: params.lang,
  //   slug: params.productId,
  // });
  return {
    product: productData,
    // socialData: socialData,
    currency: currencyData.data.currency,
  };
};
export const GetSocialDataForProduct = async ({ productId, slug, lang }) => {
  try {
    let [commentsRes, sharesRes, likesRes] = await Promise.all([
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
          process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
          `api/v2/elastic/shared_count/${productId}`,
        method: "GET",
        local: lang,
        revalidate: 0,
      }),
      fetchServerData({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/",
        method: "GET",
        revalidate: 0,
        local: lang,
      }),
    ]);
    if (commentsRes.isError) {
      throw new Error(
        `Comments Requets Error:${commentsRes.status}:${commentsRes.error}`
      );
    }
    if (sharesRes.isError) {
      throw new Error(
        `Shares Requets Error:${sharesRes.status}:${sharesRes.error}`
      );
    }

    let commentsData = commentsRes.data.data;
    let sharesData = sharesRes.data.data;
    let likesData = likesRes.data.data;
    console.log(commentsData, sharesData, likesData);
    return { ...commentsData, ...sharesData };
  } catch (error) {
    console.error(`Social Data:` + error);
  }
};
