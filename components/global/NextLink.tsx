"use client";
import Link from "next/link";
import React, { ComponentProps } from "react";
import { useAppStore } from "store";
import { GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { DisableScroll } from "utils/tinyUtils";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  ariaLabel?: string;
  data?: any;
  exportparts?: string;
  ignoreConditionCase?: boolean;
}
export default function NextLink({
  href,
  className,
  children,
  onClick,
  ariaLabel,
  style,
  exportparts,
  data,
  ignoreConditionCase = false,
  ...props
}: INextLinkProps) {
  if (ignoreConditionCase) {
    return (
      <Link
        suppressHydrationWarning
        className={className}
        style={style}
        prefetch={true}
        href={href}
        data-cy={props["data-cy"] ?? ""}
        onClick={(e) => {
          onClick?.(e);
          if (data?.is_full_home) {
            const {
              setEnableSearch,
              setFilterEnabled,
              setSelectedOrderItem,
              setActivePacks,
              setOrderDetails,
              setIsNavigating,
            } = useAppStore.getState();
            setEnableSearch(false);
            setFilterEnabled(false);
            setSelectedOrderItem(null);
            setActivePacks(null);
            setOrderDetails(null);
            if (window.location.pathname === href) {
              setIsNavigating(null);
              return;
            }
          }
          if (data?.is_product) {
            let screen_name = "";
            let url = window.location.pathname;
            if (url.includes("filters/boutique")) {
              screen_name = GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
            } else if (url.includes("tags_names")) {
              screen_name = GA_GLOBAL_SCREEN.TAGS_SCREEN;
            } else if (url.includes("/filters")) {
              screen_name = GA_GLOBAL_SCREEN.FILTERS_SCREEN;
            } else {
              screen_name = GA_GLOBAL_SCREEN.HOME_SCREEN;
            }
            localStorage.setItem(
              "last-page",
              JSON.stringify({
                url:
                  window.location.pathname +
                  (window.location.search?.includes("cart")
                    ? ""
                    : window.location.search),
                productId: data.slug,
                screen: screen_name,
              })
            );
          }
          const { setIsNavigating } = useAppStore.getState();
          DisableScroll();

          setIsNavigating({ ...data, href });
        }}
        // onClick={(e) => {
        //   if (onClick) onClick(e);
        // }}
      >
        {children}
      </Link>
    );
  }
  if (isSamePage(href)) {
    return (
      <div
        suppressHydrationWarning
        className={className}
        style={style}
        data-cy={props["data-cy"] ?? ""}
        onClick={(e) => {
          // @ts-ignore
          onClick?.(e);
        }}
        // onClick={(e) => {
        //   if (onClick) onClick(e);
        // }}
      >
        {children}
      </div>
    );
  }
  return (
    <Link
      suppressHydrationWarning
      className={className}
      style={style}
      prefetch={true}
      href={href}
      data-cy={props["data-cy"] ?? ""}
      onClick={(e) => {
        onClick?.(e);
        if (data?.is_full_home) {
          const {
            setEnableSearch,
            setFilterEnabled,
            setSelectedOrderItem,
            setActivePacks,
            setOrderDetails,
            setIsNavigating,
          } = useAppStore.getState();
          setEnableSearch(false);
          setFilterEnabled(false);
          setSelectedOrderItem(null);
          setActivePacks(null);
          setOrderDetails(null);
          if (window.location.pathname === href) {
            setIsNavigating(null);
            return;
          }
        }
        if (data?.is_product) {
          let screen_name = "";
          let url = window.location.pathname;
          if (url.includes("filters/boutique")) {
            screen_name = GA_GLOBAL_SCREEN.BOUTIQUE_SCREEN;
          } else if (url.includes("tags_names")) {
            screen_name = GA_GLOBAL_SCREEN.TAGS_SCREEN;
          } else if (url.includes("/filters")) {
            screen_name = GA_GLOBAL_SCREEN.FILTERS_SCREEN;
          } else {
            screen_name = GA_GLOBAL_SCREEN.HOME_SCREEN;
          }
          localStorage.setItem(
            "last-page",
            JSON.stringify({
              url:
                window.location.pathname +
                (window.location.search?.includes("cart")
                  ? ""
                  : window.location.search),
              productId: data.slug,
              screen: screen_name,
            })
          );
        }
        const { setIsNavigating } = useAppStore.getState();
        DisableScroll();
        setIsNavigating({ ...data, href });
      }}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      {children}
    </Link>
  );
}
function isSamePage(pathname) {
  // In SSR: no window
  if (typeof window === "undefined") {
    return false;
  }

  // Normalize both current path and input
  const normalize = (path) => {
    let p = path.replace(/\/+$/, ""); // strip trailing slashes
    if (p === "") p = "/"; // root normalization
    return p;
  };
  const current = normalize(window.location.pathname + window.location.search);
  const target = normalize(pathname);

  return current === target;
}
