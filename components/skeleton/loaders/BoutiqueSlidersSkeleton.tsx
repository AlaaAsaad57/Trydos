import { GetImageUrl } from "utils/server/helpers";
import Skeleton from "react-loading-skeleton";

function BoutiqueSlidersSkeleton({ boutique }: any) {
  return (
    <>
      <div
        data-pw="boutique_top_icons"
        className="boutique-top-info flex-col items-center"
      >
        <div className="boutique-logo-container flex-row align-center">
          {boutique?.icon ? (
            <img
              alt={boutique?.name}
              width={130}
              height={20}
              src={GetImageUrl(boutique?.icon)}
            />
          ) : (
            <Skeleton width={70} height={20} borderRadius={"4px"} />
          )}
        </div>
        <div className="boutique-text">{boutique?.name}</div>
      </div>
      <div data-pw="boutique_photo_holder" className="boutique-photo-holder w-full min-w-[100vw]">
        <div
          data-pw="banners_length-1"
          className={`${
            boutique?.banners?.length > 1 && "justify-start"
          } offer-slider-container`}
        >
          <div data-pw="embla_embla" className="embla">
            <div data-pw="embla__container_embla" className="embla__container">
              {boutique?.banners?.map((s, index) => (
                <div
                  data-pw="embla__slide_embla"
                  className="embla__slide"
                  key={index}
                >
                  <div
                    data-pw="offer_slide_item_embla"
                    className="offer-slide-item"
                    style={{ width: "100%" }}
                    key={index}
                  >
                    <div data-pw="image_offer_image" className="image-offer">
                      <div
                        data-pw="image_inner_shadow_image"
                        className="image-inner-shadow"
                        style={{ height: "100%" }}
                      />

                      <img src={GetImageUrl(s)} />
                    </div>
                  </div>
                </div>
              ))}
              {boutique?.banners?.length === 0 && (
                <div data-pw="embla__slide_embla" className="embla__slide">
                  <div
                    data-pw="offer_slide_item_embla"
                    className="offer-slide-item"
                    style={{ width: "100%" }}
                  >
                    <div
                      data-pw="image_offer_image"
                      className="image-offer w-full"
                    >
                      <div
                        data-pw="image_inner_shadow_image"
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BoutiqueSlidersSkeleton;
