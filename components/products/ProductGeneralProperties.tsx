"use client";
import { useMemo } from "react";

import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { useAppStore } from "store";
import GeneralPropertiesModal from "./GeneralPropertiesModal";

function ProductGeneralProperties({
  languageVariable,
  total_rating,
  rating_stats,
  recommendation_stats,
  views,
  sizeFitData,
  good_quality_product = false,
  children,
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
        good_quality_product={good_quality_product}
        views={views}
        recommendation_stats={{
          recomended_count: recomended,
          not_recomended_count: not_recomended,
        }}
        rating_stats={rating_stats}
        total_rating={total_rating}
        TotalBuyers={TotalBuyers}
        sizeFitData={sizeFitData}
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
        }  product-properties items-center justify-start w-full text-[#1d1d1d] text-[9px]`}
      >
        {children}
      </HortiznalScrollBar>
    </>
  );
}

export default ProductGeneralProperties;
