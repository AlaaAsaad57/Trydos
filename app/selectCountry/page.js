"use server";
import PopupCountry from "../../utils/PopupCountry";
import { getCountriesApi } from "../../store/homepage/cachedActions";
import { Suspense } from "react";
async function page() {
  function SearchBarFallback() {
    return <></>;
  }
  const data = await getCountriesApi();

  return (
    <>
      <Suspense fallback={<SearchBarFallback />}>
        <PopupCountry
          countries={data.map((s) => s.iso)}
          options={data.map((s) => {
            return { label: s.nicename, value: s.iso };
          })}
        />
      </Suspense>
    </>
  );
}

export default page;
