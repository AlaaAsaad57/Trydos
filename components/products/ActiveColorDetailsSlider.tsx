"use client";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import { useLiveColor } from "hooks/useLiveColor";

// Client-side color selection for the fullscreen zoom slider — same reason as
// ActiveColorSlider (stale RSC on query-only navigation). The remount on color
// switch also re-attaches the `.product-slider-images` click listeners to the
// freshly mounted main-slider slides.
function ActiveColorDetailsSlider({
  imagesByColor,
  serverColor,
  productGA,
  resetLoader = true,
}) {
  const liveColor = useLiveColor(serverColor);
  const active =
    imagesByColor?.find((s) => s.keys.includes(liveColor)) ??
    imagesByColor?.[0];
  return (
    <ProductDetailsSlider
      key={active?.keys?.[0] ?? "default"}
      resetLoader={resetLoader}
      productGA={productGA}
      images={active?.images}
    />
  );
}

export default ActiveColorDetailsSlider;
