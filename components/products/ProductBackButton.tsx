"use client";
import React from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

function ProductBackButton() {
  const { activeRoute } = useAppStore();

  return (
    <div className="back-bar align-center w-100 flex-row">
      <NextLink
        data-cy="backIcon_productPage"
        className={`back-icon flex-row`}
        href={`${activeRoute}`}
        data={
          activeRoute === "/"
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
