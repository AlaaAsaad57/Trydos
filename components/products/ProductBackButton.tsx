"use client";
import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";

function ProductBackButton() {
  return (
    <div className="back-bar align-center w-100 flex-row">
      <div
        onClick={() => {
          window.history.back();
        }}
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
      >
        <BackIcon />
      </div>
    </div>
  );
}

export default ProductBackButton;
