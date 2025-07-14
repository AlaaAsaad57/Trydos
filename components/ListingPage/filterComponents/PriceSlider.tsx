"use client";
import React, { useEffect, useRef, useState } from "react";
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
      {/* <Slider
        defaultValue={[
          searchFilters?.prices?.min_price || searchResults?.prices?.min_price,
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price,
        ]}
        range
        min={
          searchFilters?.prices?.min_price || searchResults?.prices?.min_price
        }
        max={
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price
        }
        step={1}
        onChangeComplete={(e) => {
          handleInput({ minValue: e[0], maxValue: e[1] });
          setEnabled(true);
        }}
      /> */}
      <PriceSliderComponent
        initialMax={
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price
        }
        initialMin={
          searchFilters?.prices?.min_price || searchResults?.prices?.min_price
        }
        min={
          searchFilters?.prices?.min_price || searchResults?.prices?.min_price
        }
        max={
          searchFilters?.prices?.max_price || searchResults?.prices?.max_price
        }
        onChange={(min, max) => {
          handleInput({ minValue: min, maxValue: max });
          setEnabled(true);
        }}
      />
    </div>
  );
}

export default PriceSlider;

type PriceSliderProps = {
  min: number;
  max: number;
  initialMin: number;
  initialMax: number;
  onChange?: (min: number, max: number) => void;
};

function PriceSliderComponent({
  min,
  max,
  initialMin,
  initialMax,
  onChange,
}: PriceSliderProps) {
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);
  const rangeRef = useRef<HTMLDivElement>(null);

  const percent = (value: number) => ((value - min) / (max - min)) * 100;

  // Update range fill
  useEffect(() => {
    if (rangeRef.current) {
      console.log({ minVal, maxVal, min, max });
      rangeRef.current.style.left = `${percent(minVal)}%`;
      rangeRef.current.style.width = `${percent(maxVal) - percent(minVal)}%`;
    }
  }, [minVal, maxVal, min, max]);
  useEffect(() => {
    setMinVal(min);
    setMaxVal(max);
  }, [min, max]);
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(val);
  };

  const handleChangeComplete = () => {
    onChange?.(minVal, maxVal);
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="relative h-[2px] bg-[#5D5C5D] rounded">
        {/* Active range fill */}
        <div
          ref={rangeRef}
          className="absolute h-full bg-[#5D5C5D] rounded"
        ></div>

        {/* Min range input */}
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          onMouseUp={handleChangeComplete}
          onTouchEnd={handleChangeComplete}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: minVal > max - 100 ? "5" : "6" }}
        />

        {/* Max range input */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseUp={handleChangeComplete}
          onTouchEnd={handleChangeComplete}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
        />

        {/* Custom red thumbs */}
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            appearance: none;
            pointer-events: auto;
            height: 40px;
            width: 40px;
            background-color: #FF5F61;
            border-radius: 9999px;
            cursor: pointer;
            margin-top: -9px;
          }
          input[type='range']::-moz-range-thumb {
            pointer-events: auto;
            height: 20px;
            width: 20px;
            background-color: #FF5F61;
            border-radius: 9999px;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}
