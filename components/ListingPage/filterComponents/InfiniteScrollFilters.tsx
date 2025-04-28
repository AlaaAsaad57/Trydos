"use client";
import Spinner from "components/global/Spinner";
import { FilterItem } from "components/Server/FilterList";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import { getProductsAndFilters } from "store/homepage/cachedActions";

function InfiniteScrollFilters({
  searchParams,
  lang,
  term,
  boutique,
  currency,
  params,
}) {
  const [country, language] = params.lang?.split("-");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(1);
  const [hasEnd, setHasEnd] = useState(false);
  const [data, setData] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    prices: [],
  });
  const getNextFilters = async () => {
    try {
      setLoading(true);
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
      console.log(response?.data);
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
      if (
        response?.data?.categories?.length === 0 &&
        response?.data?.brands?.length === 0 &&
        response?.data?.colors?.length === 0 &&
        response?.data?.attributes?.length === 0
      ) {
        setHasEnd(true);
      } else {
        setHasEnd(false);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
      {loading ? (
        <>
          {Array.from({ length: 4 })?.map((s) => (
            <div className="category-circle flex-col align-center">
              <div className="relative w-[70px] h-[70px]">
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <InView
          className="spinner-container"
          as="div"
          onChange={(inView, entry) => {
            if (inView && !loading && !hasEnd) {
              getNextFilters();
            }
          }}
        ></InView>
      )}
    </>
  );
}

export default InfiniteScrollFilters;
