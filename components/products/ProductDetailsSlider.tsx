"use client";
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { ProductInterface } from "models/product";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CloseIcon from "components/Home/Stories/CloseIcon";
function ProductDetailsSlider({ product }: { product: ProductInterface }) {
  const productData = product;

  const [emblaRef] = useEmblaCarousel();
  const activeColor = useSelector(
    (state: any) => state.details.product?.activeColor
  );
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);

    if (!searchParams.get("color") && productData?.sync_color_images) {
      newParams.set("color", productData?.sync_color_images[0].color_name);
    }
    if (!searchParams.get("size") && productData?.choice_options) {
      newParams.set(
        "size",
        productData?.choice_options?.filter((s) => s.title == "Size")[0]
          ?.options[0]?.name
      );
    }
    if (newParams.size) {
      router.push(pathname + `?${newParams.toString()}`);
    }
    dispatch({ type: "EDIT-INFO", payload: { ...product } });
    dispatch({
      type: "STORE-PRODUCT",
      payload: { ...product, colorFrom: searchParams.get("color") },
    });
  }, []);
  const [imageShow, showImage] = useState(false);
  return (
    <>
      <div className="product-details-slider">
        <div className="embla" ref={emblaRef}>
          <div className="embla__container">
            {(
              activeColor ??
              (searchParams.get("color") &&
                productData?.sync_color_images &&
                productData?.sync_color_images?.filter(
                  (s) => s.color_name === searchParams.get("color")
                )[0]) ??
              (productData?.sync_color_images &&
                productData?.sync_color_images[
                  Math.round(productData.sync_color_images.length / 2) - 1
                ]) ??
              productData
            )?.images?.map((img, i) => (
              <div
                className="embla__slide"
                key={img}
                onClick={() => {
                  showImage(
                    getConfiguredImage({ src: img, width: 500, height: 700 })
                  );
                }}
              >
                <Image
                  width={320}
                  height={464}
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  alt={productData.name}
                  src={getConfiguredImage({
                    src: img,
                    width: 500,
                    height: 700,
                  })}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {imageShow && (
        <div className="fixed bg-[#0000004d] flex justify-center items-center h-[100vh] w-[100vw] top-0 left-0 p-4 z-[9999999999]">
          <span className="absolute right-3 top-4 z-50">
            {" "}
            <CloseIcon close={() => showImage(null)} />
          </span>
          <img
            className="w-auto h-full rounded-md"
            alt={product.name}
            // @ts-ignore
            src={imageShow}
          />
        </div>
      )}
    </>
  );
}

export default ProductDetailsSlider;
