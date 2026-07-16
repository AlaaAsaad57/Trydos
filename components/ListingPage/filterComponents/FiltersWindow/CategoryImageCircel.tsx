"use client";
import React from "react";
import { getConfiguredImage, GetImageUrl } from "utils/server";

function CategoryImageCircel({
  term,
  name,
  image = null,
  value,
  size = 70,
  isActive,
  color = null,
  childes,
  values = [],
  isRtl = false,
}) {
  const isChildActive = (slug: string) => values?.includes(slug);

  const shouldShowSubCategories = () => {
    if (isActive) return true;
    return childes?.some(
      (child) =>
        isChildActive(child.slug) ||
        child.childes?.some((gc) => isChildActive(gc.slug)),
    );
  };

  return (
    <>
      <div className="flex flex-col w-auto gap-[4px] z-10">
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: isActive ? `1px solid #FF5F61` : `1px solid #fff`,
            backgroundColor: color ?? "transparent",
          }}
          className="rounded-full relative flex items-center justify-center"
          data-filter={term}
          data-filter-value={value?.replace("#", "")}
        >
          <span
            data-filter={term}
            data-filter-value={value?.replace("#", "")}
            style={{
              boxShadow: `inset 0px 4px 6px #ffffff80, 0px 3px 3px #0000000a`,
            }}
            className="absolute rounded-full w-full h-full z-0"
          ></span>
          {isActive && (
            <span className="absolute top-0 left-0">
              <img src="/icons/ActiveCategoryIcon.svg" />
            </span>
          )}
          {image && (
            <img
              className="object-cover object-center rounded-full"
              src={getConfiguredImage({
                src: GetImageUrl(image),
                height: 100,
                width: 100,
              })}
            />
          )}
          {!image && !color && (
            <span className="text-[12px] bold text-[#505050]">{name}</span>
          )}
        </div>
        <span className="regular text-[12px] text-[#8E8E8E]">{name}</span>
      </div>
      {childes?.length > 0 && (
        <div
          className={`categories-sub-circles h-[114px] relative ${
            shouldShowSubCategories() ? "no-transform" : "ml-0"
          } z-0`}
          style={{
            minWidth: shouldShowSubCategories()
              ? "max-content"
              : `${(childes.length * 10) / 2}px`,
            right: isRtl
              ? "initial"
              : shouldShowSubCategories()
                ? "0px"
                : "40px",
            left: isRtl
              ? shouldShowSubCategories()
                ? "0px"
                : "40px"
              : "initial",
          }}
        >
          {childes.map((child, index) => (
            <React.Fragment key={child.slug}>
              <div
                className="sub-circle"
                style={{
                  position: shouldShowSubCategories() ? "relative" : "absolute",
                  left: shouldShowSubCategories() ? "0" : `${index * 8}px`,
                  zIndex: shouldShowSubCategories() ? "auto" : 100 - index,
                  transform: shouldShowSubCategories()
                    ? "none"
                    : `scale(${1 - index * 0.05})`,
                  transition: "all 0.5s ease",
                }}
                data-filter={term}
                data-filter-value={child.slug}
                data-filter-parents={value}
              >
                {isChildActive(child.slug) && (
                  <img
                    src="/icons/ActiveCategoryIcon.svg"
                    className="active-category-icon min-w-[30px] w-[30px] h-[30px] z-50"
                    style={{ top: "-5px", left: "-5px" }}
                    data-filter={term}
                    data-filter-value={child.slug}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    zIndex: "7",
                    width: "50px",
                    height: "50px",
                  }}
                  className="category-shadow"
                  data-filter={term}
                  data-filter-value={child.slug}
                ></div>
                <svg
                  style={{ position: "absolute", zIndex: "6" }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  data-filter={term}
                  data-filter-value={child.slug}
                >
                  <g
                    fill="none"
                    stroke={isChildActive(child.slug) ? "#FF5F61" : "#fff"}
                    strokeWidth="0.5"
                  >
                    <circle cx="25" cy="25" r="25" stroke="none" />
                    <circle cx="25" cy="25" r="25" fill="none" />
                  </g>
                </svg>
                <img
                  className="object-cover object-center rounded-full w-[50px] h-[50px]"
                  src={getConfiguredImage({
                    src: GetImageUrl(
                      child.most_viewed_product_thumbnail ??
                        child.flat_photo_path?.file_path ??
                        child?.icon?.file_path,
                    ),
                    height: 100,
                  })}
                  data-filter={term}
                  data-filter-value={child.slug}
                />
                {shouldShowSubCategories() && (
                  <div className="category-text-container flex-col align-center max-w-[50px]">
                    <span
                      className="category-title"
                      data-filter={term}
                      data-filter-value={child.slug}
                    >
                      {child.name}
                    </span>
                  </div>
                )}
              </div>
              {child.childes?.length > 0 && (
                <div
                  className={`categories-sub-circles ${
                    shouldShowSubCategories() && "no-transform ml-[10px]"
                  } z-0`}
                  style={{
                    minWidth: shouldShowSubCategories()
                      ? "max-content"
                      : "10px",
                  }}
                >
                  {shouldShowSubCategories() &&
                    child.childes.map((grandchild, gcIndex) => (
                      <div
                        key={grandchild.slug}
                        className="sub-circle w-[40px] h-[40px]"
                        style={{ zIndex: 4 - gcIndex }}
                        data-filter={term}
                        data-filter-value={grandchild.slug}
                        data-filter-parents={`${value},${child.slug}`}
                      >
                        {isChildActive(grandchild.slug) && (
                          <img
                            src="/icons/ActiveCategoryIcon.svg"
                            className="active-category-icon w-[30px] w-[30px] h-[30px] z-50"
                            style={{ top: "-5px", left: "-5px" }}
                            data-filter={term}
                            data-filter-value={grandchild.slug}
                          />
                        )}
                        <div
                          style={{
                            position: "absolute",
                            zIndex: "7",
                            width: "40px",
                            height: "40px",
                          }}
                          className="category-shadow"
                          data-filter={term}
                          data-filter-value={grandchild.slug}
                        ></div>
                        <svg
                          style={{ position: "absolute", zIndex: "6" }}
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          data-filter={term}
                          data-filter-value={grandchild.slug}
                        >
                          <g
                            fill="none"
                            stroke={
                              isChildActive(grandchild.slug)
                                ? "#FF5F61"
                                : "#fff"
                            }
                            strokeWidth="0.5"
                          >
                            <circle cx="20" cy="20" r="20" stroke="none" />
                            <circle cx="20" cy="20" r="20" fill="none" />
                          </g>
                        </svg>
                        <img
                          className="object-cover object-center rounded-full min-w-[40px] min-h-[40px] w-[40px] h-[40px]"
                          src={getConfiguredImage({
                            src: GetImageUrl(
                              grandchild.most_viewed_product_thumbnail ??
                                grandchild.flat_photo_path?.file_path ??
                                grandchild?.icon?.file_path,
                            ),
                            height: 100,
                          })}
                          data-filter={term}
                          data-filter-value={grandchild.slug}
                        />
                        {shouldShowSubCategories() && (
                          <div className="category-text-container flex-col align-center mt-2 max-w-[50px]">
                            <span
                              className="category-title"
                              data-filter={term}
                              data-filter-value={grandchild.slug}
                            >
                              {grandchild.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}

export default CategoryImageCircel;
