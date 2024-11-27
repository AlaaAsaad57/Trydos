import React, { useEffect, useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useSelector } from "node_modules/react-redux/es";

function SubCategoryCircle({
  index,
  MainCategoryActive,
  category,
  onClick,
  active,
}) {
  const [expanded, setExpanded] = useState(active);
  useEffect(() => {
    setExpanded(active);
  }, [active]);
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const isSelected = (sub) => {
    return (
      selectedFilter.categories.filter((s) => s.slug === sub.slug).length > 0
    );
  };
  return (
    <>
      <div
        className="sub-circle"
        onClick={() => {
          setExpanded(true);
          onClick(category);
        }}
        style={{
          transform: `translateX(-${(index + 1) * 45 - (index + 1) * 3}px)`,
          zIndex: 4 - index,
        }}
      >
        {MainCategoryActive && active && (
          <ActiveCategoryIcon
            className="active-category-icon"
            style={{ top: "-5px", left: "-5px" }}
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
        ></div>
        <svg
          style={{ position: "absolute", zIndex: "6" }}
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          height="50"
          viewBox="0 0 50 50"
        >
          <g
            id="Ellipse_283"
            data-name="Ellipse 283"
            fill="none"
            stroke={active && MainCategoryActive ? "#FF5F61" : "#fff"}
            strokeWidth="0.5"
          >
            <circle cx="25" cy="25" r="25" stroke="none" />
            <circle cx="25" cy="25" r="25" fill="none" />
          </g>
        </svg>

        <img
          width={50}
          height={50}
          src={
            category.most_viewed_product_thumbnail?.file_path ??
            category.flat_photo_path?.file_path ??
            category?.icon?.file_path
          }
        />
        {MainCategoryActive && (
          <div className="category-text-container flex-col align-center">
            <span className="category-title">{category.name}</span>
            {/* <span className="category-typo">1100</span> */}
          </div>
        )}
      </div>
      {category.childes?.length > 0 && (
        <div
          className={`categories-sub-circles ${
            (active || expanded) && "no-transform"
          } z-0`}
          style={{
            minWidth:
              active || expanded
                ? `${category.childes.length * 55 - 5}px`
                : "10px",
          }}
        >
          {category.childes.map((s, index) => {
            return (
              <div
                key={index}
                className="sub-circle"
                onClick={() => {
                  onClick(s);
                }}
                style={{
                  transform: `translateX(-${
                    (index + 1) * 45 - (index + 1) * 3
                  }px)`,
                  zIndex: 4 - index,
                }}
              >
                {isSelected(s) && (
                  <ActiveCategoryIcon
                    className="active-category-icon"
                    style={{ top: "-5px", left: "-5px" }}
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
                ></div>
                <svg
                  style={{ position: "absolute", zIndex: "6" }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                >
                  <g
                    id="Ellipse_283"
                    data-name="Ellipse 283"
                    fill="none"
                    stroke={
                      isSelected(s) && MainCategoryActive ? "#FF5F61" : "#fff"
                    }
                    strokeWidth="0.5"
                  >
                    <circle cx="25" cy="25" r="25" stroke="none" />
                    <circle cx="25" cy="25" r="25" fill="none" />
                  </g>
                </svg>

                <img
                  width={50}
                  height={50}
                  src={
                    s.most_viewed_product_thumbnail?.file_path ??
                    s.flat_photo_path?.file_path ??
                    s?.icon?.file_path
                  }
                />
                {isSelected(category) && (
                  <div className="category-text-container flex-col align-center">
                    <span className="category-title">{s.name}</span>
                    {/* <span className="category-typo">1100</span> */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default SubCategoryCircle;
