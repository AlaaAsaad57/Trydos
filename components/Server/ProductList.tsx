import ProductsList from "components/ListingPage/ProductsList";
import dynamic from "next/dynamic";
import React from "react";
import { getListingData } from "store/homepage/cachedActions";
import { getBoutiqueMeta } from "utils/functions";
import FilterBar from "components/ListingPage/FilterBar";

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
        response={response}
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default ProductListServer;
