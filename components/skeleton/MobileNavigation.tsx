import React from "react";
import Skeleton from "react-loading-skeleton";

function MobileNavigationSkeleton() {
  return (
    <div className={`categories-bar-container ${"mobile-bar"}`}>
      <div className={`categories-bar-item`}>
        <div className="categories-bar-item-icon">
          <Skeleton width={20} height={20} borderRadius={"50%"} />
        </div>
        <div className={`categories-bar-item-name`}>
          <Skeleton count={1} />
        </div>
      </div>
      <div className={`categories-bar-item`}>
        <div className="categories-bar-item-icon">
          <Skeleton width={20} height={20} borderRadius={"50%"} />
        </div>
        <div className={`categories-bar-item-name`}>
          <Skeleton count={1} />
        </div>
      </div>
      <div className={`categories-bar-item`}>
        <div className="categories-bar-item-icon">
          <Skeleton width={20} height={20} borderRadius={"50%"} />
        </div>
        <div className={`categories-bar-item-name`}>
          <Skeleton count={1} />
        </div>
      </div>
      <div className={`categories-bar-item`}>
        <div className="categories-bar-item-icon">
          <Skeleton width={20} height={20} borderRadius={"50%"} />
        </div>
        <div className={`categories-bar-item-name`}>
          <Skeleton count={1} />
        </div>
      </div>
      <div className={`categories-bar-item`}>
        <div className="categories-bar-item-icon">
          <Skeleton width={20} height={20} borderRadius={"50%"} />
        </div>
        <div className={`categories-bar-item-name`}>
          <Skeleton count={1} />
        </div>
      </div>
    </div>
  );
}

export default MobileNavigationSkeleton;
