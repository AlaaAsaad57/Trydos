import ProductsList from "components/ListingPage/ProductsList";
import React from "react";
import { getListingData } from "store/homepage/cachedActions";

async function ProductListServer({ params, searchParams }) {
  const [, Listing_Data_res] = await getListingData({
    categories: params.productCategory,
    productCategory: params.boutiqueCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    searchParams: searchParams,
  });

  return (
    <ProductsList
      Listing_Data_res={Listing_Data_res}
      productCategory={params.productCategory}
      boutiqueCategory={params.boutiqueCategory}
    />
  );
}

export default ProductListServer;
