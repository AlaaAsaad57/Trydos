"use server";
import React from "react";
import ProductCard from "components/ListingPage/ProductCard";
import { getHomeData, getListingData } from "store/homepage/cachedActions";
export async function generateMetadata({ params, searchParams }) {
  // read route params
  const categories = params.categories;
  return {
    title: `Trydos - ${categories}`,
    description: `Trydos ${categories} Page`,
  };
}
async function page({ params, searchParams }) {
  const [HomeData, HomeData_res] = await getHomeData();
  const [Listing_data, Listing_Data_res] = await getListingData();
  console.log([HomeData, HomeData_res]);
  console.log([Listing_data, Listing_Data_res]);
  return (
    <>
      {
        <ProductCard
          Listing_Data_res={Listing_Data_res}
          HomeData_res={HomeData_res}
          HomeData={HomeData}
        />
      }
    </>
  );
}

export default page;
