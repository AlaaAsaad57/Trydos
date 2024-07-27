import React, { useEffect, useState } from "react";
import Slider from "rc-slider";
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
    <div className="price-slider-container mt-10 w-full pr-9 pl-5 z-10">
      <Slider
        defaultValue={[min, max]}
        range
        min={Value.min}
        max={Value.max}
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
