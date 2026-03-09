"use client";
import Spinner from "components/global/Spinner";
import React from "react";
import { GetNextPageFilters } from "serverRequests/listing";
import { LogError } from "utils/functions";
import { translateFunction } from "utils/server";

function InfiniteScrollFilters({
  term,
  filters,
  country,
  language,
  params,
  currency,
}) {
  const [loading, setLoading] = React.useState(false);
  const [filterItems, setFilterItems] = React.useState([
    <React.Fragment key={0}></React.Fragment>,
  ]);
  const [hasEnd, setHasEnd] = React.useState(false);
  const [offset, setOffset] = React.useState(1);
  const getNextFilters = async () => {
    setLoading(true);

    try {
      let response = await GetNextPageFilters({
        country,
        language,
        filters,
        filter_offset: offset + 1,
        params,
        currency,
      });
      let filter_response;
      setOffset(offset + 1);

      switch (term) {
        case "categories":
          filter_response = response.categories;
          break;
        // case "related_categories":
        // filter_response = response.related_categories;
        // break;
        case "brands":
          filter_response = response.brands;
          break;
        case "colors":
          filter_response = response.colors;
          break;
        case "sizes":
          filter_response = response.sizes;
          break;
        case "prices":
          filter_response = response.prices;
          break;
      }

      if (filter_response?.length) {
        setFilterItems([...filterItems, ...filter_response]);
      } else {
        setHasEnd(true);
      }
      setLoading(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Get Next Filters in InfinteScrollFiters",
      });
      setLoading(false);
    }
  };
  return (
    <>
      {filterItems}
      {loading ? (
        <>
          <div className="category-circle flex-col align-center">
            <div className="relative w-[40px] h-[70px] flex items-center justify-center">
              <Spinner />
            </div>
          </div>
        </>
      ) : (
        !hasEnd && (
          <div
            onClick={() => {
              getNextFilters();
            }}
            className=" mb-[34px] p-2 text-wrap text-center category-circle h-[70px] flex-col align-center extended-circle text-[#5d5d5d] light shadow-xs bg-[#e8e8e8] rounded-full justify-center items-center"
          >
            {translateFunction("More From", language)}{" "}
            {translateFunction(term, language)}
          </div>
        )
      )}
    </>
  );
}

export default InfiniteScrollFilters;
