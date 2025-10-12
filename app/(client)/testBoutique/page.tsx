"use client";
import NextLink from "components/global/NextLink";
import { CategoriesSlider } from "components/Home/OfferWidgets/BoutiqueElement";
import Autoplay from "node_modules/embla-carousel-autoplay/esm";
import useEmblaCarousel from "node_modules/embla-carousel-react/esm";
import Image from "node_modules/next/image";
import React from "react";
import "styles/globals.css";

import { GetImageUrl } from "utils/tinyUtils";
function Page() {
  let boutique = {
    name: "Mango",
    description: "10% Discount For All Zara Collection Now!",
    slug: "#",
    childCategoriesForProductIds: [
      {
        most_viewed_product_thumbnail:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760174475/kkubaic7rrj1kvjfij4u.jpg",
        most_viewed_product_name: "Test",
      },
      {
        most_viewed_product_thumbnail:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760174500/gmzesvxjj3i2aluglk6u.jpg",
        most_viewed_product_name: "Test",
      },
      {
        most_viewed_product_thumbnail:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760174552/znlefzdbjk5uovwidon6.jpg",
        most_viewed_product_name: "Test",
      },
      {
        most_viewed_product_thumbnail:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760174585/txjtqpzwvew4uybm4nqy.jpg",
        most_viewed_product_name: "Test",
      },
      {
        most_viewed_product_thumbnail:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760174606/rez6asupqjohjo5yhxqs.jpg",
        most_viewed_product_name: "Test",
      },
    ],
    banners: [
      {
        file_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760175343/q0oixqej0myxpjpduygu.jpg",
      },
      {
        file_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760175343/q0oixqej0myxpjpduygu.jpg",
      },
      {
        file_path:
          "https://res.cloudinary.com/djooohujg/image/upload/v1760175343/q0oixqej0myxpjpduygu.jpg",
      },
      // {
      //   file_path:
      //     "https://res.cloudinary.com/djooohujg/image/upload/v1760173134/mbzjjfkwfqspycqobysu.jpg",
      // },
      // {
      //   file_path:
      //     "https://res.cloudinary.com/djooohujg/image/upload/v1760173180/qzzc8sfpd4egzsr2bana.jpg",
      // },
    ],
  };
  let lang = "sy-en";
  return (
    <div className=" flex w-full bg-[#8d8d8d] items-center justify-center ">
      <div className="max-w-[1365px] flex-col flex gap-[20px] w-full  py-20">
        <FirstBoutique boutique={boutique} lang={lang} />
        <hr className="h-[4px] rounded-md bg-black" />
        <SecondBoutique boutique={boutique} lang={lang} />
        <hr className="h-[4px] rounded-md bg-black" />

        <ThirdBoutique boutique={boutique} lang={lang} />
        <hr className="h-[4px] rounded-md bg-black" />

        <FourthBoutique boutique={boutique} lang={lang} />
      </div>
    </div>
  );
}

export default Page;
const getConfiguredImage = ({ src, width, height, q }) => {
  return src.replace(
    "/upload",
    `/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0`
  );
};
const FirstBoutique = ({ boutique, lang }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white"
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
                  src={getConfiguredImage({
                    src: GetImageUrl(banner?.file_path),
                    q: 100,
                    height: 700,
                    width: 1365,
                  })}
                  width={400}
                  height={250}
                  className="h-auto w-full object-center object-cover  max-w-full max-h-[75vh] "
                />
              </div>
            ))}
          </div>
          <div className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex">
            <span className="bold text-[16px] uppercase text-white">
              {boutique?.name}
            </span>
            <span
              className="regular text-[16px] text-white"
              dangerouslySetInnerHTML={{
                __html: boutique?.description,
              }}
            ></span>
          </div>
        </div>
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique.childCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
};

const SecondBoutique = ({ boutique, lang }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white"
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
        <div
          className="w-full flex justify-center items-center overflow-hidden min-h-[20vh]  relative"
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
                  src={getConfiguredImage({
                    src: GetImageUrl(banner?.file_path),
                    q: 100,
                    height: 700,
                    width: 1365,
                  })}
                  width={400}
                  height={250}
                  className="h-auto w-full object-center object-cover  max-w-full"
                />
              </div>
            ))}
          </div>
          <div className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex">
            <span className="bold text-[16px] uppercase text-white">
              {boutique?.name}
            </span>
            <span
              className="regular text-[16px] text-white"
              dangerouslySetInnerHTML={{
                __html: boutique?.description,
              }}
            ></span>
          </div>
        </div>
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique.childCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
};

const ThirdBoutique = ({ boutique, lang }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);
  const configureImage = (src) => {
    return src.replace(
      "/upload",
      `/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0`
    );
  };
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white"
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
                  src={configureImage(banner?.file_path ?? banner)}
                  width={400}
                  height={250}
                  className="h-auto w-full object-center object-cover  max-w-full max-h-[75vh] "
                />
              </div>
            ))}
          </div>
          <div className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex">
            <span className="bold text-[16px] uppercase text-white">
              {boutique?.name}
            </span>
            <span
              className="regular text-[16px] text-white"
              dangerouslySetInnerHTML={{
                __html: boutique?.description,
              }}
            ></span>
          </div>
        </div>
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique.childCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
};

const FourthBoutique = ({ boutique, lang }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);
  const configureImage = (src) => {
    return src.replace(
      "/upload",
      `/upload/w_1365,c_fill,h_585/f_auto/q_auto:best/fl_lossy/so_0`
    );
  };
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white"
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
                  src={configureImage(banner?.file_path)}
                  width={400}
                  height={250}
                  className="h-auto w-full object-center object-contain  max-w-full max-h-[75vh] "
                />
              </div>
            ))}
          </div>
          <div className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex">
            <span className="bold text-[16px] uppercase text-white">
              {boutique?.name}
            </span>
            <span
              className="regular text-[16px] text-white"
              dangerouslySetInnerHTML={{
                __html: boutique?.description,
              }}
            ></span>
          </div>
        </div>
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique.childCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
};
