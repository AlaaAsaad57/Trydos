import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function BoutiqueItem({ boutique, onClick, isActive }) {
  return (
    <div
      className="brand-item boutique-item relative"
      onClick={() => onClick()}
    >
      {isActive && (
        <ActiveCategoryIcon
          style={{ top: "-6px", left: "-15px", scale: "0.6" }}
          className="absolute"
        />
      )}
      <img src={boutique?.banner?.file_path} className="rounded-xl" />
    </div>
  );
}

export default BoutiqueItem;
