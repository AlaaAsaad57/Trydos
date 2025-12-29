"use client";
import Spinner from "components/global/Spinner";
import DeleteCommentIcon from "public/svg/DeleteCommentIcon";
import LanguageIcon from "public/svg/LanguageIcon";
import PenIcon from "public/svg/PenIcon";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { translateFunction } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import ThreePointsIcon from "public/svg/threepoints";
import UploadImageComponent from "components/Orders/UploadImageComponent";
import RatingStars from "components/settings/cards/RatingStars";
import { ConfirmModal } from "components/global/ConfirmModal";
import { DeleteComment, UpdateBuyerComment } from "serverRequests/product";
import { fetchData } from "utils/fetchData";
import { useRouter } from "next/navigation";

function BuyersCommentMenu({
  id,
  ownerID,
  ownerType,
  isRtl,
  language,
  isOwner,
  comment,
}) {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState("");
  const [translatedComment, setTranslatedComment] = useState<string | null>(
    null
  );
  const [originalComment, setOriginalComment] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCommentTranslated, setIsCommentTranslated] = useState(false);
  const router = useRouter();
  const EditComment = async (comment_var) => {
    try {
      setLoading(true);
      let res = await UpdateBuyerComment({
        payload: JSON.stringify({
          text: comment_var.comment,
          rating: comment_var.star_rating,
          owner_id: String(ownerID),
          owner_type: ownerType,
          comments_images_customer: comment_var?.comments_images_customer ?? [],
        }),
        language: language,
        id: comment_var.id,
      });

      if (!res.success) throw new Error(res.message);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isPending && loading) {
      setOpenModal("");
      setMenuOpen(false);
      setLoading(false);
    }
  }, [isPending, loading]);
  const deleteComment = async (comment_var) => {
    try {
      setLoading(true);
      let res = await DeleteComment({ id: comment_var.id, language: language });
      if (!res.success) throw new Error(res.message);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setLoading(false);
    }
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTranslateComment = async () => {
    if (isCommentTranslated) {
      setIsCommentTranslated(false);
      setTranslatedComment(null);
      setMenuOpen(false);
      document.querySelector<HTMLDivElement>(
        `#comment-${comment.id}-text`
      ).innerText = comment?.comment ?? "";
      return;
    }

    try {
      setTranslateLoading(true);
      const response = await fetchData({
        url: `/public_comment/comments/${id}/translate`,
        method: "POST",
        body: JSON.stringify({
          target_language: language,
          translate_type: "comment",
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        server: "comments",
      });

      if (!response.success) throw new Error(response.message);

      if (response?.success) {
        // Store original text from API response or comment
        const original = response.original_text;
        if (!originalComment && original) {
          setOriginalComment(original);
        }

        // Check if it's already in the target language
        if (response.translated_text) {
          setTranslatedComment(response.translated_text);
          setIsCommentTranslated(true);
        }

        document.querySelector<HTMLDivElement>(
          `#comment-${comment.id}-text`
        ).innerText = response.translated_text;
      }
      setMenuOpen(false);
    } catch (error) {
      console.error("Error translating comment:", error);
    } finally {
      setTranslateLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  return (
    <>
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
          className={`${
            isOwner ? "top-[0px]" : "top-[20px]"
          }  absolute z-[80]   bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]`}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={handleTranslateComment}
            disabled={translateLoading}
          >
            <LanguageIcon className="w-4 h-4" />
            {translateLoading ? (
              <Spinner />
            ) : isCommentTranslated ? (
              translateFunction("Show Original", language)
            ) : (
              translateFunction("Translate", language)
            )}
          </button>
          {isOwner && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setOpenModal("Update");
                setMenuOpen(false);
              }}
              disabled={loading}
            >
              <PenIcon className="w-4 h-4" />
              {loading ? "Updating..." : translateFunction("Edit")}
            </button>
          )}
          {isOwner && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setOpenModal("Delete");
                setMenuOpen(false);
              }}
            >
              <DeleteCommentIcon className="w-4 h-4" />
              {translateFunction("Delete")}
            </button>
          )}
        </div>
      )}
      {openModal === "" && (
        <div
          className="comment-menu-btn absolute z-50 top-[45px] cursor-pointer flex items-center justify-center w-[20px] h-[20px]"
          style={{
            borderRadius: "50%",
            transition: "background-color 0.2s ease",
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
          onClick={handleMenuToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleMenuToggle();
          }}
          tabIndex={0}
          role="button"
          aria-label="Comment options menu"
        >
          <ThreePointsIcon
            style={{
              filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))",
            }}
          />
        </div>
      )}
      {openModal !== "" && (
        <RatingCommentOptions
          language={language}
          is_update={openModal === "Update"}
          is_delete={openModal === "Delete"}
          comment={comment}
          deleteAction={async (e) => {
            await deleteComment(e);
          }}
          updateAction={async (e) => {
            await EditComment(e);
          }}
          handleCloseModal={() => {
            setOpenModal("");
          }}
          loading={loading}
        />
      )}
    </>
  );
}

export default BuyersCommentMenu;

const RatingCommentOptions = ({
  is_delete,
  is_update,
  deleteAction,
  updateAction,
  comment,
  handleCloseModal,
  loading,
  language,
}: {
  is_delete?: boolean;
  is_update: boolean;
  deleteAction: (comment: any) => Promise<any>;
  updateAction: (comment: any) => Promise<any>;
  comment: any;
  handleCloseModal: () => void;
  loading: boolean;
  language: string;
}) => {
  const [rating, setRating] = useState(comment.star_rating);
  const [comment_str, setComment] = useState(comment.comment);
  const inputRef = useRef(null);
  const [images, setImages] = useState<string[]>(
    comment?.comments_images_customer || []
  );
  const [loadingImage, setLoadingImage] = useState(false);
  useEffect(() => {
    if (comment && is_update) {
      inputRef.current.value = comment.comment;
    }
    if (inputRef?.current) inputRef.current?.focus();
  }, [is_update]);

  if (is_delete) {
    return (
      <ConfirmModal
        onCancel={() => handleCloseModal()}
        onConfirm={() => {
          deleteAction(comment);
        }}
        loading={loading}
        type="Delete"
        showModal={is_delete}
        confirmMessage="Are you sure you want to delete this comment?"
        confirmTilte={"Delete Comment"}
      />
    );
  }
  if (is_update) {
    const handleInputKeyDown = (
      e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (e.key === "Enter" && comment_str.trim() && rating > 0) {
        updateAction({
          ...comment,
          comment: comment_str,
          star_rating: rating,
          rating: rating,
          comments_images_customer: images,
        });
      }
    };
    const handleSubmit = () => {
      if (comment_str.trim() && rating > 0) {
        updateAction({
          ...comment,
          comment: comment_str,
          star_rating: rating,
          rating: rating,
          comments_images_customer: images,
        });
      }
    };
    const isChanged = () => {
      if (
        comment.comment === comment_str &&
        rating === comment.star_rating &&
        JSON.stringify(images) ===
          JSON.stringify(comment?.comments_images_customer || [])
      )
        return false;
      return true;
    };
    const isSubmitDisabled = loading || !isChanged();
    const isRtl = language === "ar" || language === "ku";
    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleCloseModal}
        />
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translateFunction("Rate Your Experience")}
              </h3>
              <p className="text-sm text-gray-600">
                {translateFunction("Share your thoughts about this product")}
              </p>
            </div>

            {/* Rating Stars */}
            <div className="flex justify-center">
              <RatingStars
                readOnly={loading}
                initialRating={Number(rating)}
                size={40}
                onRatingChange={(e) => {
                  if (!loading) {
                    setRating(Number(e));
                  }
                }}
              />
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <label
                htmlFor="comment-input"
                className="block text-sm font-medium text-gray-700"
              >
                {translateFunction("Your Comment")}
              </label>
              <textarea
                id="comment-input"
                ref={inputRef}
                value={comment_str}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className={`${
                  isRtl ? "text-right" : "text-left"
                } w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base text-gray-800 bg-gray-50 transition-colors`}
                placeholder={translateFunction("Add your comment")}
                aria-label="Comment input"
                disabled={loading}
                rows={3}
              />
            </div>
            {/* Upload Images */}

            <UploadImageComponent
              removeImageAction={async (img: string) => {
                setImages(images.filter((im) => im !== img));
              }}
              images={images}
              setImages={setImages}
              isForRating={true}
              loading={loadingImage}
              setLoading={setLoadingImage}
            />
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-[10px]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                disabled={loading}
              >
                {translateFunction("Cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 ${
                  isSubmitDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300"
                }`}
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  translateFunction("Update Rating")
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
};
