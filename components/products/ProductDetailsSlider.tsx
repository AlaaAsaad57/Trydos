"use client";
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CloseIcon from "components/Home/Stories/CloseIcon";
import { useAppStore } from "store";
function ProductDetailsSlider({
  product: productObj,
  currency,
}: {
  product: any;
  currency: any;
}) {
  const { editInfo, storeProduct, setCurrency, product } = useAppStore();
  const productData = productObj;
  const [imageShow, showImage] = useState(-1);
  const [emblaRef] = useEmblaCarousel();
  const [emblaRef1] = useEmblaCarousel({ startIndex: imageShow || 0 });
  const activeColor = product.activeColor;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
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
        <div className="fixed bg-[#0000004d] flex justify-center items-center h-[100vh] w-[100vw] top-0 left-0 p-4 z-[9999999999]">
          <span className="absolute right-3 top-4 z-50">
            {" "}
            <CloseIcon close={() => showImage(-1)} />
          </span>
          <div className="embla" ref={emblaRef1}>
            <div className="embla__container">
              {(
                activeColor ??
                (searchParams.get("color") &&
                  productData?.sync_color_images &&
                  productData?.sync_color_images?.filter(
                    (s) => s.color_name === searchParams.get("color")
                  )[0]) ??
                (productData?.sync_color_images &&
                  productData?.sync_color_images[0]) ??
                productData
              )?.images?.map((img, i) => (
                <div
                  className="embla__slide"
                  key={img}
                  onClick={() => {
                    showImage(i);
                  }}
                >
                  <Image
                    width={320}
                    height={464}
                    style={{
                      height: "100%",
                      width: "95%",
                      borderRadius: "10px",
                    }}
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
      )}
    </>
  );
}

export default ProductDetailsSlider;
