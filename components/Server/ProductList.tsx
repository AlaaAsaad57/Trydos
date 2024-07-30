import FilterBar from "components/ListingPage/FilterBar";
import ProductListTest from "components/ListingPage/ProductListTest";
import ProductsList from "components/ListingPage/ProductsList";
import React from "react";
import { getListingData } from "store/homepage/cachedActions";
import { getBoutiqueMeta } from "utils/functions";

async function ProductListServer({ params, searchParams }) {
  const boutiqueId = params.productCategory;
  const boutique =
    boutiqueId === "listing"
      ? null
      : await getBoutiqueMeta({ boutiqueId, lang: params.lang });
  const [, Listing_Data_res] = await getListingData({
    categories: (searchParams.boutique_slugs && [
      searchParams.boutique_slugs,
    ]) || [params.productCategory],
    productCategory: params.boutiqueCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    searchParams: searchParams,
  });

  let filters = {
    categories: Listing_Data_res.body.data?.categories || [],
    brands: Listing_Data_res.body.data?.brands || [],
    attributes: Listing_Data_res.body.data?.attributes || [],
    offers: Listing_Data_res.body.data?.offers || [],
    prices: Listing_Data_res.body.data?.prices || null,
    search_text: Listing_Data_res.body.data?.result_for || "",
    colors: Listing_Data_res.body.data?.colors || [],
  };

  return (
    <>
      {/* <FilterBar
        filters={filters}
        boutique={boutique}
        productsServer={Listing_Data_res.body.data.products}
      /> */}
      <ProductsList
        Listing_Data_res={Listing_Data_res}
        productCategory={params.productCategory}
        boutiqueCategory={params.boutiqueCategory}
      />
    </>
  );
}

export default ProductListServer;
