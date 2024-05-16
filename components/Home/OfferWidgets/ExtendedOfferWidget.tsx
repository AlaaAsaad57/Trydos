import LogoOffer from "public/svg/offerlogo.svg";
import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
const OfferPhotosSlider = dynamic(() => import("./OfferPhotosSlider"));
import KidsIcon from "public/svg/KidsIcon.svg";
import SaleIcon from "public/svg/saleIcon.svg";
import DiscountIcon from "public/svg/discountIcon.svg";
import GiftIcon from "public/svg/giftIcon.svg";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import dynamic from "next/dynamic";
interface ExtendedOfferWidgetProps {
  offer: { photos: string[] };
  myKey: number | string;
  onClick: Function;
}
function ExtendedOfferWidget({
  offer,
  myKey,
  onClick,
}: ExtendedOfferWidgetProps) {
  const language: string = useSelector((state: any) => state.homepage.language);
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0.3,
  });
  return (
    <Link
      ref={ref}
      prefetch={false}
      href={"/listing"}
      aria-label={`Go To listing Page`}
      className="offer-widget extended-widget"
      key={myKey}
      onClick={() => onClick()}
    >
      {inView && (
        <>
          <Image
            fill
            alt="imageAlt"
            loading="lazy"
            style={{
              position: "absolute",
              filter: "brightness(203%)",
              top: "0px",
              left: "0px",
              borderRadius: "15px",
              zIndex: "1",
            }}
            objectFit="cover"
            objectPosition="center"
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/w_800/f_webp/1708506792?_a=DdATC1RAAZAA0&w=800&q=60"
            }
          />{" "}
          <div className="offer-blured-background" />
          <div className="offer-blured" />
          <div className="offer-container">
            <div className="offer-logo">
              <LogoOffer />
            </div>
            <div className="offer-category">
              <ManIcon />
              <WomanIcon />
              <KidsIcon />
            </div>
            <div className="offer-desc">
              {translate("Mango Famous Turkish Brand Best Offers", language)}
            </div>
            <div className="offer-details">
              <div className="offer-details-item">
                <div className="offer-details-icon">
                  <SaleIcon />
                </div>
                <div className="offer-details-text">
                  <span className="bold-text">50 %</span>{" "}
                  <span>{translate("Sale", language)}</span>
                </div>
              </div>
              <div className="offer-details-item">
                <div className="offer-details-icon">
                  <DiscountIcon />
                </div>
                <div className="offer-details-text">
                  <span>{translate("Second", language)} </span>
                  <span className="bold-text">20 %</span>
                </div>
              </div>
              <div className="offer-details-item">
                <div className="offer-details-icon">
                  <GiftIcon />
                </div>
                <div className="offer-details-text">
                  <span>{translate("Buy 1 gift 1", language)}</span>
                </div>
              </div>
            </div>
            <OfferPhotosSlider
              extended={true}
              priority={false}
              OfferPhotos={offer.photos}
            />
          </div>
        </>
      )}
    </Link>
  );
}

export default ExtendedOfferWidget;
