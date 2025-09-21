import React from "react";
import Skeleton from "react-loading-skeleton";

function MobileNavigationSkeleton() {
  return (
    <div className="flex-row bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]">
      <div
        className={`categories-bar-container mobile-bar m-0 max-w-[900px] pl-2 pr-2 overflow-x-scroll overflow-y-hidden min-h-[47px] bg-white pt-2 z-10 whitespace-nowrap flex flex-row`}
      >
        {Array.from({ length: 20 }).map((s, key) => (
          <div className={`categories-bar-item cursor-pointer`} key={key}>
            <div className="categories-bar-item-icon">
              <Skeleton width={20} height={20} borderRadius={"50%"} />
            </div>
            <div className={`categories-bar-item-name`}>
              <Skeleton count={1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MobileNavigationSkeleton;
