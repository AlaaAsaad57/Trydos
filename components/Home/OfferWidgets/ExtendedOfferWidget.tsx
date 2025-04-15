import LogoOffer from "public/svg/offerlogo.svg";
import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
const OfferPhotosSlider = dynamic(() => import("./OfferPhotosSlider"));
import KidsIcon from "public/svg/KidsIcon.svg";
import SaleIcon from "public/svg/saleIcon.svg";
import DiscountIcon from "public/svg/discountIcon.svg";
import GiftIcon from "public/svg/giftIcon.svg";
import { useSelector } from "react-redux";
import { translateFunction } from "utils/functions";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

interface ExtendedOfferWidgetProps {
  offer: { file_path: string }[];
  myKey: number | string;
  onClick: Function;
}
function ExtendedOfferWidget({
  offer,
  myKey,
  onClick,
}: ExtendedOfferWidgetProps) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const language: string = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0.3,
  });
  return (
    <div
      ref={ref}
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
            quality={60}
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/h_342/f_avif/1708506792?_a=DdATC1RAAZAA0"
            }
          />{" "}
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
              myKey={4}
              extended={true}
              priority={false}
              OfferPhotos={offer}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ExtendedOfferWidget;
