"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Spinner from "components/global/Spinner";
import search from "services/search";
import { LogError, translateFunction } from "utils/functions";

type Term = "brands" | "categories" | "boutiques";

export function useInfiniteScrollFiltersSearch() {
  const { lang } = useParams();

  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(2);
  const [isEnd, setIsEnd] = useState({
    brands: false,
    categories: false,
    boutiques: false,
  });

  const getNextFilters = async () => {
    try {
      setLoading(true);

      const response = await search?.getSearchOptions({
        lang,
        filters_offset: offset,
        noFilters: false,
        noProducts: true,
        replace: false,
      });

      setOffset((prev) => prev + 1);

      setIsEnd({
        categories:
          response?.data?.categories?.length === 0 ||
          response?.data?.categories?.length < 10,
        brands:
          response?.data?.brands?.length === 0 ||
          response?.data?.brands?.length < 10,
        boutiques:
          response?.data?.boutiques?.length === 0 ||
          response?.data?.boutiques?.length < 10,
      });

      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Get Next Search Filters",
      });
      setLoading(false);
    }
  };

  const LoadMoreComponent = () => {
    return (
      <>
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                className="brand-item min-w-[81px] p-0 relative ml-2"
                key={i}
              >
                <Spinner />
              </div>
            ))}
          </>
        ) : (
          <div
            className="category-item brand-item whitespace-nowrap relative pr-4 z-10 text-[#1d1d1d]"
            onClick={getNextFilters}
          >
            {translateFunction("Load More")}
          </div>
        )}
      </>
    );
  };
  const reset = () => {
    setOffset(2);
    setIsEnd({
      brands: false,
      categories: false,
      boutiques: false,
    });
  };
  return {
    isBoutiqueEnds: isEnd.boutiques,
    isBrandsEnd: isEnd.brands,
    isCategoriesEnds: isEnd.categories,
    LoadMoreComponent,
    reset,
  };
}
