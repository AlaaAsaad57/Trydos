"use client";

import Spinner from "components/global/Spinner";

import { InfiniteScrollFiltersPropsType } from "models/componentType/InfiniteScrollFiltersPropsType";
import { useParams } from "next/navigation";

import React, { useEffect, useState } from "react";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";

import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import { parseFiltersFromParams } from "utils/tinyUtils";
import FilterItem from "../FilterItem";
import FilterItemWrapper from "components/clientWrapper/FilterItemWrapper";

function InfiniteScrollFilters({
  filterParams,
  isUsingParsedFilters,
  lang,
  term,
  boutique,
  currency,
  params,
  isFeatured,
  isFlashDeals,
}: InfiniteScrollFiltersPropsType) {
  const [shouldShow, setShouldShow] = useState(false);
  const { partialLoading, setSearchPartialLoading } = useAppStore();
  const [country, language] = params.lang?.split("-");
  const PageParams = useParams();
  const [offset, setOffset] = useState(1);
  const [hasEnd, setHasEnd] = useState({
    categories: false,
    brands: false,
    colors: false,
    sizes: false,
    prices: false,
  });
  const [data, setData] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    prices: [],
  });
  const baseUrlOfFiltersPage = () => {
    if (isFeatured) return `/featured`;
    if (isFlashDeals) return "/flashDeals";
    return "/filters";
  };
  const { filters: filterParamsVar } = PageParams;
  const getNextFilters = async () => {
    try {
      setSearchPartialLoading(true);
      let parsedFilters = filterParams
        ? parseFiltersFromParams(filterParamsVar as string[])
        : {};
      if (parsedFilters.prices) {
        parsedFilters = {
          ...parsedFilters,
          prices: parsedFilters.prices?.map((s) =>
            s.split("-").map((d) => Number(d))
          )?.[0],
        };
      }

      let response = await getProductsAndFiltersFromElastic({
        country: country,
        language_code: language,
        filters: {
          ...parsedFilters,
          featured: isFeatured,
          flashdeal: isFlashDeals,
          search_text: parsedFilters?.search_text?.[0],
        },
        filters_offset: offset + 1,
        limit: 10,
        noProducts: true,
      });
      // Convert filter parameters to search params for elastic backend

      if (!response) {
        showErrorNotification(
          translateFunction("Failed To Load Filters Try Again")
        );
        setSearchPartialLoading(false);
        return;
      }
      setData({
        categories: [
          ...(data.categories || []),
          ...(response?.categories || []),
        ],
        brands: [...(data?.brands || []), ...(response?.brands || [])],
        colors: [...(data?.colors || []), ...(response?.colors || [])],
        sizes: [
          ...(data?.sizes || []),
          ...(response?.attributes?.[0]?.options || []),
        ],
        prices: [],
      });
      setOffset(offset + 1);
      setHasEnd({
        categories: response?.categories?.length === 0,
        brands: response?.brands?.length === 0,
        colors: response?.colors?.length === 0,
        sizes:
          response?.attributes?.length === 0 ||
          response?.attributes?.[0]?.options?.length === 0,
        prices: response?.prices?.priceRanges?.length === 0,
      });

      setSearchPartialLoading(false);
    } catch (error) {
      console.error(error);
      setSearchPartialLoading(false);
    }
  };
  const showFilters = () => {
    if (term === "categories")
      return data?.categories?.map((s, i) => (
        // <FilterItemWrapper
        //   key={i}
        //   item={{ value: s?.name, type: "categories" }}
        // >
        <FilterItem
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"categories"}
          key={`categories-${i}`}
        />
        // </FilterItemWrapper>
      ));
    if (term === "brands")
      return data?.brands?.map((s, i) => (
        // <FilterItemWrapper key={i} item={{ value: s?.name, type: "brands" }}>
        <FilterItem
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"brands"}
          key={`brands-${i}`}
        />
        // </FilterItemWrapper>
      ));
    if (term === "colors")
      return data?.colors?.map((s, i) => (
        // <FilterItemWrapper
        //   key={i}
        //   item={{ value: s?.name || s, type: "colors" }}
        // >
        <FilterItem
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"colors"}
          key={`colors-${i}`}
        />
        // </FilterItemWrapper>
      ));
    if (term === "sizes")
      return data?.sizes?.map((s, i) => (
        // <FilterItemWrapper
        //   key={i}
        //   item={{ value: s?.name || s, type: "sizes" }}
        // >
        <FilterItem
          term="sizes"
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
        />
        // </FilterItemWrapper>
      ));
    if (term === "prices")
      return data?.prices?.map((s, i) => (
        // <FilterItemWrapper
        //   key={i}
        //   item={{ value: `${s.min_price}-${s.max_price}`, type: "prices" }}
        // >
        <FilterItem
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"prices"}
          key={`prices-${i}`}
        />
        // </FilterItemWrapper>
      ));
  };
  useEffect(() => {
    setShouldShow(true);
  }, []);
  if (!shouldShow) return <></>;
  return (
    <>
      {showFilters()}
      {partialLoading ? (
        <>
          <div className="category-circle flex-col align-center">
            <div className="relative w-[40px] h-[70px] flex items-center justify-center">
              <Spinner />
            </div>
          </div>
        </>
      ) : (
        typeof window !== "undefined" &&
        !hasEnd[term] && (
          <div
            onClick={() => {
              getNextFilters();
            }}
            className=" mb-[34px] p-2 text-wrap text-center category-circle h-[70px] flex-col align-center extended-circle text-[#5d5d5d] light shadow-sm bg-[#e8e8e8] rounded-full justify-center items-center"
          >
            {translateFunction("More From")} {translateFunction(term)}
          </div>
        )
      )}
    </>
  );
}

export default InfiniteScrollFilters;
