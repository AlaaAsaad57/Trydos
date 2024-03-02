"use server";
import Home from "components/Home";
import { getHomeData } from "store/homepage/cachedActions";
import React from "react";
async function page() {
  const [HomeData, HomeData_res] = await getHomeData();
  console.log([HomeData, HomeData_res]);
  return (
    <>
      <Home HomeData_res={HomeData_res} HomeData={HomeData} />
    </>
  );
}

export default page;
