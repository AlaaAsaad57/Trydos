"use server";
import ProductCard from "components/ListingPage/ProductCard";
import { getHomeData, getListingData } from "store/homepage/cachedActions";
async function page({ params }) {
  const [HomeData, HomeData_res] = await getHomeData({
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  const [Listing_data, Listing_Data_res] = await getListingData({
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  return (
    <>
      {
        <ProductCard
          Listing_data={Listing_data}
          Listing_Data_res={Listing_Data_res}
          HomeData_res={HomeData_res}
          HomeData={HomeData}
        />
      }
    </>
  );
}

export default page;
