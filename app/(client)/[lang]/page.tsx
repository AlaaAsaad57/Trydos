"use server";
import Home from "components/Home";
import { getHomeData } from "store/homepage/cachedActions";
import { getStories } from "store/homepage/cachedActions";

async function page(): Promise<any> {
  const [HomeData, HomeData_res] = await getHomeData();
  const storiesData = await getStories();
  return (
    <>
      <Home
        storiesData={storiesData}
        HomeData_res={HomeData_res}
        HomeData={HomeData}
      />
    </>
  );
}

export default page;
