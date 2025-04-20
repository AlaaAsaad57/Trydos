"use client";
import Link from "next/link";
import React, { ComponentProps, MouseEventHandler, Suspense } from "react";
import PrefetchLinkUtil from "./PrefetchLinkUtil";
import { usePathname } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";

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
  data,
  ...props
}: INextLinkProps) {
  const pathname = usePathname();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClick?.(e);

    if (pathname !== href) {
      document.body.style.cursor = "progress";
      document.body.style.overflow = "hidden";
      document.body.scrollTop = 0;
      dispatchRouteChangeEvent("start", {
        ...data,
      });
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
