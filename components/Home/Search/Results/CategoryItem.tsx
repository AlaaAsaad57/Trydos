import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useSelector } from "react-redux";

function CategoryItem({ category, onClick, isActive }) {
  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const [expanded, setExpand] = useState(false);
  return (
    <>
      <div
        className="category-item brand-item whitespace-nowrap relative pr-4 z-10"
        onClick={() => {
          if (expanded) {
            setExpand(false);
          } else {
            setExpand(true);
          }
          onClick(category);
        }}
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
      {category.childes?.length > 0 && (
        <div
          className={`flex-row min-w-0 max-w-0 overflow-hidden  categories-sub-circles h-[30px] items-center z-0  ${
            (expanded || isActive) &&
            "no-transform w-auto min-w-max overflow-visible max-w-max  pl-3"
          }`}
        >
          {category.childes.map((s, index) => (
            <div
              key={index}
              className="category-item brand-item whitespace-nowrap relative pr-4 h-5 w-5"
              onClick={() => onClick(s)}
            >
              {isActive &&
                searchFilters.categories.some((sub) => sub.slug === s.slug) && (
                  <ActiveCategoryIcon
                    style={{ top: "-6px", left: "-15px", scale: "0.6" }}
                    className="absolute"
                  />
                )}
              <img src={s.flat_photo_path} />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CategoryItem;
