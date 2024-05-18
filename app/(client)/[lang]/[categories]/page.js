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
  console.log(params);
  const [Listing_data, Listing_Data_res] = await getListingData(
    params.categories
  );
  return <>{<ProductCard Listing_Data_res={Listing_Data_res} />}</>;
}

export default page;
