"use client";

import { useRouter } from "next/navigation";
import NextLink from "components/global/NextLink";
import { useIsModalRoute } from "components/ModalRoute/ModalRouteContext";

interface FilterListingBackButtonProps {
  lang: string;
  isRtl?: boolean;
}

export default function FilterListingBackButton({
  lang,
  isRtl = false,
}: FilterListingBackButtonProps) {
  const router = useRouter();
  const isModal = useIsModalRoute();

  if (isModal) {
    return (
      <button
        type="button"
        data-pw="BackIcon_boutique"
        onClick={() => router.back()}
        className="back-icon flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        aria-label="Back"
      >
        <img
          src="/icons/backIcon.svg"
          data-pw="back_icon_boutique_page"
          alt=""
          className={isRtl ? "rotate-180" : ""}
        />
      </button>
    );
  }

  return (
    <NextLink
      data-pw="BackIcon_boutique"
      ignoreConditionCase={true}
      data={{ is_full_home: true }}
      href={`/${lang}`}
      ariaLabel={`TryDos Home ${lang}`}
      className="back-icon"
    >
      <img
        src="/icons/backIcon.svg"
        data-pw="back_icon_boutique_page"
        alt=""
        className={isRtl ? "rotate-180" : ""}
      />
    </NextLink>
  );
}
