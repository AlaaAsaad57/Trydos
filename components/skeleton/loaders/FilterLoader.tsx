import React from "react";
import ListingSkeleton from "../listing";

function FilterLoader({
  boutique,
  isForSearch,
}: {
  boutique: any;
  isForSearch?: boolean;
}) {
  const getOffset = () => {
    let element =
      document?.querySelector?.(".boutique-header")?.clientHeight + 150;
    return element;
  };
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: `${getOffset()}px`,
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
      <ListingSkeleton
        isForSearch={isForSearch}
        boutique={boutique?.name === "Search" ? null : boutique}
        forProducts={true}
        withBanners={true}
      />
    </div>
  );
}

export default FilterLoader;
