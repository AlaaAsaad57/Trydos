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
  variant,
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
        variant: variant,
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
      if (inputRef?.current) inputRef.current?.focus();
    }
  }, [showCommentModal]);

  const handleCloseModal = () => {
    if (loading) return;
    setShowCommentModal(false);
    setRating(initialRating);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && comment.trim() && rating > 0) {
      rateOrder(rating);
    }
  };

  const handleSubmit = () => {
    if (comment.trim() && rating > 0) {
      rateOrder(rating);
    }
  };

  const isSubmitDisabled = !comment.trim() || rating === 0 || loading;

  return (
    <>
      <div
        className="flex flex-col items-center justify-center w-full space-y-4"
        onClick={() => {
          if (!loading) {
            document.documentElement.scrollTop = 0;
            document.querySelector("#OrderDetails").scrollTop = 0;
            setShowCommentModal(true);
          }
        }}
      >
        <div className="flex items-center justify-center">
          {!loading ? (
            <RatingStars readOnly={true} initialRating={initialRating} />
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      {showCommentModal && (
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
            <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base text-gray-800 bg-gray-50 transition-colors"
                  placeholder={translateFunction("Add your comment")}
                  aria-label="Comment input"
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
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
                    translateFunction("Submit Rating")
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default RatingOrderItem;
