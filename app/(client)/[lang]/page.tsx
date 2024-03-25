"use server";
import Home from "components/Home";
import { ComponentType } from "react";
async function page(): Promise<any> {
  const [HomeData, HomeData_res] = [[], []];
  return (
    <>
      <Home HomeData_res={HomeData_res} HomeData={HomeData} />
    </>
  );
}

export default page;
