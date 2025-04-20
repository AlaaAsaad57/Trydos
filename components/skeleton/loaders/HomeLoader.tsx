import React from "react";
import OfferListSkeleton from "../OfferList";

function HomeLoader() {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "200px",
      }}
      className="fixed bg-[#fafafa] min-h-screen  flex    w-screen  overflow-hidden"
    >
      <OfferListSkeleton />
    </div>
  );
}

export default HomeLoader;
