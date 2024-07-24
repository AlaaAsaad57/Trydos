import React from "react";

function BrandItem({ brand }) {
  return (
    <div className="brand-item min-w-[81px] p-0 ">
      <img src={brand.icon} className="h-full max-h-[30px]" />
    </div>
  );
}

export default BrandItem;
