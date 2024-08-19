import ProductsList from "components/ListingPage/ProductsList";
import dynamic from "next/dynamic";
import React from "react";
import { getListingData } from "store/homepage/cachedActions";
import { getBoutiqueMeta } from "utils/functions";
const FilterBar = dynamic(() => import("components/ListingPage/FilterBar"), {
  ssr: false,
});

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
  console.log("boutique-filter loaded");
  return (
    <>
      <FilterBar
        filters={{
          categories: (searchParams.boutique_slugs && [
            searchParams.boutique_slugs,
          ]) || [params.productCategory],
          productCategory: params.boutiqueCategory,
          lang: params.lang ? params.lang.split("-")[1] : null,
          searchParams: searchParams,
        }}
        boutique={boutique}
        productsServer={Listing_Data_res.body.data?.products}
      />
      <ProductsList
        response={response}
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default ProductListServer;
