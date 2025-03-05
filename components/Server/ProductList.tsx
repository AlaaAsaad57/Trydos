import ProductsList from "components/ListingPage/ProductsList";
import dynamic from "next/dynamic";
import React from "react";
import { getListingData } from "store/homepage/cachedActions";
import { fetchWithRetry, getBoutiqueMeta } from "utils/functions";
import FilterBar from "components/ListingPage/FilterBar";
import { cookies } from "node_modules/next/headers";

async function ProductListServer({ params, searchParams }) {
  const boutiqueId = params.productCategory;
  const boutique =
    boutiqueId === "listing"
      ? null
      : await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  const [Listing_Data_res, response] = await getListingData({
    categories: (searchParams.boutique_slugs && [
      searchParams.boutique_slugs,
    ]) || [params.productCategory],
    productCategory: params.boutiqueCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    searchParams: searchParams,
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
      <FilterBar
        boutique={boutique}
        productsServer={Listing_Data_res.body.data?.products}
        filters={{
          categories: Listing_Data_res.body.data?.categories,
          brands: Listing_Data_res.body.data?.brands,
          colors: Listing_Data_res.body.data?.colors,
          prices: Listing_Data_res.body.data?.prices,
          search_text: Listing_Data_res.body.data?.search_text,
        }}
      />
      <ProductsList
        currency={currency}
        response={response}
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default ProductListServer;
