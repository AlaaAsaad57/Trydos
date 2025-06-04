"use client";
import Link from "next/link";
import React, { ComponentProps } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { useAppStore } from "store";
import { GA_CLICK_EVENT_VALUES } from "utils/GAEvents";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { Sendevent } from "utils/functions";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  ariaLabel?: string;
  data?: any;
  exportparts?: string;
}
export default function NextLink({
  href,
  className,
  children,
  onClick,
  ariaLabel,
  exportparts,
  data,
  ...props
}: INextLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setEnableSearch, setFilterEnabled } = useAppStore();
  const handleClick = (e) => {
    if (props["data-cy"] === "category-Link") {
      Sendevent({
        event: GA_EVENT_NAMES.CLICK,
        value: GA_CLICK_EVENT_VALUES.CATEGORY_LINK,
      });
    } else if (props["data-cy"] === "boutique_link") {
      Sendevent({
        event: GA_EVENT_NAMES.CLICK,
        value: GA_CLICK_EVENT_VALUES.BOUTIQUE_LINK,
      });
    } else if (props["data-cy"] === "product_link") {
      Sendevent({
        event: GA_EVENT_NAMES.CLICK,
        value: GA_CLICK_EVENT_VALUES.CHOOSE_PRODUCT_BUTTON,
      });
    }
    onClick?.(e);
    // @ts-ignore
    if (e.target.closest(".no-navigate")) {
      return;
    }
    if (pathname !== href) {
      document.body.style.overflow = "hidden";
      document.body.scrollTop = 0;

      dispatchRouteChangeEvent("start", {
        ...data,
      });
      if (data.is_home || data.is_full_home) {
        setEnableSearch(false);
        setFilterEnabled(false);
      }
    }
  };
  const IsPrefetched = () => {
    return !(
      searchParams.get("changed-country") || searchParams.get("no-country")
    );
  };
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      prefetch={IsPrefetched()}
      href={IsPrefetched() ? href : "#"}
      {...props}
      onClick={handleClick}
      data-cy={props["data-cy"]}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      <>{children}</>
    </Link>
  );
}
