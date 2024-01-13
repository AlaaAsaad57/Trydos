"use server";
import Home from "components/Home";
import { getHomeData, getStories } from "store/homepage/cachedActions";
import React from "react";

async function page() {
  const [stories, stories_res] = await getStories();
  const [HomeData, HomeData_res] = await getHomeData();

  return (
    <>
      <Home
        HomeData_res={HomeData_res}
        stories_res={stories_res}
        stories={stories}
        HomeData={HomeData}
      />
    </>
  );
}

export default page;
