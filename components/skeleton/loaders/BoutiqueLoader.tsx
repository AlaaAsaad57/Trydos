import React from "react";
import ListingSkeleton from "../listing";
import { BoutiqueLoaderPropsType } from "models/componentType/BoutiqueLoaderPropsType";

function BoutiqueLoader({
  boutique,
  isForSearch,
}: BoutiqueLoaderPropsType) {
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: isForSearch ? "150px" : "100px",
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
      <ListingSkeleton
        isForSearch={isForSearch}
        boutique={boutique?.name === "Search" ? null : boutique}
        forProducts={false}
        withBanners={true}
      />
    </div>
  );
}

export default BoutiqueLoader;
