"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import search from "services/search";

function InfiniteScrollFiltersSearch({ term }) {
  const { lang } = useParams();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(1);
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
      console.log(response);
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
            className="brand-item min-w-[100px] p-0 relative ml-2 text-center text-[#5d5d5d] light shadow-sm bg-[#e8e8e8] rounded-full justify-center items-center"
            onClick={() => {
              getNextFilters();
            }}
          >
            More {term}
          </div>
        )
      )}
    </>
  );
}

export default InfiniteScrollFiltersSearch;
