"use client";
import React, { useCallback } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import { useRouter } from "next/navigation";
import { useAppStore } from "store";
import { dispatchRouteChangeEvent } from "utils/events";
import { getCookie } from "utils/cookies/cookie-manager";
import NextLink from "components/global/NextLink";
function ProductBackButton({ lang, productId }) {
  const router = useRouter();
  const { activeRoute } = useAppStore();
  const getHref = useCallback(() => {
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
  }, []);
  return (
    <div className="back-bar align-center w-100 flex-row">
      <NextLink
        data-cy="backIcon_productPage"
        {...getHref()}
        className={`back-icon flex-row`}
        onClick={() => {
          localStorage.removeItem("last-page");
        }}
      >
        <BackIcon />
      </NextLink>
    </div>
  );
}

export default ProductBackButton;
