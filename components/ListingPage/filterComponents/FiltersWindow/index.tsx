"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "store";
import FiltersRowContainer from "./FiltersRowContainer";
import CategoryImageCircel from "./CategoryImageCircel";
import ImageCircel from "./ImageCircel";
import { EnableScroll } from "utils/tinyUtils";
import { HandleIsActive } from "utils/server/helpers";

import { GetFilters } from "serverRequests/listing";
import { PriceSliderComponent } from "./PriceSliderComponent";
import { LogError, RoundPrice, translateFunction } from "utils/functions";
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
  serverSearch = "",
}) {
  const filterEnabled = useAppStore((s) => s.filterEnabled);
  const setFilterEnabled = useAppStore((s) => s.setFilterEnabled);
  if (filterEnabled) {
    return (
      <FiltersWindowUI
        country={country}
        initialFilters={initialFilters}
        currency={currency}
        language={language}
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
        serverSearch={serverSearch}
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
  serverSearch = "",
}) => {
  const filterEnabled = useAppStore((s) => s.filterEnabled);
  const setFilterEnabled = useAppStore((s) => s.setFilterEnabled);
  const searchParams = useSearchParams();
  const liveSearch = searchParams.get("search") || "";
  const [FiltersNodes, setFiltersNodes] = useState(children);
  const [showChart, setShowChart] = useState(false);

  // Stabilized so identity only changes when `initialFilters` itself changes —
  // keeps the dirty-check comparison and effect deps from recomputing every render.
  const initialSelectedChips = useMemo(
    () => ({
      categories: [...new Set([...(initialFilters?.categories ?? [])])],
      brands: initialFilters?.brands ?? [],
      sizes: initialFilters?.sizes ?? [],
      boutiques: initialFilters?.boutiques ?? [],
      colors: initialFilters?.colors ?? [],
      search_text:
        liveSearch || serverSearch || initialFilters?.search_text?.[0] || "",
      tags_names: initialFilters?.tags_names ?? [],
      featured: initialFilters?.featured ?? false,
      flashdeal: initialFilters?.flashdeal ?? false,
    }),
    [initialFilters, liveSearch, serverSearch],
  );
  const initialPriceRange = useMemo(
    () => initialFilters?.prices ?? [],
    [initialFilters],
  );

  // Chip selections (categories/brands/colors/sizes/etc.) and the price range
  // are kept as distinct state so toggling a chip doesn't touch price state
  // (and dragging the price slider doesn't touch chip state) — each region of
  // the UI only reads the slice it depends on.
  const [selectedChips, setSelectedChips] = useState<{
    categories?: string[];
    brands?: string[];
    boutiques?: string[];
    colors?: string[];
    sizes?: string[];
    search_text?: string;
    tags_names?: string[];
    featured?: boolean;
    flashdeal?: boolean;
  }>(initialSelectedChips);
  const [priceRange, setPriceRange] = useState<number[]>(initialPriceRange);

  const isRtl = language === "ar" || language === "ku";
  const [loading, setLoading] = useState(false);

  // GetFilters (and the initial `children` seeded from FilterWidgetServer) now
  // return raw data arrays — chips are always rendered here as client
  // components (props mirror the old server-side GetFilters exactly).
  const renderCategoryChips = (items) =>
    items?.map((item) => (
      <CategoryImageCircel
        key={item?.slug}
        isActive={HandleIsActive({
          values: selectedChips.categories,
          item: item?.slug,
        })}
        name={item?.name}
        term={"Category"}
        value={item?.slug}
        image={item?.most_viewed_product_thumbnail}
        childes={item?.childes}
        values={selectedChips.categories}
        isRtl={isRtl}
      />
    ));

  const renderBrandChips = (items) =>
    items?.map((brand) => (
      <ImageCircel
        key={brand?.slug}
        isActive={HandleIsActive({
          values: selectedChips.brands,
          item: brand?.slug,
        })}
        name={brand?.name}
        term={"Category"}
        value={brand?.slug}
        image={brand?.icon}
      />
    ));

  const renderColorChips = (items) =>
    items?.map((color) => (
      <ImageCircel
        key={color}
        isActive={HandleIsActive({
          values: selectedChips?.colors?.map((s) => s?.replace("#", "")),
          item: color.replace("#", ""),
        })}
        color={color}
        name={color}
        value={color}
        term={"Color"}
      />
    ));

  const renderSizeChips = (items) =>
    items?.map((size) => (
      <ImageCircel
        key={size}
        isActive={HandleIsActive({
          values: selectedChips?.sizes,
          item: size,
        })}
        name={size}
        value={size}
        term={"Size"}
      />
    ));

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (!filterEnabled) return;
    setSelectedChips(initialSelectedChips);
    setPriceRange(initialPriceRange);
    setFiltersNodes(children);
  }, [filterEnabled, initialFilters, initialSelectedChips, initialPriceRange, children]);

  const UpdateFilters = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      let response = await GetFilters({
        country,
        language,
        filters: { ...selectedChips, prices: priceRange },
        filter_offset: 1,
      });

      setFiltersNodes({
        categories: response?.categories,
        brands: response?.brands,
        colors: response?.colors,
        sizes: response?.sizes,
        prices: response?.prices,
        total_size: response?.total_size,
      });
    } catch (error) {
      LogError({
        error: error,
        scenario: "Update Filters in FiltersWindow",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChips, priceRange, country, language]);

  // 2. The Debounced Effect with a mount check

  // 2. The Debounced Effect
  useEffect(() => {
    // If it's the first time, just flip the flag and skip
    if (isFirstMount.current) {
      isFirstMount.current = false; // We have now finished the first mount
      return;
    }

    // Runs on EVERY change to either the chip selection or the price range
    // after the initial render.
    const timer = setTimeout(() => {
      UpdateFilters();
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedChips, priceRange, UpdateFilters]);
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
    setSelectedChips(initialSelectedChips);
    setPriceRange(initialPriceRange);
  };

  // Combined filters object, derived only where a combined shape is actually
  // needed (dirty-check, apply/search URL) — not read by the individual
  // chip-row / price-section JSX below, so those regions stay decoupled.
  const isChanged =
    JSON.stringify(selectedChips) !== JSON.stringify(initialSelectedChips) ||
    JSON.stringify(priceRange) !== JSON.stringify(initialPriceRange);

  return (
    <div className="fixed mx-auto right-0 max-w-[1366px] pt-[20px] gap-[10px] overflow-x-hidden bg-white flex-col w-full max-h-[calc(100vh-100px)] h-[calc(100vh-100px)] overflow-y-hidden top-[97px]   left-0 z-9999999999">
      <div className="justify-between fil flex-row align-center h-[50px] shrink-0 pl-[15px] pr-[25px]">
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
        {FiltersNodes?.categories?.length > 0 && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setSelectedChips((prev) => ({ ...prev, categories: e }));
            }}
            term={"categories"}
            values={selectedChips.categories ?? []}
          >
            {renderCategoryChips(FiltersNodes.categories)}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.brands?.length > 0 && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setSelectedChips((prev) => ({ ...prev, brands: e }));
            }}
            term={"brands"}
            values={selectedChips.brands ?? []}
          >
            {renderBrandChips(FiltersNodes.brands)}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.colors?.length > 0 && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              let newValue = e.map((s) => s.replace("#", ""));
              setSelectedChips((prev) => ({ ...prev, colors: newValue }));
            }}
            term={"colors"}
            values={selectedChips.colors ?? []}
          >
            {renderColorChips(FiltersNodes.colors)}
          </FiltersRowContainer>
        )}
        {FiltersNodes?.sizes?.length > 0 && (
          <FiltersRowContainer
            loading={loading}
            setValues={(e) => {
              setSelectedChips((prev) => ({ ...prev, sizes: e }));
            }}
            term={"sizes"}
            values={selectedChips.sizes ?? []}
          >
            {renderSizeChips(FiltersNodes.sizes)}
          </FiltersRowContainer>
        )}

        {FiltersNodes.prices &&
          (FiltersNodes.total_size > 1 ||
            (FiltersNodes.prices?.total ?? 0) > 1) && (
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
                  if (loading) return;
                  // Price-only reset: clear just the price selection (keep all
                  // other active filters). The debounced re-fetch then re-scopes
                  // the facet to those filters, so the slider/curve/cards return
                  // to the active-filters range (e.g. the category's full range).
                  setPriceRange([]);
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
                {priceRange?.length && priceRange?.[0] >= 0 && (
                  <div className="price-min">
                    {translateFunction("Min")}{" "}
                    {RoundPrice({
                      num: priceRange?.[0] || priceRange?.[0],
                      rate: currency?.exchange_rate,
                      language: language,
                    })}{" "}
                    <span>{currency?.symbol}</span>
                  </div>
                )}
                {priceRange?.[1] >= 0 && (
                  <div className="price-max">
                    {translateFunction("Max")}{" "}
                    {RoundPrice({
                      num: priceRange?.[1] || priceRange?.[1],
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
                    priceRange?.[1] >= 0
                      ? priceRange?.[1]
                      : FiltersNodes?.prices?.max_price
                  }
                  initialMin={
                    priceRange?.[0] >= 0
                      ? priceRange?.[0]
                      : FiltersNodes?.prices?.min_price
                  }
                  // Slider BOUNDS come from the (self-excluding) facet so the
                  // track always spans the full data range and stays widenable;
                  // the selection (priceRange) only positions the thumbs via
                  // initialMin/initialMax above.
                  min={FiltersNodes?.prices?.min_price ?? priceRange?.[0]}
                  points={currency?.decimal_digits}
                  max={FiltersNodes?.prices?.max_price ?? priceRange?.[1]}
                  onChange={(min, max) => {
                    if (!loading) setPriceRange([min, max]);
                  }}
                />
              </div>

              {showChart && (
                <SmoothPolygon
                  data={
                    (FiltersNodes?.prices?.histogram?.length
                      ? FiltersNodes?.prices?.histogram
                      : FiltersNodes?.prices?.priceRanges
                    )?.map((s) => ({
                      count: s.count ?? s.products_count,
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
        filters={{ ...selectedChips, prices: priceRange }}
        isChanged={isChanged}
      />
    </div>
  );
};
