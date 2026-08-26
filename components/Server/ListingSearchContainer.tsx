import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import { Suspense } from "react";

async function ListingSearchContainer({
  country,
  language,
  parsedFilters,
  filtersPromise,
  serverSearch = "",
  featured = false,
  flashdeal = false,
}) {
  let filtersData = await filtersPromise;
  return (
    <Suspense fallback={<></>}>
      <SearchBoutiquePage
        country={country}
        language={language}
        featured={featured}
        flashdeal={flashdeal}
        parsedFilters={parsedFilters}
        serverSearch={
          serverSearch ||
          filtersData?.applied?.search_text ||
          parsedFilters?.search_text?.[0] ||
          ""
        }
      />
    </Suspense>
  );
}

export default ListingSearchContainer;
