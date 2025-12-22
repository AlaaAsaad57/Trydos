"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";
import { pollinateInput } from "utils/tinyUtils";
function PriceSlider({}: {}) {
  const { lang } = useParams();
  const {
    searchFilters,
    setSearchPrice,
    searchResults,
    setSearchLoading,
    setSearchPartialLoading,
  } = useAppStore();
  const [enabled, setEnabled] = useState(false);
  const handleInput = async (e) => {
    setSearchPrice({ min_price: e.minValue, max_price: e.maxValue });
    setSearchPartialLoading(true);
    setSearchLoading(true);
    await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchPartialLoading(false);
    setSearchLoading(false);
  };

  return (
    <div
      className="price-slider-container mt-10 w-full pr-9 pl-5 z-10"
      data-cy="slider"
    ></div>
  );
}

export default PriceSlider;
