"use client";
import Autoplay from "node_modules/embla-carousel-autoplay/esm";
import useEmblaCarousel from "node_modules/embla-carousel-react/esm";
import Image from "next/image";
import React from "react";
import { GetImageUrl } from "utils/tinyUtils";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import AutoHeight from "embla-carousel-auto-height";
function BoutiqueElement({ boutique }) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
    AutoHeight(),
  ]);
  const configureImage = (src) => {
    return src.replace(
      "/upload",
      `/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0`
    );
  };
  return (
    <div
      className="w-full flex justify-center items-center overflow-hidden min-h-[20vh] max-h-[75vh] relative"
      ref={emblaRef}
    >
      <div className="embla__container flex">
        {boutique?.banners.map((banner, idx) => (
          <div
            key={idx}
            className="min-w-full flex justify-center items-center relative"
          >
            <div className="absolute w-full h-full top-0 left-0 z-10 shadow-[inset_0px_3px_6px_rgba(255,255,255,0.5)]" />
            <Image
              alt={boutique.name}
              src={configureImage(GetImageUrl(banner?.file_path))}
              data-cy="boutique-banner"
              width={1280}
              height={750}
              className="h-auto w-full object-center object-cover  max-w-full max-h-[75vh] "
            />
          </div>
        ))}
      </div>
      <div className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex">
        <span
          className="bold text-[16px] uppercase text-white"
          data-cy="boutique-name"
        >
          {boutique?.name}
        </span>
        <span
          data-cy="boutique-description"
          className="regular text-[16px] text-white"
          dangerouslySetInnerHTML={{
            __html: boutique?.description,
          }}
        ></span>
      </div>
    </div>
  );
}

export const BoutiqueContainer = ({ boutique, lang }) => {
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.15)]"
      id={`boutique-${boutique.slug}`}
    >
      <NextLink
        data-cy="boutique_link"
        className="w-full"
        href={`/${lang}/filters/boutiques/${boutique.slug}`}
        data={{
          is_boutique: true,
          ...boutique,
          href: `/${lang}/filters/boutiques/${boutique.slug}`,
        }}
      >
        <BoutiqueElement boutique={boutique} />
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique?.mainCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
};

export const CategoriesSlider = ({ categories, boutique, lang }) => {
  return (
    <HortiznalScrollBar
      id={`boutique-${boutique.slug}-slider`}
      className="flex flex-row items-center  gap-[4px] h-[102px] w-full pl-[6px]"
    >
      {categories?.map((category) => (
        <NextLink
          href={
            category?.is_product_url
              ? `/${lang}/products/${category.slug}`
              : `/${lang}/filters/boutiques/${boutique.slug}/categories/${category.slug}`
          }
          data={
            category?.is_product_url
              ? {
                  is_product: true,
                  name: category.most_viewed_product_name,
                  images: [category.most_viewed_product_thumbnail],
                  href: `/${lang}/products/${category.slug}`,
                }
              : {
                  is_boutique: true,
                  ...boutique,
                  href: `/${lang}/filters/boutiques/${boutique.slug}/categories/${category.slug}`,
                }
          }
          className="w-[90px] min-w-[90px] h-[90px] rounded-[15px] bg-white relative"
        >
          <div className="rounded-[15px] absolute w-full h-full top-0 left-0 z-10 shadow-[inset_0px_3px_6px_rgba(255,255,255,0.5)]" />
          <Image
            alt={category?.most_viewed_product_name}
            src={GetImageUrl(category.most_viewed_product_thumbnail).replace(
              "/upload",
              `/upload/h_200,w_200,c_fit/f_auto/q_auto:good/fl_lossy/so_0`
            )}
            layout="responsive"
            width={300}
            className="rounded-[15px] w-[90px] h-[90px] object-contain object-center "
            height={300}
          />
        </NextLink>
      ))}
    </HortiznalScrollBar>
  );
};
