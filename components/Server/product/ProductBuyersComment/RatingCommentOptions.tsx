import { ConfirmModal } from "components/global/ConfirmModal";
import Spinner from "components/global/Spinner";
import UploadImageComponent from "components/Orders/UploadImageComponent";
import RatingStars from "components/settings/cards/RatingStars";
import { useEffect, useRef, useState } from "react";
import { translateFunction } from "utils/functions";

export const RatingCommentOptions = ({
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
          deleteAction(comment.id);
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
          text: comment_str,
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
          text: comment_str,
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999999999]"
          onClick={handleCloseModal}
        />
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999999999] w-full max-w-md mx-4"
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
