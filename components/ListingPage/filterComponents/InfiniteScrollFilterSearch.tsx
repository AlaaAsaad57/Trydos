"use client";
import { useParams } from "next/navigation";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import React, { useState } from "react";
import { InView } from "react-intersection-observer";
import search from "services/search";

function InfiniteScrollFiltersSearch({ isActive, onClick, term }) {
  const { lang } = useParams();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(1);
  const [hasEnd, setHasEnd] = useState(false);
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
      if (
        response?.data?.categories?.length === 0 &&
        response?.data?.brands?.length === 0 &&
        response?.data?.boutiques?.length === 0
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

  return (
    <>
      {loading ? (
        <>
          {Array.from({ length: 4 })?.map((_, i) => (
            <div
              className="brand-item min-w-[81px] p-0 relative ml-2 "
              data-cy="brandItem"
              onClick={() => onClick()}
            >
              <Skeleton
                width={85}
                height={30}
                borderRadius={"10"}
                className="h-full max-h-[30px] object-contain"
              />
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

export default InfiniteScrollFiltersSearch;
