"use client";
import ProductImagesSlider from "components/products/ProductImageSlider";
import { useLiveColor } from "hooks/useLiveColor";

// Picks the slide set matching the live `?color` param on the client, because
// query-only navigations reuse the stale server render (staleTimes.dynamic)
// and the server-side color filtering never re-runs. All colors' slides are
// server-rendered and passed in; only the active set is mounted.
function ActiveColorSlider({ slidesByColor, serverColor, language, productGA }) {
  const liveColor = useLiveColor(serverColor);
  const active =
    slidesByColor?.find((s) => s.keys.includes(liveColor)) ??
    slidesByColor?.[0];
  return (
    <ProductImagesSlider
      // remount on color switch so embla re-inits at the first slide
      key={active?.keys?.[0] ?? "default"}
      language={language}
      productGA={productGA}
    >
      {active?.slides}
    </ProductImagesSlider>
  );
}

export default ActiveColorSlider;
