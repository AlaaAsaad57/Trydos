"use client";
import Link from "next/link";
import React, { ComponentProps } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { useAppStore } from "store";

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
  const {
    setEnableSearch,
    setFilterEnabled,
    setActiveRoute,
    setSelectedOrderItem,
    setActivePacks,
    setOrderDetails,
    setIsNavigating,
    isNavigating,
  } = useAppStore();
  const handleClick = (e) => {
    if (!data) {
      onClick?.(e);
      return;
    }
    setIsNavigating(true);
    if (props["data-cy"] === "category-Link") {
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.CATEGORY_LINK,
      // });
    } else if (props["data-cy"] === "boutique_link") {
      // Sendevent({
      //   event: GA_EVENT_NAMES.CLICK,
      //   value: GA_CLICK_EVENT_VALUES.BOUTIQUE_LINK,
      // });
    } else if (props["data-cy"] === "product_link") {
      setActiveRoute(window.location.pathname);
      // if (data.is_redeem) {
      //   let redems = getCookie<any>("redemed_ids");
      //   if (redems?.find((s) => s.id === data.product_id)) {
      //     let now = new Date().getTime();
      //     let showingDate = new Date(
      //       redems?.find((s) => s.id === data.product_id)?.showingDate
      //     ).getTime();
      //     if (now - showingDate < 30000) {
      //       console.warn(
      //         "time is less than 30 s between viewing and click so show"
      //       );
      //       setCookie(
      //         "redemed_ids",
      //         redems?.filter((s) => s.id !== data.product_id)
      //       );
      //     }
      //   }
      // }
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
    }

    if (data?.is_home || data?.is_full_home) {
      document.documentElement.style.overflow = "auto";
      setEnableSearch(false);
      setFilterEnabled(false);
      setSelectedOrderItem(null);
      setActivePacks(null);
      setOrderDetails(null);
      dispatchRouteChangeEvent("completed");
      if (
        window.location.pathname === "/" ||
        window.location.href.split("/").length < 3
      ) {
        dispatchRouteChangeEvent("completed");
      }
      // if (
      //   window.location.pathname !== "/" ||
      //   window.location.href.split("/").length > 2
      // ) {
      //   window.location.href = data?.href;
      // }
      return;
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
