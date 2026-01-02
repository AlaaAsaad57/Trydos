import Share from "public/svg/share";
import React from "react";

function ProductShareButton({ Active, total_shares, setActive }) {
  const getSharesCount = () => {
    if (total_shares > 0) return total_shares;
    else return <></>;
  };
  return (
    <div
      className={`product-option-item relative flex-row ${
        Active && "active-option"
      }`}
      data-cy="ShareIcon"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.SHARE_PRODUCT_BUTTON,
        // });
        setActive();
      }}
    >
      {" "}
      <Share />
      <span data-cy="CountOfShares">{getSharesCount()}</span>
    </div>
  );
}

export default ProductShareButton;
