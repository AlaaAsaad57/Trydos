import { Skeleton } from "components/Server/Skeleton";
import VerificationIcon from "public/svg/listing/VerificationIcon";
import React from "react";

function BoutiqueSlidersSkeleton({ banners = [] }) {
  return (
    <>
      <div
        data-cy="boutique_top_icons"
        className="boutique-top-info flex-col items-center"
      >
        <div className="boutique-logo-container flex-row align-center">
          <Skeleton width={130} height={20} borderRadius={"8px"} />
          <VerificationIcon />
          <Skeleton width={24} height={24} borderRadius={"50%"} />
        </div>
        <div className="boutique-text">
          <Skeleton width={100} height={16} borderRadius={"4px"} />
        </div>
      </div>
      <div data-cy="boutique_photo_holder" className="boutique-photo-holder">
        <div
          data-cy="banners_length-1"
          className={`${
            banners?.length > 1 && "justify-start"
          } offer-slider-container`}
        >
          <div data-cy="embla_embla" className="embla">
            <div data-cy="embla__container_embla" className="embla__container">
              {banners?.map((s, index) => (
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

                      <Skeleton
                        width={"100%"}
                        height={150}
                        borderRadius={"8px"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BoutiqueSlidersSkeleton;
