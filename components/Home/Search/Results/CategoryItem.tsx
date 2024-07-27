import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function CategoryItem({ category, onClick, isActive }) {
  return (
    <div
      className="category-item brand-item whitespace-nowrap relative pr-4"
      onClick={() => onClick()}
    >
      {isActive && (
        <ActiveCategoryIcon
          style={{ top: "-6px", left: "-15px", scale: "0.6" }}
          className="absolute"
        />
      )}

      <img src={category.flat_photo_path} />
      {category.name}
    </div>
  );
}

export default CategoryItem;
