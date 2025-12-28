import { LikeButton } from "components/products/FAQSection";
import RatingStars from "components/settings/cards/RatingStars";
import RecomendedIcon from "public/svg/RecomendedIcon";
import NegRecomendedIcon from "public/svg/NegRecomendIcon";
import { translateFunction } from "utils/server";

export const BuyerCommentRateInfo = ({
  language,
  rating,
  recommendation,
  comment,
}) => {
  return (
    <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
      <LikeButton comment={{ ...comment, target_type: "comment" }} />
      <div className="flex-row gap-[4px] text-[9px] text-[#1d1d1d]">
        <RatingStars color="#1d1d1d" initialRating={rating} readOnly={true} />
        <div className="flex-row gap-[6px]">
          {comment?.good_quality_comment && (
            <span>{translateFunction("Good Quality", language)}</span>
          )}
          {comment?.true_size && (
            <span>{translateFunction("True Size", language)}</span>
          )}
        </div>
        {recommendation && (
          <div className="flex-row gap-[4px] text-[#1d1d1d] text-[9px]">
            <RecomendedIcon />
            <span>{translateFunction("Recommend It", language)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BuyersRatingBar = ({ language, recommendation_stats }) => {
  let recomended = recommendation_stats?.find(
    (s) => s.category === "recommend"
  )?.count;
  let not_recomended = recommendation_stats?.find(
    (s) => s.category === "not_recommend"
  )?.count;
  let recomendedPRC = recommendation_stats?.find(
    (s) => s.category === "recommend"
  )?.percentage;
  let not_recomendedPRC = recommendation_stats?.find(
    (s) => s.category === "not_recommend"
  )?.percentage;
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="flex-col w-full mt-[11px] pl-[10px] pr-[10px]">
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  items-center w-full justify-between`}
      >
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          }  regular items-center text-[#1d1d1d] text-[9px] gap-[4px]`}
        >
          <RecomendedIcon />
          <span className="bold ">{recomended}</span>
          <span>{translateFunction("Buyer", language)}</span>
          <span className="bold">
            {translateFunction("Recommend It", language)}
          </span>
        </div>
        <div className="flex-row items-center regular text-[#1d1d1d] text-[9px] gap-[4px]">
          <NegRecomendedIcon />
          <span className="bold ">{not_recomended}</span>
          <span>{translateFunction("Buyer", language)}</span>
          <span className="bold">
            {translateFunction("Dont Recommend It", language)}
          </span>
        </div>
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } rounded-[5px] w-full h-[4px] bg-[#FF6200] mt-[8px]`}
      >
        <div
          className={`bg-[#068D06] rounded-[5px] h-[4px]`}
          style={{
            width: `${recomendedPRC}%`,
          }}
        />
      </div>
    </div>
  );
};
