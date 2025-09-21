import { GetImageUrl } from "utils/tinyUtils";
import { OfferSlideItemPropsType } from "models/componentType/OfferSlideItemPropsType";
import BorderImage from "./BorderImage";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import { memo } from "react";

function OfferSlideItem({
  isSingle,
  priority,
  mykey,
  offerPhoto,
}: OfferSlideItemPropsType) {
  return (
    <div data-cy="offer_slide_item_length1" className="offer-slide-item">
      <div data-cy="image_offer_length1" className="image-offer">
        <div
          data-cy="image_inner_shadow_length1"
          className="image-inner-shadow"
          style={{ height: "100%" }}
        />
        {
          <Image
            data-cy="image_boutigue_length1"
            loading="eager"
            fetchPriority="auto"
            priority={mykey < 2}
            style={{ borderRadius: "15px" }}
            className="OfferImage object-cover max-h-full h-auto"
            src={getConfiguredImage({
              src: GetImageUrl(offerPhoto?.file_path),
              height: 400,
              c_pad: true,
            })}
            width={900}
            height={342}
            alt="offer"
          />
        }
        <BorderImage />
      </div>
    </div>
  );
}

export default memo(OfferSlideItem);
