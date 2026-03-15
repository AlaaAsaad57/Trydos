import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";

function CategoryItem({
  category,
  onClick,
  isActive,
  applied_filter,
  relatedCategories = [],
}) {
  // A category is "effectively" active if it or any of its children are in the filters
  const isChildActive = category.childes?.some((child) =>
    applied_filter.categories.some((f) => f.slug === child.slug),
  );

  // Auto-expand if the parent is selected or if a child is selected
  const isExpanded = isActive || isChildActive;

  const shouldShowRelated =
    isActive &&
    Array.isArray(relatedCategories) &&
    relatedCategories.length > 0;

  return (
    <>
      <div
        className={`category-item brand-item whitespace-nowrap relative pr-4 z-10 ${
          isActive ? "active-border" : ""
        }`}
        onClick={() => onClick(category)}
      >
        {isActive && (
          <img
            src="/icons/ActiveCategoryIcon.svg"
            style={{ top: "-6px", left: "-4px", scale: "0.6" }}
            className="absolute"
          />
        )}

        <Image
          alt={category.name || "Image"}
          width={30}
          height={30}
          src={getConfiguredImage({
            src: GetImageUrl(category?.flat_photo_path?.file_path),
            height: 40,
          })}
        />
        {category.name}
      </div>

      {category.childes?.length > 0 && (
        <div
          className={`flex-row min-w-0 max-w-0 overflow-hidden categories-sub-circles h-[30px] items-center z-0 transition-all duration-300 ${
            isExpanded &&
            "no-transform w-auto min-w-max overflow-visible max-w-max pl-3"
          }`}
        >
          {category.childes.map((child, index) => {
            const isThisSubActive = applied_filter.categories.some(
              (f) => f.slug === child.slug,
            );

            return (
              <div
                key={index}
                className="category-item brand-item whitespace-nowrap relative pr-4 h-5 w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(child);
                }}
              >
                {isThisSubActive && (
                  <img
                    src="/icons/ActiveCategoryIcon.svg"
                    style={{ top: "-6px", left: "-4px", scale: "0.6" }}
                    className="absolute"
                  />
                )}
                <Image
                  alt={child.name || "Image"}
                  width={30}
                  height={30}
                  src={getConfiguredImage({
                    src: GetImageUrl(
                      child.most_viewed_product_thumbnail || child.icon,
                    ),
                    height: 40,
                  })}
                />
                {child.name}
              </div>
            );
          })}
        </div>
      )}

      {/* {shouldShowRelated && (
        <>
          {relatedCategories.map((related, index) => (
            <div
              key={related.slug || index}
              className="category-item brand-item whitespace-nowrap relative pr-4  w-auto"
              onClick={(e) => {
                e.stopPropagation();
                onClick(related);
              }}
            >
              <img
                src="/icons/TopStar.svg"
                style={{ top: "-8px", right: "-4px", scale: "0.6" }}
                className="absolute"
              />
              <Image
                alt={related.name || "Image"}
                width={30}
                height={30}
                src={getConfiguredImage({
                  src: GetImageUrl(
                    related.most_viewed_product_thumbnail || related.icon,
                  ),
                  height: 40,
                })}
              />
              {related.name}
            </div>
          ))}
        </>
      )} */}
    </>
  );
}

export default CategoryItem;
