"use client";
import React, { useEffect, useRef, useState } from "react";
import BuyersCommentIcon from "public/svg/product/BuyersCommentsIcon";
import { translateFunction } from "utils/functions";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import { convertTextToXFormat, formatTime, GetImageUrl } from "utils/tinyUtils";
import profilePng from "public/images/profileNo.png";
import RatingStars from "components/settings/cards/RatingStars";
import RecomendedIcon from "public/svg/RecomendedIcon";
import NegRecomendedIcon from "public/svg/NegRecomendIcon";
import { useAppStore } from "store";
import BuyersCommentModal from "./BuyersCommentModal";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import Spinner from "components/global/Spinner";
import { ConfirmModal } from "components/global/ConfirmModal";
import ThreePointsIcon from "public/svg/threepoints";
import DeleteCommentIcon from "public/svg/DeleteCommentIcon";
import PenIcon from "public/svg/PenIcon";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";
import { LikeButton } from "./FAQSection";
import auth from "services/auth";
import LanguageIcon from "public/svg/LanguageIcon";
import UploadImageComponent from "components/Orders/UploadImageComponent";
function ProductsBuyersComments({
  lang,
  comments,
  product_id,
  recommendation_stats,
}) {
  const [country, language] = lang.split("-");
  const { ColorBottomSheet, setColorBottomSheet, SelectedProduct, editInfo } =
    useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const commentsData =
    SelectedProduct?.buyers_comment?.comments ?? comments.comments ?? [];
  const [offset, setOffset] = useState(comments.offset);
  const [loading, setLoading] = useState(false);
  const loadMore = async (filter = null) => {
    try {
      setLoading(true);
      let data = await fetchData({
        url: `/api/products/comments/buyers_comments?user_id=${auth.UserID()}&product_id=${product_id}&offset=${JSON.stringify(
          offset
        )}`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.COMMENT_DATA_REQUEST,
      });
      editInfo({
        buyers_comment: {
          ...SelectedProduct.buyers_comment,
          comments: [...commentsData, ...data?.buyers_comment],
          offset: data?.data?.offset,
          total: data.data?.total,
        },
      });
      setOffset(data?.data?.offset);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  if (comments.comments?.length === 0) return <></>;
  return (
    <>
      {ColorBottomSheet && ColorBottomSheet?.is_buyers_comments && (
        <BuyersCommentModal
          comments={comments.comments}
          total={comments?.total}
          offset={comments?.offset}
        />
      )}
      <div className={` w-full flex-col`}>
        <div
          className={`${isRtl && "items-end"} flex-col px-[10px]`}
          onClick={() => {
            setColorBottomSheet({
              is_buyers_comments: true,
            });
          }}
        >
          <BuyersCommentIcon />
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex-row gap-[11px] items-baseline text-[#1d1d1d] regular text-[11px]`}
          >
            <span>{translateFunction("Buyers Comment", language)}</span>
            <svg
              id="Group_14553"
              data-name="Group 14553"
              xmlns="http://www.w3.org/2000/svg"
              width="9.996"
              height="9.996"
              viewBox="0 0 9.996 9.996"
            >
              <path
                id="Subtraction_1"
                data-name="Subtraction 1"
                d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
                transform="translate(0 1.969)"
                fill="#c4c2c2"
              />
              <path
                id="Path_21380"
                data-name="Path 21380"
                d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
                transform="translate(-0.332 0.375)"
                fill="#c4c2c2"
              />
              <rect
                id="Rectangle_4714"
                data-name="Rectangle 4714"
                width="9.61"
                height="9.996"
                transform="translate(0.386)"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <HortiznalScrollBar
          id="comments-buyers-bar"
          className="flex-row w-full gap-[4px]"
        >
          {commentsData?.map((s, i) => {
            return <RateCommentItem language={language} comment={s} key={i} />;
          })}
          {comments.total > commentsData?.length && (
            <div
              className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[100px] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
              style={{
                position: "relative",
              }}
              onClick={() => {
                if (!loading) loadMore();
              }}
            >
              <div className="w-full flex-col h-full justify-center items-center text-[#1d1d1d] light">
                {loading ? <Spinner /> : translateFunction("Load More")}
              </div>
            </div>
          )}
        </HortiznalScrollBar>
        <BuyersRatingBar
          recommendation_stats={recommendation_stats}
          language={language}
        />
      </div>
    </>
  );
}

export default ProductsBuyersComments;

export const RateCommentItem = ({ comment, language, width = 90 }) => {
  const { SelectedProduct, editInfo } = useAppStore();
  const userData: any = getCookie(COOKIE_NAMES.USER_DATA);

  const isOwner = String(userData?.id) === String(comment.customer.id);
  const [openModal, setOpenModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCommentTranslated, setIsCommentTranslated] = useState(false);
  const [translatedComment, setTranslatedComment] = useState<string | null>(
    null
  );
  const [originalComment, setOriginalComment] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);

  const EditComment = async (comment_var) => {
    try {
      setLoading(true);
      let res = await fetchData({
        url: `/public_comment/comments/${comment_var.id}/update`,
        method: "PUT",
        body: JSON.stringify({
          text: comment_var.comment,
          rating: comment_var.star_rating,
          owner_id: String(SelectedProduct?.owner_id),
          owner_type: SelectedProduct?.owner_type,
          comments_images_customer: comment_var?.comments_images_customer ?? [],
        }),
        reqTitle: REQUESTS_DATA.UPDATE_COMMENT,
        server: "comments",
      });
      if (!res.success) throw new Error(res.message);
      editInfo({
        buyers_comment: {
          ...SelectedProduct.buyers_comment,
          comments: SelectedProduct.buyers_comment?.comments?.map((s) =>
            s.id === comment_var.id ? comment_var : s
          ),
        },
      });

      setLoading(false);
      setOpenModal("");
      setMenuOpen(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const deleteComment = async (comment_var) => {
    try {
      setLoading(true);
      let res = await fetchData({
        url: `/public_comment/comments/${comment_var.id}/delete`,
        reqTitle: { reqTitle: "DELETE_COMMENT", code: 1000 },
        method: "DELETE",
        server: "comments",
      });
      if (!res.success) throw new Error(res.message);
      editInfo({
        buyers_comment: {
          ...SelectedProduct.buyers_comment,
          comments: SelectedProduct.buyers_comment?.comments?.filter(
            (s) => s.id !== comment_var.id
          ),
        },
      });
      setLoading(false);
      setOpenModal("");
      setMenuOpen(false);
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
      return;
    }

    try {
      setTranslateLoading(true);
      const response = await fetchData({
        url: `/public_comment/comments/${comment.id}/translate`,
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
        const original = response.original_text || comment?.comment || null;
        if (!originalComment && original) {
          setOriginalComment(original);
        }

        // Check if it's already in the target language
        if (response.translated_text) {
          setTranslatedComment(response.translated_text);
          setIsCommentTranslated(true);
        }
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
  const renderTextWithLinks = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${width}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
      style={{
        position: "relative",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
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
      <div className="w-full flex-col">
        <div className="flex-row items-center">
          <div className="comment-photo">
            <Image
              src={GetImageUrl(comment?.customer?.image) ?? profilePng}
              width={20}
              height={20}
              alt={comment?.customer?.name}
            />
          </div>
          <div className="comment-content capitalize mx-[10px]">
            <div
              className="comment-source text-[#1D1D1D] text-[9px] regular"
              data-cy="Source-Of-Comment"
            >
              {convertTextToXFormat(comment?.customer?.name)}
            </div>
          </div>
        </div>
        <span className="medium text-[#1d1d1d] text-[9px] mt-[5px]">
          {comment?.variant}
        </span>
        <div
          className="comment-date text-[9px]"
          data-cy="Date-Of-Comment"
          style={{
            right: isRtl ? "initial" : "10px",
            left: isRtl ? "10px" : "initial",
          }}
        >
          {formatTime(comment?.created_at)}
        </div>
        <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
          {renderTextWithLinks(
            isCommentTranslated && translatedComment
              ? translatedComment
              : comment?.comment
          )}
        </div>
      </div>
      <BuyerCommentRateInfo
        language={language}
        comment={comment}
        rating={comment.star_rating}
        recommendation={comment?.recommendation}
        key={comment.star_rating}
      />
    </div>
  );
};

const BuyerCommentRateInfo = ({
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

const BuyersRatingBar = ({ language, recommendation_stats }) => {
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

const RatingCommentOptions = ({
  is_delete,
  is_update,
  deleteAction,
  updateAction,
  comment,
  handleCloseModal,
  loading,
}: {
  is_delete?: boolean;
  is_update: boolean;
  deleteAction: (comment: any) => Promise<any>;
  updateAction: (comment: any) => Promise<any>;
  comment: any;
  handleCloseModal: () => void;
  loading: boolean;
}) => {
  const { language } = useAppStore();
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
