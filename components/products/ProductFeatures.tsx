import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import React from "react";

function ProductFeatures({ language, labels }) {
  const isRtl = language === "ar" || language === "ku";
  function getRandomString() {
    const strings = ["#388CFF", "#FF641A", "#388CFF"]; // your array of 3 strings
    const randomIndex = Math.floor(Math.random() * strings.length);
    return strings[randomIndex];
  }
  return (
    <HortiznalScrollBar
      id="product-features"
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } flex-row gap-[12px] items-center mt-[11px]`}
    >
      {labels?.map((label) => (
        <div className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}>
          <div
            className={`${
              isRtl && "dir-rtl"
            } text-[${getRandomString()}] text-[11px] gap-[3px] flex`}
          >
            <span>{label}</span>
          </div>
        </div>
      ))}
    </HortiznalScrollBar>
  );
}

export default ProductFeatures;
