import RatingStars from "components/settings/cards/RatingStars";
import React, { useState } from "react";
import { translateFunction } from "utils/functions";
import CommentIcon from "public/svg/CommentIcon.svg";
import order from "services/order";

function RatingOrderItem({
  productId,
  order_detail_id,
  isRated,
  initialRating,
}) {
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [ratedComplete, setRatedComplete] = useState(isRated);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const inputRef = React.useRef(null);

  const rateOrder = async (e?) => {
    try {
      setLoading(true);
      await order.RateOrderWithhComment({
        comment: comment,
        star_rating: e || rating,
        order_detail_id: order_detail_id,
        productId: productId,
      });
      setRatedComplete(true);
      setLoading(false);
      setShowCommentModal(false);
    } catch (error) {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (showCommentModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCommentModal]);

  const handleOpenModal = () => {
    if (!loading) setShowCommentModal(true);
  };

  const handleCloseModal = () => {
    if (!loading) setShowCommentModal(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && comment.trim()) {
      rateOrder();
    }
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      rateOrder();
    }
  };

  return (
    <div
      className={`${
        loading && "opacity-75 scale-90"
      } flex-col w-auto items-center justify-center z-40 absolute left-[116px] bottom-[12px]`}
    >
      <div className="flex-row items-center justify-center">
        <RatingStars
          readOnly={loading || ratedComplete}
          onRatingChange={(e) => {
            if (!loading && !ratedComplete) {
              setRating(e);
              rateOrder(e);
            }
          }}
        />
        <span className="ligth text-[15px] text-[#8D8D8D] mx-[12px] h-[15px] border-l border-[#8D8D8D80]"></span>
        <div
          className="flex-row gap-[6px] items-center justify-center regular text-[10px] text-[#C4C2C2] cursor-pointer"
          tabIndex={0}
          aria-label="Add Comment"
          onClick={handleOpenModal}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleOpenModal()
          }
          role="button"
        >
          <span>
            <CommentIcon />
          </span>
          <span>{translateFunction("Add Comment…")}</span>
        </div>
      </div>
      {/* Modal */}
      {showCommentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          onClick={handleCloseModal}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl p-6 w-[90vw] max-w-md flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <label
              htmlFor="comment-input"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              {translateFunction("Add your comment")}
            </label>
            <div className="relative flex items-center">
              <input
                id="comment-input"
                ref={inputRef}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full pr-12 pl-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-gray-800 bg-gray-50 shadow-sm"
                placeholder={translateFunction("Type your comment...")}
                aria-label="Comment input"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Submit comment"
                disabled={loading || !comment.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-row"></div>
    </div>
  );
}

export default RatingOrderItem;
