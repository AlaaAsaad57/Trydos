import React from "react";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

function BoutiquePhoto({ photo }) {
  const [emblaRef] = useEmblaCarousel({ loop: false }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div className="boutique-photo-holder overflow-hidden">
      <div className="offer-slider-container">
        <div className="embla" ref={emblaRef}>
          <div className="embla__container">
            {photo.map((s, key) => (
              <div className="embla__slide" key={key}>
                <div className="offer-slide-item" style={{ width: "100%" }}>
                  <div className="image-offer">
                    <div
                      className="image-inner-shadow"
                      style={{ height: "100%" }}
                    />

                    <Image
                      loading={"eager"}
                      fetchPriority={"high"}
                      style={{ borderRadius: "15px" }}
                      className="OfferImage"
                      src={getConfiguredImage({
                        src: s.file_path,
                        height: 342,
                        width: 900,
                      })}
                      width={380}
                      unoptimized
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
      </div>
    </div>
  );
}

export default BoutiquePhoto;
