import OfferSlideItem from "./OfferSlideItem";
import OfferAvatars from "./OfferAvatars";
import Image from "next/image";
import { Boutique } from "models/offer";
import OfferPhotosSlider from "./OfferPhotosSlider";
import PrefetchLink from "components/global/PrefetchLink";
import NextLink from "components/global/NextLink";
import { Suspense } from "react";
import search from "services/search";

interface NormalWidgetProps {
  boutique: Boutique;
  myKey: number;
  lang: string;
}
const NormalWidget = ({ boutique, myKey, lang }: NormalWidgetProps) => {
  return (
    <div className="w-full flex relative">
      <Suspense fallback={<></>} key={`/${lang}/boutique/${boutique.slug}`}>
        <PrefetchLink
          link={`/${lang}/boutique/${boutique.slug}`}
          slug={boutique.slug}
        />
      </Suspense>
      <NextLink
        data-cy="second_boutique_component"
        href={`/${lang}/boutique/${boutique.slug}`}
        data={{
          is_boutique: true,
          ...boutique,
          href: `/${lang}/boutique/${boutique.slug}`,
        }}
        aria-label={`Go To listing ${lang} ${boutique.slug}`}
        className="offer-widget"
        id={`boutique-${boutique.slug}`}
        key={boutique.slug}
      >
        <div
          className="offer-container cursor-pointer"
          data-cy="offer_container_boutique"
        >
          <div className="offer-logo" data-cy="boutique_logo">
            {boutique.icon?.file_path && (
              <Image
                data-cy="boutique_Image"
                id={"img-" + boutique.id}
                className="object-contain"
                alt={boutique.name}
                loading="eager"
                fetchPriority="auto"
                priority={myKey < 2}
                style={{
                  maxWidth: "187px",
                  width: "auto",
                  height: "20px",
                }}
                width={20}
                height={20}
                src={boutique?.icon?.file_path?.replace(
                  "/upload",
                  `/upload/h_50/f_webp/q_auto`
                )}
              />
            )}
          </div>
          <div className="offer-desc" id={`boutique-${boutique.id}`}>
            {boutique.name}
          </div>
          {boutique?.banners?.length > 1 ? (
            <OfferPhotosSlider
              key={myKey}
              extended={false}
              myKey={myKey}
              priority={myKey < 2}
              OfferPhotos={boutique.banners || []}
            />
          ) : (
            <div
              className="offer-slider-container"
              data-cy="offer_slider_container"
            >
              {boutique?.banners && boutique?.banners[0] && (
                <OfferSlideItem
                  mykey={myKey}
                  offerPhoto={boutique?.banners[0]}
                  priority={myKey < 2}
                  isSingle={true}
                />
              )}
            </div>
          )}
        </div>
      </NextLink>
      <div className="offer-category absolute top-[18px] right-[18px] z-20">
        {boutique.mainCategoriesForProductIds
          .slice(0, 5)
          .map((category, key) => {
            // @ts-ignore
            if (category?.flat_photo_path?.file_path) {
              return (
                <NextLink
                  data={{
                    is_boutique: true,
                    ...category,
                    href: `/${lang}/boutique/${
                      boutique.slug
                    }${search.getPageUrl({
                      term: "categories",
                      value: [category],
                    })}`,
                  }}
                  aria-label={`Go To listing ${lang} ${boutique.slug} ${category.slug}`}
                  href={`/${lang}/boutique/${boutique.slug}${search.getPageUrl({
                    term: "categories",
                    value: [category],
                  })}`}
                  key={key}
                  className={`${key > 0 && "ml-[13px]"}`}
                >
                  <Image
                    id={"img-" + boutique.id}
                    alt={boutique.name}
                    loading="eager"
                    fetchPriority="auto"
                    priority={myKey < 2}
                    width={12}
                    height={12}
                    // @ts-ignore
                    src={category.flat_photo_path?.file_path?.replace(
                      "/upload",
                      `/upload/h_50/f_webp/q_auto`
                    )}
                  />
                </NextLink>
              );
            }
          })}
      </div>
      <div className="absolute w-full flex justify-center items-center top-[min(calc(50px+calc((100vw-50px)*135/380)),400px)] z-30 mx-auto left-0 right-0">
        <OfferAvatars boutique={boutique} priority={myKey < 2} />
      </div>
    </div>
  );
};

export default NormalWidget;
