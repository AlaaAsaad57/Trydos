import { fetchCurrency, fetchProductDetails } from "Server Requests";

export const GetProductData = async (params: {
  lang: string;
  productId: string;
}) => {
  let [country, language] = params.lang.split("-");
  let [productData, currencyData] = await Promise.all([
    fetchProductDetails(params.productId, language, country),
    fetchCurrency(language, country),
  ]);

  return {
    product: productData,
    currency: currencyData.data.currency,
  };
};
