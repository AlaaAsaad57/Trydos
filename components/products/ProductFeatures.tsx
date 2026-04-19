import HortiznalScrollBar from "components/global/HortiznalScrollBar";

function ProductFeatures({ isRtl, children }) {
  return (
    <HortiznalScrollBar
      id="product-features"
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } flex-row gap-[12px] items-center mt-[11px]`}
    >
      {children}
    </HortiznalScrollBar>
  );
}

export default ProductFeatures;
