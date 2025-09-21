import React from "react";
import Skeleton from "react-loading-skeleton";

import MobileNavigationSkeleton from "./MobileNavigation";

function NavbarSkeleton({ noCategory }: { noCategory: boolean }) {
  return (
    <>
      <div className="home-navbar duration-[1s] max-w-[1365px] min-h-[98px]  px-[20px] pt-[52px] bg-white flex-row items-start w-full justify-start">
        <div className="logo-container">
          <Skeleton width={150} height={26} />
        </div>

        <div className="user-nav-container">
          <div className={`welcome-user`}>
            <span>
              <Skeleton count={1} />
            </span>
            <span>
              <Skeleton count={1} />
            </span>
          </div>
          <div className="nav-question-item">
            <Skeleton width={15} height={15} borderRadius={"50%"} />
          </div>
          <div className="nav-question-item">
            <Skeleton width={15} height={15} borderRadius={"50%"} />
          </div>
          <div className="nav-question-item">
            <Skeleton width={15} height={15} borderRadius={"50%"} />
          </div>
        </div>
      </div>
      {!noCategory && <MobileNavigationSkeleton />}
    </>
  );
}

export default NavbarSkeleton;
