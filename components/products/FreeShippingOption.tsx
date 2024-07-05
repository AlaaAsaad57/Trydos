import React from "react";
import FreeShippingIcon from "public/svg/product/FreeShipping.svg";
function FreeShippingOption() {
  return (
    <div
      className={`product-colors product-sizes flex-col align-start relative`}
    >
      <div className="colors-label flex-row align-center">
        <FreeShippingIcon />
        <div className="flex-col" style={{ marginLeft: "20px" }}>
          <span>Free Shipping</span>
          <span className="label-description">
            Shipping Is Completely Free Without Any Extras
          </span>
        </div>
      </div>
    </div>
  );
}

export default FreeShippingOption;
