import React from "react";
import Skeleton from "react-loading-skeleton";

function MobileNavigationSkeleton() {
  return (
    <div className={`categories-bar-container ${"mobile-bar"}`}>
      {Array.from({ length: 20 }).map((s, key) => (
        <div className={`categories-bar-item`} key={key}>
          <div className="categories-bar-item-icon">
            <Skeleton width={20} height={20} borderRadius={"50%"} />
          </div>
          <div className={`categories-bar-item-name`}>
            <Skeleton count={1} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MobileNavigationSkeleton;
