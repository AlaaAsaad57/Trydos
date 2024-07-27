"use client";
import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { ProductInterface } from "models/product";
import { useDispatch, useSelector } from "react-redux";
function ProductDetailsSlider({ product }: { product: ProductInterface }) {
  const productData = product;

  const [emblaRef] = useEmblaCarousel();
  const activeColor = useSelector(
    (state: any) => state.details.product?.activeColor
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: "STORE-PRODUCT", payload: product });
  }, []);
  return (
    <div className="product-details-slider">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {(
            activeColor ??
            (productData?.sync_color_images &&
              productData?.sync_color_images[
                Math.round(productData.sync_color_images.length / 2) - 1
              ]) ??
            productData
          )?.images.map((img, i) => (
            <div className="embla__slide" key={i}>
              <Image
                width={320}
                height={464}
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                alt={productData.name}
                src={getConfiguredImage({ src: img, width: 500, height: 700 })}
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsSlider;
