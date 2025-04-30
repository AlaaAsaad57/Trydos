"use client";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import NextLink from "components/global/NextLink";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import PriceCancel from "public/svg/listing/PriceCancel.svg";

import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import BackIcon from "public/svg/listing/backIcon.svg";
import { DebounceInput } from "node_modules/react-debounce-input/src";
import { Sendevent, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import FilterLabel from "components/ListingPage/filterComponents/FilterLabel";
import search from "services/search";
// import { getActiveFilters } from "components/Server/FilterList";
import Image from "node_modules/next/image";
import Spinner from "components/global/Spinner";
import PriceSlider from "components/ListingPage/filterComponents/PriceSlider";
import dynamic from "next/dynamic";

const PriceChart = dynamic(
  () => import("components/ListingPage/filterComponents/PriceChart"),
  {
    ssr: false,
  }
);
function FilterWidgetContainer() {
  return <FiltersWidget />;
}
export default FilterWidgetContainer;
function FiltersWidget() {
  const getInitialData = async () => {
    setSearchLoading(true);
    setSearchPartialLoading(true);
    const response = await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchLoading(false);
    setSearchPartialLoading(false);
  };
  useEffect(() => {
    getInitialData();
  }, []);
  // let activeFilters = getActiveFilters(searchParams);
  const { lang } = useParams();
  const {
    filterEnabled,
    currency,
    searchResults,
    setSearchResults,
    loading_search,
    setSearchPrice,
    setSearchLoading,
    setSearchPartialLoading,
    searchFilters,
    setSearchWord,
    totalProducts,
    resetSearchFilter,
    partialLoading,
    value,
  } = useAppStore();
  const [isSearch, setIsSearch] = useState(false);
  useEffect(() => {
    if (filterEnabled) {
      document?.documentElement?.style?.setProperty("overflow", "hidden");
    } else {
      document?.documentElement?.style?.setProperty("overflow", "auto");
    }
  }, [filterEnabled]);

  if (!filterEnabled) return <></>;
  const resetPrice = async () => {
    setSearchPrice({
      min_price: null,
      max_price: null,
    });
    setSearchResults({
      ...searchResults,
      prices: {
        min_price: searchResults?.prices?.min_price,
        max_price: searchResults?.prices?.max_price,
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
    getInitialData();
    setSearchWord("");
    setIsSearch(false);
  };
  const showButton = () => {
    return (
      (totalProducts !== null &&
        totalProducts > 0 &&
        (searchFilters?.categories?.length > 0 ||
          searchFilters?.brands?.length > 0 ||
          searchFilters?.colors?.length > 0 ||
          searchFilters?.sizes?.length > 0 ||
          searchFilters?.prices?.min_price !== null ||
          searchFilters?.prices?.max_price !== null)) ||
      value?.length > 0
    );
  };
  return (
    <div className="fixed bg-white flex-col w-full max-h-[calc(100vh-100px)] h-[calc(100vh-100px)] overflow-y-auto top-[97px] pl-[14px] pr-[20px] left-0 z-[9999999]">
      <FilterTobBar
        isSearch={isSearch}
        setIsSearch={setIsSearch}
        Goback={() => {
          resetFilters();
        }}
      />

      {searchResults &&
        Object?.keys(searchResults).map((key) => {
          if (
            key !== "search_text" &&
            key !== "boutiques" &&
            key !== "products" &&
            key !== "prices_ranges" &&
            searchResults?.[key]?.length > 0
          )
            return (
              <div className="flex-col mt-[20px] relative" key={key}>
                <div className="flex">
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
            className="flex-col justify-start align-start filter-container relative w-full mt-[10px] pb-6"
            key={`prices-container}`}
          >
            <PriceCancel
              className="price-cancel-icon"
              onClick={() => {
                resetPrice();
              }}
            />
            <div className="flex">
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
                  {(searchFilters.prices?.min_price ||
                    searchResults?.prices?.min_price) *
                    currency?.exchange_rate}{" "}
                  <span>{currency?.symbol}</span>
                </div>
              )}
              {searchFilters?.prices?.max_price >= 0 && (
                <div className="price-max">
                  Max{" "}
                  {(searchFilters.prices?.max_price ||
                    searchResults?.prices?.max_price) *
                    currency?.exchange_rate}{" "}
                  <span>{currency?.symbol}</span>
                </div>
              )}
            </div>
            <PriceSlider />
            <PriceChart
              points={
                searchResults?.prices_ranges?.map((s) => s.products_count) || [
                  0,
                ]
              }
            />
          </div>
        )}
      <div
        className="flex-row w-full mt-3 justify-center"
        data-cy="searchResult"
      >
        {showButton() &&
          (totalProducts !== null && totalProducts > 0 ? (
            <NextLink
              href={search.getSearchPageUrl()}
              data={{
                is_boutique: true,
                href: search.getSearchPageUrl(),
              }}
              aria-disabled={partialLoading || loading_search}
              className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
              data-cy="searchTotalProduct"
              onClick={() => {
                //   apply();
              }}
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
          ) : (
            <></>
          ))}
        {showButton() && (
          <div
            className="w-16 h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
            data-cy="resetIcon"
            onClick={() => resetFilters()}
          >
            {translateFunction("Reset")}
          </div>
        )}
      </div>
    </div>
  );
}

const FilterTobBar = ({ isSearch, setIsSearch, Goback }) => {
  const { lang } = useParams();
  const {
    filterEnabled,
    setFilterEnabled,
    value,
    setSearchWord,
    setSearchPartialLoading,
    setSearchLoading,
  } = useAppStore();
  const handleInputChange = async (e) => {
    setSearchWord(e?.target.value);
    setIsSearch(true);
    setSearchPartialLoading(true);
    setSearchLoading(true);
    await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchPartialLoading(false);
    setSearchLoading(false);
  };

  return (
    <div className="justify-between fil flex-row align-center h-[50px]">
      <div
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
        onClick={() => {
          Goback();
          setFilterEnabled(false);
        }}
      >
        <BackIcon />
      </div>
      <div
        className={`filter-bar-options flex-row align-center ${
          isSearch || value?.length > 0 ? "w-full" : "w-[95px] "
        }`}
      >
        <div
          id="searchIconBoutique"
          className={`filter-option w-[20px] transition-all filter-search-option relative ${
            isSearch &&
            "w-[90%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
          }`}
          data-cy="searchIcon_boutiquePage"
          onClick={() => {
            Sendevent({
              event: "button_clicked",
              value: "open_search_field_button",
            });
            document
              .querySelector<HTMLInputElement>("#filter-search-input")
              ?.focus();
            setIsSearch(true);
          }}
        >
          <DebounceInput
            data-cy="inputFiled"
            id="filter-search-input"
            debounceTimeout={600}
            onFocus={() => {
              document
                .querySelector<HTMLInputElement>(".filter-bar-options")
                .classList.add("w-full");
            }}
            value={value}
            onBlur={() => {
              if (value?.length === 0) {
                setIsSearch(false);
              }
            }}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              //@ts-ignore
              if (e.keyCode == 13) {
              }
            }}
            className={`${
              isSearch && "pl-[40px]"
            } rounded-[15px]  w-0 h-full border-0 outline-none text-[#5d5d5d]`}
          />
          <SearchIcon
            className={`absolute z-10 ${
              isSearch ? "top-[9px] left-[14px]" : "top-0 left-0"
            }`}
          />
        </div>
        <div className="filter-option w-[20px]" data-cy="settingsIcon">
          <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
        </div>
        <div
          className="filter-option w-[20px]"
          onClick={() => {
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
                stroke-width="1"
              />
              <line
                id="Line_793"
                data-name="Line 793"
                x2="20.848"
                transform="matrix(0.719, 0.695, -0.695, 0.719, 1293.849, 98.605)"
                fill="none"
                stroke="#ff5f61"
                strokeLinecap="round"
                stroke-width="1"
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
      return value.most_viewed_product_thumbnail.file_path?.replace(
        "/upload",
        "/upload/w_50,h_50,c_fit/f_avif/q_100"
      );
    } else if (value.flat_photo_path) {
      return value.flat_photo_path.file_path?.replace(
        "/upload",
        "/upload/w_50,h_50,c_fit/f_avif/q_100"
      );
    } else if (value.icon) {
      return value.icon.file_path?.replace(
        "/upload",
        "/upload/w_50,h_50,c_fit/f_avif/q_100"
      );
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
    <div className="flex-row align-center justify-start mt-[10px]">
      {values.map((value, index) => {
        return (
          <div
            key={`${term}-${index}`}
            className="flex-col cursor-pointer  ml-[10px] items-center justify-start relative min-w-[70px] w-auto h-[100px] min-h-[100px]"
            onClick={() => {
              handleFilterClick(value);
              updateFiltersApi();
            }}
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
                alt={value.name}
                width={70}
                height={70}
              />
            ) : (
              <div
                className={`w-[70px] h-[70px]  min-w-[70px] min-h-[70px] ${
                  term === "colors" ? `` : "bg-[#fff]"
                } rounded-full flex-row align-center justify-center`}
                style={{
                  backgroundColor: term === "colors" ? value : "",
                  boxShadow: "0px 3px 3px #0000001A",
                  border: isActive(value) ? "1px solid #FF5F61" : "none",
                }}
              >
                {term !== "colors" && (
                  <span className="text-[#5D5C5D] text-[15px] medium">
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
    </div>
  );
};
