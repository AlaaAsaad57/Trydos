import RatingStars from "components/settings/cards/RatingStars";
import React, { useState } from "react";
import { translateFunction } from "utils/functions";

import order from "services/order";
import Spinner from "components/global/Spinner";

function RatingOrderItem({
  productId,
  order_detail_id,
  isRated,
  initialRating,
  lastRatingId = null,
  lastComment = "",
  refresh,
}) {
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState(lastComment || "");
  const [ratedComplete, setRatedComplete] = useState(isRated);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const inputRef = React.useRef(null);

  const rateOrder = async (e?) => {
    try {
      setShowCommentModal(false);
      setLoading(true);
      await order.RateOrderWithhComment({
        comment: comment,
        star_rating: e || rating,
        order_detail_id: order_detail_id,
        productId: productId,
        id: lastRatingId,
      });
      setRatedComplete(true);
      setComment("");
      setLoading(false);
      setShowCommentModal(false);
      refresh();
    } catch (error) {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (showCommentModal && inputRef.current) {
      if (lastComment?.length > 0) {
        inputRef.current.value = lastComment;
      }
      inputRef.current.focus();
    }
  }, [showCommentModal]);

  const handleCloseModal = () => {
    if (loading) return;
    setShowCommentModal(false);
    setRating(initialRating);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && comment.trim()) {
      rateOrder(rating);
    }
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      inputRef.current.focus();
      rateOrder(rating);
    }
  };
  const blurHandler = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!loading) handleCloseModal();
  };
  return (
    <>
      {showCommentModal ? (
        <div
          className="absolute bottom-[-27px] shake left-0 max-w-[200px] z-50 flex items-center justify-center bg-transparent"
          aria-modal="true"
          role="dialog"
          tabIndex={10}
          onClick={handleCloseModal}
        >
          <div
            className="relative bg-transparent rounded-2xl shadow-xl  w-[90vw] max-w-md flex flex-col "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center">
              <input
                id="comment-input"
                ref={inputRef}
                type="text"
                value={comment}
                onBlur={() => {
                  blurHandler();
                }}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full pr-12 pl-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-gray-800 bg-gray-50 shadow-sm"
                placeholder={translateFunction("Add your comment")}
                aria-label="Comment input"
                disabled={loading}
              />
              {
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
              }
            </div>
          </div>
        </div>
      ) : (
        <div className={` flex-col w-auto items-center justify-center z-40`}>
          <div className="flex-row items-center justify-center">
            {!loading ? (
              <RatingStars
                readOnly={loading}
                initialRating={initialRating}
                onRatingChange={(e) => {
                  if (!loading) {
                    setRating(e);
                    setShowCommentModal(true);
                  }
                }}
              />
            ) : (
              <Spinner />
            )}
          </div>
          {/* Modal */}
        </div>
      )}
    </>
  );
}

export default RatingOrderItem;
