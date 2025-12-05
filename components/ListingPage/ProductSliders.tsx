import { ProductPhotosSliderPropsType } from "models/componentType/ProductPhotosSliderPropsType";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl, getVideoUrl } from "utils/tinyUtils";
import ImageSlider from "./ImageSlider";
import { NormalSlider } from "utils/Slider";

export function ProductPhotosSlider({
  product,
  shouldshowRedem,
  Sliders = true,
  images,
}: ProductPhotosSliderPropsType) {
  const [activeSlide, setActiveImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    let timer;
    const calculateTimeLeft = () => {
      const endDate = new Date(product.flash_deal_end_date);
      endDate.setHours(23, 59, 59, 999);
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft(null);
        setIsExpired(true);
      }
    };
    if (product?.flash_deal_end_date) {
      calculateTimeLeft();
      timer = setInterval(calculateTimeLeft, 1000);
    }

    return () => clearInterval(timer);
  }, [product?.flash_deal_end_date]);
  if (Sliders) {
    return (
      <React.Fragment>
        {/* <BorderImage isBig={true} /> */}

        {product.videos && product.videos.length > 0 ? (
          // Display video if available
          <>
            <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute" />
            <video
              src={getVideoUrl(product.videos[0], { width: 400, height: 400 })}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              style={{
                border:
                  (product.flash_deal_end_date && !isExpired) || shouldshowRedem
                    ? "1px solid #FF6200"
                    : "1px solid #d3d3d3",
              }}
              className="w-full object-cover h-[290px] border-[#d3d3d3] border-[1px] rounded-15 z-10"
            />
          </>
        ) : (
          // Display first image if no video
          // <Image
          //   width={400}
          //   height={300}
          //   loading="eager"
          //   quality={100}
          //   fetchPriority="auto"
          //   src={getConfiguredImage({
          //     src: GetImageUrl(image),
          //     width: 189,
          //     height: 290,
          //     q: 100,
          //   })}
          //   style={{
          //     border:
          //       (product.flash_deal_end_date || shouldshowRedem) &&
          //       "1px solid #FF6200",
          //   }}
          //   key={image}
          //   className="w-[200px] h-[290px] border-[#d3d3d387] border-[1px] rounded-15 z-10"
          //   alt={product.name || "alt"}
          // />

          <div
            className={`product-container-slider h-[290px] duration-300 w-full relative`}
          >
            <NormalSlider
              initialSlide={activeSlide}
              slideHeight={290}
              slideWidth={200}
              slidesArray={images?.map((image, index) => index)}
              onSlideChange={(index) => {
                setActiveImageIndex(index);
              }}
              renderSlide={({ index, slide, isActive }) => {
                const image = images?.[index];
                if (image)
                  return (
                    <div className="flex w-full h-[290px] relative" key={index}>
                      {/* <BorderImage isBig={true} /> */}
                      <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
                      <Image
                        width={400}
                        height={300}
                        loading="eager"
                        quality={100}
                        fetchPriority="auto"
                        src={getConfiguredImage({
                          src: GetImageUrl(image),
                          width: 189,
                          height: 290,
                          q: 100,
                        })}
                        style={{
                          border:
                            (product.flash_deal_end_date && !isExpired) ||
                            shouldshowRedem
                              ? "1px solid #FF6200"
                              : "1px solid #d3d3d3",
                        }}
                        className="w-[200px] h-[290px] border-[#d3d3d387] object-cover object-[top_center] border-[1px] rounded-15 z-10"
                        alt={product.name || "alt"}
                      />
                    </div>
                  );
              }}
            />
          </div>
        )}
      </React.Fragment>
    );
  }
  return (
    <>
      <div
        className="product-photos z-10 min-h-[290px]  max-h-[290px] overflow-visible w-100 justify-start align-center flex-col"
        style={{
          position: "static",
          opacity: "1",
          zIndex: "4",
        }}
      >
        <div
          className={`product-container-slider h-[290px] duration-300 w-full relative`}
        >
          <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
          <Image
            width={380}
            height={580}
            quality={100}
            loading="eager"
            fetchPriority="auto"
            style={{
              borderRadius: "15px",
              zIndex: "3",
              border: Boolean(
                (product.flash_deal_end_date && !isExpired) || shouldshowRedem
              )
                ? "1px solid #FF6200"
                : "1px solid #d3d3d3",
            }}
            src={getConfiguredImage({
              src: GetImageUrl(images[0]),
              width: 380,
              height: 580,
              q: 100,
            })}
            className="w-[200px] h-[290px] object-cover object-[top_center]"
            alt={product.name || "alt"}
          />
        </div>
      </div>
    </>
  );
}
