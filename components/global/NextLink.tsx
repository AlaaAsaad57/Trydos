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
      dispatchRouteChangeEvent("start", {
        ...data,
      });
    }
  };
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      prefetch
      href={href}
      {...props}
      onClick={handleClick}
      // onClick={(e) => {
      //   if (onClick) onClick(e);
      // }}
    >
      <PrefetchLinkUtil href={href} label={ariaLabel} />

      <>{children}</>
    </Link>
  );
}
