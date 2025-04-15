import ProductsList from "components/ListingPage/ProductsList";

import React from "react";
import { getListingData } from "store/homepage/cachedActions";
import { fetchWithRetry, getBoutiqueMeta } from "utils/functions";
async function ProductListServer({ params, searchParams }) {
  const [Listing_Data_res, response] = await getListingData({
    categories: [params.productCategory],
    productCategory: params.boutiqueCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    country: params.lang ? params.lang.split("-")[0] : null,
    searchParams: {},
    noFilters: true,
  });

  const getCurrency = async ({ lang, country }) => {
    let data = await fetchWithRetry(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile/home/currency",
      {
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        },
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          lang: lang,
          country: country,
        }),
      },
      "Get Currency"
    );
    return data.data.currency;
  };
  const currency = await getCurrency({
    country: params.lang.split("-")[0],
    lang: params.lang.split("-")[1],
  });
  return (
    <>
      <ProductsList
        currency={currency}
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default ProductListServer;
