import React, { useState } from "react";
import Slider from "rc-slider";
import "styles/slider.css";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";
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
    >
      <Slider
        defaultValue={[
          searchFilters?.prices?.min_price,
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price,
        ]}
        range
        min={searchFilters?.prices?.min_price}
        max={
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price
        }
        step={1}
        onChangeComplete={(e) => {
          handleInput({ minValue: e[0], maxValue: e[1] });
          setEnabled(true);
        }}
      />
    </div>
  );
}

export default PriceSlider;
