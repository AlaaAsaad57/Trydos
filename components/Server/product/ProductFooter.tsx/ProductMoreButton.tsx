import ThreePoints from "components/products/ThreePoints";

function ProductMoreButton({ Active, setActive }) {
  return (
    <div
      className="product-option-item flex-row"
      data-pw="ThreePointsIcon"
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.MORE_OPTIONS_BUTTON,
        // });
        setActive();
      }}
    >
      <ThreePoints active={Active} />
      <span></span>
    </div>
  );
}

export default ProductMoreButton;
