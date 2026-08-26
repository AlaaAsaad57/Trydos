"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import { useEffect, useState } from "react";
import auth from "services/auth";
import { useAppStore } from "store";
import FaqItemComponent from "./FaqItemComponent";
import { FaqItemOptions } from "./FaqItemOptions";
import FaqSectionModal from "./FaqSectionModal";
import { AskInput } from "./FaqAskInput";
import { fetchData } from "utils/fetchData";
import {
  DELETE_COMMENT_URL,
  UPDATE_COMMENT_URL,
} from "utils/endpointConfig";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";
import { useLiveColor, useLiveParam } from "hooks/useLiveColor";

// Internal Next route (same-origin) returning the FAQ-comments data page.
async function fetchFaqComments({
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
    `/api/products/comments/fqa_comments?${params.toString()}`,
    { headers: { language: language ?? "en" } },
  );
  const json = await res.json();
  return {
    comments: json?.data?.fqa_comments ?? [],
    offset: json?.data?.offset ?? null,
  };
}

function FaqQuestionsList({
  comments,
  offset,
  loadMoreString,
  language,
  productId,
  owner_id,
  owner_type,
  color,
  size,
  filterKeys,
}) {
  const {
    BuyerCommentModalOption,
    setBuyerCommentModalOption,
    shouldUpdateComment,
    setShouldUpdateComment,
    ColorBottomSheet,
    setShouldUpdateCommentsCount,
    patchCommentEntity,
    removeCommentEntity,
    appendedFaqIds,
  } = useAppStore();
  // Query-only ?color=/?size= navigations reuse the stale server render, so
  // the server-provided props go stale — track the live values instead
  // (they're stamped into the variant of newly asked questions).
  const liveColor = useLiveColor(color);
  const liveSize = useLiveParam("size", size);
  const [commentsData, setCommentsData] = useState(comments);
  // Questions created this session in any FAQ widget that aren't already in this
  // widget's own list — rendered on top so a new question fans out here too.
  const appendedComments = (appendedFaqIds?.[String(productId)] || []).filter(
    (aid) => !commentsData?.some((c) => c.id === aid),
  );
  const [offsetValue, setOffsetValue] = useState(offset);
  const [hasEnd, setHasEnd] = useState(commentsData?.length < 5);
  const [loading, setLoading] = useState(false);
  const isRtl = language === "ar" || language === "ku";

  const GetNextComments = async () => {
    if (!offsetValue || loading) return;
    setLoading(true);
    try {
      const response = await fetchFaqComments({
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
        scenario: "Error In GetNextComments in FaqQuestionsList",
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
          owner_type: String(comment?.ownerType),
          comments_images_customer: comment?.comments_images_customer ?? [],
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        noMessage: true,
      });
      // Only mutate local state once the server confirms the write.
      if (!res?.success) {
        setLoading(false);
        return;
      }
      // Optimistic patch from the submitted text — no re-fetch / setTimeout.
      const patched = { comment: comment?.comment };
      // Shared entity → every widget showing this question reflects the edit.
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
        scenario: "Error In EditComment in FaqQuestionsList",
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
      // Shared entity → the deleted question disappears from every widget.
      removeCommentEntity(id);
      setCommentsData((prev) => prev.filter((c) => c.id !== id));
      setLoading(false);
      setBuyerCommentModalOption(null);
      setShouldUpdateCommentsCount(true);
      return id;
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In deleteComment in FaqQuestionsList",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    setCommentsData(comments);
  }, [comments]);

  useEffect(() => {
    const refreshFaqComments = async () => {
      try {
        setLoading(true);
        const response = await fetchFaqComments({
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
          scenario: "Error In refreshFaqComments in FaqQuestionsList",
        });
      } finally {
        setLoading(false);
        setShouldUpdateComment(null);
      }
    };

    if (shouldUpdateComment) {
      refreshFaqComments();
    }
  }, [shouldUpdateComment, productId, language, setShouldUpdateComment]);

  return (
    <>
      <FaqSectionModal
        productId={productId}
        filters_key={filterKeys}
        deleteComment={deleteComment}
        editComment={EditComment}
      ></FaqSectionModal>

      <HortiznalScrollBar
        id="comments-buyers-bar"
        className="flex-row w-full gap-[4px]"
      >
        {appendedComments.map((aid) => (
          <FaqItemComponent
            key={aid}
            id={aid}
            comment={{ id: aid }}
            isRtl={isRtl}
            language={language}
            width={90}
          />
        ))}
        {commentsData?.map((comment) => (
          <FaqItemComponent
            key={comment.id}
            id={comment.id}
            comment={comment}
            isRtl={isRtl}
            language={language}
            seller_name={comment.seller_name}
            width={90}
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
      <AskInput
        productId={productId}
        color={liveColor}
        size={liveSize}
        owner_id={owner_id}
        owner_type={owner_type}
        language={language}
        setCommentsData={(e) => {
          setCommentsData([e, ...commentsData]);
        }}
      />
      {!ColorBottomSheet?.is_for_faq &&
        BuyerCommentModalOption &&
        BuyerCommentModalOption?.comment_type === "faq" && (
          <FaqItemOptions
            language={language}
            is_update={BuyerCommentModalOption.option === "Update"}
            is_delete={BuyerCommentModalOption.option === "Delete"}
            comment={BuyerCommentModalOption}
            deleteAction={async (id) => {
              await deleteComment(id);
              setShouldUpdateComment({ fromComments: true });
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

export default FaqQuestionsList;
