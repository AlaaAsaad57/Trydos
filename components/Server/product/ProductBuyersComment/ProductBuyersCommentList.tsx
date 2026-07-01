"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { useEffect, useState } from "react";
import auth from "services/auth";
import { BuyersRatingBar } from "./BuyerCommentRateInfo";
import { BuyersCommentItem } from "./BuyerCommentItem";
import { useAppStore } from "store";

import BuyersCommentModal from "components/products/BuyersCommentModal";
import { RatingCommentOptions } from "./RatingCommentOptions";
import { fetchData } from "utils/fetchData";
import {
  DELETE_COMMENT_URL,
  UPDATE_COMMENT_URL,
} from "utils/endpointConfig";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

// Internal Next route (same-origin) returning the buyers-comments data page.
async function fetchBuyersComments({
  productId,
  offset,
  filter = null,
  language,
}) {
  const params = new URLSearchParams({ product_id: String(productId) });
  const userId = auth.UserID();
  if (userId) params.set("user_id", String(userId));
  if (offset) params.set("offset", encodeURIComponent(JSON.stringify(offset)));
  if (filter) params.set("filter", String(filter));
  const res = await fetch(
    `/api/products/comments/buyers_comments?${params.toString()}`,
    { headers: { language: language ?? "en" } },
  );
  const json = await res.json();
  return {
    comments: json?.data?.buyers_comments ?? [],
    offset: json?.data?.offset ?? null,
  };
}

function ProductBuyersCommentList({
  comments,
  offset,
  loadMoreString,
  language,
  productId,
  recommendation_stats,
  filterKeys,
}) {
  const {
    BuyerCommentModalOption,
    setBuyerCommentModalOption,
    ColorBottomSheet,
    shouldUpdateComment,
    setShouldUpdateComment,
    patchCommentEntity,
    removeCommentEntity,
  } = useAppStore();
  const [commentsData, setCommentsData] = useState(comments);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [hasEnd, setHasEnd] = useState(commentsData?.length < 5);
  const [loading, setLoading] = useState(false);

  const GetNextComments = async () => {
    if (!offsetValue || loading) return;
    setLoading(true);
    try {
      const response = await fetchBuyersComments({
        productId,
        offset: offsetValue,
        language,
      });
      if (response.comments.length === 0 || !response.offset) setHasEnd(true);
      setCommentsData([...commentsData, ...response.comments]);
      setOffsetValue(response.offset);
    } catch (error) {
      LogError({
        error,
        scenario: "Error In GetNextComments in ProductBuyersCommentList",
      });
    } finally {
      setLoading(false);
    }
  };

  const EditComment = async (comment) => {
    try {
      setLoading(true);
      const res = await fetchData({
        url: UPDATE_COMMENT_URL(comment.id),
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
      // Only mutate local state once the server confirms the write.
      if (!res?.success) {
        setLoading(false);
        return;
      }
      // Optimistic patch from the submitted fields — no re-fetch / setTimeout.
      const patched = {
        comment: comment?.comment,
        star_rating: comment?.star_rating,
        comments_images_customer: comment?.comments_images_customer ?? [],
      };
      // Shared entity → every widget showing this review reflects the edit.
      patchCommentEntity(comment.id, patched);
      setCommentsData((prev) =>
        prev?.map((c) => (c.id === comment.id ? { ...c, ...patched } : c)),
      );
      setBuyerCommentModalOption(null);
      setLoading(false);
      return { comment: { ...comment, ...patched }, id: comment.id };
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
      const res = await fetchData({
        url: DELETE_COMMENT_URL(id),
        method: "DELETE",
        server: "comments",
        reqTitle: REQUESTS_DATA.DELETE_COMMENT,
      });
      // Only remove locally once the server confirms the delete.
      if (!res?.success) {
        setLoading(false);
        return;
      }
      // Shared entity → the deleted review disappears from every widget.
      removeCommentEntity(id);
      setCommentsData((prev) => prev.filter((c) => c.id !== id));
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
    setCommentsData(comments);
  }, [comments]);

  useEffect(() => {
    const refreshComments = async () => {
      try {
        setLoading(true);
        const response = await fetchBuyersComments({
          productId,
          offset: null,
          language,
        });
        setCommentsData(response.comments);
        setOffsetValue(response.offset);
        setHasEnd(response.comments?.length < 5);
      } catch (error) {
        LogError({
          error,
          scenario: "Error In refreshComments in ProductBuyersCommentList",
        });
      } finally {
        setLoading(false);
        setShouldUpdateComment(null);
      }
    };

    if (shouldUpdateComment) {
      refreshComments();
    }
  }, [shouldUpdateComment, productId, language, setShouldUpdateComment]);
  return (
    <>
      <BuyersCommentModal
        productId={productId}
        filters_key={filterKeys}
        deleteComment={deleteComment}
        editComment={EditComment}
      ></BuyersCommentModal>

      <HortiznalScrollBar
        id="comments-buyers-bar"
        className="flex-row w-full gap-[4px]"
      >
        {commentsData?.map((comment) => (
          <BuyersCommentItem
            key={comment.id}
            id={comment.id}
            comment={comment}
            language={language}
          />
        ))}
        {!hasEnd && offsetValue && (
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
