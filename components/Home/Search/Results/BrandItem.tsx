import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
function BrandItem({ brand, onClick, isActive }) {
  return (
    <div
      className="brand-item min-w-[81px] p-0 relative ml-2 "
      onClick={() => onClick()}
    >
      {isActive && (
        <ActiveCategoryIcon
          style={{ top: "-6px", left: "-15px", scale: "0.6" }}
          className="absolute"
        />
      )}
      <img src={brand.image} className="h-full max-h-[30px]" />
    </div>
  );
}

export default BrandItem;
