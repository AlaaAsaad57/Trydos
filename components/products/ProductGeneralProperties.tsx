"use client";
import React, { Suspense, useMemo } from "react";
import RatingStars from "components/settings/cards/RatingStars";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import RecomendedIcon from "public/svg/Recomended.svg";
import QualityIcon from "public/svg/product/QualityIcon.svg";
import ProductViews from "components/products/ProductViews";
import Flag from "public/svg/product/flag.svg";
import { translateFunction } from "utils/functions";
import Skeleton from "react-loading-skeleton";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import { useAppStore } from "store";
import GeneralPropertiesModal from "./GeneralPropertiesModal";

function ProductGeneralProperties({
  languageVariable,
  total_rating,
  rating_stats,
  recommendation_stats,
}) {
  const { setColorBottomSheet } = useAppStore();
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  const TotalBuyers = useMemo(() => {
    let total = 0;
    rating_stats?.map((s) => (total += s.count));
    return total;
  }, []);
  let recomended =
    recommendation_stats?.find((s) => s.category === "recommend")?.count ?? 0;
  let not_recomended =
    recommendation_stats?.find((s) => s.category === "not_recommend")?.count ??
    0;

  return (
    <>
      <GeneralPropertiesModal
        recommendation_stats={{
          recomended_count: recomended,
          not_recomended_count: not_recomended,
        }}
        rating_stats={rating_stats}
        TotalBuyers={TotalBuyers}
      />
      <HortiznalScrollBar
        onClick={() => {
          setColorBottomSheet({
            is_general_properties: true,
          });
        }}
        id="product-properties-general"
        className={`${
          isRtl ? "flex-row-reverse pl-[90px]" : "flex-row pr-[90px]"
        }  product-properties items-center justify-start w-100 text-[#1d1d1d] text-[9px]`}
      >
        <RatingStars
          color="#1d1d1d"
          initialRating={total_rating}
          readOnly={true}
        />
        <div className="flex-row items-center px-[4px]">
          <span className="bold px-[4px]"> {TotalBuyers}</span>
          {translateFunction("Buyer Rate", languageVariable)}
        </div>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <Suspense
          fallback={
            <div className="view-count flex-row align-center">
              <EyeIcon />

              <span className="m-0">
                <Skeleton className="m-0" count={1} width={20} height={10} />
              </span>
            </div>
          }
        >
          <ProductViews />
        </Suspense>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <div className="flex-row items-center product-property-row">
          <QualityIcon />
          <span>
            {translateFunction("Good Quality Product", languageVariable)}
          </span>
        </div>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <div className="flex-row items-center product-property-row">
          <RecomendedIcon />
          <span>
            {translateFunction("Recommend It By", languageVariable)}
            <span className="m-0 px-[3px]">{recomended}</span>
            <span className="m-0">
              {translateFunction("Buyer", languageVariable)}
            </span>
          </span>
        </div>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <div className="flex-row items-center product-property-row">
          <Flag />
          <span>{translateFunction("Made In Turkey", languageVariable)}</span>
        </div>
      </HortiznalScrollBar>
    </>
  );
}

export default ProductGeneralProperties;
