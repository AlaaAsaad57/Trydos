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
  useEffect(() => {
    console.log([min, max], Value);
  }, []);
  return (
    <div className="price-slider-container mt-10 w-full pr-9 pl-5 z-10">
      {/* <MultiRangeSlider
        className={`${enabled && "slider-enabled"}`}
        min={min >= 0 ? min : Value.min}
        max={max >= 0 ? max : Value.max}
        label={false}
        step={1}
        minValue={Value.min}
        maxValue={Value.max}
        stepOnly={true}
        style={{ border: "none", boxShadow: "none" }}
        onChange={(e) => {
          console.log(e);
          handleInput(e);
          setEnabled(true);
        }}
        ruler={false}
      /> */}
      <Slider
        defaultValue={[min, max]}
        range
        min={Value.min}
        max={Value.max}
        step={1}
        onChangeComplete={(e) => {
          console.log(e);

          handleInput({ minValue: e[0], maxValue: e[1] });
          setEnabled(true);
        }}
      />
    </div>
  );
}

export default PriceSlider;
