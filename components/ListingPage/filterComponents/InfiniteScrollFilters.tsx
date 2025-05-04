"use client";

import Spinner from "components/global/Spinner";
import { FilterItem } from "components/Server/FilterList";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import { useAppStore } from "store";
import { getProductsAndFilters } from "store/homepage/cachedActions";

function InfiniteScrollFilters({
  searchParams,
  lang,
  term,
  boutique,
  currency,
  params,
}) {
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
      const response = await getProductsAndFilters({
        lang: language,
        offset: false,
        searchParams: searchParams,
        country: country,
        noProducts: true,
        noFilters: false,
        filters_offset: offset + 1,
        boutiqueId:
          params?.boutiqueId === "listing" ? null : params?.boutiqueId,
      });

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
          searchParams={searchParams}
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
          searchParams={searchParams}
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
          searchParams={searchParams}
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
          searchParams={searchParams}
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
          searchParams={searchParams}
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
