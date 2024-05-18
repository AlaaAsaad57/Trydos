"use server";
import Home from "components/Home";
import { getHomeData, getMainCategories } from "store/homepage/cachedActions";
async function page({ params, searchParams }): Promise<any> {
  const [HomeData, HomeData_res] = await getHomeData(
    searchParams?.category_slug
  );
  const [mainCategories, mainCategories_res] = await getMainCategories();
  return (
    <>
      <Home
        mainCategories={mainCategories}
        mainCategories_res={mainCategories_res}
        HomeData_res={HomeData_res}
        HomeData={HomeData}
      />
    </>
  );
}

export default page;
