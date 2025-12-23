"use client";
import NextLink from "components/global/NextLink";
import FilterIcon from "public/svg/listing/filterIcon";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon";
import PriceCancel from "public/svg/listing/PriceCancel";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import BackIcon from "public/svg/listing/backIcon";

import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { useParams } from "next/navigation";
import FilterLabel from "components/ListingPage/filterComponents/FilterLabel";
import search from "services/search";
import { getActiveFilters } from "components/Server/FilterList";
import Image from "next/image";
import Spinner from "components/global/Spinner";
import PriceSlider from "components/ListingPage/filterComponents/PriceSlider";
import { GetImageUrl, parseFiltersFromParams } from "utils/tinyUtils";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { usePathname } from "next/navigation";
import SmoothPolygon from "../ListingPage/filterComponents/PriceShape";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
function FilterWidgetContainer({}) {
  const {
    setSearchResults,
    setSearchWord,
    setFilterEnabled,
    filterEnabled,
    setSearchFilters,
    searchFilters,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [Initialfilters, setInitialfilters] = useState<any>({});
  const params = useParams();
  const pathname = usePathname();
  const { lang, filters: filterParams } = params;
  // @ts-ignore
  const [country, language] = lang.split("-");
  // Parse filters from URL path parameters
  const isRtl = language === "ar" || language === "ku";
  let parsedFilters = filterParams
    ? parseFiltersFromParams(filterParams as string[])
    : {};
  let activeFilters = getActiveFilters(parsedFilters);
  const getSearchFilters = async () => {
    // Get boutique from parsed filters or determine from URL
    let isFeatured = pathname.includes("featured");
    let is_flash = pathname.includes("flashDeals");

    setLoading(true);

    // Build API URL with path-based filters
    if (parsedFilters.prices) {
      parsedFilters = {
        ...parsedFilters,
        prices: parsedFilters.prices?.map((s) =>
          s.split("-").map((d) => Number(d))
        )?.[0],
      };
    }
    if (parsedFilters?.search_text?.length > 0) {
      setSearchWord(
        Array.isArray(parsedFilters.search_text)
          ? parsedFilters?.search_text?.[0]
          : parsedFilters.search_text
      );
    }
    let filters = await getProductsAndFiltersFromElastic({
      country: country,
      language_code: language,
      filters: {
        ...parsedFilters,
        featured: isFeatured,
        flashdeal: is_flash,
        search_text: parsedFilters?.search_text?.[0],
      },
      filters_offset: 1,
      limit: 10,
      noProducts: true,
    });
    setSearchResults({
      categories: filters.categories,
      brands: filters.brands,
      colors: filters.colors,
      prices: filters?.prices && {
        min_price: filters?.prices?.min_price,
        max_price: filters?.prices?.max_price,
      },
      sizes: filters?.attributes?.[0]?.options,
      boutiques: filters.boutiques,
      search_text: Array.isArray(parsedFilters.search_text)
        ? parsedFilters?.search_text?.[0]
        : parsedFilters.search_text,
      products: [],
      prices_ranges: filters?.prices?.priceRanges,
    });
    setInitialfilters({
      categories: filters.categories,
      brands: filters.brands,
      colors: filters.colors,
      prices: filters?.prices && {
        min_price: filters?.prices?.min_price,
        max_price: filters?.prices?.max_price,
      },
      sizes: filters?.attributes?.[0]?.options,
      boutiques: filters.boutiques,
      search_text: parsedFilters?.search_text,
      products: [],
      prices_ranges: filters?.prices?.priceRanges,
    });
    configureActiveFilters({
      categories: filters.categories,
      brands: filters.brands,
      colors: filters.colors,
      prices: filters?.prices && {
        min_price: filters?.prices?.min_price,
        max_price: filters?.prices?.max_price,
      },
      sizes: filters?.attributes?.[0]?.options,
      boutiques: filters.boutiques,
      search_text: Array.isArray(parsedFilters.search_text)
        ? parsedFilters?.search_text?.[0]
        : parsedFilters.search_text,
      products: [],
      prices_ranges: filters?.prices?.priceRanges,
    });
    setLoading(false);
  };
  useEffect(() => {
    if (filterEnabled) getSearchFilters();
  }, [filterEnabled]);
  const configureActiveFilters = (filtersObj?) => {
    let obj = {
      categories: [],
      brands: [],
      sizes: [],
      colors: [],
      prices: {},
      boutiques: [],
    };
    let filters = filtersObj || Initialfilters;
    if (activeFilters?.["categories"] && activeFilters?.categories) {
      activeFilters?.categories?.forEach((c) => {
        if (filters?.categories?.find((filter) => filter.slug === c)) {
          obj.categories.push(
            filters?.categories?.find((filter) => filter.slug === c)
          );
        }
      });
    }
    if (activeFilters?.["brands"] && activeFilters?.brands) {
      activeFilters?.brands?.forEach((b) => {
        if (filters?.brands?.find((filter) => filter.slug === b)) {
          obj.brands.push(filters?.brands?.find((filter) => filter.slug === b));
        }
      });
    }
    if (activeFilters?.["colors"] && activeFilters?.colors) {
      activeFilters?.colors?.forEach((c) => {
        if (filters?.colors?.find((filter) => filter === c)) {
          obj.colors?.push(filters?.colors?.find((filter) => filter === c));
        }
      });
    }
    if (activeFilters?.["sizes"] && activeFilters?.sizes) {
      activeFilters?.sizes?.forEach((s) => {
        if (filters?.sizes?.find((filter) => filter === s)) {
          obj.sizes.push(filters?.sizes?.find((filter) => filter === s));
        }
      });
    }
    if (activeFilters?.["prices"] && activeFilters?.prices) {
      obj.prices = {
        min_price: activeFilters?.prices?.min_price,
        max_price: activeFilters?.prices?.max_price,
      };
    }
    if (activeFilters?.["search_text"] && activeFilters?.search_text) {
      setSearchWord(activeFilters?.search_text);
    }
    if (activeFilters?.["boutiques"] && activeFilters?.boutiques) {
      const currentBoutiqueId = parsedFilters?.boutiques?.[0] || "listing";
      if (currentBoutiqueId === "listing") {
        activeFilters?.boutiques?.forEach((b) => {
          if (filters?.boutiques?.find((filter) => filter.slug === b)) {
            obj.boutiques.push(
              filters?.boutiques?.find((filter) => filter.slug === b)
            );
          }
        });
      }
    }
    const currentBoutiqueId = parsedFilters?.boutiques?.[0] || "listing";
    if (currentBoutiqueId !== "listing") {
      obj.boutiques.push({ slug: currentBoutiqueId?.toString() });
    }
    setSearchFilters(obj);
  };
  const getScreen = () => {
    let screen_name = "";
    let url = window.location.pathname;
    if (url.includes("filters/boutique")) {
      screen_name = GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
    } else if (url.includes("tags_names")) {
      screen_name = GA_GLOBAL_SCREEN.TAGS_SCREEN;
    } else if (url.includes("/filters")) {
      screen_name = GA_GLOBAL_SCREEN.FILTERS_SCREEN;
    } else {
      screen_name = GA_GLOBAL_SCREEN.HOME_SCREEN;
    }
  };
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: getScreen(),
        screen_path: window.location.pathname,
      },
    });
  }, []);
  if (!filterEnabled) return <></>;
  if (loading && filterEnabled)
    return (
      <div className="fixed pt-[20px] overflow-x-hidden bg-white flex-col w-full max-h-[calc(100vh-100px)] h-[calc(100vh-100px)] overflow-y-auto top-[97px] pl-[14px] pr-[20px] left-0 z-[9999999999]">
        <FilterTobBar
          isSearch={false}
          setIsSearch={() => {}}
          Goback={() => {
            document?.documentElement?.style?.setProperty("overflow", "auto");
            setFilterEnabled(false);
          }}
        />
        {Object.keys(searchFilters).map((s) => (
          <div className="flex-col mt-[20px] relative max-w-full" key={s}>
            <div className={`flex ${isRtl ? "flex-row-reverse" : " "}`}>
              {" "}
              <FilterLabel text={`Filter By ${s}`} />
              <span className="ml-[10px]">
                <Spinner />
              </span>
            </div>
            <div className="flex-row align-center justify-start mt-[10px] h-[100px]"></div>
          </div>
        ))}
      </div>
    );
  if (filterEnabled)
    return (
      <FiltersWidget
        configureActiveFilters={() => configureActiveFilters()}
        filters={Initialfilters}
      />
    );
}
export default FilterWidgetContainer;
function FiltersWidget({ filters, configureActiveFilters }) {
  let priceVariable = null;

  const params = useParams();
  const { lang, filters: filterParams } = params;
  const parsedFilters = filterParams
    ? parseFiltersFromParams(filterParams as string[])
    : {};
  const boutiqueId = parsedFilters?.boutiques?.[0] || "listing";
  const {
    filterEnabled,
    currency,
    searchResults,
    setSearchResults,
    loading_search,
    setFilterEnabled,
    setSearchLoading,
    setSearchPartialLoading,
    searchFilters,
    setSearchWord,
    totalProducts,
    resetSearchFilter,
    partialLoading,
    setSearchBoutique,
    value,
    setSearchPrice,
  } = useAppStore();
  const [isSearch, setIsSearch] = useState(false);
  useEffect(() => {
    if (filterEnabled) {
      document?.documentElement?.style?.setProperty("overflow", "hidden");
    } else {
      document?.documentElement?.style?.setProperty("overflow", "auto");
    }
  }, [filterEnabled]);
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  useEffect(() => {
    if (
      boutiqueId !== "listing" &&
      !searchFilters?.boutiques?.find((s) => s.slug === boutiqueId)
    ) {
      setSearchBoutique({ slug: boutiqueId?.toString() });
    }
  }, []);
  if (!filterEnabled) return <></>;
  const resetPrice = async () => {
    setSearchPrice({ min_price: null, max_price: null });
    setSearchResults({
      ...searchResults,
      prices: {
        min_price: filters?.prices?.min_price,
        max_price: filters?.prices?.max_price,
      },
    });
    setSearchPartialLoading(true);
    setSearchLoading(true);
    await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchPartialLoading(false);
    setSearchLoading(false);
  };
  const resetFilters = () => {
    resetSearchFilter();
    console.log(filters);
    setSearchResults({
      categories: filters.categories,
      brands: filters.brands,
      colors: filters.colors,
      prices: filters.prices,
      sizes: filters.sizes,
      boutiques: filters.boutiques,
      search_text: filters.search_text,
      products: [],
    });
    setSearchPrice({
      min_price: filters?.prices?.min_price,
      max_price: filters?.prices?.max_price,
    });
    setSearchResults({
      ...searchResults,
      prices: {
        min_price: filters?.prices?.min_price,
        max_price: filters?.prices?.max_price,
      },
    });
    configureActiveFilters();
    setSearchWord("");
    setIsSearch(false);
  };
  const showButton = () => {
    return (
      (totalProducts !== null &&
        (searchFilters?.categories?.length > 0 ||
          searchFilters?.brands?.length > 0 ||
          searchFilters?.colors?.length > 0 ||
          searchFilters?.sizes?.length > 0 ||
          (searchFilters?.prices?.min_price &&
            searchFilters?.prices?.min_price !== null) ||
          (searchFilters?.prices?.max_price &&
            searchFilters?.prices?.max_price !== null))) ||
      value?.length > 0
    );
  };
  return (
    <>
      <div className="fixed pb-[100px] pt-[20px] overflow-x-hidden bg-white flex-col w-full max-h-[calc(100vh-100px)] h-[calc(100vh-100px)] overflow-y-auto top-[97px] pl-[14px] pr-[20px] left-0 z-[999999999]">
        <FilterTobBar
          isSearch={isSearch}
          setIsSearch={setIsSearch}
          Goback={() => {
            resetFilters();
          }}
        />

        {Object?.keys(searchResults).map((key) => {
          if (
            key !== "search_text" &&
            key !== "boutiques" &&
            key !== "products" &&
            key !== "prices_ranges" &&
            searchResults?.[key]?.length > 0
          )
            return (
              <div className="flex-col mt-[20px] relative max-w-full" key={key}>
                <div className={`flex ${isRtl ? "flex-row-reverse" : " "}`}>
                  {" "}
                  <FilterLabel text={`Filter By ${key}`} />
                  {loading_search && (
                    <span className="ml-[10px]">
                      <Spinner />
                    </span>
                  )}
                </div>
                <ShowFilterRow term={key} values={searchResults[key]} />
              </div>
            );
        })}
        {searchResults?.prices?.max_price &&
          searchResults?.prices?.min_price &&
          searchResults?.prices?.max_price > 0 &&
          searchResults?.prices?.min_price >= 0 && (
            <div
              className={`flex-col justify-start ${
                isRtl ? "items-end" : "items-start"
              } filter-container relative w-full mt-[10px] pb-6`}
              key={`prices-container`}
            >
              <PriceCancel
                className="absolute top-[30px] right-[32px]"
                onClick={() => {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.RESET_PRICE,
                  // });
                  resetPrice();
                }}
              />
              <div className={`flex ${isRtl ? "flex-row-reverse" : " "}`}>
                {" "}
                <FilterLabel text={`Filter By Prices`} />
                {loading_search && (
                  <span className="ml-[10px]">
                    <Spinner />
                  </span>
                )}
              </div>
              <div className="price-min-max flex-row z-20">
                {searchFilters?.prices?.min_price >= 0 && (
                  <div className="price-min">
                    Min{" "}
                    {RoundPrice({
                      num:
                        searchFilters.prices?.min_price ||
                        searchResults?.prices?.min_price,
                      rate: currency?.exchange_rate,
                      language: language,
                    })}{" "}
                    <span>{currency?.symbol}</span>
                  </div>
                )}
                {searchFilters?.prices?.max_price >= 0 && (
                  <div className="price-max">
                    Max{" "}
                    {RoundPrice({
                      num:
                        searchFilters.prices?.max_price ||
                        searchResults?.prices?.max_price,
                      rate: currency?.exchange_rate,
                      language: language,
                    })}{" "}
                    <span>{currency?.symbol}</span>
                  </div>
                )}
              </div>
              <PriceSlider />
              <SmoothPolygon
                data={
                  searchResults?.prices_ranges?.map((s) => ({
                    count: s.products_count,
                    mon: s.min_price,
                    max: s.max_price,
                  })) || []
                }
              />
            </div>
          )}
      </div>
      <div
        className=" fixed px-[10px] z-[99999999] mx-auto left-0 right-0 bottom-[50px] flex-row w-full mt-3 justify-center"
        data-cy="searchResult"
      >
        {showButton() &&
          (totalProducts !== null && totalProducts > 0 ? (
            <div
              className="w-auto flex"
              onClick={() => {
                document?.documentElement?.style?.setProperty(
                  "overflow",
                  "auto"
                );
                setFilterEnabled(false);
                resetFilters();
              }}
            >
              <NextLink
                href={search.getSearchPageUrl({ lang: lang })}
                data={{
                  is_filter: true,
                }}
                aria-disabled={partialLoading || loading_search}
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
                data-cy="searchTotalProduct"
              >
                {translateFunction("Search")}{" "}
                {partialLoading || loading_search ? (
                  <span className="ml-2">
                    <Spinner className="" />
                  </span>
                ) : (
                  <>
                    {totalProducts !== null && (
                      <span
                        className="text-[#fafafa] regular ml-2"
                        data-cy="countAfterFilter"
                      >
                        ({translateFunction("Total Products:")} {totalProducts})
                      </span>
                    )}
                  </>
                )}
              </NextLink>
            </div>
          ) : (
            <></>
          ))}
        {showButton() && (
          <div
            className="w-16 h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
            data-cy="reset-filter-button"
            onClick={() => resetFilters()}
          >
            {translateFunction("Reset")}
          </div>
        )}
      </div>
    </>
  );
}

const FilterTobBar = ({ isSearch, setIsSearch, Goback }) => {
  const params = useParams();
  const { lang, filters: filterParams } = params;

  // Parse current filters from URL path
  const currentFilters = filterParams
    ? parseFiltersFromParams(filterParams as string[])
    : {};

  const { filterEnabled, setFilterEnabled, language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="justify-between fil flex-row align-center h-[50px]">
      <div
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
        onClick={() => {
          // Sendevent({
          //   event: GA_EVENT_NAMES.CLICK,
          //   value: GA_CLICK_EVENT_VALUES.CLOSE_FILTERS_WIDGET,
          // });
          document?.documentElement?.style?.setProperty("overflow", "auto");
          Goback();
          setFilterEnabled(false);
        }}
      >
        <BackIcon />
      </div>
      <div
        className={`filter-bar-options gap-[10px] justify-between ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  align-center `}
      >
        <div className="filter-option w-[20px]" data-cy="settingsIcon">
          <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
        </div>
        <div
          className="filter-option w-[20px]"
          data-cy="close-filter-widget-button"
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CLOSE_FILTERS_WIDGET,
            // });
            document?.documentElement?.style?.setProperty("overflow", "auto");
            setFilterEnabled(false);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16.411"
            height="16.411"
            viewBox="0 0 16.411 16.411"
          >
            <g
              id="Group_10735"
              data-name="Group 10735"
              transform="translate(-1293.141 -97.641)"
            >
              <line
                id="Line_792"
                data-name="Line 792"
                x2="20.848"
                transform="matrix(0.695, -0.719, 0.719, 0.695, 1294.105, 113.345)"
                fill="none"
                stroke="#ff5f61"
                strokeLinecap="round"
                strokeWidth="1"
              />
              <line
                id="Line_793"
                data-name="Line 793"
                x2="20.848"
                transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
                fill="none"
                stroke="#ff5f61"
                strokeLinecap="round"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
const ShowFilterRow = ({ term, values }) => {
  const { lang } = useParams();
  // @ts-ignore
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const {
    setSearchPartialLoading,
    setSearchLoading,
    setSearchBrand,
    setSearchColor,
    setSearchCategory,
    setSearchSize,
    searchFilters,
  } = useAppStore();
  const updateFiltersApi = async () => {
    setSearchPartialLoading(true);
    setSearchLoading(true);
    await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchPartialLoading(false);
    setSearchLoading(false);
  };
  const handleFilterClick = (value) => {
    if (term === "brands") {
      setSearchBrand(value);
    } else if (term === "colors") {
      setSearchColor(value);
    } else if (term === "categories") {
      setSearchCategory(value);
    } else if (term === "sizes") {
      setSearchSize(value);
    }
  };
  const getImage = (value) => {
    if (value.most_viewed_product_thumbnail) {
      return getConfiguredImage({
        src: GetImageUrl(value.most_viewed_product_thumbnail),
        height: 50,
      });
    } else if (value.flat_photo_path) {
      return getConfiguredImage({
        src: GetImageUrl(value.flat_photo_path.file_path),
        height: 50,
      });
    } else if (value.icon) {
      return getConfiguredImage({ src: GetImageUrl(value.icon), height: 50 });
    }
  };
  const isActive = (value) => {
    if (term === "colors") {
      return searchFilters.colors.includes(value);
    } else if (term === "sizes") {
      return searchFilters.sizes.includes(value);
    } else if (term === "categories") {
      return searchFilters?.categories.find((c) => c.slug === value?.slug);
    } else if (term === "brands") {
      return searchFilters?.brands.find((b) => b.slug === value?.slug);
    }
  };

  return (
    <HortiznalScrollBar
      className={`flex-row align-center justify-start mt-[10px]  ${
        isRtl ? "flex-row-reverse" : " "
      }`}
      id={`filter-${term}-row`}
    >
      {values.map((value, index) => {
        return (
          <div
            key={`${term}-${index}`}
            className="flex-col cursor-pointer  ml-[10px] items-center justify-start relative min-w-[70px] w-auto h-[100px] min-h-[100px]"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
              //   extra: {
              //     filter: term,
              //     value: value,
              //   },
              // });
              handleFilterClick(value);
              updateFiltersApi();
            }}
            data-cy={`${term}-filter-item`}
          >
            {isActive(value) && (
              <ActiveCategoryIcon className="absolute left-0 top-[0px]" />
            )}
            {getImage(value) ? (
              <Image
                className="rounded-full min-w-[70px] min-h-[70px]  max-h-[70px]"
                style={{
                  boxShadow: "0px 3px 3px #0000001A",
                  border: isActive(value) ? "1px solid #FF5F61" : "none",
                }}
                src={getImage(value)}
                alt={value.name || "Image"}
                width={70}
                height={70}
              />
            ) : (
              <div
                className={`w-[70px] h-[70px]  min-w-[70px] min-h-[70px] ${
                  term === "colors" ? `` : "bg-[#fff]"
                } rounded-full flex-row align-center justify-center  ${
                  isRtl ? "flex-row-reverse" : " "
                }`}
                style={{
                  backgroundColor: term === "colors" ? value : "",
                  boxShadow: "0px 3px 3px #0000001A",
                  border: isActive(value) ? "1px solid #FF5F61" : "none",
                }}
              >
                {term !== "colors" && (
                  <span
                    className="text-[#5D5C5D] text-[15px] medium"
                    style={{
                      fontSize:
                        (value?.name || value)?.length < 6 ? "15px" : "10px",
                    }}
                  >
                    {value?.name || value}
                  </span>
                )}
              </div>
            )}
            {term !== "colors" && term !== "sizes" && (
              <div className="text-[12px] mt-[4px] text-[#8E8E8E] regular whitespace-nowrap ">
                {value?.name || value}
              </div>
            )}
          </div>
        );
      })}
    </HortiznalScrollBar>
  );
};
