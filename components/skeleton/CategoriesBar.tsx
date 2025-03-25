import React from "react";
import Skeleton from "react-loading-skeleton";

function CategoriesBarSkeleton() {
  return (
    <div className={`categories-bar-container`}>
      <div className="categories-bar-item-icon">
        <Skeleton width={20} height={20} borderRadius={"50%"} />
      </div>
      <div className="categories-bar-item-icon">
        <Skeleton width={20} height={20} borderRadius={"50%"} />
      </div>
      <div className="categories-bar-item-icon">
        <Skeleton width={20} height={20} borderRadius={"50%"} />
      </div>
      <div className="categories-bar-item-icon">
        <Skeleton width={20} height={20} borderRadius={"50%"} />
      </div>
      <div className="categories-bar-item-icon">
        <Skeleton width={20} height={20} borderRadius={"50%"} />
      </div>
    </div>
  );
}

export default CategoriesBarSkeleton;
