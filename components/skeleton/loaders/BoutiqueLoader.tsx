import ListingSkeleton from "../listing";

import { useAppStore } from "store";
import BoutiqueSlidersSkeleton from "./BoutiqueSlidersSkeleton";
import Skeleton from "react-loading-skeleton";

function BoutiqueLoader({ boutique, isForSearch = false }) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <div
        data-pw="filter_listing_bar"
        // The real bar is `position: sticky` with a high z-index so it pins under
        // the navbar while the grid scrolls. In a static loading skeleton that only
        // makes the white bar float OVER the filter circles when the page isn't at
        // scroll 0. Force plain in-flow positioning (inline style beats the CSS
        // class) so the skeleton can never overlap the rows beneath it.
        style={{ position: "relative", top: "auto", zIndex: 1 }}
        className={`filter-listing-bar ${
          isRtl ? "flex-row-reverse flex" : "flex-row flex"
        } align-center left-0 right-0 mx-auto w-full h-[50px] max-w-[1365px] pl-[15px] pr-[20px] justify-between bg-white`}
      >
        <span></span>

        <div
          data-pw="filter_bar_options"
          className={`filter-bar-options gap-[12px] w-[170px] justify-between ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          }  align-center`}
        >
          <Skeleton width={24} height={24} borderRadius={"50%"} />
          <div
            data-pw="filter_option_loseSearchInput"
            className="filter-option"
          >
            <Skeleton width={24} height={24} borderRadius={"50%"} />
          </div>
          <Skeleton width={24} height={24} borderRadius={"50%"} />
          <Skeleton width={24} height={24} borderRadius={"50%"} />
        </div>
      </div>

      <div
        data-pw="boutique_header"
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
