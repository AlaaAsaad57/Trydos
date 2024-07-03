"use client";
import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { ProductInterface } from "models/product";
function ProductDetailsSlider({ product }: { product: ProductInterface }) {
  const productData = product;
  console.log(product);
  const [emblaRef] = useEmblaCarousel();
  return (
    <div className="product-details-slider">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {productData.images.map((img, i) => (
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
