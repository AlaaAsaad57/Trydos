"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import React from "react";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import BorderImage from "components/ListingPage/BorderImage";
function CarouselContainer({ banners }) {
  const [emblaRef] = useEmblaCarousel({ loop: false }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div data-cy="embla_embla" className="embla" ref={emblaRef}>
      <div data-cy="embla__container_embla" className="embla__container">
        {banners &&
          banners?.map((banner, index) => (
            <div
              data-cy="embla__slide_embla"
              className="embla__slide"
              key={index}
            >
              <div
                data-cy="offer_slide_item_embla"
                className="offer-slide-item"
                style={{ width: "100%" }}
                key={index}
              >
                <div data-cy="image_offer_image" className="image-offer">
                  <div
                    data-cy="image_inner_shadow_image"
                    className="image-inner-shadow"
                    style={{ height: "100%" }}
                  />

                  <Image
                    data-cy="image_image"
                    loading={"eager"}
                    fetchPriority={"high"}
                    style={{ borderRadius: "15px", height: "auto" }}
                    className="OfferImage object-cover max-h-full"
                    src={getConfiguredImage({
                      src: GetImageUrl(banner.file_path),
                      height: 400,
                      c_pad: true,
                    })}
                    width={380}
                    height={135}
                    alt="offer"
                  />

                  <BorderImage />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default CarouselContainer;
