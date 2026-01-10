import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import React, { Suspense } from "react";

async function ProductExtendedSliderWrapper({
  globalPromise,
  language,
  color,
}) {
  let globalDetails = await globalPromise;
  return (
    <Suspense fallback={<></>}>
      <ProductDetailsSlider
        key={color}
        resetLoader={true}
        productGA={{
          item_id: globalDetails.id,
          item_name: globalDetails?.name,
          brand: globalDetails?.brand?.name,
          brand_id: globalDetails?.brand?.id,
          category: globalDetails?.categories?.[0]?.name,
          category_id: globalDetails?.categories?.[0]?.id,
        }}
        images={
          globalDetails?.sync_color_images?.find(
            (s) => s.color_option === color || s?.color_name === color
          )?.images ??
          globalDetails?.sync_color_images?.[0]?.images ??
          globalDetails?.images
        }
      />
    </Suspense>
  );
}

export default ProductExtendedSliderWrapper;
