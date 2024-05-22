const OfferPhotosSlider = dynamic(() => import("./OfferPhotosSlider"));
import OfferSlideItem from "./OfferSlideItem";
import { encode_utf8, getConfiguredImage } from "utils/functions";
import OfferAvatars from "./OfferAvatars";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Boutique } from "models/offer";
import RemoteSvg from "components/global/RemoteSvg";
import { useEffect } from "react";
import ImageLoader from "components/global/ImageLoader";

interface NormalWidgetProps {
  boutique: Boutique;
  myKey: number;
  onClick: Function;
}
const NormalWidget = ({ boutique, myKey, onClick }: NormalWidgetProps) => {
  useEffect(() => {
    if (boutique.description) {
      encode_utf8({
        element: document.querySelectorAll(`#boutique-${boutique.id}`),
        s: boutique.description,
      });
    }
  }, []);
  const getImageCld = (s) => {
    if (s.includes("cloudinary")) {
      return s.replace("/upload", "/upload/f_avif/q_40");
    } else return s;
  };

  return (
    <Link
      href={`/products/${boutique.slug}`}
      prefetch={false}
      aria-label={`Go To listing Page`}
      className="offer-widget  w-full flex flex-col"
      key={myKey}
    >
      <>
        <Image
          fill
          alt="imageAlt"
          loading="eager"
          fetchPriority="high"
          priority={true}
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            borderRadius: "15px",
            zIndex: "1",
          }}
          objectFit="cover"
          quality={60}
          unoptimized
          objectPosition="center"
          src={getConfiguredImage({
            src: boutique.banners[0],
            width: 900,
            height: 342,
          })}
        />

        <div className="offer-blured-background" id={`blured-${boutique.id}`} />
        <div className="offer-blured" />
        <div className="offer-container">
          <div className="offer-logo h-[30px]">
            {boutique.icon ? (
              boutique.icon.includes(".svg") ? (
                <RemoteSvg url={boutique.icon} />
              ) : (
                <ImageLoader
                  loading="eager"
                  id={"img-" + boutique.id}
                  alt={boutique.name}
                  noLoader
                  priority={false}
                  fetchPriority={"high"}
                  style={{
                    maxWidth: "187px",
                    width: "auto",
                    height: "30px",
                  }}
                  width={30}
                  height={30}
                  src={boutique.icon}
                />
              )
            ) : (
              boutique.name
            )}
          </div>
          <div className="offer-category h-[20px]">
            {boutique.mainCategoriesForProductIds.map((category, key) => {
              if (category.category_icon.includes(".svg")) {
                return <RemoteSvg url={category.category_icon} key={key} />;
              } else
                return (
                  <ImageLoader
                    loading="eager"
                    id={"img-" + boutique.id}
                    alt={boutique.name}
                    noLoader
                    priority={false}
                    fetchPriority={"high"}
                    style={{
                      maxWidth: "187px",
                      width: "auto",
                      height: "20px",
                    }}
                    width={20}
                    height={20}
                    key={key}
                    src={boutique.icon}
                  />
                );
            })}
          </div>
          <div className="offer-desc" id={`boutique-${boutique.id}`}></div>
          {boutique.banners.length > 1 ? (
            <OfferPhotosSlider
              key={myKey}
              extended={false}
              myKey={myKey}
              priority={false}
              boutique={boutique}
              OfferPhotos={boutique.banners}
            />
          ) : (
            <div className="offer-slider-container">
              <OfferSlideItem
                mykey={myKey}
                offerPhoto={boutique.banners[0]}
                priority={false}
                isSingle={true}
              />
              <OfferAvatars boutique={boutique} priority={false} />
            </div>
          )}
        </div>
      </>
    </Link>
  );
};

export default NormalWidget;
