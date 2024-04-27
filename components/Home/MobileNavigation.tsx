import React from "react";
import Skeleton from "react-loading-skeleton";
import CategoryNavMobile from "./CategoryNavMobile";
import { categories } from "utils/constants";
import { useSelector } from "react-redux";

function MobileNavigation() {
  const loading = useSelector((state: any) => state.homepage.loading);
  return (
    <div className={`categories-bar-container ${"mobile-bar"}`}>
      {categories
        .filter((e, i) => i < 5)
        .map((category, key) =>
          loading ? (
            <div className="categories-bar-item" key={key}>
              <div className="categories-bar-item-icon">
                <Skeleton
                  duration={0.5}
                  count={1}
                  circle={true}
                  width={"100%"}
                  height={"100%"}
                />
              </div>
            </div>
          ) : (
            <CategoryNavMobile
              name={category.name}
              key={key}
              myKey={key}
              icon={category?.icon}
            />
          )
        )}
    </div>
  );
}

export default MobileNavigation;
