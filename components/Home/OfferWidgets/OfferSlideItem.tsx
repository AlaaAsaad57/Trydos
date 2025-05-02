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
    <div className="offer-slide-item">
      <div className="image-offer">
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        {
          <Image
            loading="eager"
            fetchPriority={mykey < 2 ? "high" : "low"}
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
