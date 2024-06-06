"use client";

// eslint-disable-next-line no-restricted-imports
import Link from "next/link";
import React, { ComponentProps, MouseEventHandler } from "react";
import { UrlObject } from "url";
import { dispatchRouteChangeEvent } from "./events";
import { usePathname } from "next/navigation";

export interface INextLinkProps
  extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string | UrlObject;
}
export default function NextLink({
  href,
  className,
  children,
  onClick,
  ...props
}: INextLinkProps) {
  const pathname = usePathname();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClick?.(e);
    if (pathname !== href) {
      dispatchRouteChangeEvent("start");
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
    }
  };

  return (
    <Link
      prefetch={false}
      className={className}
      href={href}
      {...props}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
