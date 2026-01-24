"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { useEffect, useState } from "react";
import {
  GetProductBuyersComment,
  UpdateBuyerComment,
} from "serverRequests/product";
import auth from "services/auth";
import { BuyersRatingBar } from "./BuyerCommentRateInfo";
import { useAppStore } from "store";

import BuyersCommentModal from "components/products/BuyersCommentModal";
import { RatingCommentOptions } from "./RatingCommentOptions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

function ProductBuyersCommentList({
  children,
  offset,
  loadMoreString,
  language,
  productId,
  recommendation_stats,
  filterKeys,
}) {
  const [modalKey, setModalKey] = useState(new Date().getDate());
  const {
    BuyerCommentModalOption,
    setBuyerCommentModalOption,
    ColorBottomSheet,
  } = useAppStore();
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
    setModalKey(new Date().getDate());
  };
  const EditComment = async (comment) => {
    try {
      setLoading(true);
      await fetchData({
        url: `/public_comment/comments/${comment.id}/update`,
        server: "comments",
        method: "PUT",
        body: JSON.stringify({
          text: comment?.comment,
          rating: comment?.star_rating,
          owner_id: String(comment?.ownerID),
          owner_type: comment?.ownerType,
          comments_images_customer: comment?.comments_images_customer ?? [],
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
      });
      let res = await UpdateBuyerComment({
        language: language,
        id: comment.id,
      });

      setCommentsNodes(
        commentsNodes?.map((node) =>
          node.key === BuyerCommentModalOption.id ? res.comment : node,
        ),
      );
      setBuyerCommentModalOption(null);
      setLoading(false);
      setModalKey(new Date().getDate());
      return { commentElement: res.comment, id: comment.id };
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In EditComment in ProductBuyersCommentList",
      });
      setLoading(false);
    }
  };
  const deleteComment = async (id) => {
    try {
      setLoading(true);
      let res = await fetchData({
        url: `/public_comment/comments/${id}/delete`,
        method: "DELETE",
        server: "comments",
        reqTitle: REQUESTS_DATA.DELETE_COMMENT,
      });

      setCommentsNodes(
        commentsNodes.filter((node) => node.key !== BuyerCommentModalOption.id),
      );
      setLoading(false);
      setBuyerCommentModalOption(null);
      return id;
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In deleteComment in ProductBuyersCommentList",
      });
      setLoading(false);
    }
  };
  useEffect(() => {
    setCommentsNodes(children);
  }, [children]);
  return (
    <>
      <BuyersCommentModal
        key={modalKey}
        productId={productId}
        filters_key={filterKeys}
        deleteComment={deleteComment}
        editComment={EditComment}
      ></BuyersCommentModal>

      <HortiznalScrollBar
        id="comments-buyers-bar"
        className="flex-row w-full gap-[4px]"
      >
        {commentsNodes}
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
      {!ColorBottomSheet?.is_buyers_comments &&
        BuyerCommentModalOption &&
        BuyerCommentModalOption?.comment_type === "review" && (
          <RatingCommentOptions
            language={language}
            is_update={BuyerCommentModalOption.option === "Update"}
            is_delete={BuyerCommentModalOption.option === "Delete"}
            comment={BuyerCommentModalOption}
            deleteAction={async (id) => {
              await deleteComment(id);
            }}
            updateAction={async (comment) => {
              await EditComment(comment);
            }}
            handleCloseModal={() => {
              setBuyerCommentModalOption(null);
            }}
            loading={loading}
          />
        )}
    </>
  );
}

export default ProductBuyersCommentList;
