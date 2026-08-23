import CommentIcon from "components/products/CommentIcon";
import { useEffect, useState } from "react";
import { GetProductCommentsCount } from "serverRequests/product";
import { useAppStore } from "store";
import { LogError } from "utils/functions";

function ProductCommentButton({
  isActive,
  setActive,
  total_comments,
  productId,
}) {
  const { shouldUpdateCommentsCount, setShouldUpdateCommentsCount } =
    useAppStore();
  const [commentsTotal, setCommentsTotal] = useState(total_comments);
  const UpdateCommentCount = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      let res = await GetProductCommentsCount({ productId });

      setCommentsTotal(res.total);
      setShouldUpdateCommentsCount(false);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In UpdateCommentCount in ProductCommentButton",
      });
    }
  };
  useEffect(() => {
    if (shouldUpdateCommentsCount) UpdateCommentCount();
  }, [shouldUpdateCommentsCount]);
  const getCommentsCount = () => {
    if (commentsTotal > 0) return commentsTotal;
    else return <></>;
  };
  return (
    <div
      className="product-option-item flex-row"
      data-pw="CommentIcon"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.SHOW_COMMENTS_BUTTON,
        // });
        setActive("Comment");
      }}
    >
      <CommentIcon active={isActive} />
      <span data-pw="CountOfComment">{getCommentsCount()}</span>
    </div>
  );
}

export default ProductCommentButton;
