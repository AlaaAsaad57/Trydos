"use server";
import React from "react";
import PopupCountry from "../../utils/PopupCountry";
import { Suspense } from "react";
async function page() {
  function SearchBarFallback() {
    return <>Loading</>;
  }
  return (
    <>
      <Suspense fallback={<SearchBarFallback />}>
        <PopupCountry />
      </Suspense>
    </>
  );
}

export default page;
