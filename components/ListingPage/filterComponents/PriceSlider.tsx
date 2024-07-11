import React, { useEffect, useState } from "react";
import MultiRangeSlider from "multi-range-slider-react";
import "styles/slider.css";
function PriceSlider({
  Value,
  set_Value,
  min,
  max,
}: {
  Value: { min: number; max: number };
  set_Value: ({ min, max }: { min: number; max: number }) => void;
  min: number;
  max: number;
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
        min={min}
        max={max}
        label={false}
        step={1}
        minValue={Value.min}
        maxValue={Value.max}
        stepOnly={true}
        style={{ border: "none", boxShadow: "none" }}
        onChange={(e) => {
          handleInput(e);
          setEnabled(true);
        }}
        ruler={false}
      />
    </div>
  );
}

export default PriceSlider;
