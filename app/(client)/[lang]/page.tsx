"use server";
import Home from "components/Home";
import LandingPage from "components/Home/LandingPage";
import { Suspense } from "react";
import { getHomeData, getMainCategories } from "store/homepage/cachedActions";
async function page({ params, searchParams }): Promise<any> {
  const [HomeData, HomeData_res] = await getHomeData({
    str: searchParams?.category_slug,
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  const [mainCategories, mainCategories_res] = await getMainCategories({
    lang: params.lang ? params.lang.split("-")[1] : null,
  });
  return (
    <>
      <LandingPage />
      <Suspense fallback={<LandingPage />}>
        <Home
          mainCategories={mainCategories}
          mainCategories_res={mainCategories_res}
          HomeData_res={HomeData_res}
          HomeData={HomeData}
        />
      </Suspense>
    </>
  );
}

export default page;
