"use client";

import Spinner from "components/global/Spinner";
import { FilterItem } from "components/Server/FilterList";

import React, { useState } from "react";

import { useAppStore } from "store";
import {
  filtersToSearchParams,
  FilterParams,
  buildParamsFromFilters,
} from "utils/tinyUtils";

interface InfiniteScrollFiltersProps {
  filterParams: FilterParams | any;
  isUsingParsedFilters: boolean;
  lang: string;
  term: string;
  boutique: any;
  currency: any;
  params: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
}

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
}: InfiniteScrollFiltersProps) {
  const { partialLoading, setSearchPartialLoading } = useAppStore();
  const [country, language] = params.lang?.split("-");

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
  const getNextFilters = async () => {
    try {
      setSearchPartialLoading(true);

      // Build the API URL using path parameters instead of search parameters
      const filterPathSegments = isUsingParsedFilters
        ? buildParamsFromFilters(filterParams)
        : buildParamsFromFilters(filtersToSearchParams(filterParams));

      const filterPath =
        filterPathSegments.length > 0 ? filterPathSegments.join("/") : "";
      const apiUrl = filterPath
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${params.lang}/filters/${filterPath}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${params.lang}/filters`;

      const fetchResponse = await fetch(
        `${apiUrl}?${new URLSearchParams({
          noProducts: "true",
          noFilters: "false",
          filters_offset: (offset + 1).toString(),
        }).toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();

      setData({
        categories: [
          ...(data.categories || []),
          ...(response?.data?.categories || []),
        ],
        brands: [...(data?.brands || []), ...(response?.data?.brands || [])],
        colors: [...(data?.colors || []), ...(response?.data?.colors || [])],
        sizes: [
          ...(data?.sizes || []),
          ...(response?.data?.attributes?.[0]?.options || []),
        ],
        prices: [],
      });
      setOffset(offset + 1);
      setHasEnd({
        categories: response?.data?.categories?.length === 0,
        brands: response?.data?.brands?.length === 0,
        colors: response?.data?.colors?.length === 0,
        sizes:
          response?.data?.attributes?.length === 0 ||
          response?.data?.attributes?.[0]?.options?.length === 0,
        prices: response?.data?.prices?.priceRanges?.length === 0,
      });

      setSearchPartialLoading(false);
    } catch (error) {
      setSearchPartialLoading(false);
    }
  };
  const showFilters = () => {
    if (term === "categories")
      return data?.categories?.map((s, i) => (
        <FilterItem
          boutique={boutique}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"categories"}
          key={`categories-${i}`}
        />
      ));
    if (term === "brands")
      return data?.brands?.map((s, i) => (
        <FilterItem
          boutique={boutique}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"brands"}
          key={`brands-${i}`}
        />
      ));
    if (term === "colors")
      return data?.colors?.map((s, i) => (
        <FilterItem
          boutique={boutique}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"colors"}
          key={`colors-${i}`}
        />
      ));
    if (term === "sizes")
      return data?.sizes?.map((s, i) => (
        <FilterItem
          boutique={boutique}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"sizes"}
          key={`sizes-${i}`}
        />
      ));
    if (term === "prices")
      return data?.prices?.map((s, i) => (
        <FilterItem
          boutique={boutique}
          currency={currency}
          item={s}
          params={params}
          filterParams={filterParams}
          isUsingParsedFilters={isUsingParsedFilters}
          term={"prices"}
          key={`prices-${i}`}
        />
      ));
  };
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
        !hasEnd[term] && (
          <div
            onClick={() => {
              getNextFilters();
            }}
            className=" mb-[34px] p-2 text-wrap text-center category-circle h-[70px] flex-col align-center extended-circle text-[#5d5d5d] light shadow-sm bg-[#e8e8e8] rounded-full justify-center items-center"
          >
            More {term}
          </div>
        )
      )}
    </>
  );
}

export default InfiniteScrollFilters;
