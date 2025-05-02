import React from "react";
import OfferListSkeleton from "../OfferList";
import StoriesSkeleton from "../StoriesSkeleton";
import MobileNavigationSkeleton from "../MobileNavigation";

function FullHomeLoader() {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex-col    w-screen  overflow-hidden"
    >
      <MobileNavigationSkeleton />
      <StoriesSkeleton />
      <OfferListSkeleton />
    </div>
  );
}

export default FullHomeLoader;
