import Skeleton from "react-loading-skeleton";
import React from "react";

function StoriesSkeleton() {
  return (
    <div className="stories-bar-container md:pb-[40px]">
      <div id="stories-bar" className="stories-bar">
        <div className="stories-bars justify-start flex cursor-pointer items-center">
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
