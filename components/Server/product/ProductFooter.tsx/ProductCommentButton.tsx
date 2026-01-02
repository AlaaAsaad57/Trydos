import CommentIcon from "components/products/CommentIcon";
import React from "react";

function ProductCommentButton({ isActive, setActive, total_comments }) {
  const getCommentsCount = () => {
    if (total_comments > 0) return total_comments;
    else return <></>;
  };
  return (
    <div
      className="product-option-item flex-row"
      data-cy="CommentIcon"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.SHOW_COMMENTS_BUTTON,
        // });
        setActive("Comment");
      }}
    >
      <CommentIcon active={isActive} />
      <span data-cy="CountOfComment">{getCommentsCount()}</span>
    </div>
  );
}

export default ProductCommentButton;
