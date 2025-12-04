import RatingStars from "components/settings/cards/RatingStars";
import React, { useState } from "react";
import { translateFunction } from "utils/functions";

import order from "services/order";
import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import storyService from "services/story";
import UploadImageOrder from "public/svg/UploadImageOrder";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import UploadImageComponent from "./UploadImageComponent";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

function RatingOrderItem({
  productId,
  order_detail_id,
  isRated,
  initialRating,
  lastRatingId = null,
  lastComment = "",
  refresh,
  variant,
  comments_images_customer = [],
  seller_id = null,
  setShowCommentModal,
  loading,
  setLoading,
}) {
  const { ActivePacks, language } = useAppStore();
  const [rating, setRating] = useState(initialRating);

  const [comment, setComment] = useState(lastComment || "");
  const [ratedComplete, setRatedComplete] = useState(isRated);

  const inputRef = React.useRef(null);
  const [images, setImages] = useState<string[]>(comments_images_customer);
  const [loadingImage, setLoadingImage] = useState(false);

  const rateOrder = async (e?) => {
    try {
      setLoading(true);
      await order.RateOrderWithhComment({
        comment: comment,
        star_rating: e || rating,
        order_detail_id: order_detail_id,
        productId: productId,
        id: lastRatingId,
        variant: variant,
        owner_id: ActivePacks?.owner_id,
        owner_type: ActivePacks?.owner_type,
        images: images,
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
    if (inputRef?.current) inputRef.current?.focus();
    inputRef.current.value = lastComment;

    return () => {
      setImages([]);
      setComment("");
      setRating(0);
    };
  }, []);

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
  const isChanged = () => {
    if (!lastComment) return false;
    if (
      lastComment === comment &&
      rating === initialRating &&
      JSON.stringify(images) === JSON.stringify(comments_images_customer)
    )
      return true;
    return false;
  };
  const isSubmitDisabled =
    !comment.trim() || rating === 0 || loading || isChanged();
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCloseModal}
      />
      <div
        className="fixed bottom-0  h-[65vh] left-0 right-0 mx-auto transform  z-50 w-full max-w-full "
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        <div
          className="bg-white h-full rounded-2xl shadow-2xl p-6 space-y-6"
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
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

          {/* Images Upload */}
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
              ) : lastComment ? (
                translateFunction("Update Rating")
              ) : (
                translateFunction("Submit Rating")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RatingOrderItem;

const RatingUploadImages = ({
  images,
  setImages,
  loading,
  setLoading,
}: {
  images: string[];
  setImages: (value: string[]) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
}) => {
  const UploadImage = async () => {
    const input = document.querySelector<HTMLInputElement>(
      "#rating-order-file-input"
    );
    input?.click();
  };

  const OnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLoading(true);
        const url = await storyService.UploadToCloudinary(file);
        setImages([...images, url]);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const removeImage = (
    e: React.MouseEvent<HTMLSpanElement | HTMLDivElement>,
    img: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setImages(images.filter((im) => im !== img));
  };

  return (
    <div
      className="flex-col w-full items-center mt-[12px] cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".rating-order-image")) {
          return;
        }
        UploadImage();
      }}
    >
      <input
        accept="image/*"
        onChange={OnChange}
        type="file"
        className="absolute opacity-0"
        hidden={true}
        id="rating-order-file-input"
      />
      <div
        className={`flex-row w-full items-center justify-start bg-[#F8F8F8] rounded-[12px] min-h-[80px] px-[16px] ${
          images.length === 0 ? "justify-center border border-[#402CDD80]" : ""
        }`}
      >
        {
          <HortiznalScrollBar
            id="comment-rating-images"
            className={`${
              images.length === 0 ? "justify-center" : "justify-start"
            } flex-row gap-[6px] `}
          >
            {images.map((src, index) => (
              <div
                key={index}
                className="flex-row items-center justify-center relative cursor-pointer rating-order-image"
                onClick={(e) => {
                  removeImage(e, src);
                }}
              >
                <img
                  className="rounded-[12px] object-cover h-[80px] w-[57px]"
                  src={src}
                  alt="rating-image"
                />
                <span
                  className="absolute w-[57px] h-[80px] rounded-[12px]"
                  style={{
                    boxShadow: "inset 0px 3px 6px #ffffff80",
                    border: "1px solid #ffffff80",
                  }}
                />
              </div>
            ))}
            <div className="flex-col items-center justify-center bg-[#ededed] h-[80px] rounded-[12px] w-[57px]">
              {loading ? (
                <Spinner />
              ) : (
                <span className="text-[#402CDD] text-[8px] regular flex-col items-center">
                  <UploadImageOrder />
                  {translateFunction("Add Photo")}
                </span>
              )}
            </div>
          </HortiznalScrollBar>
        }
        {}
      </div>
    </div>
  );
};
