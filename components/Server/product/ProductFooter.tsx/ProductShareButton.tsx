import { formatCount } from "utils/formatCount";

function ProductShareButton({ Active, total_shares, setActive, language = "en" }) {
  const getSharesCount = () => {
    if (total_shares > 0) return formatCount(total_shares, language);
    else return <></>;
  };
  return (
    <div
      className={`product-option-item relative flex-row ${
        Active && "active-option"
      }`}
      data-pw="ShareIcon"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.SHARE_PRODUCT_BUTTON,
        // });
        setActive();
      }}
    >
      {" "}
      <img src="/icons/share.svg" />
      <span data-pw="CountOfShares">{getSharesCount()}</span>
    </div>
  );
}

export default ProductShareButton;
