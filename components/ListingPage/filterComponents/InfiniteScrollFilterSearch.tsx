"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import search from "services/search";
import { translateFunction } from "utils/functions";

function InfiniteScrollFiltersSearch({ term, shouldShow }) {
  const { lang } = useParams();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(2);
  const [hasEnd, setHasEnd] = useState({
    categories: false,
    brands: false,
    boutiques: false,
  });

  const getNextFilters = async () => {
    try {
      setLoading(true);

      const response = await search?.getSearchOptions({
        lang: lang,
        filters_offset: offset,
        noFilters: false,
        noProducts: true,
        replace: false,
      });
      setOffset(offset + 1);

      setHasEnd({
        categories: response?.data?.categories?.length === 0,
        brands: response?.data?.brands?.length === 0,
        boutiques: response?.data?.boutiques?.length === 0,
      });
      setLoading(false);
    } catch (error) {
      console.log(error, "getSearchOptions");
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <>
          {Array.from({ length: 4 })?.map((_, i) => (
            <div className="brand-item min-w-[81px] p-0 relative ml-2 " key={i}>
              <Spinner />
            </div>
          ))}
        </>
      ) : (
        !hasEnd[term] && (
          <div
            className="category-item brand-item whitespace-nowrap relative pr-4 z-10 text-[#1d1d1d]"
            onClick={() => {
              getNextFilters();
            }}
          >
            {translateFunction("Load More")}
          </div>
        )
      )}
    </>
  );
}

export default InfiniteScrollFiltersSearch;
