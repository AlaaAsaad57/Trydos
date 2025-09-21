import Image from "next/image";
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
function CommentItem({
  custmerId,
  name,
  photo,
  date,
  text,
  isPending,
  isError,
  resendComment,
}: CommentItemPropsType) {
  const { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const userData = getCookie(COOKIE_NAMES.USER_DATA);
  // @ts-ignore
  const isOwner = userData.id === custmerId;
  // @ts-ignore
  const isVerify = userData.is_phone_verified !== 0;

  const handleDeleteComment = async () => {
    setDeleteLoading(true);
    try {
      // let response = await fetchData({
      //   url: "",
      //   reqTitle: { reqTitle: "", code: 1000 },
      //   method: "POST",
      //   server: "market",
      //   body: {},
      // });
      // // @ts-ignore
      // if (!response.success) {
      //   // @ts-ignore
      //   throw new Error(response.message);
      // }
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
        className="comment-item"
        style={{
          opacity: isPending === true ? "1" : isPending === null ? "1" : "0.7",
          backgroundColor: isError ? "#ffd6d6" : "#f8f8f8",
          position: "relative",
        }}
      >
        {isError && (
          <Loading
            style={{ position: "absolute", right: "10px", bottom: "10px" }}
            onClick={() => {
              resendComment();
            }}
          />
        )}
        <div className="comment-photo">
          <Image src={photo} width={20} height={20} alt={name} />
        </div>
        <div className="comment-content">
          <div className="comment-source" data-cy="Source-Of-Comment">
            {name}
          </div>
          <div className="comment-text">{text}</div>
        </div>
        <div className="comment-date" data-cy="Date-Of-Comment">
          {date}
        </div>
        {isOwner && !isError && isPending && (
          <div
            className="comment-delete-btn"
            style={{
              position: "absolute",
              top: "45px",
              right: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
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
