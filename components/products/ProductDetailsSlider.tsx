"use client";
import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
function ProductDetailsSlider({
  Images,
  name,
}: {
  Images: Array<string>;
  name: string;
}) {
  const [emblaRef] = useEmblaCarousel();
  return (
    <div className="product-details-slider">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {Images.map((img, i) => (
            <div className="embla__slide" key={i}>
              <Image
                width={320}
                height={464}
                alt={name}
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
