"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import FiltersRowContainer from "./FiltersRowContainer";
import { EnableScroll } from "utils/tinyUtils";

import { GetFilters } from "serverRequests/listing";
import { PriceSliderComponent } from "./PriceSliderComponent";
import { RoundPrice, translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import SmoothPolygon from "../PriceShape";
import FiltersButton from "./FiltersButton";

function FiltersWindow({
  initialFilters,
  children,
  language,
  country,
  currency,
  isFeatured,
  isFlashDeal,
}) {
  const { filterEnabled, setFilterEnabled } = useAppStore();
  if (filterEnabled) {
    return (
      <FiltersWindowUI
        country={country}
        initialFilters={initialFilters}
        currency={currency}
        language={language}
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
      >
        {children}
      </FiltersWindowUI>
    );
  }
}

export default FiltersWindow;

const FiltersWindowUI = ({
  initialFilters,
  children,
  language,
  country,
  currency,
  isFeatured,
  isFlashDeal,
}) => {
  const { filterEnabled, setFilterEnabled } = useAppStore();
  const [FiltersNodes, setFiltersNodes] = useState(children);
  const [showChart, setShowChart] = useState(false);
  let InitialFiltersObject = {
    categories: initialFilters?.categories ?? [],
    brands: initialFilters?.brands ?? [],
    sizes: initialFilters?.sizes ?? [],
    prices: initialFilters?.prices ?? [],
    boutiques: initialFilters?.boutiques ?? [],
    colors: initialFilters?.colors ?? [],
    search_text: initialFilters?.search_text ?? "",
    tags_names: initialFilters?.tags_names ?? [],
    featured: initialFilters?.featured ?? false,
    flashdeal: initialFilters?.flashdeal ?? false,
  };
  const [filters, setFilter] = useState<{
    categories?: string[];
    brands?: string[];
    boutiques?: string[];
    colors?: string[];
    sizes?: string[];
    search_text?: string;
    prices?: number[];
    tags_names?: string[];
    featured?: boolean;
    flashdeal?: boolean;
  }>(InitialFiltersObject);

  const isRtl = language === "ar" || language === "ku";
  const [loading, setLoading] = useState(false);

  const isFirstMount = useRef(true);

  const UpdateFilters = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      let response = await GetFilters({
        country,
        language,
        filters,
        filter_offset: 1,
      });
      console.log(response, filters);
      setFiltersNodes({
        categories: response?.categories,
        brands: response?.brands,
        colors: response?.colors,
        sizes: response?.sizes,
        prices: response?.prices,
        total_size: response?.total_size,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters, country, language]);

  // 2. The Debounced Effect with a mount check

  // 2. The Debounced Effect
  useEffect(() => {
    console.log(isFirstMount.current);
    // If it's the first time, just flip the flag and skip
    if (isFirstMount.current) {
      isFirstMount.current = false; // We have now finished the first mount
      return;
    }

    // Now, this will run on EVERY change to 'filters' after the initial render
    const timer = setTimeout(() => {
      UpdateFilters();
    }, 400);

    return () => clearTimeout(timer);
  }, [filters, UpdateFilters]);
  useEffect(() => {
    setTimeout(() => {
      setShowChart(true);
    }, 400);
  }, []);
  if (!filterEnabled) {
    isFirstMount.current = true;
    return null;
  }

  const resetSelection = () => {
    setFilter(InitialFiltersObject);
  };

  return (
    <div className="fixed pt-[20px] gap-[10px] overflow-x-hidden bg-white flex-col w-full max-h-[calc(100vh-100px)] h-[calc(100vh-100px)] overflow-y-hidden top-[97px]   left-0 z-[9999999999]">
      <div className="justify-between fil flex-row align-center h-[50px] flex-shrink-0 pl-[15px] pr-[25px]">
        <div
          data-cy="backIcon_productPage"
          className={`back-icon flex-row`}
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.CLOSE_FILTERS_WIDGET,
            // });
            EnableScroll();

            setFilterEnabled(false);
          }}
        >
          <img src="/icons/backIcon.svg" />
        </div>
        <div
          className={`filter-bar-options gap-[20px] justify-between ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }  align-center `}
        >
          <div className="filter-option w-[20px]" data-cy="settingsIcon">
            <img
              src="/icons/filterIcon.svg"
              className={`${filterEnabled && "filter-icon-enabled"}`}
            />
          </div>
          <div
            className="filter-option w-[20px]"
            data-cy="close-filter-widget-button"
            onClick={() => {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.CLOSE_FILTERS_WIDGET,
              // });
              EnableScroll();
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
      <div className="flex flex-col items-start gap-[20px] overflow-y-auto max-h-full pb-[120px] px-[25px]">
        {FiltersNodes?.categories && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setFilter({ ...filters, categories: e });
            }}
            term={"categories"}
            values={filters.categories ?? []}
          >
            {FiltersNodes.categories}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.brands && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setFilter({ ...filters, brands: e });
            }}
            term={"brands"}
            values={filters.brands ?? []}
          >
            {FiltersNodes.brands}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.colors && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              let newValue = e.map((s) => s.replace("#", ""));
              setFilter({ ...filters, colors: newValue });
            }}
            term={"colors"}
            values={filters.colors ?? []}
          >
            {FiltersNodes.colors}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.sizes && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setFilter({ ...filters, sizes: e });
            }}
            term={"sizes"}
            values={filters.sizes ?? []}
          >
            {FiltersNodes.sizes}
          </FiltersRowContainer>
        )}

        {FiltersNodes.prices && (
          <>
            <div
              className={`flex-col justify-start ${
                isRtl ? "items-end" : "items-start"
              }${
                loading && "opacity-80"
              } filter-container relative w-full mt-[10px] pb-6`}
              key={`prices-container`}
            >
              <img
                src="/icons/PriceCancel.svg"
                className="absolute top-[30px] right-[32px]"
                onClick={() => {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.RESET_PRICE,
                  // });
                  //   resetPrice();
                }}
              />
              <div
                className={`filter-label flex-row justify-start align-center m-0`}
              >
                <img src="/icons/ActiveCategoryIcon.svg" />
                <div className="filter-label-text">
                  {translateFunction("Filter By Prices")}
                </div>
                <img
                  src="/icons/FilterInfoIcon.svg"
                  className="filter-info-icon"
                />
                {loading && (
                  <span className="ml-2">
                    <Spinner />
                  </span>
                )}
              </div>
              <div className="price-min-max flex-row z-20">
                {filters?.prices?.length && filters?.prices?.[0] >= 0 && (
                  <div className="price-min">
                    Min{" "}
                    {RoundPrice({
                      num: filters.prices?.[0] || filters?.prices?.[0],
                      rate: currency?.exchange_rate,
                      language: language,
                    })}{" "}
                    <span>{currency?.symbol}</span>
                  </div>
                )}
                {filters?.prices?.[1] >= 0 && (
                  <div className="price-max">
                    Max{" "}
                    {RoundPrice({
                      num: filters.prices?.[1] || filters?.prices?.[1],
                      rate: currency?.exchange_rate,
                      language: language,
                    })}{" "}
                    <span>{currency?.symbol}</span>
                  </div>
                )}
              </div>
              <div
                className="price-slider-container mt-10 w-full pr-9 pl-5 z-10"
                data-cy="slider"
              >
                <PriceSliderComponent
                  symbol={currency?.symbol}
                  roundPrice={(num) =>
                    RoundPrice({
                      num: num,
                      language: language,
                      returnNumber: true,
                    })
                  }
                  initialMax={
                    filters.prices?.[1] >= 0
                      ? filters.prices?.[1]
                      : FiltersNodes?.prices?.max_price
                  }
                  initialMin={
                    filters.prices?.[0] >= 0
                      ? filters.prices?.[0]
                      : FiltersNodes?.prices?.min_price
                  }
                  min={filters.prices?.[0] ?? FiltersNodes?.prices?.min_price}
                  points={currency?.decimal_digits}
                  max={filters.prices?.[1] ?? FiltersNodes?.prices?.max_price}
                  onChange={(min, max) => {
                    if (!loading) setFilter({ ...filters, prices: [min, max] });
                  }}
                />
              </div>

              {showChart && (
                <SmoothPolygon
                  data={
                    FiltersNodes?.prices?.priceRanges?.map((s) => ({
                      count: s.products_count,
                      mon: s.min_price,
                      max: s.max_price,
                    })) || []
                  }
                />
              )}
            </div>
          </>
        )}
      </div>

      <FiltersButton
        isFlashDeal={isFlashDeal}
        loading={loading}
        isFeatured={isFeatured}
        onReset={resetSelection}
        total_size={FiltersNodes.total_size}
        filters={filters}
        isChanged={
          JSON.stringify(filters) !== JSON.stringify(InitialFiltersObject)
        }
      />
    </div>
  );
};
