import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import { BoutiqueSliderWrapper } from "components/Home/OfferWidgets/BoutiqueElement";

import Image from "next/image";
import { configureImageForBoutique, GetImageUrl } from "utils/server";

function BoutiqueWrapper({ boutique, lang }) {
  return (
    <div
      className="flex flex-col h-auto w-full rounded-[2px] bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.15)]"
      id={`boutique-${boutique.slug}`}
    >
      <NextLink
        data={{
          is_boutique: true,
          name: boutique.name,
          banners: boutique.banners,
          icon: boutique.icon,
        }}
        ignoreConditionCase={true}
        data-cy="boutique_link"
        className="w-full"
        href={`/${lang}/filters/boutiques/${boutique.slug}`}
      >
        <BoutiqueSliderWrapper
          boutique={{
            name: boutique.name,
            description: boutique.description,
          }}
        >
          {boutique?.banners.map((banner, idx) => (
            <div
              key={idx}
              className="min-w-full flex justify-center items-center relative"
            >
              <div className="absolute w-full h-full top-0 left-0 z-10 shadow-[inset_0px_3px_6px_rgba(255,255,255,0.5)]" />
              <img
                alt={boutique.name}
                src={configureImageForBoutique(GetImageUrl(banner?.file_path))}
                data-cy="boutique-banner"
                width={1280}
                height={750}
                className="h-auto w-full object-center object-cover  max-w-full "
              />
            </div>
          ))}
        </BoutiqueSliderWrapper>
      </NextLink>
      <CategoriesSlider
        lang={lang}
        categories={boutique?.mainCategoriesForProductIds}
        boutique={boutique}
      />
    </div>
  );
}

export default BoutiqueWrapper;

const CategoriesSlider = ({ categories, boutique, lang }) => {
  const [country, language] = lang?.split("-");
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
                }
          }
          className="w-[90px] min-w-[90px] h-[90px] rounded-[15px] bg-white relative"
        >
          {category?.most_views && (
            <span className="absolute top-0 -right-1.5 z-[99]">
              <img src="/icons/TrendingViews.svg" className="w-[20px] " />
            </span>
          )}
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

          {category.most_viewed_product_thumbnail ? (
            <img
              alt={category?.most_viewed_product_name}
              src={GetImageUrl(category.most_viewed_product_thumbnail).replace(
                "/upload",
                `/upload/h_200,w_200,c_fit/f_auto/q_auto:good/fl_lossy/so_0`,
              )}
              width={300}
              className="rounded-[15px] w-[90px] h-[90px] object-contain object-center "
              height={300}
            />
          ) : (
            <></>
          )}
        </NextLink>
      ))}
    </HortiznalScrollBar>
  );
};
