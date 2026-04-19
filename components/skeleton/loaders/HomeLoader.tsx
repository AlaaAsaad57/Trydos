import React from "react";
import OfferListSkeleton from "../OfferList";

function HomeLoader() {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "350px",
      }}
      className="fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex    w-screen  overflow-hidden"
    >
      <OfferListSkeleton />
    </div>
  );
}

export default HomeLoader;
