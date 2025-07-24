"use client";
import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";

import { useRouter } from "next/navigation";
function ProductBackButton() {
  const router = useRouter();
  return (
    <div className="back-bar align-center w-100 flex-row">
      <div
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
        onClick={() => {
          router.back();
        }}
      >
        <BackIcon />
      </div>
    </div>
  );
}

export default ProductBackButton;
