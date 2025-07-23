"use client";
import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { getCookie } from "utils/cookies/cookie-manager";

function ProductBackButton() {
  const lastPage = getCookie("last-page");
  const { lang } = useParams();
  return (
    <div className="back-bar align-center w-100 flex-row">
      <NextLink
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
        href={`${lastPage || `/${lang}`}`}
        data={
          (lastPage || `/${lang}`) === `/${lang}`
            ? { is_full_home: true }
            : {
                is_boutique: true,
              }
        }
      >
        <BackIcon />
      </NextLink>
    </div>
  );
}

export default ProductBackButton;
