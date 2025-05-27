"use client";
import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";

function ProductBackButton() {
  const { lang } = useParams();
  if (
    typeof window !== "undefined" &&
    !document.referrer.includes(window.location.origin)
  )
    return (
      <div className="back-bar align-center w-100 flex-row">
        <NextLink
          data-cy="backIcon_productPage"
          className={`back-icon flex-row`}
          href={`/${lang}`}
          data={{ is_full_home: true }}
        >
          <BackIcon />
        </NextLink>
      </div>
    );
  return (
    <div className="back-bar align-center w-100 flex-row">
      <div
        onClick={() => {
          window.history.back();
        }}
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
      >
        <BackIcon />
      </div>
    </div>
  );
}

export default ProductBackButton;
