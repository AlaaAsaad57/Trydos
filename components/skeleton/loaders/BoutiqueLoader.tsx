import React from "react";
import ListingSkeleton from "../listing";
import { BoutiqueLoaderPropsType } from "models/componentType/BoutiqueLoaderPropsType";
import { Skeleton } from "components/Server/Skeleton";
import { useAppStore } from "store";
import BoutiqueSlidersSkeleton from "./BoutiqueSlidersSkeleton";

function BoutiqueLoader({ boutique, isForSearch }: BoutiqueLoaderPropsType) {
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
        className={`filter-listing-bar z-[99999999] relative ${
          isRtl ? "flex-row-reverse flex" : "flex-row flex"
        } align-center w-full h-[50px] pl-[15px] pr-[20px] justify-between bg-white z-10`}
      >
        <Skeleton width={24} height={10} borderRadius={"50%"} />

        <div
          data-cy="filter_bar_options"
          className={`filter-bar-options w-[170px] justify-between ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          }  align-center`}
        >
          <Skeleton width={24} height={10} borderRadius={"50%"} />
          <div
            data-cy="filter_option_loseSearchInput"
            className="filter-option"
          >
            <Skeleton width={24} height={10} borderRadius={"50%"} />
          </div>
          <Skeleton width={24} height={10} borderRadius={"50%"} />
          <Skeleton width={24} height={10} borderRadius={"50%"} />
        </div>
      </div>

      <div
        data-cy="boutique_header"
        className={`boutique-header ${"flex-col"} align-center`}
      >
        <BoutiqueSlidersSkeleton />

        <ListingSkeleton justFilters={true} />
      </div>
      <ListingSkeleton forProducts={true} />
    </div>
  );
}

export default BoutiqueLoader;
