"use client";
import BackIcon from "public/svg/listing/backIcon";
import NextLink from "components/global/NextLink";
import ProductCartHeader from "./ProductCartHeader";
function ProductBackButton({ lang, productId }) {
  const getHref = () => {
    if (typeof localStorage === "undefined")
      return {
        href: `/${lang}`,
        data: { is_full_home: true, href: `/${lang}` },
      };
    let lastPage = localStorage.getItem("last-page");
    let href = "",
      data = {};
    if (lastPage) {
      let lastPageData = JSON.parse(lastPage);
      href = lastPageData.url;
      if (
        href?.includes("/filters") ||
        href?.includes("/featured") ||
        href?.includes("/flashDeals")
      ) {
        data = { is_boutique: true, href };
      } else {
        data = { is_full_home: true, href };
      }
    } else {
      href = `/${lang}`;
      data = { is_full_home: true, href };
    }
    return { href, data };
  };

  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";

  if (typeof localStorage === "undefined")
    return (
      <div
        className="back-bar align-center w-100 flex-row h-[50px] justify-between"
        suppressHydrationWarning
      >
        <NextLink
          ignoreConditionCase={true}
          suppressHydrationWarning
          data-cy="backIcon_productPage"
          {...getHref()}
          className={`back-icon flex-row`}
          onClick={() => {
            localStorage.removeItem("last-page");
          }}
        >
          <BackIcon className={`${isRtl && "rotate-180"}`} />
        </NextLink>
        <ProductCartHeader language={language} />
      </div>
    );
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } back-bar align-center w-full  h-[50px] justify-between px-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.10)]`}
      suppressHydrationWarning
    >
      <NextLink
        ignoreConditionCase={true}
        data-cy="backIcon_productPage"
        suppressHydrationWarning
        {...getHref()}
        className={`back-icon flex-row`}
        onClick={() => {
          localStorage.removeItem("last-page");
        }}
      >
        <BackIcon className={`${isRtl && "rotate-180"}`} />
      </NextLink>
      <ProductCartHeader language={language} />
    </div>
  );
}

export default ProductBackButton;
