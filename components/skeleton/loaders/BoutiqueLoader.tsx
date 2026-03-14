import ListingSkeleton from "../listing";

import { useAppStore } from "store";
import BoutiqueSlidersSkeleton from "./BoutiqueSlidersSkeleton";
import Skeleton from "react-loading-skeleton";

function BoutiqueLoader({ boutique, isForSearch = false }) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: isForSearch ? "150px" : "100px",
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
      <div
        data-cy="filter_listing_bar"
        className={`filter-listing-bar z-99999999 relative ${
          isRtl ? "flex-row-reverse flex" : "flex-row flex"
        } align-center w-full h-[50px] max-w-[1365px] pl-[15px] pr-[20px] justify-between bg-white z-10`}
      >
        <span></span>

        <div
          data-cy="filter_bar_options"
          className={`filter-bar-options gap-[12px] w-[170px] justify-between ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          }  align-center`}
        >
          <Skeleton width={24} height={24} borderRadius={"50%"} />
          <div
            data-cy="filter_option_loseSearchInput"
            className="filter-option"
          >
            <Skeleton width={24} height={24} borderRadius={"50%"} />
          </div>
          <Skeleton width={24} height={24} borderRadius={"50%"} />
          <Skeleton width={24} height={24} borderRadius={"50%"} />
        </div>
      </div>

      <div
        data-cy="boutique_header"
        className={`boutique-header ${"flex-col"} align-center`}
      >
        {boutique?.name && <BoutiqueSlidersSkeleton boutique={boutique} />}
        <ListingSkeleton justFilters={true} />
      </div>
      <ListingSkeleton forProducts={true} />
    </div>
  );
}

export default BoutiqueLoader;
