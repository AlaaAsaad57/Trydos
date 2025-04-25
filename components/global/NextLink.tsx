"use client";
import Link from "next/link";
import React, {
  ComponentProps,
  MouseEventHandler,
  TouchEventHandler,
} from "react";
import { usePathname } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { useAppStore } from "store";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  ariaLabel?: string;
  data?: any;
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
  const { setEnableSearch, setFilterEnabled } = useAppStore();
  const handleClick = (e) => {
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
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      prefetch={true}
      href={href}
      {...props}
      onClick={handleClick}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      <>{children}</>
    </Link>
  );
}
