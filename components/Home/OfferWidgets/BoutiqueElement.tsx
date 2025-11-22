"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import AutoHeight from "embla-carousel-auto-height";
import { useAppStore } from "store";
function BoutiqueElement({ boutique }) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
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
      className="w-full flex justify-center items-center overflow-hidden min-h-[15vh]  relative"
      ref={emblaRef}
    >
      <div className="embla__container flex h-auto">
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
              className="h-auto w-full object-center object-cover  max-w-full "
            />
          </div>
        ))}
      </div>
      <div
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex"
      >
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
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <HortiznalScrollBar
      id={`boutique-${boutique.slug}-slider ${isRtl ? "dir-rtl" : ""}`}
      className="flex flex-row items-center  gap-[4px] h-[102px] w-full pl-[6px]"
    >
      {categories?.map((category) => (
        <NextLink
          key={category?.slug}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="90"
            height="90"
            viewBox="0 0 90 90"
            className="absolute z-50 top-0 left-0"
          >
            <g
              id="Rectangle_6502"
              data-name="Rectangle 6502"
              fill="none"
              stroke="#d3d3d3"
              stroke-width="0.5"
            >
              <rect
                x="0.25"
                y="0.25"
                width="89.5"
                height="89.5"
                rx="14.75"
                fill="none"
              />
            </g>
          </svg>

          <Image
            alt={category?.most_viewed_product_name}
            src={GetImageUrl(category.most_viewed_product_thumbnail).replace(
              "/upload",
              `/upload/h_200,w_200,c_fit/f_auto/q_auto:good/fl_lossy/so_0`
            )}
            width={300}
            className="rounded-[15px] w-[90px] h-[90px] object-contain object-center "
            height={300}
          />
        </NextLink>
      ))}
    </HortiznalScrollBar>
  );
};
