import HortiznalScrollBar from "components/global/HortiznalScrollBar";

function ProductDescriptors({ isRtl, children }) {
  return (
    <HortiznalScrollBar
      id="product-descriptors"
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      }  product-descriptors-row h-[44px] w-full`}
    >
      {children}
    </HortiznalScrollBar>
  );
}

export default ProductDescriptors;
