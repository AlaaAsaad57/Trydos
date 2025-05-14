import BorderImage from "./BorderImage";
import Image from "next/image";
interface OfferSlideItemProps {
  isSingle: boolean;
  priority: boolean;
  offerPhoto: any;
  mykey: number;
}
function OfferSlideItem({
  isSingle,
  priority,
  mykey,
  offerPhoto,
}: OfferSlideItemProps) {
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
            className="OfferImage object-cover"
            src={offerPhoto?.file_path.replace(
              "/upload",
              `/upload/h_342/f_avif/q_auto`
            )}
            width={900}
            unoptimized
            height={342}
            alt="offer"
          />
        }
        <BorderImage />
      </div>
    </div>
  );
}

export default OfferSlideItem;
