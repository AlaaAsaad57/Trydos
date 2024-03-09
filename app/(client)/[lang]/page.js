"use server";
import Home from "components/Home";
// import { getHomeData } from "store/homepage/cachedActions";

async function page() {
  return (
    <>
      <Home HomeData_res={[]} HomeData={[]} />
    </>
  );
}

export default page;
