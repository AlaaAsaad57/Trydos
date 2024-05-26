import OfferPhotosSlider from "./OfferPhotosSlider";
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
import { useRouter } from "next/navigation";

interface NormalWidgetProps {
  boutique: Boutique;
  myKey: number;
  onClick: Function;
}
const NormalWidget = ({ boutique, myKey, onClick }: NormalWidgetProps) => {
  const router = useRouter();
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
    <div
      onClick={() => {
        router.push(`/boutiques/${boutique.slug}`);
      }}
      aria-label={`Go To listing Page`}
      className="offer-widget  w-full flex flex-col"
      key={myKey}
    >
      <>
        <Image
          fill
          alt="imageAlt"
          loading={myKey < 2 ? "eager" : "lazy"}
          fetchPriority={myKey < 2 ? "high" : "low"}
          priority={myKey < 2}
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            borderRadius: "15px",
            zIndex: "1",
            objectFit: "cover",
            objectPosition: "center",
          }}
          quality={60}
          unoptimized
          src={getConfiguredImage({
            src: boutique.banners[0],
            width: 900,
            height: 342,
          })}
        />

        <div className="offer-blured-background" id={`blured-${boutique.id}`} />
        <div className="offer-blured" />
        <div className="offer-container">
          <div className="offer-logo h-[20px]">
            {boutique.icon ? (
              boutique.icon.includes(".svg") ? (
                <RemoteSvg size={20} url={boutique.icon} isSvg={null} />
              ) : (
                <ImageLoader
                  id={"img-" + boutique.id}
                  alt={boutique.name}
                  noLoader={true}
                  loading={myKey < 2 ? "eager" : "lazy"}
                  fetchPriority={myKey < 2 ? "high" : "low"}
                  priority={myKey < 2}
                  style={{
                    maxWidth: "187px",
                    width: "auto",
                    height: "30px",
                  }}
                  width={20}
                  height={20}
                  src={boutique.icon}
                />
              )
            ) : (
              boutique.name
            )}
          </div>
          <div className="offer-category h-[12px]">
            {boutique.mainCategoriesForProductIds.map((category, key) => {
              if (category.category_icon.includes(".svg")) {
                return (
                  <Link
                    key={key}
                    href={`/boutiques/${boutique.slug}/categories/${category.category_slug}`}
                    prefetch={false}
                  >
                    <RemoteSvg
                      size={12}
                      url={category.category_icon}
                      key={key}
                      isSvg={null}
                    />
                  </Link>
                );
              } else
                return (
                  <Link
                    key={key}
                    href={`/boutiques/${boutique.slug}/categories/${category.category_slug}`}
                    prefetch={false}
                  >
                    <ImageLoader
                      id={"img-" + boutique.id}
                      alt={boutique.name}
                      noLoader={true}
                      loading={myKey < 2 ? "eager" : "lazy"}
                      fetchPriority={myKey < 2 ? "high" : "low"}
                      priority={myKey < 2}
                      style={{
                        maxWidth: "187px",
                        width: "auto",
                        height: "12px",
                      }}
                      width={12}
                      height={12}
                      key={key}
                      src={boutique.icon}
                    />
                  </Link>
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
    </div>
  );
};

export default NormalWidget;
