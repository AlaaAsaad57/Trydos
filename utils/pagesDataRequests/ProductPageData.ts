import { cache } from "react";
import { fetchCurrency, fetchProductDetails } from "Server Requests";

export const GetProductData = cache(
  async (params: { lang: string; productId: string }) => {
    const key = JSON.stringify(params);

    let [country, language] = params.lang.split("-");
    let productId = params.productId;

    let [productData, currencyData] = await Promise.all([
      fetchProductDetails(params.productId, language, country),
      fetchCurrency(language, country),
    ]);

    return {
      product: productData,
      currency: currencyData.data.currency,
    };
  }
);
