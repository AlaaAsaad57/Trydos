import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useAppStore } from "store";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
function CategoryItem({ category, onClick, isActive }) {
  const { searchFilters } = useAppStore();
  const [expanded, setExpand] = useState(false);
  return (
    <>
      <div
        className="category-item brand-item whitespace-nowrap relative pr-4 z-10"
        data-cy="category-result"
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

        <Image
          alt={category.name}
          width={30}
          height={30}
          src={GetImageUrl(category?.flat_photo_path.file_path)?.replace(
            "/upload",
            "/upload/h_30/f_webp"
          )}
        />

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
              <Image
                alt={category.name}
                width={30}
                height={30}
                src={
                  GetImageUrl(s.most_viewed_product_thumbnail)?.replace(
                    "/upload",
                    "/upload/h_30/f_webp"
                  ) ||
                  GetImageUrl(s.icon)?.replace("/upload", "/upload/h_30/f_webp")
                }
              />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CategoryItem;
