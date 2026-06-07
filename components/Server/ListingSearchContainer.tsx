import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import React, { Suspense } from "react";

async function ListingSearchContainer({
  country,
  language,
  parsedFilters,
  filtersPromise,
  featured = false,
  flashdeal = false,
}) {
  let filtersData = await filtersPromise;
  return (
    <Suspense fallback={<></>}>
      <SearchBoutiquePage
        lang={`${country}-${language}`}
        country={country}
        language={language}
        featured={featured}
        flashdeal={flashdeal}
        isAnalyzed={filtersData.isAnalyzed}
        parsedFilters={parsedFilters}
        search_text={
          filtersData?.applied?.search_text ?? parsedFilters?.search_text?.[0]
        }
      />
    </Suspense>
  );
}

export default ListingSearchContainer;
