import React from "react";
import ListingSkeleton from "../listing";

function BoutiqueLoader({ boutique }) {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
      <ListingSkeleton
        boutique={boutique}
        forProducts={false}
        withBanners={true}
      />
    </div>
  );
}

export default BoutiqueLoader;
