import BottomSheet from "components/global/BottomSheet";
import React, { useMemo } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import RateIcon from "public/svg/RateIconProperty";
import RatingStars from "components/settings/cards/RatingStars";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import ProductViews from "./ProductViews";
import SolidRecomendIcon from "public/svg/product/SolidRecomendIcon";
import QualityIcon from "public/svg/product/QualityIcon";
import RecomendedIcon from "public/svg/RecomendedIcon";
import NegRecomendedIcon from "public/svg/NegRecomendIcon";

function GeneralPropertiesModal({
  rating_stats,
  TotalBuyers,
  recommendation_stats,
  total_rating,
}) {
  const { ColorBottomSheet, setColorBottomSheet, language } = useAppStore();
  let reviews_arr = [
    { value: 70, title: "True" },
    { value: 55, title: "Small" },
    { value: 24, title: "Large" },
    { value: 99, title: "Big" },
  ];
  const rating_arr_text = [
    { rating: 1, title: "Very Bad", count: 1 },
    { rating: 2, title: "Bad", count: 2 },
    { rating: 3, title: "Normal", count: 65 },
    { rating: 4, title: "Good", count: 100 },
    { rating: 5, title: "Very Good", count: 200 },
  ];
  const rating_arr = rating_stats.map((s) => ({
    rating: s.ratingGroup,
    count: s.count,
    title: rating_arr_text.find((_t) => _t.rating === s.ratingGroup)?.title,
  }));

  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_general_properties && (
        <BottomSheet
          height={90}
          isOpen={ColorBottomSheet?.is_general_properties}
          onClose={() => {
            setColorBottomSheet(false);
          }}
        >
          <div className="w-full px-[12px] h-auto pb-[80px] flex-col">
            <div className="flex-col gap-[6px]">
              <RateIcon />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction("Buyers Product Rate", language)}
              </span>
              <p className="text-[11px] text-[#1d1d1d] regular gap-[4px] inline">
                {translateFunction(
                  "All Reviews Are Genuine From Customers Who Purchased And Actually Received The Product Through",
                  language
                )}
                <span className="bold px-[4px]">trydos</span>
              </p>
            </div>
            <div className="w-full bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>
            <div className="flex-col gap-[2px]">
              <RatingStars
                size={20}
                color="#1d1d1d"
                initialRating={total_rating}
                readOnly={true}
              />
              <HortiznalScrollBar
                id="product-properties-general-modal"
                className="flex-row pr-[90px] product-properties items-center justify-start w-100 text-[#1d1d1d] text-[11px] [&>*]:!text-[11px]"
              >
                <div className="flex-row items-center">
                  <span className="bold pr-[4px]"> {TotalBuyers}</span>
                  {translateFunction("Buyer Rate", language)}
                </div>

                <span className="px-[5px] text-[11px] text-[#1d1d1d]">|</span>
                <div className="flex-row  items-center product-property-row">
                  <QualityIcon />
                  <span className="text-[11px]">
                    {translateFunction("Overall Good Quality", language)}
                  </span>
                </div>
                <span className="px-[5px] text-[11px] text-[#1d1d1d]">|</span>
                <ProductViews />
                <span className="px-[4px] flex">
                  {translateFunction("Views Product", language)}
                </span>
              </HortiznalScrollBar>
              <div className="flex-col gap-[12px] mt-[10px]">
                {rating_arr.map((s, i) => (
                  <div className="flex-row items-center gap-[12px]" key={i}>
                    <RatingStars
                      size={14}
                      color="#1d1d1d"
                      readOnly={true}
                      initialRating={s.rating}
                    />
                    <div className="regular text-[11px] text-[#1d1d1d] gap-[4px] flex-row items-center">
                      <span className="bold">{s.count}</span>
                      <span>{translateFunction(s.title, language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>
            <div className="flex-col regular text-[13px] text-[#1d1d1d] gap-[12px]">
              <div className="flex">
                {translateFunction(
                  "Buyers Reviews On Product Sizing",
                  language
                )}
              </div>
              <div className="flex-col gap-[4px]">
                {reviews_arr.map((s) => (
                  <ReviewProgress title={s.title} value={s.value} />
                ))}
              </div>
            </div>
            <div className="w-full bg-[#FFFFFF] py-[11px]">
              <hr className="text-[#D3D3D37f] h-[1px] bg-[#D3D3D37f] mt-0 w-full px-[10px]" />
            </div>
            <div className="flex-col gap-[7px]">
              <SolidRecomendIcon />
              <span className="flex text-[13px] text-[#1d1d1d] regular">
                {translateFunction("Buyers Product Recommend To Buy", language)}
              </span>
              <span className="inline text-[11px] text-[#1d1d1d] regular ">
                {translateFunction(
                  "All Recommendations Are Genuine From Customers Who Purchased And Actually Received The Product Through",
                  language
                )}
                <span className="bold px-[4px]">trydos</span>
              </span>
              <BuyersRatingBar
                recommendation_stats={recommendation_stats}
                language={language}
              />
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export default GeneralPropertiesModal;

const ReviewProgress = ({ value, title }) => {
  return (
    <div className="flex-row gap-[14px] min-w-[280px] w-full">
      <div className="flex-row  w-[72%] max-w-[72%] h-[14px] rounded-[5px] bg-[#FCFCFC] relative flex-1 ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="14"
          viewBox="0 0 100% 14"
          className="absolute top-0 left-0"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100%)"
            height="13.5"
            rx="2.25"
            fill="none"
            stroke="#d3d3d3"
            strokeWidth="0.5"
          />
        </svg>
        <div
          className={`h-[14px] rounded-[5px] flex bg-[#1d1d1d]`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
      <div className="flex-row items-center text-[#1d1d1d] text-[11px] regular gap-[6px] whitespace-nowrap">
        {value}%
      </div>
      <span className="bold">{title}</span>
    </div>
  );
};
const BuyersRatingBar = ({ language, recommendation_stats }) => {
  let recomended = recommendation_stats.recomended_count;
  let not_recomended = recommendation_stats?.not_recomended_count;
  let recomendedPRC = (
    (100 * recomended) /
    (recomended + not_recomended)
  ).toFixed(0);
  return (
    <div className="flex-col w-full mt-[11px] ">
      <div className="flex-row items-center w-full justify-between">
        <div
          className={`flex-col regular  text-[#1d1d1d] text-[9px] gap-[4px]`}
        >
          <div className={`flex-row`}>
            <RecomendedIcon />
            <span className="bold px-[4px]">{recomended}</span>
            <span>{translateFunction("Buyer", language)}</span>
          </div>
          <span className="bold w-full flex justify-end px-[4px]">
            <NegRecomendedIcon className="opacity-0" />

            {translateFunction("Recommend It", language)}
          </span>
        </div>
        <div
          className={`flex-col  regular  text-[#1d1d1d] text-[9px] gap-[4px]`}
        >
          <div className="flex-row">
            <NegRecomendedIcon />
            <span className="bold px-[4px]">{not_recomended}</span>
            <span>{translateFunction("Buyer", language)}</span>
          </div>
          <span className={`w-full flex justify-end bold px-[4px]`}>
            <NegRecomendedIcon className="opacity-0" />
            {translateFunction("Dont Recommend It", language)}
          </span>
        </div>
      </div>
      <div className="flex-row rounded-[5px] w-full h-[6px] bg-[#FF6200] mt-[6px] relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          className="absolute top-0 left-0"
          height="6"
        >
          <rect
            x="0.25"
            y="0.25"
            width="100%"
            height="5.5"
            rx="2.75"
            fill="none"
            stroke="#1d1d1d"
            strokeWidth="0.5"
          />
        </svg>

        <div
          className={`bg-[#068D06] rounded-[5px] h-[6px]`}
          style={{
            width: `${recomendedPRC}%`,
          }}
        />
      </div>
    </div>
  );
};
