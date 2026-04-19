import Image from "next/image";
import React, { Suspense } from "react";
import BoutiquePhotoSliderWrapper from "components/clientWrapper/filtersPage/BoutiquePhotoSliderWrapper";
import BorderImage from "components/ListingPage/BorderImage";
import { getConfiguredImage, GetImageUrl } from "utils/server";
import BoutiqueSlidersSkeleton from "components/skeleton/loaders/BoutiqueSlidersSkeleton";
import ClientLogger from "components/global/ClientLogger";

async function ListingBoutiqueSlider({ boutiquePromise }) {
  let boutique = await boutiquePromise;
  return (
    <Suspense fallback={<BoutiqueSlidersSkeleton />}>
      <BoutiqueHeader boutique={boutique} />
    </Suspense>
  );
}

export default ListingBoutiqueSlider;

function BoutiqueHeader({ boutique }) {
  return (
    <>
      <ClientLogger
        value={{
          fetchBoutiqueTime: boutique?.time,
        }}
      />
      {boutique?.banners && (
        <div
          data-cy="boutique_top_icons"
          className="boutique-top-info flex-col items-center"
        >
          <div className="boutique-logo-container flex-row align-center gap-[8px]">
            <Image
              alt={boutique?.name}
              width={130}
              height={20}
              src={GetImageUrl(boutique?.icon)}
            />
            <img src="/icons/VerificationIcon.svg" />
            <img src="/icons/TopStar.svg" />
          </div>
          <div className="boutique-text">{boutique?.name}</div>
        </div>
      )}
      {boutique?.banners && <BouqiuePhotoSlider banners={boutique.banners} />}
    </>
  );
}
const BouqiuePhotoSlider = ({ banners }) => {
  return (
    <div data-cy="boutique_photo_holder" className="boutique-photo-holder">
      <div
        data-cy="banners_length-1"
        className={`${
          banners?.length > 1 && "justify-start"
        } offer-slider-container`}
      >
        <BoutiquePhotoSliderWrapper>
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
        </BoutiquePhotoSliderWrapper>
      </div>
    </div>
  );
};
