"use server";
import Home from "components/Home";
// import { getHomeData } from "store/homepage/cachedActions";

async function page() {
  const [HomeData, HomeData_res] = [[], []];
  return (
    <>
      <Home HomeData_res={HomeData_res} HomeData={HomeData} />
    </>
  );
}

export default page;
