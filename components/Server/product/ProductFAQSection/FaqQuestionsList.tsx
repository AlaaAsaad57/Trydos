"use client";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Spinner from "components/global/Spinner";
import React, { useEffect, useState } from "react";
import {
  GetProductFaqQuestions,
  GetFaqItemElement,
} from "serverRequests/product";
import auth from "services/auth";
import { useAppStore } from "store";
import { FaqItemOptions } from "./FaqItemOptions";
import FaqSectionModal from "./FaqSectionModal";
import { AskInput } from "./FaqAskInput";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError } from "utils/functions";

function FaqQuestionsList({
  children,
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
  const [modalKey, setModalKey] = useState(new Date().getDate());
  const {
    BuyerCommentModalOption,
    setBuyerCommentModalOption,
    shouldUpdateComment,
    setShouldUpdateComment,
    ColorBottomSheet,
    setShouldUpdateCommentsCount,
  } = useAppStore();
  const [commentsNodes, setCommentsNodes] = useState(children);
  const [offsetValue, setOffsetValue] = useState(offset);
  const [hasEnd, setHasEnd] = useState(commentsNodes?.length < 5);
  const [loading, setLoading] = useState(false);

  const GetNextComments = async () => {
    if (!offset || loading) return;
    setLoading(true);

    let response = await GetProductFaqQuestions({
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
          owner_type: String(comment?.ownerType),
          comments_images_customer: comment?.comments_images_customer ?? [],
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        noMessage: true,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      let res = await GetFaqItemElement({
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
      setShouldUpdateComment({ id: comment.id });
      return { commentElement: res.comment, id: comment.id };
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
      setShouldUpdateComment({ id: id });
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
    setCommentsNodes(children);
  }, [children]);

  useEffect(() => {
    const refreshFaqComments = async () => {
      try {
        setLoading(true);
        const response = await GetProductFaqQuestions({
          language,
          productId,
          filter: null,
          offset: null,
          userId: auth.UserID(),
        });
        setCommentsNodes(response.comments);
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
  }, [shouldUpdateComment, language, productId, setShouldUpdateComment]);

  return (
    <>
      <FaqSectionModal
        key={modalKey}
        productId={productId}
        filters_key={filterKeys}
        deleteComment={deleteComment}
        editComment={EditComment}
      ></FaqSectionModal>

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
      <AskInput
        productId={productId}
        color={color}
        size={size}
        owner_id={owner_id}
        owner_type={owner_type}
        language={language}
        setCommentsData={(e) => {
          setCommentsNodes([e, ...commentsNodes]);
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
