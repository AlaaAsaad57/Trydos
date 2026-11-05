"use client";
import ProductPageSkeleton from "components/Product/ProductPageSkeleton";
import { usePageDir } from "components/DemoApp1/rtl";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

/**
 * What shows while a tapped product opens: the product page's shape (Stage
 * 7c), with the card's first photo, its name and its brand's logo.
 */
function ProductLoader({ product }) {
  const dir = usePageDir();

  // Must warm the exact URL the gallery renders: same first-image pick as the
  // page (the colour rows win over the raw images) and the same 500x700
  // transform, so the first photo is already in the browser cache when the
  // real page arrives.
  const firstGalleryImage =
    product?.sync_color_images?.[0]?.images?.[0] ??
    product?.images?.[0] ??
    product?.image;
  const firstImageSrc = getConfiguredImage({
    src: GetImageUrl(firstGalleryImage),
    width: 500,
    height: 700,
  });

  return (
    <div dir={dir}>
      <ProductPageSkeleton
        photo={firstImageSrc}
        cardPhoto={product?.cardPhoto}
        name={product?.name}
        brand={
          product?.brand?.icon
            ? { logo: GetImageUrl(product.brand.icon), name: product.brand.name }
            : undefined
        }
      />
    </div>
  );
}

export default ProductLoader;
