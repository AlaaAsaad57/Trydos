import React from "react";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";
import ReturnIcon from "public/svg/product/ReturnIcon.svg";
function FreeReturnOption() {
  return (
    <div
      className={`product-shipping justify-start product-colors product-sizes flex-col align-start relative`}
    >
      <div className="colors-label flex-row align-center">
        <FreeReturnIcon />
        <div className="flex-col" style={{ marginLeft: "20px" }}>
          <span>Free Return</span>
          <span className="label-description">
            Return Is Completely Free Without Any Extras
          </span>
        </div>
      </div>
      <div className="address-container flex-row justify-center align-center h-0"></div>
      <div className="yellow-label flex-row align-center">
        <div className="colors-label flex-row align-center ">
          <ReturnIcon />

          <span style={{ marginLeft: "20px" }}>
            Within 3 Days After Receiving The Product, You Can Return It Without
            Conditions Or Reasons With Complete Ease And Get The Amount Back
          </span>
        </div>
      </div>
    </div>
  );
}

export default FreeReturnOption;
