"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { useState } from "react";
import { GetProductBuyersComment } from "serverRequests/product";
import auth from "services/auth";
import { BuyersRatingBar } from "./BuyerCommentRateInfo";

function ProductBuyersCommentList({
  children,
  offset,
  loadMoreString,
  language,
  productId,
  recommendation_stats,
}) {
  const [commentsNodes, setCommentsNodes] = useState(children);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [hasEnd, setHasEnd] = useState(commentsNodes?.length < 5);
  const [loading, setLoading] = useState(false);
  const GetNextComments = async () => {
    if (!offset || loading) return;
    setLoading(true);
    let response = await GetProductBuyersComment({
      language: language,
      productId: productId,
      filter: null,
      offset: offsetValue,
      userId: auth.UserID(),
    });
    if (response.comments.length === 0 || !offset) {
      setHasEnd(true);
    }
    setCommentsNodes([...commentsNodes, ...response.comments]);
    setOffsetValue(response.offset);
    setLoading(false);
  };
  return (
    <>
      <HortiznalScrollBar
        id="comments-buyers-bar"
        className="flex-row w-full gap-[4px]"
      >
        {children}
        {!hasEnd && offset && (
          <div
            className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[100px] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
            style={{
              position: "relative",
            }}
            onClick={() => {
              if (!loading) GetNextComments();
            }}
          >
            <div className="w-full flex-col h-full justify-center items-center text-[#1d1d1d] light">
              {loading ? <Spinner /> : loadMoreString}
            </div>
          </div>
        )}
      </HortiznalScrollBar>
      <BuyersRatingBar
        recommendation_stats={recommendation_stats}
        language={language}
      />
    </>
  );
}

export default ProductBuyersCommentList;
