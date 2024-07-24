import React from "react";

function CategoryItem({ category }) {
  return (
    <div className="category-item brand-item whitespace-nowrap">
      <img src={category.icon} />
      {category.name}
    </div>
  );
}

export default CategoryItem;
