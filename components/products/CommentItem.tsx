import React, { useState } from "react";
import "styles/comment.css";
import Loading from "public/svg/loading.svg";
import { CommentItemPropsType } from "models/componentType/CommentItemPropsType";
import { getCookie, COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { ConfirmModal } from "components/global/ConfirmModal";
import DeleteCommentIcon from "public/svg/DeleteCommentIcon.svg";
import { showErrorNotification } from "store/notifications/reducer";
import { useParams } from "node_modules/next/navigation";
import { translateFunction } from "utils/functions";
import { FaqItem } from "./FAQSection";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
function CommentItem({
  custmerId,
  name,
  photo,
  date,
  text,
  isPending,
  isError,
  resendComment,
  comment,
}: CommentItemPropsType) {
  const { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { editInfo, SelectedProduct } = useAppStore();
  const userData = getCookie(COOKIE_NAMES.USER_DATA);
  // @ts-ignore
  const isOwner = String(userData?.id) === String(custmerId);
  // @ts-ignore
  const isVerify = userData?.is_phone_verified !== 0;

  const handleDeleteComment = async () => {
    setDeleteLoading(true);
    try {
      let response = await fetchData({
        url: `/public_comment/comments/${comment.id}/delete`,
        reqTitle: { reqTitle: "DELETE_COMMENT", code: 1000 },
        method: "DELETE",
        server: "comments",
      });
      // @ts-ignore
      if (!response.success) {
        // @ts-ignore
        throw new Error(response.message);
      }
      editInfo({
        fqa_questions: {
          ...SelectedProduct,
          comments: SelectedProduct.fqa_questions.comments?.filter(
            (s) => s.id !== comment.id
          ),
          total: SelectedProduct.fqa_questions.total - 1,
        },
      });
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!isVerify) {
      showErrorNotification(
        translateFunction("Please verify the number first.", languageVariable)
      );
      return;
    }
    setShowDeleteModal(true);
  };

  return (
    <>
      <div
        className={`${
          !isPending && !isError && "opacity-70"
        } relative flex w-full`}
      >
        {isError && (
          <Loading
            className="absolute z-50 right-[10px] top-[45px]"
            style={{ position: "absolute", right: "10px", bottom: "10px" }}
            onClick={() => {
              resendComment();
            }}
          />
        )}
        {isOwner && !isError && isPending && (
          <div
            className="comment-delete-btn absolute z-50 right-[10px] top-[45px] cursor-pointer flex items-center justify-center w-[20px] h-[20px]"
            style={{
              position: "absolute",
              borderRadius: "50%",
              transition: "background-color 0.2s ease",
            }}
            onClick={handleDeleteClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowDeleteModal(true);
              }
            }}
            tabIndex={0}
            aria-label="Delete comment"
            role="button"
          >
            <DeleteCommentIcon
              style={{
                filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))",
              }}
            />
          </div>
        )}
      </div>
      <FaqItem
        isError={isError}
        isFull={true}
        comment={comment}
        language={languageVariable}
      />
      {showDeleteModal && (
        <ConfirmModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteComment}
          loading={deleteLoading}
          type="Delete"
          showModal={showDeleteModal}
          confirmMessage="Are you sure you want to delete this comment?"
          confirmTilte={"Delete Comment"}
        />
      )}
    </>
  );
}

export default CommentItem;
