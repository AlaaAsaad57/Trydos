"use server";
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
  const [Listing_data, Listing_Data_res] = await getListingData({
    categories: params.categories,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  const [HomeData, HomeData_res] = await getHomeData({
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
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
