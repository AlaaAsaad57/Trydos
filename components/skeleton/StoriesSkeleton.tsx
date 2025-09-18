import Skeleton from "react-loading-skeleton";
import React from "react";

function StoriesSkeleton() {
  return (
    <div className="stories-bar-container mt-[15px] h-[183px] items-center flex w-full z-[99999999] max-w-[1365px] justify-start ">
      <div id="stories-bar" className="stories-bar">
        <div className="stories-bars flex-row justify-start flex cursor-pointer items-center">
          {[1, 1, 1, 1, 1, 1, 1, 1, 1].map((story, index) => (
            <Skeleton
              width={100}
              key={index}
              height={150}
              borderRadius={20}
              style={{ marginLeft: "5px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StoriesSkeleton;
