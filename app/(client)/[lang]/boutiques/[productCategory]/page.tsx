import ProductCard from "components/ListingPage/ProductCard";
import { getListingData } from "store/homepage/cachedActions";
export async function generateMetadata({ params, searchParams }) {
  // read route params
  const categories = params.productCategory;
  return {
    title: `Trydos - ${categories}`,
    description: `Trydos ${categories} Page`,
  };
}
async function page({ params, searchParams }) {
  const [res, Listing_Data_res] = await getListingData({
    categories: params.productCategory,
    lang: params.lang ? params.lang.split("-")[1] : null,
    productCategory: null,
  });
  return (
    <>
      <ProductCard Listing_Data_res={Listing_Data_res} />
    </>
  );
}

export default page;
