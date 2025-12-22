import { useEffect, useRef, useState } from "react";
import { pollinateInput } from "utils/tinyUtils";

type PriceSliderProps = {
  min: number;
  max: number;
  initialMin: number;
  initialMax: number;
  onChange?: (min: number, max: number) => void;
  roundPrice: (e: number) => number | string;
  symbol: string;
  points: number;
};

function toFixedUp(decimalDigits: number, number: number) {
  const factor = 10 ** decimalDigits;
  return (Math.ceil(Number(number) * factor) / factor).toFixed(decimalDigits);
}

export function PriceSliderComponent({
  min,
  max,
  initialMin,
  initialMax,
  onChange,
  roundPrice,
  symbol,
  points = 2,
}: PriceSliderProps) {
  // Use toFixedUp to clean the precision issues immediately
  const cleanMin = Number(toFixedUp(points, min));
  const cleanMax = Number(toFixedUp(points, max));

  const [minVal, setMinVal] = useState(Number(toFixedUp(points, initialMin)));
  const [maxVal, setMaxVal] = useState(Number(toFixedUp(points, initialMax)));
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  const getPercent = (value: number) => {
    const range = cleanMax - cleanMin;
    if (range === 0) return 0;
    return ((value - cleanMin) / range) * 100;
  };

  useEffect(() => {
    if (rangeRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);
      rangeRef.current.style.left = `${minPercent}%`;
      rangeRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, cleanMin, cleanMax]);

  useEffect(() => {
    setMinVal(Number(toFixedUp(points, initialMin)));
    setMaxVal(Number(toFixedUp(points, initialMax)));
  }, [min, max, initialMin, initialMax, points]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(pollinateInput(e.target.value));
    // Step logic: ensures thumbs don't cross and handles small ranges
    const step = 1 / Math.pow(10, points);
    const clampedVal = Math.min(val, maxVal - step);
    setMinVal(clampedVal);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(pollinateInput(e.target.value));
    const step = 1 / Math.pow(10, points);
    const clampedVal = Math.max(val, minVal + step);
    setMaxVal(clampedVal);
  };

  const handleEnd = () => {
    setIsDragging(null);
    onChange?.(minVal, maxVal);
  };

  return (
    <div className="w-full px-4 pt-12 pb-8">
      <div className="relative h-[2px] bg-[#5D5C5D] rounded">
        {/* Sliding Labels */}
        <div
          className="absolute bottom-[50px] text-xs font-medium text-white bg-[#FF5F61] px-2 py-1 rounded transition-opacity duration-200 pointer-events-none"
          style={{
            left: `${getPercent(minVal)}%`,
            transform: "translateX(-50%)",
            opacity: isDragging === "min" ? 1 : 0,
            zIndex: 20,
          }}
        >
          {roundPrice(minVal)}
          {symbol}
        </div>

        <div
          className="absolute bottom-[50px] text-xs font-medium text-white bg-[#FF5F61] px-2 py-1 rounded transition-opacity duration-200 pointer-events-none"
          style={{
            left: `${getPercent(maxVal)}%`,
            transform: "translateX(-50%)",
            opacity: isDragging === "max" ? 1 : 0,
            zIndex: 20,
          }}
        >
          {roundPrice(maxVal)}
          {symbol}
        </div>

        {/* Active range fill */}
        <div
          ref={rangeRef}
          className="absolute h-full bg-[#FF5F61] rounded"
        ></div>

        {/* Min range input */}
        <input
          type="range"
          min={cleanMin}
          max={cleanMax}
          step={1 / Math.pow(10, points)}
          value={minVal}
          onMouseDown={() => setIsDragging("min")}
          onTouchStart={() => setIsDragging("min")}
          onChange={handleMinChange}
          onMouseUp={handleEnd}
          onTouchEnd={handleEnd}
          className="absolute h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            zIndex: minVal > cleanMax - (cleanMax - cleanMin) / 10 ? "10" : "6",
            width: "calc(100% + 40px)",
            left: "-20px",
          }}
        />

        {/* Max range input */}
        <input
          type="range"
          min={cleanMin}
          max={cleanMax}
          step={1 / Math.pow(10, points)}
          value={maxVal}
          onMouseDown={() => setIsDragging("max")}
          onTouchStart={() => setIsDragging("max")}
          onChange={handleMaxChange}
          onMouseUp={handleEnd}
          onTouchEnd={handleEnd}
          className="absolute h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            width: "calc(100% + 40px)",
            left: "-20px",
          }}
        />

        <style>{`
          input[type='range']::-webkit-slider-thumb {
            appearance: none;
            pointer-events: auto;
            height: 40px;
            width: 40px;
            background-color: #FF5F61;
            border-radius: 9999px;
            cursor: pointer;
            margin-top: -19px;
            border: 2px solid white;
          }
          input[type='range']::-moz-range-thumb {
            appearance: none;
            pointer-events: auto;
            height: 40px;
            width: 40px;
            background-color: #FF5F61;
            border-radius: 9999px;
            cursor: pointer;
            border: 2px solid white;
          }
          input[type='range']:focus {
            outline: none;
          }
        `}</style>
      </div>
    </div>
  );
}
