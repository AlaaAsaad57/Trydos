import NextLink from "components/global/NextLink";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { EnableScroll } from "utils/tinyUtils";

function FiltersButton({
  onReset,
  filters,
  isChanged,
  total_size,
  loading,
  isFeatured,
  isFlashDeal,
}) {
  const { setFilterEnabled } = useAppStore();
  const { lang } = useParams();
  return (
    <div
      className=" fixed gap-[5px] bg-white px-[10px] z-99999999 mx-auto left-0 right-0 bottom-[50px] flex-row w-full mt-3 items-end"
      data-cy="searchResult"
    >
      {isChanged &&
        !loading &&
        (total_size !== null && total_size > 0 ? (
          <div
            className="w-auto flex grow"
            onClick={() => {
              EnableScroll();
              setFilterEnabled(false);
            }}
          >
            <NextLink
              href={getSearchPageUrl({
                lang: lang,
                searchFilters: filters,
                isFeatured,
                isFlashDeal,
              })}
              aria-disabled={loading}
              style={{
                boxShadow: "inset 0px 3px 6px #ffffff29, 0px 3px 6px #0000001a",
              }}
              data={{
                is_filter: true,
              }}
              className="w-full p-2 cursor-pointer flex bg-[#FF5F61] text-white justify-center items-center rounded-[20px] h-[65px]"
              data-cy="searchTotalProduct"
            >
              {translateFunction("Search")}
              {loading ? (
                <span className="ml-2">
                  <Spinner className="" />
                </span>
              ) : (
                <>
                  {total_size !== null && (
                    <span
                      className="text-[#fafafa] regular ml-2"
                      data-cy="countAfterFilter"
                    >
                      ({translateFunction("Total Products:")} {total_size})
                    </span>
                  )}
                </>
              )}
            </NextLink>
          </div>
        ) : (
          <></>
        ))}
      {isChanged && !loading && (
        <div
          className="w-[94px] py-[20px] px-[23px] text-[18px] regular cursor-pointer p-2 flex bg-white border border-[#388CFF] text-[#388CFF] h-[65px] justify-center items-center rounded-[20px]"
          data-cy="reset-filter-button"
          onClick={() => onReset()}
        >
          {translateFunction("Reset")}
        </div>
      )}
    </div>
  );
}

export default FiltersButton;

const buildParamsFromFilters = (
  filters: Record<string, string[]>,
): string[] => {
  const params: string[] = [];
  const filterOrder = [
    "boutiques",
    "tags_names",
    "categories",
    "brands",
    "colors",
    "sizes",
    "prices",
    "search",
  ];

  filterOrder.forEach((filterType) => {
    const values = filters[filterType];
    if (values && values.length > 0) {
      // Add filter type
      const paramName = filterType === "search" ? "search" : filterType;
      params.push(paramName);

      // Add values
      if (filterType === "search") {
        // Search is a single value
        params.push(encodeURIComponent(values[0]));
      } else if (filterType === "colors") {
        // Colors should be hex without #
        const colorValues = values.map((color) =>
          color.startsWith("#") ? color.substring(1) : color,
        );
        params.push(colorValues.join(","));
      } else {
        // Other filters are comma-separated
        params.push(values.join(","));
      }
    }
  });

  return params;
};

function getSearchPageUrl({ lang, searchFilters, isFeatured, isFlashDeal }) {
  // Build filter object for path-based URL
  const filterObj = {
    boutiques: searchFilters?.boutiques,
    categories: searchFilters?.categories,
    brands: searchFilters?.brands,
    colors:
      searchFilters?.colors?.map((c) =>
        typeof c === "string" ? c : c.toString(),
      ) || [],
    sizes:
      searchFilters?.sizes?.map((s) =>
        typeof s === "string" ? s : s.toString(),
      ) || [],
    prices:
      searchFilters?.prices?.[0] &&
      searchFilters?.prices?.[1] &&
      searchFilters?.prices?.[0] >= 0 &&
      searchFilters?.prices?.[1] >= 0
        ? [`${searchFilters.prices?.[0]}-${searchFilters.prices?.[1]}`]
        : [],
    search:
      searchFilters?.search_text?.length > 0
        ? [searchFilters?.search_text]
        : [],
  };

  // Build path-based URL
  const pathParams = buildParamsFromFilters(filterObj);

  // Get language from current URL or default to 'en-tr'
  let base_url = isFeatured
    ? `/${lang}/featured`
    : isFlashDeal
      ? `/${lang}/flashDeals`
      : `/${lang}/filters`;
  if (pathParams.length > 0) {
    return `${base_url}/${pathParams.join("/")}`;
  } else {
    return `${base_url}`;
  }
}
