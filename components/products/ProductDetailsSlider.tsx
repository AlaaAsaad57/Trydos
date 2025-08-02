"use client";
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CloseIcon from "components/Home/Stories/CloseIcon";
import { useAppStore } from "store";
import { DisableScroll, EnableScroll, GetImageUrl } from "utils/tinyUtils";
import { ProductDetailsSliderPropsType } from "models/componentType/productTypes/ProductDetailsSliderPropsType";
function ProductDetailsSlider({
  product: productObj,
  currency,
  images,
}: ProductDetailsSliderPropsType) {
  const { editInfo, storeProduct, setCurrency, product } = useAppStore();
  const productData = productObj;
  const [imageShow, showImage] = useState(-1);
  const [emblaRef1, emblaApi] = useEmblaCarousel({
    startIndex: imageShow || 0,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    console.log(
      { time: productObj.time, FromRedis: productObj.redis },
      "product page response"
    );
    const newParams = new URLSearchParams(searchParams);

    if (!searchParams.get("color") && productData?.sync_color_images) {
      // newParams.set("color", productData?.sync_color_images[0].color_name);
    }
    if (
      !searchParams.get("size") &&
      productData?.choice_options &&
      productData?.choice_options?.filter((s) => s.title == "Size").length
    ) {
      // newParams.set(
      //   "size",
      //   productData?.choice_options?.filter((s) => s.title == "Size")[0]
      //     ?.options[0]?.name
      // );
    }
    if (newParams.size) {
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.push(pathname + `?${newParams.toString()}`, { shallow: true });
    }
    editInfo({ ...productData });
    storeProduct({ ...productData, colorFrom: searchParams.get("color") });
    setCurrency(currency);
    let elements = document.querySelectorAll(".product-slider-images");
    elements.forEach((elem, index) => {
      elem.addEventListener("click", function (e) {
        DisableScroll();
        showImage(index);
      });
    });
    return () => {
      elements.forEach((elem, index) => {
        elem.removeEventListener("click", () => showImage(index));
      });
    };
  }, []);

  return (
    <>
      {imageShow >= 0 && (
        <div className="fixed cursor-pointer bg-[#0000004d] flex justify-center items-center h-[100vh] w-[100vw] top-0 left-0 p-4 z-[9999999999]">
          <span className="absolute right-3 top-4 z-50">
            {" "}
            <CloseIcon
              close={() => {
                EnableScroll();
                showImage(-1);
              }}
            />
          </span>

          <div className="embla" ref={emblaRef1}>
            <div className="embla__container">
              {images?.map((img, i) => (
                <div
                  className="embla__slide flex justify-center min-w-[98%]"
                  key={img}
                  onClick={() => {
                    showImage(i);
                  }}
                >
                  <Image
                    width={320}
                    height={464}
                    style={{
                      height: "auto",
                      maxHeight: "90%",
                      width: "100%",

                      borderRadius: "10px",
                    }}
                    priority={i === 0}
                    loading="eager"
                    alt={productData.name}
                    src={getConfiguredImage({
                      src: GetImageUrl(img),
                      width: 500,
                      height: 700,
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetailsSlider;
