import React, { useEffect, useState } from "react";
import MultiRangeSlider from "multi-range-slider-react";
import "styles/slider.css";
function PriceSlider({
  Value,
  set_Value,
}: {
  Value: { min: number; max: number };
  set_Value: ({ min, max }: { min: number; max: number }) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const handleInput = (e) => {
    set_Value({
      min: e.minValue,
      max: e.maxValue,
    });
  };

  return (
    <div className="price-slider-container">
      <MultiRangeSlider
        className={`${enabled && "slider-enabled"}`}
        min={200}
        max={500}
        label={false}
        step={1}
        minValue={Value.min}
        maxValue={Value.max}
        style={{ border: "none", boxShadow: "none" }}
        onInput={(e) => {
          handleInput(e);
        }}
        onChange={(e) => {
          setEnabled(true);
        }}
        ruler={false}
      />
    </div>
  );
}

export default PriceSlider;
